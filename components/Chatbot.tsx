'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, X, MessageCircle } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

const knowledgeBase = [
  { keywords: ['hello', 'hi', 'hey'], response: "Hello! I'm Maya, your AI assistant for Premier Auto Plus CRM. How can I help you today?" },
  { keywords: ['lead', 'leads'], response: "I can pull lead details. Try saying 'show lead Sarah Johnson' or ask for total leads." },
  { keywords: ['pipeline', 'stage'], response: "Pipeline Stages: New Lead → Maya Qualification → Vehicle Sourcing → Alternatives Presented → Deposit Requested → Deposits Paid → Rep Handoff." },
  { keywords: ['total leads', 'how many'], response: "There are currently 10 leads in the system." },
  { keywords: ['help'], response: "I can help with leads, pipeline status, vehicle information, and general CRM questions." },
  // Add more entries as needed
];

const getBotResponse = (message: string): string => {
  const lowerMsg = message.toLowerCase().trim();
  
  for (const entry of knowledgeBase) {
    if (entry.keywords.some(kw => lowerMsg.includes(kw))) {
      return entry.response;
    }
  }
  
  return "I'm here to help! Try asking about leads, pipeline stages, or specific customers.";
};

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: "Hi! I'm Maya 👋 How can I assist you with Premier Auto Plus CRM today?",
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: inputValue.trim(),
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    const currentText = inputValue.trim();
    setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      const botReply = getBotResponse(currentText);
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: botReply,
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 700);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <>
      {/* Floating Bubble */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-2xl z-[100] transition-all active:scale-95"
      >
        <MessageCircle size={28} />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed inset-0 md:inset-auto md:bottom-24 md:right-6 md:w-[380px] md:h-[520px] 
                        bg-white dark:bg-gray-900 z-[110] flex flex-col 
                        shadow-2xl md:rounded-2xl overflow-hidden">
          
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-2xl">
                👋
              </div>
              <div>
                <p className="font-semibold text-lg">Maya</p>
                <p className="text-xs text-blue-100">Premier Auto Plus Assistant • Online</p>
              </div>
            </div>
            
            <button 
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-blue-700 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-950" id="chat-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[82%] px-4 py-3 rounded-3xl text-[15px] leading-relaxed
                  ${msg.isBot 
                    ? 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-tl-none' 
                    : 'bg-blue-600 text-white rounded-tr-none'}`}
                >
                  {msg.text}
                  <div className="text-[10px] mt-1 opacity-75 text-right">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-gray-800 px-4 py-3 rounded-3xl rounded-tl-none">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-300" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t bg-white dark:bg-gray-900">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about leads, pipeline..."
                className="flex-1 px-5 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:border-blue-500 text-gray-900 dark:text-gray-100 placeholder:text-gray-500"
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className="w-12 h-12 bg-blue-600 disabled:bg-gray-400 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
              >
                <Send size={22} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}