import React, { useState, useEffect, useRef, FormEvent, useCallback } from 'react';
import { Chat } from '@google/genai';
import { createChatSession } from '../services/geminiService';
import { ChatMessage } from '../types';
import { ChatIcon } from './icons/ChatIcon';
import { CloseIcon } from './icons/CloseIcon';
import { SendIcon } from './icons/SendIcon';

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !chatRef.current) {
      chatRef.current = createChatSession();
      setMessages([
        {
          role: 'model',
          content:
            '¡Saludos! Usuario, estoy a su servicio para serle de ayuda, ¿necesita algo?',
        },
      ]);
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!input.trim() || isLoading) return;

      const userMessage: ChatMessage = { role: 'user', content: input };
      setMessages((prev) => [...prev, userMessage]);
      setInput('');
      setIsLoading(true);

      // Placeholder para respuesta del modelo
      setMessages((prev) => [...prev, { role: 'model', content: '' }]);

      try {
        if (chatRef.current) {
          const stream = await chatRef.current.sendMessageStream({ message: input });

          for await (const chunk of stream) {
            const chunkText = chunk.text;
            setMessages((prev) => {
              const newMessages = [...prev];
              newMessages[newMessages.length - 1].content += chunkText;
              return newMessages;
            });
          }
        }
      } catch (error) {
        console.error(error);
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].content =
            'Lo siento, ha ocurrido un error. Por favor, intenta de nuevo.';
          return newMessages;
        });
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading]
  );

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-red-700 text-white p-4 rounded-full shadow-lg hover:bg-red-600 transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        aria-label="Toggle Chat"
      >
        {isOpen ? <CloseIcon className="h-6 w-6" /> : <ChatIcon className="h-6 w-6" />}
      </button>

      {/* Ventana del chat */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 w-full max-w-sm h-[70vh] max-h-[600px] rounded-2xl shadow-2xl border border-red-800 overflow-hidden animate-fade-in-up">
          {/* Fondo con degradado + brillo rojo inferior */}
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black/80 to-red-900"></div>
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-red-600/40 blur-3xl"></div>

          {/* Contenido */}
          <div className="relative z-10 flex flex-col h-full text-gray-100">
            {/* Header */}
            <header className="px-4 py-3 border-b border-red-800 bg-black/70 text-center font-semibold text-red-400">
               T-800 
            </header>

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs md:max-w-sm px-4 py-2 rounded-2xl ${
                      msg.role === 'user'
                        ? 'bg-red-700 text-white rounded-br-none'
                        : 'bg-black/60 border border-red-800 text-red-100 rounded-bl-none'
                    }`}
                  >
                    <p className="text-sm break-words">
                      {msg.content}
                      {isLoading && msg.role === 'model' && index === messages.length - 1 && (
                        <span className="inline-block w-2 h-2 ml-1 bg-red-400 rounded-full animate-pulse"></span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={handleSubmit}
              className="p-3 border-t border-red-800 bg-black/80 flex items-center"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Haz una pregunta..."
                className="flex-grow bg-black/60 text-red-100 placeholder-gray-400 border border-red-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:outline-none transition-all duration-200"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="ml-3 p-2.5 bg-red-700 text-white rounded-full hover:bg-red-600 disabled:bg-red-400 transition-colors"
              >
                <SendIcon className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;

