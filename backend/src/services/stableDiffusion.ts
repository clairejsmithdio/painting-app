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
  styleId: string,
  imageBase64?: string
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

    const HIGGSFIELD_API_KEY = process.env.HIGGSFIELD_API_KEY;
    const HIGGSFIELD_SECRET = process.env.HIGGSFIELD_SECRET;
    if (!HIGGSFIELD_API_KEY || !HIGGSFIELD_SECRET) {
      throw new Error('HIGGSFIELD_API_KEY or HIGGSFIELD_SECRET not set');
    }

    const authHeader = `Key ${HIGGSFIELD_API_KEY}:${HIGGSFIELD_SECRET}`;

    // Submit generation request
    const requestBody: any = {
      prompt,
      aspect_ratio: '1:1',
      resolution: '720p',
    };

    if (imageBase64) {
      requestBody.image = imageBase64;
    }

    const submitResponse = await axios.post(
      'https://platform.higgsfield.ai/higgsfield-ai/soul/reference',
      requestBody,
      {
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const requestId = submitResponse.data.request_id;
    if (!requestId) {
      throw new Error('No request_id in response');
    }

    console.log(`[${styleId}] Request submitted, polling for completion...`);

    // Poll for completion (max 5 minutes)
    const maxAttempts = 60;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds between polls

      const statusResponse = await axios.get(
        `https://platform.higgsfield.ai/requests/${requestId}/status`,
        {
          headers: { Authorization: authHeader },
          timeout: 30000,
        }
      );

      const status = statusResponse.data.status;
      console.log(`[${styleId}] Status: ${status}`);

      if (status === 'completed') {
        const imageUrl = statusResponse.data.images?.[0]?.url;
        if (!imageUrl) {
          throw new Error('No image URL in completed response');
        }
        console.log(`✅ [${styleId}] Generated successfully`);
        return {
          success: true,
          styleId,
          label: PAINTING_STYLES.find((s) => s.id === styleId)?.label || styleId,
          imageUrl,
        };
      } else if (status === 'failed' || status === 'nsfw') {
        throw new Error(`Generation ${status}`);
      }
    }

    throw new Error('Generation timeout - exceeded maximum wait time');
  } catch (error) {
    let errorMsg = error instanceof Error ? error.message : 'Unknown error';
    if (axios.isAxiosError(error) && error.response) {
      console.error(`❌ [${styleId}] Higgsfield error (${error.response.status}):`, error.response.data);
      errorMsg = `${error.response.status}: ${JSON.stringify(error.response.data)}`;
    } else {
      console.error(`❌ [${styleId}] Error:`, errorMsg);
    }

    return {
      success: false,
      styleId,
      label: PAINTING_STYLES.find((s) => s.id === styleId)?.label || styleId,
      error: errorMsg,
    };
  }
}

export async function visualizeImage(imageInput: Buffer | string, filterStyle?: string): Promise<ApiResponse> {
  const startTime = Date.now();

  console.log('\n🎨 Starting painting style generation...');
  if (process.env.MOCK_API === 'true') {
    console.log('Using mock mode');
  } else {
    console.log('Using Higgsfield API');
  }

  const imageBase64 = imageInput instanceof Buffer
    ? imageInput.toString('base64')
    : imageInput;

  let stylesToGenerate = PAINTING_STYLES;
  if (filterStyle) {
    stylesToGenerate = PAINTING_STYLES.filter((s) => s.id.toLowerCase() === filterStyle.toLowerCase());
    if (stylesToGenerate.length === 0) {
      throw new Error(`Style "${filterStyle}" not found`);
    }
    console.log(`Generating only style: ${stylesToGenerate[0].id}`);
  }

  const results = [];
  for (const style of stylesToGenerate) {
    const result = await generateImage(style.prompt, style.id, imageBase64);
    results.push(result);
    if (stylesToGenerate.length > 1) {
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

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
