
import React, { useState, useCallback, useRef } from 'react';
import { generateFace, generateLifestyleScene, generateLifestyleSuggestions, cleanScenePrompt } from './services/geminiService';
import { Step } from './types';
import Header from './components/Header';
import StepIndicator from './components/StepIndicator';
import ImageCard from './components/ImageCard';
import SuggestionsCard from './components/SuggestionsCard';
import FaceHistory from './components/FaceHistory';
import LifestyleHistory from './components/LifestyleHistory';
import ImagePreviewModal from './components/ImagePreviewModal';

interface FaceData {
  url: string;
  mimeType: string;
}

interface FaceHistoryItem extends FaceData {
  description: string;
  age: string;
  gender: string;
  ethnicity: string;
  hairColor: string;
}

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<Step>(Step.Face);
  const [faceDescription, setFaceDescription] = useState<string>('');
  const [lifestylePrompt, setLifestylePrompt] = useState<string>('');
  const [expression, setExpression] = useState<string>('Neutral');
  const [lifestyleStyle, setLifestyleStyle] = useState<string>('Default');
  
  // New state for granular face control
  const [age, setAge] = useState<string>('Any');
  const [gender, setGender] = useState<string>('Any');
  const [ethnicity, setEthnicity] = useState<string>('Any');
  const [hairColor, setHairColor] = useState<string>('Any');
  const [showFaceDetails, setShowFaceDetails] = useState<boolean>(false);
  
  const [faceImage, setFaceImage] = useState<FaceData | null>(null);
  const [faceSource, setFaceSource] = useState<'generated' | 'uploaded' | null>(null);
  const [lifestyleImage, setLifestyleImage] = useState<string | null>(null);
  const [lifestyleSuggestions, setLifestyleSuggestions] = useState<string[]>([]);
  const [suggestionTopic, setSuggestionTopic] = useState<string>('');
  const [faceHistory, setFaceHistory] = useState<FaceHistoryItem[]>([]);
  const [lifestyleHistory, setLifestyleHistory] = useState<string[]>([]);
  const [showFaceHistory, setShowFaceHistory] = useState<boolean>(false);
  const [showLifestyleHistory, setShowLifestyleHistory] = useState<boolean>(false);
  const [showSuggestionsPanel, setShowSuggestionsPanel] = useState<boolean>(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const [isLoadingFace, setIsLoadingFace] = useState<boolean>(false);
  const [isLoadingLifestyle, setIsLoadingLifestyle] = useState<boolean>(false);
  const [lifestyleLoadingMessage, setLifestyleLoadingMessage] = useState<string>('Creating...');
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Options for new controls
  const ageOptions = ['Any', '18-25', '26-35', '36-50', '51-65', '65+'];
  const genderOptions = ['Any', 'Woman', 'Man', 'Non-binary'];
  const ethnicityOptions = ['Any', 'Asian', 'Black', 'Caucasian', 'Hispanic', 'Middle Eastern', 'Mixed'];
  const hairColorOptions = ['Any', 'Black', 'Brown', 'Blonde', 'Red', 'Gray', 'Other'];
  const expressions = ['Neutral', 'Smiling', 'Happy', 'Excited', 'Cute', 'Surprised', 'Thoughtful', 'Confused', 'Sad', 'Angry'];
  const lifestyleStyles = ['Default', 'With a Pet', 'With Food', 'Playful', 'Mysterious', 'Charming', 'Relaxed', 'Emotional'];
  
  const hasNoDescription = !faceDescription.trim() && age === 'Any' && gender === 'Any' && ethnicity === 'Any' && hairColor === 'Any';

  const handleGenerateSuggestions = useCallback(async () => {
    if (!faceDescription.trim()) {
      setError("Please provide a face description first.");
      return;
    }
    if (!suggestionTopic.trim()) {
      setError("Please enter a topic for scene ideas.");
      return;
    }
    
    setError(null);
    setIsLoadingSuggestions(true);
    setLifestyleSuggestions([]);
    try {
      const suggestions = await generateLifestyleSuggestions(faceDescription, suggestionTopic);
      setLifestyleSuggestions(suggestions);
    } catch (suggestionError) {
      console.error("Failed to fetch suggestions:", suggestionError);
      setError(suggestionError instanceof Error ? suggestionError.message : 'Could not load suggestions.');
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [faceDescription, suggestionTopic]);

  const handleGenerateFace = useCallback(async () => {
    if (hasNoDescription) {
      setError('Please provide a description for the face.');
      return;
    }
    setError(null);
    setIsLoadingFace(true);
    setFaceImage(null);
    setLifestyleImage(null);
    setLifestyleSuggestions([]);
    setSuggestionTopic('');
    setLifestyleHistory([]);
    setShowLifestyleHistory(false);
    setShowFaceHistory(false);
    setShowSuggestionsPanel(false);

    try {
      const result = await generateFace(faceDescription, age, gender, ethnicity, hairColor);
      const newFace: FaceHistoryItem = { 
        ...result, 
        description: faceDescription,
        age,
        gender,
        ethnicity,
        hairColor,
      };
      setFaceSource('generated');
      setFaceImage(newFace);
      setFaceHistory(prev => [newFace, ...prev.filter(f => f.url !== newFace.url)]);
      setCurrentStep(Step.Lifestyle);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'An unknown error occurred while generating the face.');
    } finally {
      setIsLoadingFace(false);
    }
  }, [faceDescription, age, gender, ethnicity, hairColor, hasNoDescription]);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
        setError('Please upload a valid image file (JPEG or PNG).');
        return;
    }

    setError(null);
    setIsLoadingFace(true);
    setFaceImage(null);
    setLifestyleImage(null);
    setLifestyleSuggestions([]);
    setFaceSource(null);
    setSuggestionTopic('');
    setLifestyleHistory([]);
    setShowLifestyleHistory(false);
    setShowFaceHistory(false);
    setShowSuggestionsPanel(false);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const resultUrl = reader.result as string;
        const newFace: FaceHistoryItem = { 
          url: resultUrl, 
          mimeType: file.type,
          description: faceDescription,
          age,
          gender,
          ethnicity,
          hairColor,
        };
        setFaceSource('uploaded');
        setFaceImage(newFace);
        setFaceHistory(prev => [newFace, ...prev.filter(f => f.url !== newFace.url)]);
        setCurrentStep(Step.Lifestyle);
      } catch (e) {
        setError('An error occurred while processing the uploaded image.');
      } finally {
        setIsLoadingFace(false);
      }
    };
    reader.onerror = () => {
        setError('Failed to read the uploaded file.');
        setIsLoadingFace(false);
    };
    reader.readAsDataURL(file);

    if (event.target) {
        event.target.value = '';
    }
  }, [faceDescription, age, gender, ethnicity, hairColor]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleGenerateLifestyle = useCallback(async () => {
    if (!lifestylePrompt.trim()) {
      setError('Please provide a description for the lifestyle scene.');
      return;
    }
    if (!faceImage) {
        setError('A face image must be generated or uploaded first.');
        return;
    }
    setError(null);
    setIsLoadingLifestyle(true);
    setLifestyleImage(null);

    try {
      setLifestyleLoadingMessage('Analyzing prompt...');
      const cleanedPrompt = await cleanScenePrompt(lifestylePrompt);

      setLifestyleLoadingMessage('Creating scene...');
      const result = await generateLifestyleScene(faceImage.url, faceImage.mimeType, cleanedPrompt, expression, lifestyleStyle);
      setLifestyleImage(result);
      setLifestyleHistory(prev => [result, ...prev.filter(item => item !== result)]);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'An unknown error occurred while creating the lifestyle scene.');
    } finally {
      setIsLoadingLifestyle(false);
      setLifestyleLoadingMessage('Creating...'); // Reset for next time
    }
  }, [lifestylePrompt, faceImage, expression, lifestyleStyle]);
  
  const handleReset = () => {
    setCurrentStep(Step.Face);
    setFaceDescription('');
    setLifestylePrompt('');
    setExpression('Neutral');
    setLifestyleStyle('Default');
    setAge('Any');
    setGender('Any');
    setEthnicity('Any');
    setHairColor('Any');
    setFaceImage(null);
    setFaceSource(null);
    setLifestyleImage(null);
    setLifestyleSuggestions([]);
    setSuggestionTopic('');
    setFaceHistory([]);
    setLifestyleHistory([]);
    setShowFaceHistory(false);
    setShowLifestyleHistory(false);
    setShowSuggestionsPanel(false);
    setShowFaceDetails(false);
    setError(null);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setLifestylePrompt(suggestion);
  };

  const handleSelectFromHistory = (face: FaceHistoryItem) => {
    setFaceImage({ url: face.url, mimeType: face.mimeType });
    setFaceDescription(face.description);
    setAge(face.age);
    setGender(face.gender);
    setEthnicity(face.ethnicity);
    setHairColor(face.hairColor);
    setFaceSource('generated');
    setCurrentStep(Step.Lifestyle);
    setLifestyleImage(null);
    setLifestylePrompt('');
    setLifestyleHistory([]);
    setShowLifestyleHistory(false);
  };

  const handleSelectFromLifestyleHistory = (imageUrl: string) => {
    setLifestyleImage(imageUrl);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full">
        <Header />
        <StepIndicator currentStep={currentStep} />

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg relative my-4" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
          {/* Column 1: Inputs */}
          <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700 space-y-6 md:col-span-2 lg:col-span-1">
            <div>
              <label htmlFor="faceDescription" className="block text-lg font-semibold text-sky-300 mb-2">
                Step 1: Describe or Upload a Face
              </label>
              
              <textarea
                id="faceDescription"
                rows={3}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition duration-200 placeholder-gray-500 disabled:opacity-50"
                placeholder="e.g., smiling, wearing glasses, with a distinctive birthmark. This adds extra detail."
                value={faceDescription}
                onChange={(e) => setFaceDescription(e.target.value)}
                disabled={isLoadingFace}
              />

              <div className="mt-4">
                <button
                  onClick={() => setShowFaceDetails(prev => !prev)}
                  disabled={isLoadingFace}
                  className="w-full flex justify-between items-center text-left bg-gray-700/50 hover:bg-gray-700 p-3 rounded-lg transition-colors duration-200 disabled:opacity-50"
                  aria-expanded={showFaceDetails}
                >
                  <span className="font-semibold text-gray-300">Refine with Specifics</span>
                  <svg className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${showFaceDetails ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {showFaceDetails && (
                <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                  <div>
                    <label htmlFor="gender" className="block text-sm font-medium text-gray-400 mb-1">Gender</label>
                    <select id="gender" value={gender} onChange={(e) => setGender(e.target.value)} disabled={isLoadingFace} className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition duration-200 disabled:opacity-50">
                        {genderOptions.map(option => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="age" className="block text-sm font-medium text-gray-400 mb-1">Age Range</label>
                    <select id="age" value={age} onChange={(e) => setAge(e.target.value)} disabled={isLoadingFace} className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition duration-200 disabled:opacity-50">
                        {ageOptions.map(option => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="ethnicity" className="block text-sm font-medium text-gray-400 mb-1">Ethnicity</label>
                    <select id="ethnicity" value={ethnicity} onChange={(e) => setEthnicity(e.target.value)} disabled={isLoadingFace} className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition duration-200 disabled:opacity-50">
                        {ethnicityOptions.map(option => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="hairColor" className="block text-sm font-medium text-gray-400 mb-1">Hair Color</label>
                    <select id="hairColor" value={hairColor} onChange={(e) => setHairColor(e.target.value)} disabled={isLoadingFace} className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition duration-200 disabled:opacity-50">
                        {hairColorOptions.map(option => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </div>
                </div>
              )}

              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/png, image/jpeg"
                aria-hidden="true"
              />
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {faceSource === 'generated' ? (
                  <button
                    onClick={handleGenerateFace}
                    disabled={isLoadingFace || hasNoDescription}
                    className="w-full bg-sky-700 hover:bg-sky-600 disabled:bg-sky-900 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center sm:col-span-2"
                  >
                    {isLoadingFace ? 'Generating Another...' : 'Generate a Different Face'}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleGenerateFace}
                      disabled={isLoadingFace || hasNoDescription}
                      className="w-full bg-sky-600 hover:bg-sky-500 disabled:bg-sky-800 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center"
                    >
                      {isLoadingFace ? 'Generating...' : 'Generate Face'}
                    </button>
                     <button
                      onClick={handleUploadClick}
                      disabled={isLoadingFace}
                      className="w-full bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center"
                    >
                      Upload Face
                    </button>
                  </>
                )}
              </div>
            </div>

            <hr className="border-gray-700"/>

            <div>
              <div className="flex justify-between items-center mb-4">
                <label htmlFor="lifestylePrompt" className="block text-lg font-semibold text-teal-300">
                  Step 2: Create a Scene
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowSuggestionsPanel(prev => !prev)}
                    disabled={currentStep !== Step.Lifestyle}
                    className="bg-amber-600 hover:bg-amber-500 disabled:bg-amber-800 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition duration-200 flex items-center justify-center text-sm"
                    aria-expanded={showSuggestionsPanel}
                  >
                    ✨ {showSuggestionsPanel ? 'Hide Ideas' : 'Get Ideas'}
                  </button>
                  {faceImage && (
                    <button onClick={handleReset} disabled={currentStep !== Step.Lifestyle} className="text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white font-bold py-2 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                        Start Over
                    </button>
                  )}
                </div>
              </div>
              
              {faceImage && showSuggestionsPanel && (
                <div className="mb-6">
                  <SuggestionsCard
                    isLoading={isLoadingSuggestions}
                    suggestions={lifestyleSuggestions}
                    onSuggestionClick={handleSuggestionClick}
                    suggestionTopic={suggestionTopic}
                    onSuggestionTopicChange={setSuggestionTopic}
                    onGenerate={handleGenerateSuggestions}
                  />
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Add an Expression:
                </label>
                <div className="flex flex-wrap gap-2">
                  {expressions.map((expr) => (
                    <button
                      key={expr}
                      onClick={() => setExpression(expr)}
                      disabled={currentStep !== Step.Lifestyle}
                      className={`px-3 py-1.5 text-sm font-semibold rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                        expression === expr
                          ? 'bg-teal-500 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {expr}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Add a Style:
                </label>
                <div className="flex flex-wrap gap-2">
                  {lifestyleStyles.map((style) => (
                    <button
                      key={style}
                      onClick={() => setLifestyleStyle(style)}
                      disabled={currentStep !== Step.Lifestyle}
                      className={`px-3 py-1.5 text-sm font-semibold rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                        lifestyleStyle === style
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                id="lifestylePrompt"
                rows={4}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition duration-200 placeholder-gray-500 disabled:opacity-50"
                placeholder="e.g., Drinking coffee at a cozy cafe, reading a book at the library, hiking on a sunny mountain trail."
                value={lifestylePrompt}
                onChange={(e) => setLifestylePrompt(e.target.value)}
                disabled={currentStep !== Step.Lifestyle || isLoadingLifestyle}
              />
            </div>

            <button
              onClick={handleGenerateLifestyle}
              disabled={currentStep !== Step.Lifestyle || isLoadingLifestyle || !lifestylePrompt.trim()}
              className="w-full bg-teal-600 hover:bg-teal-500 disabled:bg-teal-800 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center"
            >
              {isLoadingLifestyle ? lifestyleLoadingMessage : 'Generate Scene'}
            </button>
          </div>

          <div className="space-y-8">
            <ImageCard
              title={faceSource === 'uploaded' ? 'Uploaded Face' : 'Generated Face'}
              imageUrl={faceImage?.url ?? null}
              isLoading={isLoadingFace}
              isActive={currentStep === Step.Face || !!faceImage}
              downloadFilename="generated-face.jpeg"
              historyButton={
                faceHistory.length > 0 ? (
                  <button
                    onClick={() => setShowFaceHistory(prev => !prev)}
                    className="bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white font-semibold py-1 px-3 rounded-lg text-sm transition duration-200 flex items-center"
                    aria-expanded={showFaceHistory}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {showFaceHistory ? 'Hide' : 'Show'} History ({faceHistory.length})
                  </button>
                ) : undefined
              }
            />
            {showFaceHistory && faceHistory.length > 0 && (
              <FaceHistory
                history={faceHistory}
                onSelect={handleSelectFromHistory}
                currentFaceUrl={faceImage?.url}
              />
            )}
          </div>
          
          <div className="space-y-8">
            <ImageCard
              title="Lifestyle Scene"
              imageUrl={lifestyleImage}
              isLoading={isLoadingLifestyle}
              isActive={currentStep === Step.Lifestyle && !!faceImage}
              downloadFilename="lifestyle-scene.jpeg"
              onView={() => setPreviewImageUrl(lifestyleImage)}
              historyButton={
                lifestyleHistory.length > 0 ? (
                  <button
                    onClick={() => setShowLifestyleHistory(prev => !prev)}
                    className="bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white font-semibold py-1 px-3 rounded-lg text-sm transition duration-200 flex items-center"
                    aria-expanded={showLifestyleHistory}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {showLifestyleHistory ? 'Hide' : 'Show'} History ({lifestyleHistory.length})
                  </button>
                ) : undefined
              }
            />
            {showLifestyleHistory && lifestyleHistory.length > 0 && (
              <LifestyleHistory
                  history={lifestyleHistory}
                  onSelect={handleSelectFromLifestyleHistory}
                  currentImageUrl={lifestyleImage}
              />
            )}
          </div>

        </div>
      </div>
      {previewImageUrl && (
        <ImagePreviewModal imageUrl={previewImageUrl} onClose={() => setPreviewImageUrl(null)} />
      )}
    </div>
  );
};

export default App;
