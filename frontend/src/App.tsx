import React, { useState } from 'react';
import { Logo } from './components/Logo';
import { Navigation } from './components/Navigation';
import { Visualizer } from './components/Visualizer';
import { ColorMixer } from './components/ColorMixer';

type TabType = 'inspire' | 'visualise' | 'mix' | 'library' | 'explore';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('visualise');

  return (
    <div className="min-h-screen bg-palette-canvas">
      {/* Header */}
      <header className="bg-white border-b border-palette-canvas-dark sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <Logo size="md" showText={true} />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8 pb-32">
        {activeTab === 'visualise' && (
          <div>
            <h2 className="text-4xl font-display font-bold text-palette-navy-dark mb-2">
              Visualise
            </h2>
            <p className="text-palette-navy mb-8">
              Turn your sketches into paintings with AI-powered style transfer
            </p>
            <Visualizer />
          </div>
        )}

        {activeTab === 'mix' && (
          <div>
            <h2 className="text-4xl font-display font-bold text-palette-navy-dark mb-2">
              Mix
            </h2>
            <p className="text-palette-navy mb-8">
              Extract colors from your images and discover exact pigment recipes
            </p>
            <ColorMixer />
          </div>
        )}

        {activeTab === 'inspire' && (
          <div className="py-16 text-center">
            <h2 className="text-4xl font-display font-bold text-palette-navy-dark mb-4">
              Inspire
            </h2>
            <p className="text-palette-navy text-lg">
              Discover ideas, color palettes and fresh inspiration
            </p>
            <div className="mt-8 p-8 bg-white rounded-xl shadow-sm border-2 border-dashed border-palette-canvas-dark">
              <p className="text-palette-navy-dark">Inspiration gallery coming soon</p>
            </div>
          </div>
        )}

        {activeTab === 'library' && (
          <div className="py-16 text-center">
            <h2 className="text-4xl font-display font-bold text-palette-navy-dark mb-4">
              Library
            </h2>
            <p className="text-palette-navy text-lg">
              Save your palettes, mixes and projects in one place
            </p>
            <div className="mt-8 p-8 bg-white rounded-xl shadow-sm border-2 border-dashed border-palette-canvas-dark">
              <p className="text-palette-navy-dark">Your saved items will appear here</p>
            </div>
          </div>
        )}

        {activeTab === 'explore' && (
          <div className="py-16 text-center">
            <h2 className="text-4xl font-display font-bold text-palette-navy-dark mb-4">
              Explore
            </h2>
            <p className="text-palette-navy text-lg">
              Browse community creations and discover new techniques
            </p>
            <div className="mt-8 p-8 bg-white rounded-xl shadow-sm border-2 border-dashed border-palette-canvas-dark">
              <p className="text-palette-navy-dark">Community gallery coming soon</p>
            </div>
          </div>
        )}
      </main>

      {/* Navigation */}
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

export default App;
