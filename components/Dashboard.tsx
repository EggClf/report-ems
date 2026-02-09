import React, { useState, useEffect } from 'react';
import {
  Network,
  Server,
  RefreshCw,
  Bell
} from 'lucide-react';
import { fetchReports, fetchReportContent, Report } from '../services/api';
import { ReportList } from './ReportList';
import { ReportViewer } from './ReportViewer';
import { RealtimeDashboard } from './RealtimeDashboard';

export const Dashboard: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [reportContent, setReportContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [lastVisit, setLastVisit] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [reportType, setReportType] = useState<'MRO' | 'ES'>('MRO');
  const [viewMode, setViewMode] = useState<'reports' | 'realtime'>('reports');
  const [readReports, setReadReports] = useState<string[]>([]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await fetchReports(reportType);
      setReports(data);
      if (data.length > 0 && !selectedReport) {
        // Optionally select the first report automatically
        // handleSelectReport(data[0]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  const handleSelectReport = async (report: Report) => {
    setSelectedReport(report);

    // Mark as read
    if (!readReports.includes(report.filename)) {
      const newReadReports = [...readReports, report.filename];
      setReadReports(newReadReports);
      localStorage.setItem('read_reports', JSON.stringify(newReadReports));
    }

    setReportContent(''); // Clear previous content
    const content = await fetchReportContent(report.filename, reportType);
    setReportContent(content);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadReports();
  };

  useEffect(() => {
    // 1. Get last visit from storage
    const storedLastVisit = localStorage.getItem('last_visit');
    if (storedLastVisit) {
      setLastVisit(new Date(storedLastVisit));
    } else {
      // First visit: set to now so nothing is "new", or null to show everything new?
      // Let's set to now-ish so strictly new things appear.
      setLastVisit(new Date());
    }

    // 2. Update storage for NEXT visit
    localStorage.setItem('last_visit', new Date().toISOString());

    // 3. Load read reports
    const storedReadReports = localStorage.getItem('read_reports');
    if (storedReadReports) {
      try {
        setReadReports(JSON.parse(storedReadReports));
      } catch (e) {
        console.error("Failed to parse read reports", e);
      }
    }

    loadReports();
  }, [reportType]);

  const unreadCount = reports.filter(r => !readReports.includes(r.filename)).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-12">
      {/* Navbar */}
      <nav className="bg-slate-900 text-white px-6 py-4 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <Network className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">VULCAN<span className="text-indigo-400">EMS</span></h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Viettel Unified Logic and Control for Autonomous Network</p>
            </div>
          </div>

          <div className="flex items-center gap-4">

            {/* Notification Bell */}
            <div className="relative p-2 bg-slate-800 rounded-lg">
              <Bell className="w-5 h-5 text-slate-300" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-slate-900 border-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>

            {/* View Mode Switch */}

            {/* View Mode Switch */}
            <div className="bg-slate-800 p-1 rounded-lg flex items-center border border-slate-700 mr-2">
              <button
                onClick={() => setViewMode('reports')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${viewMode === 'reports'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
                  }`}
              >
                Reports
              </button>
              <button
                onClick={() => setViewMode('realtime')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${viewMode === 'realtime'
                  ? 'bg-red-600 text-white shadow-sm animate-pulse'
                  : 'text-slate-400 hover:text-slate-200'
                  }`}
              >
                Real-time
              </button>
            </div>

            {viewMode === 'reports' && (
              <>
                {/* Report Type Toggle */}
                <div className="bg-slate-800 p-1 rounded-lg flex items-center border border-slate-700">
                  <button
                    onClick={() => setReportType('MRO')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${reportType === 'MRO'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                      }`}
                  >
                    MRO
                  </button>
                  <button
                    onClick={() => setReportType('ES')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${reportType === 'ES'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                      }`}
                  >
                    ES
                  </button>
                </div>

                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className={`text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-md border border-slate-700 transition-colors flex items-center gap-2 ${refreshing ? 'opacity-70 cursor-wait' : ''}`}
                >
                  <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Refreshing...' : 'Refresh Reports'}
                </button>
              </>
            )}
            <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold ring-2 ring-slate-800">
              OP
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 space-y-6">
        {viewMode === 'realtime' ? (
          <RealtimeDashboard />
        ) : (
          <>
            {/* Header Metadata */}
            <header className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-100 rounded-full">
                  <Server className="w-6 h-6 text-slate-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    {reportType} Report Dashboard
                  </h2>
                  <div className="text-xs text-slate-500 mt-1">
                    View generated {reportType} analysis reports
                  </div>
                </div>
              </div>
            </header>

            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

              {/* LEFT COL: Report List (4 cols) */}
              <div className="lg:col-span-4 space-y-6 sticky top-24">
                <ReportList
                  reports={reports}
                  onSelectReport={handleSelectReport}
                  selectedReport={selectedReport}
                  readReports={readReports}
                />
              </div>

              {/* RIGHT COL: Report Content (8 cols) */}
              <div className="lg:col-span-8 space-y-6">
                {selectedReport ? (
                  <ReportViewer report={selectedReport} content={reportContent} />
                ) : (
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center h-[600px] flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                      <FileText className="w-8 h-8 text-indigo-500" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Select a Report</h3>
                    <p className="text-slate-500 max-w-sm">
                      Choose a report from the list on the left to view the detailed analysis and visualizations.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

// Add FileText icon if missing
function FileText(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
      <line x1="10" x2="8" y1="9" y2="9" />
    </svg>
  );
}