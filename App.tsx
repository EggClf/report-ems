import React from 'react';
import { LoopMonitoringDashboard } from './components/LoopMonitoringDashboard';
import { ThemeProvider } from './components/ThemeContext';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <div className="antialiased text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-900 min-h-screen transition-colors duration-300">
        <LoopMonitoringDashboard />
      </div>
    </ThemeProvider>
  );
};

export default App;
