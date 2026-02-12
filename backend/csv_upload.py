"""
CSV Upload API for Admin Panel.

Allows admins to upload CSV files associated with a specific date and task type (ES/MRO).
Uploaded data can then be retrieved and displayed in the Action Planner's Detailed Data tab.
"""

import logging
import os
import json
from datetime import datetime
from pathlib import Path
from typing import List, Optional

import pandas as pd
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/admin/csv",
    tags=["admin-csv"],
    responses={404: {"description": "Not found"}},
)

# Directory to store uploaded CSV files
CSV_UPLOAD_DIR = Path(__file__).parent / "uploads" / "csv"
CSV_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Metadata file to track uploads
METADATA_FILE = CSV_UPLOAD_DIR / "metadata.json"


def _load_metadata() -> dict:
    """Load the metadata index of uploaded CSVs."""
    if METADATA_FILE.exists():
        with open(METADATA_FILE, "r") as f:
            return json.load(f)
    return {"uploads": []}


def _save_metadata(metadata: dict):
    """Persist the metadata index."""
    with open(METADATA_FILE, "w") as f:
        json.dump(metadata, f, indent=2, default=str)


def _make_key(date: str, task_type: str, label: str = "") -> str:
    """Create a unique key for a date + task_type + label combination."""
    if label:
        return f"{date}_{task_type.upper()}_{label}"
    return f"{date}_{task_type.upper()}"


def _sanitize_filename(date: str, task_type: str, original_name: str, label: str = "") -> str:
    """Generate a safe filename for storage."""
    ext = Path(original_name).suffix or ".csv"
    if label:
        return f"{date}_{task_type.upper()}_{label}{ext}"
    return f"{date}_{task_type.upper()}{ext}"


@router.post("/upload")
async def upload_csv(
    file: UploadFile = File(..., description="CSV file to upload"),
    date: str = Form(..., description="Date in YYYY-MM-DD format"),
    task_type: str = Form(..., description="Task type: 'ES' or 'MRO'"),
    label: str = Form("", description="Optional label: 'before_plan' or 'after_plan' for evaluation uploads"),
):
    """
    Upload a CSV file for a specific date and task type.

    The file will be stored and indexed so it can be retrieved later
    for display in the Action Planner's Detailed Data tab.

    **Parameters:**
    - **file**: The CSV file
    - **date**: Date string (YYYY-MM-DD)
    - **task_type**: Either 'ES' or 'MRO'
    - **label**: Optional label for evaluation datasets ('before_plan' or 'after_plan')
    """
    # Validate task_type
    task_type = task_type.upper()
    if task_type not in ("ES", "MRO"):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid task_type: {task_type}. Must be 'ES' or 'MRO'."
        )

    # Validate label
    if label and label not in ("before_plan", "after_plan"):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid label: {label}. Must be 'before_plan' or 'after_plan' (or empty)."
        )

    # Validate date format
    try:
        datetime.strptime(date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid date format: {date}. Use YYYY-MM-DD."
        )

    # Validate file is CSV
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Only CSV files are accepted."
        )

    # Read and validate CSV content
    try:
        content = await file.read()
        # Try parsing to validate it's valid CSV
        df = pd.read_csv(pd.io.common.BytesIO(content))
        if df.empty:
            raise HTTPException(status_code=400, detail="CSV file is empty.")

        rows = len(df)
        columns = list(df.columns)
    except pd.errors.ParserError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to parse CSV: {str(e)}"
        )

    # Save file
    safe_name = _sanitize_filename(date, task_type, file.filename, label)
    file_path = CSV_UPLOAD_DIR / safe_name
    with open(file_path, "wb") as f:
        f.write(content)

    # Update metadata
    metadata = _load_metadata()
    key = _make_key(date, task_type, label)

    # Remove existing entry for same key (replace)
    metadata["uploads"] = [
        u for u in metadata["uploads"] if u["key"] != key
    ]

    entry = {
        "key": key,
        "date": date,
        "task_type": task_type,
        "label": label,
        "original_filename": file.filename,
        "stored_filename": safe_name,
        "rows": rows,
        "columns": columns,
        "uploaded_at": datetime.now().isoformat(),
    }
    metadata["uploads"].append(entry)
    _save_metadata(metadata)

    label_info = f" [{label}]" if label else ""
    logger.info(f"✓ CSV uploaded: {safe_name} ({rows} rows, {len(columns)} cols) for {task_type} on {date}{label_info}")

    return JSONResponse({
        "status": "ok",
        "message": f"CSV uploaded successfully for {task_type} on {date}{label_info}",
        "date": date,
        "task_type": task_type,
        "label": label,
        "rows": rows,
        "columns": columns,
        "filename": file.filename,
    })


@router.get("/data")
async def get_csv_data(
    date: str = Query(..., description="Date in YYYY-MM-DD format"),
    task_type: str = Query(..., description="Task type: 'ES' or 'MRO'"),
    label: str = Query("", description="Optional label: 'before_plan' or 'after_plan'"),
):
    """
    Retrieve the uploaded CSV data for a specific date and task type.

    Returns the data as JSON rows along with column names.
    """
    task_type = task_type.upper()
    if task_type not in ("ES", "MRO"):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid task_type: {task_type}. Must be 'ES' or 'MRO'."
        )

    key = _make_key(date, task_type, label)
    metadata = _load_metadata()

    # Find matching upload
    entry = next((u for u in metadata["uploads"] if u["key"] == key), None)
    if not entry:
        raise HTTPException(
            status_code=404,
            detail=f"No CSV data found for {task_type} on {date}."
        )

    file_path = CSV_UPLOAD_DIR / entry["stored_filename"]
    if not file_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"CSV file not found on disk for {task_type} on {date}."
        )

    try:
        df = pd.read_csv(file_path)
        # Replace NaN with None for JSON serialization
        df = df.where(pd.notnull(df), None)
        records = df.to_dict(orient="records")
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to read CSV file: {str(e)}"
        )

    return JSONResponse({
        "date": date,
        "task_type": task_type,
        "label": entry.get("label", ""),
        "columns": list(df.columns),
        "rows": len(records),
        "data": records,
        "original_filename": entry["original_filename"],
        "uploaded_at": entry["uploaded_at"],
    })


@router.get("/list")
async def list_uploads():
    """
    List all uploaded CSV files with metadata.
    """
    metadata = _load_metadata()
    return JSONResponse({
        "total": len(metadata["uploads"]),
        "uploads": metadata["uploads"],
    })


@router.delete("/delete")
async def delete_csv(
    date: str = Query(..., description="Date in YYYY-MM-DD format"),
    task_type: str = Query(..., description="Task type: 'ES' or 'MRO'"),
    label: str = Query("", description="Optional label: 'before_plan' or 'after_plan'"),
):
    """
    Delete an uploaded CSV for a given date and task type.
    """
    task_type = task_type.upper()
    key = _make_key(date, task_type, label)
    metadata = _load_metadata()

    entry = next((u for u in metadata["uploads"] if u["key"] == key), None)
    if not entry:
        raise HTTPException(
            status_code=404,
            detail=f"No CSV data found for {task_type} on {date}."
        )

    # Remove file
    file_path = CSV_UPLOAD_DIR / entry["stored_filename"]
    if file_path.exists():
        os.remove(file_path)

    # Remove metadata entry
    metadata["uploads"] = [u for u in metadata["uploads"] if u["key"] != key]
    _save_metadata(metadata)

    return JSONResponse({
        "status": "ok",
        "message": f"CSV deleted for {task_type} on {date}.",
    })
