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
  ChevronUp,
  Sun,
  Moon
} from 'lucide-react';
import { useTheme } from './ThemeContext';

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
  { id: 'cells', label: 'Network Cell', icon: Brain },
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
  const { theme, toggleTheme } = useTheme();

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
      <div className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-[#f8f0ea] dark:bg-slate-800 shadow-lg transition-all duration-300 z-40
        ${isExpanded ? 'w-64' : 'w-16'}
        md:block hidden
      `} style={{ borderRightColor: '#EA7B7B', borderRightWidth: '2px' }}>
        {/* Toggle Button */}
        <button
          onClick={onToggleExpanded}
          className="absolute -right-3 top-4 w-6 h-6 rounded-full flex items-center justify-center transition-colors shadow-md"
          style={{ backgroundColor: '#ee0434', color: 'white' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D25353'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ee0434'}
        >
          {isExpanded ? <ChevronRight className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>

        {/* Sidebar Content */}
        <div className="p-4 h-full flex flex-col">
          {/* Status Summary */}
          {isExpanded && (
            <div className="mb-4 pb-4" style={{ borderBottomColor: '#EA7B7B', borderBottomWidth: '2px' }}>
              <div className="text-xs font-semibold uppercase mb-3" style={{ color: '#9E3B3B' }}>System Status</div>

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
                  <span className="text-xs font-bold text-primary-600">{intentCount}</span>
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
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all mb-4 ${
                  !isExpanded && 'justify-center'
                } bg-white/50 dark:bg-white/10 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-white/20`}
                title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              >
                {theme === 'light' ? (
                  <Moon className="w-5 h-5 flex-shrink-0" />
                ) : (
                  <Sun className="w-5 h-5 flex-shrink-0" />
                )}
                {isExpanded && (
                  <span className="text-sm font-medium truncate">
                    {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                  </span>
                )}
              </button>

              {sections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;

                return (
                  <button
                    key={section.id}
                    onClick={() => onNavigate(section.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                      !isExpanded && 'justify-center'
                    }`}
                    style={{
                      backgroundColor: isActive ? '#ee0434' : 'transparent',
                      color: isActive ? 'white' : '#9E3B3B',
                      boxShadow: isActive ? '0 4px 6px -1px rgba(238, 4, 52, 0.2)' : 'none'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = '#f8f0ea';
                        e.currentTarget.style.color = '#ee0434';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#9E3B3B';
                      }
                    }}
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
            <div className="pt-4" style={{ borderTopColor: '#EA7B7B', borderTopWidth: '2px' }}>
              <div className="text-xs text-center font-semibold" style={{ color: '#ee0434' }}>
                VULCAN
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 w-12 h-12 rounded-full shadow-lg transition-all flex items-center justify-center z-50"
          style={{ backgroundColor: '#ee0434', color: 'white' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#D25353';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ee0434';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <ChevronUp className="w-6 h-6" />
        </button>
      )}
    </>
  );
};
