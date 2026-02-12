import React, { useState, useEffect } from 'react';
import {
  Activity,
  MapPin,
  Brain,
  GitBranch,
  Cpu,
  BarChart3,
  ChevronRight,
  Menu,
  Monitor,
  X,
  ChevronUp,
  Database
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarNavigationProps {
  activeSection: string;
  onNavigate: (sectionId: string) => void;
  loopStatus: 'running' | 'degraded' | 'paused';
  alertCount: number;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

const sections = [
  { id: 'context-snapshot', label: 'Context Snapshot', icon: Database },
  { id: 'cells', label: 'Network Cell', icon: Brain },
  { id: 'decision-trace', label: 'Decision Tree', icon: GitBranch },
  { id: 'planner', label: 'Action Planner', icon: Cpu },
  { id: 'evaluation', label: 'Evaluation', icon: BarChart3 }
];

export const SidebarNavigation: React.FC<SidebarNavigationProps> = ({
  activeSection,
  onNavigate,
  loopStatus,
  alertCount,
  isExpanded,
  onToggleExpanded
}) => {
  const navigate = useNavigate();
  const location = useLocation();
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
      <div className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-[#241D1E] shadow-lg transition-all duration-300 z-40
        ${isExpanded ? 'w-64' : 'w-16'}
        md:block hidden
      `} style={{ borderRightColor: '#44494D', borderRightWidth: '1px' }}>
        {/* Toggle Button */}
        <button
          onClick={onToggleExpanded}
          className="absolute -right-3 top-4 w-6 h-6 rounded-full flex items-center justify-center transition-colors shadow-md bg-white text-[#44494D] hover:text-[#EE0033]"
        >
          {isExpanded ? <ChevronRight className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>

        {/* Sidebar Content */}
        <div className="p-4 h-full flex flex-col">
          {/* Status Summary */}
          {isExpanded && (
            <div className="mb-4 pb-4 border-b border-[#44494D]">
              <div className="text-xs font-semibold uppercase mb-3 text-gray-500">System Status</div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Loop</span>
                  <div className={`w-2 h-2 rounded-full ${getStatusColor()} animate-pulse`}></div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Alerts</span>
                  <span className="text-xs font-bold text-white">{alertCount}</span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto">
            <div className={`space-y-1 ${!isExpanded && 'flex flex-col items-center'}`}>
              {/* System View Link */}
              <button
                onClick={() => navigate('/system')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  !isExpanded && 'justify-center'
                }`}
                style={{
                  backgroundColor: location.pathname === '/system' ? '#EE0033' : 'transparent',
                  color: location.pathname === '/system' ? 'white' : '#9CA3AF',
                  boxShadow: location.pathname === '/system' ? '0 4px 6px -1px rgba(238, 0, 51, 0.3)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (location.pathname !== '/system') {
                    e.currentTarget.style.backgroundColor = '#44494D';
                    e.currentTarget.style.color = 'white';
                  }
                }}
                onMouseLeave={(e) => {
                  if (location.pathname !== '/system') {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#9CA3AF';
                  }
                }}
                title={!isExpanded ? 'System View' : ''}
              >
                <Monitor className="w-5 h-5 flex-shrink-0" />
                {isExpanded && (
                  <span className="text-sm font-medium truncate">System View</span>
                )}
              </button>

              {/* Divider */}
              <div className={`my-2 ${isExpanded ? 'border-t border-[#44494D]' : 'w-8 border-t border-[#44494D]'}`}></div>

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
                      backgroundColor: isActive ? '#EE0033' : 'transparent',
                      color: isActive ? 'white' : '#9CA3AF',
                      boxShadow: isActive ? '0 4px 6px -1px rgba(238, 0, 51, 0.3)' : 'none'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = '#44494D';
                        e.currentTarget.style.color = 'white';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#9CA3AF';
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
            <div className="pt-4" style={{ borderTopColor: '#EE0434', borderTopWidth: '2px' }}>
              <div className="text-xs text-center font-semibold" style={{ color: '#FFE6EC' }}>
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
