import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

const app = express();

// Global process error handlers to prevent silent crashes
process.on('uncaughtException', (err) => {
  console.error('[Process] Uncaught exception:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[Process] Unhandled rejection at promise:', reason);
});

// Permissive CORS middleware for AI Studio preview & iframe environments
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in the environment.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Build photography prompt tailored to food aesthetics
function buildFoodPhotoPrompt(params: {
  dishName: string;
  dishDescription?: string;
  category?: string;
  style: 'rustic_dark' | 'bright_modern' | 'social_media_topdown';
  customPromptNotes?: string;
}) {
  const { dishName, dishDescription, category, style, customPromptNotes } = params;

  let styleDirectives = '';
  if (style === 'rustic_dark') {
    styleDirectives = `
Aesthetic: Rustic/Dark moody culinary masterwork.
Atmosphere & Lighting: Deep dramatic chiaroscuro side-lighting with soft directional highlights and deep velvety shadows. Subtle wisps of hot steam rising.
Surfaces & Props: Weathered dark reclaimed walnut wood or textured charcoal slate slab, handcrafted matte dark charcoal ceramics, coarse natural raw dark linen napkin, vintage forged steel silverware.
Garnish & Accents: Hand-cracked whole peppercorns, coarse Maldon sea salt flakes scattered naturally, rich earthy tones, intense culinary contrast, cinematic Michelin-star ambiance.
Lens & Framing: 85mm f/1.8 macro culinary photography, exquisite shallow depth of field, razor-sharp focus on the hero textures and glistening caramelization.`;
  } else if (style === 'bright_modern') {
    styleDirectives = `
Aesthetic: Bright/Modern airy editorial food styling.
Atmosphere & Lighting: High-key radiant morning daylight streaming from a tall studio window, soft diffused fill, crisp specular glints on sauces, glazes, and oils.
Surfaces & Props: Pristine white Italian Carrara marble countertop, minimalist contemporary bone china dishware, brushed matte brass flatware, subtle pastel ceramic ramekin.
Garnish & Accents: Microgreens, fresh tender herbs with delicate dew drops, clean architectural plating with precise negative space, vibrant natural food colors.
Lens & Framing: 50mm f/2.0 editorial lens, clean crisp depth of field, luminous magazine cover quality.`;
  } else {
    // social_media_topdown
    styleDirectives = `
Aesthetic: Social Media viral top-down flat-lay (bird's-eye view).
Atmosphere & Lighting: 90-degree straight-down overhead perspective, even, shadowless studio light with high dynamic range, crisp edge-to-edge sharpness.
Surfaces & Props: Stylized modern terrazzo or bleached oak table, centered hero dish flanked by curated table storytelling elements: small designer ceramic pinch bowls of spices, folded striped linen, fresh baguette slice, artisan cutlery arranged diagonally, small beverage glass.
Garnish & Accents: Vibrant, contrasty, pop of fresh green herbs, sauce swirl, perfectly balanced overhead layout optimized for Instagram & TikTok food feeds.
Lens & Framing: 35mm overhead flat-lay lens, zero distortion, razor sharp across the entire tabletop composition.`;
  }

  const customAddition = customPromptNotes ? ` Additional artistic director notes: ${customPromptNotes}.` : '';

  return `Commercial award-winning food photography of ${dishName}.
Culinary description: ${dishDescription || 'Gourmet restaurant dish meticulously plated with premium ingredients'}.
Category: ${category || 'Main Course'}.
${styleDirectives}${customAddition}
Culinary realism: Ultra-photorealistic, authentic edible textures, natural glistening juices, fresh steam or crisp edges, zero artificial artifacts. Commercial food advertising standard.`;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Menu parsing endpoint (uses gemini-3.8-flash)
app.post('/api/menu/parse', async (req, res) => {
  try {
    const { menuText } = req.body;
    if (!menuText || typeof menuText !== 'string' || !menuText.trim()) {
      return res.status(400).json({ error: 'Please provide menu text to parse.' });
    }

    const ai = getGeminiClient();

    const prompt = `You are an elite culinary director and food styling coordinator.
Analyze the following raw restaurant menu text. Extract the restaurant name (or deduce a fitting one if absent), cuisine style, and every individual dish.
For each dish, extract or infer:
1. Dish name
2. Category (e.g., Starters & Appetizers, Mains & Entrees, Pasta & Noodles, Seafood, Desserts, Artisan Cocktails, Chef's Specials)
3. Rich sensory description highlighting key ingredients, preparation method, and visual textures
4. Price (if specified, else empty string)
5. 3-5 key ingredients
6. Recommended food styling props

Menu Content:
"""
${menuText.slice(0, 15000)}
"""`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            restaurantName: { type: Type.STRING },
            cuisineType: { type: Type.STRING },
            dishes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  category: { type: Type.STRING },
                  description: { type: Type.STRING },
                  price: { type: Type.STRING },
                  keyIngredients: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  suggestedProps: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ['name', 'category', 'description'],
              },
            },
          },
          required: ['restaurantName', 'dishes'],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    // Ensure every dish has an id
    if (Array.isArray(parsed.dishes)) {
      parsed.dishes = parsed.dishes.map((dish: any, idx: number) => ({
        ...dish,
        id: dish.id || `dish-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`,
      }));
    }

    return res.json(parsed);
  } catch (error: any) {
    console.error('Menu parse error:', error);
    const errorMessage = error?.message || 'Failed to parse menu text.';
    return res.status(500).json({
      error: errorMessage,
      details: error?.toString(),
    });
  }
});

// Image generation endpoint
// Supports both 'gemini-3-pro-image-preview' (with 1K, 2K, 4K affordance) and 'gemini-3.1-flash-image-preview'
app.post('/api/image/generate', async (req, res) => {
  try {
    const {
      dishName,
      dishDescription,
      category,
      style = 'rustic_dark',
      model = 'gemini-3-pro-image-preview',
      imageSize = '1K',
      aspectRatio = '1:1',
      customPrompt,
      customPromptNotes,
    } = req.body;

    if (!dishName && !customPrompt) {
      return res.status(400).json({ error: 'dishName or customPrompt is required.' });
    }

    const ai = getGeminiClient();

    // Use full custom prompt if provided, otherwise assemble sensory food prompt
    const finalPrompt = customPrompt || buildFoodPhotoPrompt({
      dishName,
      dishDescription,
      category,
      style,
      customPromptNotes,
    });

    // Valid models for food photography per @google/genai guidelines
    const isFlash =
      model?.includes('flash') ||
      model === 'gemini-3.1-flash-image' ||
      model === 'gemini-3.1-flash-image-preview';
    const selectedModel = isFlash ? 'gemini-3.1-flash-image' : 'gemini-3-pro-image';

    // Image config
    const validSizes = ['1K', '2K', '4K'];
    const selectedSize = validSizes.includes(imageSize) ? imageSize : '1K';
    const validAspectRatios = ['1:1', '4:3', '16:9', '3:4'];
    const selectedAspectRatio = validAspectRatios.includes(aspectRatio) ? aspectRatio : '1:1';

    console.log(`[Generate Photo] Model: ${selectedModel}, Size: ${selectedSize}, Aspect: ${selectedAspectRatio}, Style: ${style}`);

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: {
        parts: [
          {
            text: finalPrompt,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: selectedAspectRatio,
          imageSize: selectedSize,
        },
      },
    });

    let imageUrl: string | null = null;
    let textResponse = '';

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          const mimeType = part.inlineData.mimeType || 'image/png';
          imageUrl = `data:${mimeType};base64,${part.inlineData.data}`;
          break;
        } else if (part.text) {
          textResponse += part.text;
        }
      }
    }

    if (!imageUrl) {
      console.warn('No inline image data in response. Text was:', textResponse);
      return res.status(500).json({
        error: 'The image generation model did not return an image part. Please try again.',
        textResponse,
      });
    }

    return res.json({
      imageUrl,
      modelUsed: selectedModel,
      imageSize: selectedSize,
      aspectRatio: selectedAspectRatio,
      prompt: finalPrompt,
    });
  } catch (error: any) {
    console.error('Image generation error:', error);
    let rawMessage = error?.message || 'Failed to generate image.';
    let isQuotaError = false;

    // Check if error is serialized JSON
    try {
      const parsed = JSON.parse(rawMessage);
      if (parsed?.error?.message) {
        rawMessage = parsed.error.message;
      }
    } catch {
      // not JSON string
    }

    let hint = '';
    if (
      rawMessage.includes('403') ||
      rawMessage.includes('PERMISSION_DENIED') ||
      rawMessage.includes('API_KEY_INVALID')
    ) {
      hint = 'API key invalid or lacks permissions. Please check your GEMINI_API_KEY in Settings > Secrets.';
    } else if (
      rawMessage.includes('429') ||
      rawMessage.includes('RESOURCE_EXHAUSTED') ||
      rawMessage.includes('quota') ||
      rawMessage.includes('Quota')
    ) {
      isQuotaError = true;
      rawMessage =
        'Image generation requires a billing-enabled Gemini API key. Free tier quota has a 0 limit for image models.';
      hint = 'Rate limit or quota reached. Image generation models require a billing-enabled API key.';
    }

    return res.status(isQuotaError ? 429 : 500).json({
      error: rawMessage,
      isQuotaError,
      hint,
    });
  }
});

// Image edit & retouch endpoint (uses gemini-3.1-flash-image)
app.post('/api/image/edit', async (req, res) => {
  try {
    const {
      image,
      prompt,
      model,
      imageSize,
      aspectRatio,
    } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Base image is required for editing.' });
    }
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'Edit prompt instruction is required.' });
    }

    const ai = getGeminiClient();

    // Parse data URL or raw base64
    let mimeType = 'image/png';
    let base64Data = image;

    if (image.startsWith('data:')) {
      const match = image.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        base64Data = match[2];
      }
    }

    const isPro = model?.includes('pro') || model === 'gemini-3-pro-image';
    const selectedModel = isPro ? 'gemini-3-pro-image' : 'gemini-3.1-flash-image';

    console.log(`[Edit Photo] Model: ${selectedModel}, Prompt: "${prompt}"`);

    const imageConfig: any = {};
    if (aspectRatio) imageConfig.aspectRatio = aspectRatio;
    if (imageSize) imageConfig.imageSize = imageSize;

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType,
            },
          },
          {
            text: `Food photography culinary edit: ${prompt}. Maintain high-end photorealistic food photography quality, crisp focus, and natural culinary aesthetics.`,
          },
        ],
      },
      ...(Object.keys(imageConfig).length > 0 ? { config: { imageConfig } } : {}),
    });

    let imageUrl: string | null = null;
    let textResponse = '';

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          const retMime = part.inlineData.mimeType || 'image/png';
          imageUrl = `data:${retMime};base64,${part.inlineData.data}`;
          break;
        } else if (part.text) {
          textResponse += part.text;
        }
      }
    }

    if (!imageUrl) {
      return res.status(500).json({
        error: 'The editing model did not return a modified image. Please try adjusting your prompt.',
        textResponse,
      });
    }

    return res.json({
      imageUrl,
      modelUsed: selectedModel,
      editPrompt: prompt,
    });
  } catch (error: any) {
    console.error('Image edit error:', error);
    let rawMessage = error?.message || 'Failed to edit image.';
    let isQuotaError = false;

    try {
      const parsed = JSON.parse(rawMessage);
      if (parsed?.error?.message) {
        rawMessage = parsed.error.message;
      }
    } catch {}

    if (
      rawMessage.includes('429') ||
      rawMessage.includes('RESOURCE_EXHAUSTED') ||
      rawMessage.includes('quota') ||
      rawMessage.includes('Quota')
    ) {
      isQuotaError = true;
      rawMessage =
        'Image editing requires a billing-enabled Gemini API key. Free tier quota has a 0 limit for image models.';
    }

    return res.status(isQuotaError ? 429 : 500).json({
      error: rawMessage,
      isQuotaError,
    });
  }
});

// Analyze user-uploaded food picture using multimodal gemini-3.8-flash
app.post('/api/image/analyze', async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'Image data is required for analysis.' });
    }

    const ai = getGeminiClient();

    let mimeType = 'image/png';
    let base64Data = image;

    if (image.startsWith('data:')) {
      const match = image.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        base64Data = match[2];
      }
    }

    const prompt = `You are an elite culinary expert and food photography art director.
Analyze this user-uploaded food photograph. Identify the dish, its culinary category, sensory description, and key ingredients.
Also suggest 3-4 professional food photography retouching prompts that can transform this user photo into a Michelin-star commercial studio masterwork using AI photo editing.

Respond in strict JSON according to the schema.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            dishName: { type: Type.STRING },
            category: { type: Type.STRING },
            description: { type: Type.STRING },
            estimatedPrice: { type: Type.STRING },
            keyIngredients: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            suggestedEnhancements: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['dishName', 'category', 'description'],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Image analysis error:', error);
    const message = error?.message || 'Failed to analyze food picture.';
    return res.status(500).json({
      error: message,
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Culinary Studio server running on http://0.0.0.0:${PORT} [${isProd ? 'production' : 'development'}]`);
  });

  // Ensure ample socket timeout for generative AI photo rendering (can take 20-40s)
  server.timeout = 180000;
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
