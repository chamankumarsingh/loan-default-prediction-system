import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_DIR = '/Users/jaskiratsingh/.gemini/antigravity/scratch/loan_default_prediction_system/data'
os.makedirs(DATABASE_DIR, exist_ok=True)
DATABASE_URL = f"sqlite:///{os.path.join(DATABASE_DIR, 'loan_system.db')}"

engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False}  # Needed for SQLite
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency to get db session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
