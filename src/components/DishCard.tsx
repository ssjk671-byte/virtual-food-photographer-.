import React, { useState, useRef } from 'react';
import {
  Camera,
  Wand2,
  Download,
  RotateCw,
  Sparkles,
  Maximize2,
  AlertCircle,
  Eye,
  Check,
  Layers,
  Upload,
} from 'lucide-react';
import { Dish, StyleType, PhotoVariation } from '../types';

interface DishCardProps {
  dish: Dish;
  onGeneratePhoto: (dishId: string) => void;
  onOpenEditor: (dish: Dish) => void;
  onSelectVariation: (dishId: string, variation: PhotoVariation) => void;
  onViewImage: (imageUrl: string, title: string) => void;
  onUploadPhoto?: (dishId: string) => void;
  onDirectImageAttach?: (dishId: string, imageDataUrl: string) => void;
}

export const DishCard: React.FC<DishCardProps> = ({
  dish,
  onGeneratePhoto,
  onOpenEditor,
  onSelectVariation,
  onViewImage,
  onUploadPhoto,
  onDirectImageAttach,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCardFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl && onDirectImageAttach) {
        onDirectImageAttach(dish.id, dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCardDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl && onDirectImageAttach) {
        onDirectImageAttach(dish.id, dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const getStyleBadge = (style?: StyleType) => {
    switch (style) {
      case 'rustic_dark':
        return { label: 'Rustic / Dark', color: 'bg-amber-950/80 text-amber-300 border-amber-800' };
      case 'bright_modern':
        return { label: 'Bright / Modern', color: 'bg-sky-950/80 text-sky-300 border-sky-800' };
      case 'social_media_topdown':
        return { label: 'Social Media', color: 'bg-fuchsia-950/80 text-fuchsia-300 border-fuchsia-800' };
      default:
        return { label: 'Studio Shot', color: 'bg-stone-800 text-stone-300 border-stone-700' };
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!dish.photoUrl) return;

    try {
      setDownloading(true);
      const link = document.createElement('a');
      link.href = dish.photoUrl;
      const cleanName = dish.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const sizeTag = dish.imageSize || '1K';
      link.download = `${cleanName}_${dish.photoStyle || 'studio'}_${sizeTag}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setTimeout(() => setDownloading(false), 800);
    }
  };

  const styleBadge = getStyleBadge(dish.photoStyle);

  return (
    <div className="group bg-stone-900/80 border border-stone-800/80 hover:border-amber-500/40 rounded-2xl overflow-hidden transition-all duration-300 flex flex-col shadow-xl hover:shadow-2xl hover:shadow-amber-500/5">
      {/* Photo Frame Container */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingOver(true);
        }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={handleCardDrop}
        className={`relative aspect-square w-full bg-stone-950 overflow-hidden flex items-center justify-center transition-all ${
          isDraggingOver ? 'ring-2 ring-amber-400 ring-inset bg-amber-950/20' : ''
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleCardFileSelect}
          className="hidden"
        />

        {isDraggingOver && (
          <div className="absolute inset-0 bg-stone-950/90 z-30 flex flex-col items-center justify-center p-4 text-center space-y-2 border-2 border-dashed border-amber-400">
            <Upload className="w-8 h-8 text-amber-400 animate-bounce" />
            <span className="text-xs font-bold text-amber-200">
              Drop food picture here to attach to {dish.name}
            </span>
          </div>
        )}

        {dish.photoUrl ? (
          <>
            <img
              src={dish.photoUrl}
              alt={dish.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />

            {/* Gradient Overlay for badges */}
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-transparent to-stone-950/40 opacity-80 group-hover:opacity-90 transition-opacity" />

            {/* Badges on top */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-1 z-10">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border backdrop-blur-md shadow-md ${styleBadge.color}`}>
                {styleBadge.label}
              </span>

              <div className="flex items-center gap-1.5">
                {dish.imageSize && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/90 text-stone-950 backdrop-blur-md shadow-md">
                    {dish.imageSize}
                  </span>
                )}
                {dish.modelUsed && (
                  <span className="hidden sm:inline-block text-[9px] font-mono px-1.5 py-0.5 rounded bg-stone-900/90 text-stone-300 border border-stone-700 backdrop-blur-md">
                    {dish.modelUsed === 'user_uploaded' ? 'My Photo' : dish.modelUsed.includes('pro') ? 'Pro' : 'Flash'}
                  </span>
                )}
              </div>
            </div>

            {/* Hover Action Bar */}
            <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-stone-950/50 backdrop-blur-[2px] z-20">
              <button
                onClick={() => onViewImage(dish.photoUrl!, dish.name)}
                className="p-2.5 rounded-xl bg-stone-900/90 hover:bg-stone-800 text-stone-200 border border-stone-700 shadow-lg transition cursor-pointer"
                title="View Full Resolution"
              >
                <Eye className="w-4 h-4" />
              </button>

              <button
                onClick={() => onOpenEditor(dish)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-lg transition cursor-pointer"
                title="AI Culinary Retouch & Edit (Gemini 3.1 Flash)"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>AI Retouch</span>
              </button>

              <button
                onClick={() => (onUploadPhoto ? onUploadPhoto(dish.id) : fileInputRef.current?.click())}
                className="p-2.5 rounded-xl bg-stone-900/90 hover:bg-stone-800 text-stone-200 border border-stone-700 shadow-lg transition cursor-pointer"
                title="Upload or replace with your own food picture"
              >
                <Upload className="w-4 h-4" />
              </button>

              <button
                onClick={() => onGeneratePhoto(dish.id)}
                className="p-2.5 rounded-xl bg-stone-900/90 hover:bg-stone-800 text-stone-200 border border-stone-700 shadow-lg transition cursor-pointer"
                title="Regenerate with current style"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              <button
                onClick={handleDownload}
                className="p-2.5 rounded-xl bg-stone-900/90 hover:bg-stone-800 text-stone-200 border border-stone-700 shadow-lg transition cursor-pointer"
                title="Download High-Res"
              >
                {downloading ? <Check className="w-4 h-4 text-emerald-400" /> : <Download className="w-4 h-4" />}
              </button>
            </div>
          </>
        ) : dish.isGenerating ? (
          // In-progress Studio Shooting State
          <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center animate-pulse">
                <Camera className="w-7 h-7 text-amber-400 animate-bounce" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500"></span>
              </span>
            </div>

            <div>
              <p className="text-xs font-semibold text-amber-300 flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>Shooting Studio Photo...</span>
              </p>
              <p className="text-[11px] text-stone-400 mt-1 max-w-[200px]">
                Staging lighting, culinary textures & specular highlights
              </p>
            </div>
          </div>
        ) : (
          // Unphotographed State
          <div className="flex flex-col items-center justify-center p-5 text-center space-y-3 w-full">
            <div className="w-12 h-12 rounded-2xl bg-stone-900 border border-stone-800/80 flex items-center justify-center text-stone-500 group-hover:text-amber-400 group-hover:border-amber-500/30 transition-colors">
              <Camera className="w-5 h-5" />
            </div>

            <div>
              <span className="text-[11px] uppercase tracking-wider font-semibold text-stone-400">
                Awaiting Studio Photo
              </span>
              <p className="text-[11px] text-stone-500 mt-0.5 max-w-[200px] leading-tight">
                Shoot with AI or attach your own dish picture
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => onGeneratePhoto(dish.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs shadow-md shadow-amber-500/10 transition cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Shoot AI</span>
              </button>

              <button
                onClick={() => (onUploadPhoto ? onUploadPhoto(dish.id) : fileInputRef.current?.click())}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white font-semibold text-xs border border-stone-700 transition cursor-pointer"
                title="Upload your own picture of this dish"
              >
                <Upload className="w-3.5 h-3.5 text-amber-400" />
                <span>Attach</span>
              </button>
            </div>
          </div>
        )}

        {/* Error overlay if generation failed */}
        {dish.error && (
          <div className="absolute inset-x-3 bottom-3 p-2.5 rounded-xl bg-rose-950/95 border border-rose-800 text-rose-200 text-xs flex items-start gap-2 shadow-lg backdrop-blur-md z-10">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 text-[11px] leading-tight">
              <span className="font-semibold block text-rose-200">Shoot Issue:</span>
              <span className="text-rose-300 line-clamp-2">{dish.error}</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onGeneratePhoto(dish.id);
              }}
              className="px-2 py-1 text-[10px] bg-rose-900/90 hover:bg-rose-800 text-rose-100 rounded font-medium transition cursor-pointer shrink-0"
              title="Retry shoot"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/* Variations Thumbnail Strip (if multiple photos generated) */}
      {dish.variations && dish.variations.length > 1 && (
        <div className="px-4 py-2 bg-stone-950/80 border-t border-b border-stone-800/60 flex items-center gap-2 overflow-x-auto">
          <span className="text-[10px] text-stone-400 flex items-center gap-1 font-mono uppercase shrink-0">
            <Layers className="w-3 h-3 text-amber-400" />
            <span>Takes ({dish.variations.length}):</span>
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            {dish.variations.map((v, idx) => {
              const isCurrent = dish.photoUrl === v.imageUrl;
              return (
                <button
                  key={v.id || idx}
                  onClick={() => onSelectVariation(dish.id, v)}
                  className={`relative w-8 h-8 rounded-lg overflow-hidden border shrink-0 transition cursor-pointer ${
                    isCurrent
                      ? 'border-amber-400 ring-2 ring-amber-400/40'
                      : 'border-stone-800 opacity-60 hover:opacity-100'
                  }`}
                  title={`${v.style} (${v.size})`}
                >
                  <img src={v.imageUrl} alt={`Variation ${idx + 1}`} className="w-full h-full object-cover" />
                  <span className="absolute bottom-0 right-0 text-[8px] font-mono px-0.5 bg-stone-950/90 text-stone-200">
                    {v.size}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Dish Content Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Category & Price */}
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-amber-400/90 font-mono">
              {dish.category}
            </span>
            {dish.price && (
              <span className="font-serif font-bold text-stone-100 text-sm">
                {dish.price}
              </span>
            )}
          </div>

          {/* Dish Name */}
          <h3 className="font-serif font-bold text-base text-stone-100 group-hover:text-amber-200 transition-colors">
            {dish.name}
          </h3>

          {/* Description */}
          <p className="text-xs text-stone-400 mt-1.5 leading-relaxed line-clamp-3">
            {dish.description}
          </p>
        </div>

        {/* Ingredients & Props */}
        <div className="pt-2 border-t border-stone-800/60 space-y-2">
          {dish.keyIngredients && dish.keyIngredients.length > 0 && (
            <div className="flex items-center flex-wrap gap-1">
              {dish.keyIngredients.slice(0, 4).map((ing, i) => (
                <span
                  key={i}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-stone-800/80 text-stone-300 border border-stone-700/60"
                >
                  {ing}
                </span>
              ))}
              {dish.keyIngredients.length > 4 && (
                <span className="text-[10px] text-stone-500">
                  +{dish.keyIngredients.length - 4} more
                </span>
              )}
            </div>
          )}

          {/* Action Buttons in footer */}
          <div className="flex items-center justify-between pt-1 gap-2">
            {dish.photoUrl ? (
              <>
                <button
                  onClick={() => onOpenEditor(dish)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold border border-stone-700 transition cursor-pointer"
                >
                  <Wand2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>AI Retouch</span>
                </button>

                <button
                  onClick={() => onGeneratePhoto(dish.id)}
                  disabled={dish.isGenerating}
                  className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30 transition cursor-pointer"
                  title="Reshoot with current style"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Reshoot</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => onGeneratePhoto(dish.id)}
                disabled={dish.isGenerating}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition shadow-md cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Shoot in Studio</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
