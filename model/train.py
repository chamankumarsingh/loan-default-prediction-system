import os
import json
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, GridSearchCV, cross_val_score
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, roc_curve, precision_recall_curve
)

def train_model():
    # Setup directories
    base_dir = '/Users/jaskiratsingh/.gemini/antigravity/scratch/loan_default_prediction_system'
    data_dir = os.path.join(base_dir, 'data')
    model_dir = os.path.join(base_dir, 'model')
    docs_dir = os.path.join(base_dir, 'docs')
    os.makedirs(model_dir, exist_ok=True)
    os.makedirs(docs_dir, exist_ok=True)
    
    csv_path = os.path.join(data_dir, 'loan_data.csv')
    if not os.path.exists(csv_path):
        print("Data file not found. Generating data first...")
        from dataset_generator import generate_loan_dataset
        df = generate_loan_dataset(num_samples=6000)
        df.to_csv(csv_path, index=False)
    else:
        df = pd.read_csv(csv_path)
        
    print("Dataset loaded successfully.")
    
    # Separate features and target
    X = df.drop(columns=['Loan Default'])
    y = df['Loan Default']
    
    # Identify numerical and categorical features
    numerical_cols = [
        'Age', 'Annual Income', 'Monthly Income', 'Job Experience', 
        'Loan Amount', 'Loan Term', 'Credit Score', 'Existing Loans', 
        'Debt To Income Ratio', 'Number of Dependents', 'Previous Defaults', 
        'Savings Balance', 'Current Balance', 'EMI'
    ]
    
    categorical_cols = [
        'Gender', 'Employment Type', 'Education', 'Home Ownership', 
        'Marital Status', 'Loan Purpose'
    ]
    
    # Calculate dataset medians (for numericals) and modes (for categoricals)
    # This will be used as baseline reference for SHAP-like local explanations
    baselines = {}
    for col in numerical_cols:
        baselines[col] = float(X[col].median())
    for col in categorical_cols:
        baselines[col] = str(X[col].mode()[0])
        
    # Split into train and test sets
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    # Build preprocessing pipeline
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), numerical_cols),
            ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), categorical_cols)
        ]
    )
    
    # Define Random Forest classifier
    rf_classifier = RandomForestClassifier(random_state=42, class_weight='balanced')
    
    # Create complete pipeline
    pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('classifier', rf_classifier)
    ])
    
    # Define hyperparameters for tuning
    param_grid = {
        'classifier__n_estimators': [100, 200],
        'classifier__max_depth': [10, 15, 20],
        'classifier__min_samples_split': [2, 5, 10]
    }
    
    print("Starting GridSearchCV for hyperparameter tuning...")
    grid_search = GridSearchCV(
        pipeline, 
        param_grid, 
        cv=5, 
        scoring='roc_auc', 
        n_jobs=-1,
        verbose=1
    )
    grid_search.fit(X_train, y_train)
    
    best_pipeline = grid_search.best_estimator_
    print(f"Best parameters: {grid_search.best_params_}")
    print(f"Best CV ROC-AUC: {grid_search.best_score_:.4f}")
    
    # Evaluate model
    y_pred = best_pipeline.predict(X_test)
    y_pred_proba = best_pipeline.predict_proba(X_test)[:, 1]
    
    # Performance metrics
    metrics = {
        'accuracy': accuracy_score(y_test, y_pred),
        'precision': precision_score(y_test, y_pred),
        'recall': recall_score(y_test, y_pred),
        'f1': f1_score(y_test, y_pred),
        'auc': roc_auc_score(y_test, y_pred_proba)
    }
    
    # Cross Validation score
    cv_scores = cross_val_score(best_pipeline, X, y, cv=5, scoring='accuracy')
    metrics['cv_accuracy_mean'] = cv_scores.mean()
    metrics['cv_accuracy_std'] = cv_scores.std()
    
    # Confusion Matrix
    cm = confusion_matrix(y_test, y_pred)
    tn, fp, fn, tp = cm.ravel()
    metrics['confusion_matrix'] = {
        'tn': int(tn),
        'fp': int(fp),
        'fn': int(fn),
        'tp': int(tp)
    }
    
    # ROC Curve points (downsampled for plotting)
    fpr, tpr, thresholds = roc_curve(y_test, y_pred_proba)
    # Downsample to ~50 points to save size in json
    step = max(1, len(fpr) // 50)
    roc_points = [{'fpr': float(f), 'tpr': float(t)} for f, t in zip(fpr[::step], tpr[::step])]
    # Make sure to include the end point (1.0, 1.0)
    if roc_points[-1] != {'fpr': 1.0, 'tpr': 1.0}:
        roc_points.append({'fpr': 1.0, 'tpr': 1.0})
    metrics['roc_curve'] = roc_points
    
    # Precision-Recall Curve points
    precision, recall, _ = precision_recall_curve(y_test, y_pred_proba)
    pr_step = max(1, len(precision) // 50)
    pr_points = [{'precision': float(p), 'recall': float(r)} for p, r in zip(precision[::pr_step], recall[::pr_step])]
    metrics['pr_curve'] = pr_points
    
    # Retrieve feature names from preprocessor to map back importances
    onehot_features = list(
        best_pipeline.named_steps['preprocessor']
        .named_transformers_['cat']
        .get_feature_names_out(categorical_cols)
    )
    feature_names = numerical_cols + onehot_features
    importances = best_pipeline.named_steps['classifier'].feature_importances_
    
    # Combine feature importances
    feat_importance_list = []
    for name, imp in zip(feature_names, importances):
        feat_importance_list.append({
            'feature': name,
            'importance': float(imp)
        })
    # Sort by importance descending
    feat_importance_list = sorted(feat_importance_list, key=lambda x: x['importance'], reverse=True)
    
    # Save the pipeline
    model_path = os.path.join(model_dir, 'loan_model_pipeline.joblib')
    joblib.dump(best_pipeline, model_path)
    print(f"Model pipeline saved at: {model_path}")
    
    # Save metadata
    metadata = {
        'metrics': metrics,
        'feature_importances': feat_importance_list,
        'baselines': baselines,
        'features': {
            'numerical': numerical_cols,
            'categorical': categorical_cols
        }
    }
    
    metadata_path = os.path.join(model_dir, 'model_metadata.json')
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=4)
    print(f"Model metadata and metrics saved at: {metadata_path}")
    
    print("\nModel Training Summary:")
    print(f"Accuracy: {metrics['accuracy']:.4f}")
    print(f"Precision: {metrics['precision']:.4f}")
    print(f"Recall: {metrics['recall']:.4f}")
    print(f"F1 Score: {metrics['f1']:.4f}")
    print(f"AUC Score: {metrics['auc']:.4f}")
    print(f"5-Fold CV Accuracy: {metrics['cv_accuracy_mean']:.4f} (+/- {metrics['cv_accuracy_std']:.4f})")
    
if __name__ == '__main__':
    train_model()
