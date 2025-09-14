import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ZoomIn, ZoomOut, Download, ChevronLeft, ChevronRight } from "lucide-react";

interface PhotoViewerProps {
  photos: (string | { url: string; name?: string })[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

export const PhotoViewer = ({ photos, initialIndex = 0, isOpen, onClose }: PhotoViewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);

  const currentPhoto = photos[currentIndex];
  const photoUrl = typeof currentPhoto === 'string' ? currentPhoto : currentPhoto?.url;
  const photoName = typeof currentPhoto === 'object' ? currentPhoto?.name : `foto-${currentIndex + 1}`;

  const nextPhoto = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
    setZoom(1);
  };

  const prevPhoto = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
    setZoom(1);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleDownload = () => {
    if (photoUrl) {
      const link = document.createElement('a');
      link.href = photoUrl;
      link.download = photoName || 'foto';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleClose = () => {
    setZoom(1);
    setCurrentIndex(initialIndex);
    onClose();
  };

  React.useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, isOpen]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'Escape':
          handleClose();
          break;
        case 'ArrowLeft':
          if (photos.length > 1) prevPhoto();
          break;
        case 'ArrowRight':
          if (photos.length > 1) nextPhoto();
          break;
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, photos.length]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/90 border-none">
        {/* Header with controls */}
        <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <span className="text-sm font-medium">
              {currentIndex + 1} de {photos.length}
            </span>
            {photoName && (
              <span className="text-xs text-gray-300">({photoName})</span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleZoomOut}
              className="bg-black/50 border-white/20 text-white hover:bg-black/70"
              disabled={zoom <= 0.5}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            
            <span className="text-white text-sm min-w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            
            <Button
              variant="outline"
              size="icon"
              onClick={handleZoomIn}
              className="bg-black/50 border-white/20 text-white hover:bg-black/70"
              disabled={zoom >= 3}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={handleDownload}
              className="bg-black/50 border-white/20 text-white hover:bg-black/70"
            >
              <Download className="w-4 h-4" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={handleClose}
              className="bg-black/50 border-white/20 text-white hover:bg-black/70"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Navigation arrows */}
        {photos.length > 1 && (
          <>
            <Button
              variant="outline"
              size="icon"
              onClick={prevPhoto}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-50 bg-black/50 border-white/20 text-white hover:bg-black/70"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={nextPhoto}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-50 bg-black/50 border-white/20 text-white hover:bg-black/70"
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          </>
        )}

        {/* Image container */}
        <div 
          className="flex items-center justify-center h-[95vh] overflow-hidden cursor-move"
          onClick={(e) => {
            // Close on backdrop click, but not on image click
            if (e.target === e.currentTarget) {
              handleClose();
            }
          }}
        >
          {photoUrl && (
            <img
              src={photoUrl}
              alt={`Foto ${currentIndex + 1}`}
              className="max-w-none max-h-none object-contain transition-transform duration-200"
              style={{ 
                transform: `scale(${zoom})`,
                maxWidth: zoom === 1 ? '90vw' : 'none',
                maxHeight: zoom === 1 ? '90vh' : 'none',
              }}
              draggable={false}
            />
          )}
        </div>

        {/* Thumbnails strip for multiple photos */}
        {photos.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50">
            <div className="flex gap-2 p-2 bg-black/50 rounded-lg max-w-[80vw] overflow-x-auto">
              {photos.map((photo, index) => {
                const thumbUrl = typeof photo === 'string' ? photo : photo.url;
                return (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`flex-shrink-0 w-12 h-12 rounded border-2 overflow-hidden transition-all ${
                      index === currentIndex 
                        ? 'border-white shadow-lg' 
                        : 'border-white/30 hover:border-white/60'
                    }`}
                  >
                    <img
                      src={thumbUrl}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

interface PhotoGridProps {
  photos: (string | { url: string; name?: string })[];
  className?: string;
  maxVisible?: number;
}

export const PhotoGrid = ({ photos, className = "", maxVisible = 6 }: PhotoGridProps) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (!photos || photos.length === 0) return null;

  const visiblePhotos = photos.slice(0, maxVisible);
  const remainingCount = Math.max(0, photos.length - maxVisible);

  return (
    <>
      <div className={`grid grid-cols-2 sm:grid-cols-3 gap-2 ${className}`}>
        {visiblePhotos.map((photo, index) => {
          const photoUrl = typeof photo === 'string' ? photo : photo.url;
          const isLast = index === maxVisible - 1 && remainingCount > 0;
          
          return (
            <div
              key={index}
              className="relative group cursor-pointer overflow-hidden rounded border"
              onClick={() => setSelectedIndex(index)}
            >
              <img
                src={photoUrl}
                alt={`Foto ${index + 1}`}
                className="w-full h-20 object-cover transition-transform group-hover:scale-105"
              />
              
              {/* Overlay with hover effect */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              
              {/* Show remaining count on last visible photo */}
              {isLast && (
                <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                  <span className="text-white font-medium">
                    +{remainingCount}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <PhotoViewer
        photos={photos}
        initialIndex={selectedIndex || 0}
        isOpen={selectedIndex !== null}
        onClose={() => setSelectedIndex(null)}
      />
    </>
  );
};