import pandas as pd
import numpy as np
import os

def generate_loan_dataset(num_samples=5000, random_seed=42):
    np.random.seed(random_seed)
    
    # 1. Base Demographic Features
    age = np.random.randint(21, 70, size=num_samples)
    gender = np.random.choice(['Male', 'Female'], size=num_samples, p=[0.5, 0.5])
    education = np.random.choice(
        ['High School', 'Bachelor', 'Master', 'PhD'], 
        size=num_samples, 
        p=[0.3, 0.5, 0.15, 0.05]
    )
    marital_status = np.random.choice(
        ['Single', 'Married', 'Divorced'], 
        size=num_samples, 
        p=[0.4, 0.45, 0.15]
    )
    dependents = np.random.choice([0, 1, 2, 3, 4], size=num_samples, p=[0.4, 0.25, 0.2, 0.1, 0.05])
    
    # 2. Employment & Income
    # Employment type distribution
    employment_type = np.random.choice(
        ['Salaried', 'Self-Employed', 'Unemployed', 'Student'], 
        size=num_samples, 
        p=[0.65, 0.20, 0.10, 0.05]
    )
    
    # Experience (correlated with age, 0 if Student/Unemployed)
    job_experience = []
    for i in range(num_samples):
        if employment_type[i] in ['Student', 'Unemployed']:
            job_experience.append(0)
        else:
            max_exp = max(0, age[i] - 21)
            job_experience.append(np.random.randint(0, max_exp + 1) if max_exp > 0 else 0)
    job_experience = np.array(job_experience)
    
    # Income (correlated with age, experience, education, and employment)
    annual_income = []
    for i in range(num_samples):
        if employment_type[i] == 'Student':
            base = np.random.uniform(5000, 15000)
        elif employment_type[i] == 'Unemployed':
            base = np.random.uniform(2000, 12000)
        else:
            edu_mult = {'High School': 1.0, 'Bachelor': 1.5, 'Master': 2.0, 'PhD': 2.5}
            exp_mult = 1.0 + (job_experience[i] * 0.04)
            base = np.random.uniform(25000, 75000) * edu_mult[education[i]] * exp_mult
        annual_income.append(round(base, 2))
    annual_income = np.array(annual_income)
    monthly_income = np.round(annual_income / 12, 2)
    
    # 3. Financial Health
    home_ownership = np.random.choice(
        ['Rent', 'Mortgage', 'Own'], 
        size=num_samples, 
        p=[0.45, 0.40, 0.15]
    )
    
    # Savings Balance (correlated with income)
    savings_balance = np.round(
        np.maximum(0, annual_income * np.random.uniform(-0.1, 0.5, size=num_samples) + np.random.normal(5000, 2000, size=num_samples)), 
        2
    )
    
    # Current Balance (correlated with savings)
    current_balance = np.round(
        np.maximum(0, savings_balance * np.random.uniform(0.1, 0.6, size=num_samples) + np.random.normal(2000, 1000, size=num_samples)), 
        2
    )
    
    # Credit Score (highly influenced by employment, history, and a bit of age)
    credit_score = []
    for i in range(num_samples):
        base = 650
        if employment_type[i] == 'Unemployed':
            base -= 60
        elif employment_type[i] == 'Salaried':
            base += 30
            
        # Age effect
        base += int((age[i] - 35) * 1.5)
        
        # Add random noise
        score = int(np.random.normal(base, 60))
        credit_score.append(max(300, min(850, score)))
    credit_score = np.array(credit_score)
    
    # Previous Defaults (correlated with lower credit score)
    previous_defaults = []
    for i in range(num_samples):
        if credit_score[i] < 550:
            previous_defaults.append(np.random.choice([0, 1, 2], p=[0.4, 0.4, 0.2]))
        elif credit_score[i] < 680:
            previous_defaults.append(np.random.choice([0, 1], p=[0.85, 0.15]))
        else:
            previous_defaults.append(np.random.choice([0, 1], p=[0.97, 0.03]))
    previous_defaults = np.array(previous_defaults)
    
    # Existing Loans
    existing_loans = np.random.choice([0, 1, 2, 3, 4], size=num_samples, p=[0.5, 0.3, 0.13, 0.05, 0.02])
    
    # 4. Loan Specifics
    loan_purpose = np.random.choice(
        ['Home', 'Auto', 'Education', 'Personal', 'Business'], 
        size=num_samples, 
        p=[0.3, 0.25, 0.2, 0.15, 0.1]
    )
    
    # Loan Amount (correlated with income and purpose)
    loan_amount = []
    for i in range(num_samples):
        if loan_purpose[i] == 'Home':
            mult = np.random.uniform(1.5, 4.0)
        elif loan_purpose[i] == 'Business':
            mult = np.random.uniform(0.5, 2.0)
        else:
            mult = np.random.uniform(0.1, 0.8)
        
        # Cap based on monthly income
        val = monthly_income[i] * 12 * mult
        loan_amount.append(max(2000, round(np.random.normal(val, val * 0.15), 2)))
    loan_amount = np.array(loan_amount)
    
    # Loan Term
    loan_term = np.random.choice([12, 24, 36, 48, 60], size=num_samples, p=[0.15, 0.25, 0.3, 0.2, 0.1])
    
    # EMI calculation (approximate interest rate based on credit score)
    # Lower credit score = higher interest rate
    emi = []
    for i in range(num_samples):
        if credit_score[i] > 750:
            r = 0.06  # 6% annual
        elif credit_score[i] > 670:
            r = 0.09  # 9%
        elif credit_score[i] > 580:
            r = 0.13  # 13%
        else:
            r = 0.18  # 18%
        
        monthly_rate = r / 12
        n = loan_term[i]
        p = loan_amount[i]
        
        # Standard EMI formula
        val = p * monthly_rate * ((1 + monthly_rate)**n) / (((1 + monthly_rate)**n) - 1)
        emi.append(round(val, 2))
    emi = np.array(emi)
    
    # Debt To Income Ratio (DTI)
    # DTI = (EMI + existing debts) / Monthly Income
    dti = []
    for i in range(num_samples):
        existing_payment = existing_loans[i] * np.random.uniform(100, 400)
        total_monthly_debt = emi[i] + existing_payment
        val = total_monthly_debt / max(500, monthly_income[i])
        dti.append(round(min(1.5, val), 4))
    dti = np.array(dti)
    
    # 5. Risk Scoring & Default Label Generation
    # Create a logical risk score formulation to dictate defaults
    risk_score = np.zeros(num_samples)
    
    # DTI penalty: DTI > 0.45 increases risk
    risk_score += np.where(dti > 0.45, (dti - 0.45) * 3.0, 0)
    risk_score += np.where(dti > 0.6, 1.5, 0)
    
    # Credit Score penalty
    risk_score += np.where(credit_score < 580, 2.5, 0)
    risk_score += np.where((credit_score >= 580) & (credit_score < 660), 1.2, 0)
    risk_score += np.where(credit_score > 750, -1.5, 0)
    
    # Previous Defaults
    risk_score += previous_defaults * 2.0
    
    # Income & Savings
    risk_score += np.where(savings_balance < 2000, 1.0, 0)
    risk_score += np.where(savings_balance > 30000, -1.0, 0)
    risk_score += np.where(annual_income < 30000, 0.8, 0)
    
    # Employment Type
    risk_score += np.where(employment_type == 'Unemployed', 2.0, 0)
    risk_score += np.where(employment_type == 'Student', 1.0, 0)
    risk_score += np.where(employment_type == 'Salaried', -0.5, 0)
    
    # Loan Amount vs Income ratio
    ratio = loan_amount / annual_income
    risk_score += np.where(ratio > 3.0, (ratio - 3.0) * 0.8, 0)
    
    # Add random variations
    risk_score += np.random.normal(0, 0.8, size=num_samples)
    
    # Set default threshold (aiming for ~15% to 18% default rate)
    threshold = np.percentile(risk_score, 83)
    loan_default = np.where(risk_score >= threshold, 1, 0)
    
    df = pd.DataFrame({
        'Age': age,
        'Gender': gender,
        'Annual Income': annual_income,
        'Monthly Income': monthly_income,
        'Employment Type': employment_type,
        'Job Experience': job_experience,
        'Loan Amount': loan_amount,
        'Loan Term': loan_term,
        'Credit Score': credit_score,
        'Existing Loans': existing_loans,
        'Debt To Income Ratio': dti,
        'Number of Dependents': dependents,
        'Education': education,
        'Home Ownership': home_ownership,
        'Marital Status': marital_status,
        'Loan Purpose': loan_purpose,
        'Previous Defaults': previous_defaults,
        'Savings Balance': savings_balance,
        'Current Balance': current_balance,
        'EMI': emi,
        'Loan Default': loan_default
    })
    
    return df

if __name__ == '__main__':
    os.makedirs('/Users/jaskiratsingh/.gemini/antigravity/scratch/loan_default_prediction_system/data', exist_ok=True)
    df = generate_loan_dataset(num_samples=6000)
    csv_path = '/Users/jaskiratsingh/.gemini/antigravity/scratch/loan_default_prediction_system/data/loan_data.csv'
    df.to_csv(csv_path, index=False)
    print(f"Generated realistic loan dataset with {len(df)} records at {csv_path}")
    print(f"Default rate: {df['Loan Default'].mean() * 100:.2f}%")
