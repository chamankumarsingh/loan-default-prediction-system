import os
import json
import joblib
import pandas as pd
import numpy as np
from typing import Dict, Any, Tuple

from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[3]
MODEL_DIR = BASE_DIR / "model"
PIPELINE_PATH = MODEL_DIR / "loan_model_pipeline.joblib"
METADATA_PATH = MODEL_DIR / "model_metadata.json"
class LoanPredictor:
    def __init__(self):
        self.pipeline = None
        self.metadata = None
        self.load_model()

    def load_model(self):
        if os.path.exists(PIPELINE_PATH) and os.path.exists(METADATA_PATH):
            try:
                self.pipeline = joblib.load(PIPELINE_PATH)
                with open(METADATA_PATH, 'r') as f:
                    self.metadata = json.load(f)
                print("ML Model pipeline and metadata loaded successfully.")
            except Exception as e:
                print(f"Error loading ML model: {e}")
        else:
            print("ML Model or Metadata not found. Model needs to be trained.")

    @property
    def is_ready(self) -> bool:
        return self.pipeline is not None and self.metadata is not None

    def calculate_emi_and_dti(self, loan_amount: float, loan_term: int, credit_score: int, 
                              annual_income: float, existing_loans: int) -> Tuple[float, float]:
        # Interest rate calculation based on credit score
        if credit_score > 750:
            r = 0.06
        elif credit_score > 670:
            r = 0.09
        elif credit_score > 580:
            r = 0.13
        else:
            r = 0.18

        monthly_rate = r / 12
        n = loan_term
        p = loan_amount

        # Calculate EMI
        if monthly_rate > 0:
            emi = p * monthly_rate * ((1 + monthly_rate)**n) / (((1 + monthly_rate)**n) - 1)
        else:
            emi = p / n
        emi = round(emi, 2)

        # Calculate DTI
        monthly_income = annual_income / 12
        existing_payment = existing_loans * 250.0  # Assumed average payment per existing loan
        total_monthly_debt = emi + existing_payment
        dti = total_monthly_debt / max(500, monthly_income)
        
        return emi, round(min(1.5, dti), 4)

    def predict_risk(self, customer_data: Dict[str, Any], loan_data: Dict[str, Any]) -> Dict[str, Any]:
        if not self.is_ready:
            raise ValueError("ML Predictor is not initialized. Please train the model first.")

        # Compute monthly income, EMI, and DTI
        annual_income = customer_data['annual_income']
        monthly_income = round(annual_income / 12, 2)
        
        emi, dti = self.calculate_emi_and_dti(
            loan_amount=loan_data['loan_amount'],
            loan_term=loan_data['loan_term'],
            credit_score=loan_data['credit_score'],
            annual_income=annual_income,
            existing_loans=loan_data['existing_loans']
        )

        # Build full input feature dict
        input_features = {
            'Age': customer_data['age'],
            'Gender': customer_data['gender'],
            'Annual Income': annual_income,
            'Monthly Income': monthly_income,
            'Employment Type': customer_data['employment_type'],
            'Job Experience': customer_data['job_experience'],
            'Loan Amount': loan_data['loan_amount'],
            'Loan Term': loan_data['loan_term'],
            'Credit Score': loan_data['credit_score'],
            'Existing Loans': loan_data['existing_loans'],
            'Debt To Income Ratio': dti,
            'Number of Dependents': loan_data['number_of_dependents'],
            'Education': customer_data['education'],
            'Home Ownership': customer_data['home_ownership'],
            'Marital Status': customer_data['marital_status'],
            'Loan Purpose': loan_data['loan_purpose'],
            'Previous Defaults': loan_data['previous_defaults'],
            'Savings Balance': loan_data['savings_balance'],
            'Current Balance': loan_data['current_balance'],
            'EMI': emi
        }

        # Convert to DataFrame
        df_input = pd.DataFrame([input_features])

        # Get base prediction probability
        prob = self.pipeline.predict_proba(df_input)[0, 1]
        
        # Risk Rating
        if prob < 0.30:
            risk_rating = "Low"
        elif prob < 0.60:
            risk_rating = "Medium"
        else:
            risk_rating = "High"

        # Confidence Score
        confidence = prob if prob >= 0.5 else (1 - prob)
        
        # Calculate local attributions (SHAP-like explanations)
        # Using perturbation method against the training dataset baselines
        baselines = self.metadata['baselines']
        attributions = {}
        
        for feature, val in input_features.items():
            # Create copy and perturb feature
            df_perturbed = df_input.copy()
            df_perturbed.at[0, feature] = baselines[feature]
            
            # Predict probability with baseline value
            prob_perturbed = self.pipeline.predict_proba(df_perturbed)[0, 1]
            
            # Change in probability (Actual - Perturbed)
            # Positive value means the actual feature increased risk compared to the median baseline
            change = prob - prob_perturbed
            
            # Round value to avoid float noise
            attributions[feature] = round(change, 4)

        # Sort features by attribution impact
        positive_factors = []
        negative_factors = []
        
        for k, v in attributions.items():
            # Describe the reasoning in a user-friendly way
            val_actual = input_features[k]
            val_base = baselines[k]
            
            # Only report significant factors (impact > 1%)
            if abs(v) >= 0.01:
                # Build helpful display labels
                if k == 'Credit Score':
                    desc = f"Credit Score of {val_actual} (vs median {int(val_base)})"
                elif k == 'Debt To Income Ratio':
                    desc = f"Debt-to-Income ratio of {val_actual*100:.1f}% (vs median {val_base*100:.1f}%)"
                elif k == 'Loan Amount':
                    desc = f"Loan Amount of ${val_actual:,.0f} (vs median ${val_base:,.0f})"
                elif k == 'Savings Balance':
                    desc = f"Savings Balance of ${val_actual:,.0f} (vs median ${val_base:,.0f})"
                elif k == 'Previous Defaults':
                    desc = f"Previous Defaults of {val_actual} (vs median {int(val_base)})"
                elif k == 'Employment Type':
                    desc = f"Employment Status: {val_actual}"
                elif k == 'Annual Income':
                    desc = f"Annual Income of ${val_actual:,.0f}"
                else:
                    desc = f"{k}: {val_actual}"

                factor_data = {
                    "feature": k,
                    "impact": float(v),
                    "description": desc
                }
                
                if v > 0:
                    positive_factors.append(factor_data)
                else:
                    negative_factors.append(factor_data)

        # Sort lists
        positive_factors = sorted(positive_factors, key=lambda x: x['impact'], reverse=True)
        negative_factors = sorted(negative_factors, key=lambda x: x['impact'])  # most negative first
        
        # Calculate loan eligibility score (0-100) based on credit score, DTI, savings and risk
        # Lower risk probability = higher eligibility
        eligibility_score = round((1 - prob) * 100, 1)

        explanation = {
            "attributions": attributions,
            "risk_increasers": positive_factors[:4],
            "risk_reducers": negative_factors[:4],
            "eligibility_score": eligibility_score,
            "calculated_emi": emi,
            "calculated_dti": dti
        }

        return {
            "risk_probability": round(float(prob), 4),
            "risk_rating": risk_rating,
            "confidence_score": round(float(confidence), 4),
            "explanation": explanation
        }

predictor = LoanPredictor()
