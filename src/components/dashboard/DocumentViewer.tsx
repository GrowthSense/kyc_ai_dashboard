import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertTriangle
} from 'lucide-react';
import { KYCDocument, DocumentType } from '@/types/kyc';
import { toAbsoluteUrl } from '@/utils/url';

interface DocumentViewerProps {
  documents: KYCDocument[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

const documentTypeLabels: Record<DocumentType, string> = {
  id_front: 'ID Card (Front)',
  id_back: 'ID Card (Back)',
  selfie: 'Selfie',
  proof_of_address: 'Proof of Address',
  passport: 'Passport',
  utility_bill: 'Utility Bill'
};

const guessKindFromUrl = (url: string) => {
  const u = url.toLowerCase();
  if (u.includes('.pdf')) return 'pdf';
  if (u.match(/\.(png|jpg|jpeg|webp|gif)$/)) return 'image';
  // If your server returns image bytes without extension, treat as image
  return 'image';
};

const DocumentViewer: React.FC<DocumentViewerProps> = ({
  documents,
  initialIndex = 0,
  isOpen,
  onClose
}) => {
  /**
   * IMPORTANT: Hooks must NEVER be below a conditional return.
   * This was your blank page problem ("Rendered more hooks than previous render").
   */
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  // keep index safe even if docs array changes
  const safeIndex = Math.min(
    Math.max(currentIndex, 0),
    Math.max(documents.length - 1, 0)
  );
  const currentDoc = documents[safeIndex];

  const currentDocSrc = useMemo(
    () => toAbsoluteUrl(currentDoc?.url),
    [currentDoc?.url]
  );

  const kind = useMemo(
    () => (currentDocSrc ? guessKindFromUrl(currentDocSrc) : 'image'),
    [currentDocSrc]
  );

  useEffect(() => {
    if (!isOpen) return;
    setCurrentIndex(initialIndex);
    setZoom(1);
    setRotation(0);
    setLoadError(null);
  }, [initialIndex, isOpen]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? documents.length - 1 : prev - 1));
    setZoom(1);
    setRotation(0);
    setLoadError(null);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === documents.length - 1 ? 0 : prev + 1));
    setZoom(1);
    setRotation(0);
    setLoadError(null);
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const handleDownload = () => {
    if (!currentDocSrc) return;
    const a = document.createElement('a');
    a.href = currentDocSrc;
    a.target = '_blank';
    a.rel = 'noreferrer';
    a.download = '';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // AFTER hooks: safe conditional return
  if (!isOpen || documents.length === 0 || !currentDoc) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors z-10"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      <div className="absolute top-4 left-4 right-16 flex items-center justify-between z-10">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
          <h3 className="text-white font-medium">{documentTypeLabels[currentDoc.type]}</h3>
          <p className="text-white/70 text-sm">
            Document {safeIndex + 1} of {documents.length}
          </p>
          <p className="text-white/50 text-xs mt-1 truncate max-w-[70vw]">
            {currentDocSrc}
          </p>
        </div>

        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
            currentDoc.verified ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
          }`}
        >
          {currentDoc.verified ? (
            <>
              <Check className="w-4 h-4" />
              <span className="text-sm font-medium">Verified</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">Pending Review</span>
            </>
          )}
        </div>
      </div>

      {documents.length > 1 && (
        <>
          <button
            onClick={handlePrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        </>
      )}

      <div className="flex-1 flex items-center justify-center p-16 overflow-hidden">
        {loadError ? (
          <div className="max-w-2xl text-center">
            <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-amber-300" />
            </div>
            <p className="text-white font-medium mb-2">Unable to preview this document</p>
            <p className="text-white/70 text-sm mb-4">{loadError}</p>
            <a
              href={currentDocSrc}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
            >
              Open in new tab
            </a>
          </div>
        ) : kind === 'pdf' ? (
          <iframe
            src={currentDocSrc}
            title="Document PDF"
            className="w-full h-[80vh] rounded-lg bg-white"
            onLoad={() => setLoadError(null)}
          />
        ) : (
          currentDocSrc ? (
          <img
            src={currentDocSrc}
            alt={documentTypeLabels[currentDoc.type]}
            className="max-w-full max-h-full object-contain transition-transform duration-200"
            style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
            onError={() => {
              setLoadError(
                `Failed to load document. Check DevTools → Network for the /documents/${currentDoc.id}/content request.`
              );
            }}
          />
        ) : (
          <div className="max-w-2xl text-center">
            <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-amber-300" />
            </div>
            <p className="text-white font-medium mb-2">Preview not available</p>
            <p className="text-white/70 text-sm">
              The document content could not be loaded. Check the browser console for details.
            </p>
          </div>
        )
        )}
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg p-2">
        <button
          onClick={handleZoomOut}
          disabled={zoom <= 0.5 || kind !== 'image'}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
        >
          <ZoomOut className="w-5 h-5 text-white" />
        </button>
        <span className="text-white text-sm w-16 text-center">{Math.round(zoom * 100)}%</span>
        <button
          onClick={handleZoomIn}
          disabled={zoom >= 3 || kind !== 'image'}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
        >
          <ZoomIn className="w-5 h-5 text-white" />
        </button>
        <div className="w-px h-6 bg-white/20 mx-1" />
        <button
          onClick={handleRotate}
          disabled={kind !== 'image'}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
        >
          <RotateCw className="w-5 h-5 text-white" />
        </button>
        <div className="w-px h-6 bg-white/20 mx-1" />
        <button onClick={handleDownload} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
          <Download className="w-5 h-5 text-white" />
        </button>
      </div>

      {documents.length > 1 && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg p-2">
          {documents.map((doc, index) => {
            const thumbSrc = toAbsoluteUrl(doc.url);
            return (
              <button
                key={doc.id}
                onClick={() => {
                  setCurrentIndex(index);
                  setZoom(1);
                  setRotation(0);
                  setLoadError(null);
                }}
                className={`w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                  index === safeIndex ? 'border-white' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img
                  src={thumbSrc}
                  alt={documentTypeLabels[doc.type]}
                  className="w-full h-full object-cover"
                  onError={() => {
                    // thumbnails can fail if server returns non-image (e.g. pdf) – ignore
                  }}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DocumentViewer;
