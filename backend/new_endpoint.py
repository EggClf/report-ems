"""
Historical KPI Data Extraction API.

Provides endpoints to extract historical KPI data based on task type and time window.
Data is read from locally stored CSV files collected via collect_historical_kpi.py script.
"""

import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Optional

import pandas as pd
import numpy as np
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/historical-kpi",
    tags=["historical-kpi"],
    responses={404: {"description": "Not found"}},
)

# KPI data directory
KPI_DATA_DIR = Path(__file__).parent.parent / "data" / "KPI" / "v3"

# Task type to KPI columns mapping (aligned with evaluation.md)
TASK_KPI_MAPPING = {
    "MRO": [
        "datetime", "ne_name", "cellname",
        "TU PRB DL (%)",
        "NR DL User Throughput Mbps (Mbps)",
        "EN-DC CDR (%)",
        "PSCell Change Inter-SgNB Att (#)",
        "PSCell Change Inter-SgNB Succ (#)",
        "PSCell Change Intra-SgNB Att (#)",
        "PSCell Change Intra-SgNB Succ (#)",
    ],
    "ES": [
        "datetime", "ne_name", "cellname",
        "TU PRB DL (%)",
        "NR DL User Throughput Mbps (Mbps)",
        "EN-DC CDR (%)",
        "PSCell Change Inter-SgNB Att (#)",
        "PSCell Change Inter-SgNB Succ (#)",
        "PSCell Change Intra-SgNB Att (#)",
        "PSCell Change Intra-SgNB Succ (#)",
        "Power Consumption (Wh)",
        "TU PRB UL (%)",
        "Max RRC Connected SA User (UE)",
    ],
    "all": [
        "datetime", "ne_name", "cellname",
        "Average Latency DL MAC (ms)",
        "EN-DC CDR (%)",
        "KV2_DL Packet Loss (%)",
        "KV2_UL Packet Loss (%)",
        "Max RRC Connected SA User (UE)",
        "NR DL User Throughput Mbps (Mbps)",
        "NR UL User Throughput (Mbps) (Mbps)",
        "PSCell Change Inter-SgNB Att (#)",
        "PSCell Change Inter-SgNB Succ (#)",
        "PSCell Change Intra-SgNB Att (#)",
        "PSCell Change Intra-SgNB Succ (#)",
        "TU PRB DL (%)",
        "TU PRB UL (%)",
        "Power Consumption (Wh)",
    ],
}


class HistoricalKPIRequest(BaseModel):
    """Request model for historical KPI extraction."""

    timestamp: str = Field(
        ...,
        description="Target timestamp in ISO format (e.g., '2024-01-15T14:30:00')",
        example="2024-01-15T14:30:00"
    )
    time_window_hours: float = Field(
        ...,
        description="Time window in hours to look back from timestamp",
        example=24.0,
        gt=0
    )
    task_type: str = Field(
        ...,
        description="Task type: 'MRO' (Mobility Robustness Optimization) or 'ES' (Energy Saving)",
        example="MRO"
    )
    ne_names: Optional[List[str]] = Field(
        None,
        description="Optional list of network element names to filter",
        example=["SITE001", "SITE002"]
    )
    cellnames: Optional[List[str]] = Field(
        None,
        description="Optional list of cell names to filter",
        example=["CELL001", "CELL002"]
    )
    aggregate: bool = Field(
        False,
        description="If True, aggregate metrics across all selected cells using mean"
    )


class HistoricalKPIResponse(BaseModel):
    """Response model for historical KPI extraction."""

    task_type: str
    timestamp: str
    time_window_hours: float
    start_time: str
    end_time: str
    records_count: int
    kpi_columns: List[str]
    aggregated: bool
    cells_included: List[str]
    data: List[dict]


@router.post("/extract", response_model=HistoricalKPIResponse)
async def extract_historical_kpi(request: HistoricalKPIRequest):
    """
    Extract historical KPI data for MRO or ES optimization tasks within a time window.

    This endpoint:
    1. Validates task type (MRO/ES) and maps to relevant KPI columns per evaluation.md
    2. Determines date range from timestamp and time window
    3. Loads data from local CSV files for required dates
    4. Filters data by timestamp range and optional site/cell lists
    5. Optionally aggregates metrics across cells using mean
    6. Calculates derived metrics (PSCell success rates)
    7. Returns filtered KPI data as structured response

    Task Types:
    - **MRO** (Mobility Robustness Optimization): Handover and mobility KPIs
    - **ES** (Energy Saving): Energy efficiency and load KPIs
    - **all**: All available KPIs from kpi_list_v2.txt

    Args:
        request: HistoricalKPIRequest with timestamp, time_window, task_type, filters, aggregate

    Returns:
        HistoricalKPIResponse with filtered/aggregated KPI data

    Raises:
        HTTPException: If task type is invalid or data files are missing
    """
    # Validate task type
    if request.task_type not in TASK_KPI_MAPPING:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid task_type. Must be one of: {list(TASK_KPI_MAPPING.keys())}"
        )

    # Parse timestamp
    try:
        end_time = datetime.fromisoformat(request.timestamp)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid timestamp format. Use ISO format (e.g., '2024-01-15T14:30:00')"
        )

    # Calculate start time
    start_time = end_time - timedelta(hours=request.time_window_hours)

    # Get required KPI columns
    kpi_columns = TASK_KPI_MAPPING[request.task_type]

    # Determine date range for file loading
    dates_to_load = _get_date_range(start_time, end_time)

    # Load and combine data from multiple files
    try:
        combined_df = _load_kpi_files(dates_to_load, kpi_columns)
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=404,
            detail=f"KPI data not found: {str(e)}"
        )

    # Filter by timestamp range
    combined_df['datetime'] = pd.to_datetime(combined_df['datetime'])
    filtered_df = combined_df[
        (combined_df['datetime'] >= start_time) &
        (combined_df['datetime'] <= end_time)
    ]

    # Apply optional filters for sites/cells
    if request.ne_names:
        filtered_df = filtered_df[filtered_df['ne_name'].isin(request.ne_names)]

    if request.cellnames:
        filtered_df = filtered_df[filtered_df['cellname'].isin(request.cellnames)]

    # Track cells included
    cells_included = filtered_df['cellname'].unique().tolist() if not filtered_df.empty else []

    # Aggregate if requested
    if request.aggregate and not filtered_df.empty:
        filtered_df = _aggregate_kpi_data(filtered_df)

    # Calculate derived metrics (success rates)
    filtered_df = _calculate_derived_metrics(filtered_df)

    # Convert to list of dictionaries
    filtered_df['datetime'] = filtered_df['datetime'].dt.strftime('%Y-%m-%d %H:%M:%S')
    data_records = filtered_df.to_dict('records')

    return HistoricalKPIResponse(
        task_type=request.task_type,
        timestamp=request.timestamp,
        time_window_hours=request.time_window_hours,
        start_time=start_time.isoformat(),
        end_time=end_time.isoformat(),
        records_count=len(data_records),
        kpi_columns=kpi_columns,
        aggregated=request.aggregate,
        cells_included=cells_included,
        data=data_records
    )


@router.get("/task-types")
async def get_task_types():
    """
    Get available task types and their associated KPI columns.

    Returns:
        Dictionary mapping task types to KPI column lists
    """
    return {
        "task_types": list(TASK_KPI_MAPPING.keys()),
        "mappings": TASK_KPI_MAPPING
    }


def _get_date_range(start_time: datetime, end_time: datetime) -> List[str]:
    """
    Get list of dates (YYYY-MM-DD) between start and end time.

    Args:
        start_time: Start datetime
        end_time: End datetime

    Returns:
        List of date strings in YYYY-MM-DD format
    """
    dates = []
    current = start_time.date()
    end_date = end_time.date()

    while current <= end_date:
        dates.append(current.strftime("%Y-%m-%d"))
        current += timedelta(days=1)

    return dates


def _load_kpi_files(dates: List[str], columns: List[str]) -> pd.DataFrame:
    """
    Load and combine KPI data from multiple CSV files.

    Args:
        dates: List of date strings (YYYY-MM-DD) to load
        columns: List of KPI columns to extract

    Returns:
        Combined DataFrame with specified columns

    Raises:
        FileNotFoundError: If any required file is missing
    """
    dfs = []
    missing_files = []

    for date in dates:
        file_path = KPI_DATA_DIR / f"kpi_5min_{date}.csv"

        if not file_path.exists():
            missing_files.append(str(file_path))
            continue

        try:
            # Read only required columns for efficiency
            df = pd.read_csv(file_path, usecols=lambda col: col in columns)
            dfs.append(df)
        except Exception as e:
            logger.warning(f"Error reading {file_path}: {e}")
            continue

    if not dfs:
        if missing_files:
            raise FileNotFoundError(
                f"No KPI data files found for dates {dates}. "
                f"Missing files: {missing_files[:3]}..."
            )
        else:
            raise FileNotFoundError(f"Failed to load any KPI data for dates {dates}")

    # Log if some files are missing
    if missing_files:
        logger.warning(f"Missing {len(missing_files)} KPI files: {missing_files[:3]}...")

    # Combine all dataframes
    combined_df = pd.concat(dfs, ignore_index=True)

    return combined_df


def _aggregate_kpi_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Aggregate KPI data across multiple cells using mean for numeric columns.
    Groups by datetime and computes mean of all numeric KPIs.

    Args:
        df: DataFrame with KPI data

    Returns:
        Aggregated DataFrame with mean values per timestamp
    """
    # Identify numeric columns (exclude datetime, ne_name, cellname)
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()

    # Group by datetime and aggregate
    agg_dict = {col: 'mean' for col in numeric_cols}
    aggregated = df.groupby('datetime', as_index=False).agg(agg_dict)

    # Add metadata columns
    aggregated['ne_name'] = 'AGGREGATED'
    aggregated['cellname'] = 'AGGREGATED'

    return aggregated


def _calculate_derived_metrics(df: pd.DataFrame) -> pd.DataFrame:
    """
    Calculate derived metrics like success rates from raw counters.

    Adds:
    - PSCell Change Inter-SgNB SR (%) = Succ / Att * 100
    - PSCell Change Intra-SgNB SR (%) = Succ / Att * 100

    Args:
        df: DataFrame with KPI data

    Returns:
        DataFrame with added derived metrics
    """
    df = df.copy()

    # Calculate Inter-SgNB Success Rate
    if 'PSCell Change Inter-SgNB Succ (#)' in df.columns and 'PSCell Change Inter-SgNB Att (#)' in df.columns:
        df['PSCell Change Inter-SgNB SR (%)'] = np.where(
            df['PSCell Change Inter-SgNB Att (#)'] > 0,
            (df['PSCell Change Inter-SgNB Succ (#)'] / df['PSCell Change Inter-SgNB Att (#)']) * 100,
            np.nan
        )

    # Calculate Intra-SgNB Success Rate
    if 'PSCell Change Intra-SgNB Succ (#)' in df.columns and 'PSCell Change Intra-SgNB Att (#)' in df.columns:
        df['PSCell Change Intra-SgNB SR (%)'] = np.where(
            df['PSCell Change Intra-SgNB Att (#)'] > 0,
            (df['PSCell Change Intra-SgNB Succ (#)'] / df['PSCell Change Intra-SgNB Att (#)']) * 100,
            np.nan
        )

    return df
