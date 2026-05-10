// components/Chatbot.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, X, MessageCircle } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

interface KnowledgeEntry {
  keywords: string[];
  response: string;
}

const knowledgeBase: KnowledgeEntry[] = [
  {
    keywords: ['hello', 'hi', 'hey', 'greetings'],
    response: "Hello! I'm Maya, your AI assistant for Premier Auto Plus CRM. How can I help you today with leads, pipeline, or vehicle sales?"
  },
  {
    keywords: ['lead', 'leads'],
    response: "I can help you with leads. Try commands like 'show lead Sarah Johnson' or ask about total leads (currently 10 in the demo)."
  },
  {
    keywords: ['pipeline', 'stage', 'stages'],
    response: "Our sales pipeline stages: New Lead → Maya Qualification → Vehicle Sourcing → Alternatives Presented → Deposit Requested → Deposits Paid → Rep Handoff."
  },
  {
    keywords: ['maya qualification'],
    response: "Maya Qualification is an early pipeline stage where we assess buyer intent, budget, and preferred American-made vehicles for international clients."
  },
  {
    keywords: ['total leads', 'how many leads'],
    response: "There are currently 10 total leads in the system."
  },
  {
    keywords: ['hot leads'],
    response: "There are 4 hot leads right now."
  },
  {
    keywords: ['deposit'],
    response: "Deposits Pending: 1 | Deposits Paid: 3"
  },
  {
    keywords: ['american', 'vehicles', 'cars', 'models'],
    response: "Premier Auto Plus specializes in American-made vehicles (Ford, Chevrolet, Dodge, GMC, etc.) for international buyers. Popular models include trucks, SUVs, and muscle cars."
  },
  {
    keywords: ['help', 'what can you do'],
    response: "I can: Pull lead details, explain pipeline stages, answer sales process questions, provide stats from the dashboard, and assist with general CRM navigation."
  },
  {
    keywords: ['sarah johnson'],
    response: "Sarah Johnson - New Lead - $25,000 - 2h ago. Status: New inquiry for American pickup truck."
  },
  {
    keywords: ['michael chen'],
    response: "Michael Chen - Maya Qualification - $18,000 - 4h ago."
  },
  {
    keywords: ['emily rodriguez'],
    response: "Emily Rodriguez - Vehicle Sourcing - $35,000 - 1d ago."
  },
  // Add more specific lead entries as needed
];

const getBotResponse = (userMessage: string): string => {
  const lowerMsg = userMessage.toLowerCase().trim();
  
  // Simple keyword matching with fallback
  for (const entry of knowledgeBase) {
    if (entry.keywords.some(keyword => lowerMsg.includes(keyword))) {
      return entry.response;
    }
  }

  // More specific or general fallbacks
  if (lowerMsg.includes('show') && lowerMsg.includes('lead')) {
    return "Lead lookup coming soon! In full integration, I would fetch real-time data. For demo: Sarah Johnson is in New Lead stage.";
  }

  if (lowerMsg.includes('how are you') || lowerMsg.includes('status')) {
    return "I'm running smoothly and ready to help close more deals at Premier Auto Plus!";
  }

  return "I'm not sure about that yet. Try asking about leads, pipeline stages, dashboard stats, or specific customers like 'Sarah Johnson'. I can also explain our process for selling American vehicles internationally.";
};

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm Maya, your Premier Auto Plus CRM assistant. Ask me anything about leads, pipeline, or vehicle sales!",
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue.trim(),
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue.trim();
    setInputValue('');
    
    // Simulate typing
    setIsTyping(true);

    setTimeout(() => {
      const botResponseText = getBotResponse(currentInput);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponseText,
        isBot: true,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 800); // Realistic response delay
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Bubble Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-xl z-50 transition-all duration-200"
        aria-label="Open Maya Chatbot"
      >
        {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-full max-w-[380px] md:w-[380px] h-[520px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
                👋
              </div>
              <div>
                <div className="font-semibold">Maya</div>
                <div className="text-xs text-blue-100">Premier Auto Plus Assistant • Online</div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
              <X size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50 dark:bg-gray-950 space-y-4" id="chat-messages">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.isBot 
                      ? 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100' 
                      : 'bg-blue-600 text-white'
                  }`}
                >
                  {msg.text}
                  <div className="text-[10px] mt-1 opacity-70 text-right">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-3 rounded-2xl">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about leads, pipeline..."
                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full text-sm focus:outline-none focus:border-blue-500 text-gray-900 dark:text-gray-100 placeholder:text-gray-500"
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className="w-11 h-11 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-full flex items-center justify-center transition-colors"
              >
                <Send size={20} />
              </button>
            </div>
            <p className="text-center text-[10px] text-gray-500 mt-2">Maya can help with CRM tasks • Demo Mode</p>
          </div>
        </div>
      )}
    </>
  );
}