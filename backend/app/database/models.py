from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .connection import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="Analyst")  # Admin, Manager, Analyst, Viewer
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    predictions = relationship("Prediction", back_populates="creator")
    audit_logs = relationship("AuditLog", back_populates="user")
    login_histories = relationship("LoginHistory", back_populates="user")
    refresh_tokens = relationship("RefreshToken", back_populates="user")
    notes = relationship("CustomerNote", back_populates="author")

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String, nullable=False)
    education = Column(String, nullable=False)
    marital_status = Column(String, nullable=False)
    employment_type = Column(String, nullable=False)
    job_experience = Column(Integer, nullable=False)
    annual_income = Column(Float, nullable=False)
    monthly_income = Column(Float, nullable=False)
    home_ownership = Column(String, nullable=False)
    tags = Column(String, default="")  # Comma-separated tags e.g., "VIP,New Client"
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    loans = relationship("Loan", back_populates="customer", cascade="all, delete-orphan")
    predictions = relationship("Prediction", back_populates="customer", cascade="all, delete-orphan")
    notes = relationship("CustomerNote", back_populates="customer", cascade="all, delete-orphan")
    documents = relationship("CustomerDocument", back_populates="customer", cascade="all, delete-orphan")

class Loan(Base):
    __tablename__ = "loans"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    loan_amount = Column(Float, nullable=False)
    loan_term = Column(Integer, nullable=False)  # in months
    credit_score = Column(Integer, nullable=False)
    existing_loans = Column(Integer, nullable=False)
    debt_to_income_ratio = Column(Float, nullable=False)
    number_of_dependents = Column(Integer, nullable=False)
    loan_purpose = Column(String, nullable=False)
    previous_defaults = Column(Integer, nullable=False)
    savings_balance = Column(Float, nullable=False)
    current_balance = Column(Float, nullable=False)
    emi = Column(Float, nullable=False)
    status = Column(String, default="Pending")  # Pending, Approved, Rejected, Defaulted
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    customer = relationship("Customer", back_populates="loans")
    prediction = relationship("Prediction", back_populates="loan", uselist=False, cascade="all, delete-orphan")

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    loan_id = Column(Integer, ForeignKey("loans.id"), nullable=True)
    risk_probability = Column(Float, nullable=False)
    risk_rating = Column(String, nullable=False)  # Low, Medium, High
    confidence_score = Column(Float, nullable=False)
    explanation_json = Column(Text, nullable=False)  # Local attribution SHAP reasons
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    customer = relationship("Customer", back_populates="predictions")
    loan = relationship("Loan", back_populates="prediction")
    creator = relationship("User", back_populates="predictions")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String, nullable=False)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="audit_logs")

# --- NEW TABLES FOR FINTECH CRM AND AUDIT TRAIL ---

class CustomerNote(Base):
    __tablename__ = "customer_notes"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    text = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    customer = relationship("Customer", back_populates="notes")
    author = relationship("User", back_populates="notes")

class CustomerDocument(Base):
    __tablename__ = "customer_documents"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    name = Column(String, nullable=False)
    file_type = Column(String, nullable=False)  # PDF, JPG, etc.
    file_size = Column(String, nullable=False)  # e.g., "1.2 MB"
    url = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    customer = relationship("Customer", back_populates="documents")

class LoginHistory(Base):
    __tablename__ = "login_histories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    login_time = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="login_histories")

class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    token = Column(String, unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    revoked = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="refresh_tokens")
