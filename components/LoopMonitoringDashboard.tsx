import React, { useState, useEffect, useRef } from 'react';
import { Network, Calendar, Activity, Menu } from 'lucide-react';
import { OverviewPanel } from './OverviewPanel';
import { HotspotsMapPanel } from './HotspotsMapPanel';
import { CellsTablePanel } from './CellsTablePanel';
import { DecisionTreeTracePanel } from './DecisionTreeTracePanel';
import { PlannerOutputPanel } from './PlannerOutputPanel';
import { ExecutionOutcomePanel } from './ExecutionOutcomePanel';
import { IntentLegend } from './IntentLegend';
import { SidebarNavigation } from './SidebarNavigation';
import { QuickStatsBar } from './QuickStatsBar';
import {
  getMockOverviewData,
  getMockPlannerOutput,
  getMockExecutionOutcome
} from '../services/mockDataV2';
import { networkScanAPI, CellFeatures } from '../services/networkScanAPI';
import { mlModelAPI } from '../services/mlModelAPI';
import { calculateKPIDeltas, fetchPlanData, PlanLoadResponse, fetchCurrentAlarms, AlarmRecord } from '../services/api';
import { Hotspot, ExecutionOutcome, ExecutionStatus, Priority } from '../types-v2';
import { DecisionTreeTrace } from '../types-v2';

export const LoopMonitoringDashboard: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [selectedCell, setSelectedCell] = useState<CellFeatures | null>(null);
  const [selectedModelType, setSelectedModelType] = useState<'ES' | 'MRO'>('ES');
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [cellsLoading, setCellsLoading] = useState(true);
  const [decisionTraceLoading, setDecisionTraceLoading] = useState(false);

  // Refs for scroll tracking
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Load mock data for overview/hotspots
  const [overviewData, setOverviewData] = useState(() => getMockOverviewData());
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);

  // Real cell data from network scan
  const [cells, setCells] = useState<CellFeatures[]>([]);
  const [networkScanData, setNetworkScanData] = useState<any>(null);

  // Decision trace and planner data
  const [decisionTrace, setDecisionTrace] = useState<DecisionTreeTrace | null>(null);
  const [plannerOutput, setPlannerOutput] = useState<any>(null);
  const [executionOutcome, setExecutionOutcome] = useState<any>(null);

  // Real plan data from backend
  const [planData, setPlanData] = useState<PlanLoadResponse | null>(null);
  const [planLoading, setPlanLoading] = useState(false);

  // Real alarm data from backend
  const [alarmData, setAlarmData] = useState<AlarmRecord[]>([]);
  const [alarmsLoading, setAlarmsLoading] = useState(false);

  // Load cell data when date changes
  useEffect(() => {
    loadCellData(selectedDate);
  }, [selectedDate]);

  // Load alarm data on mount and periodically
  useEffect(() => {
    loadAlarmData();
    // Refresh alarms every 30 seconds
    const intervalId = setInterval(loadAlarmData, 30000);
    return () => clearInterval(intervalId);
  }, []);

  // Auto-load plan data when date or task type changes
  useEffect(() => {
    loadPlanData(selectedDate, selectedModelType);
  }, [selectedDate, selectedModelType]);

  // Load cell data from network scan API
  const loadCellData = async (date: Date) => {
    setCellsLoading(true);
    try {
      const data = await networkScanAPI.fetchNetworkScan(date);
      setNetworkScanData(data);

      // Merge MRO and ES features
      const mergedCells = networkScanAPI.mergeCellFeatures(data.mro_features, data.es_features);
      setCells(mergedCells);

      console.log(`✓ Loaded ${mergedCells.length} cells from network scan`);
    } catch (error) {
      console.error('Failed to load cell data:', error);
    } finally {
      setCellsLoading(false);
    }
  };

  // Load plan data from backend
  const loadPlanData = async (date: Date, taskType: 'ES' | 'MRO') => {
    setPlanLoading(true);
    try {
      const dateStr = formatDateForInput(date);
      const realPlan = await fetchPlanData({ task_type: taskType, date: dateStr });
      setPlanData(realPlan);
      console.log(`✓ Loaded ${taskType} plan for ${dateStr}`);
    } catch (error) {
      console.error(`Failed to fetch ${taskType} plan data:`, error);
      setPlanData(null);
    } finally {
      setPlanLoading(false);
    }
  };

  // Load alarm data from backend
  const loadAlarmData = async () => {
    setAlarmsLoading(true);
    try {
      const response = await fetchCurrentAlarms();
      setAlarmData(response.data);
      console.log(`✓ Loaded ${response.records_count} active alarms`);
    } catch (error) {
      console.error('Failed to load alarm data:', error);
      setAlarmData([]);
    } finally {
      setAlarmsLoading(false);
    }
  };

  // Transform alarm data to Alert format
  const transformAlarmsToAlerts = (alarms: AlarmRecord[]) => {
    return alarms.map((alarm) => {
      // Map backend severity to frontend priority
      let severity: Priority;
      switch (alarm.severity) {
        case 'CRITICAL':
          severity = 'critical';
          break;
        case 'MAJOR':
          severity = 'high';
          break;
        case 'MINOR':
          severity = 'medium';
          break;
        case 'WARNING':
          severity = 'low';
          break;
        default:
          severity = 'medium';
      }

      return {
        id: `alarm_${alarm.event_id}`,
        type: 'kpi_guardrail_violated' as const,
        message: `${alarm.event_name}: ${alarm.specific_problem}`,
        timestamp: new Date(alarm.trigger_instant),
        severity,
      };
    });
  };

  // Scroll tracking for active section
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200; // Offset for header

      const sectionIds = ['overview', 'legend', 'hotspots', 'cells', 'decision-trace', 'planner', 'execution'];

      for (const id of sectionIds) {
        const element = sectionRefs.current[id];
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleNavigate = (sectionId: string) => {
    const element = sectionRefs.current[sectionId];
    if (element) {
      const yOffset = -80; // Account for fixed header
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Parse date string to avoid timezone issues
    const [year, month, day] = e.target.value.split('-').map(Number);
    const newDate = new Date(year, month - 1, day);
    setSelectedDate(newDate);
    setLastUpdate(new Date());
  };

  const handleHotspotClick = (hotspot: Hotspot) => {
    // Navigate to cells section when hotspot clicked
    handleNavigate('cells');
  };
  /**
   * Build ExecutionOutcome with real KPI data from backend
   */
  const getExecutionTimeForDate = (date: Date): Date => {
    const normalized = new Date(date);
    const now = new Date();
    if (normalized.toDateString() === now.toDateString()) {
      normalized.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), 0);
    } else {
      normalized.setHours(12, 0, 0, 0);
    }
    return normalized;
  };

  const buildExecutionOutcome = async (
    planId: string,
    intentId: string,
    cellname: string,
    taskType: 'MRO' | 'ES',
    executionDate: Date
  ): Promise<ExecutionOutcome> => {
    const executionTime = getExecutionTimeForDate(executionDate);
    const executionId = `exec_${Date.now()}`;

    // Fetch real KPI deltas from backend
    let kpiDeltas = [];
    try {
      kpiDeltas = await calculateKPIDeltas(
        executionTime.toISOString(),
        [cellname],
        taskType,
        2, // 2 hours before
        2  // 2 hours after
      );
    } catch (error) {
      console.error('Failed to calculate KPI deltas:', error);
      // Fallback to mock if API fails
      return getMockExecutionOutcome(planId, intentId);
    }

    // Calculate correlation score based on KPI improvements
    const improvements = kpiDeltas.filter((kpi) => {
      const isPositive = kpi.deltaPercent > 0;
      // Define improvement criteria per metric
      if (kpi.metric.includes('Throughput') || kpi.metric.includes('SR')) {
        return isPositive; // Higher is better
      } else if (kpi.metric.includes('CDR') || kpi.metric.includes('PRB') || kpi.metric.includes('Power')) {
        return !isPositive; // Lower is better
      }
      return isPositive;
    });

    const correlationScore = kpiDeltas.length > 0 ? improvements.length / kpiDeltas.length : 0;

    return {
      executionId,
      planId,
      intentId,
      logs: [
        {
          executionId,
          planId,
          intentId,
          status: 'sent' as ExecutionStatus,
          timestamp: new Date(executionTime.getTime()),
          targetCell: cellname,
        },
        {
          executionId,
          planId,
          intentId,
          status: 'ack' as ExecutionStatus,
          timestamp: new Date(executionTime.getTime() + 2000),
          targetCell: cellname,
        },
        {
          executionId,
          planId,
          intentId,
          status: 'applied' as ExecutionStatus,
          timestamp: new Date(executionTime.getTime() + 5000),
          targetCell: cellname,
        },
      ],
      kpiDeltas,
      attribution: {
        success: correlationScore > 0.6,
        correlationScore,
      },
      rateLimiting: {
        cooldownMinutes: 30,
        actionsRemainingInWindow: 5,
      },
    };
  };
const handleCellClick = async (cell: CellFeatures, modelType: 'ES' | 'MRO') => {
    setSelectedCell(cell);
    setSelectedModelType(modelType);
    setDecisionTraceLoading(true);

    try {
      // Extract features for the selected model
      const features = networkScanAPI.extractMLFeatures(cell, modelType);

      console.log(`Running ${modelType} prediction for cell ${cell.cellname}...`);

      // Get decision trace from ML API
      const trace = await mlModelAPI.getDecisionTreeTrace(
        cell.intent_id || `cell_${cell.cellname}`,
        modelType,
        features
      );

      setDecisionTrace(trace);

      // Update task type to match cell prediction
      if (modelType !== selectedModelType) {
        setSelectedModelType(modelType);
        // Plan will auto-reload via useEffect
      }

      // Generate planner output (kept for execution outcome)
      const newPlannerOutput = getMockPlannerOutput(trace.intentId);
      setPlannerOutput(newPlannerOutput);

      // Fetch execution outcome with real KPI data from backend
      const outcome = await buildExecutionOutcome(
        newPlannerOutput.planId,
        trace.intentId,
        cell.cellname,
        modelType,
        selectedDate
      );
      setExecutionOutcome(outcome);

      console.log(`✓ ${modelType} prediction complete:`, trace.decision);
    } catch (error) {
      console.error('Failed to get ML prediction:', error);
      // Could show error toast here
    } finally {
      setDecisionTraceLoading(false);
    }

    // Navigate to decision trace section
    handleNavigate('decision-trace');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar Navigation */}
      <SidebarNavigation
        activeSection={activeSection}
        onNavigate={handleNavigate}
        loopStatus={overviewData.loopStatus}
        alertCount={alarmData.length}
        intentCount={cells.length}
        hotspotCount={hotspots.length}
        isExpanded={sidebarExpanded}
        onToggleExpanded={() => setSidebarExpanded(!sidebarExpanded)}
      />
      {/* Navbar */}
      <nav className="bg-[#f8f0ea] px-6 py-4 shadow-md sticky top-0 z-50 border-b-3" style={{ borderBottomColor: '#ee0434', borderBottomWidth: '3px' }}>
        <div className="max-w-[1920px] mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10">
              <img src="/logo_vulcan.png" alt="VULCAN Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight" style={{ color: '#9E3B3B' }}>
                VULCAN
              </h1>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: '#D25353' }}>
                <b>V</b>iettel <b>U</b>nified <b>L</b>ogic & <b>C</b>ontrol for <b>A</b>utonomous <b>N</b>etwork
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Last Update */}
            <div className="text-xs" style={{ color: '#9E3B3B' }}>
              Last updated: {lastUpdate.toLocaleTimeString()}
            </div>

            {/* Date Picker */}
            <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-sm" style={{ borderColor: '#EA7B7B', borderWidth: '1px' }}>
              <Calendar className="w-4 h-4" style={{ color: '#ee0434' }} />
              <input
                type="date"
                value={formatDateForInput(selectedDate)}
                onChange={handleDateChange}
                max={formatDateForInput(new Date())}
                className="bg-transparent text-sm font-medium border-none outline-none cursor-pointer"
                style={{ color: '#9E3B3B' }}
              />
            </div>

            {/* Task Type Toggle */}
            <div className="flex items-center gap-1 px-1 py-1 bg-white rounded-lg shadow-sm" style={{ borderColor: '#EA7B7B', borderWidth: '1px' }}>
              <button
                onClick={() => setSelectedModelType('ES')}
                className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                  selectedModelType === 'ES'
                    ? 'bg-green-500 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                title="Energy Saving"
              >
                ES
              </button>
              <button
                onClick={() => setSelectedModelType('MRO')}
                className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                  selectedModelType === 'MRO'
                    ? 'bg-purple-500 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                title="Mobility Robustness Optimization"
              >
                MRO
              </button>
            </div>

            {/* Loop Status Indicator */}
            <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-sm" style={{ borderColor: '#EA7B7B', borderWidth: '1px' }}>
              <Activity className={`w-4 h-4 ${
                overviewData.loopStatus === 'running' ? 'text-green-500 animate-pulse' :
                overviewData.loopStatus === 'degraded' ? 'text-yellow-500' :
                'text-gray-500'
              }`} />
              <span className="text-sm font-medium capitalize" style={{ color: '#9E3B3B' }}>{overviewData.loopStatus}</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Quick Stats Bar - with left margin for sidebar */}
      <div className={`transition-all duration-300 ${
        sidebarExpanded ? 'md:ml-64' : 'md:ml-16'
      }`}>
        <QuickStatsBar
          loopStatus={overviewData.loopStatus}
          alertCount={alarmData.length}
          intentCount={cells.length}
          hotspotCount={hotspots.length}
          onNavigate={handleNavigate}
        />
      </div>

      {/* Main Content - with left margin for sidebar on desktop */}
      <div className={`transition-all duration-300 ${
        sidebarExpanded ? 'md:ml-64' : 'md:ml-16'
      }`}>
        <div className="max-w-[1920px] mx-auto px-6 py-6">
          <div className="space-y-6">
            {/* Panel 1: Overview */}
            <div ref={(el) => { sectionRefs.current['overview'] = el; }} id="overview">
              <OverviewPanel data={{
                ...overviewData,
                alerts: transformAlarmsToAlerts(alarmData),
              }} />
            </div>

            {/* Intent Legend */}
            <div ref={(el) => { sectionRefs.current['legend'] = el; }} id="legend">
              <IntentLegend />
            </div>

            {/* Panel 2: Map & Hotspots */}
            <div ref={(el) => { sectionRefs.current['hotspots'] = el; }} id="hotspots">
              <HotspotsMapPanel hotspots={hotspots} onHotspotClick={handleHotspotClick} />
            </div>

            {/* Panel 3: Network Cells Table */}
            <div ref={(el) => { sectionRefs.current['cells'] = el; }} id="cells">
              <CellsTablePanel
                cells={cells}
                onCellClick={handleCellClick}
                loading={cellsLoading}
              />
            </div>

            {/* Detailed Analysis Section */}
            {selectedCell && (
            <div className="p-4 bg-primary-50 border-2 border-primary-300 rounded-lg">
              <div className="text-sm font-semibold text-primary-800">
                📍 Viewing {selectedModelType} analysis for Cell: <span className="font-mono">{selectedCell.cellname}</span>
                {' '}(NE: {selectedCell.ne_name})
              </div>
            </div>
          )}

            {/* Panel 4: Decision Tree Trace */}
            <div ref={(el) => { sectionRefs.current['decision-trace'] = el; }} id="decision-trace">
              {decisionTraceLoading ? (
                <div className="bg-[#fdf9f8] rounded-lg border border-gray-200 shadow-sm p-8">
                  <div className="flex items-center justify-center space-x-3">
                    <Activity className="w-5 h-5 animate-pulse text-primary-600" />
                    <span className="text-gray-600">Loading decision trace from ML model...</span>
                  </div>
                </div>
              ) : !decisionTrace ? (
                <div className="bg-[#fdf9f8] rounded-lg border border-gray-200 shadow-sm p-8">
                  <div className="text-center text-gray-500">
                    <Activity className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No Analysis Selected</h3>
                    <p className="text-sm">Click on any cell in the table above to run ML prediction and view the decision tree trace.</p>
                  </div>
                </div>
              ) : (
                <DecisionTreeTracePanel trace={decisionTrace} />
              )}
            </div>

            {/* Panel 5: Action Planner - Auto-loaded by date & task type */}
            <div ref={(el) => { sectionRefs.current['planner'] = el; }} id="planner">
              {planLoading ? (
                <div className="bg-[#fdf9f8] rounded-lg border border-gray-200 shadow-sm p-8">
                  <div className="flex items-center justify-center space-x-3">
                    <Activity className="w-5 h-5 animate-pulse text-primary-600" />
                    <span className="text-gray-600">Loading {selectedModelType} plan data from backend...</span>
                  </div>
                </div>
              ) : planData ? (
                <PlannerOutputPanel planResponse={planData} />
              ) : (
                <div className="bg-[#fdf9f8] rounded-lg border border-gray-200 shadow-sm p-8">
                  <div className="text-center text-gray-500">
                    <Activity className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No Plan Data Available</h3>
                    <p className="text-sm">Could not load plan data for the selected date. Please check the backend or try another date.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Panel 6: Execution & Outcome - Only shown after cell selection */}
            {selectedCell && executionOutcome && (
              <>
                <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-lg">
                  <div className="text-sm font-semibold text-amber-800">
                    📊 Execution outcome for Cell: <span className="font-mono">{selectedCell.cellname}</span>
                    {' '}(NE: {selectedCell.ne_name}) • Task: {selectedModelType}
                  </div>
                </div>
                <div ref={(el) => { sectionRefs.current['execution'] = el; }} id="execution">
                  <ExecutionOutcomePanel outcome={executionOutcome} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className={`bg-[#f8f0ea] text-center py-4 mt-12 transition-all duration-300 ${
        sidebarExpanded ? 'md:ml-64' : 'md:ml-16'
      }`} style={{ borderTopColor: '#ee0434', borderTopWidth: '3px' }}>
        <p className="text-xs" style={{ color: '#9E3B3B' }}>
          VULCAN - <b>V</b>iettel <b>U</b>nified <b>L</b>ogic & <b>C</b>ontrol for <b>A</b>utonomous <b>N</b>etwork
          {' '}{cells.length} Active Cells • {hotspots.length} Hotspots Detected
        </p>
      </footer>
    </div>
  );
};
