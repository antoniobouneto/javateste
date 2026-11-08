import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { EntriesList } from './components/EntriesList';
import { EntryForm } from './components/EntryForm';
import { EntryDetail } from './components/EntryDetail';
import { MapView } from './components/MapView';
import { DiaryEntry } from './types/diary';
import { getAllEntries } from './services/storage';

export default function App() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'map' | 'form' | 'detail'>('list');
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getAllEntries();
      setEntries(data);
    } catch (err) {
      console.error('Falha ao carregar registros:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectEntry = (entry: DiaryEntry) => {
    setSelectedEntry(entry);
    setView('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNewEntry = () => {
    setView('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaved = (newEntry: DiaryEntry) => {
    setEntries((prev) => [newEntry, ...prev]);
    setSelectedEntry(newEntry);
    setView('detail');
    showToast('Registro salvo com sucesso!');
  };

  const handleDeleted = (deletedId: string) => {
    setEntries((prev) => prev.filter((item) => item.id !== deletedId));
    setSelectedEntry(null);
    setView('list');
    showToast('Registro excluído com sucesso.');
  };

  return (
    <div className="min-h-screen bg-stone-100/70 dark:bg-stone-900 text-stone-900 dark:text-stone-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-emerald-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg border border-emerald-600 animate-in fade-in slide-in-from-top-2 duration-200">
          {toastMessage}
        </div>
      )}

      {/* Main App Bar / Header */}
      <Header
        currentView={view === 'map' ? 'map' : 'list'}
        onViewChange={(v) => {
          setView(v);
          setSelectedEntry(null);
        }}
        onNewEntry={handleNewEntry}
        totalEntries={entries.length}
      />

      {/* Content Container */}
      <main className="flex-1 w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <div className="w-8 h-8 border-3 border-emerald-700 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-stone-500 font-medium">Carregando GeoDiário...</p>
          </div>
        ) : view === 'form' ? (
          <EntryForm
            onBack={() => setView('list')}
            onSaved={handleSaved}
          />
        ) : view === 'detail' && selectedEntry ? (
          <EntryDetail
            entry={selectedEntry}
            onBack={() => setView('list')}
            onDeleted={handleDeleted}
          />
        ) : view === 'map' ? (
          <MapView
            entries={entries}
            onSelectEntry={handleSelectEntry}
          />
        ) : (
          <EntriesList
            entries={entries}
            onSelectEntry={handleSelectEntry}
            onNewEntry={handleNewEntry}
          />
        )}
      </main>
    </div>
  );
}
