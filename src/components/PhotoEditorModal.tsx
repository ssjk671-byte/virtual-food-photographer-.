import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Wand2,
  Sparkles,
  RotateCcw,
  Check,
  Loader2,
  Sliders,
  Image as ImageIcon,
  ArrowRight,
  Info,
  Upload,
} from 'lucide-react';
import { Dish } from '../types';

interface PhotoEditorModalProps {
  dish: Dish | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveEdit: (dishId: string, editedImageUrl: string, editPrompt: string, asNewVariation: boolean) => void;
}

export const PhotoEditorModal: React.FC<PhotoEditorModalProps> = ({
  dish,
  isOpen,
  onClose,
  onSaveEdit,
}) => {
  const [prompt, setPrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [baseImageUrl, setBaseImageUrl] = useState<string | null>(dish?.photoUrl || null);
  const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);
  const [comparisonMode, setComparisonMode] = useState<'side_by_side' | 'toggle'>('side_by_side');
  const [activeToggleView, setActiveToggleView] = useState<'original' | 'edited'>('edited');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (dish?.photoUrl) {
      setBaseImageUrl(dish.photoUrl);
      setEditedImageUrl(null);
      setError(null);
    }
  }, [dish]);

  if (!isOpen || !dish) return null;

  const quickSuggestions = [
    'Transform lighting to soft studio daylight and place on white Carrara marble',
    'Deep moody chiaroscuro shadows on dark weathered slate slab',
    'Add delicate rising steam and fresh chopped herb garnish',
    'Make sauces glisten with golden highlights and razor-sharp textures',
    'Replace cluttered background with elegant dark restaurant dining table',
    'Add a slice of crusty rustic sourdough and dipping oil on the side',
  ];

  const handleUploadNewBaseImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setBaseImageUrl(dataUrl);
        setEditedImageUrl(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyEdit = async () => {
    const targetBase = baseImageUrl || dish.photoUrl;
    if (!prompt.trim() || isEditing || !targetBase) return;

    try {
      setIsEditing(true);
      setError(null);

      let response: Response;
      try {
        response = await fetch('/api/image/edit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: editedImageUrl || targetBase,
            prompt: prompt.trim(),
            model: 'gemini-3.1-flash-image',
            aspectRatio: dish.aspectRatio || '1:1',
            imageSize: dish.imageSize || '1K',
          }),
        });
      } catch (netErr: any) {
        const isNetFail = netErr?.message === 'Failed to fetch' || netErr?.name === 'TypeError';
        throw new Error(
          isNetFail
            ? 'Network request interrupted. Please check your connection or retry.'
            : (netErr?.message || 'Failed to connect to the studio server.')
        );
      }

      let data: any = null;
      try {
        data = await response.json();
      } catch {
        const text = await response.text().catch(() => '');
        throw new Error(text || `Server error during editing (HTTP ${response.status})`);
      }

      if (!response.ok || !data?.imageUrl) {
        throw new Error(data?.error || data?.message || 'Failed to edit image.');
      }

      setEditedImageUrl(data.imageUrl);
      setActiveToggleView('edited');
    } catch (err: any) {
      console.error('Edit error:', err);
      let errMsg = err?.message || 'Failed to process AI photo edit.';
      if (
        errMsg.includes('429') ||
        errMsg.includes('RESOURCE_EXHAUSTED') ||
        errMsg.includes('quota') ||
        errMsg.includes('Quota') ||
        errMsg.includes('billing')
      ) {
        errMsg = 'Photo editing requires a billing-enabled Gemini API key.';
      }
      setError(errMsg);
    } finally {
      setIsEditing(false);
    }
  };

  const handleSaveAndClose = (asNewVariation: boolean) => {
    if (!editedImageUrl) return;
    onSaveEdit(dish.id, editedImageUrl, prompt, asNewVariation);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-800 bg-stone-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-lg text-stone-100">
                  AI Culinary Retouch & Studio Edit
                </h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  gemini-3.1-flash-image-preview
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Retouching <strong className="text-stone-200">{dish.name}</strong> with natural language instructions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleUploadNewBaseImage}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-medium transition cursor-pointer"
              title="Upload your own picture to edit instead"
            >
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              <span>Attach Your Picture</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Image Comparison Preview Area */}
          <div className="bg-stone-950 rounded-xl p-3 border border-stone-800/80">
            {editedImageUrl ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-stone-400">Comparison:</span>
                    <button
                      onClick={() => setComparisonMode('side_by_side')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer ${
                        comparisonMode === 'side_by_side'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-stone-900 text-stone-400'
                      }`}
                    >
                      Side by Side
                    </button>
                    <button
                      onClick={() => setComparisonMode('toggle')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer ${
                        comparisonMode === 'toggle'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-stone-900 text-stone-400'
                      }`}
                    >
                      Toggle View
                    </button>
                  </div>

                  {comparisonMode === 'toggle' && (
                    <div className="flex items-center gap-1 bg-stone-900 p-0.5 rounded-lg border border-stone-800">
                      <button
                        onClick={() => setActiveToggleView('original')}
                        className={`px-2.5 py-0.5 rounded text-[11px] font-medium cursor-pointer ${
                          activeToggleView === 'original'
                            ? 'bg-stone-800 text-stone-200'
                            : 'text-stone-400 hover:text-stone-200'
                        }`}
                      >
                        Original
                      </button>
                      <button
                        onClick={() => setActiveToggleView('edited')}
                        className={`px-2.5 py-0.5 rounded text-[11px] font-medium cursor-pointer ${
                          activeToggleView === 'edited'
                            ? 'bg-amber-500 text-stone-950 font-bold'
                            : 'text-stone-400 hover:text-stone-200'
                        }`}
                      >
                        Retouched
                      </button>
                    </div>
                  )}
                </div>

                {comparisonMode === 'side_by_side' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-stone-400 block px-1">Base Picture</span>
                      <div className="aspect-square rounded-lg overflow-hidden border border-stone-800 relative bg-stone-900">
                        <img
                          src={baseImageUrl || dish.photoUrl}
                          alt="Original"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-emerald-400 block px-1 font-semibold flex items-center justify-between">
                        <span>Retouched Take</span>
                        <span className="text-stone-500 font-normal">Gemini 3.1 Flash Image</span>
                      </span>
                      <div className="aspect-square rounded-lg overflow-hidden border border-amber-500/50 relative bg-stone-900 shadow-xl shadow-amber-500/5">
                        <img
                          src={editedImageUrl}
                          alt="Retouched"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-square max-h-[380px] mx-auto rounded-lg overflow-hidden border border-stone-800 relative bg-stone-900">
                    <img
                      src={activeToggleView === 'original' ? (baseImageUrl || dish.photoUrl) : editedImageUrl}
                      alt={activeToggleView}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-3 left-3 px-2 py-1 rounded bg-stone-950/80 backdrop-blur-md text-xs font-mono text-stone-200">
                      Viewing: {activeToggleView === 'original' ? 'Original' : 'Retouched'}
                    </span>
                  </div>
                )}
              </div>
            ) : (baseImageUrl || dish.photoUrl) ? (
              <div className="aspect-square max-h-[340px] mx-auto rounded-lg overflow-hidden border border-stone-800 relative bg-stone-900 group">
                <img
                  src={baseImageUrl || dish.photoUrl || ''}
                  alt={dish.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-3 left-3 px-2 py-1 rounded bg-stone-950/80 backdrop-blur-md text-xs font-mono text-stone-200">
                  Ready for AI Retouching
                </span>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-stone-950/80 hover:bg-stone-900 text-stone-200 text-[11px] font-medium border border-stone-700/80 backdrop-blur-md opacity-0 group-hover:opacity-100 transition cursor-pointer flex items-center gap-1.5"
                >
                  <Upload className="w-3 h-3 text-amber-400" />
                  <span>Replace Picture</span>
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (!file || !file.type.startsWith('image/')) return;
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    const dataUrl = event.target?.result as string;
                    if (dataUrl) {
                      setBaseImageUrl(dataUrl);
                      setEditedImageUrl(null);
                    }
                  };
                  reader.readAsDataURL(file);
                }}
                className="aspect-square max-h-[320px] mx-auto rounded-2xl border-2 border-dashed border-stone-700 hover:border-amber-400 bg-stone-950/60 hover:bg-stone-950/90 transition flex flex-col items-center justify-center p-6 text-center cursor-pointer space-y-3"
              >
                <div className="w-14 h-14 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-center text-amber-400">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-stone-200">
                    Attach or Drop Food Picture Here
                  </h4>
                  <p className="text-[11px] text-stone-500 mt-1 max-w-[240px]">
                    Upload a photo of {dish.name} to retouch lighting, plating, props, and steam with Gemini AI
                  </p>
                </div>
                <span className="text-[10px] px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
                  Click to select file or drag & drop
                </span>
              </div>
            )}
          </div>

          {/* Prompt Input Box */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-stone-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Text Prompt Edit Instructions</span>
              </span>
              <span className="text-[11px] text-stone-400 font-normal">
                Describe additions, lighting adjustments, props, or garnishes
              </span>
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleApplyEdit();
                }}
                placeholder="e.g. Add hot steam rising, drizzle balsamic glaze, and sprinkle fresh basil leaves..."
                className="flex-1 text-xs px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />

              <button
                onClick={handleApplyEdit}
                disabled={!prompt.trim() || isEditing || !(baseImageUrl || dish.photoUrl)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 ${
                  !prompt.trim() || isEditing || !(baseImageUrl || dish.photoUrl)
                    ? 'bg-stone-800 text-stone-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                }`}
              >
                {isEditing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-stone-950" />
                    <span>Processing Edit...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Apply Edit</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Suggestions */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-stone-400 block">
              Quick Culinary Suggestions:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {quickSuggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => setPrompt(s)}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-stone-950 hover:bg-stone-800 text-stone-300 border border-stone-800/80 hover:border-amber-500/30 transition text-left cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs">
              <strong className="block font-semibold">Editing Error:</strong>
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 border-t border-stone-800 bg-stone-950/70 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-stone-400">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Powered by <strong>gemini-3.1-flash-image-preview</strong> for precision culinary photo editing.
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold transition cursor-pointer"
            >
              Cancel
            </button>

            {editedImageUrl && (
              <>
                <button
                  onClick={() => handleSaveAndClose(true)}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 border border-amber-500/30 text-xs font-semibold transition cursor-pointer"
                >
                  Save as New Variation
                </button>

                <button
                  onClick={() => handleSaveAndClose(false)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Update Dish Photo</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
