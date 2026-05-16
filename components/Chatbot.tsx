'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Bot, Sparkles } from 'lucide-react';
import {
  Lead,
  PipelineStage,
  LeadStatus,
} from '@/lib/mock-data';

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
  | HELPERS
  |--------------------------------------------------------------------------
  */

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatStage = (stage: string) => {
    return stage
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const formatDate = (date: string) => {
    if (!date) return 'Unknown';

    return new Date(date).toLocaleDateString(
      'en-US',
      {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }
    );
  };

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
  | FETCH LEADS
  |--------------------------------------------------------------------------
  */

  const fetchLeads = async (): Promise<Lead[]> => {
    try {
      setLoadingLeads(true);

      const response = await fetch('/api/leads', {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch leads');
      }

      const data = await response.json();

      const items = Array.isArray(data?.Items)
        ? data.Items
        : Array.isArray(data)
        ? data
        : [];

      const normalized: Lead[] = items.map(
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
            'Unknown',

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

      setLeads(normalized);

      return normalized;
    } catch (error) {
      console.error(error);

      addBotMessage(
        'Unable to connect to CRM API.'
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
            "Hey, I'm Maya AI.\n\n" +
            'I can answer CRM questions naturally.\n\n' +
            'Try asking:\n\n' +
            '• Show all leads\n' +
            '• Who paid deposit?\n' +
            '• Highest budget lead\n' +
            '• Show hot leads\n' +
            '• Leads in qualification stage\n' +
            '• Tell me about Talha\n' +
            '• How many leads do we have?\n' +
            '• Average budget\n' +
            '• Leads from Austin\n' +
            '• Newest lead',
          isBot: true,
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen]);

  /*
  |--------------------------------------------------------------------------
  | INTELLIGENCE ENGINE
  |--------------------------------------------------------------------------
  */

  const processUserMessage = async (
    input: string
  ) => {
    const query = input.toLowerCase().trim();

    const crmLeads =
      leads.length > 0
        ? leads
        : await fetchLeads();

    if (crmLeads.length === 0) {
      addBotMessage(
        'CRM database is currently empty.'
      );
      return;
    }

    /*
    |--------------------------------------------------------------------------
    | TOTAL LEADS
    |--------------------------------------------------------------------------
    */

    if (
      query.includes('how many') ||
      query.includes('total leads') ||
      query.includes('lead count')
    ) {
      addBotMessage(
        `There are currently ${crmLeads.length} leads in the CRM.`
      );
      return;
    }

    /*
    |--------------------------------------------------------------------------
    | SHOW ALL LEADS
    |--------------------------------------------------------------------------
    */

    if (
      query.includes('all leads') ||
      query.includes('show leads') ||
      query.includes('list leads')
    ) {
      const text = crmLeads
        .map(
          (lead, i) =>
            `${i + 1}. ${lead.name}\n` +
            `Vehicle: ${lead.preferredVehicle}\n` +
            `Budget: ${formatMoney(
              lead.budget
            )}\n` +
            `Stage: ${formatStage(
              lead.stage
            )}`
        )
        .join('\n\n');

      addBotMessage(
        `Here are all leads:\n\n${text}`
      );

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | DEPOSIT PAID
    |--------------------------------------------------------------------------
    */

    if (
      query.includes('deposit') ||
      query.includes('paid')
    ) {
      const filtered = crmLeads.filter(
        (lead) =>
          lead.statuses.includes(
            'deposit_paid'
          ) ||
          lead.stage === 'deposit_paid'
      );

      if (!filtered.length) {
        addBotMessage(
          'No deposit-paid leads found.'
        );
        return;
      }

      const text = filtered
        .map(
          (lead) =>
            `• ${lead.name} — ${lead.preferredVehicle}`
        )
        .join('\n');

      addBotMessage(
        `Deposit-paid leads:\n\n${text}`
      );

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | HOT LEADS
    |--------------------------------------------------------------------------
    */

    if (query.includes('hot')) {
      const hot = crmLeads.filter((lead) =>
        lead.statuses.includes('hot')
      );

      if (!hot.length) {
        addBotMessage(
          'No hot leads currently.'
        );
        return;
      }

      const text = hot
        .map(
          (lead) =>
            `• ${lead.name}\nBudget: ${formatMoney(
              lead.budget
            )}`
        )
        .join('\n\n');

      addBotMessage(
        `Hot leads:\n\n${text}`
      );

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | HIGHEST BUDGET
    |--------------------------------------------------------------------------
    */

    if (
      query.includes('highest budget') ||
      query.includes('largest budget') ||
      query.includes('biggest budget')
    ) {
      const topLead = [...crmLeads].sort(
        (a, b) => b.budget - a.budget
      )[0];

      addBotMessage(
        `Highest budget lead:\n\n` +
          `Name: ${topLead.name}\n` +
          `Budget: ${formatMoney(
            topLead.budget
          )}\n` +
          `Vehicle: ${topLead.preferredVehicle}\n` +
          `Stage: ${formatStage(
            topLead.stage
          )}`
      );

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | LOWEST BUDGET
    |--------------------------------------------------------------------------
    */

    if (
      query.includes('lowest budget') ||
      query.includes('smallest budget')
    ) {
      const lowest = [...crmLeads].sort(
        (a, b) => a.budget - b.budget
      )[0];

      addBotMessage(
        `Lowest budget lead:\n\n` +
          `Name: ${lowest.name}\n` +
          `Budget: ${formatMoney(
            lowest.budget
          )}`
      );

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | AVERAGE BUDGET
    |--------------------------------------------------------------------------
    */

    if (
      query.includes('average budget') ||
      query.includes('avg budget')
    ) {
      const total = crmLeads.reduce(
        (sum, lead) => sum + lead.budget,
        0
      );

      const avg =
        total / crmLeads.length;

      addBotMessage(
        `Average lead budget is ${formatMoney(
          avg
        )}.`
      );

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | NEWEST LEAD
    |--------------------------------------------------------------------------
    */

    if (
      query.includes('newest') ||
      query.includes('latest lead')
    ) {
      const newest = [...crmLeads].sort(
        (a, b) =>
          new Date(
            b.createdAt
          ).getTime() -
          new Date(
            a.createdAt
          ).getTime()
      )[0];

      addBotMessage(
        `Newest lead:\n\n` +
          `Name: ${newest.name}\n` +
          `Created: ${formatDate(
            newest.createdAt
          )}\n` +
          `Vehicle: ${newest.preferredVehicle}`
      );

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | STAGE FILTERING
    |--------------------------------------------------------------------------
    */

    const stages: PipelineStage[] = [
      'new_lead',
      'maya_qualification',
      'vehicle_sourcing',
      'alternatives_presented',
      'deposit_requested',
      'deposit_paid',
      'rep_handoff',
      'closed_won',
      'closed_lost',
    ];

    for (const stage of stages) {
      const readable = stage.replace(
        /_/g,
        ' '
      );

      if (
        query.includes(readable) ||
        query.includes(stage)
      ) {
        const filtered = crmLeads.filter(
          (lead) =>
            lead.stage === stage
        );

        if (!filtered.length) {
          addBotMessage(
            `No leads in ${formatStage(
              stage
            )}.`
          );
          return;
        }

        const text = filtered
          .map(
            (lead) =>
              `• ${lead.name} — ${lead.preferredVehicle}`
          )
          .join('\n');

        addBotMessage(
          `${formatStage(
            stage
          )} leads:\n\n${text}`
        );

        return;
      }
    }

    /*
    |--------------------------------------------------------------------------
    | LOCATION SEARCH
    |--------------------------------------------------------------------------
    */

    if (
      query.includes('from') ||
      query.includes('in ')
    ) {
      const found = crmLeads.filter(
        (lead) =>
          lead.location
            .toLowerCase()
            .includes(query)
      );

      if (found.length) {
        const text = found
          .map(
            (lead) =>
              `• ${lead.name} — ${lead.location}`
          )
          .join('\n');

        addBotMessage(
          `Matching location leads:\n\n${text}`
        );

        return;
      }
    }

    /*
    |--------------------------------------------------------------------------
    | NAME SEARCH
    |--------------------------------------------------------------------------
    */

    const matchedLead = crmLeads.find(
      (lead) =>
        query.includes(
          lead.name.toLowerCase()
        )
    );

    if (matchedLead) {
      addBotMessage(
        `Lead Details\n\n` +
          `Name: ${matchedLead.name}\n` +
          `Phone: ${
            matchedLead.phone || 'N/A'
          }\n` +
          `Email: ${
            matchedLead.email || 'N/A'
          }\n` +
          `Vehicle: ${matchedLead.preferredVehicle}\n` +
          `Budget: ${formatMoney(
            matchedLead.budget
          )}\n` +
          `Down Payment: ${formatMoney(
            matchedLead.downPayment
          )}\n` +
          `Stage: ${formatStage(
            matchedLead.stage
          )}\n` +
          `Location: ${matchedLead.location}\n` +
          `Credit: ${matchedLead.creditStatus}\n` +
          `Timeline: ${matchedLead.timeline}\n` +
          `Created: ${formatDate(
            matchedLead.createdAt
          )}\n` +
          `Statuses: ${
            matchedLead.statuses.length
              ? matchedLead.statuses.join(
                  ', '
                )
              : 'None'
          }`
      );

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | FALLBACK
    |--------------------------------------------------------------------------
    */

    addBotMessage(
      "I couldn't understand that request.\n\n" +
        'Try asking:\n\n' +
        '• Show all leads\n' +
        '• Who paid deposit?\n' +
        '• Highest budget lead\n' +
        '• Show hot leads\n' +
        '• Average budget\n' +
        '• Newest lead\n' +
        '• Tell me about Sarah Johnson'
    );
  };

  /*
  |--------------------------------------------------------------------------
  | SEND
  |--------------------------------------------------------------------------
  */

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userInput = inputValue.trim();

    addUserMessage(userInput);

    setInputValue('');

    setIsTyping(true);

    setTimeout(async () => {
      await processUserMessage(
        userInput
      );

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
        <div className="fixed bottom-20 right-4 z-50 flex h-[560px] w-[92%] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl md:right-6 md:w-[400px]">
          {/* HEADER */}

          <div className="flex items-center justify-between bg-blue-600 p-4 text-white">
            <div>
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Sparkles size={18} />
                Maya AI
              </div>

              <div className="text-xs opacity-80">
                {loadingLeads
                  ? 'Syncing CRM...'
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
                  className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
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
              <div className="text-sm text-gray-400">
                Maya is thinking...
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* INPUT */}

          <div className="border-t bg-white p-4">
            <div className="flex gap-2">
              <input
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
                placeholder="Ask Maya anything..."
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