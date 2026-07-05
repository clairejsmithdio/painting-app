import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
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

  const visualizeMutation = useMutation<VisualizationResponse, Error, string>({
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
      <div className="bg-white rounded-xl shadow-sm p-8 border border-palette-canvas-dark">
        <h3 className="text-2xl font-display font-bold text-palette-navy-dark mb-2">
          Upload Your Sketch
        </h3>
        <p className="text-palette-navy mb-6">
          Choose an image and watch it transform into different painting styles
        </p>
        <ImageUpload
          onImageSelected={handleImageSelected}
          isLoading={visualizeMutation.isPending}
          previewUrl={uploadedImage}
          fileName={uploadedFileName}
        />
      </div>

      {/* Loading State */}
      {visualizeMutation.isPending && (
        <div className="bg-palette-coral-light bg-opacity-10 border border-palette-coral rounded-xl p-8 text-center">
          <div className="animate-spin inline-block w-10 h-10 border-4 border-palette-coral-light border-t-palette-coral rounded-full mb-4"></div>
          <p className="text-palette-navy-dark font-semibold text-lg">
            Generating painting styles...
          </p>
          <p className="text-palette-navy text-sm mt-2">
            This may take 1-2 minutes on first load
          </p>
          {visualizeMutation.data && visualizeMutation.data.processingTime && (
            <p className="text-palette-teal text-sm mt-3 font-medium">
              ✓ Processed in {(visualizeMutation.data as VisualizationResponse).processingTime}ms
            </p>
          )}
        </div>
      )}

      {/* Error State */}
      {visualizeMutation.isError && (
        <div className="bg-palette-red bg-opacity-10 rounded-xl p-8 border border-palette-red">
          <p className="text-palette-red font-semibold text-lg">Error generating styles</p>
          <p className="text-palette-navy text-sm mt-2">
            {visualizeMutation.error?.message || 'Unknown error occurred'}
          </p>
          <button
            onClick={handleReset}
            className="mt-4 px-6 py-2 bg-palette-red text-white rounded-lg hover:bg-palette-coral transition font-medium"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Results */}
      {visualizeMutation.data && !visualizeMutation.isPending && (
        <div>
          <h3 className="text-2xl font-display font-bold text-palette-navy-dark mb-2">
            Your Painting Styles
          </h3>
          <p className="text-palette-navy mb-6">
            Download any style or start again with a new image
          </p>
          <StyleResults styles={visualizeMutation.data.styles} />
          <div className="mt-8 flex justify-center">
            <button
              onClick={handleReset}
              className="px-8 py-3 bg-palette-coral text-white rounded-lg hover:bg-palette-coral-dark transition font-semibold shadow-md"
            >
              Upload Another Image
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
