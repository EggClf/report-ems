import React, { useState, useEffect, useRef } from 'react';
import { Network, RefreshCw, Activity, Menu } from 'lucide-react';
import { OverviewPanel } from './OverviewPanel';
import { HotspotsMapPanel } from './HotspotsMapPanel';
import { IntentClassifierPanel } from './IntentClassifierPanel';
import { DecisionTreeTracePanel } from './DecisionTreeTracePanel';
import { PlannerOutputPanel } from './PlannerOutputPanel';
import { ExecutionOutcomePanel } from './ExecutionOutcomePanel';
import { IntentLegend } from './IntentLegend';
import { SidebarNavigation } from './SidebarNavigation';
import { QuickStatsBar } from './QuickStatsBar';
import { 
  getMockOverviewData, 
  getMockHotspots, 
  getMockIntents, 
  getMockIntentDistribution,
  getMockDecisionTreeTrace,
  getMockPlannerOutput,
  getMockExecutionOutcome
} from '../services/mockDataV2';
import { Hotspot, Intent } from '../types-v2';

export const LoopMonitoringDashboard: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [selectedIntent, setSelectedIntent] = useState<Intent | null>(null);
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  
  // Refs for scroll tracking
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
  // Load mock data
  const [overviewData, setOverviewData] = useState(() => getMockOverviewData());
  const [hotspots, setHotspots] = useState(() => getMockHotspots());
  const [intents, setIntents] = useState(() => getMockIntents());
  const [intentDistribution, setIntentDistribution] = useState(() => getMockIntentDistribution());
  
  // Use first intent for detailed views
  const firstIntent = intents[0];
  const [decisionTrace, setDecisionTrace] = useState(() => getMockDecisionTreeTrace(firstIntent.id));
  const [plannerOutput, setPlannerOutput] = useState(() => getMockPlannerOutput(firstIntent.id));
  const [executionOutcome, setExecutionOutcome] = useState(() => 
    getMockExecutionOutcome(plannerOutput.planId, firstIntent.id)
  );

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      handleRefresh();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Scroll tracking for active section
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200; // Offset for header
      
      const sectionIds = ['overview', 'legend', 'hotspots', 'intents', 'decision-trace', 'planner', 'execution'];
      
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

  const handleNavigate = (sectionId: string) => {
    const element = sectionRefs.current[sectionId];
    if (element) {
      const yOffset = -80; // Account for fixed header
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    
    // Simulate data refresh
    setTimeout(() => {
      setOverviewData(getMockOverviewData());
      setHotspots(getMockHotspots());
      setIntents(getMockIntents());
      setIntentDistribution(getMockIntentDistribution());
      
      const newFirstIntent = getMockIntents()[0];
      setDecisionTrace(getMockDecisionTreeTrace(newFirstIntent.id));
      const newPlannerOutput = getMockPlannerOutput(newFirstIntent.id);
      setPlannerOutput(newPlannerOutput);
      setExecutionOutcome(getMockExecutionOutcome(newPlannerOutput.planId, newFirstIntent.id));
      
      setLastUpdate(new Date());
      setRefreshing(false);
    }, 1000);
  };

  const handleHotspotClick = (hotspot: Hotspot) => {
    // Find or create intent for this hotspot
    const relatedIntent = intents.find(i => i.intentLabel === hotspot.intentLabel);
    if (relatedIntent) {
      setSelectedIntent(relatedIntent);
      // Navigate to decision trace section
      handleNavigate('decision-trace');
    }
  };

  const handleIntentClick = (intent: Intent) => {
    setSelectedIntent(intent);
    // Update detail panels with this intent's data
    setDecisionTrace(getMockDecisionTreeTrace(intent.id));
    const newPlannerOutput = getMockPlannerOutput(intent.id);
    setPlannerOutput(newPlannerOutput);
    setExecutionOutcome(getMockExecutionOutcome(newPlannerOutput.planId, intent.id));
    
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
        alertCount={overviewData.alerts.length}
        intentCount={intents.length}
        hotspotCount={hotspots.length}
        isExpanded={sidebarExpanded}
        onToggleExpanded={() => setSidebarExpanded(!sidebarExpanded)}
      />
      {/* Navbar */}
      <nav className="bg-slate-900 text-white px-6 py-4 shadow-lg sticky top-0 z-50">
        <div className="max-w-[1920px] mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <Network className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">
                TaoQuan AI <span className="text-indigo-400">Loop Monitoring</span>
              </h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                Real-time Automation Intelligence
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Last Update */}
            <div className="text-xs text-slate-400">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">Refresh</span>
            </button>

            {/* Loop Status Indicator */}
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-800 rounded-lg border border-slate-700">
              <Activity className={`w-4 h-4 ${
                overviewData.loopStatus === 'running' ? 'text-green-500 animate-pulse' :
                overviewData.loopStatus === 'degraded' ? 'text-yellow-500' :
                'text-gray-500'
              }`} />
              <span className="text-sm font-medium capitalize">{overviewData.loopStatus}</span>
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
          alertCount={overviewData.alerts.length}
          intentCount={intents.length}
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
              <OverviewPanel data={overviewData} />
            </div>

            {/* Intent Legend */}
            <div ref={(el) => { sectionRefs.current['legend'] = el; }} id="legend">
              <IntentLegend />
            </div>

            {/* Panel 2: Map & Hotspots */}
            <div ref={(el) => { sectionRefs.current['hotspots'] = el; }} id="hotspots">
              <HotspotsMapPanel hotspots={hotspots} onHotspotClick={handleHotspotClick} />
            </div>

            {/* Panel 3: Intent Classifier */}
            <div ref={(el) => { sectionRefs.current['intents'] = el; }} id="intents">
              <IntentClassifierPanel 
              intents={intents} 
              distribution={intentDistribution}
              onIntentClick={handleIntentClick}
            />
            </div>

            {/* Detailed Analysis Section */}
            {selectedIntent && (
            <div className="p-4 bg-indigo-50 border-2 border-indigo-300 rounded-lg">
              <div className="text-sm font-semibold text-indigo-800">
                📍 Viewing details for Intent: <span className="font-mono">{selectedIntent.id}</span> 
                {' '}({selectedIntent.intentLabel})
              </div>
            </div>
          )}

            {/* Panel 4: Decision Tree Trace */}
            <div ref={(el) => { sectionRefs.current['decision-trace'] = el; }} id="decision-trace">
              <DecisionTreeTracePanel trace={decisionTrace} />
            </div>

            {/* Panel 5: Planner Output */}
            <div ref={(el) => { sectionRefs.current['planner'] = el; }} id="planner">
              <PlannerOutputPanel planner={plannerOutput} />
            </div>

            {/* Panel 6: Execution & Outcome */}
            <div ref={(el) => { sectionRefs.current['execution'] = el; }} id="execution">
              <ExecutionOutcomePanel outcome={executionOutcome} />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className={`bg-slate-900 text-slate-400 text-center py-4 mt-12 transition-all duration-300 ${
        sidebarExpanded ? 'md:ml-64' : 'md:ml-16'
      }`}>
        <p className="text-xs">
          TaoQuan AI Loop Monitoring System • Version 2.0 • 
          {' '}{intents.length} Active Intents • {hotspots.length} Hotspots Detected
        </p>
      </footer>
    </div>
  );
};
