import React from 'react';
import { FileText, Clock, ChevronRight } from 'lucide-react';
import { Report } from '../services/api';

interface ReportListProps {
    reports: Report[];
    onSelectReport: (report: Report) => void;
    selectedReport: Report | null;
    readReports: string[];
}

export const ReportList: React.FC<ReportListProps> = ({ reports, onSelectReport, selectedReport, readReports }) => {
    if (reports.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200 shadow-sm">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-slate-900">No Reports Found</h3>
                <p className="text-slate-500 max-w-sm mx-auto mt-1">
                    Generate a new report from the backend to see it listed here.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-500" />
                    Available Reports
                </h3>
                <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs font-bold">
                    {reports.length}
                </span>
            </div>

            <div className="divide-y divide-slate-100">
                {reports.map((report) => (
                    <button
                        key={report.filename}
                        onClick={() => onSelectReport(report)}
                        className={`w-full text-left px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors ${selectedReport?.filename === report.filename ? 'bg-indigo-50/50 border-l-4 border-indigo-500 pl-[20px]' : 'pl-6'
                            }`}
                    >
                        <div>
                            <div className="font-medium text-slate-900 mb-1 truncate max-w-[200px] sm:max-w-xs flex items-center gap-2" title={report.filename}>
                                {report.filename.split('/').pop() || report.filename}
                                {!readReports.includes(report.filename) && (
                                    <span className="bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-red-200 animate-pulse">
                                        NEW
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-500">
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {report.created}
                                </span>
                                <span className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200">
                                    {(report.size / 1024).toFixed(1)} KB
                                </span>
                            </div>
                        </div>
                        <ChevronRight className={`w-4 h-4 transition-transform ${selectedReport?.filename === report.filename ? 'text-indigo-500 translate-x-1' : 'text-slate-300'
                            }`} />
                    </button>
                ))}
            </div>
        </div>
    );
};
