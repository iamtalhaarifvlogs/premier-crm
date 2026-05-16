'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Bot } from 'lucide-react';
import { Lead, createWorkflowLog } from '@/lib/mock-data';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  // Load real leads every time chatbot opens
  useEffect(() => {
    if (isOpen) {
      fetch('/api/leads')
        .then(res => res.json())
        .then(data => {
          const loaded = Array.isArray(data) ? data : [];
          setLeads(loaded);
          console.log("Maya loaded", loaded.length, "leads");
        })
        .catch(() => setLeads([]));
    }
  }, [isOpen]);

  // Welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        text: "Hi! I'm Maya.\n\nTry these:\n• Show all leads\n• Show Talha\n• Add new lead Talha, phone 03001234567, budget 45000, Honda Civic",
        isBot: true,
        timestamp: new Date()
      }]);
    }
  }, [isOpen]);

  const addBotMessage = (text: string) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      text,
      isBot: true,
      timestamp: new Date()
    }]);
    scrollToBottom();
  };

  const findLeadByName = (name: string): Lead | undefined => {
    const lower = name.toLowerCase();
    return leads.find(l => l.name.toLowerCase().includes(lower));
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userText = inputValue.trim();
    const userMsg: Message = {
      id: Date.now().toString(),
      text: userText,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    setTimeout(async () => {
      await processUserMessage(userText);
      setIsTyping(false);
    }, 700);
  };

  const processUserMessage = async (text: string) => {
    const lower = text.toLowerCase();

    // Show all leads
    if (lower.includes("all leads") || lower.includes("show leads") || lower.includes("list leads")) {
      if (leads.length === 0) {
        addBotMessage("No leads found yet.");
        return;
      }
      const list = leads.map(l => 
        `• \( {l.name} ( \){l.stage}) - ${l.preferredVehicle || 'N/A'} - \[ {l.budget}`
      ).join('\n');
      addBotMessage(`Here are all current leads:\n\n${list}`);
      return;
    }

    // Show specific lead
    const lead = findLeadByName(text);
    if (lead) {
      const details = `
**${lead.name}**
Stage: ${lead.stage}
Budget: \]{lead.budget}
Vehicle: ${lead.preferredVehicle || 'Not specified'}
Phone: ${lead.phone}
Email: ${lead.email}
Status: ${lead.statuses.join(', ') || 'None'}
      `.trim();
      addBotMessage(details);
      return;
    }

    // Add new lead (basic)
    if (lower.includes("add lead") || lower.includes("new lead") || lower.includes("create lead")) {
      addBotMessage("For now, please use the 'Add New Lead' button on the dashboard. I'm still learning full conversation mode.");
      return;
    }

    addBotMessage("Try these:\n• Show all leads\n• Show Talha\n• Add new lead (use dashboard for now)");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-full flex items-center justify-center shadow-2xl z-[100] hover:scale-110 transition-all active:scale-95"
      >
        <Bot size={28} />
      </button>

      {isOpen && (
        <div className="fixed bottom-20 right-4 md:right-6 w-[92%] md:w-[380px] h-[480px] bg-white shadow-2xl rounded-3xl flex flex-col overflow-hidden z-[110]">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex items-center justify-between rounded-t-3xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-2xl flex items-center justify-center text-2xl">👋</div>
              <div>
                <p className="font-semibold">Maya</p>
                <p className="text-xs opacity-90">AI Assistant • Online</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/20 rounded-2xl">
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[85%] px-5 py-3.5 rounded-3xl text-[15px] leading-relaxed ${
                  msg.isBot ? 'bg-white border shadow-sm rounded-tl-none' : 'bg-blue-600 text-white rounded-tr-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white px-5 py-3 rounded-3xl rounded-tl-none flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Talk to Maya naturally..."
                className="flex-1 px-5 py-3 bg-gray-100 rounded-3xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className="w-12 h-12 bg-blue-600 disabled:bg-gray-400 text-white rounded-3xl flex items-center justify-center hover:bg-blue-700"
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