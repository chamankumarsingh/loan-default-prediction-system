from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# --- USER SCHEMAS ---
class UserBase(BaseModel):
    username: str
    email: EmailStr
    role: str

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    role: str
    username: str
    email: str

# --- CUSTOMER SCHEMAS ---
class CustomerBase(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    age: int = Field(..., ge=18, le=100)
    gender: str
    education: str
    marital_status: str
    employment_type: str
    job_experience: int = Field(..., ge=0)
    annual_income: float = Field(..., ge=0)
    home_ownership: str

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    education: Optional[str] = None
    marital_status: Optional[str] = None
    employment_type: Optional[str] = None
    job_experience: Optional[int] = None
    annual_income: Optional[float] = None
    home_ownership: Optional[str] = None

class CustomerResponse(CustomerBase):
    id: int
    monthly_income: float
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# --- LOAN SCHEMAS ---
class LoanBase(BaseModel):
    loan_amount: float = Field(..., ge=0)
    loan_term: int = Field(..., ge=1)  # in months
    credit_score: int = Field(..., ge=300, le=850)
    existing_loans: int = Field(..., ge=0)
    number_of_dependents: int = Field(..., ge=0)
    loan_purpose: str
    previous_defaults: int = Field(..., ge=0)
    savings_balance: float = Field(..., ge=0)
    current_balance: float = Field(..., ge=0)

class LoanCreate(LoanBase):
    customer_id: int

class LoanUpdate(BaseModel):
    status: str  # Pending, Approved, Rejected, Defaulted

class LoanResponse(LoanBase):
    id: int
    customer_id: int
    debt_to_income_ratio: float
    emi: float
    status: str
    created_at: datetime
    customer: Optional[CustomerResponse] = None

    class Config:
        from_attributes = True

# --- PREDICTION SCHEMAS ---
class PredictionRequest(BaseModel):
    customer_id: int
    loan_amount: float = Field(..., ge=0)
    loan_term: int = Field(..., ge=1)
    credit_score: int = Field(..., ge=300, le=850)
    existing_loans: int = Field(..., ge=0)
    number_of_dependents: int = Field(..., ge=0)
    loan_purpose: str
    previous_defaults: int = Field(..., ge=0)
    savings_balance: float = Field(..., ge=0)
    current_balance: float = Field(..., ge=0)

class PredictionResponse(BaseModel):
    id: int
    customer_id: int
    loan_id: Optional[int] = None
    risk_probability: float
    risk_rating: str
    confidence_score: float
    explanation: Dict[str, Any]  # Local attribution SHAP-like data
    created_at: datetime
    customer: Optional[CustomerResponse] = None

    class Config:
        from_attributes = True

# --- AUDIT LOG SCHEMA ---
class AuditLogResponse(BaseModel):
    id: int
    user_id: int
    action: str
    details: Optional[str] = None
    created_at: datetime
    user: Optional[UserBase] = None

    class Config:
        from_attributes = True
