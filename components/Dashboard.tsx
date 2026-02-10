import React from 'react';

export const Dashboard: React.FC = () => {

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-12">
      {/* Navbar */}
      <nav className="bg-gradient-to-r from-primary-900 via-primary-800 to-red-900 text-white px-6 py-4 shadow-lg sticky top-0 z-50 border-b-2 border-primary-600">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10">
              <img src="/logo_vulcan.png" alt="VULCAN Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">VULCAN<span className="text-red-200">EMS</span></h1>
              <p className="text-[10px] text-red-100/70 uppercase tracking-wider">Viettel Unified Logic and Control for Autonomous Network</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold ring-2 ring-white/30 backdrop-blur-sm">
              OP
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center h-[600px] flex flex-col items-center justify-center">
          <div className="w-24 h-24 flex items-center justify-center mb-4">
            <img src="/logo_vulcan.png" alt="VULCAN Logo" className="w-full h-full object-contain" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">VULCAN EMS Dashboard</h3>
          <p className="text-slate-500 max-w-sm">
            Viettel Unified Logic and Control for Autonomous Network - Energy Management System
          </p>
        </div>
      </main>
    </div>
  );
};