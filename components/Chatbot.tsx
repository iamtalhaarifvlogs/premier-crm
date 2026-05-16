'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  X,
  Bot,
  User,
  Trash2,
  Edit,
  Plus,
} from 'lucide-react';

import { Lead } from '@/lib/mock-data';

interface ChatMessage {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

type PendingAction =
  | null
  | {
      type: 'create';
      data: Partial<Lead>;
      step:
        | 'name'
        | 'phone'
        | 'email'
        | 'vehicle'
        | 'budget'
        | 'timeline'
        | 'confirm';
    }
  | {
      type: 'update';
      leadId: string;
      leadName: string;
      field?: keyof Lead;
    }
  | {
      type: 'delete';
      leadId: string;
      leadName: string;
      confirm: boolean;
    };

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [pendingAction, setPendingAction] =
    useState<PendingAction>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  /*
  |--------------------------------------------------------------------------
  | HELPERS
  |--------------------------------------------------------------------------
  */

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: 'smooth',
      });
    }, 100);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const normalizeLead = (item: any): Lead => ({
    id:
      item.id ||
      item.lead_id ||
      `lead-${Date.now()}`,

    name: item.name || 'Unknown',

    phone: item.phone || '',

    email: item.email || '',

    budget: Number(item.budget) || 0,

    preferredVehicle:
      item.preferredVehicle ||
      'Not specified',

    stage: item.stage || 'new_lead',

    statuses: Array.isArray(item.statuses)
      ? item.statuses
      : [],

    assignedRep:
      item.assignedRep || null,

    lastActivity:
      item.lastActivity || 'Just now',

    downPayment:
      Number(item.downPayment) || 0,

    location:
      item.location || 'Unknown',

    creditStatus:
      item.creditStatus || 'good',

    timeline:
      item.timeline || 'Unknown',

    createdAt:
      item.createdAt ||
      new Date().toISOString(),
  });

  const addBotMessage = (text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        text,
        isBot: true,
        timestamp: new Date(),
      },
    ]);

    scrollToBottom();
  };

  const addUserMessage = (text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        text,
        isBot: false,
        timestamp: new Date(),
      },
    ]);
  };

  /*
  |--------------------------------------------------------------------------
  | API
  |--------------------------------------------------------------------------
  */

  const fetchLeads = async () => {
    try {
      const response = await fetch('/api/leads', {
        cache: 'no-store',
      });

      const data = await response.json();

      const rawItems = Array.isArray(data)
        ? data
        : data.Items || [];

      const normalized = rawItems.map(
        normalizeLead
      );

      setLeads(normalized);

      return normalized;
    } catch (error) {
      console.error(error);
      return [];
    }
  };

  const createLead = async (
    leadData: Partial<Lead>
  ) => {
    try {
      const lead_id = `lead-${Date.now()}`;

      const payload = {
        TableName: 'tbl_leads',
        Item: {
          lead_id,
          name: leadData.name || '',
          phone: leadData.phone || '',
          email: leadData.email || '',
          budget:
            Number(leadData.budget) || 0,
          preferredVehicle:
            leadData.preferredVehicle ||
            'Not specified',
          stage: 'new_lead',
          statuses: [],
          assignedRep: null,
          lastActivity: 'Just now',
          downPayment: 0,
          location: 'Unknown',
          creditStatus: 'good',
          timeline:
            leadData.timeline ||
            'Within 2 weeks',
          createdAt:
            new Date().toISOString(),
        },
      };

      const response = await fetch(
        '/api/leads',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (data.success) {
        await fetchLeads();
        return {
          success: true,
          lead_id,
        };
      }

      return {
        success: false,
      };
    } catch (error) {
      console.error(error);

      return {
        success: false,
      };
    }
  };

  const updateLead = async (
    existingLead: Lead,
    updates: Partial<Lead>
  ) => {
    try {
      const payload = {
        TableName: 'tbl_leads',
        Item: {
          lead_id:
            existingLead.id ||
            (existingLead as any).lead_id,

          name:
            updates.name ||
            existingLead.name,

          phone:
            updates.phone ||
            existingLead.phone,

          email:
            updates.email ||
            existingLead.email,

          budget:
            updates.budget ??
            existingLead.budget,

          preferredVehicle:
            updates.preferredVehicle ||
            existingLead.preferredVehicle,

          stage:
            updates.stage ||
            existingLead.stage,

          statuses:
            updates.statuses ||
            existingLead.statuses,

          assignedRep:
            updates.assignedRep ??
            existingLead.assignedRep,

          lastActivity: 'Just now',

          downPayment:
            updates.downPayment ??
            existingLead.downPayment,

          location:
            updates.location ||
            existingLead.location,

          creditStatus:
            updates.creditStatus ||
            existingLead.creditStatus,

          timeline:
            updates.timeline ||
            existingLead.timeline,

          createdAt:
            existingLead.createdAt,
        },
      };

      const response = await fetch(
        '/api/leads',
        {
          method: 'PUT',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (data.success) {
        await fetchLeads();
        return true;
      }

      return false;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  const deleteLead = async (
    lead: Lead
  ) => {
    try {
      const payload = {
        TableName: 'tbl_leads',
        lead_id:
          lead.id ||
          (lead as any).lead_id,
      };

      const response = await fetch(
        '/api/leads',
        {
          method: 'DELETE',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (data.success) {
        await fetchLeads();
        return true;
      }

      return false;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  /*
  |--------------------------------------------------------------------------
  | AI BRAIN
  |--------------------------------------------------------------------------
  */

  const findLeadByName = (
    text: string,
    leadList: Lead[]
  ) => {
    const lower = text.toLowerCase();

    return leadList.find((lead) =>
      lead.name
        .toLowerCase()
        .includes(lower)
    );
  };

  const processCreateFlow = async (
    userText: string
  ) => {
    if (
      !pendingAction ||
      pendingAction.type !== 'create'
    ) {
      return;
    }

    const flow = pendingAction;

    switch (flow.step) {
      case 'name':
        setPendingAction({
          ...flow,
          step: 'phone',
          data: {
            ...flow.data,
            name: userText,
          },
        });

        addBotMessage(
          `Perfect. What's ${userText}'s phone number?`
        );

        return;

      case 'phone':
        setPendingAction({
          ...flow,
          step: 'email',
          data: {
            ...flow.data,
            phone: userText,
          },
        });

        addBotMessage(
          `Got it. What's their email address?`
        );

        return;

      case 'email':
        setPendingAction({
          ...flow,
          step: 'vehicle',
          data: {
            ...flow.data,
            email: userText,
          },
        });

        addBotMessage(
          `Nice. What vehicle are they interested in?`
        );

        return;

      case 'vehicle':
        setPendingAction({
          ...flow,
          step: 'budget',
          data: {
            ...flow.data,
            preferredVehicle:
              userText,
          },
        });

        addBotMessage(
          `Awesome. What's their budget?`
        );

        return;

      case 'budget':
        setPendingAction({
          ...flow,
          step: 'timeline',
          data: {
            ...flow.data,
            budget:
              Number(
                userText.replace(
                  /[^0-9]/g,
                  ''
                )
              ) || 0,
          },
        });

        addBotMessage(
          `And what's their buying timeline?`
        );

        return;

      case 'timeline': {
        const finalData = {
          ...flow.data,
          timeline: userText,
        };

        addBotMessage(
          `Here's the new lead I'm about to create:

• Name: ${finalData.name}
• Phone: ${finalData.phone}
• Email: ${finalData.email}
• Vehicle: ${finalData.preferredVehicle}
• Budget: ${formatCurrency(
            Number(finalData.budget)
          )}
• Timeline: ${finalData.timeline}

Reply with "confirm" to create the lead.`
        );

        setPendingAction({
          ...flow,
          step: 'confirm',
          data: finalData,
        });

        return;
      }

      case 'confirm':
        if (
          userText
            .toLowerCase()
            .includes('confirm')
        ) {
          const result =
            await createLead(
              flow.data
            );

          if (result.success) {
            addBotMessage(
              `✅ Lead created successfully.

Lead ID: ${result.lead_id}

The CRM has been updated.`
            );
          } else {
            addBotMessage(
              `I couldn't create the lead right now.`
            );
          }

          setPendingAction(null);

          return;
        }

        addBotMessage(
          `Please type "confirm" if you'd like me to create this lead.`
        );

        return;
    }
  };

  const processUpdateFlow = async (
    userText: string
  ) => {
    if (
      !pendingAction ||
      pendingAction.type !== 'update'
    ) {
      return;
    }

    const lead = leads.find(
      (l) =>
        l.id === pendingAction.leadId
    );

    if (!lead) {
      addBotMessage(
        `I couldn't find that lead anymore.`
      );

      setPendingAction(null);
      return;
    }

    if (!pendingAction.field) {
      const lower =
        userText.toLowerCase();

      let field:
        | keyof Lead
        | undefined;

      if (lower.includes('phone'))
        field = 'phone';

      else if (
        lower.includes('email')
      )
        field = 'email';

      else if (
        lower.includes('budget')
      )
        field = 'budget';

      else if (
        lower.includes('vehicle')
      )
        field =
          'preferredVehicle';

      else if (
        lower.includes('timeline')
      )
        field = 'timeline';

      if (!field) {
        addBotMessage(
          `Tell me what you'd like to update.

Examples:
• phone
• email
• budget
• vehicle
• timeline`
        );

        return;
      }

      setPendingAction({
        ...pendingAction,
        field,
      });

      addBotMessage(
        `What should I change the ${field} to?`
      );

      return;
    }

    const updateData: any = {};

    if (
      pendingAction.field ===
      'budget'
    ) {
      updateData.budget =
        Number(
          userText.replace(
            /[^0-9]/g,
            ''
          )
        ) || 0;
    } else {
      updateData[
        pendingAction.field
      ] = userText;
    }

    const success =
      await updateLead(
        lead,
        updateData
      );

    if (success) {
      addBotMessage(
        `✅ ${pendingAction.leadName}'s ${pendingAction.field} has been updated successfully.`
      );
    } else {
      addBotMessage(
        `I couldn't update the lead right now.`
      );
    }

    setPendingAction(null);
  };

  const processDeleteFlow = async (
    userText: string
  ) => {
    if (
      !pendingAction ||
      pendingAction.type !== 'delete'
    ) {
      return;
    }

    if (
      !userText
        .toLowerCase()
        .includes('yes')
    ) {
      addBotMessage(
        `Delete cancelled.`
      );

      setPendingAction(null);
      return;
    }

    const lead = leads.find(
      (l) =>
        l.id === pendingAction.leadId
    );

    if (!lead) {
      addBotMessage(
        `Lead no longer exists.`
      );

      setPendingAction(null);
      return;
    }

    const success =
      await deleteLead(lead);

    if (success) {
      addBotMessage(
        `🗑️ ${pendingAction.leadName} has been deleted successfully.`
      );
    } else {
      addBotMessage(
        `I couldn't delete the lead.`
      );
    }

    setPendingAction(null);
  };

  const processUserMessage = async (
    text: string
  ) => {
    const lower = text.toLowerCase();

    const freshLeads =
      await fetchLeads();

    /*
    |--------------------------------------------------------------------------
    | ACTIVE FLOWS
    |--------------------------------------------------------------------------
    */

    if (
      pendingAction?.type ===
      'create'
    ) {
      await processCreateFlow(text);
      return;
    }

    if (
      pendingAction?.type ===
      'update'
    ) {
      await processUpdateFlow(text);
      return;
    }

    if (
      pendingAction?.type ===
      'delete'
    ) {
      await processDeleteFlow(text);
      return;
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE
    |--------------------------------------------------------------------------
    */

    if (
      lower.includes('add lead') ||
      lower.includes('new lead') ||
      lower.includes('create lead')
    ) {
      setPendingAction({
        type: 'create',
        data: {},
        step: 'name',
      });

      addBotMessage(
        `Absolutely. Let's create a new lead.

What's the customer's full name?`
      );

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE
    |--------------------------------------------------------------------------
    */

    if (
      lower.includes('delete')
    ) {
      const lead =
        findLeadByName(
          lower,
          freshLeads
        );

      if (!lead) {
        addBotMessage(
          `I couldn't find that lead to delete.`
        );

        return;
      }

      setPendingAction({
        type: 'delete',
        leadId: lead.id,
        leadName: lead.name,
        confirm: true,
      });

      addBotMessage(
        `Are you sure you want me to permanently delete ${lead.name}?

Reply with "yes" to confirm.`
      );

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE
    |--------------------------------------------------------------------------
    */

    if (
      lower.includes('update') ||
      lower.includes('change') ||
      lower.includes('edit')
    ) {
      const lead =
        findLeadByName(
          lower,
          freshLeads
        );

      if (!lead) {
        addBotMessage(
          `I couldn't find that lead.`
        );

        return;
      }

      setPendingAction({
        type: 'update',
        leadId: lead.id,
        leadName: lead.name,
      });

      addBotMessage(
        `What would you like to update for ${lead.name}?`
      );

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | ALL LEADS
    |--------------------------------------------------------------------------
    */

    if (
      lower.includes('all leads') ||
      lower.includes('show leads') ||
      lower.includes('list leads')
    ) {
      if (freshLeads.length === 0) {
        addBotMessage(
          `No leads found in the CRM yet.`
        );

        return;
      }

      const leadList =
        freshLeads
          .map(
            (lead: { name: any; preferredVehicle: any; budget: number; stage: any; phone: any; }) => `• ${
              lead.name
            }
  Vehicle: ${
    lead.preferredVehicle
  }
  Budget: ${formatCurrency(
    lead.budget
  )}
  Stage: ${lead.stage}
  Phone: ${
    lead.phone || 'N/A'
  }`
          )
          .join('\n\n');

      addBotMessage(
        `Here are the current leads:\n\n${leadList}`
      );

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | STATS
    |--------------------------------------------------------------------------
    */

    if (
      lower.includes('stats') ||
      lower.includes('analytics')
    ) {
      const total =
        freshLeads.length;

      const deposits =
        freshLeads.filter((l: { statuses: string | string[]; }) =>
          l.statuses.includes(
            'deposit_paid'
          )
        ).length;

      const hotLeads =
        freshLeads.filter((l: { statuses: string | string[]; }) =>
          l.statuses.includes(
            'hot'
          )
        ).length;

      const totalBudget =
        freshLeads.reduce(
          (sum: any, lead: { budget: any; }) =>
            sum + lead.budget,
          0
        );

      addBotMessage(
        `📊 CRM Overview

• Total Leads: ${total}
• Hot Leads: ${hotLeads}
• Deposit Paid: ${deposits}
• Total Pipeline Value: ${formatCurrency(
          totalBudget
        )}`
      );

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | SPECIFIC LEAD
    |--------------------------------------------------------------------------
    */

    const lead = findLeadByName(
      lower,
      freshLeads
    );

    if (lead) {
      addBotMessage(
        `👤 ${lead.name}

📍 Stage: ${lead.stage}

🚗 Vehicle:
${lead.preferredVehicle}

💰 Budget:
${formatCurrency(
          lead.budget
        )}

📞 Phone:
${lead.phone || 'N/A'}

📧 Email:
${lead.email || 'N/A'}

📍 Location:
${lead.location}

💳 Credit:
${lead.creditStatus}

🕒 Timeline:
${lead.timeline}

🔥 Statuses:
${
  lead.statuses.length
    ? lead.statuses.join(', ')
    : 'None'
}

💵 Down Payment:
${formatCurrency(
          lead.downPayment
        )}`
      );

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | FALLBACK
    |--------------------------------------------------------------------------
    */

    addBotMessage(
      `I can help you manage the CRM.

Try things like:

• Show all leads
• Show Talha Arif
• Add new lead
• Update Sarah Johnson
• Delete Ryan
• Show CRM stats`
    );
  };

  /*
  |--------------------------------------------------------------------------
  | EFFECTS
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (isOpen) {
      fetchLeads();
    }
  }, [isOpen]);

  useEffect(() => {
    if (
      isOpen &&
      messages.length === 0
    ) {
      addBotMessage(
        `Hi, I'm Maya 👋

I'm connected to your live CRM.

I can:
• View leads
• Create new leads
• Update existing leads
• Delete leads
• Show CRM analytics

Try:
• "Show all leads"
• "Add new lead"
• "Update Sarah Johnson"
• "Delete Ryan"`
      );
    }
  }, [isOpen]);

  /*
  |--------------------------------------------------------------------------
  | SEND
  |--------------------------------------------------------------------------
  */

  const handleSend = async () => {
    if (!inputValue.trim()) {
      return;
    }

    const text = inputValue.trim();

    addUserMessage(text);

    setInputValue('');

    setIsTyping(true);

    setTimeout(async () => {
      await processUserMessage(text);

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
        onClick={() =>
          setIsOpen(true)
        }
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-2xl transition hover:scale-110"
      >
        <Bot size={28} />
      </button>

      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 flex h-[620px] w-[95%] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl md:right-6 md:w-[420px]">
          <div className="flex items-center justify-between bg-blue-600 p-4 text-white">
            <div className="flex items-center gap-2">
              <Bot size={22} />
              <div>
                <div className="font-semibold">
                  Maya AI
                </div>
                <div className="text-xs opacity-80">
                  Connected to CRM
                </div>
              </div>
            </div>

            <button
              onClick={() =>
                setIsOpen(false)
              }
            >
              <X size={24} />
            </button>
          </div>

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
                      ? 'border bg-white text-black'
                      : 'bg-blue-600 text-white'
                  }`}
                >
                  <div className="mb-2 flex items-center gap-2">
                    {message.isBot ? (
                      <Bot size={16} />
                    ) : (
                      <User size={16} />
                    )}

                    <span className="text-xs opacity-70">
                      {message.isBot
                        ? 'Maya'
                        : 'You'}
                    </span>
                  </div>

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

          <div className="border-t bg-white p-4">
            <div className="mb-3 flex flex-wrap gap-2">
              <button
                onClick={() =>
                  setInputValue(
                    'Show all leads'
                  )
                }
                className="rounded-full bg-gray-100 px-3 py-1 text-xs"
              >
                Show Leads
              </button>

              <button
                onClick={() =>
                  setInputValue(
                    'Add new lead'
                  )
                }
                className="rounded-full bg-gray-100 px-3 py-1 text-xs"
              >
                <Plus size={12} className="inline" />{' '}
                Add
              </button>

              <button
                onClick={() =>
                  setInputValue(
                    'Show CRM stats'
                  )
                }
                className="rounded-full bg-gray-100 px-3 py-1 text-xs"
              >
                Stats
              </button>

              <button
                onClick={() =>
                  setInputValue(
                    'Update Sarah Johnson'
                  )
                }
                className="rounded-full bg-gray-100 px-3 py-1 text-xs"
              >
                <Edit size={12} className="inline" />{' '}
                Update
              </button>

              <button
                onClick={() =>
                  setInputValue(
                    'Delete Ryan'
                  )
                }
                className="rounded-full bg-gray-100 px-3 py-1 text-xs"
              >
                <Trash2 size={12} className="inline" />{' '}
                Delete
              </button>
            </div>

            <div className="flex gap-2">
              <input
                value={inputValue}
                onChange={(e) =>
                  setInputValue(
                    e.target.value
                  )
                }
                onKeyDown={(e) =>
                  e.key === 'Enter' &&
                  handleSend()
                }
                placeholder="Talk to Maya naturally..."
                className="flex-1 rounded-full bg-gray-100 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />

              <button
                onClick={handleSend}
                className="rounded-full bg-blue-600 px-5 text-white"
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