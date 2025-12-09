
import React, { useState, useCallback } from 'react';
import { balanceEquation } from '../services/geminiService';
import { BalanceResult } from '../types';
import Explanation from './Explanation';
import { SparklesIcon } from './icons/SparklesIcon';

const Balancer: React.FC = () => {
  const [equation, setEquation] = useState<string>('H3PO4 + Ca(OH)2 -> Ca3(PO4)2 + H2O');
  const [result, setResult] = useState<BalanceResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleBalance = useCallback(async () => {
    if (!equation.trim()) {
      setError('Por favor, introduce una ecuación química.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await balanceEquation(equation);
      setResult(response);
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado.');
    } finally {
      setIsLoading(false);
    }
  }, [equation]);

  const handleExample = (exampleEquation: string) => {
    setEquation(exampleEquation);
    setResult(null);
    setError(null);
  };
  
  const examples = [
    'Fe + H2SO4 -> Fe2(SO4)3 + H2',
    'C5H12 + O2 -> CO2 + H2O',
    'KMnO4 + HCl -> KCl + MnCl2 + Cl2 + H2O',
    'S + NaOH -> Na2S + Na2S2O3 + H2O'
  ];

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-gradient-to-br from-red-800 via-red-900 to-black p-6 md:p-8 rounded-xl shadow-lg border border-red-900 text-gray-100 transition-all duration-500">


        <h2 className="text-xl font-semibold text-center mb-1 text-gray-700 dark:text-gray-200">Balanceador de Ecuaciones Químicas</h2>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-6">
          Introduce una ecuación y la IA te la balanceará con una explicación paso a paso.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <input
            type="text"
            value={equation}
            onChange={(e) => setEquation(e.target.value)}
            placeholder="Ej: H2 + O2 -> H2O"
            className="flex-grow w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-200"
            disabled={isLoading}
          />
          <button
            onClick={handleBalance}
            disabled={isLoading}
            className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Balanceando...
              </>
            ) : (
                <>
                <SparklesIcon className="h-5 w-5 mr-2" />
                Balancear
                </>
            )}
          </button>
        </div>
         <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
            <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">O prueba un ejemplo:</span>
            {examples.map(ex => (
                 <button key={ex} onClick={() => handleExample(ex)} className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                    {ex}
                 </button>
            ))}
        </div>
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 rounded-lg text-center">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-6">
          <Explanation result={result} />
        </div>
      )}
    </div>
  );
};

export default Balancer;
