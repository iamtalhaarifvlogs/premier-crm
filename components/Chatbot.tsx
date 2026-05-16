'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Bot } from 'lucide-react';
import { Lead } from '@/lib/mock-data';

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

  const fetchLeads = async () => {
    try {
      const res = await fetch('/api/leads', { cache: 'no-store' });
      const data = await res.json();
      const loaded = Array.isArray(data) ? data : [];
      setLeads(loaded);
      console.log("Maya fetched leads:", loaded); // Check browser console
      return loaded;
    } catch (err) {
      console.error("Fetch error:", err);
      return [];
    }
  };

  useEffect(() => {
    if (isOpen) fetchLeads();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        text: "Hi! I'm Maya.\n\nTry:\n• Show all leads\n• Tell me about Talha\n• Show Sarah",
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
    const lower = name.toLowerCase().trim();
    return leads.find(l => l.name?.toLowerCase().includes(lower));
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userText = inputValue.trim();
    setMessages(prev => [...prev, { id: Date.now().toString(), text: userText, isBot: false, timestamp: new Date() }]);
    setInputValue('');
    setIsTyping(true);

    setTimeout(async () => {
      await processUserMessage(userText);
      setIsTyping(false);
    }, 700);
  };

  const processUserMessage = async (text: string) => {
    const lower = text.toLowerCase();
    const freshLeads = await fetchLeads();

    if (lower.includes("all leads") || lower.includes("show leads") || lower.includes("list leads")) {
      if (freshLeads.length === 0) {
        addBotMessage("No leads found.");
        return;
      }

      const list = freshLeads.map(l => 
        `• \( {l.name || 'Unknown'} ( \){l.stage || 'new_lead'}) — ${l.preferredVehicle || 'N/A'} — \[ {l.budget || 0}`
      ).join('\n');

      addBotMessage(`Here are all current leads:\n\n${list}`);
      return;
    }

    const lead = findLeadByName(text);
    if (lead) {
      const details = `
**${lead.name}**

Stage: ${lead.stage}
Vehicle: ${lead.preferredVehicle || 'Not specified'}
Budget: \]{lead.budget}
Phone: ${lead.phone || '—'}
Email: ${lead.email || '—'}
      `.trim();
      addBotMessage(details);
      return;
    }

    addBotMessage("Try:\n• Show all leads\n• Tell me about [Name]");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-xl z-50 hover:scale-110">
        <Bot size={28} />
      </button>

      {isOpen && (
        <div className="fixed bottom-20 right-6 w-[380px] h-[520px] bg-white shadow-2xl rounded-3xl flex flex-col z-50 overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 flex justify-between">
            <div className="font-semibold">Maya • Live</div>
            <button onClick={() => setIsOpen(false)}><X size={22} /></button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.isBot ? '' : 'justify-end'}`}>
                <div className={`max-w-[85%] px-4 py-3 rounded-2xl ${msg.isBot ? 'bg-white border' : 'bg-blue-600 text-white'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isTyping && <div className="text-gray-400">Maya is typing...</div>}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Talk to Maya..."
                className="flex-1 px-4 py-3 bg-gray-100 rounded-full focus:outline-none"
              />
              <button onClick={handleSend} className="bg-blue-600 text-white px-5 rounded-full">
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}