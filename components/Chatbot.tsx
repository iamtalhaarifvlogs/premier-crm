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
      
      // Extract Items array from DynamoDB response
      const rawItems = data.Items || data || [];
      const loaded = rawItems.map((item: any) => ({
        id: item.lead_id || item.id || `lead-${Date.now()}`,
        name: item.name || 'Unknown',
        phone: item.phone || '',
        email: item.email || '',
        budget: Number(item.budget) || 0,
        preferredVehicle: item.preferredVehicle || 'Not specified',
        stage: item.stage || 'new_lead',
        statuses: Array.isArray(item.statuses) ? item.statuses : [],
        assignedRep: item.assignedRep || null,
        lastActivity: item.lastActivity || 'N/A',
        downPayment: Number(item.downPayment) || 0,
        location: item.location || '',
        creditStatus: item.creditStatus || 'good',
        timeline: item.timeline || '',
        createdAt: item.createdAt || '',
      }));

      setLeads(loaded);
      return loaded;
    } catch (err) {
      console.error("Maya fetch error:", err);
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

    if (lower.includes("all leads") || lower.includes("show leads") || lower.includes("list")) {
      if (freshLeads.length === 0) {
        addBotMessage("No leads found.");
        return;
      }

      const list = freshLeads
        .map(l => `• \( {l.name} ( \){l.stage}) — ${l.preferredVehicle} — \[ {l.budget}`)
        .join('\n');

      addBotMessage(`Here are all current leads:\n\n${list}`);
      return;
    }

    // Specific lead
    const lead = freshLeads.find(l => 
      l.name.toLowerCase().includes(lower)
    );

    if (lead) {
      const details = `
**${lead.name}**

**Stage:** ${lead.stage}
**Preferred Vehicle:** ${lead.preferredVehicle}
**Budget:** \]{lead.budget}
**Phone:** ${lead.phone}
**Email:** ${lead.email}
**Deposit:** ${lead.statuses.includes('deposit_paid') ? '✅ Paid' : 'Not yet'}
      `.trim();
      addBotMessage(details);
      return;
    }

    addBotMessage("Lead not found.\n\nTry 'Show all leads' or mention a name.");
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
        <div className="fixed bottom-20 right-4 md:right-6 w-[92%] md:w-[380px] h-[520px] bg-white shadow-2xl rounded-3xl flex flex-col z-50 overflow-hidden">
          <div className="bg-blue-600 text-white p-4 flex justify-between">
            <div>Maya • Live</div>
            <button onClick={() => setIsOpen(false)}><X size={24} /></button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto bg-gray-50 space-y-4">
            {messages.map(m => (
              <div key={m.id} className={`flex ${m.isBot ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[85%] px-4 py-3 rounded-2xl whitespace-pre-wrap ${m.isBot ? 'bg-white border' : 'bg-blue-600 text-white'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isTyping && <div className="pl-4 text-gray-400">Maya is typing...</div>}
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