import axios from 'axios';

const PAINTING_STYLES = [
  {
    id: 'watercolor',
    label: 'Watercolor',
    prompt: 'soft watercolor painting, delicate wet washes, translucent colors, artistic and flowing, traditional watercolor technique',
  },
  {
    id: 'oil',
    label: 'Oil Painting',
    prompt: 'classical oil painting on canvas, rich impasto texture, museum quality, master painter style, warm golden light',
  },
  {
    id: 'ink',
    label: 'Ink Drawing',
    prompt: 'black ink drawing, expressive line work, sketch style, artistic illustration, fine art pen work',
  },
  {
    id: 'acrylic',
    label: 'Acrylic',
    prompt: 'vibrant acrylic painting, bold brushstrokes, contemporary art, dynamic colors, artistic texture',
  },
  {
    id: 'impressionist',
    label: 'Impressionist',
    prompt: 'impressionist oil painting, Claude Monet style, loose brushstrokes, soft focus, atmospheric light, 19th century art',
  },
  {
    id: 'abstract',
    label: 'Abstract Modern',
    prompt: 'abstract modern painting, geometric shapes, bold colors, contemporary art, expressionist style, paint splatter',
  },
  {
    id: 'pastel',
    label: 'Soft Pastel',
    prompt: 'soft pastel drawing, blended colors, gentle hues, artistic texture, fine art pastel painting',
  },
  {
    id: 'gouache',
    label: 'Gouache',
    prompt: 'gouache painting, opaque watercolor, matte finish, bold colors, contemporary illustration style',
  },
  {
    id: 'charcoal',
    label: 'Charcoal Sketch',
    prompt: 'charcoal drawing, expressive sketching, dramatic shadows, fine art charcoal, artistic detail',
  },
  {
    id: 'digital',
    label: 'Digital Art',
    prompt: 'digital art painting, digital illustration style, vibrant colors, smooth gradients, contemporary digital painting',
  },
];

interface VisualizationResult {
  success: boolean;
  imageUrl?: string;
  styleId?: string;
  label?: string;
  error?: string;
}

interface ApiResponse {
  styles: Array<{
    id: string;
    label: string;
    imageUrl: string;
    error?: string;
  }>;
  processingTime?: number;
}

// Generate a deterministic placeholder image based on style ID
function generatePlaceholderImage(styleId: string): string {
  const colors: { [key: string]: string } = {
    watercolor: 'A8D5FF',
    oil: 'D4A574',
    ink: '2C3E50',
    acrylic: 'FF6B9D',
    impressionist: 'E6B89C',
    abstract: '8B4789',
    pastel: 'F4A9B5',
    gouache: '6C9FB5',
    charcoal: '3A3A3A',
    digital: '7B68EE',
  };

  const color = colors[styleId] || 'CCCCCC';
  const svg = `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad${styleId}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#${color};stop-opacity:0.8" />
        <stop offset="100%" style="stop-color:#${color};stop-opacity:0.3" />
      </linearGradient>
    </defs>
    <rect width="512" height="512" fill="url(#grad${styleId})"/>
    <text x="256" y="256" font-size="48" fill="#333" text-anchor="middle" dominant-baseline="middle" font-family="Georgia, serif">${PAINTING_STYLES.find(s => s.id === styleId)?.label || 'Style'}</text>
  </svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

async function generateImage(
  prompt: string,
  styleId: string
): Promise<VisualizationResult> {
  try {
    console.log(`[${styleId}] Generating: ${prompt}`);

    // Mock mode for local development
    if (process.env.MOCK_API === 'true') {
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log(`✅ [${styleId}] Generated (mock mode)`);
      return {
        success: true,
        styleId,
        label: PAINTING_STYLES.find((s) => s.id === styleId)?.label || styleId,
        imageUrl: generatePlaceholderImage(styleId),
      };
    }

    const REPLICATE_API_KEY = process.env.REPLICATE_API_KEY;
    if (!REPLICATE_API_KEY) {
      throw new Error('REPLICATE_API_KEY not set');
    }

    const response = await axios.post(
      'https://api.replicate.com/v1/predictions',
      {
        version: 'db21e45d3f7023abc9f30f1dbe034e4b7d2fefdf58c93d39ce9c8a74b7c4b6b5',
        input: { prompt },
      },
      {
        headers: {
          Authorization: `Token ${REPLICATE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 120000,
      }
    );

    const imageUrl = response.data.output?.[0];
    if (!imageUrl) {
      throw new Error('No image URL in response');
    }

    console.log(`✅ [${styleId}] Generated successfully`);

    return {
      success: true,
      styleId,
      label: PAINTING_STYLES.find((s) => s.id === styleId)?.label || styleId,
      imageUrl,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ [${styleId}] Error:`, errorMsg);

    return {
      success: false,
      styleId,
      label: PAINTING_STYLES.find((s) => s.id === styleId)?.label || styleId,
      error: errorMsg,
    };
  }
}

export async function visualizeImage(imageInput: Buffer | string): Promise<ApiResponse> {
  const startTime = Date.now();

  console.log('\n🎨 Starting painting style generation...');
  if (process.env.MOCK_API === 'true') {
    console.log('Using mock mode');
  } else {
    console.log('Using Replicate Stable Diffusion');
  }

  const results = await Promise.all(
    PAINTING_STYLES.map((style) => generateImage(style.prompt, style.id))
  );

  const processingTime = Date.now() - startTime;
  console.log(`\n⏱️  Total processing time: ${processingTime}ms`);

  return {
    styles: results.map((r) => ({
      id: r.styleId || '',
      label: r.label || 'Unknown',
      imageUrl: r.imageUrl || '',
      error: r.error,
    })),
    processingTime,
  };
}
