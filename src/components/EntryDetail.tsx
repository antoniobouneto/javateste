import React, { useState } from 'react';
import { ArrowLeft, Trash2, Calendar, MapPin, ExternalLink, Navigation, AlertTriangle, Share2 } from 'lucide-react';
import { DiaryEntry } from '../types/diary';
import { deleteEntryFromDB } from '../services/storage';

interface EntryDetailProps {
  entry: DiaryEntry;
  onBack: () => void;
  onDeleted: (deletedId: string) => void;
}

export const EntryDetail: React.FC<EntryDetailProps> = ({
  entry,
  onBack,
  onDeleted,
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteEntryFromDB(entry.id);
      onDeleted(entry.id);
    } catch (err) {
      console.error('Erro ao excluir:', err);
      alert('Não foi possível excluir o registro.');
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const googleMapsUrl = `https://www.google.com/maps?q=${entry.latitude},${entry.longitude}`;
  const openStreetMapUrl = `https://www.openstreetmap.org/?mlat=${entry.latitude}&mlon=${entry.longitude}#map=16/${entry.latitude}/${entry.longitude}`;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-colors flex items-center space-x-1.5 text-xs font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar</span>
        </button>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: entry.title,
                  text: `Registro GeoDiário: ${entry.title} (${entry.latitude}, ${entry.longitude})`,
                  url: window.location.href,
                }).catch(() => {});
              } else {
                navigator.clipboard.writeText(`${entry.title} - ${entry.latitude}, ${entry.longitude}`);
                alert('Informações copiadas para a área de transferência!');
              }
            }}
            className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 transition-colors"
            title="Compartilhar"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="p-2 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 transition-colors flex items-center space-x-1 text-xs font-medium"
            title="Excluir registro"
          >
            <Trash2 className="w-4 h-4" />
            <span>Excluir</span>
          </button>
        </div>
      </div>

      {/* Main Photo (4:3 Aspect Ratio) */}
      <div className="w-full aspect-4/3 rounded-2xl overflow-hidden bg-stone-100 dark:bg-stone-850 border border-stone-200 dark:border-stone-800 shadow-md">
        <img
          src={entry.imageData}
          alt={entry.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Title & Info Card */}
      <div className="mt-5 space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100 leading-tight">
            {entry.title}
          </h2>
          {entry.address && (
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{entry.address}</span>
            </p>
          )}
        </div>

        {/* Metadata Card */}
        <div className="bg-white dark:bg-stone-850 rounded-2xl border border-stone-200 dark:border-stone-800 divide-y divide-stone-100 dark:divide-stone-800 shadow-xs">
          {/* Date & Time */}
          <div className="p-4 flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                Data e hora
              </p>
              <p className="text-sm font-medium text-stone-900 dark:text-stone-100 mt-0.5">
                {formatDate(entry.createdAt)}
              </p>
            </div>
          </div>

          {/* GPS Coordinates */}
          <div className="p-4 flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <Navigation className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                Localização (GPS)
              </p>
              <div className="mt-1 space-y-0.5 text-xs text-stone-700 dark:text-stone-300 font-mono">
                <p>Latitude: <span className="font-semibold">{entry.latitude.toFixed(6)}</span></p>
                <p>Longitude: <span className="font-semibold">{entry.longitude.toFixed(6)}</span></p>
              </div>

              {/* External Map Links */}
              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 hover:bg-emerald-200 text-emerald-800 dark:text-emerald-300 text-xs font-medium transition-colors"
                >
                  <span>Ver no Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href={openStreetMapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-medium transition-colors"
                >
                  <span>OpenStreetMap</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Embedded Mini-Map Preview */}
        <div className="rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-800 shadow-xs h-56 bg-stone-100 dark:bg-stone-800">
          <iframe
            title={`Mapa de ${entry.title}`}
            width="100%"
            height="100%"
            frameBorder="0"
            scrolling="no"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${entry.longitude - 0.005}%2C${entry.latitude - 0.003}%2C${entry.longitude + 0.005}%2C${entry.latitude + 0.003}&layer=mapnik&marker=${entry.latitude}%2C${entry.longitude}`}
            className="w-full h-full border-0"
          />
        </div>
      </div>

      {/* Delete Confirmation Modal (RF05) */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 dark:border-stone-800 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
              Excluir registro?
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-2 leading-relaxed">
              A foto e as informações deste registro serão removidas permanentemente do dispositivo.
            </p>
            <div className="mt-6 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="px-4 py-2 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors shadow-sm"
              >
                {deleting ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
