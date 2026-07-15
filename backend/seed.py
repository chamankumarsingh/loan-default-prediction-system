import os
import sys
import pandas as pd
import random
import json
from datetime import datetime, timedelta

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from app.database.connection import engine, SessionLocal, Base
from app.database.models import User, Customer, Loan, Prediction, AuditLog, CustomerNote, CustomerDocument, LoginHistory
from app.auth.security import get_password_hash

# Names list to make synthetic data look real
FIRST_NAMES = [
    "James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", 
    "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica", 
    "Thomas", "Sarah", "Charles", "Karen", "Christopher", "Nancy", "Daniel", "Lisa", 
    "Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra", "Donald", "Ashley"
]

LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", 
    "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", 
    "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", 
    "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young"
]

TAGS_POOL = ["VIP", "New Client", "Repeat Borrower", "High Income", "Subprime", "Mortgage Holder", "Auto Loan holder", "Preferred"]

NOTE_TEXTS = [
    "Employment verified via phone check with HR. Details match paystub exactly.",
    "IRS tax transcript for 2025 reviewed. Declared income is consistent.",
    "Credit bureau pull shows a resolved billing dispute from late 2024. FICO score recovered.",
    "Client requested rapid processing. Application pre-approved by Manager.",
    "Debt serviceability limits are tight due to high credit card balances. DTI was flagged.",
    "Savings balance checked. Customer holds a secondary investment account at Partner Brokerage.",
    "Co-signer information requested but client opted to proceed individually.",
    "Income tax returns filed late last season. Minor compliance flags cleared."
]

DOCS_POOL = [
    ("Tax_Return_2025.pdf", "PDF", "2.1 MB"),
    ("Pay_Slips_June.pdf", "PDF", "850 KB"),
    ("ID_Verification_Passport.jpg", "JPG", "1.4 MB"),
    ("Credit_Bureau_Report.pdf", "PDF", "3.4 MB"),
    ("Bank_Statement_3Months.xlsx", "XLSX", "1.1 MB"),
    ("Collateral_Agreement.pdf", "PDF", "980 KB")
]

IPS_POOL = ["192.168.1.45", "10.0.0.12", "172.16.89.5", "192.168.1.100"]
AGENTS_POOL = [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15"
]

def seed_db():
    print("Initialising database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # 1. Seed Users if not present
    if db.query(User).count() == 0:
        print("Seeding users...")
        users = [
            User(
                username="admin",
                email="admin@bankdefault.com",
                password_hash=get_password_hash("AdminPass123!"),
                role="Admin"
            ),
            User(
                username="manager",
                email="manager@bankdefault.com",
                password_hash=get_password_hash("ManagerPass123!"),
                role="Manager"
            ),
            User(
                username="analyst",
                email="analyst@bankdefault.com",
                password_hash=get_password_hash("AnalystPass123!"),
                role="Analyst"
            ),
            User(
                username="viewer",
                email="viewer@bankdefault.com",
                password_hash=get_password_hash("ViewerPass123!"),
                role="Viewer"
            )
        ]
        db.add_all(users)
        db.commit()
        print("Users seeded.")
        
    # Query users for associations
    seeded_users = db.query(User).all()
    user_ids = [u.id for u in seeded_users]
    analyst_user = db.query(User).filter(User.username == "analyst").first()
    
    # Seed LoginHistory
    if db.query(LoginHistory).count() == 0:
        print("Seeding login history...")
        login_histories = []
        for u in seeded_users:
            # Seed 5 logins per user scattered over the last month
            start_date = datetime.now() - timedelta(days=30)
            for i in range(5):
                login_time = start_date + timedelta(days=i*6, hours=random.randint(1, 10))
                login_histories.append(
                    LoginHistory(
                        user_id=u.id,
                        ip_address=random.choice(IPS_POOL),
                        user_agent=random.choice(AGENTS_POOL),
                        login_time=login_time
                    )
                )
        db.add_all(login_histories)
        db.commit()
        print("Login histories seeded.")

    # 2. Seed Customers, Loans, and predictions from training CSV
    csv_path = '/Users/jaskiratsingh/.gemini/antigravity/scratch/loan_default_prediction_system/data/loan_data.csv'
    if not os.path.exists(csv_path):
        print(f"Error: CSV data file not found at {csv_path}. Please run dataset_generator.py first.")
        db.close()
        return

    if db.query(Customer).count() == 0:
        print("Loading loan dataset CSV for seeding...")
        df = pd.read_csv(csv_path)
        
        # Take a subset of 1000 items to seed in the DB to keep DB size manageable and fast
        df_seed = df.sample(n=min(1200, len(df)), random_state=42).reset_index(drop=True)
        
        print(f"Seeding {len(df_seed)} customer records...")
        
        customers_to_add = []
        loans_to_add = []
        predictions_to_add = []
        
        start_date = datetime.now() - timedelta(days=180)
        
        # Loop to create customers
        for idx, row in df_seed.iterrows():
            # Generate random name
            first = random.choice(FIRST_NAMES)
            last = random.choice(LAST_NAMES)
            email = f"{first.lower()}.{last.lower()}{idx}@bankcorp.com"
            phone = f"+1 ({random.randint(200, 999)}) 555-{random.randint(1000, 9999)}"
            
            # Timestamp scattered over last 180 days
            created_at = start_date + timedelta(
                days=random.randint(0, 179), 
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59)
            )
            
            # Generate random tags (0 to 3 tags per customer)
            customer_tags = []
            if row['Loan Default'] == 1:
                customer_tags.append("High Risk")
            if row['Annual Income'] > 120000:
                customer_tags.append("High Income")
            if row['Credit Score'] > 750:
                customer_tags.append("VIP")
            
            # Add random tag from pool if we have space
            if len(customer_tags) < 3 and random.random() > 0.5:
                random_tag = random.choice(TAGS_POOL)
                if random_tag not in customer_tags:
                    customer_tags.append(random_tag)
                    
            tags_string = ",".join(customer_tags)
            
            customer = Customer(
                first_name=first,
                last_name=last,
                email=email,
                phone=phone,
                age=int(row['Age']),
                gender=row['Gender'],
                education=row['Education'],
                marital_status=row['Marital Status'],
                employment_type=row['Employment Type'],
                job_experience=int(row['Job Experience']),
                annual_income=float(row['Annual Income']),
                monthly_income=float(row['Monthly Income']),
                home_ownership=row['Home Ownership'],
                tags=tags_string,
                created_at=created_at
            )
            customers_to_add.append(customer)
            
        # Commit customers
        db.add_all(customers_to_add)
        db.commit()
        
        # Refresh and create loans
        print("Creating loan records...")
        for idx, row in df_seed.iterrows():
            cust = customers_to_add[idx]
            
            # Map default target to status
            if row['Loan Default'] == 1:
                status = "Defaulted"
            else:
                status = random.choice(["Approved", "Approved", "Approved", "Approved", "Pending", "Rejected"])
                
            loan = Loan(
                customer_id=cust.id,
                loan_amount=float(row['Loan Amount']),
                loan_term=int(row['Loan Term']),
                credit_score=int(row['Credit Score']),
                existing_loans=int(row['Existing Loans']),
                debt_to_income_ratio=float(row['Debt To Income Ratio']),
                number_of_dependents=int(row['Number of Dependents']),
                loan_purpose=row['Loan Purpose'],
                previous_defaults=int(row['Previous Defaults']),
                savings_balance=float(row['Savings Balance']),
                current_balance=float(row['Current Balance']),
                emi=float(row['EMI']),
                status=status,
                created_at=cust.created_at
            )
            loans_to_add.append(loan)
            
        db.add_all(loans_to_add)
        db.commit()
        
        # Generate historical prediction records
        print("Generating historical prediction logs...")
        for i in range(150):  # Seeding 150 historical predictions
            loan = loans_to_add[i]
            cust = customers_to_add[i]
            
            # Synthesize risk details based on status
            if loan.status == "Defaulted" or loan.status == "Rejected":
                prob = random.uniform(0.61, 0.96)
                rating = "High"
            elif loan.status == "Pending":
                prob = random.uniform(0.31, 0.59)
                rating = "Medium"
            else:
                prob = random.uniform(0.02, 0.29)
                rating = "Low"
                
            conf = prob if prob >= 0.5 else (1.0 - prob)
            
            # Create a structured explanation
            dummy_explanation = {
                "eligibility_score": round((1 - prob) * 100, 1),
                "calculated_emi": loan.emi,
                "calculated_dti": loan.debt_to_income_ratio,
                "risk_increasers": [
                    {"feature": "Credit Score", "impact": round(random.uniform(0.05, 0.2), 3), "description": f"Credit Score of {loan.credit_score}"}
                ] if prob > 0.4 else [],
                "risk_reducers": [
                    {"feature": "Savings Balance", "impact": round(-random.uniform(0.05, 0.15), 3), "description": f"Savings Balance of ${loan.savings_balance:,.0f}"}
                ] if prob < 0.4 else []
            }
            
            pred = Prediction(
                customer_id=cust.id,
                loan_id=loan.id,
                risk_probability=round(prob, 4),
                risk_rating=rating,
                confidence_score=round(conf, 4),
                explanation_json=json.dumps(dummy_explanation),
                created_by_id=random.choice(user_ids),
                created_at=cust.created_at
            )
            predictions_to_add.append(pred)
            
        db.add_all(predictions_to_add)
        db.commit()
        
        # Seed CustomerNotes and CustomerDocuments
        print("Seeding customer notes and documents CRM sections...")
        notes_to_add = []
        docs_to_add = []
        
        # Add notes/documents to a subset of customers (first 200)
        for i in range(200):
            cust = customers_to_add[i]
            
            # 1. Add 1-2 notes per customer
            num_notes = random.randint(1, 2)
            for _ in range(num_notes):
                note_date = cust.created_at + timedelta(days=random.randint(1, 10))
                notes_to_add.append(
                    CustomerNote(
                        customer_id=cust.id,
                        user_id=random.choice(user_ids),
                        text=random.choice(NOTE_TEXTS),
                        created_at=note_date
                    )
                )
                
            # 2. Add 2-3 documents per customer
            num_docs = random.randint(2, 3)
            selected_docs = random.sample(DOCS_POOL, num_docs)
            for name, dtype, size in selected_docs:
                doc_date = cust.created_at + timedelta(hours=random.randint(1, 24))
                docs_to_add.append(
                    CustomerDocument(
                        customer_id=cust.id,
                        name=name,
                        file_type=dtype,
                        file_size=size,
                        url=f"/api/reports/documents/mock/{cust.id}_{name}",
                        created_at=doc_date
                    )
                )
                
        db.add_all(notes_to_add)
        db.add_all(docs_to_add)
        db.commit()
        
        # Log seeder execution in audit logs
        system_log = AuditLog(
            user_id=1,  # Admin
            action="System Seeding",
            details=f"Enterprise Seeding complete. Seeded {len(customers_to_add)} profiles, {len(loans_to_add)} loans, {len(predictions_to_add)} risk evaluations, {len(notes_to_add)} notes and {len(docs_to_add)} mock documents."
        )
        db.add(system_log)
        db.commit()
        
        print("Database fully seeded with CRM components.")
        
    db.close()

if __name__ == '__main__':
    seed_db()
