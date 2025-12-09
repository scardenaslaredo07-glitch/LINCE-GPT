
import React from 'react';
import { SparklesIcon } from './icons/SparklesIcon';

const Header: React.FC = () => {
  return (
    <header className="bg-gradient-to-br from-red-800 via-red-900 to-black p-6 md:p-8 rounded-xl shadow-lg border border-red-900 text-gray-100 transition-all duration-500">
      <div className="container mx-auto px-4 py-4 flex items-center justify-center">
        <SparklesIcon className="h-8 w-8 text-blue-500 mr-3" />
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
        Lince GPT 
        </h1>
      </div>
    </header>
  );
};

export default Header;
