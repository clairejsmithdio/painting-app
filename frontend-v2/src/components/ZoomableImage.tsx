import { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ZoomableImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function ZoomableImage({ src, alt, className }: ZoomableImageProps) {
  const [zoom, setZoom] = useState(100);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const MIN_ZOOM = 100;
  const MAX_ZOOM = 300;
  const ZOOM_STEP = 20;

  const handleZoom = (direction: 'in' | 'out') => {
    setZoom((prev) => {
      const newZoom = direction === 'in' ? prev + ZOOM_STEP : prev - ZOOM_STEP;
      return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
    });
  };

  const handleReset = () => {
    setZoom(100);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 100) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && containerRef.current) {
      const container = containerRef.current;
      const maxX = (container.offsetWidth * (zoom - 100)) / 100;
      const maxY = (container.offsetHeight * (zoom - 100)) / 100;

      let newX = e.clientX - dragStart.x;
      let newY = e.clientY - dragStart.y;

      newX = Math.max(-maxX, Math.min(0, newX));
      newY = Math.max(-maxY, Math.min(0, newY));

      setPosition({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    handleZoom(e.deltaY < 0 ? 'in' : 'out');
  };

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden bg-muted rounded-lg group', className)}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      style={{ cursor: isDragging ? 'grabbing' : zoom > 100 ? 'grab' : 'default' }}
    >
      <img
        ref={imageRef}
        src={src}
        alt={alt}
        className="w-full h-full object-cover transition-transform"
        style={{
          transform: `scale(${zoom / 100}) translate(${position.x}px, ${position.y}px)`,
          transformOrigin: 'center',
        }}
      />

      {/* Controls */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-2 bg-navy/90 rounded-full p-2">
          <button
            onClick={() => handleZoom('out')}
            disabled={zoom <= MIN_ZOOM}
            className="p-2 hover:bg-navy text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
            title="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="px-2 text-white text-sm font-medium min-w-[3rem] text-center">
            {zoom}%
          </span>
          <button
            onClick={() => handleZoom('in')}
            disabled={zoom >= MAX_ZOOM}
            className="p-2 hover:bg-navy text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
            title="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>

        {zoom > 100 && (
          <button
            onClick={handleReset}
            className="p-2 bg-coral/90 hover:bg-coral text-white rounded-full transition"
            title="Reset zoom and position"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Zoom hint */}
      {zoom === 100 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-navy/80 text-white px-3 py-2 rounded-full text-sm">
            Scroll to zoom, drag to pan
          </div>
        </div>
      )}
    </div>
  );
}
