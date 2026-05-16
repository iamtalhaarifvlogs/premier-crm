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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchLeads = async () => {
    try {
      const res = await fetch('/api/leads', { cache: 'no-store' });
      const data = await res.json();
      const loaded = Array.isArray(data) ? data : [];
      setLeads(loaded);
      return loaded;
    } catch {
      return [];
    }
  };

  useEffect(() => {
    if (isOpen) fetchLeads();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: '1',
        text: "Hi! I'm Maya.\n\nTry:\n• Show all leads\n• Tell me about Talha",
        isBot: true,
        timestamp: new Date()
      }]);
    }
  }, [isOpen]);

  const addMessage = (text: string, isBot: boolean) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      text,
      isBot,
      timestamp: new Date()
    }]);
    setTimeout(scrollToBottom, 100);
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    const userText = inputValue.trim();
    addMessage(userText, false);
    setInputValue('');
    setIsTyping(true);

    setTimeout(async () => {
      const freshLeads = await fetchLeads();

      const lower = userText.toLowerCase();

      if (lower.includes("all leads") || lower.includes("show leads")) {
        if (freshLeads.length === 0) {
          addMessage("No leads found.", true);
        } else {
          const list = freshLeads.map(l => 
            `• \( {l.name || 'Unknown'} ( \){l.stage}) — ${l.preferredVehicle || 'N/A'} — \[ {l.budget || 0}`
          ).join('\n');
          addMessage(`Here are all current leads:\n\n${list}`, true);
        }
      } else {
        // Specific lead
        const lead = freshLeads.find(l => 
          l.name?.toLowerCase().includes(userText.toLowerCase())
        );
        if (lead) {
          addMessage(`
**${lead.name}**

Stage: ${lead.stage}
Vehicle: ${lead.preferredVehicle || 'Not specified'}
Budget: \]{lead.budget}
Phone: ${lead.phone || '—'}
Email: ${lead.email || '—'}
          `.trim(), true);
        } else {
          addMessage("Lead not found. Try 'Show all leads'", true);
        }
      }
      setIsTyping(false);
    }, 600);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center z-50 hover:scale-110"
      >
        <Bot size={28} />
      </button>

      {isOpen && (
        <div className="fixed bottom-20 right-4 md:right-6 w-[92%] md:w-[380px] h-[520px] bg-white rounded-3xl shadow-2xl flex flex-col z-50 overflow-hidden">
          <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
            <div>Maya • Live</div>
            <button onClick={() => setIsOpen(false)}><X size={24} /></button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto bg-gray-50 space-y-3">
            {messages.map(m => (
              <div key={m.id} className={`flex ${m.isBot ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[85%] px-4 py-3 rounded-2xl whitespace-pre-wrap ${m.isBot ? 'bg-white border' : 'bg-blue-600 text-white'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isTyping && <div className="text-gray-400 pl-4">Maya is typing...</div>}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t">
            <div className="flex gap-2">
              <input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Talk to Maya naturally..."
                className="flex-1 px-4 py-3 bg-gray-100 rounded-full focus:outline-none"
              />
              <button onClick={handleSend} className="bg-blue-600 text-white px-6 rounded-full">
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}