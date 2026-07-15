from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from ..database.connection import get_db
from ..database.models import User, Prediction
from ..services.reporting import (
    generate_portfolio_csv, 
    generate_portfolio_excel, 
    generate_prediction_pdf
)
from ..auth.dependencies import get_current_user, RoleChecker

router = APIRouter(prefix="/api/reports", tags=["reports"])

allow_read = RoleChecker(["Admin", "Manager", "Analyst", "Viewer"])

@router.get("/portfolio/csv")
def download_portfolio_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_read)
):
    try:
        csv_file = generate_portfolio_csv(db)
        return StreamingResponse(
            csv_file,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=loan_portfolio.csv"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate CSV: {e}")

@router.get("/portfolio/excel")
def download_portfolio_excel(
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_read)
):
    try:
        xlsx_file = generate_portfolio_excel(db)
        return StreamingResponse(
            xlsx_file,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=loan_portfolio.xlsx"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate Excel file: {e}")

@router.get("/prediction/{prediction_id}/pdf")
def download_prediction_pdf(
    prediction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_read)
):
    # Verify prediction exists
    pred = db.query(Prediction).filter(Prediction.id == prediction_id).first()
    if not pred:
        raise HTTPException(status_code=404, detail="Prediction not found")
        
    try:
        pdf_file = generate_prediction_pdf(prediction_id, db)
        return StreamingResponse(
            pdf_file,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=prediction_report_{prediction_id}.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {e}")
