import json
import random
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from ..database.connection import get_db
from ..database.models import Customer, Loan, Prediction, User, AuditLog
from ..schemas.schemas import PredictionRequest, PredictionResponse
from ..ml.predictor import predictor
from ..auth.dependencies import get_current_user, RoleChecker

router = APIRouter(prefix="/api/predict", tags=["predictions"])

allow_read = RoleChecker(["Admin", "Manager", "Analyst", "Viewer"])
allow_write = RoleChecker(["Admin", "Manager", "Analyst"])

@router.post("", response_model=PredictionResponse)
def run_prediction(
    req: PredictionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_write)
):
    if not predictor.is_ready:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Machine learning model is not loaded. Please train the model."
        )

    # 1. Fetch Customer
    customer = db.query(Customer).filter(Customer.id == req.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    # 2. Package data for ML
    customer_data = {
        "age": customer.age,
        "gender": customer.gender,
        "annual_income": customer.annual_income,
        "employment_type": customer.employment_type,
        "job_experience": customer.job_experience,
        "education": customer.education,
        "home_ownership": customer.home_ownership,
        "marital_status": customer.marital_status
    }

    loan_data = {
        "loan_amount": req.loan_amount,
        "loan_term": req.loan_term,
        "credit_score": req.credit_score,
        "existing_loans": req.existing_loans,
        "number_of_dependents": req.number_of_dependents,
        "loan_purpose": req.loan_purpose,
        "previous_defaults": req.previous_defaults,
        "savings_balance": req.savings_balance,
        "current_balance": req.current_balance
    }

    # 3. Call Predictor
    try:
        pred_res = predictor.predict_risk(customer_data, loan_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error executing prediction: {e}")

    # 4. Search for Similar Historical Customers in SQLite DB
    # We query for loans with similar credit score (+/- 60), income (+/- 30%), and age (+/- 6 years)
    similar_loans = db.query(Loan).join(Customer).filter(
        Customer.id != req.customer_id,
        Loan.credit_score.between(req.credit_score - 60, req.credit_score + 60),
        Customer.annual_income.between(customer.annual_income * 0.70, customer.annual_income * 1.30),
        Customer.age.between(customer.age - 6, customer.age + 6)
    ).limit(3).all()
    
    similar_cases = []
    for sl in similar_loans:
        similar_cases.append({
            "id": sl.id,
            "name": f"{sl.customer.first_name} {sl.customer.last_name}",
            "credit_score": sl.credit_score,
            "loan_amount": sl.loan_amount,
            "income": sl.customer.annual_income,
            "age": sl.customer.age,
            "status": sl.status
        })

    # 5. Formulate Recommended Underwriter Actions
    recommendations = []
    risk_prob = pred_res["risk_probability"]
    
    if risk_prob < 0.30:
        recommendations.append("Apply preferred corporate interest rate discount (e.g., -0.25% or -0.5%).")
        recommendations.append("Fast-track document verification process for immediate disbursement.")
        recommendations.append("Cross-sell supplementary high-yield savings or investment packages.")
    else:
        # High or Medium risk mitigations
        if req.credit_score < 650:
            recommendations.append("Require a credit co-signer or guarantor with prime credit score (> 720).")
            recommendations.append("Offer a secured loan alternative requiring automobile lien or asset deposit.")
        if pred_res["explanation"]["calculated_dti"] > 0.40:
            reduced_amount = round(req.loan_amount * 0.80, -3)
            recommendations.append(f"Recommend lowering maximum loan amount to ${reduced_amount:,.0f} to improve DTI ratio below 35%.")
            recommendations.append("Request secondary income proof verification (such as investments, rental, or spouse tax returns).")
        if req.savings_balance < 3000:
            recommendations.append("Require setting up a blocked auto-draft repayment account holding 2 months of EMI reserves.")
        if req.previous_defaults > 0:
            recommendations.append("Restrict loan maturity term to a maximum of 24 months to limit time-exposure.")
            recommendations.append("Escalate file for manual secondary credit committee supervisory approval.")
            
        if len(recommendations) < 2:
            recommendations.append("Request latest 6 months checking account transactions history statements.")
            recommendations.append("Conduct an audit review of employment history and verification calls.")

    # Save details inside explanation JSON
    pred_res["explanation"]["similar_customers"] = similar_cases
    pred_res["explanation"]["recommended_actions"] = recommendations

    # 6. Automatic status determination
    status_map = {
        "Low": "Approved",
        "Medium": "Pending",
        "High": "Rejected"
    }
    determined_status = status_map.get(pred_res["risk_rating"], "Pending")

    # 7. Save Loan
    new_loan = Loan(
        customer_id=req.customer_id,
        loan_amount=req.loan_amount,
        loan_term=req.loan_term,
        credit_score=req.credit_score,
        existing_loans=req.existing_loans,
        debt_to_income_ratio=pred_res["explanation"]["calculated_dti"],
        number_of_dependents=req.number_of_dependents,
        loan_purpose=req.loan_purpose,
        previous_defaults=req.previous_defaults,
        savings_balance=req.savings_balance,
        current_balance=req.current_balance,
        emi=pred_res["explanation"]["calculated_emi"],
        status=determined_status
    )
    db.add(new_loan)
    db.commit()
    db.refresh(new_loan)

    # 8. Save Prediction
    new_prediction = Prediction(
        customer_id=req.customer_id,
        loan_id=new_loan.id,
        risk_probability=pred_res["risk_probability"],
        risk_rating=pred_res["risk_rating"],
        confidence_score=pred_res["confidence_score"],
        explanation_json=json.dumps(pred_res["explanation"]),
        created_by_id=current_user.id
    )
    db.add(new_prediction)
    db.commit()
    db.refresh(new_prediction)

    # 9. Audit Logging
    log = AuditLog(
        user_id=current_user.id,
        action="Run Prediction",
        details=f"Evaluated loan risk for customer ID: {req.customer_id}. Rating: {pred_res['risk_rating']}, Probability: {pred_res['risk_probability']*100:.1f}%. Action recommendations generated."
    )
    db.add(log)
    db.commit()

    res_dict = {
        "id": new_prediction.id,
        "customer_id": new_prediction.customer_id,
        "loan_id": new_prediction.loan_id,
        "risk_probability": new_prediction.risk_probability,
        "risk_rating": new_prediction.risk_rating,
        "confidence_score": new_prediction.confidence_score,
        "explanation": pred_res["explanation"],
        "created_at": new_prediction.created_at,
        "customer": customer
    }
    
    return res_dict

@router.get("/history", response_model=dict)
def get_prediction_history(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_read)
):
    query = db.query(Prediction).order_by(desc(Prediction.created_at))
    total_count = query.count()
    
    offset = (page - 1) * limit
    predictions = query.offset(offset).limit(limit).all()
    
    items = []
    for p in predictions:
        items.append({
            "id": p.id,
            "customer_id": p.customer_id,
            "loan_id": p.loan_id,
            "risk_probability": p.risk_probability,
            "risk_rating": p.risk_rating,
            "confidence_score": p.confidence_score,
            "explanation": json.loads(p.explanation_json),
            "created_at": p.created_at,
            "customer": p.customer
        })
        
    return {
        "items": items,
        "total": total_count,
        "page": page,
        "limit": limit,
        "pages": (total_count + limit - 1) // limit
    }
