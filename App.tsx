import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LoopMonitoringDashboard } from './components/LoopMonitoringDashboard';
import { SystemViewPage } from './components/SystemViewPage';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="antialiased text-slate-900 bg-slate-50">
        <Routes>
          <Route path="/" element={<LoopMonitoringDashboard />} />
          <Route path="/system" element={<SystemViewPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;
