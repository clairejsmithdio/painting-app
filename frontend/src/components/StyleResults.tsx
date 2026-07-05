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
          className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-palette-canvas-dark"
        >
          <div className="aspect-square bg-gradient-to-br from-palette-canvas to-palette-canvas-dark overflow-hidden relative group">
            {style.imageUrl ? (
              <>
                <img
                  src={style.imageUrl}
                  alt={style.label}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity"></div>
              </>
            ) : style.error ? (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-palette-canvas-dark to-palette-canvas">
                <div className="text-center px-4 py-6">
                  <p className="text-3xl mb-2">❌</p>
                  <p className="text-sm text-palette-red font-semibold">Generation failed</p>
                  <p className="text-xs text-palette-navy mt-2 opacity-75">{style.error}</p>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-palette-canvas to-palette-canvas-dark">
                <div className="animate-spin inline-block w-10 h-10 border-4 border-palette-canvas-dark border-t-palette-coral rounded-full"></div>
              </div>
            )}
          </div>

          <div className="p-6">
            <h3 className="font-display font-bold text-palette-navy-dark text-xl mb-1">{style.label}</h3>
            <p className="text-palette-navy text-xs opacity-60 mb-4">Painting style</p>

            {style.imageUrl && (
              <button
                onClick={() => downloadImage(style.imageUrl!, style.label)}
                className="mt-4 w-full px-4 py-3 bg-palette-coral text-white rounded-lg hover:bg-palette-coral-dark active:scale-95 transition-all font-semibold text-sm shadow-md hover:shadow-lg"
              >
                ⬇️ Download Image
              </button>
            )}

            {style.error && (
              <div className="mt-4 p-3 bg-palette-red bg-opacity-5 rounded-lg border border-palette-red border-opacity-30 backdrop-blur-sm">
                <p className="text-xs text-palette-red font-medium">{style.error}</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
