from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
from ..database.connection import get_db
from ..services.statistics import get_dashboard_statistics
from ..auth.dependencies import get_current_user, RoleChecker

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

allow_read = RoleChecker(["Admin", "Manager", "Analyst", "Viewer"])

@router.get("")
def get_dashboard(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    purpose: Optional[str] = Query(None),
    employment_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(allow_read)
):
    s_date = None
    e_date = None
    
    if start_date:
        try:
            # Parse ISO string format, e.g. "2026-07-01T00:00:00.000Z"
            s_date = datetime.fromisoformat(start_date.replace("Z", "+00:00"))
        except ValueError:
            try:
                s_date = datetime.strptime(start_date, "%Y-%m-%d")
            except ValueError:
                pass
                
    if end_date:
        try:
            e_date = datetime.fromisoformat(end_date.replace("Z", "+00:00"))
        except ValueError:
            try:
                e_date = datetime.strptime(end_date, "%Y-%m-%d")
            except ValueError:
                pass
                
    stats = get_dashboard_statistics(
        db=db,
        start_date=s_date,
        end_date=e_date,
        purpose=purpose,
        employment_type=employment_type
    )
    return stats
