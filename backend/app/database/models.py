import json
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, status
from ..auth.dependencies import RoleChecker

router = APIRouter(prefix="/api/model", tags=["model"])

allow_read = RoleChecker(["Admin", "Manager", "Analyst", "Viewer"])

BASE_DIR = Path(__file__).resolve().parents[3]
METADATA_PATH = BASE_DIR / "model" / "model_metadata.json"


@router.get("/diagnostics")
def get_model_diagnostics(current_user=Depends(allow_read)):
    if not METADATA_PATH.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Model metadata file not found."
        )

    try:
        with open(METADATA_PATH, "r") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )