import JSZip from 'jszip';
import { Dish, RestaurantMenu } from '../types';

export interface ExportZipOptions {
  organizeByCategory?: boolean;
  includeAllVariations?: boolean;
  includeManifest?: boolean;
  onProgress?: (progressPercent: number, statusText: string) => void;
}

// Convert a base64 Data URL or fetch an HTTP URL into an ArrayBuffer / Uint8Array
async function imageToBinary(url: string): Promise<{ data: Uint8Array; extension: string }> {
  if (url.startsWith('data:')) {
    const match = url.match(/^data:image\/([a-zA-Z0-9-+]+);base64,(.+)$/);
    if (!match) {
      // Fallback: general data url parse
      const commaIdx = url.indexOf(',');
      const meta = url.slice(0, commaIdx);
      const base64Str = url.slice(commaIdx + 1);
      const ext = meta.includes('jpeg') || meta.includes('jpg') ? 'jpg' : meta.includes('webp') ? 'webp' : 'png';
      const binaryString = atob(base64Str);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return { data: bytes, extension: ext };
    }

    let ext = match[1].toLowerCase();
    if (ext === 'jpeg') ext = 'jpg';
    const binaryString = atob(match[2]);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return { data: bytes, extension: ext };
  } else {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch image from ${url}`);
    const blob = await res.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const type = blob.type || '';
    const ext = type.includes('jpeg') || type.includes('jpg') ? 'jpg' : type.includes('webp') ? 'webp' : 'png';
    return { data: new Uint8Array(arrayBuffer), extension: ext };
  }
}

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '_')
    .slice(0, 40);
}

export async function exportPhotosToZip(
  menu: RestaurantMenu,
  options: ExportZipOptions = {}
): Promise<{ blob: Blob; filename: string; photoCount: number }> {
  const {
    organizeByCategory = true,
    includeAllVariations = false,
    includeManifest = true,
    onProgress,
  } = options;

  const zip = new JSZip();

  // Find all items that have photos
  const dishesWithPhotos = menu.dishes.filter((d) => Boolean(d.photoUrl));

  if (dishesWithPhotos.length === 0) {
    throw new Error('No photos have been generated yet to export. Please photograph at least one dish first.');
  }

  // Count total images to process
  let totalImages = 0;
  dishesWithPhotos.forEach((dish) => {
    if (includeAllVariations && dish.variations && dish.variations.length > 0) {
      totalImages += dish.variations.length;
    } else {
      totalImages += 1;
    }
  });

  onProgress?.(5, `Initializing ZIP package with ${totalImages} high-res food photos...`);

  let processedCount = 0;

  for (let dIdx = 0; dIdx < dishesWithPhotos.length; dIdx++) {
    const dish = dishesWithPhotos[dIdx];
    const categoryFolder = organizeByCategory ? sanitizeFilename(dish.category || 'Mains') : '';
    const folder = categoryFolder ? zip.folder(categoryFolder) || zip : zip;

    if (includeAllVariations && dish.variations && dish.variations.length > 0) {
      for (let vIdx = 0; vIdx < dish.variations.length; vIdx++) {
        const v = dish.variations[vIdx];
        try {
          const { data, extension } = await imageToBinary(v.imageUrl);
          const cleanDishName = sanitizeFilename(dish.name);
          const styleTag = v.style || 'studio';
          const sizeTag = v.size || '1K';
          const fileName = `${String(dIdx + 1).padStart(2, '0')}_${cleanDishName}_take${vIdx + 1}_${styleTag}_${sizeTag}.${extension}`;
          folder.file(fileName, data, { binary: true });
        } catch (err) {
          console.error(`Failed to bundle variation ${vIdx + 1} for ${dish.name}:`, err);
        }

        processedCount++;
        const pct = Math.round(5 + (processedCount / totalImages) * 75);
        onProgress?.(pct, `Bundling [${processedCount}/${totalImages}] ${dish.name} (Take ${vIdx + 1})...`);
      }
    } else if (dish.photoUrl) {
      try {
        const { data, extension } = await imageToBinary(dish.photoUrl);
        const cleanDishName = sanitizeFilename(dish.name);
        const styleTag = dish.photoStyle || 'studio';
        const sizeTag = dish.imageSize || '1K';
        const fileName = `${String(dIdx + 1).padStart(2, '0')}_${cleanDishName}_${styleTag}_${sizeTag}.${extension}`;
        folder.file(fileName, data, { binary: true });
      } catch (err) {
        console.error(`Failed to bundle hero photo for ${dish.name}:`, err);
      }

      processedCount++;
      const pct = Math.round(5 + (processedCount / totalImages) * 75);
      onProgress?.(pct, `Bundling [${processedCount}/${totalImages}] ${dish.name}...`);
    }
  }

  // Include Manifest & Readme documentation
  if (includeManifest) {
    onProgress?.(85, 'Generating lookbook manifest and menu index...');

    // 1. Markdown / Plain Text Readme
    const dateStr = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    let readmeText = `========================================================================\n`;
    readmeText += `  VIRTUAL FOOD PHOTOGRAPHER - STUDIO MASTER EXPORT\n`;
    readmeText += `  Restaurant: ${menu.restaurantName}\n`;
    readmeText += `  Cuisine: ${menu.cuisineType || 'Artisanal'}\n`;
    readmeText += `  Export Date: ${dateStr}\n`;
    readmeText += `  Total Photographed Dishes: ${dishesWithPhotos.length}\n`;
    readmeText += `========================================================================\n\n`;

    readmeText += `TABLE OF CONTENTS & DISH CATALOGUE:\n\n`;

    dishesWithPhotos.forEach((dish, idx) => {
      readmeText += `[#${idx + 1}] ${dish.name.toUpperCase()} (${dish.category})\n`;
      if (dish.price) readmeText += `Price: ${dish.price}\n`;
      readmeText += `Description: ${dish.description}\n`;
      if (dish.keyIngredients && dish.keyIngredients.length > 0) {
        readmeText += `Key Ingredients: ${dish.keyIngredients.join(', ')}\n`;
      }
      readmeText += `Photography Aesthetic: ${dish.photoStyle?.replace('_', ' ') || 'Commercial Studio'}\n`;
      readmeText += `Resolution & Aspect: ${dish.imageSize || '1K'} (${dish.aspectRatio || '1:1'})\n`;
      readmeText += `AI Engine: ${dish.modelUsed || 'gemini-3-pro-image-preview'}\n`;
      if (dish.photoPrompt) {
        readmeText += `Styling Staging Prompt: "${dish.photoPrompt}"\n`;
      }
      readmeText += `------------------------------------------------------------------------\n\n`;
    });

    readmeText += `Commercial Usage Notes:\n`;
    readmeText += `- Suitable for high-resolution print menus, UberEats/DoorDash, digital signage, and Instagram.\n`;
    readmeText += `- Powered by Google Gemini 3 Pro & 3.1 Flash Image Preview.\n`;

    zip.file('STUDIO_LOOKBOOK_MANIFEST.txt', readmeText);

    // 2. JSON Manifest for CMS or digital menu upload
    const jsonManifest = {
      restaurant: menu.restaurantName,
      cuisine: menu.cuisineType,
      exportedAt: new Date().toISOString(),
      dishesCount: dishesWithPhotos.length,
      dishes: dishesWithPhotos.map((d, i) => ({
        index: i + 1,
        id: d.id,
        name: d.name,
        category: d.category,
        price: d.price,
        description: d.description,
        keyIngredients: d.keyIngredients,
        style: d.photoStyle,
        imageSize: d.imageSize,
        aspectRatio: d.aspectRatio,
        model: d.modelUsed,
        variationsCount: d.variations?.length || 1,
      })),
    };

    zip.file('menu_data_manifest.json', JSON.stringify(jsonManifest, null, 2));
  }

  onProgress?.(92, 'Compressing ZIP archive...');

  const zipBlob = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    },
    (metadata) => {
      const zipProgress = Math.round(90 + (metadata.percent / 100) * 9);
      onProgress?.(zipProgress, `Compressing package: ${Math.round(metadata.percent)}%`);
    }
  );

  onProgress?.(100, 'Export complete!');

  const cleanRestaurant = sanitizeFilename(menu.restaurantName) || 'restaurant';
  const filename = `${cleanRestaurant}_food_photography_${dishesWithPhotos.length}_dishes.zip`;

  return { blob: zipBlob, filename, photoCount: totalImages };
}

// Helper to trigger browser download
export function triggerFileDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 15000);
}
