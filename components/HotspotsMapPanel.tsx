import React from 'react';
import { MapPin } from 'lucide-react';
import { Hotspot } from '../types-v2';

interface HotspotsMapPanelProps {
  hotspots: Hotspot[];
  onHotspotClick?: (hotspot: Hotspot) => void;
}

export const HotspotsMapPanel: React.FC<HotspotsMapPanelProps> = ({ hotspots, onHotspotClick }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-red-100">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <MapPin className="w-6 h-6 text-[#EE0434]" />
          Network Hotspots Map
        </h2>
      </div>
      <div className="flex flex-col items-center justify-center py-20 text-slate-500 bg-slate-50 rounded-lg border-2 border-dashed border-red-200">
        <MapPin className="w-12 h-12 mb-3 opacity-20 text-red-400" />
        <p className="text-lg font-medium">This feature is under development and will be available soon.</p>
      </div>
    </div>
  );
};
