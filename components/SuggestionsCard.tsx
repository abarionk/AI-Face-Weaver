
import React from 'react';

interface SuggestionsCardProps {
  isLoading: boolean;
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
  suggestionTopic: string;
  onSuggestionTopicChange: (topic: string) => void;
  onGenerate: () => void;
}

const SuggestionSkeleton: React.FC = () => (
    <div className="space-y-3 animate-pulse">
        <div className="h-10 bg-gray-700 rounded-lg"></div>
        <div className="h-10 bg-gray-700 rounded-lg"></div>
        <div className="h-10 bg-gray-700 rounded-lg"></div>
    </div>
);

const SuggestionsCard: React.FC<SuggestionsCardProps> = ({ 
    isLoading, 
    suggestions, 
    onSuggestionClick, 
    suggestionTopic, 
    onSuggestionTopicChange, 
    onGenerate 
}) => {
  return (
    <div>
      <div className="space-y-3 mb-4">
        <div className="relative">
            <input
                type="text"
                value={suggestionTopic}
                onChange={(e) => onSuggestionTopicChange(e.target.value)}
                placeholder="Enter a topic, e.g., 'at the beach'"
                className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 pr-10 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition duration-200 placeholder-gray-500 disabled:opacity-50"
                disabled={isLoading}
            />
            {suggestionTopic && !isLoading && (
              <button
                onClick={() => onSuggestionTopicChange('')}
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-300 focus:outline-none transition-colors"
                aria-label="Clear topic"
                title="Clear text"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </button>
            )}
        </div>
        <button
            onClick={onGenerate}
            disabled={isLoading || !suggestionTopic.trim()}
            className="w-full bg-amber-600 hover:bg-amber-500 disabled:bg-amber-800 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center"
        >
            {isLoading ? 'Generating...' : 'Generate Ideas'}
        </button>
      </div>
      
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 min-h-[164px] flex flex-col justify-center">
        {isLoading ? (
          <SuggestionSkeleton />
        ) : suggestions.length > 0 ? (
          <div className="space-y-3">
            {suggestions.map((suggestion, index) => (
                <button
                key={index}
                onClick={() => onSuggestionClick(suggestion)}
                className="w-full text-left p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors duration-200 text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                aria-label={`Use suggestion: ${suggestion}`}
                >
                {suggestion}
                </button>
            ))}
          </div>
        ) : (
            <p className="text-gray-500 text-center">Enter a topic and click generate to get ideas.</p>
        )}
      </div>
    </div>
  );
};

export default SuggestionsCard;
