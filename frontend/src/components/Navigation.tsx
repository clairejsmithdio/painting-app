import React from 'react';

interface NavigationProps {
  activeTab: 'inspire' | 'visualise' | 'mix' | 'library' | 'explore';
  onTabChange: (tab: 'inspire' | 'visualise' | 'mix' | 'library' | 'explore') => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'inspire', label: 'Inspire', icon: '💡' },
    { id: 'visualise', label: 'Visualise', icon: '👁️' },
    { id: 'mix', label: 'Mix', icon: '🎨' },
    { id: 'library', label: 'Library', icon: '📚' },
    { id: 'explore', label: 'Explore', icon: '🔍' },
  ] as const;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-palette-canvas-dark shadow-lg">
      <div className="max-w-6xl mx-auto flex justify-around">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 py-4 px-3 flex flex-col items-center gap-1 transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-palette-coral text-palette-coral'
                : 'border-transparent text-palette-navy hover:text-palette-coral'
            }`}
          >
            <span className="text-xl">{tab.icon}</span>
            <span className="text-xs font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};
