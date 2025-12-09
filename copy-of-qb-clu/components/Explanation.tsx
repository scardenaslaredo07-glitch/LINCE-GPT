
import React, { useState, useCallback, useMemo } from 'react';
import { BalanceResult } from '../types';
import { synthesizeSpeech } from '../services/geminiService';
import { decode, decodeAudioData } from '../utils/audioUtils';
import { SpeakerIcon } from './icons/SpeakerIcon';

interface ExplanationProps {
  result: BalanceResult;
}

const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

const Explanation: React.FC<ExplanationProps> = ({ result }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const fullTextToRead = useMemo(() => {
    let text = "";

    // 1. Identification of Neutralization/Error
    if (result.neutralizationType === 'IMPOSSIBLE') {
      text += `Atención. Error crítico de sistema. Ecuación imposible. ${result.warningMessage || 'Contradicción por frio'}. `;
    } else if (result.neutralizationType === 'COLD') {
      text += `Atención. Protocolo de Neutralización por Frío activado. Flecha hacia abajo y asterisco. ${result.warningMessage || 'Exceso de Hidrógeno detectado'}. `;
    } else if (result.neutralizationType === 'HEAT') {
      text += `Atención. Protocolo de Neutralización por Calor activado. Flecha hacia arriba y triángulo. ${result.warningMessage || 'Exceso de Oxígeno detectado'}. `;
    }
    
    // 2. Explanation and Steps
    text += `Explicación del proceso: ${result.explanation}. Pasos realizados: ${result.steps.join('. ')}. `;
    
    // 3. Synthesis and Final Result (ALWAYS at the end)
    if (result.isSolvable || result.balancedEquation) {
       text += `Sintetizando resultados: ${result.synthesis}. Por lo tanto, el resultado final de la ecuación balanceada es: ${result.balancedEquation}.`;
    }

    return text;
  }, [result]);

  const handlePlayAudio = useCallback(async () => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    setAudioError(null);
    try {
      const base64Audio = await synthesizeSpeech(fullTextToRead);
      const decodedBytes = decode(base64Audio);
      const audioBuffer = await decodeAudioData(decodedBytes, audioContext, 24000, 1);

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.onended = () => setIsSpeaking(false);
      source.start();
    } catch (err: any) {
      setAudioError(err.message || "Error al reproducir el audio.");
      setIsSpeaking(false);
    }
  }, [fullTextToRead, isSpeaking]);

  const handleCopy = useCallback(async () => {
    if (!result.balancedEquation) return;
    try {
      await navigator.clipboard.writeText(result.balancedEquation);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  }, [result.balancedEquation]);

  // Determine styles based on type
  let containerClass = "bg-gradient-to-br from-red-800 via-red-900 to-black border-red-900 text-gray-100";
  let titleClass = "text-blue-400";
  let titleText = "Resultado del Balanceo";
  let alertIcon = null;
  let alertTitle = "";

  switch (result.neutralizationType) {
    case 'IMPOSSIBLE':
      containerClass = "bg-gray-900 border-gray-600 text-gray-300";
      titleClass = "text-red-500";
      titleText = "ERROR: CONTRADICCIÓN";
      alertTitle = "Neutralización por Contradicción";
      break;
    case 'COLD':
      containerClass = "bg-gradient-to-br from-cyan-900 via-blue-900 to-black border-cyan-500 text-cyan-100";
      titleClass = "text-cyan-300";
      titleText = "NEUTRALIZACIÓN POR FRÍO";
      alertTitle = "Exceso de Hidrógeno (≥14)";
      alertIcon = (
        <span className="text-3xl font-bold mx-2 animate-pulse flex items-center gap-1">
          &darr; <span>*</span>
        </span>
      );
      break;
    case 'HEAT':
      containerClass = "bg-gradient-to-br from-orange-900 via-red-900 to-black border-orange-500 text-orange-100";
      titleClass = "text-orange-300";
      titleText = "NEUTRALIZACIÓN POR CALOR";
      alertTitle = "Exceso de Oxígeno (≥16)";
      alertIcon = (
        <span className="text-3xl font-bold mx-2 animate-pulse flex items-center gap-1">
          &uarr; <span>&#9651;</span>
        </span>
      );
      break;
  }

  return (
    <div className={`p-6 md:p-8 rounded-xl shadow-lg border transition-all duration-500 ${containerClass}`}>

      <div className="flex justify-between items-start mb-4">
        <h3 className={`text-lg font-bold ${titleClass} flex items-center uppercase tracking-wider`}>
          {titleText}
        </h3>
        <button
          onClick={handlePlayAudio}
          disabled={isSpeaking}
          className="flex items-center px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Leer reporte en voz alta"
        >
          <SpeakerIcon className={`h-5 w-5 mr-2 ${isSpeaking ? 'animate-pulse' : ''}`} />
          {isSpeaking ? 'Procesando...' : 'Informe de voz'}
        </button>
      </div>

       {audioError && <p className="text-red-500 text-sm mb-4">{audioError}</p>}

      <div className="space-y-6">
        {/* Warning/Error Banner */}
        {result.neutralizationType !== 'NONE' && (
             <div className={`p-4 rounded-lg border-l-4 bg-black/40 flex items-center justify-between
                ${result.neutralizationType === 'COLD' ? 'border-cyan-400' : 
                  result.neutralizationType === 'HEAT' ? 'border-orange-500' : 'border-gray-500'}`}>
                <div className="flex-1">
                    <p className="font-bold flex items-center gap-2 text-lg">
                        {result.neutralizationType === 'IMPOSSIBLE' && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        )}
                        {alertTitle}
                    </p>
                    <p className="mt-1 opacity-90 text-sm md:text-base">{result.warningMessage}</p>
                </div>
                {alertIcon && (
                    <div className="ml-4 p-2 bg-white/10 rounded-lg border border-white/20">
                        {alertIcon}
                    </div>
                )}
             </div>
        )}

        <div>
          <h4 className="font-semibold opacity-70">Ecuación Original:</h4>
          <p className="p-3 bg-black/20 rounded-md font-mono text-center text-lg">{result.unbalancedEquation}</p>
        </div>

        {/* Show result if balanced equation exists (even if technically unsolvable, AI might provide a best effort) */}
        {result.balancedEquation && (
        <>
            <div>
            <h4 className="font-semibold opacity-70">Ecuación {result.isSolvable ? 'Balanceada' : 'Aproximada/Detectada'}:</h4>
            <div className="relative mt-1 group">
                <div className={`p-3 pr-12 rounded-md font-mono text-center text-xl font-bold bg-black/30 border border-white/10 break-all`}>
                    {result.balancedEquation}
                </div>
                <button
                    onClick={handleCopy}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-white bg-white/5 hover:bg-white/20 rounded-md transition-all focus:outline-none focus:ring-1 focus:ring-white/50"
                    title={isCopied ? "¡Copiado!" : "Copiar ecuación"}
                >
                    {isCopied ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    )}
                </button>
            </div>
            </div>
            <div>
            <h4 className="font-semibold opacity-70">Síntesis:</h4>
            <p className="p-3 bg-white/10 rounded-md text-center italic">{result.synthesis}</p>
            </div>
            <div>
            <h4 className="font-semibold opacity-70">Explicación:</h4>
            <p className="leading-relaxed opacity-90">{result.explanation}</p>
            </div>
            <div>
            <h4 className="font-semibold opacity-70">Pasos Detallados:</h4>
            <ul className="list-decimal list-inside space-y-3 mt-2 pl-2">
                {result.steps.map((step, index) => (
                <li key={index} className="leading-relaxed bg-black/20 p-3 rounded-md">
                    {step.replace(/^paso \d+: /i, '')}
                </li>
                ))}
            </ul>
            </div>
        </>
        )}
      </div>
    </div>
  );
};

export default Explanation;
