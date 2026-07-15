from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
from typing import List, Optional
from pydantic import BaseModel
from ..database.connection import get_db
from ..database.models import Customer, User, AuditLog, CustomerNote, CustomerDocument, Loan, Prediction
from ..schemas.schemas import CustomerCreate, CustomerUpdate, CustomerResponse
from ..auth.dependencies import get_current_user, RoleChecker
import json

router = APIRouter(prefix="/api/customers", tags=["customers"])

# Roles dependencies
allow_read = RoleChecker(["Admin", "Manager", "Analyst", "Viewer"])
allow_write = RoleChecker(["Admin", "Manager", "Analyst"])
allow_delete = RoleChecker(["Admin", "Manager"])

# Pydantic schemas for CRM interactions
class NoteCreate(BaseModel):
    text: str

class DocCreate(BaseModel):
    name: str
    file_type: str
    file_size: str

class TagsUpdate(BaseModel):
    tags: List[str]

@router.get("", response_model=dict)
def get_customers(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    sort_by: Optional[str] = Query("created_at"),
    sort_order: Optional[str] = Query("desc"),
    gender: Optional[str] = Query(None),
    employment_type: Optional[str] = Query(None),
    home_ownership: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_read)
):
    query = db.query(Customer)
    
    # Search filter
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                Customer.first_name.like(search_filter),
                Customer.last_name.like(search_filter),
                Customer.email.like(search_filter),
                Customer.phone.like(search_filter),
                Customer.tags.like(search_filter)
            )
        )
        
    # Category Filters
    if gender:
        query = query.filter(Customer.gender == gender)
    if employment_type:
        query = query.filter(Customer.employment_type == employment_type)
    if home_ownership:
        query = query.filter(Customer.home_ownership == home_ownership)
        
    # Total Count
    total_count = query.count()
    
    # Sorting
    sort_attr = getattr(Customer, sort_by, Customer.created_at)
    if sort_order == "desc":
        query = query.order_by(desc(sort_attr))
    else:
        query = query.order_by(asc(sort_attr))
        
    # Pagination
    offset = (page - 1) * limit
    customers = query.offset(offset).limit(limit).all()
    
    # Parse tags for response
    items = []
    for c in customers:
        items.append({
            "id": c.id,
            "first_name": c.first_name,
            "last_name": c.last_name,
            "email": c.email,
            "phone": c.phone,
            "age": c.age,
            "gender": c.gender,
            "education": c.education,
            "marital_status": c.marital_status,
            "employment_type": c.employment_type,
            "job_experience": c.job_experience,
            "annual_income": c.annual_income,
            "monthly_income": c.monthly_income,
            "home_ownership": c.home_ownership,
            "tags": [t.strip() for t in c.tags.split(",") if t.strip()] if c.tags else [],
            "created_at": c.created_at,
            "updated_at": c.updated_at
        })
    
    return {
        "items": items,
        "total": total_count,
        "page": page,
        "limit": limit,
        "pages": (total_count + limit - 1) // limit
    }

@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer_by_id(
    customer_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_read)
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@router.post("", response_model=CustomerResponse)
def create_customer(
    customer_data: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_write)
):
    existing = db.query(Customer).filter(Customer.email == customer_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Customer with this email already exists")
        
    monthly_income = round(customer_data.annual_income / 12, 2)
    
    new_customer = Customer(
        **customer_data.model_dump(),
        monthly_income=monthly_income
    )
    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)
    
    # Log action
    log = AuditLog(
        user_id=current_user.id,
        action="Create Customer",
        details=f"Created customer {new_customer.first_name} {new_customer.last_name} (ID: {new_customer.id})"
    )
    db.add(log)
    db.commit()
    
    return new_customer

@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: int,
    customer_data: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_write)
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    update_dict = customer_data.model_dump(exclude_unset=True)
    
    if 'email' in update_dict and update_dict['email'] != customer.email:
        existing = db.query(Customer).filter(Customer.email == update_dict['email']).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email is already in use by another customer")
            
    if 'annual_income' in update_dict:
        update_dict['monthly_income'] = round(update_dict['annual_income'] / 12, 2)
        
    for key, value in update_dict.items():
        setattr(customer, key, value)
        
    db.commit()
    db.refresh(customer)
    
    log = AuditLog(
        user_id=current_user.id,
        action="Update Customer",
        details=f"Updated customer details for {customer.first_name} {customer.last_name} (ID: {customer.id})"
    )
    db.add(log)
    db.commit()
    
    return customer

@router.delete("/{customer_id}", status_code=status.HTTP_200_OK)
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_delete)
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    db.delete(customer)
    db.commit()
    
    log = AuditLog(
        user_id=current_user.id,
        action="Delete Customer",
        details=f"Deleted customer {customer.first_name} {customer.last_name} (ID: {customer.id})"
    )
    db.add(log)
    db.commit()
    
    return {"detail": "Customer deleted successfully"}

# --- NEW ENTERPRISE CRM WORKSPACE ENDPOINTS ---

@router.get("/{customer_id}/profile")
def get_customer_profile(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_read)
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    loans = db.query(Loan).filter(Loan.customer_id == customer_id).order_by(desc(Loan.created_at)).all()
    predictions = db.query(Prediction).filter(Prediction.customer_id == customer_id).order_by(desc(Prediction.created_at)).all()
    
    notes = db.query(CustomerNote).filter(CustomerNote.customer_id == customer_id).order_by(desc(CustomerNote.created_at)).all()
    documents = db.query(CustomerDocument).filter(CustomerDocument.customer_id == customer_id).order_by(desc(CustomerDocument.created_at)).all()
    
    parsed_predictions = []
    for p in predictions:
        parsed_predictions.append({
            "id": p.id,
            "risk_probability": p.risk_probability,
            "risk_rating": p.risk_rating,
            "confidence_score": p.confidence_score,
            "explanation": json.loads(p.explanation_json),
            "created_at": p.created_at,
            "created_by": p.creator.username if p.creator else "system"
        })
        
    parsed_notes = []
    for n in notes:
        parsed_notes.append({
            "id": n.id,
            "text": n.text,
            "created_at": n.created_at,
            "author": n.author.username if n.author else "system"
        })
        
    parsed_docs = []
    for d in documents:
        parsed_docs.append({
            "id": d.id,
            "name": d.name,
            "file_type": d.file_type,
            "file_size": d.file_size,
            "url": d.url,
            "created_at": d.created_at
        })
        
    tags_list = [t.strip() for t in customer.tags.split(",") if t.strip()] if customer.tags else []

    return {
        "customer": {
            "id": customer.id,
            "first_name": customer.first_name,
            "last_name": customer.last_name,
            "email": customer.email,
            "phone": customer.phone,
            "age": customer.age,
            "gender": customer.gender,
            "education": customer.education,
            "marital_status": customer.marital_status,
            "employment_type": customer.employment_type,
            "job_experience": customer.job_experience,
            "annual_income": customer.annual_income,
            "monthly_income": customer.monthly_income,
            "home_ownership": customer.home_ownership,
            "tags": tags_list,
            "created_at": customer.created_at
        },
        "loans": loans,
        "predictions": parsed_predictions,
        "notes": parsed_notes,
        "documents": parsed_docs
    }

@router.post("/{customer_id}/notes")
def create_customer_note(
    customer_id: int,
    req: NoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_write)
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    new_note = CustomerNote(
        customer_id=customer_id,
        user_id=current_user.id,
        text=req.text
    )
    db.add(new_note)
    db.commit()
    db.refresh(new_note)
    
    return {
        "id": new_note.id,
        "text": new_note.text,
        "created_at": new_note.created_at,
        "author": current_user.username
    }

@router.delete("/notes/{note_id}")
def delete_customer_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_write)
):
    note = db.query(CustomerNote).filter(CustomerNote.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
        
    db.delete(note)
    db.commit()
    return {"detail": "Note deleted successfully"}

@router.post("/{customer_id}/documents")
def upload_mock_document(
    customer_id: int,
    req: DocCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_write)
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    new_doc = CustomerDocument(
        customer_id=customer_id,
        name=req.name,
        file_type=req.file_type,
        file_size=req.file_size,
        url=f"/api/reports/documents/mock/{customer_id}_{req.name}"
    )
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    
    return new_doc

@router.delete("/documents/{doc_id}")
def delete_customer_document(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_write)
):
    doc = db.query(CustomerDocument).filter(CustomerDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    db.delete(doc)
    db.commit()
    return {"detail": "Document deleted successfully"}

@router.put("/{customer_id}/tags")
def update_customer_tags(
    customer_id: int,
    req: TagsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_write)
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    customer.tags = ",".join(req.tags)
    db.commit()
    db.refresh(customer)
    
    return {"tags": req.tags}
