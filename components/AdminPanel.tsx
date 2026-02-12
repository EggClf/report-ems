import React, { useState, useRef, useCallback } from 'react';
import {
  Upload, Calendar, FileSpreadsheet, CheckCircle, AlertCircle,
  X, Loader2, Trash2, Shield
} from 'lucide-react';
import { uploadCSV, deleteCSV, listCSVUploads, CSVUploadEntry } from '../services/csvUploadAPI';

interface AdminPanelProps {
  /** Currently selected date in the dashboard (synced with navbar calendar) */
  selectedDate: Date;
  /** Currently selected task type in the dashboard */
  selectedModelType: 'ES' | 'MRO';
  /** Called after a successful upload so the dashboard can refresh CSV data */
  onUploadSuccess: (date: string, taskType: 'ES' | 'MRO', label: string) => void;
  /** Whether the panel is visible */
  isOpen: boolean;
  /** Toggle panel visibility */
  onClose: () => void;
}

const formatDateForInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const AdminPanel: React.FC<AdminPanelProps> = ({
  selectedDate,
  selectedModelType,
  onUploadSuccess,
  isOpen,
  onClose,
}) => {
  // Upload form state — initialise from dashboard's current selection
  const [uploadDate, setUploadDate] = useState<string>(formatDateForInput(selectedDate));
  const [uploadTaskType, setUploadTaskType] = useState<'ES' | 'MRO'>(selectedModelType);
  const [uploadLabel, setUploadLabel] = useState<string>('before_plan');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ ok: boolean; message: string } | null>(null);

  // Upload history
  const [uploads, setUploads] = useState<CSVUploadEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync with dashboard selection when panel opens
  React.useEffect(() => {
    if (isOpen) {
      setUploadDate(formatDateForInput(selectedDate));
      setUploadTaskType(selectedModelType);
      setUploadResult(null);
      if (!historyLoaded) loadHistory();
    }
  }, [isOpen, selectedDate, selectedModelType]);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await listCSVUploads();
      setUploads(res.uploads);
      setHistoryLoaded(true);
    } catch {
      // silent
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    setUploadResult(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setUploadResult(null);
    try {
      const res = await uploadCSV(selectedFile, uploadDate, uploadTaskType, uploadLabel);
      const labelDisplay = uploadLabel === 'before_plan' ? 'Before Plan' : 'After Plan';
      setUploadResult({ ok: true, message: `Uploaded "${res.filename}" [${labelDisplay}] — ${res.rows} rows, ${res.columns.length} columns` });
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      onUploadSuccess(uploadDate, uploadTaskType, uploadLabel);
      loadHistory();
    } catch (err: any) {
      setUploadResult({ ok: false, message: err.message || 'Upload failed' });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (entry: CSVUploadEntry) => {
    const labelDisplay = entry.label ? ` [${entry.label === 'before_plan' ? 'Before' : 'After'}]` : '';
    if (!confirm(`Delete CSV for ${entry.task_type} on ${entry.date}${labelDisplay}?`)) return;
    try {
      await deleteCSV(entry.date, entry.task_type, entry.label || '');
      setUploads((prev) => prev.filter((u) => u.key !== entry.key));
      // Notify parent to refresh if it matches current view
      onUploadSuccess(entry.date, entry.task_type, entry.label || '');
    } catch (err: any) {
      alert(err.message || 'Delete failed');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-[#44494D] to-[#241D1E]">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-[#EE0434]" />
            <div>
              <h2 className="text-lg font-bold text-white">Admin Panel</h2>
              <p className="text-xs text-slate-300">Upload CSV data for Action Planner</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* ─── Upload Form ───────────────────────────────────── */}
          <section>
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Upload className="w-4 h-4 text-indigo-600" />
              Upload CSV
            </h3>

            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Date Picker */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
                <div className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg bg-white">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    value={uploadDate}
                    onChange={(e) => setUploadDate(e.target.value)}
                    max={formatDateForInput(new Date())}
                    className="bg-transparent text-sm font-medium border-none outline-none cursor-pointer flex-1 text-slate-700"
                  />
                </div>
              </div>

              {/* Task Type */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Task Type</label>
                <div className="flex items-center gap-1 px-1 py-1 border border-slate-300 rounded-lg bg-white">
                  <button
                    onClick={() => setUploadTaskType('ES')}
                    className={`flex-1 px-3 py-2 text-sm font-semibold rounded transition-colors ${
                      uploadTaskType === 'ES'
                        ? 'bg-green-500 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    ES
                  </button>
                  <button
                    onClick={() => setUploadTaskType('MRO')}
                    className={`flex-1 px-3 py-2 text-sm font-semibold rounded transition-colors ${
                      uploadTaskType === 'MRO'
                        ? 'bg-blue-500 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    MRO
                  </button>
                </div>
              </div>
            </div>

            {/* Evaluation Label */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-600 mb-1">Evaluation Label</label>
              <div className="flex items-center gap-1 px-1 py-1 border border-slate-300 rounded-lg bg-white">
                <button
                  onClick={() => setUploadLabel('before_plan')}
                  className={`flex-1 px-3 py-2 text-sm font-semibold rounded transition-colors ${
                    uploadLabel === 'before_plan'
                      ? 'bg-amber-500 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Before Plan
                </button>
                <button
                  onClick={() => setUploadLabel('after_plan')}
                  className={`flex-1 px-3 py-2 text-sm font-semibold rounded transition-colors ${
                    uploadLabel === 'after_plan'
                      ? 'bg-emerald-500 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  After Plan
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Upload KPI data before and after applying the plan for evaluation comparison.</p>
            </div>

            {/* File Input */}
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-indigo-400 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                id="csv-upload-input"
              />
              <label htmlFor="csv-upload-input" className="cursor-pointer">
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                    <span className="text-sm font-medium text-slate-700">{selectedFile.name}</span>
                    <span className="text-xs text-slate-400">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                    <p className="text-sm text-slate-500">Click to select a CSV file</p>
                    <p className="text-xs text-slate-400 mt-1">Only .csv files are accepted</p>
                  </div>
                )}
              </label>
            </div>

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className={`mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                !selectedFile || uploading
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-[#EE0434] text-white hover:bg-[#C0042B]'
              }`}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload {uploadLabel === 'before_plan' ? 'Before' : 'After'} Plan CSV for {uploadTaskType} on {uploadDate}
                </>
              )}
            </button>

            {/* Result Banner */}
            {uploadResult && (
              <div className={`mt-3 flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm ${
                uploadResult.ok
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {uploadResult.ok ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {uploadResult.message}
              </div>
            )}
          </section>

          {/* ─── Upload History ─────────────────────────────────── */}
          <section>
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-slate-500" />
              Uploaded Files
            </h3>

            {historyLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              </div>
            ) : uploads.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No files uploaded yet.</p>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="px-3 py-2 text-left font-semibold text-slate-600 border-b border-slate-200">Date</th>
                      <th className="px-3 py-2 text-center font-semibold text-slate-600 border-b border-slate-200">Type</th>
                      <th className="px-3 py-2 text-center font-semibold text-slate-600 border-b border-slate-200">Label</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-600 border-b border-slate-200">File</th>
                      <th className="px-3 py-2 text-center font-semibold text-slate-600 border-b border-slate-200">Rows</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-600 border-b border-slate-200">Uploaded</th>
                      <th className="px-3 py-2 text-center font-semibold text-slate-600 border-b border-slate-200">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uploads
                      .sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime())
                      .map((entry) => (
                        <tr key={entry.key} className="hover:bg-slate-50">
                          <td className="px-3 py-2 border-b border-slate-100 font-mono text-slate-700">{entry.date}</td>
                          <td className="px-3 py-2 border-b border-slate-100 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              entry.task_type === 'ES'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {entry.task_type}
                            </span>
                          </td>
                          <td className="px-3 py-2 border-b border-slate-100 text-center">
                            {entry.label ? (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                entry.label === 'before_plan'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}>
                                {entry.label === 'before_plan' ? 'Before' : 'After'}
                              </span>
                            ) : (
                              <span className="text-slate-300">&mdash;</span>
                            )}
                          </td>
                          <td className="px-3 py-2 border-b border-slate-100 text-slate-600 truncate max-w-[160px]">{entry.original_filename}</td>
                          <td className="px-3 py-2 border-b border-slate-100 text-center text-slate-600">{entry.rows}</td>
                          <td className="px-3 py-2 border-b border-slate-100 text-slate-500">{new Date(entry.uploaded_at).toLocaleString()}</td>
                          <td className="px-3 py-2 border-b border-slate-100 text-center">
                            <button
                              onClick={() => handleDelete(entry)}
                              className="text-red-400 hover:text-red-600 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-400 text-center">
          Upload <strong>Before Plan</strong> and <strong>After Plan</strong> CSV data to compare KPI values in the Evaluation chart.
        </div>
      </div>
    </div>
  );
};
