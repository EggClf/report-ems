import React from 'react';
import { LoopMonitoringDashboard } from './components/LoopMonitoringDashboard';

const App: React.FC = () => {
  return (
    <div className="antialiased text-slate-900 bg-slate-50">
      <LoopMonitoringDashboard />
    </div>
  );
};

export default App;
