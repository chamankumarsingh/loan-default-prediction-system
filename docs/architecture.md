# System Architecture - Loan Default Prediction System

The Loan Default Prediction System is designed as a modern, split-tier web application combining responsive portal features with machine learning credit scoring services.

---

## 1. System Topology

Below is the structure representing the client-server relationships:

```mermaid
graph TD
    Client[React + TypeScript Frontend]
    API[FastAPI Backend Server]
    DB[(SQLite Database)]
    ML[Random Forest Classifier]
    Report[ReportLab PDF Engine]
    
    Client -- 1. REST / JSON + Bearer Token --> API
    API -- 2. SQLAlchemy ORM Queries --> DB
    API -- 3. Query Coefficients & Predict --> ML
    API -- 4. Assemble Flowables --> Report
    ML -- 5. Local Perturbation Attributions --> API
    Report -- 6. Streaming PDF Buffer --> Client
```

---

## 2. Component Design

### Tier 1: Frontend Single Page Application (SPA)
- **Framework**: React 18 with Vite and TypeScript.
- **Styling**: Tailwind CSS for responsive dark/light banking design.
- **Visuals**: Recharts for interactive credit distributions, default rates, and SHAP attribution bars.
- **Authentication**: JWT token storage in local state, forwarded in `Authorization` headers.

### Tier 2: Backend REST Services
- **Framework**: FastAPI (Python) running under Uvicorn.
- **Routing**: Split into modular routers: login, customers, predictions, stats dashboard, report rendering, and model diagnostics.
- **Security**: JWT encryption using `python-jose` with password hashing under `passlib[bcrypt]`.
- **Database Engine**: SQLAlchemy ORM interacting with an SQLite database file.

### Tier 3: Machine Learning Engine
- **Framework**: Scikit-learn (Random Forest Classifier).
- **Pipeline Structure**: Combines StandardScaler (numerical scaling) and OneHotEncoder (categorical encoding) into a unified joblib pipeline.
- **Explainability (SHAP-like)**: Computes local feature attribution shifts by comparing predictions from actual client data inputs against population-level median/mode baselines.

---

## 3. Sequential End-to-End Prediction Flow

```mermaid
sequenceDiagram
    autonumber
    actor Officer as Loan Officer
    participant SPA as React Portal
    participant API as FastAPI Router
    participant DB as SQLite DB
    participant ML as ML Predictor
    
    Officer->>SPA: Select customer & input loan details
    SPA->>API: POST /api/predict (JSON payload)
    API->>DB: Query customer demographics
    DB-->>API: Customer age, income, employment type
    API->>ML: Evaluate model pipeline & perturbation attribution
    Note over ML: Evaluates actual inputs vs baseline medians.<br/>Calculates probability difference.
    ML-->>API: Probability (%), Category (Low/Med/High), Attribution shifts
    API->>DB: Create Loan (Pending/Approved/Rejected) & Prediction log
    API->>DB: Save audit action log
    API-->>SPA: Predict response object
    SPA->>Officer: Display radial Risk Gauge & SHAP waterfall charts
```
