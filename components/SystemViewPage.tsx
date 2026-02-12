import React, { useState, useEffect } from 'react';
import { Activity, Calendar, ChevronLeft, Shield, Monitor } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { OverviewPanel } from './OverviewPanel';
import { HotspotsMapPanel } from './HotspotsMapPanel';
import { IntentLegend } from './IntentLegend';
import { fetchCurrentAlarms, AlarmRecord } from '../services/api';
import { Hotspot, Priority } from '../types-v2';

export const SystemViewPage: React.FC = () => {
  const navigate = useNavigate();

  const [overviewData, setOverviewData] = useState<{
    loopStatus: 'running' | 'degraded' | 'paused';
    alerts: any[];
  }>({
    loopStatus: 'running',
    alerts: [],
  });

  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [alarmData, setAlarmData] = useState<AlarmRecord[]>([]);
  const [alarmsLoading, setAlarmsLoading] = useState(false);

  // Load alarm data on mount and periodically
  useEffect(() => {
    loadAlarmData();
    const intervalId = setInterval(loadAlarmData, 30000);
    return () => clearInterval(intervalId);
  }, []);

  const loadAlarmData = async () => {
    setAlarmsLoading(true);
    try {
      const response = await fetchCurrentAlarms();
      setAlarmData(response.data);
    } catch (error) {
      console.error('Failed to load alarm data:', error);
      setAlarmData([]);
    } finally {
      setAlarmsLoading(false);
    }
  };

  const transformAlarmsToAlerts = (alarms: AlarmRecord[]) => {
    return alarms.map((alarm) => {
      let severity: Priority;
      switch (alarm.severity) {
        case 'CRITICAL': severity = 'critical'; break;
        case 'MAJOR': severity = 'high'; break;
        case 'MINOR': severity = 'medium'; break;
        case 'WARNING': severity = 'low'; break;
        default: severity = 'medium';
      }
      return {
        id: `alarm_${alarm.event_id}`,
        type: 'kpi_guardrail_violated' as const,
        message: `[${alarm.source_name}] ${alarm.event_name}: ${alarm.specific_problem}`,
        timestamp: new Date(alarm.trigger_instant),
        severity,
      };
    });
  };

  const handleHotspotClick = (hotspot: Hotspot) => {
    // Could navigate to dashboard with cell pre-selected in the future
  };

  return (
    <div className="min-h-screen bg-[#F5F7F8]">
      {/* Navbar */}
      <nav
        className="shadow-md sticky top-0 z-50 border-b-3 overflow-hidden bg-[#44494D]"
        style={{ borderBottomColor: '#EE0434', borderBottomWidth: '3px' }}
      >
        <div className="max-w-[1920px] mx-auto flex items-stretch min-h-[100px]">
          {/* Left Section - Red with Diagonal Cut */}
          <div
            className="relative bg-[#EE0434] px-8 py-6 flex items-center"
            style={{ clipPath: 'polygon(0 0, 100% 0, calc(100% - 50px) 100%, 0 100%)' }}
          >
            <div className="flex items-center gap-3 pr-12">
              <div className="flex items-center justify-center w-10 h-10">
                <img src="/logo_vulcan.png" alt="VULCAN Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">VULCAN</h1>
                <p className="text-base uppercase tracking-wider text-white">
                  <b>V</b>iettel <b>U</b>nified <b>L</b>ogic & <b>C</b>ontrol for <b>A</b>utonomous <b>N</b>etwork
                </p>
              </div>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex-1 bg-[#44494D] px-6 py-6 flex items-center justify-between">
            {/* Page Title */}
            <div className="flex items-center gap-3 ml-4">
              <Monitor className="w-6 h-6 text-white" />
              <span className="text-xl font-semibold text-white">System View</span>
            </div>

            {/* Back to Dashboard */}
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm hover:bg-slate-50 transition-colors"
              style={{ borderColor: '#EE0434', borderWidth: '1px' }}
            >
              <ChevronLeft className="w-5 h-5" style={{ color: '#C0042B' }} />
              <span className="text-base font-medium" style={{ color: '#7A1230' }}>
                Back to Dashboard
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-[1920px] mx-auto px-6 py-6">
        <div className="space-y-6">
          {/* Loop Status Overview */}
          <OverviewPanel
            data={{
              ...overviewData,
              alerts: transformAlarmsToAlerts(alarmData),
            }}
          />

          {/* Intent Classification Guide */}
          <IntentLegend />

          {/* Network Hotspots Map */}
          <HotspotsMapPanel hotspots={hotspots} onHotspotClick={handleHotspotClick} />
        </div>
      </div>

      {/* Footer */}
      <footer
        className="bg-[#C0042B] text-center py-6 mt-12"
        style={{ borderTopColor: '#EE0434', borderTopWidth: '3px' }}
      >
        <p className="text-base" style={{ color: '#FFE6EC' }}>
          VULCAN - <b>V</b>iettel <b>U</b>nified <b>L</b>ogic & <b>C</b>ontrol for <b>A</b>utonomous <b>N</b>etwork
        </p>
      </footer>
    </div>
  );
};
