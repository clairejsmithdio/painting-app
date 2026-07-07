export interface StyleVariation {
  id: string;
  name: string;
  type: 'discrete_choice';
  options: Array<{
    id: string;
    label: string;
    description: string;
  }>;
}

export interface StyleConfig {
  id: string;
  name: string;
  variations: StyleVariation[];
}

export const STYLE_VARIATIONS: Record<string, StyleConfig> = {
  watercolor: {
    id: 'watercolor',
    name: 'Watercolor',
    variations: [
      {
        id: 'water_control',
        name: 'Water Control',
        type: 'discrete_choice',
        options: [
          { id: 'wet_on_wet', label: 'Wet-on-Wet', description: 'Soft, flowing edges' },
          { id: 'wet_on_dry', label: 'Wet-on-Dry', description: 'Crisp, defined edges' },
          { id: 'damp', label: 'Damp', description: 'Balanced blending' },
        ],
      },
      {
        id: 'execution_speed',
        name: 'Style',
        type: 'discrete_choice',
        options: [
          { id: 'loose_expressive', label: 'Loose & Expressive', description: 'Energetic brushwork' },
          { id: 'controlled_detailed', label: 'Controlled & Detailed', description: 'Precise placement' },
          { id: 'soft_atmospheric', label: 'Soft Atmospheric', description: 'Misty, dreamy' },
        ],
      },
    ],
  },
  'oil painting': {
    id: 'oil_painting',
    name: 'Oil Painting',
    variations: [
      {
        id: 'brushwork',
        name: 'Brushwork',
        type: 'discrete_choice',
        options: [
          { id: 'impasto', label: 'Impasto', description: 'Thick, textured paint' },
          { id: 'glazing', label: 'Glazing', description: 'Transparent layers' },
          { id: 'blending', label: 'Blending', description: 'Smooth transitions' },
        ],
      },
      {
        id: 'execution_pace',
        name: 'Execution Pace',
        type: 'discrete_choice',
        options: [
          { id: 'alla_prima', label: 'Alla Prima', description: 'Spontaneous, wet-on-wet' },
          { id: 'deliberate', label: 'Deliberate', description: 'Careful layering' },
          { id: 'scumbled', label: 'Scumbled', description: 'Loose, textured' },
        ],
      },
    ],
  },
  'ink drawing': {
    id: 'ink_drawing',
    name: 'Ink Drawing',
    variations: [
      {
        id: 'mark_making',
        name: 'Mark Making',
        type: 'discrete_choice',
        options: [
          { id: 'continuous_line', label: 'Continuous Line', description: 'Unbroken flowing lines' },
          { id: 'crosshatching', label: 'Crosshatching', description: 'Intersecting lines' },
          { id: 'stippling', label: 'Stippling', description: 'Countless small dots' },
        ],
      },
      {
        id: 'application',
        name: 'Application',
        type: 'discrete_choice',
        options: [
          { id: 'dry_precise', label: 'Dry & Precise', description: 'Sharp, controlled' },
          { id: 'wet_flowing', label: 'Wet & Flowing', description: 'Ink diffusion' },
          { id: 'mixed', label: 'Mixed', description: 'Combination' },
        ],
      },
    ],
  },
  acrylic: {
    id: 'acrylic',
    name: 'Acrylic',
    variations: [
      {
        id: 'application_method',
        name: 'Application',
        type: 'discrete_choice',
        options: [
          { id: 'layering', label: 'Layering', description: 'Built up translucent layers' },
          { id: 'wet_blending', label: 'Wet Blending', description: 'Blended while wet' },
          { id: 'dry_brush', label: 'Dry Brush', description: 'Textured, visible strokes' },
        ],
      },
      {
        id: 'texture',
        name: 'Texture',
        type: 'discrete_choice',
        options: [
          { id: 'smooth', label: 'Smooth', description: 'Flat, even surface' },
          { id: 'impasto', label: 'Impasto', description: 'Thick, dimensional' },
          { id: 'glazed', label: 'Glazed', description: 'Semi-transparent layers' },
        ],
      },
    ],
  },
  impressionist: {
    id: 'impressionist',
    name: 'Impressionist',
    variations: [
      {
        id: 'brushwork_style',
        name: 'Brushwork',
        type: 'discrete_choice',
        options: [
          { id: 'loose', label: 'Loose', description: 'Visible, energetic strokes' },
          { id: 'optical_mixing', label: 'Optical Mixing', description: 'Pure colors side-by-side' },
          { id: 'broken_color', label: 'Broken Color', description: 'Complementary juxtaposition' },
        ],
      },
      {
        id: 'mood',
        name: 'Mood',
        type: 'discrete_choice',
        options: [
          { id: 'soft_atmospheric', label: 'Soft & Atmospheric', description: 'Diffuse light' },
          { id: 'bright_vibrant', label: 'Bright & Vibrant', description: 'Intense colors' },
          { id: 'rapid_direct', label: 'Rapid & Direct', description: 'Quick impressions' },
        ],
      },
    ],
  },
  'abstract modern': {
    id: 'abstract_modern',
    name: 'Abstract Modern',
    variations: [
      {
        id: 'composition_style',
        name: 'Composition',
        type: 'discrete_choice',
        options: [
          { id: 'geometric', label: 'Geometric', description: 'Precise shapes & lines' },
          { id: 'gestural', label: 'Gestural', description: 'Expressive, spontaneous' },
          { id: 'color_field', label: 'Color Field', description: 'Large color areas' },
        ],
      },
      {
        id: 'visual_impact',
        name: 'Visual Impact',
        type: 'discrete_choice',
        options: [
          { id: 'bold_graphic', label: 'Bold & Graphic', description: 'High contrast, flat' },
          { id: 'layered_transparent', label: 'Layered & Transparent', description: 'Depth & luminosity' },
          { id: 'minimal_subtle', label: 'Minimal & Subtle', description: 'Refined simplicity' },
        ],
      },
    ],
  },
  'soft pastel': {
    id: 'soft_pastel',
    name: 'Soft Pastel',
    variations: [
      {
        id: 'blending_technique',
        name: 'Blending',
        type: 'discrete_choice',
        options: [
          { id: 'soft_blended', label: 'Soft Blended', description: 'Smooth transitions' },
          { id: 'scumbled', label: 'Scumbled', description: 'Broken, textured' },
          { id: 'layered', label: 'Layered', description: 'Built-up richness' },
        ],
      },
      {
        id: 'mark_style',
        name: 'Mark Style',
        type: 'discrete_choice',
        options: [
          { id: 'hatching', label: 'Hatching', description: 'Linear, directional' },
          { id: 'circular', label: 'Circular', description: 'Blended, organic' },
          { id: 'mixed', label: 'Mixed', description: 'Combination of techniques' },
        ],
      },
    ],
  },
  gouache: {
    id: 'gouache',
    name: 'Gouache',
    variations: [
      {
        id: 'application_style',
        name: 'Application',
        type: 'discrete_choice',
        options: [
          { id: 'opaque_layering', label: 'Opaque Layering', description: 'Solid coverage' },
          { id: 'wet_blending', label: 'Wet Blending', description: 'Soft transitions' },
          { id: 'dry_brush', label: 'Dry Brush', description: 'Textured details' },
        ],
      },
      {
        id: 'finish',
        name: 'Finish',
        type: 'discrete_choice',
        options: [
          { id: 'flat_graphic', label: 'Flat & Graphic', description: 'Poster-like' },
          { id: 'matte', label: 'Matte', description: 'Soft, non-reflective' },
          { id: 'glazed', label: 'Glazed', description: 'Subtle transparency' },
        ],
      },
    ],
  },
  'charcoal sketch': {
    id: 'charcoal_sketch',
    name: 'Charcoal Sketch',
    variations: [
      {
        id: 'technique',
        name: 'Technique',
        type: 'discrete_choice',
        options: [
          { id: 'blended', label: 'Blended', description: 'Smooth tonal transitions' },
          { id: 'linear', label: 'Linear', description: 'Hatching & cross-hatching' },
          { id: 'gestural', label: 'Gestural', description: 'Bold expressive marks' },
        ],
      },
      {
        id: 'finish_style',
        name: 'Finish',
        type: 'discrete_choice',
        options: [
          { id: 'finished', label: 'Finished', description: 'Complete, polished' },
          { id: 'sketch', label: 'Sketch', description: 'Quick, rough' },
          { id: 'lifted', label: 'Lifted', description: 'Highlights with erasers' },
        ],
      },
    ],
  },
  'digital art': {
    id: 'digital_art',
    name: 'Digital Art',
    variations: [
      {
        id: 'brush_style',
        name: 'Brush Style',
        type: 'discrete_choice',
        options: [
          { id: 'realistic_simulation', label: 'Realistic Simulation', description: 'Traditional media feel' },
          { id: 'hard_graphic', label: 'Hard & Graphic', description: 'Sharp edges, digital' },
          { id: 'textured', label: 'Textured', description: 'Canvas/paper texture' },
        ],
      },
      {
        id: 'rendering',
        name: 'Rendering',
        type: 'discrete_choice',
        options: [
          { id: 'painterly', label: 'Painterly', description: 'Visible brushstrokes' },
          { id: 'smooth', label: 'Smooth', description: 'Blended gradients' },
          { id: 'experimental', label: 'Experimental', description: 'Unique digital effects' },
        ],
      },
    ],
  },
};

export function getStyleVariations(styleId: string): StyleConfig | undefined {
  // Map short style names to full names used in STYLE_VARIATIONS
  const styleMap: Record<string, string> = {
    'watercolor': 'watercolor',
    'oil': 'oil painting',
    'ink': 'ink drawing',
    'acrylic': 'acrylic',
    'impressionist': 'impressionist',
    'abstract': 'abstract modern',
    'pastel': 'soft pastel',
    'gouache': 'gouache',
    'charcoal': 'charcoal sketch',
    'digital': 'digital art',
  };

  const normalized = styleId.toLowerCase();
  const fullName = styleMap[normalized] || normalized;
  return STYLE_VARIATIONS[fullName];
}

export function getVariationPromptText(styleId: string, variationId: string, optionId: string): string {
  const styleConfig = getStyleVariations(styleId);
  if (!styleConfig) return '';

  const variation = styleConfig.variations.find(v => v.id === variationId);
  if (!variation) return '';

  const option = variation.options.find(o => o.id === optionId);
  if (!option) return '';

  return `${option.label}: ${option.description}`;
}
