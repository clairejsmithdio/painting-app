import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { ImageUpload } from './ImageUpload';

interface Brand {
  id: string;
  label: string;
  colorCount: number;
}

interface Pigment {
  name: string;
  percentage: number;
}

interface Recipe {
  pigments: Pigment[];
  resultColor: string;
  mixing_notes: string;
}

interface ColorResult {
  targetColor: string;
  brand: string;
  recipe: Recipe;
}

interface ExtractedColor {
  hex: string;
  rgb: { r: number; g: number; b: number };
}

export const ColorMixer: React.FC = () => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('winsor-newton');
  const [extractedColors, setExtractedColors] = useState<ExtractedColor[]>([]);
  const [selectedColorIndex, setSelectedColorIndex] = useState<number | null>(null);

  const { data: brandsData } = useQuery({
    queryKey: ['paintBrands'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:3002/api/painting/paint-brands');
      return response.data;
    },
  });

  const extractColorsMutation = useMutation<
    { colors: ExtractedColor[] },
    Error,
    string
  >({
    mutationFn: async (imageBase64: string) => {
      const response = await axios.post(
        'http://localhost:3002/api/painting/extract-colors',
        { imageBase64 }
      );
      return response.data;
    },
    onSuccess: (data) => {
      setExtractedColors(data.colors);
      setSelectedColorIndex(0);
    },
  });

  const mixColorsMutation = useMutation<ColorResult, Error, string>({
    mutationFn: async (targetColor: string) => {
      const response = await axios.post('http://localhost:3002/api/painting/mix-colors', {
        targetColor,
        brandId: selectedBrand,
      });
      return response.data;
    },
  });

  const handleImageSelected = (base64: string, fileName: string) => {
    setUploadedImage(base64);
    setUploadedFileName(fileName);
    extractColorsMutation.mutate(base64);
  };

  const handleColorSelect = (index: number) => {
    setSelectedColorIndex(index);
    mixColorsMutation.reset();
  };

  const handleMixClick = () => {
    if (selectedColorIndex !== null) {
      mixColorsMutation.mutate(extractedColors[selectedColorIndex].hex);
    }
  };

  const handleReset = () => {
    setUploadedImage(null);
    setUploadedFileName('');
    setExtractedColors([]);
    setSelectedColorIndex(null);
    extractColorsMutation.reset();
    mixColorsMutation.reset();
  };

  const selectedColor = selectedColorIndex !== null ? extractedColors[selectedColorIndex] : null;
  const recipe = mixColorsMutation.data?.recipe;

  return (
    <div className="space-y-8">
      {/* Upload Section */}
      <div className="bg-white rounded-xl shadow-sm p-8 border border-palette-canvas-dark">
        <h3 className="text-2xl font-display font-bold text-palette-navy-dark mb-2">
          Upload Your Image
        </h3>
        <p className="text-palette-navy mb-6">
          We'll extract the dominant colors from your painting or photo
        </p>
        <ImageUpload
          onImageSelected={handleImageSelected}
          isLoading={extractColorsMutation.isPending}
          previewUrl={uploadedImage}
          fileName={uploadedFileName}
        />
      </div>

      {/* Colors Section */}
      {extractedColors.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-8 border border-palette-canvas-dark">
          <h3 className="text-xl font-display font-bold text-palette-navy-dark mb-6">
            Extracted Colors
          </h3>
          <div className="grid grid-cols-5 gap-3">
            {extractedColors.map((color, index) => (
              <button
                key={index}
                onClick={() => handleColorSelect(index)}
                className={`aspect-square rounded-lg transition-all border-2 ${
                  selectedColorIndex === index
                    ? 'border-palette-coral shadow-lg scale-105'
                    : 'border-palette-canvas-dark hover:border-palette-coral'
                }`}
                style={{ backgroundColor: color.hex }}
                title={color.hex}
              />
            ))}
          </div>
        </div>
      )}

      {/* Brand Selector */}
      {extractedColors.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-8 border border-palette-canvas-dark">
          <h3 className="text-xl font-display font-bold text-palette-navy-dark mb-4">
            Select Paint Brand
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {brandsData?.brands.map((brand: Brand) => (
              <button
                key={brand.id}
                onClick={() => setSelectedBrand(brand.id)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedBrand === brand.id
                    ? 'bg-palette-coral-light border-palette-coral text-palette-navy-dark font-semibold'
                    : 'border-palette-canvas-dark text-palette-navy hover:border-palette-coral'
                }`}
              >
                {brand.label}
                <div className="text-xs mt-1 opacity-75">{brand.colorCount} colors</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mix Result */}
      {selectedColor && (
        <div className="bg-white rounded-xl shadow-sm p-8 border border-palette-canvas-dark">
          <h3 className="text-xl font-display font-bold text-palette-navy-dark mb-4">
            Pigment Recipe
          </h3>

          <div className="mb-6">
            <div
              className="w-full h-24 rounded-lg mb-3 border-2 border-palette-canvas-dark"
              style={{ backgroundColor: selectedColor.hex }}
            />
            <p className="text-sm text-palette-navy">
              Target Color: <span className="font-semibold">{selectedColor.hex}</span>
            </p>
          </div>

          {mixColorsMutation.isPending && (
            <div className="text-center py-8">
              <div className="animate-spin inline-block w-8 h-8 border-3 border-palette-canvas-dark border-t-palette-coral rounded-full mb-3"></div>
              <p className="text-palette-navy-dark font-medium">
                Calculating best pigment mix...
              </p>
            </div>
          )}

          {mixColorsMutation.isError && (
            <div className="bg-palette-red bg-opacity-10 rounded-lg p-4 border border-palette-red">
              <p className="text-palette-red font-semibold">Error calculating recipe</p>
              <p className="text-palette-navy text-sm mt-1">
                {mixColorsMutation.error?.message}
              </p>
            </div>
          )}

          {recipe && (
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-palette-navy-dark mb-3">Pigments</h4>
                <div className="space-y-2">
                  {recipe.pigments.map((pigment, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-palette-navy">{pigment.name}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-32 bg-palette-canvas-dark rounded-full h-2">
                          <div
                            className="bg-palette-coral h-2 rounded-full"
                            style={{ width: `${pigment.percentage}%` }}
                          />
                        </div>
                        <span className="font-semibold text-palette-navy-dark w-10 text-right">
                          {pigment.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-palette-canvas-dark bg-opacity-30 rounded-lg p-4">
                <h4 className="font-semibold text-palette-navy-dark mb-2">Mixing Notes</h4>
                <p className="text-palette-navy text-sm">{recipe.mixing_notes}</p>
              </div>
            </div>
          )}

          {!recipe && !mixColorsMutation.isPending && (
            <button
              onClick={handleMixClick}
              className="w-full px-6 py-3 bg-palette-coral text-white rounded-lg hover:bg-palette-coral-dark transition font-semibold"
            >
              Get Recipe for This Color
            </button>
          )}
        </div>
      )}

      {/* Reset Button */}
      {extractedColors.length > 0 && (
        <div className="text-center">
          <button
            onClick={handleReset}
            className="px-8 py-3 border-2 border-palette-coral text-palette-coral rounded-lg hover:bg-palette-coral hover:text-white transition font-semibold"
          >
            Upload Another Image
          </button>
        </div>
      )}
    </div>
  );
};
