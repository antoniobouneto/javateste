import React, { useState } from 'react';
import { MapPin, Navigation, Calendar, ExternalLink, ChevronRight } from 'lucide-react';
import { DiaryEntry } from '../types/diary';

interface MapViewProps {
  entries: DiaryEntry[];
  onSelectEntry: (entry: DiaryEntry) => void;
}

export const MapView: React.FC<MapViewProps> = ({ entries, onSelectEntry }) => {
  const [selectedPin, setSelectedPin] = useState<DiaryEntry | null>(
    entries.length > 0 ? entries[0] : null
  );

  if (entries.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-stone-500">Nenhum registro com coordenadas para exibir no mapa.</p>
      </div>
    );
  }

  // Calculate center coordinates
  const activePin = selectedPin || entries[0];
  const lat = activePin.latitude;
  const lng = activePin.longitude;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center space-x-2">
            <Navigation className="w-5 h-5 text-emerald-700" />
            <span>Mapa de Registros</span>
          </h2>
          <p className="text-xs text-stone-500">
            {entries.length} {entries.length === 1 ? 'localização marcada' : 'localizações marcadas'}
          </p>
        </div>
      </div>

      {/* Main Map Frame */}
      <div className="w-full h-[380px] rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-800 shadow-md bg-stone-100 dark:bg-stone-900 relative">
        <iframe
          title="Mapa de Registros GeoDiário"
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.04}%2C${lat - 0.03}%2C${lng + 0.04}%2C${lat + 0.03}&layer=mapnik&marker=${lat}%2C${lng}`}
          className="w-full h-full border-0"
        />

        {/* Floating Quick Selected Card */}
        {activePin && (
          <div className="absolute bottom-3 left-3 right-3 sm:left-auto sm:right-3 sm:w-80 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md p-3 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xl flex items-center space-x-3">
            <img
              src={activePin.imageData}
              alt={activePin.title}
              className="w-16 h-16 rounded-xl object-cover shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 line-clamp-1">
                {activePin.title}
              </h4>
              <p className="text-[10px] text-stone-500 mt-0.5 font-mono">
                {activePin.latitude.toFixed(4)}, {activePin.longitude.toFixed(4)}
              </p>
              <button
                onClick={() => onSelectEntry(activePin)}
                className="mt-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center space-x-1"
              >
                <span>Ver detalhes completos</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Location selector pills */}
      <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-none">
        {entries.map((entry) => (
          <button
            key={entry.id}
            onClick={() => setSelectedPin(entry)}
            className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-medium border flex items-center space-x-2 transition-all ${
              selectedPin?.id === entry.id
                ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                : 'bg-white dark:bg-stone-850 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:border-emerald-500'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span className="max-w-[120px] truncate">{entry.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
