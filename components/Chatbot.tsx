'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, X, MessageCircle, Bot } from 'lucide-react';

import { useCRM } from '@/lib/crm-context';
import { Lead, createWorkflowLog } from '@/lib/mock-data';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

export default function Chatbot() {
  const { leads, setLeads, addWorkflowLog: contextAddLog } = useCRM();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Conversation state for multi-turn actions (e.g. creating a lead)
  const [currentAction, setCurrentAction] = useState<'none' | 'create-lead' | 'update-lead' | 'delete-lead'>('none');
  const [tempLeadData, setTempLeadData] = useState<Partial<Lead>>({});

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        text: "Hi! I'm Maya, your Premier Auto Plus AI Assistant. How can I help you today? I can manage leads, show pipeline status, create new leads, update them, or delete them.",
        isBot: true,
        timestamp: new Date()
      }]);
    }
  }, [isOpen]);

  const addBotMessage = (text: string) => {
    const botMsg: Message = {
      id: Date.now().toString(),
      text,
      isBot: true,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, botMsg]);
    scrollToBottom();
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: inputValue.trim(),
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    const userText = inputValue.trim().toLowerCase();
    setInputValue('');
    setIsTyping(true);

    setTimeout(async () => {
      await processUserMessage(userText);
      setIsTyping(false);
    }, 600);
  };

  const processUserMessage = async (text: string) => {
    // Show all leads
    if (text.includes("all leads") || text.includes("show leads") || text.includes("list leads")) {
      if (leads.length === 0) {
        addBotMessage("No leads found in the system yet.");
        return;
      }
      const leadList = leads.map(l => `• \( {l.name} ( \){l.stage}) - ${l.preferredVehicle}`).join('\n');
      addBotMessage(`Here are all current leads:\n${leadList}\n\nWould you like details on any specific lead?`);
      return;
    }

    // Show specific lead
    const leadMatch = leads.find(l => 
      l.name.toLowerCase().includes(text) || 
      l.id.toLowerCase().includes(text) ||
      (l.email && l.email.toLowerCase().includes(text))
    );

    if (leadMatch) {
      const details = `
Name: ${leadMatch.name}
Stage: ${leadMatch.stage}
Budget: $${leadMatch.budget}
Vehicle: ${leadMatch.preferredVehicle}
Status: ${leadMatch.statuses.join(', ') || 'None'}
Phone: ${leadMatch.phone}
Email: ${leadMatch.email}
      `.trim();

      addBotMessage(`Here's the details for **\( {leadMatch.name}**:\n\n \){details}\n\nWhat would you like to do? (Edit / Delete / Mark Hot / etc.)`);
      return;
    }

    // Create new lead flow
    if (text.includes("add lead") || text.includes("new lead") || text.includes("create lead")) {
      setCurrentAction('create-lead');
      setTempLeadData({});
      addBotMessage("Great! Let's create a new lead. What's the customer's full name?");
      return;
    }

    // Multi-turn lead creation
    if (currentAction === 'create-lead') {
      if (!tempLeadData.name) {
        setTempLeadData({ ...tempLeadData, name: inputValue.trim() });
        addBotMessage("Got it. What's their phone number?");
        return;
      }
      if (!tempLeadData.phone) {
        setTempLeadData({ ...tempLeadData, phone: inputValue.trim() });
        addBotMessage("Perfect. What's their email address?");
        return;
      }
      if (!tempLeadData.email) {
        setTempLeadData({ ...tempLeadData, email: inputValue.trim() });
        addBotMessage("What's their budget (in USD)?");
        return;
      }
      if (!tempLeadData.budget) {
        setTempLeadData({ ...tempLeadData, budget: parseInt(inputValue) || 25000 });
        addBotMessage("Finally, what's their preferred vehicle?");
        return;
      }
      if (!tempLeadData.preferredVehicle) {
        const newLead: Lead = {
          id: `lead-${Date.now()}`,
          name: tempLeadData.name!,
          phone: tempLeadData.phone!,
          email: tempLeadData.email!,
          budget: tempLeadData.budget!,
          preferredVehicle: inputValue.trim(),
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

        // Auto log
        await createWorkflowLog(newLead.id, "Lead Created", `Maya created new lead: ${newLead.name}`, "success");

        addBotMessage(`✅ Lead created successfully!\n\n**${newLead.name}** has been added to New Lead stage.`);

        setCurrentAction('none');
        setTempLeadData({});
        return;
      }
    }

    // Default smart response
    addBotMessage("I can help you with leads! Try saying:\n• Show all leads\n• Add new lead\n• Show [lead name]");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-full flex items-center justify-center shadow-2xl z-[100] hover:scale-110 transition-all active:scale-95"
      >
        <Bot size={28} />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[380px] h-[520px] bg-white dark:bg-gray-900 shadow-2xl rounded-3xl flex flex-col overflow-hidden z-[110]">
          {/* Header */}
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

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-950">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[80%] px-5 py-3.5 rounded-3xl text-[15px] leading-relaxed ${
                  msg.isBot 
                    ? 'bg-white border shadow-sm text-gray-900 rounded-tl-none' 
                    : 'bg-blue-600 text-white rounded-tr-none'
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

          {/* Input */}
          <div className="p-4 border-t bg-white">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Maya anything about leads..."
                className="flex-1 px-5 py-3 bg-gray-100 rounded-3xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className="w-12 h-12 bg-blue-600 disabled:bg-gray-400 text-white rounded-3xl flex items-center justify-center hover:bg-blue-700 transition-colors"
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