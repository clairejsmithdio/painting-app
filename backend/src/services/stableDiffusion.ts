import axios from 'axios';
import sharp from 'sharp';

const PAINTING_STYLES = [
  {
    id: 'watercolor',
    label: 'Watercolor',
    prompt: 'transform into a soft watercolor painting, delicate wet washes, translucent colors, artistic and flowing, traditional watercolor technique',
  },
  {
    id: 'oil',
    label: 'Oil Painting',
    prompt: 'transform into a classical oil painting on canvas, rich impasto texture, museum quality, master painter style, warm golden light',
  },
  {
    id: 'ink',
    label: 'Ink Drawing',
    prompt: 'transform into a black ink drawing, expressive line work, sketch style, artistic illustration, fine art pen work',
  },
  {
    id: 'acrylic',
    label: 'Acrylic',
    prompt: 'transform into a vibrant acrylic painting, bold brushstrokes, contemporary art, dynamic colors, artistic texture',
  },
  {
    id: 'impressionist',
    label: 'Impressionist',
    prompt: 'transform into an impressionist oil painting, Claude Monet style, loose brushstrokes, soft focus, atmospheric light, 19th century art',
  },
  {
    id: 'abstract',
    label: 'Abstract Modern',
    prompt: 'transform into an abstract modern painting, geometric shapes, bold colors, contemporary art, expressionist style, paint splatter',
  },
  {
    id: 'pastel',
    label: 'Soft Pastel',
    prompt: 'transform into a soft pastel drawing, blended colors, gentle hues, artistic texture, fine art pastel painting',
  },
  {
    id: 'gouache',
    label: 'Gouache',
    prompt: 'transform into a gouache painting, opaque watercolor, matte finish, bold colors, contemporary illustration style',
  },
  {
    id: 'charcoal',
    label: 'Charcoal Sketch',
    prompt: 'transform into a charcoal drawing, expressive sketching, dramatic shadows, fine art charcoal, artistic detail',
  },
  {
    id: 'digital',
    label: 'Digital Art',
    prompt: 'transform into a digital art painting, digital illustration style, vibrant colors, smooth gradients, contemporary digital painting',
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

// Resize image to valid dimensions (multiples of 32) for Together AI
// Preserves aspect ratio and pads with white if needed
async function normalizeImageForAPI(imageBuffer: Buffer): Promise<string> {
  try {
    console.log(`[normalizeImageForAPI] Input buffer size: ${imageBuffer.length} bytes`);

    // Get original dimensions
    const metadata = await sharp(imageBuffer).metadata();
    console.log(`[normalizeImageForAPI] Original dimensions: ${metadata.width}x${metadata.height}`);

    // Resize to fit within 768x768 while preserving aspect ratio
    // Use white background padding to reach 768x768
    const resized = await sharp(imageBuffer)
      .resize(768, 768, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .jpeg({ quality: 85 })
      .toBuffer();

    console.log(`[normalizeImageForAPI] Resized buffer size: ${resized.length} bytes`);
    const base64 = resized.toString('base64');
    console.log(`[normalizeImageForAPI] Base64 string size: ${base64.length} chars`);

    return `data:image/jpeg;base64,${base64}`;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[normalizeImageForAPI] Error: ${errorMsg}`, error);
    throw new Error(`Image processing failed: ${errorMsg}`);
  }
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
  imageInput?: string | Buffer
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

    const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY;
    if (!TOGETHER_API_KEY) {
      throw new Error('TOGETHER_API_KEY not set');
    }

    // Together AI image-to-image request using FLUX.2-pro
    // Use reference_images parameter (recommended for FLUX.2)
    const requestBody: any = {
      model: 'black-forest-labs/FLUX.2-pro',
      prompt,
      height: 768,
      width: 768,
    };

    // Add reference image if provided (image-to-image mode)
    if (imageInput) {
      let imageDataUri: string;

      if (Buffer.isBuffer(imageInput)) {
        // Resize to valid dimensions (768x768, multiple of 32) and convert to data URI
        imageDataUri = await normalizeImageForAPI(imageInput);
      } else if (typeof imageInput === 'string' && imageInput.startsWith('data:')) {
        // Already a data URI
        imageDataUri = imageInput;
      } else {
        // Raw base64 - convert buffer first
        const buf = Buffer.from(imageInput, 'base64');
        imageDataUri = await normalizeImageForAPI(buf);
      }

      console.log(`[${styleId}] Image data URI size: ${imageDataUri.length} chars`);
      // FLUX.2-pro uses reference_images parameter with data URI format
      requestBody.reference_images = [imageDataUri];
    }

    console.log(`[${styleId}] Request body keys:`, Object.keys(requestBody));
    console.log(`[${styleId}] Has reference_images: ${!!requestBody.reference_images}, size: ${requestBody.reference_images ? requestBody.reference_images[0].length : 0}`);
    console.log(`[${styleId}] Full request (first 500 chars):`, JSON.stringify(requestBody).substring(0, 500));

    const response = await axios.post(
      'https://api.together.xyz/v1/images/generations',
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${TOGETHER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      }
    );

    console.log(`[${styleId}] Response status:`, response.status);
    const imageUrl = response.data.data?.[0]?.url;
    if (!imageUrl) {
      console.error(`[${styleId}] Response data:`, JSON.stringify(response.data));
      throw new Error('No image URL in response');
    }

    console.log(`✅ [${styleId}] Generated successfully${requestBody.reference_images ? ' with reference image' : ''}`);

    return {
      success: true,
      styleId,
      label: PAINTING_STYLES.find((s) => s.id === styleId)?.label || styleId,
      imageUrl,
    };
  } catch (error) {
    let errorMsg = error instanceof Error ? error.message : 'Unknown error';
    if (axios.isAxiosError(error) && error.response) {
      console.error(`❌ [${styleId}] Together AI error (${error.response.status}):`, error.response.data);
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

export async function visualizeImage(
  imageInput: Buffer | string,
  filterStyle?: string
): Promise<ApiResponse> {
  const startTime = Date.now();

  console.log('\n🎨 Starting painting style generation...');
  console.log(`visualizeImage received imageInput: ${!!imageInput}, type: ${Buffer.isBuffer(imageInput) ? 'Buffer' : typeof imageInput}, size: ${Buffer.isBuffer(imageInput) ? (imageInput as Buffer).length : (imageInput as string).length}`);
  console.log(`filterStyle: ${filterStyle}`);

  if (process.env.MOCK_API === 'true') {
    console.log('Using mock mode');
  } else {
    console.log('Using Together AI (FLUX.2-pro with reference_images)');
  }

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
    const result = await generateImage(style.prompt, style.id, imageInput);
    results.push(result);
    if (stylesToGenerate.length > 1) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
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
