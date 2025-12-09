
import React from 'react';
import Header from './components/Header';
import Balancer from './components/Balancer';
import ChatBot from './components/ChatBot';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-red-900 dark:bg-black text-gray-100 font-sans transition-colors duration-300">

      <Header />
      <main className="container mx-auto px-4 py-8">
        <Balancer />
      </main>
      <ChatBot />
    </div>
  );
};

export default App;
