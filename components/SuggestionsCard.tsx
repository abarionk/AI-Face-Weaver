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
        <input
            type="text"
            value={suggestionTopic}
            onChange={(e) => onSuggestionTopicChange(e.target.value)}
            placeholder="Enter a topic, e.g., 'at the beach'"
            className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition duration-200 placeholder-gray-500 disabled:opacity-50"
            disabled={isLoading}
        />
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