import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Save, Loader2, Edit3, Sparkles } from 'lucide-react';
import { ImageCapture } from './ImageCapture';
import { LocationCapture } from './LocationCapture';
import { DiaryEntry, LocationDataResult } from '../types/diary';
import { insertEntry } from '../services/storage';

interface EntryFormProps {
  onBack: () => void;
  onSaved: (newEntry: DiaryEntry) => void;
}

export const EntryForm: React.FC<EntryFormProps> = ({ onBack, onSaved }) => {
  const [title, setTitle] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [location, setLocation] = useState<LocationDataResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewDate] = useState(() => new Date());

  const isValid = title.trim().length > 0 && image !== null && location !== null;

  const formatDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} às ${hours}:${minutes}`;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || saving) return;

    setSaving(true);
    try {
      const now = new Date();
      const newEntry: DiaryEntry = {
        id: String(now.getTime()),
        title: title.trim(),
        imageData: image!,
        latitude: location!.latitude,
        longitude: location!.longitude,
        createdAt: now.toISOString(),
        address: location!.address,
      };

      await insertEntry(newEntry);
      onSaved(newEntry);
    } catch (err) {
      console.error('Erro ao salvar registro:', err);
      alert('Não foi possível salvar o registro.');
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      {/* Top Bar */}
      <div className="flex items-center space-x-3 mb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-colors"
          title="Voltar"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
            Novo Registro
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Associe uma foto às coordenadas geográficas e data/hora
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* RF01: Image Capture */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-2">
            1. Fotografia do momento
          </label>
          <ImageCapture
            onSelected={(dataUrl) => setImage(dataUrl)}
            selectedImage={image}
          />
        </div>

        {/* RF02: Title Input */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
            2. Título ou descrição
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
              <Edit3 className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Praça central no fim da tarde"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-850 text-stone-900 dark:text-stone-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 shadow-xs"
              autoFocus
            />
          </div>
        </div>

        {/* RF02: Location Capture */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
            3. Localização geográfica (GPS)
          </label>
          <LocationCapture
            onCaptured={(loc) => setLocation(loc)}
            currentLocation={location}
          />
        </div>

        {/* RF02: Date/Time automatic preview card */}
        <div className="bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-700/80 rounded-2xl p-4 flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-stone-700 dark:text-stone-300">
              Data e hora
            </h4>
            <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
              <span className="font-medium text-stone-900 dark:text-stone-100">
                {formatDate(previewDate)}
              </span>{' '}
              <span className="text-[11px] text-stone-400">
                (registrada automaticamente ao salvar)
              </span>
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={!isValid || saving}
            className="w-full py-3.5 px-5 rounded-2xl bg-emerald-700 hover:bg-emerald-600 active:scale-[0.99] text-white text-sm font-semibold flex items-center justify-center space-x-2 transition-all disabled:opacity-50 disabled:pointer-events-none shadow-md shadow-emerald-900/10"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Salvando registro...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Salvar registro</span>
              </>
            )}
          </button>

          {!isValid && (
            <p className="text-center text-xs text-stone-400 dark:text-stone-500 mt-2.5">
              Preencha o título, capture uma foto e obtenha a localização para salvar.
            </p>
          )}
        </div>
      </form>
    </div>
  );
};
