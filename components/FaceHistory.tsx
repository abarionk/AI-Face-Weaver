
import React from 'react';

interface Face {
  url: string;
  mimeType: string;
  description: string;
}

interface FaceHistoryProps {
  history: Face[];
  onSelect: (face: Face) => void;
  currentFaceUrl?: string | null;
}

const FaceHistory: React.FC<FaceHistoryProps> = ({ history, onSelect, currentFaceUrl }) => {
  return (
    <div className="bg-gray-800/50 p-4 rounded-2xl border border-gray-700">
      <h3 className="text-lg font-semibold text-gray-300 mb-4">Face History</h3>
      {history.length === 0 ? (
        <p className="text-gray-500 text-center">Your generated faces will appear here.</p>
      ) : (
        <div className="grid grid-cols-4 gap-3">
          {history.map((face, index) => (
            <button
              key={`${face.url}-${index}`}
              onClick={() => onSelect(face)}
              className={`aspect-square rounded-md overflow-hidden focus:outline-none transition-all duration-200 ring-2 ring-transparent hover:ring-sky-400 focus:ring-sky-500 ${
                face.url === currentFaceUrl ? 'ring-sky-500 ring-offset-2 ring-offset-gray-800' : ''
              }`}
              aria-label={`Select face generated from prompt: ${face.description}`}
            >
              <img src={face.url} alt={face.description} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default FaceHistory;
