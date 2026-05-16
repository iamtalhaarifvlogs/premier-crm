'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Bot, RefreshCw } from 'lucide-react';
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
  const [isRefreshing, setIsRefreshing] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  // Fresh fetch of leads
  const fetchLeads = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/leads', { cache: 'no-store' });
      const data = await res.json();
      const loaded = Array.isArray(data) ? data : [];
      setLeads(loaded);
      return loaded;
    } catch (err) {
      console.error("Maya fetch error:", err);
      return [];
    } finally {
      setIsRefreshing(false);
    }
  };

  // Load leads when opening
  useEffect(() => {
    if (isOpen) {
      fetchLeads();
    }
  }, [isOpen]);

  // Welcome
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        text: "Hi! I'm Maya.\n\nTalk naturally:\n• Show all leads\n• Tell me about Talha\n• Show Sarah\n• Details on Ryan",
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

  const findLeadByName = (name: string, currentLeads: Lead[]): Lead | undefined => {
    const lower = name.toLowerCase().trim();
    return currentLeads.find(l => 
      l.name.toLowerCase().includes(lower) || 
      lower.includes(l.name.toLowerCase())
    );
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userText = inputValue.trim();
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      text: userText,
      isBot: false,
      timestamp: new Date()
    }]);
    setInputValue('');
    setIsTyping(true);

    setTimeout(async () => {
      await processUserMessage(userText);
      setIsTyping(false);
    }, 600);
  };

  const processUserMessage = async (text: string) => {
    const lower = text.toLowerCase();

    // Always fetch fresh data for reliability
    const freshLeads = await fetchLeads();

    // Show all leads
    if (lower.includes("all leads") || lower.includes("show leads") || lower.includes("list leads")) {
      if (freshLeads.length === 0) {
        addBotMessage("No leads found in the database yet.");
        return;
      }
      const list = freshLeads
        .map(l => `• \( {l.name} ( \){l.stage}) — ${l.preferredVehicle || 'N/A'} — \[ {l.budget}`)
        .join('\n');
      addBotMessage(`Here are all current leads:\n\n${list}`);
      return;
    }

    // Show specific lead
    const lead = findLeadByName(text, freshLeads);
    if (lead) {
      const hasDeposit = lead.statuses.includes("deposit_paid");
      const depositText = hasDeposit 
        ? "✅ Deposit Paid" 
        : lead.stage === "deposit_requested" 
          ? "⏳ Deposit Requested" 
          : "No deposit information";

      const details = `
**${lead.name}**

**Stage:** ${lead.stage}
**Preferred Vehicle:** ${lead.preferredVehicle || 'Not specified'}
**Budget:** \]{lead.budget.toLocaleString()}
**Phone:** ${lead.phone}
**Email:** ${lead.email}
**Deposit:** ${depositText}
**Last Activity:** ${lead.lastActivity}
      `.trim();

      addBotMessage(details);
      return;
    }

    // Fallback
    addBotMessage("I couldn't find that lead.\n\nTry:\n• Show all leads\n• Tell me about [Name]");
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
                <p className="text-xs opacity-90">Live • Real-time Data</p>
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
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-300"></div>
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
                disabled={!inputValue.trim() || isTyping}
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