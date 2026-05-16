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

  // Load real leads
  useEffect(() => {
    fetch('/api/leads')
      .then(res => res.json())
      .then(data => setLeads(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        text: "Hi! I'm Maya. Try these:\n• Show all leads\n• Add new lead John Smith, phone 03001234567, budget 45000, Honda Civic",
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

  // Improved smart parser
  const parseLeadCreation = (text: string): Partial<Lead> => {
    const data: Partial<Lead> = {};

    // Name
    const nameMatch = text.match(/([A-Z][a-z]+(?:\s[A-Z][a-z]+)+)/);
    if (nameMatch) data.name = nameMatch[0];

    // Phone
    const phoneMatch = text.match(/(\+?\d{1,3}[-.\s]?)?(\d{3}[-.\s]?\d{3}[-.\s]?\d{4}|\d{10,})/);
    if (phoneMatch) data.phone = phoneMatch[0];

    // Email
    const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
    if (emailMatch) data.email = emailMatch[0];

    // Budget
    const budgetMatch = text.match(/budget[:\s]*\$?(\d{1,3}(?:,\d{3})*|\d+)/i);
    if (budgetMatch) data.budget = parseInt(budgetMatch[1].replace(/,/g, ''));

    // Vehicle - Improved matching
    const vehicleMatch = text.match(/(?:wants?|for|vehicle|car|model|buy)[:\s]*([A-Za-z0-9\s]+)/i);
    if (vehicleMatch) data.preferredVehicle = vehicleMatch[1].trim();

    // Fallback vehicle detection
    if (!data.preferredVehicle) {
      const commonVehicles = ['honda', 'toyota', 'civic', 'accord', 'camry', 'corolla', 'fortuner', 'hilux'];
      for (const v of commonVehicles) {
        if (text.toLowerCase().includes(v)) {
          data.preferredVehicle = text.split(' ').find(word => word.toLowerCase().includes(v)) || v;
          break;
        }
      }
    }

    return data;
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
      const list = leads.map(l => `• \( {l.name} ( \){l.stage}) - ${l.preferredVehicle} - \[ {l.budget}`).join('\n');
      addBotMessage(`Here are all current leads:\n\n${list}`);
      return;
    }

    // Smart lead creation
    if (lower.includes("add lead") || lower.includes("new lead") || lower.includes("create lead")) {
      const parsed = parseLeadCreation(text);

      if (Object.keys(parsed).length >= 2) {
        const newLead: Lead = {
          id: `lead-${Date.now()}`,
          name: parsed.name || "Unknown Customer",
          phone: parsed.phone || "",
          email: parsed.email || "",
          budget: parsed.budget || 25000,
          preferredVehicle: parsed.preferredVehicle || "Not specified",
          stage: "new_lead",
          statuses: [],
          assignedRep: null,
          lastActivity: "Just now",
          downPayment: 0,
          location: "Unknown",
          creditStatus: "good",
          timeline: "Within 2 weeks",
          createdAt: new Date().toISOString(),
        };

        setLeads(prev => [newLead, ...prev]);

        try {
          await fetch('/api/leads', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              TableName: "tbl_leads",
              Item: { ...newLead, lead_id: newLead.id }
            }),
          });
        } catch (e) {}

        await createWorkflowLog(newLead.id, "Lead Created", `Maya created: ${newLead.name}`, "success");

        addBotMessage(`✅ Lead created successfully!\n\n**${newLead.name}**\nVehicle: ${newLead.preferredVehicle}\nBudget: \]{newLead.budget}`);
        return;
      }
    }

    addBotMessage("Try these examples:\n• Show all leads\n• Add new lead Talha, phone 03001234567, budget 45000, Honda Civic");
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
        <div className="fixed bottom-24 right-6 w-[380px] h-[520px] bg-white shadow-2xl rounded-3xl flex flex-col overflow-hidden z-[110]">
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
                <div className={`max-w-[80%] px-5 py-3.5 rounded-3xl text-[15px] leading-relaxed ${
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
                className="flex-1 px-5 py-3 bg-gray-100 rounded-3xl focus:outline-none focus:ring-2 focus:ring-blue-500"
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