'use client';

import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  Bot,
  Edit,
  Plus,
  Send,
  Trash2,
  User,
  X,
  Activity,
  Car,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

import { Lead } from '@/lib/mock-data';

interface ChatMessage {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

interface MayaMemory {
  lastIntent?: string;
  selectedLeadId?: string;
  selectedLeadName?: string;
  lastVehicleSearch?: string;
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
        | 'credit'
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
    }
  | {
      type: 'qualification';
      leadId: string;
      leadName: string;
      answers: {
        vehicle?: string;
        budget?: number;
        timeline?: string;
        credit?: string;
      };
      step:
        | 'vehicle'
        | 'budget'
        | 'timeline'
        | 'credit'
        | 'complete';
    };

const STAGE_LABELS: Record<string, string> = {
  new_lead: 'New Lead',
  maya_qualification:
    'Maya Qualification',
  vehicle_sourcing:
    'Vehicle Sourcing',
  alternatives_presented:
    'Alternatives Presented',
  deposit_requested:
    'Deposit Requested',
  deposit_paid: 'Deposit Paid',
  rep_handoff: 'Rep Handoff',
  closed_won: 'Closed Won',
  closed_lost: 'Closed Lost',
};

export default function Chatbot() {
  const [isOpen, setIsOpen] =
    useState(false);

  const [messages, setMessages] =
    useState<ChatMessage[]>([]);

  const [inputValue, setInputValue] =
    useState('');

  const [isTyping, setIsTyping] =
    useState(false);

  const [leads, setLeads] = useState<
    Lead[]
  >([]);

  const [pendingAction, setPendingAction] =
    useState<PendingAction>(null);

  const [mayaMemory, setMayaMemory] =
    useState<MayaMemory>({});

  const messagesEndRef =
    useRef<HTMLDivElement>(null);

  /*
  |--------------------------------------------------------------------------
  | HELPERS
  |--------------------------------------------------------------------------
  */

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView(
        {
          behavior: 'smooth',
        }
      );
    }, 100);
  };

  const formatCurrency = (
    amount: number
  ) => {
    return new Intl.NumberFormat(
      'en-US',
      {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }
    ).format(amount || 0);
  };

  const humanizeStage = (
    stage: string
  ) => {
    return (
      STAGE_LABELS[stage] || stage
    );
  };

  const normalizeLead = (
    item: any
  ): Lead => ({
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

    stage:
      item.stage || 'new_lead',

    statuses: Array.isArray(
      item.statuses
    )
      ? item.statuses
      : [],

    assignedRep:
      item.assignedRep || null,

    lastActivity:
      item.lastActivity ||
      'Just now',

    downPayment:
      Number(item.downPayment) || 0,

    location:
      item.location || 'Unknown',

    creditStatus:
      item.creditStatus || 'good',

    timeline:
      item.timeline ||
      'Within 2 weeks',

    createdAt:
      item.createdAt ||
      new Date().toISOString(),
  });

  const addBotMessage = (
    text: string
  ) => {
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        text,
        isBot: true,
        timestamp: new Date(),
      },
    ]);

    scrollToBottom();
  };

  const addUserMessage = (
    text: string
  ) => {
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        text,
        isBot: false,
        timestamp: new Date(),
      },
    ]);

    scrollToBottom();
  };

  const findLeadByName = (
    text: string,
    leadList: Lead[]
  ) => {
    const lower =
      text.toLowerCase();

    return leadList.find((lead) =>
      lower.includes(
        lead.name.toLowerCase()
      )
    );
  };

  const extractBudget = (
    text: string
  ) => {
    return (
      Number(
        text.replace(/[^0-9]/g, '')
      ) || 0
    );
  };

  /*
  |--------------------------------------------------------------------------
  | API
  |--------------------------------------------------------------------------
  */

  const fetchLeads = async () => {
    try {
      const response = await fetch(
        '/api/leads',
        {
          cache: 'no-store',
        }
      );

      const data =
        await response.json();

      const items = Array.isArray(data)
        ? data
        : data.Items || [];

      const normalized =
        items.map(normalizeLead);

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

          name:
            leadData.name || '',

          phone:
            leadData.phone || '',

          email:
            leadData.email || '',

          budget:
            Number(
              leadData.budget
            ) || 0,

          preferredVehicle:
            leadData.preferredVehicle ||
            'Not specified',

          stage: 'new_lead',

          statuses: ['hot'],

          assignedRep: null,

          lastActivity:
            'Just now',

          downPayment: 0,

          location: 'Unknown',

          creditStatus:
            leadData.creditStatus ||
            'good',

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
          body: JSON.stringify(
            payload
          ),
        }
      );

      const data =
        await response.json();

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
            existingLead.id,

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

          lastActivity:
            'Just now',

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
          body: JSON.stringify(
            payload
          ),
        }
      );

      const data =
        await response.json();

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
        lead_id: lead.id,
      };

      const response = await fetch(
        '/api/leads',
        {
          method: 'DELETE',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify(
            payload
          ),
        }
      );

      const data =
        await response.json();

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
  | QUALIFICATION FLOW
  |--------------------------------------------------------------------------
  */

  const processQualificationFlow =
    async (userText: string) => {
      if (
        !pendingAction ||
        pendingAction.type !==
          'qualification'
      ) {
        return;
      }

      const flow = pendingAction;

      switch (flow.step) {
        case 'vehicle':
          setPendingAction({
            ...flow,
            step: 'budget',
            answers: {
              ...flow.answers,
              vehicle: userText,
            },
          });

          addBotMessage(
            `Got it. What's the customer's estimated budget for the vehicle?`
          );

          return;

        case 'budget':
          setPendingAction({
            ...flow,
            step: 'timeline',
            answers: {
              ...flow.answers,
              budget:
                extractBudget(
                  userText
                ),
            },
          });

          addBotMessage(
            `Perfect. What's the buying timeline?`
          );

          return;

        case 'timeline':
          setPendingAction({
            ...flow,
            step: 'credit',
            answers: {
              ...flow.answers,
              timeline: userText,
            },
          });

          addBotMessage(
            `How would you describe their credit situation? (excellent / good / fair / poor)`
          );

          return;

        case 'credit': {
          const lead =
            leads.find(
              (l) =>
                l.id ===
                flow.leadId
            );

          if (!lead) {
            addBotMessage(
              `I couldn't find that lead anymore.`
            );

            setPendingAction(
              null
            );

            return;
          }

          const success =
            await updateLead(
              lead,
              {
                stage:
                  'maya_qualification',
                preferredVehicle:
                  flow.answers
                    .vehicle,
                budget:
                  flow.answers
                    .budget,
                timeline:
                  flow.answers
                    .timeline,
                creditStatus:
                  userText as any,
              }
            );

          if (success) {
            addBotMessage(
              `✅ Qualification completed for ${lead.name}.

📌 Stage moved to Maya Qualification

🚗 Vehicle: ${
                flow.answers.vehicle
              }

💰 Budget: ${formatCurrency(
                Number(
                  flow.answers
                    .budget
                )
              )}

🕒 Timeline: ${
                flow.answers
                  .timeline
              }

💳 Credit: ${userText}

The lead is now ready for sourcing evaluation.`
            );
          } else {
            addBotMessage(
              `I couldn't complete the qualification process right now.`
            );
          }

          setPendingAction(null);

          return;
        }
      }
    };

  /*
  |--------------------------------------------------------------------------
  | CREATE FLOW
  |--------------------------------------------------------------------------
  */

  const processCreateFlow =
    async (userText: string) => {
      if (
        !pendingAction ||
        pendingAction.type !==
          'create'
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
            `Great. What's ${userText}'s phone number?`
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
            `Perfect. What's their email address?`
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
            `What vehicle are they interested in?`
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
            `What's the customer's budget?`
          );

          return;

        case 'budget':
          setPendingAction({
            ...flow,
            step: 'timeline',
            data: {
              ...flow.data,
              budget:
                extractBudget(
                  userText
                ),
            },
          });

          addBotMessage(
            `What's their buying timeline?`
          );

          return;

        case 'timeline':
          setPendingAction({
            ...flow,
            step: 'credit',
            data: {
              ...flow.data,
              timeline: userText,
            },
          });

          addBotMessage(
            `How would you rate their credit profile? (excellent / good / fair / poor)`
          );

          return;

        case 'credit': {
          const finalData = {
            ...flow.data,
            creditStatus:
              userText,
          };

          addBotMessage(
            `Here's the lead summary before I create it:

👤 ${finalData.name}

🚗 ${
              finalData.preferredVehicle
            }

💰 ${formatCurrency(
              Number(
                finalData.budget
              )
            )}

📞 ${finalData.phone}

📧 ${finalData.email}

🕒 ${finalData.timeline}

💳 ${
              finalData.creditStatus
            }

Reply with "confirm" to create this lead.`
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
              .includes(
                'confirm'
              )
          ) {
            const result =
              await createLead(
                flow.data
              );

            if (result.success) {
              addBotMessage(
                `✅ New lead created successfully.

Lead ID: ${result.lead_id}

The CRM pipeline has been updated and the lead is now visible inside the New Lead stage.`
              );
            } else {
              addBotMessage(
                `I couldn't create the lead right now.`
              );
            }

            setPendingAction(
              null
            );

            return;
          }

          addBotMessage(
            `Please type "confirm" if you'd like me to create this lead.`
          );

          return;
      }
    };

  /*
  |--------------------------------------------------------------------------
  | UPDATE FLOW
  |--------------------------------------------------------------------------
  */

  const processUpdateFlow =
    async (userText: string) => {
      if (
        !pendingAction ||
        pendingAction.type !==
          'update'
      ) {
        return;
      }

      const lead = leads.find(
        (l) =>
          l.id ===
          pendingAction.leadId
      );

      if (!lead) {
        addBotMessage(
          `I couldn't find that lead anymore.`
        );

        setPendingAction(null);

        return;
      }

      if (
        !pendingAction.field
      ) {
        const lower =
          userText.toLowerCase();

        let field:
          | keyof Lead
          | undefined;

        if (
          lower.includes(
            'phone'
          )
        )
          field = 'phone';

        else if (
          lower.includes(
            'email'
          )
        )
          field = 'email';

        else if (
          lower.includes(
            'budget'
          )
        )
          field = 'budget';

        else if (
          lower.includes(
            'vehicle'
          )
        )
          field =
            'preferredVehicle';

        else if (
          lower.includes(
            'timeline'
          )
        )
          field = 'timeline';

        else if (
          lower.includes(
            'stage'
          )
        )
          field = 'stage';

        if (!field) {
          addBotMessage(
            `Tell me what you'd like to update.

Examples:
• budget
• phone
• email
• vehicle
• timeline
• stage`
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
          extractBudget(
            userText
          );
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
          `✅ ${lead.name}'s ${pendingAction.field} has been updated successfully.`
        );
      } else {
        addBotMessage(
          `I couldn't update the lead right now.`
        );
      }

      setPendingAction(null);
    };

  /*
  |--------------------------------------------------------------------------
  | DELETE FLOW
  |--------------------------------------------------------------------------
  */

  const processDeleteFlow =
    async (userText: string) => {
      if (
        !pendingAction ||
        pendingAction.type !==
          'delete'
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
          l.id ===
          pendingAction.leadId
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
          `🗑️ ${lead.name} has been deleted successfully from the CRM.`
        );
      } else {
        addBotMessage(
          `I couldn't delete the lead right now.`
        );
      }

      setPendingAction(null);
    };

  /*
  |--------------------------------------------------------------------------
  | AI ENGINE
  |--------------------------------------------------------------------------
  */

  const processUserMessage =
    async (text: string) => {
      const lower =
        text.toLowerCase();

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
        await processCreateFlow(
          text
        );
        return;
      }

      if (
        pendingAction?.type ===
        'update'
      ) {
        await processUpdateFlow(
          text
        );
        return;
      }

      if (
        pendingAction?.type ===
        'delete'
      ) {
        await processDeleteFlow(
          text
        );
        return;
      }

      if (
        pendingAction?.type ===
        'qualification'
      ) {
        await processQualificationFlow(
          text
        );
        return;
      }

      /*
      |--------------------------------------------------------------------------
      | CREATE LEAD
      |--------------------------------------------------------------------------
      */

      if (
        lower.includes(
          'add lead'
        ) ||
        lower.includes(
          'new lead'
        ) ||
        lower.includes(
          'create lead'
        )
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
      | QUALIFY LEAD
      |--------------------------------------------------------------------------
      */

      if (
        lower.includes(
          'qualify'
        )
      ) {
        const lead =
          findLeadByName(
            lower,
            freshLeads
          );

        if (!lead) {
          addBotMessage(
            `I couldn't find that lead to qualify.`
          );

          return;
        }

        setPendingAction({
          type: 'qualification',
          leadId: lead.id,
          leadName: lead.name,
          answers: {},
          step: 'vehicle',
        });

        addBotMessage(
          `Let's qualify ${lead.name}.

What vehicle are they currently interested in?`
        );

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | PRICE OBJECTION
      |--------------------------------------------------------------------------
      */

      if (
        lower.includes(
          'price too high'
        ) ||
        lower.includes(
          'price objection'
        )
      ) {
        addBotMessage(
          `⚠️ Price objection detected.

Recommended actions:

• Present lower mileage alternatives
• Offer financing flexibility
• Introduce similar lower-cost inventory
• Move lead into Vehicle Sourcing

I can also help generate alternative vehicle recommendations if you'd like.`
        );

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | SOURCING
      |--------------------------------------------------------------------------
      */

      if (
        lower.includes(
          'alternative vehicle'
        ) ||
        lower.includes(
          'alternatives'
        ) ||
        lower.includes(
          'source vehicle'
        )
      ) {
        addBotMessage(
          `🚗 Suggested Alternative Vehicles

1. Honda Accord Sport 2021
2. Toyota Camry XSE 2020
3. Nissan Altima SR 2022

These alternatives align closely with the buyer's budget and preferences.`
        );

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | STATS
      |--------------------------------------------------------------------------
      */

      if (
        lower.includes(
          'stats'
        ) ||
        lower.includes(
          'analytics'
        ) ||
        lower.includes(
          'overview'
        )
      ) {
        const total =
          freshLeads.length;

        const hotLeads =
          freshLeads.filter(
            (l) =>
              l.statuses.includes(
                'hot'
              )
          ).length;

        const deposits =
          freshLeads.filter(
            (l) =>
              l.statuses.includes(
                'deposit_paid'
              )
          ).length;

        const sourcing =
          freshLeads.filter(
            (l) =>
              l.stage ===
              'vehicle_sourcing'
          ).length;

        const pipelineValue =
          freshLeads.reduce(
            (
              sum,
              lead
            ) =>
              sum +
              lead.budget,
            0
          );

        addBotMessage(
          `📊 Premier Auto Plus CRM Overview

👥 Total Leads: ${total}

🔥 Hot Leads: ${hotLeads}

🚗 In Sourcing: ${sourcing}

💵 Deposits Paid: ${deposits}

💰 Pipeline Value: ${formatCurrency(
            pipelineValue
          )}`
        );

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | DELETE
      |--------------------------------------------------------------------------
      */

      if (
        lower.includes(
          'delete'
        )
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
        lower.includes(
          'update'
        ) ||
        lower.includes(
          'edit'
        ) ||
        lower.includes(
          'change'
        )
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
          `What would you like me to update for ${lead.name}?`
        );

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | SHOW ALL LEADS
      |--------------------------------------------------------------------------
      */

      if (
        lower.includes(
          'all leads'
        ) ||
        lower.includes(
          'show leads'
        ) ||
        lower.includes(
          'list leads'
        )
      ) {
        if (
          freshLeads.length ===
          0
        ) {
          addBotMessage(
            `There are currently no leads in the CRM.`
          );

          return;
        }

        const leadList =
          freshLeads
            .slice(0, 10)
            .map(
              (
                lead
              ) => `👤 ${
                lead.name
              }

🚗 ${
                lead.preferredVehicle
              }

💰 ${formatCurrency(
                lead.budget
              )}

📍 ${humanizeStage(
                lead.stage
              )}`
            )
            .join('\n\n');

        addBotMessage(
          `Here are the active CRM leads:

${leadList}`
        );

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | SPECIFIC LEAD
      |--------------------------------------------------------------------------
      */

      const lead =
        findLeadByName(
          lower,
          freshLeads
        );

      if (lead) {
        setMayaMemory({
          selectedLeadId:
            lead.id,
          selectedLeadName:
            lead.name,
        });

        addBotMessage(
          `👤 ${lead.name}

📍 Stage:
${humanizeStage(
            lead.stage
          )}

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

💵 Down Payment:
${formatCurrency(
            lead.downPayment
          )}

🔥 Statuses:
${
  lead.statuses.length
    ? lead.statuses.join(
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
        `I'm connected to the Premier Auto Plus CRM and can help with:

• Lead qualification
• Lead creation
• CRM analytics
• Vehicle sourcing
• Pipeline management
• Deposits & sales stages
• Lead updates & deletions

Try things like:

• Show all leads
• Qualify Sarah Johnson
• Add new lead
• Update Talha Arif
• Show CRM stats
• Customer says price is too high
• Show alternative vehicles`
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

I'm your AI CRM Agent for Premier Auto Plus.

I can:
• Manage leads
• Qualify buyers
• Handle CRM operations
• Assist with sourcing
• Track pipeline stages
• Monitor deposits
• Help admins operate the CRM faster

Try:
• Show all leads
• Add new lead
• Qualify Sarah Johnson
• Show CRM stats`
      );
    }
  }, [isOpen]);

  /*
  |--------------------------------------------------------------------------
  | SEND
  |--------------------------------------------------------------------------
  */

  const handleSend = async () => {
    if (!inputValue.trim())
      return;

    const text =
      inputValue.trim();

    addUserMessage(text);

    setInputValue('');

    setIsTyping(true);

    setTimeout(async () => {
      await processUserMessage(
        text
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
        onClick={() =>
          setIsOpen(true)
        }
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-2xl transition hover:scale-110"
      >
        <Bot size={28} />
      </button>

      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 flex h-[680px] w-[95%] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl md:right-6 md:w-[430px]">
          <div className="flex items-center justify-between bg-blue-600 p-4 text-white">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-white/20 p-2">
                <Sparkles size={20} />
              </div>

              <div>
                <div className="font-semibold">
                  Maya AI Agent
                </div>

                <div className="text-xs opacity-80">
                  Premier Auto Plus
                  CRM
                </div>
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

          <div className="flex-1 space-y-4 overflow-y-auto bg-gray-50 p-4">
            {messages.map(
              (message) => (
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
                        <Bot
                          size={
                            15
                          }
                        />
                      ) : (
                        <User
                          size={
                            15
                          }
                        />
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
              )
            )}

            {isTyping && (
              <div className="pl-2 text-sm text-gray-400">
                Maya is typing...
              </div>
            )}

            <div
              ref={
                messagesEndRef
              }
            />
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
                <Activity
                  size={12}
                  className="mr-1 inline"
                />
                Leads
              </button>

              <button
                onClick={() =>
                  setInputValue(
                    'Add new lead'
                  )
                }
                className="rounded-full bg-gray-100 px-3 py-1 text-xs"
              >
                <Plus
                  size={12}
                  className="mr-1 inline"
                />
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
                <DollarSign
                  size={12}
                  className="mr-1 inline"
                />
                Stats
              </button>

              <button
                onClick={() =>
                  setInputValue(
                    'Qualify Sarah Johnson'
                  )
                }
                className="rounded-full bg-gray-100 px-3 py-1 text-xs"
              >
                <CheckCircle2
                  size={12}
                  className="mr-1 inline"
                />
                Qualify
              </button>

              <button
                onClick={() =>
                  setInputValue(
                    'Customer says price is too high'
                  )
                }
                className="rounded-full bg-gray-100 px-3 py-1 text-xs"
              >
                <AlertTriangle
                  size={12}
                  className="mr-1 inline"
                />
                Objection
              </button>

              <button
                onClick={() =>
                  setInputValue(
                    'Show alternative vehicles'
                  )
                }
                className="rounded-full bg-gray-100 px-3 py-1 text-xs"
              >
                <Car
                  size={12}
                  className="mr-1 inline"
                />
                Sourcing
              </button>
            </div>

            <div className="flex gap-2">
              <input
                value={
                  inputValue
                }
                onChange={(e) =>
                  setInputValue(
                    e.target.value
                  )
                }
                onKeyDown={(e) =>
                  e.key ===
                    'Enter' &&
                  handleSend()
                }
                placeholder="Talk to Maya naturally..."
                className="flex-1 rounded-full bg-gray-100 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />

              <button
                onClick={
                  handleSend
                }
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