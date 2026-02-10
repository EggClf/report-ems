import React from 'react';
import { MapPin } from 'lucide-react';
import { Hotspot } from '../types-v2';

interface HotspotsMapPanelProps {
  hotspots: Hotspot[];
  onHotspotClick?: (hotspot: Hotspot) => void;
}

export const HotspotsMapPanel: React.FC<HotspotsMapPanelProps> = ({ hotspots, onHotspotClick }) => {
  return (
    <div className="bg-[#fdf9f8] rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <MapPin className="w-6 h-6 text-primary-600" />
          Network Hotspots Map
        </h2>
      </div>
      <div className="flex flex-col items-center justify-center py-20 text-slate-500 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
        <MapPin className="w-12 h-12 mb-3 opacity-20" />
        <p className="text-lg font-medium">current developer will complete later</p>
      </div>
    </div>
  );
};
