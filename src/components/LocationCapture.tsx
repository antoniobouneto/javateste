import React, { useState } from 'react';
import { MapPin, Navigation, Loader2, AlertCircle, CheckCircle2, Edit2 } from 'lucide-react';
import { LocationDataResult } from '../types/diary';

interface LocationCaptureProps {
  onCaptured: (location: LocationDataResult) => void;
  currentLocation: LocationDataResult | null;
}

export const LocationCapture: React.FC<LocationCaptureProps> = ({
  onCaptured,
  currentLocation,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showManualEdit, setShowManualEdit] = useState(false);
  const [manualLat, setManualLat] = useState(currentLocation ? String(currentLocation.latitude) : '-23.550520');
  const [manualLng, setManualLng] = useState(currentLocation ? String(currentLocation.longitude) : '-46.633308');

  // Reverse geocode lat/lng to get address
  const fetchAddress = async (lat: number, lng: number): Promise<string | undefined> => {
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { 'User-Agent': 'GeoDiario-App' } }
      );
      if (resp.ok) {
        const data = await resp.json();
        return data.display_name;
      }
    } catch {
      // ignore network errors for reverse geocoding
    }
    return undefined;
  };

  const captureGPS = () => {
    if (loading) return;
    setLoading(true);
    setErrorMessage(null);

    if (!navigator.geolocation) {
      setErrorMessage('Geolocalização não é suportada por este navegador.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = pos.coords.accuracy;

        const address = await fetchAddress(lat, lng);

        const result: LocationDataResult = {
          latitude: lat,
          longitude: lng,
          accuracy,
          address,
        };

        onCaptured(result);
        setManualLat(String(lat));
        setManualLng(String(lng));
        setLoading(false);
      },
      (err) => {
        console.warn('Erro ao obter GPS:', err);
        let msg = 'Falha ao obter localização. Verifique o GPS e as permissões.';
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'Permissão de GPS negada pelo navegador.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = 'Sinal de GPS indisponível no momento.';
        } else if (err.code === err.TIMEOUT) {
          msg = 'Tempo limite esgotado ao buscar sinal GPS.';
        }
        setErrorMessage(msg);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleManualSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (isNaN(lat) || isNaN(lng)) return;

    setLoading(true);
    const address = await fetchAddress(lat, lng);
    onCaptured({
      latitude: lat,
      longitude: lng,
      accuracy: 10,
      address,
    });
    setLoading(false);
    setShowManualEdit(false);
  };

  return (
    <div className="bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-700/80 rounded-2xl p-4 transition-all">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              currentLocation
                ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
                : 'bg-stone-200 dark:bg-stone-800 text-stone-500 dark:text-stone-400'
            }`}
          >
            {currentLocation ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Navigation className="w-5 h-5" />
            )}
          </div>

          <div>
            <h4 className="text-xs font-semibold text-stone-700 dark:text-stone-300">
              {currentLocation ? 'Localização Capturada' : 'Localização não capturada'}
            </h4>
            {currentLocation ? (
              <div className="mt-1 space-y-0.5">
                <p className="text-xs font-mono font-medium text-stone-800 dark:text-stone-200">
                  Lat: {currentLocation.latitude.toFixed(6)} | Lng: {currentLocation.longitude.toFixed(6)}
                </p>
                {currentLocation.address && (
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-1">
                    {currentLocation.address}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                Obtenha as coordenadas GPS atuais para associar à foto.
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowManualEdit(!showManualEdit)}
          className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1"
          title="Ajustar coordenadas manualmente"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {errorMessage && (
        <div className="mt-3 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-900/60 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{errorMessage}</span>
          <button
            type="button"
            onClick={() => setShowManualEdit(true)}
            className="underline font-semibold"
          >
            Definir manual
          </button>
        </div>
      )}

      {showManualEdit && (
        <form onSubmit={handleManualSave} className="mt-3 p-3 bg-stone-100 dark:bg-stone-800 rounded-xl space-y-2 text-xs">
          <p className="font-semibold text-stone-700 dark:text-stone-300">Coordenadas manuais (Lat / Lng):</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-stone-500">Latitude</label>
              <input
                type="number"
                step="any"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
                className="w-full px-2 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900"
              />
            </div>
            <div>
              <label className="text-[10px] text-stone-500">Longitude</label>
              <input
                type="number"
                step="any"
                value={manualLng}
                onChange={(e) => setManualLng(e.target.value)}
                className="w-full px-2 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-1">
            <button
              type="button"
              onClick={() => setShowManualEdit(false)}
              className="px-2.5 py-1 text-stone-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-3 py-1 bg-emerald-700 text-white rounded-lg font-medium"
            >
              Aplicar
            </button>
          </div>
        </form>
      )}

      <div className="mt-3">
        <button
          type="button"
          onClick={captureGPS}
          disabled={loading}
          className="w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors disabled:opacity-60 shadow-sm"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Buscando sinal GPS...</span>
            </>
          ) : (
            <>
              <MapPin className="w-4 h-4" />
              <span>{currentLocation ? 'Atualizar localização' : 'Obter localização (GPS)'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
