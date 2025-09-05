
import React from 'react';
import { Step } from '../types';

interface StepIndicatorProps {
  currentStep: Step;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  const isFaceActive = currentStep === Step.Face;
  const isLifestyleActive = currentStep === Step.Lifestyle;

  return (
    <div className="flex items-center justify-center w-full max-w-md mx-auto my-8">
      <div className="flex items-center">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 ${isFaceActive ? 'bg-sky-500 text-white' : 'bg-gray-700 text-gray-400'}`}>
          1
        </div>
        <span className={`ml-3 font-semibold transition-colors duration-300 ${isFaceActive ? 'text-sky-300' : 'text-gray-500'}`}>
          Generate Face
        </span>
      </div>

      <div className={`flex-1 h-1 mx-4 transition-colors duration-500 ${isLifestyleActive ? 'bg-gradient-to-r from-sky-500 to-teal-500' : 'bg-gray-700'}`} />

      <div className="flex items-center">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 ${isLifestyleActive ? 'bg-teal-500 text-white' : 'bg-gray-700 text-gray-400'}`}>
          2
        </div>
        <span className={`ml-3 font-semibold transition-colors duration-300 ${isLifestyleActive ? 'text-teal-300' : 'text-gray-500'}`}>
          Create Scene
        </span>
      </div>
    </div>
  );
};

export default StepIndicator;
