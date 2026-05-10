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
  welcomeMessage: string;
  fallbackResponse: string;
  knowledge: KnowledgeItem[];
}

// Built-in knowledge (mirrors your knowledge.json)
const embeddedKnowledge: KnowledgeBase = {
  welcomeMessage: "Hi! I'm Maya 👋 Your dedicated AI assistant for Premier Auto Plus CRM. How can I help you today with leads, pipeline, or admin tasks?",
  fallbackResponse: "I couldn't find a direct match. Try being more specific (e.g., 'Sarah Johnson details', 'hot leads', 'pipeline stages', or 'total leads').",
  knowledge: [
    { keywords: ["hello", "hi", "hey", "greetings"], response: "Hello! I'm Maya, your AI assistant for Premier Auto Plus CRM. How can I help you today?" },
    { keywords: ["total leads", "how many leads"], response: "There are currently 10 Total Leads in the CRM." },
    { keywords: ["hot leads"], response: "There are 4 Hot Leads right now." },
    { keywords: ["deposits pending"], response: "1 Deposit is Pending." },
    { keywords: ["deposits paid"], response: "3 Deposits have been Paid." },
    { keywords: ["pipeline", "stages"], response: "Pipeline Stages: New Lead → Maya Qualification → Vehicle Sourcing → Alternatives Presented → Deposit Requested → Deposits Paid → Rep Handoff." },
    { keywords: ["sarah johnson", "sarah"], response: "Sarah Johnson → Stage: New Lead → Value: $25,000 → Last activity: 2h ago. Interested in American pickup truck." },
    { keywords: ["michael chen"], response: "Michael Chen → Stage: Maya Qualification → Value: $18,000 → Interested in SUVs." },
    { keywords: ["emily rodriguez"], response: "Emily Rodriguez → Stage: Vehicle Sourcing → Value: $35,000 → Last activity: 1d ago." },
    { keywords: ["james wilson"], response: "James Wilson → Stage: Alternatives Presented → Value: $22,000." },
    { keywords: ["amanda lee"], response: "Amanda Lee → Stage: Deposit Requested → Value: $28,000." },
    { keywords: ["help", "what can you do"], response: "I can provide lead details, pipeline status, current stats, and answer admin questions about the CRM." },
    // Add more from your JSON as needed
  ]
};

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMessages([{
      id: 'welcome',
      text: embeddedKnowledge.welcomeMessage,
      isBot: true,
      timestamp: new Date()
    }]);
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
    const lowerMsg = userMessage.toLowerCase().trim();

    for (const item of embeddedKnowledge.knowledge) {
      if (item.keywords.some(keyword => lowerMsg.includes(keyword.toLowerCase()))) {
        return item.response;
      }
    }
    return embeddedKnowledge.fallbackResponse;
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
                placeholder="Ask about Sarah Johnson, pipeline..."
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