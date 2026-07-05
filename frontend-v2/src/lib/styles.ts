export type StyleId =
  | "Original"
  | "Watercolor"
  | "Oil"
  | "Ink"
  | "Acrylic"
  | "Impressionist"
  | "Abstract"
  | "Pastel"
  | "Gouache"
  | "Charcoal"
  | "Digital";

export type StyleSwatch = {
  id: StyleId;
  label: string;
  hint: string;
  /** CSS background for the swatch tile — evokes the medium */
  background: string;
};

export const STYLE_SWATCHES: StyleSwatch[] = [
  {
    id: "Original",
    label: "Original",
    hint: "Your photo",
    background: "transparent",
  },
  {
    id: "Watercolor",
    label: "Watercolor",
    hint: "Soft, translucent washes",
    background:
      "radial-gradient(circle at 30% 30%, #9fd3e6 0%, transparent 55%), radial-gradient(circle at 70% 60%, #f8c9b2 0%, transparent 50%), radial-gradient(circle at 50% 85%, #c6d9a0 0%, transparent 55%), #fbf6ee",
  },
  {
    id: "Oil",
    label: "Oil",
    hint: "Rich, buttery strokes",
    background:
      "linear-gradient(135deg, #3a1f0f 0%, #7a3d1a 30%, #c46a2a 55%, #e6a04c 80%, #f4d38b 100%)",
  },
  {
    id: "Ink",
    label: "Ink",
    hint: "Bold black brushwork",
    background:
      "radial-gradient(ellipse at 30% 40%, #1a1a1a 0%, #1a1a1a 30%, transparent 55%), radial-gradient(ellipse at 70% 65%, #2b2b2b 0%, transparent 45%), #f5efe1",
  },
  {
    id: "Acrylic",
    label: "Acrylic",
    hint: "Flat, saturated color",
    background:
      "conic-gradient(from 200deg at 50% 50%, #ff5a4a, #ffb84a, #06a77d, #1d3557, #ff5a4a)",
  },
  {
    id: "Impressionist",
    label: "Impressionist",
    hint: "Dabs of pure color",
    background:
      "radial-gradient(circle at 15% 25%, #f2c14e 0 8%, transparent 9%), radial-gradient(circle at 40% 60%, #9bc4e2 0 7%, transparent 8%), radial-gradient(circle at 70% 30%, #d97a6c 0 8%, transparent 9%), radial-gradient(circle at 80% 75%, #7ab87a 0 7%, transparent 8%), radial-gradient(circle at 25% 80%, #c9a4d0 0 6%, transparent 7%), #f7ecd5",
  },
  {
    id: "Abstract",
    label: "Abstract",
    hint: "Shape and color first",
    background:
      "linear-gradient(120deg, #ff6b4a 0 40%, transparent 40%), linear-gradient(-30deg, #1d3557 0 45%, transparent 45%), linear-gradient(60deg, #06a77d 0 30%, transparent 30%), #f5f1e8",
  },
  {
    id: "Pastel",
    label: "Pastel",
    hint: "Chalky, powdery hues",
    background:
      "linear-gradient(135deg, #f9d5e5 0%, #fbe7c2 33%, #cfe7d5 66%, #cfd9f2 100%)",
  },
  {
    id: "Gouache",
    label: "Gouache",
    hint: "Matte, opaque color",
    background:
      "linear-gradient(160deg, #d94b3a 0%, #d94b3a 33%, #ecd06f 33%, #ecd06f 66%, #4a7ba6 66%, #4a7ba6 100%)",
  },
  {
    id: "Charcoal",
    label: "Charcoal",
    hint: "Smudged graphite",
    background:
      "linear-gradient(180deg, #d9d3c7 0%, #8a8781 40%, #3a3a3a 100%)",
  },
  {
    id: "Digital",
    label: "Digital",
    hint: "Crisp, glowing pixels",
    background:
      "linear-gradient(135deg, #6a11cb 0%, #2575fc 50%, #00d4ff 100%)",
  },
];
