import React from 'react';

export const Dashboard: React.FC = () => {

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-12">

      <nav className="bg-[#f8f0ea] px-6 py-4 shadow-md sticky top-0 z-50" style={{ borderBottomColor: '#ee0434', borderBottomWidth: '3px' }}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10">
              <img src="/logo_vulcan.png" alt="VULCAN Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight" style={{ color: '#9E3B3B' }}>VULCAN<span style={{ color: '#ee0434' }}>EMS</span></h1>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: '#D25353' }}><b>V</b>iettel <b>U</b>nified <b>L</b>ogic & <b>C</b>ontrol for <b>A</b>utonomous <b>N</b>etwork</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-xs font-bold shadow-sm" style={{ borderColor: '#ee0434', borderWidth: '2px', color: '#9E3B3B' }}>
              OP
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 space-y-6">
        <div className="bg-[#fdf9f8] rounded-xl shadow-sm border border-slate-200 p-12 text-center h-[600px] flex flex-col items-center justify-center">
          <div className="w-24 h-24 flex items-center justify-center mb-4">
            <img src="/logo_vulcan.png" alt="VULCAN Logo" className="w-full h-full object-contain" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">VULCAN EMS Dashboard</h3>
          <p className="text-slate-500 max-w-sm text-center">
            <b>V</b>iettel <b>U</b>nified <b>L</b>ogic & <b>C</b>ontrol for <b>A</b>utonomous <b>N</b>etwork - Energy Management System
          </p>
        </div>
      </main>
    </div>
  );
};