# DefaultGuard Pro — Enterprise Loan Default Prediction System

DefaultGuard Pro is an enterprise-grade fintech risk underwriter portal and predictive intelligence dashboard. Designed for credit officers, underwriting analysts, and bank managers, it provides real-time default classification using Random Forest classifiers, interactive local attributions, geographic credit distribution analytics, and full client CRM workspaces.

---

## 🏦 Project Overview

DefaultGuard Pro mirrors modern software architectures deployed by prime retail banks (e.g., HDFC, ICICI, Axis Bank) to manage credit exposure. It enables financial institutions to:
1. **Underwrite Loans via a Multi-Step Wizard**: Evaluate applicant demographic and financial liquidity markers, triggering real-time risk assessment runs.
2. **Interpret Explanations**: Inspect local attributions (shapley-like perturbation margins) showing which parameters drive risk upward (e.g., low credit score) and which mitigate it (e.g., high savings).
3. **Reference Comparable Outcomes**: Review nearest-neighbor historical clients with similar profiles to verify default rates.
4. **Inspect Portfolios**: Analyze overall defaults, outstanding capital volumes, credit averages, and bubble maps across branches.
5. **Manage Customer CRM Profiles**: Edit custom tags, attach internal audit notes, map verification documents, and audit chronological borrowing history.
6. **Audit Systems Security**: Monitor operator login logs (IPs, browser user agents) and audit security action trails.

---

## 💻 Environment Configs & Vars

DefaultGuard Pro utilizes a `.env` configuration file in the project root to bind parameters. Rename `.env.example` to `.env` and set the following parameters:

| Variable | Scope | Type | Default Value | Description |
| :--- | :--- | :--- | :--- | :--- |
| `JWT_SECRET_KEY` | Backend | String | `supersecretbankingkeydefault...` | Secret key used to encrypt/verify JWT tokens. |
| `DATABASE_URL` | Backend | String | `sqlite:///./data/loan_system.db` | Connection string for database driver. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Backend | Integer | `360` (6 Hours) | Access token duration before rotation. |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Backend | Integer | `7` (7 Days) | Session refresh token expiration. |
| `CORS_ORIGINS` | Backend | JSON List | `["http://localhost:5173"]` | Authorized origin targets for CORS policies. |
| `VITE_API_URL` | Frontend | String | `http://localhost:8000` | Tells Vite proxy where the FastAPI server is. |

---

## 📁 Repository Directory Structure

```
loan_default_prediction_system/
├── .vscode/
│   └── extensions.json         # Recommended VS Code IDE extensions
├── data/
│   ├── loan_data.csv           # 6,000 baseline model records
│   ├── loan_default_dataset.csv# 10,500 enterprise sample records
│   └── loan_system.db          # Seeded SQLite database file
├── docs/
│   ├── database_schema.md      # Database tables ER definition
│   └── sequence_diagram.md     # Authentication & Prediction flows
├── model/
│   ├── dataset_generator.py    # Synthetic generator script (6k samples)
│   ├── train.py                # Model training, GridSearch, ROC & PR curves
│   ├── loan_model_pipeline.joblib # Trained scikit-learn serialised pipeline
│   └── model_metadata.json     # Saved evaluation metrics, curves, features
├── backend/
│   ├── app/
│   │   ├── auth/               # JWT authentication, dependencies, and rules
│   │   ├── database/           # Connection sessions and SQLAlchemy schemas
│   │   ├── ml/                 # Predictor engine loader and local SHAP attributions
│   │   ├── routers/            # FastAPI controller endpoints (auth, predict, CRM)
│   │   ├── schemas/            # Pydantic input/output schemas
│   │   └── services/           # Exporters (PDF, CSV, Excel) and metrics compilation
│   ├── main.py                 # FastAPI configuration and CORS setup
│   ├── seed.py                 # CRM database seeder script
│   └── requirements.txt        # Python dependency manifest
├── frontend/
│   ├── src/
│   │   ├── components/         # SVG Gauges, Breadcrumbs, Sidebars, and Skeletons
│   │   ├── context/            # Global providers (Auth timeout, Theme, Toast)
│   │   ├── pages/              # View pages (Login, Dashboard, Profile, Analytics)
│   │   ├── services/           # API wrapper with refresh token rotation
│   │   ├── App.tsx             # Code-split lazy routing configurations
│   │   └── main.tsx            # Single-page app mounting entrypoint
│   ├── tailwind.config.js      # Styling design tokens
│   ├── vite.config.ts          # Compilation configurations
│   └── package.json            # Node dependency manifest
├── loan_default_dataset.csv    # 10,500 record dataset (root copy)
├── generate_large_dataset.py   # Utility script to re-generate the 10.5k dataset
├── .env.example                # Sample configurations environment file
├── .gitignore                  # Git tracking exclusions
├── LICENSE                     # MIT License details
└── README.md                   # This instruction manual
```

---

## 🛠️ Installation & Setup Guide

Ensure you have **Python 3.10+** and **Node.js 18+** installed locally.

### 1. Set Up the Backend Server
1. Navigate to the backend directory and configure a virtual environment:
   ```bash
   cd backend
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```
2. Seed the SQLite database tables with demo parameters:
   ```bash
   python3 seed.py
   ```
   *This populates user logins, login histories, mock documents, and 1,200 historical profiles. The seeded access accounts are:*
   - **Admin (Control Panel)**: `admin` / `AdminPass123!`
   - **Manager**: `manager` / `ManagerPass123!`
   - **Analyst (Underwriter)**: `analyst` / `AnalystPass123!`
   - **Viewer**: `viewer` / `ViewerPass123!`

3. Fire up the FastAPI server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   *Verify execution by viewing `http://127.0.0.1:8000/docs` (Swagger documentation).*

### 2. Set Up the Frontend Client
1. Open a new terminal tab and navigate to the frontend directory:
   ```bash
   cd frontend
   npm install
   ```
2. Launch Vite in development mode:
   ```bash
   npm run dev
   ```
   *Open `http://localhost:5173` in your browser.*

---

## 🧠 Machine Learning Model Pipeline

### How to Train the Model Again
If you edit features, adjust hyperparameters, or change algorithms:
1. Navigate to the root directory and activate your virtual environment:
   ```bash
   source .venv/bin/activate
   ```
2. Re-run the model training script:
   ```bash
   python3 model/train.py
   ```
   *This automatically executes GridSearch across tree estimators/depths, evaluates validation metrics, downsamples ROC and PR coordinates, and overwrites `model/loan_model_pipeline.joblib` and `model/model_metadata.json`.*

### How to Add New Datasets
To feed a different CSV dataset into the system:
1. Place your raw CSV file in `data/` (e.g. name it `loan_data.csv`).
2. Ensure it contains the following target columns: `Age`, `Gender`, `Annual Income`, `Monthly Income`, `Employment Type`, `Job Experience`, `Loan Amount`, `Loan Term`, `Credit Score`, `Existing Loans`, `Debt To Income Ratio`, `Number of Dependents`, `Education`, `Home Ownership`, `Marital Status`, `Loan Purpose`, `Previous Defaults`, `Savings Balance`, `Current Balance`, `EMI`, and the binary target class column `Loan Default` (1 for Default, 0 otherwise).
3. Re-execute the training script: `python3 model/train.py`
4. Re-seed the SQLite database to map new clients: `python3 backend/seed.py`

---

## ☁️ Production Deployment Instructions

### Frontend SPA (Vercel)
Vite SPAs can be deployed directly to Vercel:
1. In the Vercel dashboard, link your Git repository and choose the `frontend` folder as the root directory.
2. Configure Environment Variables: Set `VITE_API_URL` to point to your live, hosted backend URL (e.g. `https://api.defaultguardpro.com`).
3. Set Build Command: `npm run build` and Output Directory: `dist`.
4. Create a `vercel.json` file in the `frontend/` directory to handle SPA rewrites (prevents 404s on browser refreshes):
   ```json
   {
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```

### Backend REST API (Render)
To host the FastAPI server on Render:
1. Link your repository and create a new **Web Service**, choosing the `backend` folder as the root directory.
2. Select **Python** as the runtime.
3. Configure Build Command:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure Start Command:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port $PORT
   ```
5. **Persistence**:
   - Because SQLite is transient on Render free tiers (wiped on spin-downs), attach a **Persistent Disk** on Render (e.g., at `/var/data`), and update your `.env` `DATABASE_URL` to point to `/var/data/loan_system.db`.
   - Alternatively, provision a PostgreSQL database on Render, and supply the PostgreSQL connection string in the `DATABASE_URL` environment variable (the SQLAlchemy ORM will handle tables mapping automatically!).

---

## 🔧 Troubleshooting & Extensions

### Recommended VS Code Extensions
Open the workspace directory in Visual Studio Code. The editor will automatically suggest installing the extensions defined in `.vscode/extensions.json`:
- **Python & Pylance**: For type-hints, auto-imports, and docstring references in the backend.
- **Tailwind CSS IntelliSense**: Autocompletes styling tokens.
- **Prettier & ESLint**: Ensures clean indentation and strict compilation checks.

### Common Troubleshooting Scenarios
* **Error: `IndentationError` or `ModuleNotFoundError` on Backend**
  Ensure your virtual environment is active (`source .venv/bin/activate`) and python dependencies are updated. Check that your path includes the root: if imports fail, execute uvicorn from the `backend/` directory or run `export PYTHONPATH=.`.
* **Error: `active:scale-95` or slate colors fail during Vite compile**
  This happens if Tailwind CSS hasn't initialized correctly or PostCSS config maps incorrectly. Run `npm run build` in the `frontend` directory to check if Vite outputs assets successfully.
* **Error: Inactivity timeout logs me out immediately**
  If you are debugging and want to prolong sessions, open `frontend/src/context/AuthContext.tsx` and increase the `INACTIVITY_TIMEOUT` threshold from `15 * 60 * 1000` to your desired milliseconds (e.g., 2 hours).
