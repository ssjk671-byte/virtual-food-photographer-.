export type StyleType = 'rustic_dark' | 'bright_modern' | 'social_media_topdown';

export type ModelType =
  | 'gemini-3-pro-image'
  | 'gemini-3.1-flash-image'
  | 'gemini-3-pro-image-preview'
  | 'gemini-3.1-flash-image-preview'
  | 'user_uploaded';

export type ImageSize = '1K' | '2K' | '4K' | 'Original';

export type AspectRatio = '1:1' | '4:3' | '16:9' | '3:4';

export type WatermarkPosition = 'bottom_right' | 'bottom_left' | 'bottom_center' | 'top_right';

export interface PhotoVariation {
  id: string;
  imageUrl: string;
  style: StyleType;
  model: ModelType;
  size: ImageSize;
  aspectRatio: AspectRatio;
  prompt: string;
  createdAt: string;
  editedFromId?: string;
  editPrompt?: string;
}

export interface Dish {
  id: string;
  name: string;
  category: string;
  description: string;
  price?: string;
  keyIngredients?: string[];
  suggestedProps?: string[];
  photoUrl?: string;
  currentPhotoId?: string;
  photoPrompt?: string;
  photoStyle?: StyleType;
  modelUsed?: ModelType;
  imageSize?: ImageSize;
  aspectRatio?: AspectRatio;
  isGenerating?: boolean;
  error?: string;
  variations: PhotoVariation[];
}

export interface RestaurantMenu {
  restaurantName: string;
  cuisineType: string;
  dishes: Dish[];
}

export interface StudioSettings {
  style: StyleType;
  model: ModelType;
  imageSize: ImageSize;
  aspectRatio: AspectRatio;
  customPromptNotes: string;
  enableWatermark: boolean;
  watermarkText?: string;
  watermarkPosition: WatermarkPosition;
  watermarkOpacity: number;
}
