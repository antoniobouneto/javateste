import React from 'react';
import { Camera, Map as MapIcon, List, Plus } from 'lucide-react';

interface HeaderProps {
  currentView: 'list' | 'map';
  onViewChange: (view: 'list' | 'map') => void;
  onNewEntry: () => void;
  totalEntries: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  onNewEntry,
  totalEntries,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-emerald-800 text-white shadow-md">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-700 border border-emerald-600 flex items-center justify-center shadow-inner overflow-hidden">
            <img
              src="/icon.png"
              alt="GeoDiário"
              className="w-8 h-8 object-contain"
              onError={(e) => {
                // fallback to lucide camera
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <Camera className="w-5 h-5 text-emerald-100 hidden [&:only-child]:block" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight">GeoDiário</h1>
              <span className="text-xs bg-emerald-900/80 text-emerald-200 px-2 py-0.5 rounded-full font-medium border border-emerald-700">
                {totalEntries} {totalEntries === 1 ? 'registro' : 'registros'}
              </span>
            </div>
            <p className="text-xs text-emerald-200/90 hidden sm:block">
              Fotos com data, hora e geolocalização GPS
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* View toggle (List / Map) */}
          <div className="bg-emerald-900/60 p-1 rounded-lg flex items-center border border-emerald-700/50">
            <button
              onClick={() => onViewChange('list')}
              className={`p-1.5 rounded-md text-xs font-medium flex items-center space-x-1 transition-all ${
                currentView === 'list'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-200 hover:text-white'
              }`}
              title="Visualizar em Lista"
            >
              <List className="w-4 h-4" />
              <span className="hidden md:inline">Lista</span>
            </button>
            <button
              onClick={() => onViewChange('map')}
              className={`p-1.5 rounded-md text-xs font-medium flex items-center space-x-1 transition-all ${
                currentView === 'map'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-200 hover:text-white'
              }`}
              title="Visualizar no Mapa"
            >
              <MapIcon className="w-4 h-4" />
              <span className="hidden md:inline">Mapa</span>
            </button>
          </div>

          {/* Quick New Entry Button in header for desktop */}
          <button
            onClick={onNewEntry}
            className="hidden sm:flex items-center space-x-1.5 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Registro</span>
          </button>
        </div>
      </div>
    </header>
  );
};
