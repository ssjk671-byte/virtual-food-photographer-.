import { WatermarkPosition } from '../types';

export interface WatermarkOptions {
  text: string;
  position?: WatermarkPosition;
  opacity?: number;
  tagline?: string;
}

export async function applyWatermarkToImage(
  imageUrl: string,
  options: WatermarkOptions
): Promise<string> {
  const {
    text,
    position = 'bottom_right',
    opacity = 0.65,
    tagline,
  } = options;

  if (!text || !text.trim()) {
    return imageUrl;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(imageUrl);
          return;
        }

        // Draw original food photograph
        ctx.drawImage(img, 0, 0, width, height);

        // Proportional sizing based on canvas dimensions (scales cleanly for 1K, 2K, 4K)
        const baseDim = Math.min(width, height);
        const fontSize = Math.max(18, Math.round(baseDim * 0.024));
        const padding = Math.max(20, Math.round(baseDim * 0.038));
        const badgePaddingX = Math.round(fontSize * 0.9);
        const badgePaddingY = Math.round(fontSize * 0.5);

        // Watermark typography configuration
        ctx.save();

        const mainText = text.trim();
        const subText = tagline ? tagline.trim() : '';

        ctx.font = `600 ${fontSize}px Georgia, "Playfair Display", "Times New Roman", serif`;
        const textMetrics = ctx.measureText(mainText);
        const textWidth = textMetrics.width;

        let totalWidth = textWidth;
        let subTextWidth = 0;
        const subFontSize = Math.round(fontSize * 0.6);

        if (subText) {
          ctx.font = `400 ${subFontSize}px sans-serif`;
          subTextWidth = ctx.measureText(subText).width;
          totalWidth = Math.max(textWidth, subTextWidth);
        }

        // Calculate watermark bounding box
        const boxWidth = totalWidth + badgePaddingX * 2;
        const boxHeight = (subText ? fontSize * 1.8 + subFontSize : fontSize * 1.4) + badgePaddingY * 2;

        let boxX = 0;
        let boxY = 0;

        switch (position) {
          case 'bottom_right':
            boxX = width - boxWidth - padding;
            boxY = height - boxHeight - padding;
            break;
          case 'bottom_left':
            boxX = padding;
            boxY = height - boxHeight - padding;
            break;
          case 'bottom_center':
            boxX = (width - boxWidth) / 2;
            boxY = height - boxHeight - padding;
            break;
          case 'top_right':
            boxX = width - boxWidth - padding;
            boxY = padding;
            break;
        }

        // Draw subtle frosted glass badge background
        ctx.globalAlpha = Math.min(opacity * 0.75, 0.6);
        ctx.fillStyle = '#0c0a09'; // stone-950

        // Rounded rectangle path for frosted watermark tag
        const radius = Math.round(fontSize * 0.4);
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxWidth, boxHeight, radius);
        ctx.fill();

        // Subtle amber/stone border
        ctx.globalAlpha = Math.min(opacity * 0.8, 0.45);
        ctx.strokeStyle = '#f59e0b'; // amber-500
        ctx.lineWidth = Math.max(1, Math.round(baseDim * 0.0012));
        ctx.stroke();

        // Draw watermark text with soft drop-shadow
        ctx.globalAlpha = opacity;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
        ctx.shadowBlur = Math.round(fontSize * 0.25);
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;

        // Main Restaurant Name
        ctx.fillStyle = '#fef3c7'; // warm amber-50
        ctx.font = `600 ${fontSize}px Georgia, "Playfair Display", "Times New Roman", serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(mainText, boxX + badgePaddingX, boxY + badgePaddingY);

        // Optional Subtitle/Tagline (e.g., "Culinary Photography")
        if (subText) {
          ctx.fillStyle = '#fde68a'; // amber-200
          ctx.font = `500 ${subFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
          ctx.fillText(
            subText,
            boxX + badgePaddingX,
            boxY + badgePaddingY + fontSize * 1.2
          );
        }

        ctx.restore();

        // Output high-quality data URL
        const watermarkedUrl = canvas.toDataURL('image/png', 0.98);
        resolve(watermarkedUrl);
      } catch (err) {
        console.error('Error in applyWatermarkToImage:', err);
        resolve(imageUrl); // Return original if canvas manipulation fails
      }
    };

    img.onerror = (err) => {
      console.error('Failed to load image for watermarking:', err);
      resolve(imageUrl);
    };

    img.src = imageUrl;
  });
}
