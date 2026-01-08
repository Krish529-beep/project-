
import React, { useRef, useState, useCallback, useEffect } from 'react';

interface CameraViewProps {
  onCapture: (imageData: string) => void;
  onCancel: () => void;
}

export const CameraView: React.FC<CameraViewProps> = ({ onCapture, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' },
          audio: false 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsStreaming(true);
        }
      } catch (err) {
        setError('Could not access camera. Please ensure you have granted permissions.');
      }
    };

    startCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const takePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const data = canvas.toDataURL('image/jpeg');
        onCapture(data);
      }
    }
  }, [onCapture]);

  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center p-4">
      <div className="relative w-full max-w-md aspect-[3/4] bg-gray-900 rounded-2xl overflow-hidden shadow-2xl">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-white">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl text-red-500">⚠️</span>
            </div>
            <p className="font-medium">{error}</p>
            <button 
              onClick={onCancel}
              className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              Go Back
            </button>
          </div>
        ) : (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
            {!isStreaming && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </>
        )}
      </div>

      {!error && isStreaming && (
        <div className="mt-8 flex items-center gap-12">
          <button 
            onClick={onCancel}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
          >
            ✕
          </button>
          <button 
            onClick={takePhoto}
            className="w-20 h-20 bg-white rounded-full p-1 shadow-lg active:scale-95 transition-transform"
          >
            <div className="w-full h-full rounded-full border-4 border-black/10 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-[#1A73E8]"></div>
            </div>
          </button>
          <div className="w-12 h-12"></div>
        </div>
      )}
    </div>
  );
};
