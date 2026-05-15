"use client"

import * as React from "react"
import { Send, User, Bot, Settings, MessageCircle } from "lucide-react"

import { getMessages } from "@/lib/mock-data"
import { Lead } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface ConversationTabProps {
  lead: Lead
}

interface Message {
  id: string
  leadId: string
  sender: "customer" | "maya" | "rep" | "system"
  content: string
  timestamp: string
}

export function ConversationTab({ lead }: ConversationTabProps) {
  const [messages, setMessages] = React.useState<Message[]>([])
  const [inputValue, setInputValue] = React.useState("")
  const [loading, setLoading] = React.useState(true)
  const scrollRef = React.useRef<HTMLDivElement>(null)

  // Load real messages from mock-data.ts
  React.useEffect(() => {
    async function loadMessages() {
      try {
        const allMessages = await getMessages()
        const leadMessages = allMessages[lead.id] || []
        setMessages(leadMessages)
      } catch (err) {
        console.error("Failed to load messages:", err)
        setMessages([])
      } finally {
        setLoading(false)
      }
    }

    loadMessages()
  }, [lead.id])

  // Auto scroll to bottom
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const addMessage = (sender: Message["sender"], content: string) => {
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      leadId: lead.id,
      sender,
      content,
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, newMessage])
  }

  const handleSendReply = () => {
    if (!inputValue.trim()) return
    addMessage("rep", inputValue)
    setInputValue("")
  }

  const simulateCustomerReply = () => {
    const replies = [
      "That sounds great! When can I come see it?",
      "What about the warranty coverage?",
      "Can you send me more pictures?",
      "Is the price negotiable?",
      "I'm very interested. What are the next steps?",
    ]
    const randomReply = replies[Math.floor(Math.random() * replies.length)]
    addMessage("customer", randomReply)
  }

  const simulateNoReply = () => {
    addMessage("system", "No response received from customer after 24 hours. Follow-up scheduled.")
  }

  const triggerMayaMessage = () => {
    const mayaMessages = [
      "Hi! I noticed you were interested in our vehicles. Would you like me to help you find the perfect match?",
      "I've found some great options within your budget. Shall I send details?",
      "Just checking in! Do you have any questions about the vehicles?",
    ]
    const randomMessage = mayaMessages[Math.floor(Math.random() * mayaMessages.length)]
    addMessage("maya", randomMessage)
  }

  const triggerRepTakeover = () => {
    addMessage("system", "Conversation handed off to rep. Maya automation paused.")
    addMessage("rep", `Hi ${lead.name.split(" ")[0]}, this is John from Premier Auto Plus. I'm taking over to assist you personally.`)
  }

  return (
    <div className="flex h-[500px] flex-col">
      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {loading ? (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
              Loading conversation...
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
              No messages yet. Start a conversation or trigger an action below.
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            placeholder="Type a message as rep..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendReply()}
          />
          <Button onClick={handleSendReply} size="icon">
            <Send className="size-4" />
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={simulateCustomerReply}>
            <MessageCircle className="mr-1.5 size-3.5" />
            Simulate Customer Reply
          </Button>
          <Button variant="outline" size="sm" onClick={simulateNoReply}>
            Simulate No Reply
          </Button>
          <Button variant="outline" size="sm" onClick={triggerMayaMessage}>
            <Bot className="mr-1.5 size-3.5" />
            Trigger Maya Message
          </Button>
          <Button variant="outline" size="sm" onClick={triggerRepTakeover}>
            <User className="mr-1.5 size-3.5" />
            Trigger Rep Takeover
          </Button>
        </div>
      </div>
    </div>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const isCustomer = message.sender === "customer"
  const isSystem = message.sender === "system"

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <div className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
          <Settings className="mr-1 inline size-3" />
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex gap-2",
        isCustomer ? "justify-start" : "justify-end"
      )}
    >
      {isCustomer && (
        <Avatar className="size-8">
          <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
            <User className="size-4" />
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={cn(
          "max-w-[75%] rounded-lg px-3 py-2 text-sm",
          isCustomer
            ? "bg-muted text-foreground"
            : message.sender === "maya"
            ? "bg-purple-100 text-purple-900"
            : "bg-primary text-primary-foreground"
        )}
      >
        {!isCustomer && (
          <p className="mb-1 text-xs font-medium opacity-70">
            {message.sender === "maya" ? "Maya (AI)" : "Rep"}
          </p>
        )}
        <p>{message.content}</p>
        <p className="mt-1 text-xs opacity-60">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>

      {!isCustomer && (
        <Avatar className="size-8">
          <AvatarFallback
            className={cn(
              "text-xs",
              message.sender === "maya"
                ? "bg-purple-100 text-purple-700"
                : "bg-primary text-primary-foreground"
            )}
          >
            {message.sender === "maya" ? <Bot className="size-4" /> : "JD"}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  )
}