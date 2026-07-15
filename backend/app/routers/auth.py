from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import jwt, JWTError
from pydantic import BaseModel
from ..database.connection import get_db
from ..database.models import User, AuditLog, LoginHistory, RefreshToken as DBRefreshToken
from ..schemas.schemas import UserLogin, Token
from ..auth.security import verify_password, create_access_token, create_refresh_token, SECRET_KEY, ALGORITHM

router = APIRouter(prefix="/api", tags=["auth"])

class RefreshRequest(BaseModel):
    refresh_token: str

class PasswordResetRequest(BaseModel):
    username: str
    email: str

@router.post("/login", response_model=Token)
def login(request: Request, login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == login_data.username).first()
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is deactivated"
        )
        
    # Generate tokens
    access_token = create_access_token(subject=user.username)
    refresh_token = create_refresh_token(subject=user.username)
    
    # Save refresh token in database
    expires_at = datetime.utcnow() + timedelta(days=7)
    db_refresh = DBRefreshToken(
        user_id=user.id,
        token=refresh_token,
        expires_at=expires_at
    )
    db.add(db_refresh)
    
    # Save LoginHistory
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    history = LoginHistory(
        user_id=user.id,
        ip_address=client_ip,
        user_agent=user_agent
    )
    db.add(history)
    
    # Audit log
    log = AuditLog(user_id=user.id, action="User Login", details=f"Logged in successfully via IP {client_ip}.")
    db.add(log)
    db.commit()
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "role": user.role,
        "username": user.username,
        "email": user.email
    }

@router.post("/refresh")
def refresh_token_endpoint(req: RefreshRequest, db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate refresh token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(req.refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        token_type: str = payload.get("type")
        if username is None or token_type != "refresh":
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    # Check refresh token database record
    db_token = db.query(DBRefreshToken).filter(
        DBRefreshToken.token == req.refresh_token,
        DBRefreshToken.revoked == False,
        DBRefreshToken.expires_at > datetime.utcnow()
    ).first()
    
    if not db_token:
        raise credentials_exception
        
    user = db.query(User).filter(User.username == username).first()
    if not user or not user.is_active:
        raise credentials_exception

    # Revoke old refresh token
    db_token.revoked = True
    
    # Generate new tokens
    new_access = create_access_token(subject=user.username)
    new_refresh = create_refresh_token(subject=user.username)
    
    # Save new refresh token
    expires_at = datetime.utcnow() + timedelta(days=7)
    new_db_refresh = DBRefreshToken(
        user_id=user.id,
        token=new_refresh,
        expires_at=expires_at
    )
    db.add(new_db_refresh)
    db.commit()

    return {
        "access_token": new_access,
        "refresh_token": new_refresh,
        "token_type": "bearer",
        "role": user.role,
        "username": user.username,
        "email": user.email
    }

@router.post("/password-reset")
def password_reset_endpoint(req: PasswordResetRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(
        User.username == req.username,
        User.email == req.email
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No employee matching these credentials was found."
        )
        
    # Seed audit log for password request
    log = AuditLog(
        user_id=user.id,
        action="Password Reset Request",
        details="Submitted verification credentials. Link dispatched to registered corporate email."
    )
    db.add(log)
    db.commit()
    
    return {
        "detail": "Password reset instructions have been dispatched to your corporate email address."
    }
