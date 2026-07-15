from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from ..database.models import Customer, Loan, Prediction
from datetime import datetime, timedelta
import pandas as pd
import numpy as np

def get_dashboard_statistics(
    db: Session, 
    start_date: datetime = None, 
    end_date: datetime = None, 
    purpose: str = None, 
    employment_type: str = None
):
    # Base queries
    loan_query = db.query(Loan).join(Customer)
    customer_query = db.query(Customer)
    
    # 1. Apply filters
    if start_date:
        loan_query = loan_query.filter(Loan.created_at >= start_date)
    if end_date:
        loan_query = loan_query.filter(Loan.created_at <= end_date)
    if purpose:
        loan_query = loan_query.filter(Loan.loan_purpose == purpose)
    if employment_type:
        loan_query = loan_query.filter(Customer.employment_type == employment_type)
        customer_query = customer_query.filter(Customer.employment_type == employment_type)
        
    # Execute basic metrics
    total_customers = customer_query.count()
    total_loans = loan_query.count()
    active_loans = loan_query.filter(Loan.status.in_(["Approved", "Pending"])).count()
    
    defaulted_loans = loan_query.filter(Loan.status == "Defaulted").count()
    default_rate = round((defaulted_loans / total_loans * 100), 2) if total_loans > 0 else 0.0
    
    avg_credit_score_res = loan_query.with_entities(func.avg(Loan.credit_score)).scalar()
    avg_credit_score = round(avg_credit_score_res, 0) if avg_credit_score_res else 0.0
    
    total_loan_amount_res = loan_query.with_entities(func.sum(Loan.loan_amount)).scalar()
    total_loan_amount = round(total_loan_amount_res, 2) if total_loan_amount_res else 0.0
    
    # 2. Loan Purpose Distribution
    purpose_data = []
    purpose_query = loan_query.with_entities(Loan.loan_purpose, func.count(Loan.id)).group_by(Loan.loan_purpose).all()
    for p_name, count in purpose_query:
        purpose_data.append({"name": p_name, "value": count})
        
    # 3. Employment Type Distribution
    employment_data = []
    employment_query = loan_query.with_entities(Customer.employment_type, func.count(Customer.id)).group_by(Customer.employment_type).all()
    for emp_type, count in employment_query:
        employment_data.append({"name": emp_type, "value": count})

    # 4. Risk Categories Distribution (Join on Prediction)
    risk_data = {"Low": 0, "Medium": 0, "High": 0}
    risk_query = db.query(Prediction.risk_rating, func.count(Prediction.id))\
        .join(Loan, Prediction.loan_id == Loan.id)\
        .join(Customer, Loan.customer_id == Customer.id)
        
    if start_date:
        risk_query = risk_query.filter(Loan.created_at >= start_date)
    if end_date:
        risk_query = risk_query.filter(Loan.created_at <= end_date)
    if purpose:
        risk_query = risk_query.filter(Loan.loan_purpose == purpose)
    if employment_type:
        risk_query = risk_query.filter(Customer.employment_type == employment_type)
        
    risk_results = risk_query.group_by(Prediction.risk_rating).all()
    for rating, count in risk_results:
        if rating in risk_data:
            risk_data[rating] = count
    risk_distribution = [{"name": k, "value": v} for k, v in risk_data.items()]

    # Fetch rows into memory for advanced distribution calculations
    loans_rows = loan_query.with_entities(
        Loan.loan_amount, Loan.credit_score, Loan.created_at, Loan.status, Loan.debt_to_income_ratio, Customer.age
    ).all()
    
    monthly_issued = []
    default_rate_trend = []
    credit_score_dist = []
    income_dist = []
    age_dist = []
    loan_amount_dist = []
    heatmap_data = []
    
    if loans_rows:
        df_loans = pd.DataFrame(loans_rows, columns=['loan_amount', 'credit_score', 'created_at', 'status', 'dti', 'age'])
        
        # Monthly Loans Issued & Default Rate Trend
        df_loans['month_year'] = df_loans['created_at'].apply(lambda x: x.strftime('%Y-%m'))
        grouped_loans = df_loans.groupby('month_year')
        
        for name, group in sorted(grouped_loans):
            total_amt = float(group['loan_amount'].sum())
            total_count = len(group)
            def_count = len(group[group['status'] == 'Defaulted'])
            def_rate = round((def_count / total_count * 100), 1) if total_count > 0 else 0.0
            
            dt = datetime.strptime(name, '%Y-%m')
            label = dt.strftime('%b %y')
            
            monthly_issued.append({"month": label, "amount": total_amt, "count": total_count})
            default_rate_trend.append({"month": label, "rate": def_rate})
            
        # Credit Score Distribution
        cs_bins = [300, 500, 600, 650, 700, 750, 800, 850]
        cs_labels = ["300-500", "501-600", "601-650", "651-700", "701-750", "751-800", "801-850"]
        df_loans['cs_bin'] = pd.cut(df_loans['credit_score'], bins=cs_bins, labels=cs_labels)
        cs_counts = df_loans['cs_bin'].value_counts().reindex(cs_labels, fill_value=0)
        credit_score_dist = [{"range": k, "count": int(v)} for k, v in cs_counts.items()]
        
        # Age Distribution
        age_bins = [18, 25, 35, 45, 55, 65, 100]
        age_labels = ["18-25", "26-35", "36-45", "46-55", "56-65", "65+"]
        df_loans['age_bin'] = pd.cut(df_loans['age'], bins=age_bins, labels=age_labels)
        age_counts = df_loans['age_bin'].value_counts().reindex(age_labels, fill_value=0)
        age_dist = [{"range": k, "count": int(v)} for k, v in age_counts.items()]
        
        # Loan Amount Distribution
        la_bins = [0, 10000, 30000, 50000, 100000, 200000, 300000, 500000]
        la_labels = ["<10k", "10k-30k", "30k-50k", "50k-100k", "100k-200k", "200k-300k", "300k+"]
        df_loans['la_bin'] = pd.cut(df_loans['loan_amount'], bins=la_bins, labels=la_labels)
        la_counts = df_loans['la_bin'].value_counts().reindex(la_labels, fill_value=0)
        loan_amount_dist = [{"range": k, "count": int(v)} for k, v in la_counts.items()]

        # DTI vs Credit Score Heatmap coordinates (for scatter bubble plot representation)
        # CS tiers: Subprime (<600), Nearprime (600-680), Prime (680-740), Superprime (740+)
        # DTI tiers: Low (<0.25), Med (0.25-0.45), High (0.45-0.65), Critical (0.65+)
        dti_bins_val = [0, 0.25, 0.45, 0.65, 2.0]
        dti_labels_val = ["Low DTI (<25%)", "Medium DTI (25-45%)", "High DTI (45-65%)", "Critical DTI (65%+)"]
        cs_bins_val = [300, 600, 680, 740, 850]
        cs_labels_val = ["Subprime (<600)", "Nearprime (600-680)", "Prime (680-740)", "Superprime (740+)"]
        
        df_loans['dti_tier'] = pd.cut(df_loans['dti'], bins=dti_bins_val, labels=dti_labels_val)
        df_loans['cs_tier'] = pd.cut(df_loans['credit_score'], bins=cs_bins_val, labels=cs_labels_val)
        
        # Calculate default rate per combination
        heatmap_grouped = df_loans.groupby(['dti_tier', 'cs_tier'], observed=False)
        for (d_tier, c_tier), group in heatmap_grouped:
            cnt = len(group)
            def_cnt = len(group[group['status'] == 'Defaulted'])
            def_r = round((def_cnt / cnt * 100), 1) if cnt > 0 else 0.0
            heatmap_data.append({
                "dti": str(d_tier),
                "credit": str(c_tier),
                "count": cnt,
                "defaultRate": def_r
            })

    # Fetch customer income distribution separately (since it represents independent profile health)
    cust_income_rows = customer_query.with_entities(Customer.annual_income).all()
    if cust_income_rows:
        df_cust = pd.DataFrame(cust_income_rows, columns=['annual_income'])
        income_bins = [0, 30000, 60000, 90000, 120000, 150000, 200000, 300000]
        income_labels = ["<30k", "30k-60k", "60k-90k", "90k-120k", "120k-150k", "150k-200k", "200k+"]
        df_cust['income_bin'] = pd.cut(df_cust['annual_income'], bins=income_bins, labels=income_labels)
        income_counts = df_cust['income_bin'].value_counts().reindex(income_labels, fill_value=0)
        income_dist = [{"range": k, "count": int(v)} for k, v in income_counts.items()]

    # Geographic branch credit distribution details (Mock data representing core branches)
    branches = [
        {"name": "Mumbai HQ", "loans": int(total_loans * 0.35), "volume": round(total_loan_amount * 0.38, 2), "defaultRate": round(max(1.2, default_rate * 0.8), 2), "x": 30, "y": 70},
        {"name": "Delhi City", "loans": int(total_loans * 0.28), "volume": round(total_loan_amount * 0.26, 2), "defaultRate": round(max(2.1, default_rate * 1.2), 2), "x": 65, "y": 80},
        {"name": "Bengaluru IT", "loans": int(total_loans * 0.22), "volume": round(total_loan_amount * 0.23, 2), "defaultRate": round(max(0.8, default_rate * 0.6), 2), "x": 40, "y": 30},
        {"name": "Kolkata Hub", "loans": int(total_loans * 0.15), "volume": round(total_loan_amount * 0.13, 2), "defaultRate": round(max(2.5, default_rate * 1.4), 2), "x": 75, "y": 45}
    ]

    return {
        "kpis": {
            "total_customers": total_customers,
            "total_loans": total_loans,
            "active_loans": active_loans,
            "default_rate": default_rate,
            "avg_credit_score": avg_credit_score,
            "total_loan_amount": total_loan_amount
        },
        "charts": {
            "loan_purpose": purpose_data,
            "employment_type": employment_data,
            "risk_categories": risk_distribution,
            "monthly_issued": monthly_issued,
            "default_rate_trend": default_rate_trend,
            "credit_score_dist": credit_score_dist,
            "income_dist": income_dist,
            "age_dist": age_dist,
            "loan_amount_dist": loan_amount_dist,
            "heatmap": heatmap_data,
            "branches": branches
        }
    }
