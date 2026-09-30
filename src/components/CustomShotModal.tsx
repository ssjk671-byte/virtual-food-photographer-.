import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Camera,
  Loader2,
  Download,
  PlusCircle,
  Cpu,
  Maximize2,
  Sliders,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { ModelType, ImageSize, AspectRatio, StyleType, Dish, WatermarkPosition } from '../types';
import { applyWatermarkToImage } from '../utils/watermark';

interface CustomShotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDishToMenu: (dish: Dish) => void;
  restaurantName?: string;
  enableWatermark?: boolean;
  watermarkText?: string;
  watermarkPosition?: WatermarkPosition;
  watermarkOpacity?: number;
}

export const CustomShotModal: React.FC<CustomShotModalProps> = ({
  isOpen,
  onClose,
  onAddDishToMenu,
  restaurantName,
  enableWatermark = true,
  watermarkText,
  watermarkPosition = 'bottom_right',
  watermarkOpacity = 0.65,
}) => {
  const [dishName, setDishName] = useState('');
  const [category, setCategory] = useState('Chef Specials');
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState<StyleType>('rustic_dark');
  const [model, setModel] = useState<ModelType>('gemini-3-pro-image-preview');
  const [imageSize, setImageSize] = useState<ImageSize>('1K');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<{
    imageUrl: string;
    modelUsed: string;
    imageSize: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const promptPresets = [
    {
      title: 'Truffle Burger',
      name: 'Dry-Aged Wagyu Truffle Burger',
      cat: 'Mains & Burgers',
      prompt: 'Gourmet dry-aged wagyu beef burger with molten Gruyère cheese drip, caramelized balsamic onions, shaved black summer truffles, on a shiny toasted brioche bun with glistening microgreens, commercial food studio shot.',
    },
    {
      title: 'Berry Pavlova',
      name: 'Crisp Berry & Violet Pavlova',
      cat: 'Desserts',
      prompt: 'Delicate marshmallow-center meringue nest topped with Madagascar vanilla chantilly cream, glistening macerated blackberries, red currants, edible violet petals, and gold leaf flake.',
    },
    {
      title: 'Smoked Old Fashioned',
      name: 'Wood-Smoked Bourbon Old Fashioned',
      cat: 'Cocktails',
      prompt: 'Artisan craft cocktail in heavy crystal tumbler over hand-carved clear ice sphere, swirling white oak smoke, expressed orange peel spiral, Luxardo maraschino cherry, dramatic backlighting.',
    },
  ];

  const handleGenerate = async () => {
    if ((!dishName.trim() && !prompt.trim()) || isGenerating) return;

    try {
      setIsGenerating(true);
      setError(null);

      let response: Response;
      try {
        response = await fetch('/api/image/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dishName: dishName || 'Gourmet Culinary Creation',
            dishDescription: prompt,
            category,
            style,
            model,
            imageSize,
            aspectRatio,
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
        throw new Error(text || `Server error during shoot (HTTP ${response.status})`);
      }

      if (!response.ok || !data?.imageUrl) {
        throw new Error(data?.error || data?.message || 'Failed to generate custom photo.');
      }

      let finalCustomUrl = data.imageUrl;
      if (enableWatermark) {
        try {
          finalCustomUrl = await applyWatermarkToImage(data.imageUrl, {
            text: watermarkText?.trim() || restaurantName || 'Restaurant Photography',
            position: watermarkPosition,
            opacity: watermarkOpacity,
          });
        } catch (wmErr) {
          console.warn('Failed to apply watermark to custom shot:', wmErr);
        }
      }

      setGeneratedResult({
        imageUrl: finalCustomUrl,
        modelUsed: data.modelUsed,
        imageSize: data.imageSize,
      });
    } catch (err: any) {
      console.error('Custom shot generation error:', err);
      setError(err?.message || 'Failed to generate photo.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddDish = () => {
    if (!generatedResult) return;

    const newDish: Dish = {
      id: `dish-custom-${Date.now()}`,
      name: dishName.trim() || 'Custom Studio Creation',
      category: category.trim() || 'Chef Specials',
      description: prompt.trim() || 'Artisanal dish captured with professional culinary studio lighting.',
      price: '$28',
      photoUrl: generatedResult.imageUrl,
      photoStyle: style,
      modelUsed: model,
      imageSize,
      aspectRatio,
      variations: [
        {
          id: `var-${Date.now()}`,
          imageUrl: generatedResult.imageUrl,
          style,
          model,
          size: imageSize,
          aspectRatio,
          prompt,
          createdAt: new Date().toISOString(),
        },
      ],
    };

    onAddDishToMenu(newDish);
    onClose();
  };

  const handleDownload = () => {
    if (!generatedResult) return;
    const link = document.createElement('a');
    link.href = generatedResult.imageUrl;
    link.download = `custom_${dishName.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'dish'}_${imageSize}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-stone-100">
                Custom Culinary Studio Shoot
              </h3>
              <p className="text-xs text-stone-400">
                Generate custom food photography from text prompts using Gemini 3 Pro or Flash.
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Left Column: Form & Prompts */}
            <div className="space-y-4">
              {/* Presets */}
              <div>
                <span className="text-[11px] font-semibold text-stone-400 block mb-1.5">
                  Inspiration Presets:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {promptPresets.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setDishName(p.name);
                        setCategory(p.cat);
                        setPrompt(p.prompt);
                      }}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-stone-950 hover:bg-stone-800 text-stone-300 border border-stone-800 transition cursor-pointer"
                    >
                      {p.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dish Name & Category */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Dish Name
                  </label>
                  <input
                    type="text"
                    value={dishName}
                    onChange={(e) => setDishName(e.target.value)}
                    placeholder="e.g. Lobster Thermidor"
                    className="w-full text-xs px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Seafood, Mains"
                    className="w-full text-xs px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Text Prompt */}
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Culinary Styling Prompt
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the dish textures, plating style, garnish, cutlery, and background..."
                  rows={4}
                  className="w-full text-xs px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500 leading-relaxed font-mono"
                />
              </div>

              {/* Aesthetic Style Toggle */}
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                  Aesthetic Style
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'rustic_dark' as StyleType, label: 'Rustic / Dark' },
                    { id: 'bright_modern' as StyleType, label: 'Bright / Modern' },
                    { id: 'social_media_topdown' as StyleType, label: 'Social Media' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setStyle(s.id)}
                      className={`py-2 px-2 rounded-lg border text-center text-[11px] font-semibold transition cursor-pointer ${
                        style === s.id
                          ? 'bg-amber-500/20 border-amber-500 text-amber-200'
                          : 'bg-stone-950 border-stone-800 text-stone-400 hover:bg-stone-800'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Model & Size Affordances */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                {/* Model */}
                <div>
                  <label className="block text-[11px] font-semibold text-stone-300 mb-1 flex items-center gap-1">
                    <Cpu className="w-3 h-3 text-amber-400" />
                    <span>Model</span>
                  </label>
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value as ModelType)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-stone-950 border border-stone-800 text-stone-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="gemini-3-pro-image-preview">Gemini 3 Pro (1K/2K/4K)</option>
                    <option value="gemini-3.1-flash-image-preview">Gemini 3.1 Flash (Fast)</option>
                  </select>
                </div>

                {/* Size */}
                <div>
                  <label className="block text-[11px] font-semibold text-stone-300 mb-1 flex items-center gap-1">
                    <Maximize2 className="w-3 h-3 text-amber-400" />
                    <span>Image Size</span>
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    {(['1K', '2K', '4K'] as ImageSize[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => setImageSize(s)}
                        className={`py-1.5 text-center text-xs font-mono font-bold rounded-lg border transition cursor-pointer ${
                          imageSize === s
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                            : 'bg-stone-950 border-stone-800 text-stone-400 hover:bg-stone-800'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={(!dishName.trim() && !prompt.trim()) || isGenerating}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs transition cursor-pointer shadow-lg ${
                  (!dishName.trim() && !prompt.trim()) || isGenerating
                    ? 'bg-stone-800 text-stone-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 shadow-amber-500/20'
                }`}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-stone-950" />
                    <span>Rendering Studio Shot ({imageSize})...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    <span>Generate Studio Photo ({imageSize})</span>
                  </>
                )}
              </button>

              {error && (
                <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs">
                  {error}
                </div>
              )}
            </div>

            {/* Right Column: Live Photo Preview */}
            <div className="flex flex-col justify-between bg-stone-950 rounded-2xl p-4 border border-stone-800">
              <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-stone-900 border border-stone-800 flex items-center justify-center">
                {generatedResult ? (
                  <>
                    <img
                      src={generatedResult.imageUrl}
                      alt="Generated"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-stone-950/80 backdrop-blur-md text-[10px] font-mono text-amber-300 font-bold border border-stone-700">
                      {generatedResult.imageSize} • {generatedResult.modelUsed.includes('pro') ? 'Gemini 3 Pro' : 'Flash'}
                    </div>
                  </>
                ) : isGenerating ? (
                  <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
                    <span className="text-xs font-semibold text-stone-300">
                      Synthesizing Studio Food Photography...
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center text-stone-500 space-y-2">
                    <Camera className="w-8 h-8 text-stone-600" />
                    <span className="text-xs">Generated photography will appear here</span>
                  </div>
                )}
              </div>

              {generatedResult && (
                <div className="pt-4 flex items-center gap-2">
                  <button
                    onClick={handleDownload}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download {imageSize}</span>
                  </button>

                  <button
                    onClick={handleAddDish}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition shadow-md cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Add to Menu</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
