import React, { useState } from 'react';
import {
  X,
  Archive,
  Download,
  FolderTree,
  FileText,
  CheckCircle2,
  Loader2,
  Layers,
  Sparkles,
  Info,
  Check,
  AlertCircle,
} from 'lucide-react';
import { RestaurantMenu } from '../types';
import { exportPhotosToZip, triggerFileDownload } from '../utils/zipExport';

interface BulkExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  menu: RestaurantMenu;
}

export const BulkExportModal: React.FC<BulkExportModalProps> = ({
  isOpen,
  onClose,
  menu,
}) => {
  const [organizeByCategory, setOrganizeByCategory] = useState(true);
  const [includeAllVariations, setIncludeAllVariations] = useState(false);
  const [includeManifest, setIncludeManifest] = useState(true);

  const [isExporting, setIsExporting] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [completedInfo, setCompletedInfo] = useState<{ filename: string; count: number } | null>(null);

  if (!isOpen) return null;

  const photographedDishes = menu.dishes.filter((d) => Boolean(d.photoUrl));

  // Count total variations available
  const totalVariationsCount = photographedDishes.reduce(
    (acc, d) => acc + (d.variations?.length || 1),
    0
  );

  const expectedPhotoCount = includeAllVariations ? totalVariationsCount : photographedDishes.length;

  const handleStartExport = async () => {
    if (photographedDishes.length === 0 || isExporting) return;

    try {
      setIsExporting(true);
      setError(null);
      setCompletedInfo(null);
      setProgressPercent(0);

      const result = await exportPhotosToZip(menu, {
        organizeByCategory,
        includeAllVariations,
        includeManifest,
        onProgress: (pct, status) => {
          setProgressPercent(pct);
          setStatusText(status);
        },
      });

      triggerFileDownload(result.blob, result.filename);
      setCompletedInfo({ filename: result.filename, count: result.photoCount });
    } catch (err: any) {
      console.error('ZIP export error:', err);
      setError(err?.message || 'Failed to generate ZIP archive.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-lg text-stone-100">
                  Bulk Export Photos (ZIP)
                </h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                  {photographedDishes.length} Dishes
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Package all high-resolution culinary photography into a clean ZIP archive.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isExporting}
            className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 transition cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {photographedDishes.length === 0 ? (
            <div className="py-8 text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
              <div className="text-sm font-semibold text-stone-200">
                No Photographs Generated Yet
              </div>
              <p className="text-xs text-stone-400 max-w-sm mx-auto">
                Generate at least one food photo or use &quot;Photograph All Dishes&quot; before exporting the ZIP package.
              </p>
            </div>
          ) : (
            <>
              {/* Summary Stats Card */}
              <div className="p-4 rounded-2xl bg-stone-950/60 border border-stone-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[11px] uppercase font-mono text-stone-400 block">
                    Restaurant Collection
                  </span>
                  <span className="font-serif font-bold text-stone-100 text-sm">
                    {menu.restaurantName}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[11px] uppercase font-mono text-amber-400 font-semibold block">
                    Files to Bundle
                  </span>
                  <span className="font-mono font-bold text-stone-100 text-sm">
                    {expectedPhotoCount} {expectedPhotoCount === 1 ? 'Photo' : 'Photos'}
                  </span>
                </div>
              </div>

              {/* Export Options */}
              <div className="space-y-3">
                <span className="text-xs font-semibold text-stone-300 block">
                  Archive Organization Options:
                </span>

                {/* Option 1: Organize by Category */}
                <label className="flex items-start gap-3 p-3.5 rounded-xl bg-stone-950/50 border border-stone-800/80 hover:border-amber-500/30 transition cursor-pointer">
                  <input
                    type="checkbox"
                    checked={organizeByCategory}
                    onChange={(e) => setOrganizeByCategory(e.target.checked)}
                    disabled={isExporting}
                    className="mt-0.5 rounded text-amber-500 focus:ring-amber-500 bg-stone-900 border-stone-700"
                  />
                  <div className="flex-1 text-xs">
                    <span className="font-semibold text-stone-200 flex items-center gap-1.5">
                      <FolderTree className="w-3.5 h-3.5 text-amber-400" />
                      <span>Organize in Category Folders</span>
                    </span>
                    <p className="text-stone-400 mt-0.5 text-[11px]">
                      Creates subfolders (e.g., <code>/Starters/</code>, <code>/Primi &amp; Mains/</code>, <code>/Desserts/</code>).
                    </p>
                  </div>
                </label>

                {/* Option 2: Include All Variations / Takes */}
                <label className="flex items-start gap-3 p-3.5 rounded-xl bg-stone-950/50 border border-stone-800/80 hover:border-amber-500/30 transition cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeAllVariations}
                    onChange={(e) => setIncludeAllVariations(e.target.checked)}
                    disabled={isExporting}
                    className="mt-0.5 rounded text-amber-500 focus:ring-amber-500 bg-stone-900 border-stone-700"
                  />
                  <div className="flex-1 text-xs">
                    <span className="font-semibold text-stone-200 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-amber-400" />
                      <span>Include All Variation Takes &amp; Retouches</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-stone-800 text-stone-400">
                        {totalVariationsCount} total files
                      </span>
                    </span>
                    <p className="text-stone-400 mt-0.5 text-[11px]">
                      Exports every generated angle, style retry, and AI retouch take alongside the hero shot.
                    </p>
                  </div>
                </label>

                {/* Option 3: Include Menu Manifest & Text Catalog */}
                <label className="flex items-start gap-3 p-3.5 rounded-xl bg-stone-950/50 border border-stone-800/80 hover:border-amber-500/30 transition cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeManifest}
                    onChange={(e) => setIncludeManifest(e.target.checked)}
                    disabled={isExporting}
                    className="mt-0.5 rounded text-amber-500 focus:ring-amber-500 bg-stone-900 border-stone-700"
                  />
                  <div className="flex-1 text-xs">
                    <span className="font-semibold text-stone-200 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-amber-400" />
                      <span>Include Menu Manifest &amp; Lookbook Index</span>
                    </span>
                    <p className="text-stone-400 mt-0.5 text-[11px]">
                      Includes <code>STUDIO_LOOKBOOK_MANIFEST.txt</code> and <code>menu_data_manifest.json</code> for print &amp; POS.
                    </p>
                  </div>
                </label>
              </div>

              {/* Progress Bar (when exporting) */}
              {isExporting && (
                <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 space-y-2 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-amber-200 flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                      <span>Packaging ZIP File...</span>
                    </span>
                    <span className="font-mono text-amber-300 font-bold">{progressPercent}%</span>
                  </div>

                  <div className="w-full bg-stone-900 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full transition-all duration-300 rounded-full"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  <p className="text-[11px] text-amber-300/80 font-mono truncate">
                    {statusText || 'Preparing images...'}
                  </p>
                </div>
              )}

              {/* Success Result */}
              {completedInfo && (
                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div className="flex-1 text-xs">
                    <span className="font-semibold text-emerald-200 block">
                      ZIP Download Triggered!
                    </span>
                    <span className="text-emerald-300/80 text-[11px] font-mono">
                      {completedInfo.filename} ({completedInfo.count} photos included)
                    </span>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs">
                  <strong className="block font-semibold">Export Failed:</strong>
                  <span>{error}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-800 bg-stone-950/70 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-stone-400">
            <Info className="w-3.5 h-3.5 text-amber-400" />
            <span>High-res PNG master files</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={isExporting}
              className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
            >
              Close
            </button>

            {photographedDishes.length > 0 && (
              <button
                onClick={handleStartExport}
                disabled={isExporting}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer shadow-lg ${
                  isExporting
                    ? 'bg-amber-600/50 text-amber-100 cursor-wait'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 shadow-amber-500/20'
                }`}
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-stone-950" />
                    <span>Bundling ZIP ({progressPercent}%)...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download ZIP Package ({expectedPhotoCount})</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
