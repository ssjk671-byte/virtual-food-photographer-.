import React, { useState } from 'react';
import {
  X,
  Upload,
  FileText,
  Sparkles,
  Loader2,
  CheckCircle2,
  ArrowRight,
  Utensils,
  BookOpen,
} from 'lucide-react';
import { SAMPLE_MENUS, SampleMenu } from '../data/sampleMenus';
import { Dish } from '../types';

interface MenuUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadParsedMenu: (restaurantName: string, cuisineType: string, dishes: Dish[]) => void;
}

export const MenuUploadModal: React.FC<MenuUploadModalProps> = ({
  isOpen,
  onClose,
  onLoadParsedMenu,
}) => {
  const [menuText, setMenuText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parseStep, setParseStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setMenuText(content);
      }
    };
    reader.readAsText(file);
  };

  const handleLoadSample = (sample: SampleMenu) => {
    setMenuText(sample.rawText);
  };

  const handleParse = async () => {
    if (!menuText.trim() || isParsing) return;

    try {
      setIsParsing(true);
      setError(null);
      setParseStep('Connecting to Gemini 3.8 Flash culinary intelligence...');

      const response = await fetch('/api/menu/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menuText }),
      });

      setParseStep('Structuring menu categories and culinary staging prompts...');

      const data = await response.json();

      if (!response.ok || !data.dishes) {
        throw new Error(data.error || 'Failed to parse menu text.');
      }

      // Convert dishes to Dish array with empty variations
      const structuredDishes: Dish[] = data.dishes.map((d: any) => ({
        ...d,
        variations: [],
      }));

      onLoadParsedMenu(
        data.restaurantName || 'Restaurant Menu',
        data.cuisineType || 'Artisanal Cuisine',
        structuredDishes
      );
      onClose();
    } catch (err: any) {
      console.error('Menu parse error:', err);
      setError(err?.message || 'Failed to parse menu. Please verify your menu text.');
    } finally {
      setIsParsing(false);
      setParseStep('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-stone-100">
                Upload or Paste Restaurant Menu
              </h3>
              <p className="text-xs text-stone-400">
                AI extracts dishes, ingredients, and prepares photography compositions automatically.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Quick-Load Sample Menus */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Or choose a gourmet sample menu:</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {SAMPLE_MENUS.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => handleLoadSample(sample)}
                  className="p-3 text-left rounded-xl bg-stone-950/70 hover:bg-stone-800/80 border border-stone-800/80 hover:border-amber-500/40 transition group cursor-pointer"
                >
                  <div className="text-xs font-serif font-bold text-stone-200 group-hover:text-amber-300">
                    {sample.name}
                  </div>
                  <div className="text-[10px] text-amber-400/90 font-mono mt-0.5">
                    {sample.cuisine}
                  </div>
                  <div className="text-[11px] text-stone-400 mt-1 line-clamp-2">
                    {sample.tagline}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Text Area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-stone-200 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Text-Based Menu Content</span>
              </label>

              <label className="text-[11px] text-amber-400 hover:text-amber-300 cursor-pointer flex items-center gap-1 font-medium">
                <Upload className="w-3 h-3" />
                <span>Upload .txt or .csv file</span>
                <input
                  type="file"
                  accept=".txt,.csv,.json,.md"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <textarea
              value={menuText}
              onChange={(e) => setMenuText(e.target.value)}
              placeholder="Paste your restaurant menu here, for example:&#10;&#10;STARTERS&#10;1. Truffle Arancini - $16&#10;Crispy Arborio rice balls with black truffle and melted taleggio cheese.&#10;&#10;MAINS&#10;2. Prime Dry-Aged Ribeye - $48&#10;Grilled with bone marrow butter, roasted fingerling potatoes, and rosemary jus..."
              rows={9}
              className="w-full text-xs font-mono px-3.5 py-3 rounded-xl bg-stone-950 border border-stone-800 text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/30 leading-relaxed"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs">
              <strong className="block font-semibold">Parsing Error:</strong>
              <span>{error}</span>
            </div>
          )}

          {/* Parsing status */}
          {isParsing && (
            <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
              <div>
                <span className="text-xs font-semibold text-amber-200 block">
                  Gemini AI Analyzing Culinary Menu...
                </span>
                <span className="text-[11px] text-amber-300/80">
                  {parseStep || 'Extracting dishes and tailoring photography prompts...'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-800 bg-stone-950/70 flex items-center justify-between">
          <button
            onClick={() => setMenuText('')}
            className="text-xs text-stone-400 hover:text-stone-200 transition cursor-pointer"
          >
            Clear Text
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              onClick={handleParse}
              disabled={!menuText.trim() || isParsing}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-xs transition cursor-pointer ${
                !menuText.trim() || isParsing
                  ? 'bg-stone-800 text-stone-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
              }`}
            >
              {isParsing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-stone-950" />
                  <span>Parsing Menu...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Parse Menu & Setup Studio</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
