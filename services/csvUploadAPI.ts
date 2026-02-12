/**
 * CSV Upload API Service
 * Provides methods to upload, retrieve, list, and delete CSV data
 * for the Admin Panel / Action Planner Detailed Data tab.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://172.16.28.63:8181';

export interface CSVUploadResponse {
  status: string;
  message: string;
  date: string;
  task_type: 'ES' | 'MRO';
  label: string;
  rows: number;
  columns: string[];
  filename: string;
}

export interface CSVDataResponse {
  date: string;
  task_type: 'ES' | 'MRO';
  label: string;
  columns: string[];
  rows: number;
  data: Record<string, any>[];
  original_filename: string;
  uploaded_at: string;
}

export interface CSVUploadEntry {
  key: string;
  date: string;
  task_type: 'ES' | 'MRO';
  label: string;
  original_filename: string;
  stored_filename: string;
  rows: number;
  columns: string[];
  uploaded_at: string;
}

export interface CSVListResponse {
  total: number;
  uploads: CSVUploadEntry[];
}

/**
 * Upload a CSV file for a given date and task type.
 * @param label - Optional label: 'before_plan' or 'after_plan' for evaluation uploads
 */
export const uploadCSV = async (
  file: File,
  date: string,
  taskType: 'ES' | 'MRO',
  label: string = ''
): Promise<CSVUploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('date', date);
  formData.append('task_type', taskType);
  if (label) formData.append('label', label);

  const response = await fetch(`${API_BASE_URL}/admin/csv/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(err.detail || `Upload failed: ${response.status}`);
  }

  return response.json();
};

/**
 * Retrieve the CSV data for a given date, task type, and optional label.
 */
export const fetchCSVData = async (
  date: string,
  taskType: 'ES' | 'MRO',
  label: string = ''
): Promise<CSVDataResponse> => {
  const params = new URLSearchParams({ date, task_type: taskType });
  if (label) params.append('label', label);
  const response = await fetch(`${API_BASE_URL}/admin/csv/data?${params}`, {
    method: 'GET',
    headers: { accept: 'application/json' },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new NotFoundError(`No CSV data for ${taskType} on ${date}`);
    }
    const err = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(err.detail || `Fetch failed: ${response.status}`);
  }

  return response.json();
};

/**
 * List all uploaded CSVs.
 */
export const listCSVUploads = async (): Promise<CSVListResponse> => {
  const response = await fetch(`${API_BASE_URL}/admin/csv/list`, {
    method: 'GET',
    headers: { accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`List failed: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Delete an uploaded CSV.
 */
export const deleteCSV = async (
  date: string,
  taskType: 'ES' | 'MRO',
  label: string = ''
): Promise<void> => {
  const params = new URLSearchParams({ date, task_type: taskType });
  if (label) params.append('label', label);
  const response = await fetch(`${API_BASE_URL}/admin/csv/delete?${params}`, {
    method: 'DELETE',
    headers: { accept: 'application/json' },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(err.detail || `Delete failed: ${response.status}`);
  }
};

/**
 * Custom error class for 404 responses.
 */
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}
