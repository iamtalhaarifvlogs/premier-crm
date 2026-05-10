'use client';


import React, { useState, useRef, useEffect } from 'react';
import { Send, X, MessageCircle } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

interface KnowledgeItem {
  keywords: string[];
  response: string;
}

interface KnowledgeBase {
  name: string;
  welcomeMessage: string;
  fallbackResponse: string;
  knowledge: KnowledgeItem[];
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [knowledge, setKnowledge] = useState<KnowledgeBase | null>(null);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load knowledge.json with maximum cache busting
  useEffect(() => {
    const loadKnowledge = async () => {
      const timestamp = new Date().getTime();
      
      try {
        const res = await fetch(`/knowledge.json?t=${timestamp}`, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
          cache: 'no-store'
        });

        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);

        const data: KnowledgeBase = await res.json();

        setKnowledge(data);
        setStatus("success");

        setMessages([{
          id: 'welcome',
          text: data.welcomeMessage,
          isBot: true,
          timestamp: new Date()
        }]);
      } catch (error) {
        console.error("Fetch failed:", error);
        setStatus("error");
        setMessages([{
          id: 'welcome',
          text: "Hi! I'm Maya. Could not load knowledge.json. Try redeploying on Vercel.",
          isBot: true,
          timestamp: new Date()
        }]);
      }
    };

    loadKnowledge();
  }, []);

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const getBotResponse = (userMessage: string): string => {
    if (status !== "success" || !knowledge) {
      return "Knowledge base is still loading. Please wait...";
    }

    const lowerMsg = userMessage.toLowerCase().trim();

    for (const item of knowledge.knowledge) {
      if (item.keywords.some(keyword => lowerMsg.includes(keyword.toLowerCase()))) {
        return item.response;
      }
    }
    return knowledge.fallbackResponse;
  };

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
    }, 650);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-2xl z-[100]"
      >
        <MessageCircle size={28} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 md:inset-auto md:bottom-24 md:right-6 md:w-[380px] md:h-[520px] bg-white dark:bg-gray-900 z-[110] flex flex-col shadow-2xl md:rounded-2xl overflow-hidden">
          
          <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-2xl">👋</div>
              <div>
                <p className="font-semibold text-lg">Maya</p>
                <p className="text-xs text-blue-100">Premier Auto Plus Assistant</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-blue-700 rounded-full">
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[82%] px-4 py-3 rounded-3xl text-[15px] leading-relaxed
                  ${msg.isBot ? 'bg-white border text-gray-900 rounded-tl-none' : 'bg-blue-600 text-white rounded-tr-none'}`}>
                  {msg.text}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white px-4 py-3 rounded-3xl rounded-tl-none">Maya is typing...</div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about leads or pipeline..."
                className="flex-1 px-5 py-3.5 bg-gray-100 border rounded-full focus:outline-none"
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center disabled:bg-gray-400"
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