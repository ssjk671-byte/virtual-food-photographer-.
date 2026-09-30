import React from 'react';
import { Camera, UtensilsCrossed, Sparkles, BookOpen, Upload, Layers, Archive, ImagePlus } from 'lucide-react';
import { StudioSettings } from '../types';

interface HeaderProps {
  restaurantName: string;
  cuisineType: string;
  dishCount: number;
  photographedCount: number;
  settings: StudioSettings;
  onOpenUpload: () => void;
  onOpenUploadPhoto: () => void;
  onOpenLookbook: () => void;
  onOpenCustomShot: () => void;
  onOpenBulkExport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  restaurantName,
  cuisineType,
  dishCount,
  photographedCount,
  settings,
  onOpenUpload,
  onOpenUploadPhoto,
  onOpenLookbook,
  onOpenCustomShot,
  onOpenBulkExport,
}) => {
  const percentComplete = dishCount > 0 ? Math.round((photographedCount / dishCount) * 100) : 0;

  return (
    <header className="border-b border-amber-950/20 bg-stone-950 text-stone-100 sticky top-0 z-40 shadow-xl backdrop-blur-md bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Logo & Restaurant Title */}
          <div className="flex items-center gap-3.5">
            <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-stone-950 shadow-lg shadow-amber-500/20 ring-1 ring-amber-400/40">
              <Camera className="w-5 h-5 text-stone-950" />
              <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-stone-950">
                <Sparkles className="w-2 h-2 text-stone-950" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-serif font-bold tracking-tight text-stone-50 flex items-center gap-2">
                  <span>Virtual Food Photographer</span>
                  <span className="text-[10px] uppercase font-sans tracking-widest font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    AI Studio
                  </span>
                </h1>
              </div>

              <div className="flex items-center gap-2 text-xs text-stone-400 mt-0.5">
                <span className="font-medium text-stone-200">{restaurantName || 'Culinary Studio'}</span>
                {cuisineType && (
                  <>
                    <span className="text-stone-600">•</span>
                    <span className="text-amber-300/80">{cuisineType}</span>
                  </>
                )}
                <span className="text-stone-600">•</span>
                <span className="flex items-center gap-1 text-stone-400">
                  <span className="font-semibold text-emerald-400">{photographedCount}</span>/{dishCount} dishes shot ({percentComplete}%)
                </span>
              </div>
            </div>
          </div>

          {/* Model Status & Action Buttons */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Active Model Pill */}
            <div className="hidden lg:flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg bg-stone-900 border border-stone-800 text-stone-300">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>
                Model:{' '}
                <strong className="text-stone-100 font-mono text-[11px]">
                  {settings.model === 'gemini-3-pro-image-preview' ? 'Gemini 3 Pro' : 'Gemini 3.1 Flash'}
                </strong>
              </span>
              <span className="bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">
                {settings.imageSize}
              </span>
            </div>

            {/* Attach Food Photo Button */}
            <button
              onClick={onOpenUploadPhoto}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-700/80 text-xs font-medium transition cursor-pointer"
              title="Upload or attach your own food picture to enhance, edit, or assign to a dish"
            >
              <ImagePlus className="w-3.5 h-3.5 text-amber-400" />
              <span>Attach Food Photo</span>
            </button>

            {/* Custom Studio Shot Button */}
            <button
              onClick={onOpenCustomShot}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-700/80 text-xs font-medium transition cursor-pointer"
              title="Create a custom food photo from freeform text prompt"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Custom Shot</span>
            </button>

            {/* Lookbook Button */}
            <button
              onClick={onOpenLookbook}
              disabled={photographedCount === 0}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer ${
                photographedCount > 0
                  ? 'bg-amber-950/40 border-amber-600/50 text-amber-200 hover:bg-amber-900/50 shadow-sm'
                  : 'bg-stone-900/60 border-stone-800 text-stone-500 cursor-not-allowed'
              }`}
              title="View & export photo lookbook"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Menu Lookbook</span>
              {photographedCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                  {photographedCount}
                </span>
              )}
            </button>

            {/* Bulk Export (ZIP) Button */}
            <button
              onClick={onOpenBulkExport}
              disabled={photographedCount === 0}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                photographedCount > 0
                  ? 'bg-stone-900 hover:bg-stone-800 text-amber-300 border-amber-500/40 shadow-sm hover:border-amber-400'
                  : 'bg-stone-900/60 border-stone-800 text-stone-500 cursor-not-allowed'
              }`}
              title="Bundle all generated dish photos into a ZIP file"
            >
              <Archive className="w-3.5 h-3.5 text-amber-400" />
              <span>Bulk Export (ZIP)</span>
            </button>

            {/* Upload / Switch Menu Button */}
            <button
              onClick={onOpenUpload}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-semibold text-xs transition shadow-md shadow-amber-500/10 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Menu</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        {dishCount > 0 && (
          <div className="w-full bg-stone-900 h-1 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 h-full transition-all duration-500"
              style={{ width: `${percentComplete}%` }}
            />
          </div>
        )}
      </div>
    </header>
  );
};
