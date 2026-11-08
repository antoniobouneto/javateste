import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, Upload, Image as ImageIcon, Video, StopCircle } from 'lucide-react';

interface ImageCaptureProps {
  onSelected: (imageDataUrl: string) => void;
  selectedImage: string | null;
}

export const ImageCapture: React.FC<ImageCaptureProps> = ({
  onSelected,
  selectedImage,
}) => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera when unmounting
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Câmera não suportada neste navegador.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      streamRef.current = stream;
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: unknown) {
      console.warn('Erro ao acessar webcam:', err);
      setCameraError('Permissão da câmera não concedida ou dispositivo sem câmera.');
      // Open file picker directly as fallback
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }
  };

  // Re-attach video stream if camera is active and element is ready
  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isCameraActive]);

  const capturePhotoFromVideo = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      stopCameraStream();
      onSelected(dataUrl);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        stopCameraStream();
        onSelected(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col space-y-3">
      {/* Hidden file input for file picker and mobile camera trigger */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Main Preview Container */}
      <div className="relative h-60 w-full rounded-2xl bg-stone-100 dark:bg-stone-800/80 border-2 border-dashed border-stone-300 dark:border-stone-700 overflow-hidden flex flex-col items-center justify-center transition-all">
        {isCameraActive ? (
          <div className="relative w-full h-full bg-black flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center space-x-4">
              <button
                type="button"
                onClick={capturePhotoFromVideo}
                className="w-14 h-14 rounded-full bg-white border-4 border-emerald-500 shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
                title="Tirar Foto"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-600" />
              </button>
              <button
                type="button"
                onClick={stopCameraStream}
                className="px-3 py-1.5 rounded-lg bg-black/60 text-white text-xs backdrop-blur-xs hover:bg-black/80 flex items-center space-x-1"
              >
                <StopCircle className="w-3.5 h-3.5" />
                <span>Cancelar</span>
              </button>
            </div>
          </div>
        ) : selectedImage ? (
          <div className="relative w-full h-full group">
            <img
              src={selectedImage}
              alt="Foto capturada"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-xs font-semibold px-3 py-1 bg-black/60 rounded-full">
                Foto Pronta
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center p-6 flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mb-3">
              <Camera className="w-7 h-7" />
            </div>
            <p className="text-sm font-medium text-stone-700 dark:text-stone-300">
              Nenhuma foto capturada
            </p>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-xs">
              Tire uma foto agora com a câmera ou escolha uma imagem do seu dispositivo.
            </p>
            {cameraError && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                {cameraError}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={startCamera}
          className="flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/70 dark:hover:bg-emerald-900 text-emerald-900 dark:text-emerald-200 text-xs font-semibold transition-colors border border-emerald-300/60 dark:border-emerald-800"
        >
          {selectedImage ? (
            <>
              <RefreshCw className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />
              <span>Abrir Câmera</span>
            </>
          ) : (
            <>
              <Video className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />
              <span>Abrir Câmera</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-750 text-stone-800 dark:text-stone-200 text-xs font-semibold transition-colors border border-stone-300/80 dark:border-stone-700"
        >
          <Upload className="w-4 h-4 text-stone-600 dark:text-stone-400" />
          <span>{selectedImage ? 'Trocar Arquivo' : 'Escolher Foto'}</span>
        </button>
      </div>
    </div>
  );
};
