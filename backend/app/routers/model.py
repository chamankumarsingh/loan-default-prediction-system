import os
import json
from fastapi import APIRouter, Depends, HTTPException, status
from ..auth.dependencies import get_current_user, RoleChecker

router = APIRouter(prefix="/api/model", tags=["model"])

allow_read = RoleChecker(["Admin", "Manager", "Analyst", "Viewer"])
METADATA_PATH = '/Users/jaskiratsingh/.gemini/antigravity/scratch/loan_default_prediction_system/model/model_metadata.json'

@router.get("/diagnostics")
def get_model_diagnostics(
    current_user = Depends(allow_read)
):
    if not os.path.exists(METADATA_PATH):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Model metadata/diagnostics file not found. Ensure the model has been trained."
        )
        
    try:
        with open(METADATA_PATH, 'r') as f:
            metadata = json.load(f)
        return metadata
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading model diagnostics: {e}")
