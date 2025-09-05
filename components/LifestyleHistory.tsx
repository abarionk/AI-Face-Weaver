import React from 'react';

interface LifestyleHistoryProps {
  history: string[];
  onSelect: (url: string) => void;
  currentImageUrl?: string | null;
}

const LifestyleHistory: React.FC<LifestyleHistoryProps> = ({ history, onSelect, currentImageUrl }) => {
  return (
    <div className="bg-gray-800/50 p-4 rounded-2xl border border-gray-700">
      <h3 className="text-lg font-semibold text-gray-300 mb-4">Scene History</h3>
      {history.length === 0 ? (
        <p className="text-gray-500 text-center">Your generated scenes will appear here.</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {history.map((url, index) => (
            <button
              key={`${url.slice(-20)}-${index}`}
              onClick={() => onSelect(url)}
              className={`aspect-square rounded-md overflow-hidden focus:outline-none transition-all duration-200 ring-2 ring-transparent hover:ring-teal-400 focus:ring-teal-500 ${
                url === currentImageUrl ? 'ring-teal-500 ring-offset-2 ring-offset-gray-800' : ''
              }`}
              aria-label={`Select scene ${index + 1}`}
            >
              <img src={url} alt={`Lifestyle scene ${index + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LifestyleHistory;
