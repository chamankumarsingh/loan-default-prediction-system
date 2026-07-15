import pandas as pd
import numpy as np
import os

def generate_large_loan_dataset(num_samples=10000, random_seed=42):
    np.random.seed(random_seed)
    
    # 1. IDs and Demographic features
    customer_ids = np.arange(10001, 10001 + num_samples)
    age = np.random.randint(21, 70, size=num_samples)
    gender = np.random.choice(['Male', 'Female'], size=num_samples, p=[0.5, 0.5])
    education = np.random.choice(
        ['High School', 'Bachelor', 'Master', 'PhD'], 
        size=num_samples, 
        p=[0.25, 0.50, 0.20, 0.05]
    )
    marital_status = np.random.choice(
        ['Single', 'Married', 'Divorced'], 
        size=num_samples, 
        p=[0.35, 0.50, 0.15]
    )
    dependents = np.random.choice([0, 1, 2, 3, 4], size=num_samples, p=[0.4, 0.25, 0.2, 0.1, 0.05])
    
    # 2. Employment & Income
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
        np.maximum(0, annual_income * np.random.uniform(-0.15, 0.45, size=num_samples) + np.random.normal(4000, 1500, size=num_samples)), 
        2
    )
    
    # Current Balance (correlated with savings)
    current_balance = np.round(
        np.maximum(0, savings_balance * np.random.uniform(0.1, 0.5, size=num_samples) + np.random.normal(1500, 750, size=num_samples)), 
        2
    )
    
    # Credit Score (highly influenced by employment, history, and a bit of age)
    credit_score = []
    for i in range(num_samples):
        base = 640
        if employment_type[i] == 'Unemployed':
            base -= 70
        elif employment_type[i] == 'Salaried':
            base += 25
            
        base += int((age[i] - 35) * 1.2)
        score = int(np.random.normal(base, 65))
        credit_score.append(max(300, min(850, score)))
    credit_score = np.array(credit_score)
    
    # Previous Defaults (correlated with lower credit score)
    previous_defaults = []
    for i in range(num_samples):
        if credit_score[i] < 550:
            previous_defaults.append(np.random.choice([0, 1, 2], p=[0.35, 0.45, 0.20]))
        elif credit_score[i] < 680:
            previous_defaults.append(np.random.choice([0, 1], p=[0.80, 0.20]))
        else:
            previous_defaults.append(np.random.choice([0, 1], p=[0.96, 0.04]))
    previous_defaults = np.array(previous_defaults)
    
    existing_loans = np.random.choice([0, 1, 2, 3, 4], size=num_samples, p=[0.45, 0.32, 0.15, 0.06, 0.02])
    
    # 4. Loan Specifics
    loan_purpose = np.random.choice(
        ['Home', 'Auto', 'Education', 'Personal', 'Business'], 
        size=num_samples, 
        p=[0.28, 0.24, 0.20, 0.18, 0.10]
    )
    
    # Loan Amount (correlated with income and purpose)
    loan_amount = []
    for i in range(num_samples):
        if loan_purpose[i] == 'Home':
            mult = np.random.uniform(1.8, 4.2)
        elif loan_purpose[i] == 'Business':
            mult = np.random.uniform(0.6, 2.2)
        else:
            mult = np.random.uniform(0.15, 0.9)
        
        val = monthly_income[i] * 12 * mult
        loan_amount.append(max(3000, round(np.random.normal(val, val * 0.12), 2)))
    loan_amount = np.array(loan_amount)
    
    loan_term = np.random.choice([12, 24, 36, 48, 60], size=num_samples, p=[0.12, 0.22, 0.32, 0.22, 0.12])
    
    # Interest Rate (Lower credit score = higher interest rate)
    interest_rates = []
    for i in range(num_samples):
        if credit_score[i] > 740:
            r = np.random.uniform(0.05, 0.08)
        elif credit_score[i] > 670:
            r = np.random.uniform(0.08, 0.12)
        elif credit_score[i] > 580:
            r = np.random.uniform(0.12, 0.17)
        else:
            r = np.random.uniform(0.17, 0.23)
        interest_rates.append(round(r, 4))
    interest_rates = np.array(interest_rates)
    
    # EMI calculation
    emi = []
    for i in range(num_samples):
        monthly_rate = interest_rates[i] / 12
        n = loan_term[i]
        p = loan_amount[i]
        val = p * monthly_rate * ((1 + monthly_rate)**n) / (((1 + monthly_rate)**n) - 1)
        emi.append(round(val, 2))
    emi = np.array(emi)
    
    # Debt To Income Ratio (DTI)
    dti = []
    for i in range(num_samples):
        existing_payment = existing_loans[i] * np.random.uniform(120, 380)
        total_monthly_debt = emi[i] + existing_payment
        val = total_monthly_debt / max(500, monthly_income[i])
        dti.append(round(min(1.5, val), 4))
    dti = np.array(dti)
    
    # 5. Risk Scoring & Default Target Generation
    # Create risk score with weight thresholds to achieve 20-30% default target rate
    risk_score = np.zeros(num_samples)
    
    risk_score += np.where(dti > 0.40, (dti - 0.40) * 3.5, 0)
    risk_score += np.where(dti > 0.55, 1.8, 0)
    risk_score += np.where(credit_score < 600, 2.8, 0)
    risk_score += np.where((credit_score >= 600) & (credit_score < 670), 1.4, 0)
    risk_score += np.where(credit_score > 740, -1.8, 0)
    risk_score += previous_defaults * 2.2
    risk_score += np.where(savings_balance < 3000, 1.2, 0)
    risk_score += np.where(savings_balance > 25000, -1.0, 0)
    risk_score += np.where(annual_income < 35000, 1.0, 0)
    risk_score += np.where(employment_type == 'Unemployed', 2.2, 0)
    risk_score += np.where(employment_type == 'Student', 1.2, 0)
    
    ratio = loan_amount / annual_income
    risk_score += np.where(ratio > 2.8, (ratio - 2.8) * 0.9, 0)
    risk_score += np.random.normal(0, 0.95, size=num_samples)
    
    # Set default threshold to select approx 24% default cases (within 20-30% range)
    threshold = np.percentile(risk_score, 76)
    default_numeric = np.where(risk_score >= threshold, 1, 0)
    default_target = np.where(default_numeric == 1, 'Yes', 'No')
    
    # 6. Loan Status Mapping
    # Default = 'Yes' -> Loan Status = 'Defaulted'
    # Default = 'No' -> Loan Status = 'Approved' (85%), 'Pending' (10%), or 'Rejected' (5%)
    loan_status = []
    for i in range(num_samples):
        if default_target[i] == 'Yes':
            loan_status.append('Defaulted')
        else:
            loan_status.append(np.random.choice(['Approved', 'Approved', 'Approved', 'Pending', 'Rejected'], p=[0.75, 0.10, 0.05, 0.08, 0.02]))
            
    df = pd.DataFrame({
        'Customer_ID': customer_ids,
        'Age': age,
        'Gender': gender,
        'Marital_Status': marital_status,
        'Education': education,
        'Employment_Type': employment_type,
        'Job_Experience': job_experience,
        'Annual_Income': annual_income,
        'Monthly_Income': monthly_income,
        'Credit_Score': credit_score,
        'Loan_Amount': loan_amount,
        'Loan_Term': loan_term,
        'Interest_Rate': interest_rates,
        'EMI': emi,
        'Existing_Loans': existing_loans,
        'Debt_To_Income_Ratio': dti,
        'Number_of_Dependents': dependents,
        'Savings_Balance': savings_balance,
        'Current_Balance': current_balance,
        'Home_Ownership': home_ownership,
        'Loan_Purpose': loan_purpose,
        'Previous_Defaults': previous_defaults,
        'Loan_Status': loan_status,
        'Default': default_target
    })
    
    return df

if __name__ == '__main__':
    base_dir = '/Users/jaskiratsingh/.gemini/antigravity/scratch/loan_default_prediction_system'
    df = generate_large_loan_dataset(num_samples=10500)
    
    # Save to root of the project
    csv_root_path = os.path.join(base_dir, 'loan_default_dataset.csv')
    df.to_csv(csv_root_path, index=False)
    
    # Also save to data/ for consistency
    csv_data_path = os.path.join(base_dir, 'data', 'loan_default_dataset.csv')
    df.to_csv(csv_data_path, index=False)
    
    print(f"Dataset generated at root: {csv_root_path}")
    print(f"Dataset generated in data folder: {csv_data_path}")
    print(f"Record Count: {len(df)}")
    print(f"Default rate: {df['Default'].value_counts(normalize=True).get('Yes', 0) * 100:.2f}%")
