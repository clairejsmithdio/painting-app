import express, { Request, Response } from 'express';
import { visualizeImage } from '../services/stableDiffusion';
import {
  extractDominantColors,
  mixColors,
  getAvailableBrands,
} from '../services/colorMixing';

export const paintingRoutes = express.Router();

interface PaintingRequest {
  imageBase64?: string;
  image?: string;
  imageUrl?: string;
  style?: string;
  styleParams?: Record<string, string>;
}

interface ColorMixingRequest {
  targetColor: string;
  brandId: string;
}

paintingRoutes.post('/visualize', async (req: Request, res: Response) => {
  try {
    const { imageBase64, image, style, styleParams } = req.body as PaintingRequest;
    let base64Data = imageBase64 || image;

    console.log('\n📸 Visualize endpoint called');
    console.log(`imageBase64 present: ${!!imageBase64}, length: ${imageBase64?.length || 0}`);
    console.log(`image present: ${!!image}, length: ${image?.length || 0}`);
    console.log(`base64Data present: ${!!base64Data}, length: ${base64Data?.length || 0}`);
    console.log(`style: ${style}`);
    console.log(`styleParams:`, styleParams);

    if (!base64Data) {
      return res.status(400).json({ error: 'imageBase64 or image is required' });
    }

    // Strip data URI prefix if present (data:image/...;base64,...)
    if (base64Data.startsWith('data:')) {
      console.log('[route] Stripping data URI prefix from base64');
      base64Data = base64Data.split(',')[1] || base64Data;
    }

    const imageBuffer = Buffer.from(base64Data, 'base64');
    console.log(`Created buffer, length: ${imageBuffer.length} bytes`);

    const results = await visualizeImage(imageBuffer, style, styleParams);
    res.json(results);
  } catch (error) {
    console.error('Visualization error:', error);
    res.status(500).json({
      error: 'Failed to visualize image',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

paintingRoutes.get('/styles', (req: Request, res: Response) => {
  res.json({
    styles: [
      { id: 'watercolor', label: 'Watercolor', prompt: 'watercolor painting style' },
      { id: 'oil', label: 'Oil Painting', prompt: 'oil painting on canvas style' },
      { id: 'ink', label: 'Ink Drawing', prompt: 'black ink drawing style' },
      { id: 'acrylic', label: 'Acrylic Canvas', prompt: 'acrylic painting on canvas style' },
      { id: 'impressionist', label: 'Impressionist', prompt: 'impressionist painting style' },
      { id: 'abstract', label: 'Abstract Modern', prompt: 'abstract modern painting style' },
      { id: 'pastel', label: 'Soft Pastel', prompt: 'soft pastel drawing style' },
      { id: 'gouache', label: 'Gouache', prompt: 'gouache painting style' },
      { id: 'charcoal', label: 'Charcoal Sketch', prompt: 'charcoal sketch style' },
      { id: 'digital', label: 'Digital Art', prompt: 'digital art painting style' },
    ],
  });
});

paintingRoutes.post('/extract-colors', (req: Request, res: Response) => {
  try {
    const { imageBase64 } = req.body as { imageBase64: string };

    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required' });
    }

    const imageBuffer = Buffer.from(imageBase64, 'base64');
    const colors = extractDominantColors(imageBuffer, 5);

    res.json({
      colors: colors.map((c) => ({
        hex: c.hex,
        rgb: c.rgb,
      })),
    });
  } catch (error) {
    console.error('Color extraction error:', error);
    res.status(500).json({
      error: 'Failed to extract colors',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

paintingRoutes.post('/mix-colors', (req: Request, res: Response) => {
  try {
    const { targetColor, brandId } = req.body as ColorMixingRequest;

    if (!targetColor || !brandId) {
      return res.status(400).json({ error: 'targetColor and brandId are required' });
    }

    const recipe = mixColors(targetColor, brandId);

    if (!recipe) {
      return res.status(404).json({ error: 'Brand not found' });
    }

    res.json({
      targetColor,
      brand: brandId,
      recipe,
    });
  } catch (error) {
    console.error('Color mixing error:', error);
    res.status(500).json({
      error: 'Failed to mix colors',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

paintingRoutes.get('/paint-brands', (req: Request, res: Response) => {
  try {
    const brands = getAvailableBrands();
    res.json({ brands });
  } catch (error) {
    console.error('Paint brands error:', error);
    res.status(500).json({
      error: 'Failed to fetch paint brands',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});
