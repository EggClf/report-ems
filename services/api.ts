import { MOCK_REPORTS, MOCK_REPORT_CONTENT, generateMockKpiHistory, KpiDataPoint } from './mockData';

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

// Historical KPI API interfaces
export interface HistoricalKPIRequest {
    timestamp: string;
    time_window_hours: number;
    task_type: 'MRO' | 'ES' | 'all';
    ne_names?: string[];
    cellnames?: string[];
    aggregate: boolean;
}

export interface HistoricalKPIResponse {
    task_type: string;
    timestamp: string;
    time_window_hours: number;
    start_time: string;
    end_time: string;
    records_count: number;
    kpi_columns: string[];
    aggregated: boolean;
    cells_included: string[];
    data: Array<{
        datetime: string;
        ne_name: string;
        cellname: string;
        [key: string]: any;
    }>;
}

export interface KPIDelta {
    metric: string;
    before: number;
    after: number;
    delta: number;
    deltaPercent: number;
    timeWindowMinutes: number;
}

const formatLocalDateTime = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = String(date.getSeconds()).padStart(2, '0');

    const offsetMinutes = -date.getTimezoneOffset();
    const sign = offsetMinutes >= 0 ? '+' : '-';
    const absOffset = Math.abs(offsetMinutes);
    const offsetHours = String(Math.floor(absOffset / 60)).padStart(2, '0');
    const offsetMins = String(absOffset % 60).padStart(2, '0');

    return `${year}-${month}-${day}T${hour}:${minute}:${second}${sign}${offsetHours}:${offsetMins}`;
};

/**
 * Fetch historical KPI data from the backend
 */
export const fetchHistoricalKPI = async (request: HistoricalKPIRequest): Promise<HistoricalKPIResponse> => {
    try {
        const response = await fetch('http://172.16.28.63:8000/historical-kpi/extract', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch historical KPI: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching historical KPI:', error);
        throw error;
    }
};

/**
 * Calculate KPI deltas by comparing before and after periods
 * @param executionTimestamp - When the action was executed
 * @param cellnames - List of affected cell names
 * @param taskType - MRO or ES
 * @param beforeWindowHours - Hours to look back before execution (default: 2)
 * @param afterWindowHours - Hours to look forward after execution (default: 2)
 */
export const calculateKPIDeltas = async (
    executionTimestamp: string,
    cellnames: string[],
    taskType: 'MRO' | 'ES',
    beforeWindowHours: number = 2,
    afterWindowHours: number = 2
): Promise<KPIDelta[]> => {
    try {
        const executionTime = new Date(executionTimestamp);

        // Fetch "before" data
        const beforeEndTime = new Date(executionTime.getTime() - 5 * 60 * 1000); // 5 min before execution
        const beforeRequest: HistoricalKPIRequest = {
            timestamp: formatLocalDateTime(beforeEndTime),
            time_window_hours: beforeWindowHours,
            task_type: taskType,
            cellnames,
            aggregate: true,
        };
        const beforeData = await fetchHistoricalKPI(beforeRequest);

        // Fetch "after" data
        const afterStartTime = new Date(executionTime.getTime() + 5 * 60 * 1000); // 5 min after execution
        const afterEndTime = new Date(afterStartTime.getTime() + afterWindowHours * 60 * 60 * 1000);
        const afterRequest: HistoricalKPIRequest = {
            timestamp: formatLocalDateTime(afterEndTime),
            time_window_hours: afterWindowHours,
            task_type: taskType,
            cellnames,
            aggregate: true,
        };
        const afterData = await fetchHistoricalKPI(afterRequest);

        // Calculate average values for before and after periods
        const deltas: KPIDelta[] = [];
        const metrics = getMetricsForTaskType(taskType);

        metrics.forEach((metric) => {
            const beforeValues = beforeData.data.map((record) => record[metric]).filter((v) => v != null && !isNaN(v));
            const afterValues = afterData.data.map((record) => record[metric]).filter((v) => v != null && !isNaN(v));

            if (beforeValues.length > 0 && afterValues.length > 0) {
                const beforeAvg = beforeValues.reduce((a, b) => a + b, 0) / beforeValues.length;
                const afterAvg = afterValues.reduce((a, b) => a + b, 0) / afterValues.length;
                const delta = afterAvg - beforeAvg;
                const deltaPercent = beforeAvg !== 0 ? (delta / beforeAvg) * 100 : 0;

                deltas.push({
                    metric,
                    before: beforeAvg,
                    after: afterAvg,
                    delta,
                    deltaPercent,
                    timeWindowMinutes: beforeWindowHours * 60,
                });
            }
        });

        return deltas;
    } catch (error) {
        console.error('Error calculating KPI deltas:', error);
        return [];
    }
};

/**
 * Get relevant metrics for a task type
 */
function getMetricsForTaskType(taskType: 'MRO' | 'ES'): string[] {
    if (taskType === 'MRO') {
        return [
            'TU PRB DL (%)',
            'NR DL User Throughput Mbps (Mbps)',
            'EN-DC CDR (%)',
            'PSCell Change Inter-SgNB SR (%)',
            'PSCell Change Intra-SgNB SR (%)',
        ];
    } else {
        return [
            'TU PRB DL (%)',
            'TU PRB UL (%)',
            'NR DL User Throughput Mbps (Mbps)',
            'Power Consumption (Wh)',
            'Max RRC Connected SA User (UE)',
            'EN-DC CDR (%)',
        ];
    }
}
