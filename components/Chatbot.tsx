'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Bot } from 'lucide-react';
import { Lead, PipelineStage, LeadStatus } from '@/lib/mock-data';

interface ChatMessage {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  /*
  |--------------------------------------------------------------------------
  | SCROLL
  |--------------------------------------------------------------------------
  */

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: 'smooth',
      });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /*
  |--------------------------------------------------------------------------
  | FETCH LEADS
  |--------------------------------------------------------------------------
  */

  const fetchLeads = async (): Promise<Lead[]> => {
    try {
      setLoadingLeads(true);

      const response = await fetch('/api/leads', {
        method: 'GET',
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();

      console.log('LEADS API RESPONSE:', data);

      /*
      |--------------------------------------------------------------------------
      | HANDLE DIFFERENT RESPONSE SHAPES
      |--------------------------------------------------------------------------
      */

      let items: any[] = [];

      if (Array.isArray(data)) {
        items = data;
      } else if (Array.isArray(data.Items)) {
        items = data.Items;
      } else {
        items = [];
      }

      /*
      |--------------------------------------------------------------------------
      | NORMALIZE DATA
      |--------------------------------------------------------------------------
      */

      const normalizedLeads: Lead[] = items.map(
        (item: any, index: number) => ({
          id:
            item.id ||
            item.lead_id ||
            `lead-${index}`,

          name:
            item.name ||
            'Unknown Lead',

          phone:
            item.phone ||
            '',

          email:
            item.email ||
            '',

          budget:
            Number(item.budget || 0),

          preferredVehicle:
            item.preferredVehicle ||
            item.preferred_vehicle ||
            'Not specified',

          stage:
            (item.stage ||
              'new_lead') as PipelineStage,

          statuses:
            Array.isArray(item.statuses)
              ? (item.statuses as LeadStatus[])
              : [],

          assignedRep:
            item.assignedRep || null,

          lastActivity:
            item.lastActivity ||
            'Just now',

          downPayment:
            Number(item.downPayment || 0),

          location:
            item.location ||
            'Unknown',

          creditStatus:
            item.creditStatus ||
            'good',

          timeline:
            item.timeline ||
            'Unknown',

          createdAt:
            item.createdAt ||
            item.created_at ||
            new Date().toISOString(),
        })
      );

      console.log(
        'NORMALIZED LEADS:',
        normalizedLeads
      );

      setLeads(normalizedLeads);

      return normalizedLeads;
    } catch (error) {
      console.error(
        'Failed to fetch leads:',
        error
      );

      addBotMessage(
        'Failed to load leads from API.'
      );

      return [];
    } finally {
      setLoadingLeads(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | INITIAL LOAD
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!isOpen) return;

    fetchLeads();

    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          text:
            "Hi! I'm Maya.\n\n" +
            'You can ask:\n' +
            '• Show all leads\n' +
            '• Tell me about Talha\n' +
            '• Show Sarah Johnson\n' +
            '• Who paid deposit?\n' +
            '• Show hot leads',
          isBot: true,
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen]);

  /*
  |--------------------------------------------------------------------------
  | ADD BOT MESSAGE
  |--------------------------------------------------------------------------
  */

  const addBotMessage = (text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        text,
        isBot: true,
        timestamp: new Date(),
      },
    ]);
  };

  /*
  |--------------------------------------------------------------------------
  | ADD USER MESSAGE
  |--------------------------------------------------------------------------
  */

  const addUserMessage = (text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        text,
        isBot: false,
        timestamp: new Date(),
      },
    ]);
  };

  /*
  |--------------------------------------------------------------------------
  | FORMATTERS
  |--------------------------------------------------------------------------
  */

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatStage = (stage: string) => {
    return stage
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  /*
  |--------------------------------------------------------------------------
  | PROCESS USER MESSAGE
  |--------------------------------------------------------------------------
  */

  const processUserMessage = async (
    text: string
  ) => {
    const lower = text.toLowerCase();

    const freshLeads =
      leads.length > 0
        ? leads
        : await fetchLeads();

    /*
    |--------------------------------------------------------------------------
    | SHOW ALL LEADS
    |--------------------------------------------------------------------------
    */

    if (
      lower.includes('all leads') ||
      lower.includes('show leads') ||
      lower.includes('list leads') ||
      lower === 'list'
    ) {
      if (freshLeads.length === 0) {
        addBotMessage(
          'No leads found in the CRM.'
        );
        return;
      }

      const list = freshLeads
        .map(
          (lead) =>
            `• ${lead.name}\n` +
            `  Vehicle: ${lead.preferredVehicle}\n` +
            `  Budget: ${formatMoney(
              lead.budget
            )}\n` +
            `  Stage: ${formatStage(
              lead.stage
            )}`
        )
        .join('\n\n');

      addBotMessage(
        `Found ${freshLeads.length} leads:\n\n${list}`
      );

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | DEPOSIT PAID LEADS
    |--------------------------------------------------------------------------
    */

    if (
      lower.includes('deposit') ||
      lower.includes('paid')
    ) {
      const depositLeads =
        freshLeads.filter((lead) =>
          lead.statuses.includes(
            'deposit_paid'
          )
        );

      if (depositLeads.length === 0) {
        addBotMessage(
          'No leads have paid deposits yet.'
        );
        return;
      }

      const text = depositLeads
        .map(
          (lead) =>
            `• ${lead.name} — ${lead.preferredVehicle}`
        )
        .join('\n');

      addBotMessage(
        `Deposit paid leads:\n\n${text}`
      );

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | HOT LEADS
    |--------------------------------------------------------------------------
    */

    if (lower.includes('hot')) {
      const hotLeads = freshLeads.filter(
        (lead) =>
          lead.statuses.includes('hot')
      );

      if (hotLeads.length === 0) {
        addBotMessage(
          'No hot leads found.'
        );
        return;
      }

      const text = hotLeads
        .map(
          (lead) =>
            `• ${lead.name} — ${lead.preferredVehicle}`
        )
        .join('\n');

      addBotMessage(
        `Hot leads:\n\n${text}`
      );

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | SEARCH LEAD BY NAME
    |--------------------------------------------------------------------------
    */

    const matchedLead = freshLeads.find(
      (lead) =>
        lead.name
          .toLowerCase()
          .includes(lower)
    );

    if (matchedLead) {
      const details =
        `Name: ${matchedLead.name}\n\n` +
        `Vehicle: ${matchedLead.preferredVehicle}\n` +
        `Budget: ${formatMoney(
          matchedLead.budget
        )}\n` +
        `Stage: ${formatStage(
          matchedLead.stage
        )}\n` +
        `Phone: ${matchedLead.phone || 'N/A'}\n` +
        `Email: ${matchedLead.email || 'N/A'}\n` +
        `Location: ${matchedLead.location}\n` +
        `Timeline: ${matchedLead.timeline}\n` +
        `Credit: ${matchedLead.creditStatus}\n` +
        `Deposit Paid: ${
          matchedLead.statuses.includes(
            'deposit_paid'
          )
            ? 'Yes'
            : 'No'
        }`;

      addBotMessage(details);

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | FALLBACK
    |--------------------------------------------------------------------------
    */

    addBotMessage(
      "I couldn't find that lead.\n\n" +
        'Try:\n' +
        '• Show all leads\n' +
        '• Tell me about Talha Arif\n' +
        '• Show hot leads\n' +
        '• Who paid deposit?'
    );
  };

  /*
  |--------------------------------------------------------------------------
  | SEND MESSAGE
  |--------------------------------------------------------------------------
  */

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userText = inputValue.trim();

    addUserMessage(userText);

    setInputValue('');

    setIsTyping(true);

    setTimeout(async () => {
      await processUserMessage(userText);

      setIsTyping(false);
    }, 700);
  };

  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-2xl transition hover:scale-110"
      >
        <Bot size={28} />
      </button>

      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 flex h-[520px] w-[92%] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl md:right-6 md:w-[380px]">
          {/* HEADER */}

          <div className="flex items-center justify-between bg-blue-600 p-4 text-white">
            <div>
              <div className="font-semibold">
                Maya AI
              </div>

              <div className="text-xs opacity-80">
                {loadingLeads
                  ? 'Loading leads...'
                  : `${leads.length} leads loaded`}
              </div>
            </div>

            <button
              onClick={() =>
                setIsOpen(false)
              }
            >
              <X size={22} />
            </button>
          </div>

          {/* MESSAGES */}

          <div className="flex-1 space-y-4 overflow-y-auto bg-gray-50 p-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.isBot
                    ? 'justify-start'
                    : 'justify-end'
                }`}
              >
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm ${
                    message.isBot
                      ? 'border bg-white text-gray-900'
                      : 'bg-blue-600 text-white'
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="pl-2 text-sm text-gray-400">
                Maya is typing...
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* INPUT */}

          <div className="border-t bg-white p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) =>
                  setInputValue(
                    e.target.value
                  )
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSend();
                  }
                }}
                placeholder="Talk to Maya naturally..."
                className="flex-1 rounded-full bg-gray-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />

              <button
                onClick={handleSend}
                className="rounded-full bg-blue-600 px-5 text-white transition hover:bg-blue-700"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}