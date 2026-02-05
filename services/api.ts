import { MOCK_REPORTS, MOCK_REPORT_CONTENT, generateMockKpiHistory, KpiDataPoint, generateMockMetrics } from './mockData';
import { MetricsSnapshot } from '../types';

export interface Report {
    filename: string;
    path: string;
    size: number;
    created: string;
    download_url: string;
    request_id: string;
    report_type: 'MRO' | 'ES' | 'unknown';
}

export interface ReportListResponse {
    total_reports: number;
    reports: Report[];
}

export const fetchReports = async (type: 'MRO' | 'ES' = 'MRO'): Promise<Report[]> => {
    try {
        const response = await fetch('/network-manager/reports/list');
        if (!response.ok) {
            throw new Error(`Failed to fetch reports: ${response.statusText}`);
        }
        const data: ReportListResponse = await response.json();
        // Client-side filtering as backend now returns all reports
        return data.reports.filter((report) => report.report_type === type);
    } catch (error) {
        console.warn('Error fetching reports, using mock data:', error);
        return MOCK_REPORTS;
    }
};

// Note: We don't need 'type' arg anymore for the URL, but keeping signature compatible if needed, or remove it.
// The backend now accepts full path (which filename likely contains)
export const fetchReportContent = async (filename: string, reportType?: string): Promise<string> => {
    try {
        // Filename from backend is a relative path like "network_agent/request_.../report.md"
        // We need to encode it properly for the URL
        const encodedPath = encodeURIComponent(filename);
        const response = await fetch(`/network-manager/reports/download/${encodedPath}`);
        if (!response.ok) {
            throw new Error(`Failed to download report: ${response.statusText}`);
        }
        return await response.text();
    } catch (error) {
        console.warn('Error fetching report content, using mock data:', error);
        return MOCK_REPORT_CONTENT;
    }
};

export const fetchRealtimeKpi = async (cellId: string, hours: number = 4): Promise<KpiDataPoint[]> => {
    try {
        // In the future this will be: 
        // const response = await fetch(`/kpi/data/realtime?cell_id=${cellId}&hours=${hours}`);
        // return await response.json();

        // Mock Implementation
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(generateMockKpiHistory(hours, cellId));
            }, 300); // Simulate network delay
        });
    } catch (error) {
        console.warn('Error fetching realtime KPI:', error);
        return [];
    }
};

export const fetchMetricsSnapshot = async (): Promise<MetricsSnapshot> => {
    try {
        // In the future this will be:
        // const response = await fetch('/metrics/snapshot');
        // return await response.json();

        // Mock Implementation
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(generateMockMetrics());
            }, 300);
        });
    } catch (error) {
        console.warn('Error fetching metrics snapshot:', error);
        return generateMockMetrics();
    }
};
