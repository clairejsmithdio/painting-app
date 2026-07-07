import express, { Request, Response } from 'express';
import axios from 'axios';

export const imagineRoutes = express.Router();

interface ImagineRequest {
  prompt: string;
  style: string;
  styleParams?: Record<string, string>;
}

imagineRoutes.post('/imagine', async (req: Request, res: Response) => {
  try {
    const { prompt, style, styleParams } = req.body as ImagineRequest;

    console.log('\n✨ Imagine endpoint called');
    console.log(`prompt: "${prompt}"`);
    console.log(`style: ${style}`);
    if (styleParams) {
      console.log(`styleParams:`, styleParams);
    }

    if (!prompt || prompt.trim().length < 6) {
      return res.status(400).json({ error: 'Prompt must be at least 6 characters' });
    }

    if (!style) {
      return res.status(400).json({ error: 'Style is required' });
    }

    // Mock mode for local development
    if (process.env.MOCK_API === 'true') {
      console.log('✅ [imagine] Generated (mock mode)');
      // Return a simple gradient placeholder with the style name
      const svg = `<svg width="768" height="768" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="768" height="768" fill="url(#grad)"/>
        <text x="384" y="384" font-size="32" fill="white" text-anchor="middle" dominant-baseline="middle" font-family="Georgia, serif">${style} • Imagine</text>
      </svg>`;
      const imageUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
      return res.json({ imageUrl });
    }

    const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY;
    if (!TOGETHER_API_KEY) {
      throw new Error('TOGETHER_API_KEY not set');
    }

    // Enhance prompt with style
    const stylePrompts: Record<string, string> = {
      watercolor: 'Watercolor painting style, soft washes, translucent colors, artistic',
      'oil painting': 'Oil painting style, rich textures, classical brushstrokes, museum quality',
      'ink drawing': 'Ink drawing style, expressive linework, artistic illustration',
      acrylic: 'Acrylic painting style, bold brushstrokes, vibrant colors, contemporary',
      impressionist: 'Impressionist oil painting style, loose brushstrokes, Claude Monet style',
      'abstract modern': 'Abstract modern painting style, geometric shapes, bold colors, contemporary art',
      'soft pastel': 'Soft pastel drawing style, blended colors, gentle hues, fine art',
      gouache: 'Gouache painting style, opaque watercolor, matte finish, bold colors',
      'charcoal sketch': 'Charcoal drawing style, expressive sketching, dramatic shadows, fine art',
      'digital art': 'Digital art painting style, smooth gradients, contemporary digital illustration',
    };

    const stylePrefix = stylePrompts[style.toLowerCase()] || `${style} style painting`;
    let enhancedPrompt = `${prompt}. Painted in ${stylePrefix}`;

    // Add style parameters to prompt
    if (styleParams && Object.keys(styleParams).length > 0) {
      const paramDescriptions = Object.values(styleParams).filter(p => p && p.length > 0);
      if (paramDescriptions.length > 0) {
        enhancedPrompt += `. Style details: ${paramDescriptions.join(', ')}.`;
      }
    }

    console.log(`[imagine] Enhanced prompt: "${enhancedPrompt}"`);

    // Call Together AI for text-to-image
    const requestBody = {
      model: 'black-forest-labs/FLUX.2-pro',
      prompt: enhancedPrompt,
      height: 768,
      width: 768,
      response_format: 'url',
    };

    const response = await axios.post(
      'https://api.together.xyz/v1/images/generations',
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${TOGETHER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 120000,
      }
    );

    console.log(`[imagine] Response status:`, response.status);
    const imageUrl = response.data.data?.[0]?.url;

    if (!imageUrl) {
      console.error(`[imagine] Response data:`, JSON.stringify(response.data));
      throw new Error('No image URL in response');
    }

    console.log(`✅ [imagine] Generated successfully`);
    res.json({ imageUrl });
  } catch (error) {
    let errorMsg = error instanceof Error ? error.message : 'Unknown error';
    if (axios.isAxiosError(error) && error.response) {
      console.error(`❌ [imagine] Together AI error (${error.response.status}):`, error.response.data);
      errorMsg = `${error.response.status}: ${JSON.stringify(error.response.data)}`;
    } else {
      console.error(`❌ [imagine] Error:`, errorMsg);
    }

    res.status(500).json({
      error: 'Failed to generate image',
      message: errorMsg,
    });
  }
});
