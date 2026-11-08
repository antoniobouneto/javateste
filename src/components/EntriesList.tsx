import React, { useState } from 'react';
import { Camera, Plus, Search, ChevronRight, MapPin, Calendar, ImageOff } from 'lucide-react';
import { DiaryEntry } from '../types/diary';

interface EntriesListProps {
  entries: DiaryEntry[];
  onSelectEntry: (entry: DiaryEntry) => void;
  onNewEntry: () => void;
}

export const EntriesList: React.FC<EntriesListProps> = ({
  entries,
  onSelectEntry,
  onNewEntry,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} às ${hours}:${minutes}`;
    } catch {
      return isoString;
    }
  };

  const filteredEntries = entries.filter((entry) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      entry.title.toLowerCase().includes(term) ||
      (entry.address && entry.address.toLowerCase().includes(term))
    );
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
      {/* Search Input if there are entries */}
      {entries.length > 0 && (
        <div className="mb-5 relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por título ou endereço..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-850 text-stone-900 dark:text-stone-100 text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500 shadow-xs"
          />
        </div>
      )}

      {/* Empty State matching Flutter RF04 */}
      {entries.length === 0 ? (
        <div className="text-center py-20 px-6 flex flex-col items-center justify-center">
          <div className="w-20 h-20 rounded-3xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mb-4 border border-emerald-100 dark:border-emerald-900/40">
            <Camera className="w-10 h-10" />
          </div>
          <h3 className="text-lg font-bold text-stone-800 dark:text-stone-200">
            Nenhum registro ainda
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 max-w-xs mt-2 leading-relaxed">
            Toque em <strong className="text-emerald-700 dark:text-emerald-400">+ Novo registro</strong> para fotografar um momento e salvar com data, hora e localização.
          </p>
          <button
            onClick={onNewEntry}
            className="mt-6 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center space-x-2 transition-all shadow-md shadow-emerald-900/10"
          >
            <Plus className="w-4 h-4" />
            <span>Criar primeiro registro</span>
          </button>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="text-center py-16 px-4">
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Nenhum registro encontrado para "{searchTerm}".
          </p>
          <button
            onClick={() => setSearchTerm('')}
            className="mt-2 text-xs text-emerald-700 dark:text-emerald-400 font-medium underline"
          >
            Limpar busca
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEntries.map((entry) => (
            <div
              key={entry.id}
              onClick={() => onSelectEntry(entry)}
              className="group bg-white dark:bg-stone-850 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs hover:shadow-md transition-all cursor-pointer overflow-hidden flex items-stretch"
            >
              {/* Thumbnail 110x110 matching Flutter spec */}
              <div className="w-28 h-28 sm:w-32 sm:h-32 shrink-0 bg-stone-100 dark:bg-stone-800 overflow-hidden relative">
                {entry.imageData ? (
                  <img
                    src={entry.imageData}
                    alt={entry.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-400">
                    <ImageOff className="w-6 h-6" />
                  </div>
                )}
              </div>

              {/* Information */}
              <div className="flex-1 p-3.5 flex flex-col justify-between min-w-0">
                <div>
                  <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 line-clamp-2 leading-snug group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                    {entry.title}
                  </h4>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 flex items-center space-x-1">
                    <Calendar className="w-3 h-3 text-stone-400 shrink-0" />
                    <span>{formatDate(entry.createdAt)}</span>
                  </p>
                </div>

                <div className="mt-2 flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400">
                  <span className="flex items-center space-x-1 font-mono text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-900/40">
                    <MapPin className="w-2.5 h-2.5 shrink-0" />
                    <span>
                      {entry.latitude.toFixed(4)}, {entry.longitude.toFixed(4)}
                    </span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Floating Action Button (FAB) matching Flutter: FloatingActionButton.extended */}
      <div className="fixed bottom-6 right-6 z-20">
        <button
          onClick={onNewEntry}
          className="flex items-center space-x-2 bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-white font-semibold py-3.5 px-5 rounded-2xl shadow-xl shadow-emerald-900/30 transition-all border border-emerald-600"
          title="Novo registro"
        >
          <Camera className="w-5 h-5" />
          <span className="text-sm">Novo registro</span>
        </button>
      </div>
    </div>
  );
};
