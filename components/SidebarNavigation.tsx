import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  MapPin, 
  Brain, 
  GitBranch, 
  Cpu, 
  Play, 
  ChevronRight,
  Menu,
  X,
  ChevronUp
} from 'lucide-react';

interface SidebarNavigationProps {
  activeSection: string;
  onNavigate: (sectionId: string) => void;
  loopStatus: 'running' | 'degraded' | 'paused';
  alertCount: number;
  intentCount: number;
  hotspotCount: number;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

const sections = [
  { id: 'overview', label: 'Loop Status', icon: Activity },
  { id: 'legend', label: 'Intent Guide', icon: Brain },
  { id: 'hotspots', label: 'Hotspots', icon: MapPin },
  { id: 'intents', label: 'Intent Engine', icon: Brain },
  { id: 'decision-trace', label: 'Decision Tree', icon: GitBranch },
  { id: 'planner', label: 'Action Planner', icon: Cpu },
  { id: 'execution', label: 'Execution', icon: Play }
];

export const SidebarNavigation: React.FC<SidebarNavigationProps> = ({
  activeSection,
  onNavigate,
  loopStatus,
  alertCount,
  intentCount,
  hotspotCount,
  isExpanded,
  onToggleExpanded
}) => {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getStatusColor = () => {
    switch (loopStatus) {
      case 'running': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500';
      case 'paused': return 'bg-gray-500';
    }
  };

  return (
    <>
      {/* Sidebar - Hidden on mobile by default */}
      <div className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white border-r border-slate-200 shadow-lg transition-all duration-300 z-40 
        ${isExpanded ? 'w-64' : 'w-16'}
        md:block hidden
      `}>
        {/* Toggle Button */}
        <button
          onClick={onToggleExpanded}
          className="absolute -right-3 top-4 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 transition-colors shadow-md"
        >
          {isExpanded ? <ChevronRight className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>

        {/* Sidebar Content */}
        <div className="p-4 h-full flex flex-col">
          {/* Status Summary */}
          {isExpanded && (
            <div className="mb-4 pb-4 border-b border-slate-200">
              <div className="text-xs font-semibold text-slate-600 uppercase mb-3">System Status</div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">Loop</span>
                  <div className={`w-2 h-2 rounded-full ${getStatusColor()} animate-pulse`}></div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">Alerts</span>
                  <span className="text-xs font-bold text-red-600">{alertCount}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">Intents</span>
                  <span className="text-xs font-bold text-indigo-600">{intentCount}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">Hotspots</span>
                  <span className="text-xs font-bold text-orange-600">{hotspotCount}</span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto">
            <div className={`space-y-1 ${!isExpanded && 'flex flex-col items-center'}`}>
              {sections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                
                return (
                  <button
                    key={section.id}
                    onClick={() => onNavigate(section.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-700 hover:bg-slate-100'
                    } ${!isExpanded && 'justify-center'}`}
                    title={!isExpanded ? section.label : ''}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 ${isActive && 'animate-pulse'}`} />
                    {isExpanded && (
                      <span className="text-sm font-medium truncate">{section.label}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Footer Info */}
          {isExpanded && (
            <div className="pt-4 border-t border-slate-200">
              <div className="text-xs text-slate-500 text-center">
                TaoQuan AI v2.0
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 w-12 h-12 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center z-50 hover:scale-110"
        >
          <ChevronUp className="w-6 h-6" />
        </button>
      )}
    </>
  );
};
