import React, { useRef } from 'react';

interface ImageUploadProps {
  onImageSelected: (base64: string, fileName: string) => void;
  isLoading: boolean;
  previewUrl: string | null;
  fileName: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageSelected,
  isLoading,
  previewUrl,
  fileName,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPG, PNG, etc.)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64String = (e.target?.result as string).split(',')[1];
      onImageSelected(base64String, file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add('bg-palette-coral-light', 'border-palette-coral');
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('bg-palette-coral-light', 'border-palette-coral');
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-palette-coral-light', 'border-palette-coral');

    const file = e.dataTransfer.files?.[0];
    if (file) {
      const input = fileInputRef.current;
      if (input) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;
        handleFileChange({ target: input } as any);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="border-2 border-dashed border-palette-canvas-dark rounded-xl p-12 text-center hover:border-palette-coral transition-all cursor-pointer bg-palette-canvas-dark bg-opacity-30 hover:bg-opacity-60"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={isLoading}
          className="hidden"
        />

        <svg
          className="w-16 h-16 mx-auto text-palette-coral mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>

        <p className="text-lg font-semibold text-palette-navy-dark">
          {isLoading ? 'Processing your image...' : 'Drag and drop your sketch'}
        </p>
        <p className="text-sm text-palette-navy mt-2">
          or click to select (JPG, PNG • max 10MB)
        </p>

        {isLoading && (
          <div className="mt-4">
            <div className="animate-spin inline-block w-6 h-6 border-2 border-palette-canvas-dark border-t-palette-coral rounded-full"></div>
          </div>
        )}
      </div>

      {/* Preview */}
      {previewUrl && !isLoading && (
        <div className="bg-palette-canvas-dark rounded-xl p-4 border border-palette-canvas-dark">
          <p className="text-sm font-medium text-palette-navy-dark mb-3">
            Original: {fileName}
          </p>
          <img
            src={`data:image/jpeg;base64,${previewUrl}`}
            alt="Preview"
            className="w-full max-h-96 object-contain rounded-lg"
          />
        </div>
      )}
    </div>
  );
};
