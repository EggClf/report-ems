"""
Context Snapshot API.

Serves the cell_context_snapshot.csv data from the data directory.
Supports pagination, search by cell_name, and filtering by time range.
"""

import logging
from pathlib import Path
from typing import List, Optional

import pandas as pd
import numpy as np
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/context-snapshot",
    tags=["context-snapshot"],
    responses={404: {"description": "Not found"}},
)

# Path to snapshot CSV
SNAPSHOT_CSV = Path(__file__).parent / "data" / "cell_context_snapshot.csv"


def _safe_json(obj):
    """Convert numpy / pandas types to JSON-safe Python types."""
    if obj is None or (isinstance(obj, float) and np.isnan(obj)):
        return None
    if isinstance(obj, (np.integer,)):
        return int(obj)
    if isinstance(obj, (np.floating,)):
        return float(obj)
    if isinstance(obj, pd.Timestamp):
        return obj.isoformat()
    return obj


def _row_to_dict(row: pd.Series) -> dict:
    return {k: _safe_json(v) for k, v in row.items()}


@router.get("/data", summary="Get context snapshot data")
async def get_context_snapshot(
    page: int = Query(1, ge=1, description="Page number (1-based)"),
    page_size: int = Query(50, ge=1, le=500, description="Rows per page"),
    cell_name: Optional[str] = Query(None, description="Filter by cell_name (substring match)"),
    start_time: Optional[str] = Query(None, description="Filter rows with time_bucket >= this ISO datetime"),
    end_time: Optional[str] = Query(None, description="Filter rows with time_bucket <= this ISO datetime"),
):
    """
    Return paginated rows from cell_context_snapshot.csv.

    Each row contains: context_snapshot_id, cell_name, time_bucket, metadata,
    common_sense, kpi, alarm, and any remaining columns present in the CSV.
    """
    if not SNAPSHOT_CSV.exists():
        raise HTTPException(status_code=404, detail="cell_context_snapshot.csv not found")

    try:
        df = pd.read_csv(SNAPSHOT_CSV, dtype=str)  # read everything as str to preserve JSON columns
    except Exception as exc:
        logger.error(f"Failed to read context snapshot CSV: {exc}")
        raise HTTPException(status_code=500, detail=f"Failed to read CSV: {exc}")

    if df.empty:
        return JSONResponse({
            "total": 0,
            "page": page,
            "page_size": page_size,
            "columns": [],
            "data": [],
        })

    # Optional filters ---------------------------------------------------
    if cell_name:
        mask = df.apply(
            lambda r: cell_name.lower() in str(r.get("cell_name", "")).lower(),
            axis=1,
        )
        df = df[mask]

    if start_time and "time_bucket" in df.columns:
        try:
            df = df[pd.to_datetime(df["time_bucket"]) >= pd.to_datetime(start_time)]
        except Exception:
            pass  # skip filter on parse failure

    if end_time and "time_bucket" in df.columns:
        try:
            df = df[pd.to_datetime(df["time_bucket"]) <= pd.to_datetime(end_time)]
        except Exception:
            pass

    total = len(df)
    columns = list(df.columns)

    # Paginate
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    page_df = df.iloc[start_idx:end_idx]

    rows = [_row_to_dict(row) for _, row in page_df.iterrows()]

    return JSONResponse({
        "total": total,
        "page": page,
        "page_size": page_size,
        "columns": columns,
        "data": rows,
    })
