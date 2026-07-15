from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List
from ..database.connection import get_db
from ..database.models import User, AuditLog
from ..schemas.schemas import UserCreate, UserUpdate, UserResponse, AuditLogResponse
from ..auth.security import get_password_hash
from ..auth.dependencies import get_current_user, RoleChecker

router = APIRouter(prefix="/api/users", tags=["users"])

# Only Admins can access user management
admin_only = RoleChecker(["Admin"])

@router.get("", response_model=List[UserResponse])
def get_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_only)
):
    return db.query(User).all()

@router.post("", response_model=UserResponse)
def create_new_user(
    req: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_only)
):
    # Check if username or email exists
    if db.query(User).filter(User.username == req.username).first():
        raise HTTPException(status_code=400, detail="Username already exists")
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(status_code=400, detail="Email already exists")
        
    hashed_pwd = get_password_hash(req.password)
    
    new_user = User(
        username=req.username,
        email=req.email,
        password_hash=hashed_pwd,
        role=req.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Audit logging
    log = AuditLog(
        user_id=current_user.id,
        action="Create User",
        details=f"Created user {new_user.username} with role {new_user.role}"
    )
    db.add(log)
    db.commit()
    
    return new_user

@router.put("/{user_id}", response_model=UserResponse)
def update_user_details(
    user_id: int,
    req: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_only)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    update_dict = req.model_dump(exclude_unset=True)
    
    # Prevent deactivating the last active Admin
    if 'is_active' in update_dict and not update_dict['is_active']:
        if user.role == "Admin":
            active_admins = db.query(User).filter(User.role == "Admin", User.is_active == True).count()
            if active_admins <= 1:
                raise HTTPException(status_code=400, detail="Cannot deactivate the only active Administrator")
                
    if 'role' in update_dict and update_dict['role'] != user.role:
        if user.role == "Admin" and user.id == current_user.id:
            raise HTTPException(status_code=400, detail="Cannot change your own role from Admin")
            
    if 'password' in update_dict:
        user.password_hash = get_password_hash(update_dict['password'])
        
    if 'email' in update_dict:
        user.email = update_dict['email']
        
    if 'role' in update_dict:
        user.role = update_dict['role']
        
    if 'is_active' in update_dict:
        user.is_active = update_dict['is_active']
        
    db.commit()
    db.refresh(user)
    
    # Audit logging
    log = AuditLog(
        user_id=current_user.id,
        action="Update User",
        details=f"Updated details for user: {user.username}"
    )
    db.add(log)
    db.commit()
    
    return user

@router.delete("/{user_id}", status_code=status.HTTP_200_OK)
def delete_user_account(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_only)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own administrator account")
        
    if user.role == "Admin":
        active_admins = db.query(User).filter(User.role == "Admin").count()
        if active_admins <= 1:
            raise HTTPException(status_code=400, detail="Cannot delete the only remaining Administrator")
            
    username = user.username
    db.delete(user)
    db.commit()
    
    # Audit logging
    log = AuditLog(
        user_id=current_user.id,
        action="Delete User",
        details=f"Deleted user account: {username}"
    )
    db.add(log)
    db.commit()
    
    return {"detail": f"User {username} deleted successfully"}

@router.get("/logs", response_model=List[AuditLogResponse])
def get_audit_logs(
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_only)
):
    logs = db.query(AuditLog).order_by(desc(AuditLog.created_at)).limit(limit).all()
    return logs
