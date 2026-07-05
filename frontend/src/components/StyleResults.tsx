import React from 'react';

interface StyleResult {
  id: string;
  label: string;
  imageUrl?: string;
  error?: string;
}

interface StyleResultsProps {
  styles: StyleResult[];
}

export const StyleResults: React.FC<StyleResultsProps> = ({ styles }) => {
  const downloadImage = async (imageUrl: string, styleName: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `palette-${styleName.toLowerCase().replace(/\s+/g, '-')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Failed to download image');
      console.error('Download error:', error);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {styles.map((style) => (
        <div
          key={style.id}
          className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow border border-palette-canvas-dark"
        >
          <div className="aspect-square bg-palette-canvas-dark overflow-hidden">
            {style.imageUrl ? (
              <img
                src={style.imageUrl}
                alt={style.label}
                className="w-full h-full object-cover hover:scale-105 transition-transform"
              />
            ) : style.error ? (
              <div className="w-full h-full flex items-center justify-center bg-palette-canvas-dark bg-opacity-50">
                <div className="text-center px-4">
                  <p className="text-sm text-palette-red font-semibold">Generation failed</p>
                  <p className="text-xs text-palette-navy mt-1">{style.error}</p>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="animate-spin inline-block w-8 h-8 border-3 border-palette-canvas-dark border-t-palette-coral rounded-full"></div>
              </div>
            )}
          </div>

          <div className="p-5">
            <h3 className="font-display font-bold text-palette-navy-dark text-lg">{style.label}</h3>

            {style.imageUrl && (
              <button
                onClick={() => downloadImage(style.imageUrl!, style.label)}
                className="mt-4 w-full px-4 py-2 bg-palette-coral text-white rounded-lg hover:bg-palette-coral-dark transition font-medium text-sm"
              >
                ⬇️ Download
              </button>
            )}

            {style.error && (
              <div className="mt-3 p-3 bg-palette-red bg-opacity-10 rounded-lg border border-palette-red border-opacity-30">
                <p className="text-xs text-palette-red font-medium">{style.error}</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
