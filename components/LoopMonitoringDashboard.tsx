import React, { useState, useEffect, useRef } from 'react';
import { Activity, Shield } from 'lucide-react';
import { CellsTablePanel } from './CellsTablePanel';
import { DecisionTreeTracePanel } from './DecisionTreeTracePanel';
import { PlannerOutputPanel } from './PlannerOutputPanel';
import { EvaluationChartPanel } from './EvaluationChartPanel';
import { SidebarNavigation } from './SidebarNavigation';
import { QuickStatsBar } from './QuickStatsBar';
import { AdminPanel } from './AdminPanel';
import { DataSelectionPanel } from './DataSelectionPanel';
import { networkScanAPI, CellFeatures } from '../services/networkScanAPI';
import { mlModelAPI } from '../services/mlModelAPI';
import { BatchCellInput } from '../services/mlModelAPI';
import { fetchPlanData, PlanLoadResponse, fetchCurrentAlarms, AlarmRecord } from '../services/api';
import { fetchCSVData, CSVDataResponse } from '../services/csvUploadAPI';
import { DecisionTreeTrace, BatchTraceResult } from '../types-v2';

export const LoopMonitoringDashboard: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedCell, setSelectedCell] = useState<CellFeatures | null>(null);
  const [selectedModelType, setSelectedModelType] = useState<'ES' | 'MRO'>('ES');
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [cellsLoading, setCellsLoading] = useState(true);
  const [decisionTraceLoading, setDecisionTraceLoading] = useState(false);

  // Refs for scroll tracking
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Overview data
  const [overviewData, setOverviewData] = useState<{
    loopStatus: 'running' | 'degraded' | 'paused';
    alerts: any[];
  }>({
    loopStatus: 'running',
    alerts: []
  });

  // Real cell data from network scan
  const [cells, setCells] = useState<CellFeatures[]>([]);
  const [networkScanData, setNetworkScanData] = useState<any>(null);

  // Decision trace and planner data
  const [decisionTrace, setDecisionTrace] = useState<DecisionTreeTrace | null>(null);
  const [batchTraceResult, setBatchTraceResult] = useState<BatchTraceResult | null>(null);
  const [batchLoading, setBatchLoading] = useState(false);

  // Real plan data from backend
  const [planData, setPlanData] = useState<PlanLoadResponse | null>(null);
  const [planLoading, setPlanLoading] = useState(false);

  // Real alarm data from backend
  const [alarmData, setAlarmData] = useState<AlarmRecord[]>([]);
  const [alarmsLoading, setAlarmsLoading] = useState(false);

  // Evaluation CSV data (before/after plan)
  const [evalBeforeData, setEvalBeforeData] = useState<CSVDataResponse | null>(null);
  const [evalAfterData, setEvalAfterData] = useState<CSVDataResponse | null>(null);
  const [evalLoading, setEvalLoading] = useState(false);

  // Admin Panel visibility
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);

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

  // Auto-load evaluation CSV data when task type changes
  // (before-plan may span many days; not filtered by date)
  useEffect(() => {
    loadEvaluationData(selectedModelType);
  }, [selectedModelType]);

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

  // Load evaluation CSV data (before/after) for the Evaluation chart
  // Before-plan CSV spans many days, so we don't filter by date here.
  const loadEvaluationData = async (taskType: 'ES' | 'MRO') => {
    setEvalLoading(true);
    const dateStr = formatDateForInput(selectedDate);

    // Load both before and after in parallel
    const [beforeResult, afterResult] = await Promise.allSettled([
      fetchCSVData(dateStr, taskType, 'before_plan'),
      fetchCSVData(dateStr, taskType, 'after_plan'),
    ]);

    setEvalBeforeData(
      beforeResult.status === 'fulfilled' ? beforeResult.value : null
    );
    setEvalAfterData(
      afterResult.status === 'fulfilled' ? afterResult.value : null
    );
    setEvalLoading(false);
  };

  // Called when admin uploads/deletes a CSV
  const handleCSVUploadSuccess = (date: string, taskType: 'ES' | 'MRO', label: string) => {
    // Reload evaluation data if the upload matches the current task type
    if (taskType === selectedModelType) {
      loadEvaluationData(selectedModelType);
    }
  };

  // Scroll tracking for active section
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200; // Offset for header

      const sectionIds = ['data-selection', 'cells', 'decision-trace', 'planner', 'evaluation'];

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

  const handleDateChange = (newDate: Date) => {
    setSelectedDate(newDate);
  };

  const handleModelTypeChange = (type: 'ES' | 'MRO') => {
    setSelectedModelType(type);
  };

const handleCellClick = async (cell: CellFeatures, modelType: 'ES' | 'MRO') => {
    setSelectedCell(cell);
    setSelectedModelType(modelType);
    setDecisionTraceLoading(true);
    setBatchTraceResult(null); // Clear batch results when clicking a single cell

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

  // Batch predict all cells
  const handleBatchPredict = async (validCells: CellFeatures[], modelType: 'ES' | 'MRO') => {
    setBatchLoading(true);
    setDecisionTrace(null); // Clear single-cell trace
    setSelectedCell(null);

    try {
      // Build batch input
      const batchCells: BatchCellInput[] = validCells.map((cell) => ({
        cell_id: cell.cellname,
        features: networkScanAPI.extractMLFeatures(cell, modelType),
      }));

      console.log(`Running batch ${modelType} prediction for ${batchCells.length} cells...`);

      const result = await mlModelAPI.getBatchDecisionTraces(modelType, batchCells);
      setBatchTraceResult(result);

      console.log(`✓ Batch ${modelType} prediction complete: ${result.appliedCount} applied, ${result.notAppliedCount} not applied`);
    } catch (error) {
      console.error('Batch prediction failed:', error);
      setBatchTraceResult(null);
    } finally {
      setBatchLoading(false);
    }

    handleNavigate('decision-trace');
  };

  return (
    <div className="min-h-screen bg-[#F5F7F8]">
      {/* Sidebar Navigation */}
      <SidebarNavigation
        activeSection={activeSection}
        onNavigate={handleNavigate}
        loopStatus={overviewData.loopStatus}
        alertCount={alarmData.length}
        isExpanded={sidebarExpanded}
        onToggleExpanded={() => setSidebarExpanded(!sidebarExpanded)}
      />
      {/* Navbar */}
      <nav className="shadow-md sticky top-0 z-50 border-b-3 overflow-hidden bg-[#44494D]" style={{ borderBottomColor: '#EE0434', borderBottomWidth: '3px' }}>
        <div className="max-w-[1920px] mx-auto flex items-stretch min-h-[100px]">
          {/* Left Section - Red with Diagonal Cut */}
          <div className="relative bg-[#EE0434] px-8 py-6 flex items-center" style={{ clipPath: 'polygon(0 0, 100% 0, calc(100% - 50px) 100%, 0 100%)' }}>
            <div className="flex items-center gap-3 pr-12">
              <div className="flex items-center justify-center w-10 h-10">
                <img src="/logo_vulcan.png" alt="VULCAN Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  VULCAN
                </h1>
                <p className="text-base uppercase tracking-wider text-white">
                  <b>V</b>iettel <b>U</b>nified <b>L</b>ogic & <b>C</b>ontrol for <b>A</b>utonomous <b>N</b>etwork
                </p>
              </div>
            </div>
          </div>

          {/* Right Section - Gray */}
          <div className="flex-1 bg-[#44494D] px-6 py-6 flex items-center justify-end gap-4">
            {/* Loop Status Indicator */}
            <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-sm" style={{ borderColor: '#EE0434', borderWidth: '1px' }}>
              <Activity className={`w-6 h-6 ${
                overviewData.loopStatus === 'running' ? 'text-green-500 animate-pulse' :
                overviewData.loopStatus === 'degraded' ? 'text-yellow-500' :
                'text-gray-500'
              }`} />
              <span className="text-base font-medium capitalize" style={{ color: '#7A1230' }}>{overviewData.loopStatus}</span>
            </div>

            {/* Admin Panel Button */}
            <button
              onClick={() => setAdminPanelOpen(true)}
              className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-sm hover:bg-slate-50 transition-colors"
              style={{ borderColor: '#EE0434', borderWidth: '1px' }}
              title="Admin Panel — Upload CSV Data"
            >
              <Shield className="w-6 h-6" style={{ color: '#C0042B' }} />
              <span className="text-base font-medium" style={{ color: '#7A1230' }}>Admin</span>
            </button>
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
          onNavigate={handleNavigate}
        />
      </div>

      {/* Main Content - with left margin for sidebar on desktop */}
      <div className={`transition-all duration-300 ${
        sidebarExpanded ? 'md:ml-64' : 'md:ml-16'
      }`}>
        <div className="max-w-[1920px] mx-auto px-6 py-6">
          <div className="space-y-6">
            {/* Data Selection Panel */}
            <div ref={(el) => { sectionRefs.current['data-selection'] = el; }} id="data-selection">
              <DataSelectionPanel
                selectedDate={selectedDate}
                selectedModelType={selectedModelType}
                onDateChange={handleDateChange}
                onModelTypeChange={handleModelTypeChange}
              />
            </div>

            {/* Panel 3: Network Cells Table */}
            <div ref={(el) => { sectionRefs.current['cells'] = el; }} id="cells">
              <CellsTablePanel
                cells={cells}
                onCellClick={handleCellClick}
                onBatchPredict={handleBatchPredict}
                batchLoading={batchLoading}
                loading={cellsLoading}
                selectedModelType={selectedModelType}
              />
            </div>

            {/* Detailed Analysis Section */}
            {selectedCell && (
            <div className={`p-4 border-2 rounded-lg ${
              selectedModelType === 'ES'
                ? 'bg-green-500 border-green-600'
                : 'bg-blue-500 border-blue-600'
            }`}>
              <div className="text-base font-semibold text-white">
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
                    <Activity className="w-6 h-6 animate-pulse text-primary-600" />
                    <span className="text-gray-600">Loading decision trace from ML model...</span>
                  </div>
                </div>
              ) : batchTraceResult ? (
                <DecisionTreeTracePanel batchResult={batchTraceResult} />
              ) : !decisionTrace ? (
                <div className="bg-[#fdf9f8] rounded-lg border border-gray-200 shadow-sm p-8">
                  <div className="text-center text-gray-500">
                    <Activity className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-2xl font-semibold text-gray-700 mb-2">No Analysis Selected</h3>
                    <p className="text-base">Click on any cell in the table above to run ML prediction, or use <strong>Run All Cells</strong> to process all cells at once.</p>
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
                    <Activity className="w-6 h-6 animate-pulse text-primary-600" />
                    <span className="text-gray-600">Loading {selectedModelType} plan data from backend...</span>
                  </div>
                </div>
              ) : planData ? (
                <PlannerOutputPanel planResponse={planData} csvData={evalAfterData} csvLoading={evalLoading} />
              ) : (
                <div className="bg-[#fdf9f8] rounded-lg border border-gray-200 shadow-sm p-8">
                  <div className="text-center text-gray-500">
                    <Activity className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-2xl font-semibold text-gray-700 mb-2">No Plan Data Available</h3>
                    <p className="text-base">Could not load plan data for the selected date. Please check the backend or try another date.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Panel 6: KPI Evaluation Chart - Before vs After Plan */}
            <div ref={(el) => { sectionRefs.current['evaluation'] = el; }} id="evaluation">
              <EvaluationChartPanel
                beforeData={evalBeforeData}
                afterData={evalAfterData}
                taskType={selectedModelType}
                defaultDate={formatDateForInput(selectedDate)}
                loading={evalLoading}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className={`bg-[#C0042B] text-center py-6 mt-12 transition-all duration-300 ${
        sidebarExpanded ? 'md:ml-64' : 'md:ml-16'
      }`} style={{ borderTopColor: '#EE0434', borderTopWidth: '3px' }}>
        <p className="text-base" style={{ color: '#FFE6EC' }}>
          VULCAN - <b>V</b>iettel <b>U</b>nified <b>L</b>ogic & <b>C</b>ontrol for <b>A</b>utonomous <b>N</b>etwork
        </p>
      </footer>

      {/* Admin Panel Modal */}
      <AdminPanel
        selectedDate={selectedDate}
        selectedModelType={selectedModelType}
        onUploadSuccess={handleCSVUploadSuccess}
        isOpen={adminPanelOpen}
        onClose={() => setAdminPanelOpen(false)}
      />
    </div>
  );
};
