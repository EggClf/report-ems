import React from 'react';
import { LoopMonitoringDashboard } from './components/LoopMonitoringDashboard';
import { ThemeProvider } from './components/ThemeContext';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <div className="antialiased text-slate-900 dark:text-slate-100 bg-slate-50 min-h-screen transition-colors duration-300" style={{ backgroundColor: 'var(--dark-bg, #f8fafc)' }}>
        <style>{`
          .dark {
            --dark-bg: #00224D;
            --dark-panel: #5D0E41;
            --dark-accent: #A0153E;
            --dark-primary: #FF204E;
          }
        `}</style>
        <LoopMonitoringDashboard />
      </div>
    </ThemeProvider>
  );
};

export default App;
