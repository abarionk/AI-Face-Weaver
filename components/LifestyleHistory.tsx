import React from 'react';

interface LifestyleHistoryProps {
  history: string[];
  onSelect: (url: string) => void;
  currentImageUrl?: string | null;
  onView?: (url: string) => void;
  onClose?: () => void;
}

const LifestyleHistory: React.FC<LifestyleHistoryProps> = ({ history, onSelect, currentImageUrl, onView, onClose }) => {
  return (
    <div className="bg-gray-800/50 p-4 rounded-2xl border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-300">Scene History</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:bg-gray-700/50 p-1 rounded-full transition-colors"
            title="Close History"
            aria-label="Close History"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
      {history.length === 0 ? (
        <p className="text-gray-500 text-center">Your generated scenes will appear here.</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {history.map((url, index) => (
            <div
              key={`${url.slice(-20)}-${index}`}
              className="relative group aspect-square"
            >
              <button
                onClick={() => onSelect(url)}
                className={`w-full h-full rounded-md overflow-hidden focus:outline-none transition-all duration-200 ring-2 ring-transparent hover:ring-teal-400 focus:ring-teal-500 ${
                  url === currentImageUrl ? 'ring-teal-500 ring-offset-2 ring-offset-gray-800' : ''
                }`}
                aria-label={`Select scene ${index + 1}`}
              >
                <img src={url} alt={`Lifestyle scene ${index + 1}`} className="w-full h-full object-cover" />
              </button>
              
              {onView && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onView(url);
                  }}
                  className="absolute top-1 right-1 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-white"
                  title="View full size"
                  aria-label={`View scene ${index + 1}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LifestyleHistory;