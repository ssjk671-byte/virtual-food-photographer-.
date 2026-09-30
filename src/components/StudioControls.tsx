import React, { useState } from 'react';
import {
  Sparkles,
  Camera,
  Sun,
  Moon,
  Smartphone,
  Sliders,
  Maximize2,
  Cpu,
  Layers,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronUp,
  Archive,
  ShieldCheck,
  Type,
  Layout,
  ImagePlus,
} from 'lucide-react';
import { StyleType, ModelType, ImageSize, AspectRatio, StudioSettings, WatermarkPosition } from '../types';

interface StudioControlsProps {
  settings: StudioSettings;
  onChangeSettings: (settings: Partial<StudioSettings>) => void;
  onPhotographAll: () => void;
  onOpenBulkExport?: () => void;
  onOpenUploadPhoto?: () => void;
  onApplyWatermarkToAll?: () => void;
  isBatchGenerating: boolean;
  unphotographedCount: number;
  totalCount: number;
  photographedCount?: number;
  restaurantName: string;
}

export const StudioControls: React.FC<StudioControlsProps> = ({
  settings,
  onChangeSettings,
  onPhotographAll,
  onOpenBulkExport,
  onOpenUploadPhoto,
  onApplyWatermarkToAll,
  isBatchGenerating,
  unphotographedCount,
  totalCount,
  photographedCount = 0,
  restaurantName,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showWatermarkConfig, setShowWatermarkConfig] = useState(false);

  const styleOptions: {
    id: StyleType;
    label: string;
    tagline: string;
    icon: React.ReactNode;
    color: string;
    bgGrad: string;
    borderActive: string;
  }[] = [
    {
      id: 'rustic_dark',
      label: 'Rustic / Dark',
      tagline: 'Moody chiaroscuro, slate & dark wood, artisan pottery, rich warm shadows',
      icon: <Moon className="w-4 h-4 text-amber-300" />,
      color: 'text-amber-300',
      bgGrad: 'from-amber-950/40 via-stone-900 to-stone-950',
      borderActive: 'border-amber-500 ring-2 ring-amber-500/20 shadow-amber-900/30',
    },
    {
      id: 'bright_modern',
      label: 'Bright / Modern',
      tagline: 'Airy natural daylight, Carrara marble, vibrant crisp colors, fresh herbs',
      icon: <Sun className="w-4 h-4 text-sky-300" />,
      color: 'text-sky-300',
      bgGrad: 'from-sky-950/30 via-stone-900 to-stone-950',
      borderActive: 'border-sky-400 ring-2 ring-sky-500/20 shadow-sky-950/40',
    },
    {
      id: 'social_media_topdown',
      label: 'Social Media',
      tagline: '90° flat-lay bird’s-eye view, styled cutlery, ramekins, Instagram-ready',
      icon: <Smartphone className="w-4 h-4 text-fuchsia-300" />,
      color: 'text-fuchsia-300',
      bgGrad: 'from-fuchsia-950/30 via-stone-900 to-stone-950',
      borderActive: 'border-fuchsia-400 ring-2 ring-fuchsia-500/20 shadow-fuchsia-950/40',
    },
  ];

  const sizeOptions: { value: ImageSize; label: string; desc: string; badge: string }[] = [
    { value: '1K', label: '1K', desc: '1024×1024', badge: 'Standard' },
    { value: '2K', label: '2K', desc: '2048×2048', badge: 'Ultra Crisp' },
    { value: '4K', label: '4K', desc: '4096×4096', badge: 'Master Print' },
  ];

  const aspectOptions: { value: AspectRatio; label: string; desc: string }[] = [
    { value: '1:1', label: '1:1', desc: 'Square / Menu' },
    { value: '4:3', label: '4:3', desc: 'Editorial' },
    { value: '16:9', label: '16:9', desc: 'Banner' },
    { value: '3:4', label: '3:4', desc: 'Story' },
  ];

  return (
    <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-md mb-8">
      {/* Top Header & Batch Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-stone-800/80">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-200">
              Studio Photography Direction
            </h2>
          </div>
          <p className="text-xs text-stone-400 mt-0.5">
            Select aesthetic lighting and camera configuration for all dish shots.
          </p>
        </div>

        {/* Batch Photograph, Attach Photo & Bulk Export Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {onOpenUploadPhoto && (
            <button
              onClick={onOpenUploadPhoto}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-semibold text-xs tracking-wide bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-700/80 hover:border-amber-500/40 transition shadow-md cursor-pointer"
              title="Upload your restaurant's food pictures to enhance, edit, or assign to menu dishes"
            >
              <ImagePlus className="w-3.5 h-3.5 text-amber-400" />
              <span>Attach Food Photo</span>
            </button>
          )}

          {photographedCount > 0 && onOpenBulkExport && (
            <button
              onClick={onOpenBulkExport}
              disabled={isBatchGenerating}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-semibold text-xs tracking-wide bg-stone-950/80 hover:bg-stone-800 text-amber-300 border border-amber-500/40 hover:border-amber-400 transition shadow-md cursor-pointer disabled:opacity-50"
              title="Download all generated photos as a ZIP archive"
            >
              <Archive className="w-3.5 h-3.5 text-amber-400" />
              <span>Bulk Export (ZIP)</span>
              <span className="px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold">
                {photographedCount}
              </span>
            </button>
          )}

          <button
            onClick={onPhotographAll}
            disabled={isBatchGenerating || totalCount === 0}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs tracking-wide transition shadow-lg cursor-pointer ${
              isBatchGenerating
                ? 'bg-amber-600/50 text-amber-100 cursor-wait'
                : totalCount === 0
                ? 'bg-stone-800 text-stone-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 shadow-amber-500/20'
            }`}
          >
            {isBatchGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-stone-950" />
                <span>Shooting Menu in Studio...</span>
              </>
            ) : (
              <>
                <Camera className="w-4 h-4" />
                <span>
                  Photograph All Dishes{' '}
                  {unphotographedCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-md bg-stone-950/20 text-stone-950 font-bold text-[11px]">
                      ({unphotographedCount} left)
                    </span>
                  )}
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Style Toggles (Rustic/Dark, Bright/Modern, Social Media top-down) */}
      <div className="pt-4">
        <label className="block text-xs font-medium text-stone-300 mb-2.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-semibold">
            <span>Aesthetic Style Toggle</span>
            <span className="text-stone-500 font-normal">• Choose the culinary mood</span>
          </span>
          <span className="text-[11px] font-mono text-amber-400 capitalize">
            Current: {settings.style.replace('_', ' ')}
          </span>
        </label>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {styleOptions.map((opt) => {
            const isSelected = settings.style === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => onChangeSettings({ style: opt.id })}
                className={`relative text-left p-3.5 rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden ${
                  isSelected
                    ? `bg-gradient-to-br ${opt.bgGrad} ${opt.borderActive} shadow-lg`
                    : 'bg-stone-950/50 border-stone-800/80 hover:bg-stone-800/40 text-stone-400 hover:border-stone-700'
                }`}
              >
                {isSelected && (
                  <span className="absolute top-2.5 right-2.5 text-amber-400">
                    <CheckCircle2 className="w-4 h-4" />
                  </span>
                )}
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={`p-1.5 rounded-lg bg-stone-900 border border-stone-800 ${opt.color}`}>
                    {opt.icon}
                  </div>
                  <span className={`text-sm font-semibold tracking-tight ${isSelected ? 'text-stone-100' : 'text-stone-300'}`}>
                    {opt.label}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-stone-400 line-clamp-2">
                  {opt.tagline}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Primary Technical Affordances: Model Selection & Image Size (1K, 2K, 4K) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-stone-800/60">
        {/* Model Selection */}
        <div>
          <label className="block text-xs font-semibold text-stone-300 mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
              <span>AI Photography Engine</span>
            </span>
          </label>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onChangeSettings({ model: 'gemini-3-pro-image-preview' })}
              className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                settings.model === 'gemini-3-pro-image-preview'
                  ? 'bg-amber-950/40 border-amber-500/80 text-amber-100 ring-1 ring-amber-500/30'
                  : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:bg-stone-800/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-100">Gemini 3 Pro</span>
                <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold font-mono">
                  Pro 4K
                </span>
              </div>
              <p className="text-[10px] text-stone-400 mt-1 leading-tight">
                High-end commercial studio realism, 1K/2K/4K resolution
              </p>
            </button>

            <button
              onClick={() => onChangeSettings({ model: 'gemini-3.1-flash-image-preview' })}
              className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                settings.model === 'gemini-3.1-flash-image-preview'
                  ? 'bg-amber-950/40 border-amber-500/80 text-amber-100 ring-1 ring-amber-500/30'
                  : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:bg-stone-800/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-100">Gemini 3.1 Flash</span>
                <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold font-mono">
                  Fast & Edit
                </span>
              </div>
              <p className="text-[10px] text-stone-400 mt-1 leading-tight">
                Rapid generation & interactive text-prompt editing
              </p>
            </button>
          </div>
        </div>

        {/* Image Size Affordance (1K, 2K, 4K) */}
        <div>
          <label className="block text-xs font-semibold text-stone-300 mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Image Size & Resolution</span>
            </span>
            <span className="text-[11px] font-mono text-stone-400">
              Selected: <strong className="text-amber-400">{settings.imageSize}</strong>
            </span>
          </label>

          <div className="grid grid-cols-3 gap-2">
            {sizeOptions.map((s) => {
              const isSelected = settings.imageSize === s.value;
              return (
                <button
                  key={s.value}
                  onClick={() => onChangeSettings({ imageSize: s.value })}
                  className={`p-2 rounded-xl border text-center transition cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500 text-stone-100 ring-1 ring-amber-500/30 font-semibold'
                      : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:bg-stone-800/50'
                  }`}
                >
                  <div className="text-xs font-bold text-stone-200 flex items-center justify-center gap-1">
                    <span>{s.label}</span>
                    <span className="text-[9px] font-normal text-stone-400 font-mono">({s.desc})</span>
                  </div>
                  <div className="text-[10px] text-amber-400/90 font-medium mt-0.5">
                    {s.badge}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Brand Protection Watermark Section */}
      <div className="mt-4 pt-4 border-t border-stone-800/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-stone-950/70 border border-stone-800/90">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg border transition ${
              settings.enableWatermark
                ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                : 'bg-stone-900 border-stone-800 text-stone-500'
            }`}>
              <ShieldCheck className="w-4 h-4" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-stone-200">
                  Brand Watermark Overlay
                </span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                  settings.enableWatermark
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-stone-900 text-stone-500'
                }`}>
                  {settings.enableWatermark ? 'ENABLED' : 'DISABLED'}
                </span>
              </div>
              <p className="text-[11px] text-stone-400 mt-0.5">
                Automatically burns <strong className="text-stone-300">&quot;{settings.watermarkText || restaurantName}&quot;</strong> onto all photo generations to protect culinary branding.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {settings.enableWatermark && photographedCount > 0 && onApplyWatermarkToAll && (
              <button
                onClick={onApplyWatermarkToAll}
                className="px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 text-amber-300 border border-amber-500/30 hover:border-amber-400 text-[11px] font-medium transition cursor-pointer"
                title="Apply this watermark to all existing photos in your studio"
              >
                Apply to All ({photographedCount})
              </button>
            )}

            <button
              onClick={() => onChangeSettings({ enableWatermark: !settings.enableWatermark })}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.enableWatermark ? 'bg-amber-500' : 'bg-stone-800'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-stone-950 shadow-lg ring-0 transition duration-200 ease-in-out ${
                  settings.enableWatermark ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Expandable Watermark Fine-Tuning */}
        {settings.enableWatermark && (
          <div className="mt-3 p-3.5 rounded-xl bg-stone-950/50 border border-stone-800/60 grid grid-cols-1 md:grid-cols-3 gap-3 animate-in fade-in duration-200">
            {/* Watermark Text Input */}
            <div>
              <label className="block text-[11px] font-semibold text-stone-300 mb-1 flex items-center gap-1">
                <Type className="w-3 h-3 text-amber-400" />
                <span>Watermark Brand Text</span>
              </label>
              <input
                type="text"
                placeholder={restaurantName || 'Restaurant Name'}
                value={settings.watermarkText || ''}
                onChange={(e) => onChangeSettings({ watermarkText: e.target.value })}
                className="w-full text-xs px-3 py-1.5 rounded-lg bg-stone-900 border border-stone-800 text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Watermark Position Selector */}
            <div>
              <label className="block text-[11px] font-semibold text-stone-300 mb-1 flex items-center gap-1">
                <Layout className="w-3 h-3 text-amber-400" />
                <span>Position</span>
              </label>
              <div className="grid grid-cols-4 gap-1">
                {(
                  [
                    { id: 'bottom_right', label: 'B-R', desc: 'Bottom Right' },
                    { id: 'bottom_left', label: 'B-L', desc: 'Bottom Left' },
                    { id: 'bottom_center', label: 'B-C', desc: 'Center' },
                    { id: 'top_right', label: 'T-R', desc: 'Top Right' },
                  ] as { id: WatermarkPosition; label: string; desc: string }[]
                ).map((pos) => (
                  <button
                    key={pos.id}
                    onClick={() => onChangeSettings({ watermarkPosition: pos.id })}
                    className={`py-1 text-center text-[10px] font-mono rounded-lg border transition cursor-pointer ${
                      settings.watermarkPosition === pos.id
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                        : 'bg-stone-900 border-stone-800 text-stone-400 hover:bg-stone-800'
                    }`}
                    title={pos.desc}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Opacity Selector */}
            <div>
              <label className="block text-[11px] font-semibold text-stone-300 mb-1 flex items-center justify-between">
                <span>Subtlety &amp; Opacity</span>
                <span className="font-mono text-amber-400 text-[10px]">
                  {Math.round((settings.watermarkOpacity || 0.65) * 100)}%
                </span>
              </label>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { value: 0.45, label: 'Subtle' },
                  { value: 0.65, label: 'Balanced' },
                  { value: 0.85, label: 'Crisp' },
                ].map((op) => (
                  <button
                    key={op.value}
                    onClick={() => onChangeSettings({ watermarkOpacity: op.value })}
                    className={`py-1 text-center text-[10px] rounded-lg border transition cursor-pointer ${
                      Math.abs(settings.watermarkOpacity - op.value) < 0.05
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                        : 'bg-stone-900 border-stone-800 text-stone-400 hover:bg-stone-800'
                    }`}
                  >
                    {op.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Advanced Toggle (Aspect Ratio & Custom Notes) */}
      <div className="mt-3 pt-3 border-t border-stone-800/40">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-200 transition cursor-pointer"
        >
          {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          <span>{showAdvanced ? 'Hide Framing & Director Notes' : 'Show Aspect Ratio Framing & Director Notes'}</span>
        </button>

        {showAdvanced && (
          <div className="mt-3.5 grid grid-cols-1 md:grid-cols-2 gap-4 bg-stone-950/60 p-3.5 rounded-xl border border-stone-800/80">
            {/* Aspect Ratio */}
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-2">
                Aspect Ratio Framing
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {aspectOptions.map((a) => (
                  <button
                    key={a.value}
                    onClick={() => onChangeSettings({ aspectRatio: a.value })}
                    className={`py-1.5 px-2 rounded-lg border text-center transition cursor-pointer ${
                      settings.aspectRatio === a.value
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-bold'
                        : 'bg-stone-900 border-stone-800 text-stone-400 hover:bg-stone-800'
                    }`}
                  >
                    <div className="text-xs font-mono">{a.label}</div>
                    <div className="text-[9px] text-stone-500">{a.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Notes */}
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-2">
                Artistic Director Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Include rustic sourdough bread slice, delicate rising steam..."
                value={settings.customPromptNotes}
                onChange={(e) => onChangeSettings({ customPromptNotes: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-lg bg-stone-900 border border-stone-800 text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/30"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
