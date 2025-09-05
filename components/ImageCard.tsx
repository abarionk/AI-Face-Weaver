import React from 'react';
import Loader from './Loader';

interface ImageCardProps {
  title: string;
  imageUrl: string | null;
  isLoading: boolean;
  isActive: boolean;
  downloadFilename: string;
  historyButton?: React.ReactNode;
  onView?: () => void;
}

const ImageCard: React.FC<ImageCardProps> = ({ title, imageUrl, isLoading, isActive, downloadFilename, historyButton, onView }) => {
  const cardClasses = `bg-gray-800/50 p-4 rounded-2xl border border-gray-700 transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-40'}`;

  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = downloadFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={cardClasses}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-300">{title}</h3>
        {historyButton}
      </div>
      <div className="aspect-square w-full bg-gray-900 rounded-lg flex items-center justify-center overflow-hidden relative">
        {isLoading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
            <Loader />
          </div>
        )}
        {!isLoading && !imageUrl && (
          <div className="text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {imageUrl && (
          <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
        )}
      </div>
      {imageUrl && !isLoading && (
        <div className={`mt-4 w-full grid gap-3 ${onView ? 'grid-cols-2' : 'grid-cols-1'}`}>
           {onView && (
            <button
              onClick={onView}
              className="w-full bg-sky-700 hover:bg-sky-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 flex items-center justify-center"
              aria-label={`View ${title}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
              View
            </button>
          )}
          <button
            onClick={handleDownload}
            className="w-full bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white font-semibold py-2 px-4 rounded-lg transition duration-200 flex items-center justify-center"
            aria-label={`Download ${title}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageCard;