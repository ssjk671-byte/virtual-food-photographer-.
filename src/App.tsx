import React, { useState, useEffect } from 'react';
import {
  Camera,
  UtensilsCrossed,
  Sparkles,
  Sliders,
  Upload,
  BookOpen,
  Filter,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  Info,
} from 'lucide-react';
import {
  Dish,
  RestaurantMenu,
  StudioSettings,
  PhotoVariation,
  StyleType,
} from './types';
import { SAMPLE_MENUS } from './data/sampleMenus';
import { Header } from './components/Header';
import { StudioControls } from './components/StudioControls';
import { DishCard } from './components/DishCard';
import { PhotoEditorModal } from './components/PhotoEditorModal';
import { MenuUploadModal } from './components/MenuUploadModal';
import { CustomShotModal } from './components/CustomShotModal';
import { LookbookModal } from './components/LookbookModal';
import { ImageViewerModal } from './components/ImageViewerModal';
import { BulkExportModal } from './components/BulkExportModal';
import { UploadPhotoModal } from './components/UploadPhotoModal';
import { applyWatermarkToImage } from './utils/watermark';

export default function App() {
  // Initialize with the first sample menu
  const initialSample = SAMPLE_MENUS[0];
  const [menu, setMenu] = useState<RestaurantMenu>({
    restaurantName: initialSample.name,
    cuisineType: initialSample.cuisine,
    dishes: initialSample.defaultDishes.map((d) => ({
      ...d,
      variations: [],
    })),
  });

  // Studio Settings state
  const [settings, setSettings] = useState<StudioSettings>({
    style: 'rustic_dark',
    model: 'gemini-3-pro-image-preview',
    imageSize: '2K',
    aspectRatio: '1:1',
    customPromptNotes: '',
    enableWatermark: true,
    watermarkText: '',
    watermarkPosition: 'bottom_right',
    watermarkOpacity: 0.65,
  });

  // Active Category Filter
  const [activeCategory, setActiveCategory] = useState<string>('All');

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isUploadPhotoOpen, setIsUploadPhotoOpen] = useState(false);
  const [uploadPhotoDishId, setUploadPhotoDishId] = useState<string | null>(null);
  const [isLookbookOpen, setIsLookbookOpen] = useState(false);
  const [isCustomShotOpen, setIsCustomShotOpen] = useState(false);
  const [isBulkExportOpen, setIsBulkExportOpen] = useState(false);
  const [editorDish, setEditorDish] = useState<Dish | null>(null);
  const [viewerImage, setViewerImage] = useState<{ url: string; title: string } | null>(null);

  // Batch generation state
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);

  // Toast notification state
  const [toast, setToast] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
    subtext?: string;
  } | null>(null);

  const showToast = (type: 'success' | 'error' | 'info', message: string, subtext?: string) => {
    setToast({ type, message, subtext });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 6000);
  };

  // Generate photography for a single dish
  const handleGeneratePhoto = async (dishId: string) => {
    const dish = menu.dishes.find((d) => d.id === dishId);
    if (!dish) return;

    // Mark as generating
    setMenu((prev) => ({
      ...prev,
      dishes: prev.dishes.map((d) =>
        d.id === dishId ? { ...d, isGenerating: true, error: undefined } : d
      ),
    }));

    try {
      let response: Response;
      try {
        response = await fetch('/api/image/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dishName: dish.name,
            dishDescription: dish.description,
            category: dish.category,
            style: settings.style,
            model: settings.model,
            imageSize: settings.imageSize,
            aspectRatio: settings.aspectRatio,
            customPromptNotes: settings.customPromptNotes,
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
        throw new Error(data?.error || data?.message || `Failed to generate photo (HTTP ${response.status})`);
      }

      // Automatically overlay subtle brand watermark if enabled
      let finalImageUrl = data.imageUrl;
      if (settings.enableWatermark) {
        try {
          finalImageUrl = await applyWatermarkToImage(data.imageUrl, {
            text: settings.watermarkText?.trim() || menu.restaurantName || 'Restaurant Photography',
            position: settings.watermarkPosition,
            opacity: settings.watermarkOpacity,
          });
        } catch (wmErr) {
          console.warn('Failed to overlay brand watermark:', wmErr);
        }
      }

      const newVariation: PhotoVariation = {
        id: `var-${Date.now()}`,
        imageUrl: finalImageUrl,
        style: settings.style,
        model: settings.model,
        size: settings.imageSize,
        aspectRatio: settings.aspectRatio,
        prompt: data.prompt,
        createdAt: new Date().toISOString(),
      };

      setMenu((prev) => ({
        ...prev,
        dishes: prev.dishes.map((d) => {
          if (d.id !== dishId) return d;
          return {
            ...d,
            photoUrl: finalImageUrl,
            photoPrompt: data.prompt,
            photoStyle: settings.style,
            modelUsed: settings.model,
            imageSize: settings.imageSize,
            aspectRatio: settings.aspectRatio,
            isGenerating: false,
            error: undefined,
            variations: [newVariation, ...d.variations],
          };
        }),
      }));

      showToast(
        'success',
        `Shot Captured: ${dish.name}`,
        `${settings.style.replace('_', ' ')} aesthetic in ${settings.imageSize} resolution.`
      );
    } catch (err: any) {
      console.error('Shoot error:', err);
      let errMsg = err?.message || 'Studio shoot failed.';
      const isQuota =
        errMsg.includes('429') ||
        errMsg.includes('RESOURCE_EXHAUSTED') ||
        errMsg.includes('quota') ||
        errMsg.includes('Quota') ||
        errMsg.includes('billing');

      if (isQuota) {
        errMsg =
          'Image generation requires a billing-enabled Gemini API key. Free tier has 0 quota for image models.';
      }

      setMenu((prev) => ({
        ...prev,
        dishes: prev.dishes.map((d) =>
          d.id === dishId ? { ...d, isGenerating: false, error: errMsg } : d
        ),
      }));

      showToast(
        'error',
        `Shoot Failed for ${dish.name}`,
        errMsg
      );
    }
  };

  // Batch generate all unphotographed dishes
  const handlePhotographAll = async () => {
    const unphotographed = menu.dishes.filter((d) => !d.photoUrl && !d.isGenerating);
    if (unphotographed.length === 0 || isBatchGenerating) return;

    setIsBatchGenerating(true);
    setBatchProgress({ current: 0, total: unphotographed.length });

    showToast('info', `Studio Shoot Started`, `Sequentially photographing ${unphotographed.length} dishes in ${settings.imageSize}...`);

    for (let i = 0; i < unphotographed.length; i++) {
      const dish = unphotographed[i];
      setBatchProgress({ current: i + 1, total: unphotographed.length });
      await handleGeneratePhoto(dish.id);
      // Small breather between batch requests
      await new Promise((r) => setTimeout(r, 600));
    }

    setIsBatchGenerating(false);
    setBatchProgress(null);
    showToast('success', 'Studio Shoot Complete!', 'All menu items have been captured.');
  };

  // Handle saving an edited photo from PhotoEditorModal (gemini-3.1-flash-image-preview)
  const handleSaveEdit = async (
    dishId: string,
    editedImageUrl: string,
    editPrompt: string,
    asNewVariation: boolean
  ) => {
    let finalEditedUrl = editedImageUrl;
    if (settings.enableWatermark) {
      try {
        finalEditedUrl = await applyWatermarkToImage(editedImageUrl, {
          text: settings.watermarkText?.trim() || menu.restaurantName || 'Restaurant Photography',
          position: settings.watermarkPosition,
          opacity: settings.watermarkOpacity,
        });
      } catch (err) {
        console.warn('Failed to apply watermark to edited photo:', err);
      }
    }

    const newVariation: PhotoVariation = {
      id: `edit-${Date.now()}`,
      imageUrl: finalEditedUrl,
      style: settings.style,
      model: 'gemini-3.1-flash-image-preview',
      size: settings.imageSize,
      aspectRatio: settings.aspectRatio,
      prompt: editPrompt,
      createdAt: new Date().toISOString(),
      editPrompt,
    };

    setMenu((prev) => ({
      ...prev,
      dishes: prev.dishes.map((d) => {
        if (d.id !== dishId) return d;
        return {
          ...d,
          photoUrl: finalEditedUrl,
          modelUsed: 'gemini-3.1-flash-image-preview',
          variations: [newVariation, ...d.variations],
        };
      }),
    }));

    showToast(
      'success',
      'AI Retouch Applied',
      asNewVariation ? 'Saved as a new variation take with brand watermark.' : 'Dish hero photo updated with brand watermark.'
    );
  };

  // Handle selecting an alternative photo variation
  const handleSelectVariation = (dishId: string, variation: PhotoVariation) => {
    setMenu((prev) => ({
      ...prev,
      dishes: prev.dishes.map((d) => {
        if (d.id !== dishId) return d;
        return {
          ...d,
          photoUrl: variation.imageUrl,
          photoStyle: variation.style,
          modelUsed: variation.model,
          imageSize: variation.size,
          aspectRatio: variation.aspectRatio,
        };
      }),
    }));
  };

  // Apply brand watermark to all existing photographed dishes
  const handleApplyWatermarkToAll = async () => {
    const brandText = settings.watermarkText?.trim() || menu.restaurantName || 'Restaurant Photography';
    showToast('info', 'Applying Watermarks...', `Overlaying "${brandText}" onto all photos.`);

    try {
      const updatedDishes = await Promise.all(
        menu.dishes.map(async (dish) => {
          if (!dish.photoUrl) return dish;
          try {
            const watermarkedHero = await applyWatermarkToImage(dish.photoUrl, {
              text: brandText,
              position: settings.watermarkPosition,
              opacity: settings.watermarkOpacity,
            });

            const watermarkedVariations = await Promise.all(
              (dish.variations || []).map(async (v) => {
                try {
                  const watermarkedVar = await applyWatermarkToImage(v.imageUrl, {
                    text: brandText,
                    position: settings.watermarkPosition,
                    opacity: settings.watermarkOpacity,
                  });
                  return { ...v, imageUrl: watermarkedVar };
                } catch {
                  return v;
                }
              })
            );

            return {
              ...dish,
              photoUrl: watermarkedHero,
              variations: watermarkedVariations,
            };
          } catch (err) {
            console.error('Failed to watermark dish:', dish.name, err);
            return dish;
          }
        })
      );

      setMenu((prev) => ({ ...prev, dishes: updatedDishes }));
      showToast('success', 'Watermark Applied to All Dishes', `All photos branded with "${brandText}".`);
    } catch (err) {
      console.error('Batch watermark error:', err);
      showToast('error', 'Watermark Error', 'Failed to apply watermark to some photos.');
    }
  };

  // Load newly parsed menu from MenuUploadModal
  const handleLoadParsedMenu = (
    restaurantName: string,
    cuisineType: string,
    dishes: Dish[]
  ) => {
    setMenu({
      restaurantName,
      cuisineType,
      dishes,
    });
    setActiveCategory('All');
    showToast('success', 'Menu Loaded Successfully', `${dishes.length} dishes parsed and staged for photography.`);
  };

  // Add custom dish from CustomShotModal
  const handleAddCustomDish = async (newDish: Dish) => {
    let brandedDish = newDish;
    if (settings.enableWatermark && newDish.photoUrl) {
      try {
        const brandText = settings.watermarkText?.trim() || menu.restaurantName || 'Restaurant Photography';
        const watermarked = await applyWatermarkToImage(newDish.photoUrl, {
          text: brandText,
          position: settings.watermarkPosition,
          opacity: settings.watermarkOpacity,
        });
        brandedDish = {
          ...newDish,
          photoUrl: watermarked,
          variations: (newDish.variations || []).map((v) => ({ ...v, imageUrl: watermarked })),
        };
      } catch (err) {
        console.warn('Failed to watermark custom dish:', err);
      }
    }

    setMenu((prev) => ({
      ...prev,
      dishes: [brandedDish, ...prev.dishes],
    }));
    showToast('success', 'Custom Shot Added', `${brandedDish.name} added to your menu studio.`);
  };

  // Attach an uploaded user food photo to an existing menu dish
  const handleAttachPhotoToDish = async (
    dishId: string,
    imageDataUrl: string,
    openEditorAfter: boolean
  ) => {
    let finalImageUrl = imageDataUrl;
    if (settings.enableWatermark) {
      try {
        const brandText = settings.watermarkText?.trim() || menu.restaurantName || 'Restaurant Photography';
        finalImageUrl = await applyWatermarkToImage(imageDataUrl, {
          text: brandText,
          position: settings.watermarkPosition,
          opacity: settings.watermarkOpacity,
        });
      } catch (err) {
        console.warn('Failed to watermark uploaded photo:', err);
      }
    }

    const newVariation: PhotoVariation = {
      id: `upload-${Date.now()}`,
      imageUrl: finalImageUrl,
      style: settings.style,
      model: 'user_uploaded',
      size: 'Original',
      aspectRatio: '1:1',
      prompt: 'User uploaded restaurant dish photograph',
      createdAt: new Date().toISOString(),
    };

    let targetDish: Dish | null = null;

    setMenu((prev) => {
      const updatedDishes = prev.dishes.map((d) => {
        if (d.id !== dishId) return d;
        const updated: Dish = {
          ...d,
          photoUrl: finalImageUrl,
          photoStyle: d.photoStyle || settings.style,
          modelUsed: 'user_uploaded',
          variations: [newVariation, ...(d.variations || [])],
          error: undefined,
          isGenerating: false,
        };
        targetDish = updated;
        return updated;
      });
      return { ...prev, dishes: updatedDishes };
    });

    const dishObj = menu.dishes.find((d) => d.id === dishId);
    const dishDisplayName = dishObj?.name || 'Dish';

    showToast(
      'success',
      `Photo Attached: ${dishDisplayName}`,
      openEditorAfter ? 'Opening AI Retouch editor...' : 'Assigned as hero photograph.'
    );

    if (openEditorAfter) {
      if (dishObj) {
        setEditorDish({
          ...dishObj,
          photoUrl: finalImageUrl,
        });
      }
    }
  };

  // Create a brand new dish directly from an uploaded food photograph
  const handleCreateDishFromPhoto = async (
    dishData: Partial<Dish>,
    imageDataUrl: string,
    openEditorAfter: boolean
  ) => {
    let finalImageUrl = imageDataUrl;
    if (settings.enableWatermark) {
      try {
        const brandText = settings.watermarkText?.trim() || menu.restaurantName || 'Restaurant Photography';
        finalImageUrl = await applyWatermarkToImage(imageDataUrl, {
          text: brandText,
          position: settings.watermarkPosition,
          opacity: settings.watermarkOpacity,
        });
      } catch (err) {
        console.warn('Failed to watermark uploaded photo:', err);
      }
    }

    const newDishId = `dish-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newVariation: PhotoVariation = {
      id: `upload-${Date.now()}`,
      imageUrl: finalImageUrl,
      style: settings.style,
      model: 'user_uploaded',
      size: 'Original',
      aspectRatio: '1:1',
      prompt: 'User uploaded restaurant dish photograph',
      createdAt: new Date().toISOString(),
    };

    const newDish: Dish = {
      id: newDishId,
      name: dishData.name?.trim() || 'Uploaded Gourmet Dish',
      category: dishData.category?.trim() || 'Chef Specials',
      description: dishData.description?.trim() || 'User uploaded artisan food photograph.',
      price: dishData.price?.trim() || '$24',
      keyIngredients: dishData.keyIngredients || [],
      suggestedProps: dishData.suggestedProps || [],
      photoUrl: finalImageUrl,
      photoStyle: settings.style,
      modelUsed: 'user_uploaded',
      variations: [newVariation],
    };

    setMenu((prev) => ({
      ...prev,
      dishes: [newDish, ...prev.dishes],
    }));

    showToast('success', 'New Dish Created', `${newDish.name} added from your uploaded photo.`);

    if (openEditorAfter) {
      setEditorDish(newDish);
    }
  };

  // Fast direct attachment handler for drag-and-drop onto dish cards
  const handleDirectImageAttach = async (dishId: string, imageDataUrl: string) => {
    await handleAttachPhotoToDish(dishId, imageDataUrl, false);
  };

  // Categories list for filter tabs
  const categories = ['All', ...Array.from(new Set(menu.dishes.map((d) => d.category)))];

  const filteredDishes = activeCategory === 'All'
    ? menu.dishes
    : menu.dishes.filter((d) => d.category === activeCategory);

  const photographedCount = menu.dishes.filter((d) => Boolean(d.photoUrl)).length;
  const unphotographedCount = menu.dishes.length - photographedCount;

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-amber-500 selection:text-stone-950">
      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md w-full p-4 rounded-2xl bg-stone-900/95 border border-stone-800 shadow-2xl backdrop-blur-md flex items-start gap-3 animate-in slide-in-from-bottom-3 duration-300">
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : toast.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          ) : (
            <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 text-xs">
            <h5 className="font-semibold text-stone-100">{toast.message}</h5>
            {toast.subtext && <p className="text-stone-400 mt-0.5">{toast.subtext}</p>}
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-stone-500 hover:text-stone-300 transition text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Studio Header */}
      <Header
        restaurantName={menu.restaurantName}
        cuisineType={menu.cuisineType}
        dishCount={menu.dishes.length}
        photographedCount={photographedCount}
        settings={settings}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenUploadPhoto={() => {
          setUploadPhotoDishId(null);
          setIsUploadPhotoOpen(true);
        }}
        onOpenLookbook={() => setIsLookbookOpen(true)}
        onOpenCustomShot={() => setIsCustomShotOpen(true)}
        onOpenBulkExport={() => setIsBulkExportOpen(true)}
      />

      {/* Main Workspace Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 flex-1 w-full">
        {/* Hero Welcome & Quick Explainer */}
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-2">
              <Camera className="w-3.5 h-3.5" />
              <span>Commercial Food Photography Suite for Restaurants</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-100 tracking-tight">
              Culinary Staging & Photo Production
            </h2>
            <p className="text-xs sm:text-sm text-stone-400 mt-1 max-w-2xl leading-relaxed">
              Upload your menu text, choose from <strong className="text-stone-200">Rustic/Dark</strong>, <strong className="text-stone-200">Bright/Modern</strong>, or <strong className="text-stone-200">Social Media</strong> top-down aesthetics, and generate Michelin-grade commercial food photography in <strong className="text-amber-300">1K, 2K, or 4K</strong>.
            </p>
          </div>

          {/* Quick sample switcher buttons */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-stone-500 hidden sm:inline">Switch Sample:</span>
            <div className="flex items-center gap-1.5 bg-stone-900/80 p-1 rounded-xl border border-stone-800">
              {SAMPLE_MENUS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setMenu({
                      restaurantName: s.name,
                      cuisineType: s.cuisine,
                      dishes: s.defaultDishes.map((d) => ({ ...d, variations: [] })),
                    });
                    setActiveCategory('All');
                    showToast('info', `Switched to ${s.name}`, s.cuisine);
                  }}
                  className={`px-2.5 py-1 rounded-lg transition text-xs font-medium cursor-pointer ${
                    menu.restaurantName === s.name
                      ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {s.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Studio Controls (Style Toggles, Models, 1K/2K/4K Size Affordances, Batch Shoot, Bulk Export, Watermark) */}
        <StudioControls
          settings={settings}
          onChangeSettings={(newSettings) => setSettings((prev) => ({ ...prev, ...newSettings }))}
          onPhotographAll={handlePhotographAll}
          onOpenBulkExport={() => setIsBulkExportOpen(true)}
          onOpenUploadPhoto={() => {
            setUploadPhotoDishId(null);
            setIsUploadPhotoOpen(true);
          }}
          onApplyWatermarkToAll={handleApplyWatermarkToAll}
          isBatchGenerating={isBatchGenerating}
          unphotographedCount={unphotographedCount}
          totalCount={menu.dishes.length}
          photographedCount={photographedCount}
          restaurantName={menu.restaurantName}
        />

        {/* Category Navigation Bar & Counts */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-2 border-b border-stone-800/80">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <Filter className="w-3.5 h-3.5 text-stone-500 mr-1 shrink-0" />
            {categories.map((cat) => {
              const count = cat === 'All'
                ? menu.dishes.length
                : menu.dishes.filter((d) => d.category === cat).length;
              const isSelected = activeCategory === cat;

              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                      : 'bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800'
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      isSelected ? 'bg-stone-950/20 text-stone-950 font-bold' : 'bg-stone-800 text-stone-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 text-xs text-stone-400 justify-end">
            <span>
              Showing <strong className="text-stone-200">{filteredDishes.length}</strong> dishes
            </span>
            <button
              onClick={() => {
                setUploadPhotoDishId(null);
                setIsUploadPhotoOpen(true);
              }}
              className="flex items-center gap-1 text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
              title="Attach your own food picture to create or update a dish"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Attach Picture</span>
            </button>
            <span className="text-stone-600">•</span>
            <button
              onClick={() => setIsCustomShotOpen(true)}
              className="flex items-center gap-1 text-stone-300 hover:text-white font-semibold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Custom Prompt</span>
            </button>
          </div>
        </div>

        {/* Dishes Grid */}
        {filteredDishes.length === 0 ? (
          <div className="text-center py-20 bg-stone-900/40 rounded-3xl border border-stone-800/80 space-y-4">
            <UtensilsCrossed className="w-12 h-12 text-stone-600 mx-auto" />
            <div>
              <h3 className="text-base font-serif font-bold text-stone-200">No dishes in this category</h3>
              <p className="text-xs text-stone-500 mt-1">Upload a new menu, attach your dish picture, or switch category filter.</p>
            </div>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setIsUploadOpen(true)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition cursor-pointer"
              >
                Upload Menu Text
              </button>
              <button
                onClick={() => {
                  setUploadPhotoDishId(null);
                  setIsUploadPhotoOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs border border-stone-700 transition cursor-pointer"
              >
                Attach Food Picture
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDishes.map((dish) => (
              <DishCard
                key={dish.id}
                dish={dish}
                onGeneratePhoto={handleGeneratePhoto}
                onOpenEditor={(d) => setEditorDish(d)}
                onSelectVariation={handleSelectVariation}
                onViewImage={(url, title) => setViewerImage({ url, title })}
                onUploadPhoto={(dishId) => {
                  setUploadPhotoDishId(dishId);
                  setIsUploadPhotoOpen(true);
                }}
                onDirectImageAttach={handleDirectImageAttach}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-900 bg-stone-950 py-6 text-center text-xs text-stone-500 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-stone-400">Virtual Food Photographer Studio</span>
            <span className="text-stone-700">•</span>
            <span className="text-stone-500">Gemini 3 Pro & 3.1 Flash Image Preview</span>
          </div>

          <div className="text-stone-500">
            Aesthetic Styles: Rustic/Dark • Bright/Modern • Social Media (top-down)
          </div>
        </div>
      </footer>

      {/* Modals */}
      <UploadPhotoModal
        isOpen={isUploadPhotoOpen}
        onClose={() => {
          setIsUploadPhotoOpen(false);
          setUploadPhotoDishId(null);
        }}
        menu={menu}
        initialDishId={uploadPhotoDishId}
        onAttachPhotoToDish={handleAttachPhotoToDish}
        onCreateDishFromPhoto={handleCreateDishFromPhoto}
      />

      <MenuUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onLoadParsedMenu={handleLoadParsedMenu}
      />

      <PhotoEditorModal
        dish={editorDish}
        isOpen={Boolean(editorDish)}
        onClose={() => setEditorDish(null)}
        onSaveEdit={handleSaveEdit}
      />

      <CustomShotModal
        isOpen={isCustomShotOpen}
        onClose={() => setIsCustomShotOpen(false)}
        onAddDishToMenu={handleAddCustomDish}
        restaurantName={menu.restaurantName}
        enableWatermark={settings.enableWatermark}
        watermarkText={settings.watermarkText}
        watermarkPosition={settings.watermarkPosition}
        watermarkOpacity={settings.watermarkOpacity}
      />

      <LookbookModal
        isOpen={isLookbookOpen}
        onClose={() => setIsLookbookOpen(false)}
        menu={menu}
        onOpenBulkExport={() => {
          setIsLookbookOpen(false);
          setIsBulkExportOpen(true);
        }}
      />

      <BulkExportModal
        isOpen={isBulkExportOpen}
        onClose={() => setIsBulkExportOpen(false)}
        menu={menu}
      />

      <ImageViewerModal
        imageUrl={viewerImage?.url || null}
        title={viewerImage?.title || 'Food Photograph'}
        onClose={() => setViewerImage(null)}
      />
    </div>
  );
}
