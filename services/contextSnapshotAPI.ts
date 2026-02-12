/**
 * Context Snapshot API Service
 * Fetches paginated cell context snapshot data from the backend.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://172.16.28.63:8181';

export interface ContextSnapshotRow {
  context_snapshot_id?: string;
  cell_name?: string;
  time_bucket?: string;
  metadata?: string;
  common_sense?: string;
  kpi?: string;
  alarm?: string;
  [key: string]: any; // remaining dynamic columns
}

export interface ContextSnapshotResponse {
  total: number;
  page: number;
  page_size: number;
  columns: string[];
  data: ContextSnapshotRow[];
}

export const fetchContextSnapshot = async (
  page: number = 1,
  pageSize: number = 50,
  cellName?: string,
  startTime?: string,
  endTime?: string,
): Promise<ContextSnapshotResponse> => {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  if (cellName) params.append('cell_name', cellName);
  if (startTime) params.append('start_time', startTime);
  if (endTime) params.append('end_time', endTime);

  const response = await fetch(`${API_BASE_URL}/context-snapshot/data?${params}`, {
    method: 'GET',
    headers: { accept: 'application/json' },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(err.detail || `Fetch context snapshot failed: ${response.status}`);
  }

  return response.json();
};
