import React, { useState } from 'react';
import { useMutation, UseMutationResult } from '@tanstack/react-query';
import axios from 'axios';
import { ImageUpload } from './ImageUpload';
import { StyleResults } from './StyleResults';

interface StyleResult {
  id: string;
  label: string;
  imageUrl?: string;
  error?: string;
}

interface VisualizationResponse {
  styles: StyleResult[];
  processingTime?: number;
}

export const Visualizer: React.FC = () => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');

  const visualizeMutation: UseMutationResult<VisualizationResponse, Error, string> = useMutation<VisualizationResponse, Error, string>({
    mutationFn: async (imageBase64: string) => {
      const response = await axios.post<VisualizationResponse>('http://localhost:3002/api/painting/visualize', {
        imageBase64,
      });
      return response.data as VisualizationResponse;
    },
  });

  const handleImageSelected = (base64: string, fileName: string) => {
    setUploadedImage(base64);
    setUploadedFileName(fileName);
    visualizeMutation.mutate(base64);
  };

  const handleReset = () => {
    setUploadedImage(null);
    setUploadedFileName('');
    visualizeMutation.reset();
  };

  return (
    <div className="space-y-8">
      {/* Upload Section */}
      <div className="bg-white rounded-2xl p-8 border border-palette-canvas-dark shadow-md hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-3xl font-display font-bold text-palette-navy-dark mb-1">
              Upload Your Sketch
            </h3>
            <p className="text-palette-navy text-base leading-relaxed">
              Choose an image and watch it transform into different painting styles
            </p>
          </div>
        </div>
        <div className="mt-6">
          <ImageUpload
            onImageSelected={handleImageSelected}
            isLoading={visualizeMutation.isPending}
            previewUrl={uploadedImage}
            fileName={uploadedFileName}
          />
        </div>
      </div>

      {/* Loading State */}
      {visualizeMutation.isPending && (
        <div className="bg-gradient-to-br from-palette-coral-light to-palette-coral bg-opacity-5 border-2 border-palette-coral border-opacity-30 rounded-2xl p-12 text-center backdrop-blur-sm">
          <div className="flex justify-center mb-6">
            <div className="animate-spin inline-block w-12 h-12 border-4 border-palette-canvas-dark border-t-palette-coral rounded-full"></div>
          </div>
          <p className="text-palette-navy-dark font-display text-xl font-bold mb-2">
            ✨ Generating painting styles...
          </p>
          <p className="text-palette-navy text-sm opacity-75">
            This may take 1-2 minutes on first load
          </p>
        </div>
      )}

      {/* Error State */}
      {visualizeMutation.isError && (
        <div className="bg-gradient-to-br from-palette-red from-opacity-5 to-palette-coral-light to-opacity-5 rounded-2xl p-8 border-2 border-palette-red border-opacity-40">
          <div className="flex items-start gap-4">
            <div className="text-3xl flex-shrink-0">⚠️</div>
            <div className="flex-1">
              <p className="text-palette-red font-display font-bold text-lg mb-1">Unable to generate styles</p>
              <p className="text-palette-navy text-sm mb-4">
                {visualizeMutation.error?.message || 'An unexpected error occurred'}
              </p>
              <button
                onClick={handleReset}
                className="px-6 py-2 bg-palette-red text-white rounded-lg hover:bg-palette-red hover:opacity-90 transition font-semibold"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {visualizeMutation.data && !visualizeMutation.isPending && (
        <div className="animate-fadeIn">
          <div className="mb-8">
            <h3 className="text-3xl font-display font-bold text-palette-navy-dark mb-2">
              ✓ Your Painting Styles
            </h3>
            <p className="text-palette-navy text-base">
              Download any style or start again with a new image
            </p>
          </div>
          <StyleResults styles={visualizeMutation.data.styles} />
          <div className="mt-10 flex justify-center">
            <button
              onClick={handleReset}
              className="px-8 py-3 bg-palette-coral text-white rounded-lg hover:bg-palette-coral-dark transition-all font-semibold shadow-lg hover:shadow-xl"
            >
              Upload Another Image
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
