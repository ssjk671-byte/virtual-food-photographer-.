import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Download,
  Printer,
  Sparkles,
  Camera,
  Layers,
  Filter,
  Archive,
  Loader2,
} from 'lucide-react';
import { Dish, RestaurantMenu } from '../types';
import { exportPhotosToZip, triggerFileDownload } from '../utils/zipExport';

interface LookbookModalProps {
  isOpen: boolean;
  onClose: () => void;
  menu: RestaurantMenu;
  onOpenBulkExport?: () => void;
}

export const LookbookModal: React.FC<LookbookModalProps> = ({
  isOpen,
  onClose,
  menu,
  onOpenBulkExport,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState<number>(0);

  if (!isOpen) return null;

  const photographedDishes = menu.dishes.filter((d) => Boolean(d.photoUrl));

  const categories = ['All', ...Array.from(new Set(photographedDishes.map((d) => d.category)))];

  const filteredDishes = selectedCategory === 'All'
    ? photographedDishes
    : photographedDishes.filter((d) => d.category === selectedCategory);

  const handleDownloadZip = async () => {
    if (photographedDishes.length === 0 || isZipping) return;

    try {
      setIsZipping(true);
      setZipProgress(0);

      const result = await exportPhotosToZip(menu, {
        organizeByCategory: true,
        includeManifest: true,
        onProgress: (pct) => setZipProgress(pct),
      });

      triggerFileDownload(result.blob, result.filename);
    } catch (err) {
      console.error('ZIP generation error in Lookbook:', err);
    } finally {
      setIsZipping(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-6xl bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[94vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-xl text-stone-100">
                  {menu.restaurantName} • Culinary Lookbook
                </h3>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                  {photographedDishes.length} Studio Shots
                </span>
              </div>
              <p className="text-xs text-stone-400">
                {menu.cuisineType || 'Artisanal Culinary Collection'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold border border-stone-700 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-stone-300" />
              <span className="hidden sm:inline">Print Lookbook</span>
            </button>

            {onOpenBulkExport ? (
              <button
                onClick={onOpenBulkExport}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition shadow-md cursor-pointer"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>Bulk Export (ZIP)</span>
              </button>
            ) : (
              <button
                onClick={handleDownloadZip}
                disabled={isZipping}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition shadow-md cursor-pointer"
              >
                {isZipping ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Zipping ({zipProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <Archive className="w-3.5 h-3.5" />
                    <span>Bulk Export (ZIP)</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category Filter Chips */}
        {categories.length > 2 && (
          <div className="px-6 py-2.5 bg-stone-950/60 border-b border-stone-800 flex items-center gap-2 overflow-x-auto">
            <span className="text-xs text-stone-400 flex items-center gap-1 font-semibold shrink-0">
              <Filter className="w-3 h-3 text-amber-400" />
              <span>Category:</span>
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs px-3 py-1 rounded-lg border transition shrink-0 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-amber-500 text-stone-950 font-bold border-amber-400'
                    : 'bg-stone-900 text-stone-300 border-stone-800 hover:bg-stone-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Gallery Grid */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-stone-950/40">
          {filteredDishes.length === 0 ? (
            <div className="py-16 text-center text-stone-500 space-y-2">
              <Camera className="w-10 h-10 mx-auto text-stone-600" />
              <p className="text-sm">No dishes photographed in this category yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDishes.map((dish) => (
                <div
                  key={dish.id}
                  className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-xl flex flex-col group"
                >
                  <div className="relative aspect-square w-full bg-stone-950 overflow-hidden">
                    <img
                      src={dish.photoUrl}
                      alt={dish.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-stone-950/80 backdrop-blur-md text-[10px] font-mono text-amber-300 font-bold border border-stone-800">
                      {dish.imageSize || '1K'} • {dish.photoStyle?.replace('_', ' ')}
                    </div>
                    {dish.price && (
                      <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-stone-950/80 backdrop-blur-md text-xs font-serif font-bold text-stone-100 border border-stone-800">
                        {dish.price}
                      </div>
                    )}
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400 font-semibold">
                        {dish.category}
                      </span>
                      <h4 className="font-serif font-bold text-base text-stone-100 mt-0.5">
                        {dish.name}
                      </h4>
                      <p className="text-xs text-stone-400 mt-1 line-clamp-2 leading-relaxed">
                        {dish.description}
                      </p>
                    </div>

                    {dish.keyIngredients && dish.keyIngredients.length > 0 && (
                      <div className="pt-2 border-t border-stone-800 flex flex-wrap gap-1">
                        {dish.keyIngredients.map((ing, i) => (
                          <span
                            key={i}
                            className="text-[9px] px-1.5 py-0.5 rounded bg-stone-800 text-stone-400"
                          >
                            {ing}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
