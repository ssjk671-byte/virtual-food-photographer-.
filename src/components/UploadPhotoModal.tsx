import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  Camera,
  Sparkles,
  Wand2,
  CheckCircle2,
  Loader2,
  Utensils,
  Plus,
  ArrowRight,
  Info,
  Layers,
  Image as ImageIcon,
} from 'lucide-react';
import { Dish, RestaurantMenu } from '../types';

interface UploadPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  menu: RestaurantMenu;
  initialDishId?: string | null;
  onAttachPhotoToDish: (
    dishId: string,
    imageDataUrl: string,
    openEditorAfter: boolean
  ) => void;
  onCreateDishFromPhoto: (
    dish: Partial<Dish>,
    imageDataUrl: string,
    openEditorAfter: boolean
  ) => void;
}

export const UploadPhotoModal: React.FC<UploadPhotoModalProps> = ({
  isOpen,
  onClose,
  menu,
  initialDishId = null,
  onAttachPhotoToDish,
  onCreateDishFromPhoto,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [targetMode, setTargetMode] = useState<'existing' | 'new'>(
    initialDishId ? 'existing' : 'existing'
  );
  const [selectedDishId, setSelectedDishId] = useState<string>(
    initialDishId || menu.dishes[0]?.id || ''
  );

  // New dish fields
  const [dishName, setDishName] = useState('');
  const [category, setCategory] = useState('Chef Specials');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('$24');

  // AI analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    dishName: string;
    category: string;
    description: string;
    suggestedEnhancements: string[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialDishId) {
        setSelectedDishId(initialDishId);
        setTargetMode('existing');
      } else if (menu.dishes.length > 0) {
        setSelectedDishId((prev) => (menu.dishes.some((d) => d.id === prev) ? prev : menu.dishes[0].id));
      }
      setSelectedImage(null);
      setAnalysisResult(null);
      setDishName('');
      setDescription('');
    }
  }, [isOpen, initialDishId, menu.dishes]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setSelectedImage(dataUrl);
        // Automatically analyze with AI
        analyzeUploadedImage(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setSelectedImage(dataUrl);
        analyzeUploadedImage(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const analyzeUploadedImage = async (imgData: string) => {
    try {
      setIsAnalyzing(true);
      const res = await fetch('/api/image/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imgData }),
      });

      if (!res.ok) throw new Error('Analysis failed');

      const data = await res.json();
      setAnalysisResult(data);

      if (data.dishName) setDishName(data.dishName);
      if (data.category) setCategory(data.category);
      if (data.description) setDescription(data.description);
      if (data.estimatedPrice) setPrice(data.estimatedPrice);
    } catch (err) {
      console.warn('AI Food analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirm = (openEditorAfter: boolean) => {
    if (!selectedImage) return;

    if (targetMode === 'existing' && selectedDishId) {
      onAttachPhotoToDish(selectedDishId, selectedImage, openEditorAfter);
      onClose();
    } else {
      onCreateDishFromPhoto(
        {
          name: dishName.trim() || 'Uploaded Gourmet Dish',
          category: category.trim() || 'Chef Specials',
          description: description.trim() || 'User uploaded food picture.',
          price: price.trim() || '$24',
          suggestedProps: analysisResult?.suggestedEnhancements || [],
        },
        selectedImage,
        openEditorAfter
      );
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-stone-100">
                Attach or Upload Food Picture
              </h3>
              <p className="text-xs text-stone-400">
                Upload your restaurant dishes to enhance, retouch, or assign to menu items.
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
          {/* Drag & Drop Upload Box */}
          {!selectedImage ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-stone-700 hover:border-amber-500/70 bg-stone-950/60 hover:bg-stone-950/90 rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-3"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-16 h-16 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-center text-amber-400 shadow-inner">
                <Upload className="w-7 h-7" />
              </div>

              <div>
                <h4 className="text-sm font-semibold text-stone-200">
                  Drop your food picture here, or <span className="text-amber-400 underline">browse</span>
                </h4>
                <p className="text-xs text-stone-500 mt-1">
                  Supports PNG, JPG, WEBP, HEIC from mobile phones or DSLR cameras
                </p>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-900 border border-stone-800 text-[11px] text-stone-400">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Gemini Multimodal AI automatically analyzes the dish</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Image Preview & AI Analysis Header */}
              <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-2xl bg-stone-950/80 border border-stone-800">
                <div className="relative w-32 h-32 sm:w-36 sm:h-36 shrink-0 rounded-xl overflow-hidden border border-stone-700 bg-stone-900">
                  <img
                    src={selectedImage}
                    alt="Uploaded food"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => {
                      setSelectedImage(null);
                      setAnalysisResult(null);
                    }}
                    className="absolute top-1.5 right-1.5 p-1 rounded-md bg-stone-950/80 text-stone-300 hover:text-white transition"
                    title="Remove and upload different image"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Gemini Culinary Vision</span>
                    </span>
                    {isAnalyzing ? (
                      <span className="text-[11px] text-amber-400 font-mono flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Analyzing dish...</span>
                      </span>
                    ) : (
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                        Analyzed
                      </span>
                    )}
                  </div>

                  {analysisResult ? (
                    <div>
                      <h4 className="font-serif font-bold text-sm text-stone-100">
                        {analysisResult.dishName}
                      </h4>
                      <p className="text-xs text-stone-400 mt-1 line-clamp-2 leading-relaxed">
                        {analysisResult.description}
                      </p>
                      {analysisResult.suggestedEnhancements && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {analysisResult.suggestedEnhancements.slice(0, 2).map((sug, i) => (
                            <span
                              key={i}
                              className="text-[10px] px-2 py-0.5 rounded bg-stone-900 text-amber-300 border border-stone-800"
                            >
                              💡 {sug}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-stone-400">
                      Picture ready to attach. You can assign it to an existing menu dish or add it as a new creation.
                    </p>
                  )}
                </div>
              </div>

              {/* Assignment Mode Tabs */}
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-2">
                  Photo Destination
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setTargetMode('existing')}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      targetMode === 'existing'
                        ? 'bg-amber-500/15 border-amber-500 text-stone-100 ring-1 ring-amber-500/30'
                        : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:bg-stone-800/40'
                    }`}
                  >
                    <div className="text-xs font-bold text-stone-200 flex items-center gap-1.5">
                      <Utensils className="w-3.5 h-3.5 text-amber-400" />
                      <span>Assign to Existing Dish</span>
                    </div>
                    <p className="text-[11px] text-stone-400 mt-0.5">
                      Replace or attach as hero photo for a menu item
                    </p>
                  </button>

                  <button
                    onClick={() => setTargetMode('new')}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      targetMode === 'new'
                        ? 'bg-amber-500/15 border-amber-500 text-stone-100 ring-1 ring-amber-500/30'
                        : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:bg-stone-800/40'
                    }`}
                  >
                    <div className="text-xs font-bold text-stone-200 flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5 text-amber-400" />
                      <span>Create New Menu Dish</span>
                    </div>
                    <p className="text-[11px] text-stone-400 mt-0.5">
                      Add as a new dish detected by AI
                    </p>
                  </button>
                </div>
              </div>

              {/* Target: Existing Dish Selector */}
              {targetMode === 'existing' ? (
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                    Select Menu Dish
                  </label>
                  <select
                    value={selectedDishId}
                    onChange={(e) => setSelectedDishId(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-200 focus:outline-none focus:border-amber-500"
                  >
                    {menu.dishes.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.category}) {d.photoUrl ? '• [Has Photo]' : '• [No Photo]'}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                /* Target: New Dish Fields */
                <div className="space-y-3 p-3.5 rounded-xl bg-stone-950/50 border border-stone-800/60">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-300 mb-1">
                        Dish Name
                      </label>
                      <input
                        type="text"
                        value={dishName}
                        onChange={(e) => setDishName(e.target.value)}
                        placeholder="e.g. Handmade Ravioli"
                        className="w-full text-xs px-3 py-2 rounded-lg bg-stone-900 border border-stone-800 text-stone-200 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-300 mb-1">
                        Category
                      </label>
                      <input
                        type="text"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="e.g. Primi, Mains, Starters"
                        className="w-full text-xs px-3 py-2 rounded-lg bg-stone-900 border border-stone-800 text-stone-200 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-300 mb-1">
                      Culinary Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Sensory description of preparation, plating, and ingredients..."
                      rows={2}
                      className="w-full text-xs px-3 py-2 rounded-lg bg-stone-900 border border-stone-800 text-stone-200 focus:outline-none focus:border-amber-500 leading-relaxed"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-stone-800 bg-stone-950/70 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold transition cursor-pointer"
          >
            Cancel
          </button>

          {selectedImage && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleConfirm(false)}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold border border-stone-700 transition cursor-pointer"
              >
                Attach Photo
              </button>

              <button
                onClick={() => handleConfirm(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs shadow-md shadow-amber-500/20 transition cursor-pointer"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Attach &amp; AI Retouch</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
