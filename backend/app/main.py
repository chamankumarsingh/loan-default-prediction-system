from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

from .database.connection import engine, Base
from .routers import auth, customers, predictions, dashboard, reports, model, users

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize database tables
# (Usually managed via migrations like Alembic in production, but Base.metadata.create_all is perfect for SQLite seeding)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Loan Default Prediction System API",
    description="Backend API for predicting loan defaults, managing banking customers, and portfolio statistics.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
# In production, specify actual domain names, but allowing wildcard/local host is standard for portfolio projects.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler
@app.exception_handler(Exception)
def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global unhandled error on path {request.url.path}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please contact system support."}
    )

# Include Routers
app.include_router(auth.router)
app.include_router(customers.router)
app.include_router(predictions.router)
app.include_router(dashboard.router)
app.include_router(reports.router)
app.include_router(model.router)
app.include_router(users.router)

@app.get("/")
def read_root():
    return {
        "name": "Loan Default Prediction API",
        "status": "healthy",
        "version": "1.0.0",
        "documentation": "/docs"
    }

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}
