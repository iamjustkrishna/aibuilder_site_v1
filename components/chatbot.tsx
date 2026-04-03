"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

// Generate a unique session ID
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string>("")
  const [messageCount, setMessageCount] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initialize or restore session ID
  useEffect(() => {
    const storedSessionId = localStorage.getItem("chatbot_session_id")
    if (storedSessionId) {
      setSessionId(storedSessionId)
    } else {
      const newSessionId = generateSessionId()
      localStorage.setItem("chatbot_session_id", newSessionId)
      setSessionId(newSessionId)
    }
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Proactive questions based on conversation progress
  const getProactiveQuestions = () => {
    if (messages.length === 0) {
      return ["What will I learn?", "Do I need coding experience?", "How do I earn 100%?"]
    }
    
    const lastMessage = messages[messages.length - 1]?.content.toLowerCase() || ""
    
    if (lastMessage.includes("curriculum") || lastMessage.includes("week")) {
      return ["Tell me about Week 2", "What tools will I use?", "Are sessions recorded?"]
    }
    if (lastMessage.includes("pricing") || lastMessage.includes("tier") || lastMessage.includes("architect")) {
      return ["What's in Builder tier?", "How does earning work?", "Can I upgrade later?"]
    }
    if (lastMessage.includes("earn") || lastMessage.includes("store") || lastMessage.includes("100%")) {
      return ["What can I build?", "When can I start earning?", "How do I set prices?"]
    }
    if (lastMessage.includes("coding") || lastMessage.includes("beginner") || lastMessage.includes("experience")) {
      return ["What tools are taught?", "Is there support?", "How long are sessions?"]
    }
    
    // Default follow-up questions
    return ["Tell me about pricing", "What's the schedule?", "How do I join?"]
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading || !sessionId) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          sessionId,
        }),
      })

      if (!response.ok) throw new Error("Failed to get response")

      const data = await response.json()
      
      setMessageCount(data.messageCount || messageCount + 1)
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message || "Sorry, I couldn't process that request.",
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Chat error:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, something went wrong. Please try again or contact support@aibuilder.space",
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickQuestion = async (question: string) => {
    if (isLoading || !sessionId) return
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: question,
    }
    
    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          sessionId,
        }),
      })

      const data = await response.json()
      
      setMessageCount(data.messageCount || messageCount + 1)
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message || "Sorry, I couldn't process that request.",
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, something went wrong. Please try again.",
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      setInput("")
    }
  }

  const clearChat = () => {
    const newSessionId = generateSessionId()
    localStorage.setItem("chatbot_session_id", newSessionId)
    setSessionId(newSessionId)
    setMessages([])
    setMessageCount(0)
  }

  return (
    <>
      {/* Chat Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-[#FF6B34] to-[#FFD13F] text-white shadow-lg shadow-[#FF6B34]/30 flex items-center justify-center hover:scale-110 transition-transform"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-48px)] h-[500px] max-h-[calc(100vh-150px)] bg-white rounded-2xl shadow-2xl border border-[#E8E3F3] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-[#2D1A69] to-[#492B8C] text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">AI Builder Assistant</h3>
                    <p className="text-xs text-white/70">Powered by Gemini</p>
                  </div>
                </div>
                {messages.length > 0 && (
                  <button 
                    onClick={clearChat}
                    className="text-xs text-white/70 hover:text-white transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
              
              {/* Context indicator */}
              {messageCount > 0 && messageCount % 3 === 0 && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-white/80 bg-white/10 rounded-full px-2 py-1 w-fit">
                  <Sparkles className="w-3 h-3" />
                  <span>Context saved</span>
                </div>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F4F1FB]/50">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-[#F4F1FB] flex items-center justify-center mx-auto mb-4">
                    <Bot className="w-8 h-8 text-[#492B8C]" />
                  </div>
                  <p className="text-[#1A0A3D] font-medium mb-2">Welcome to AI Builder Cohort!</p>
                  <p className="text-[#6B5B9E] text-sm">
                    Ask me about the curriculum, pricing, or anything else about the program.
                  </p>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-[#492B8C] flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                      message.role === "user"
                        ? "bg-[#FF6B34] text-white rounded-tr-sm"
                        : "bg-white border border-[#E8E3F3] text-[#1A0A3D] rounded-tl-sm"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                  {message.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-[#F4F1FB] flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-[#492B8C]" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-2 justify-start">
                  <div className="w-8 h-8 rounded-full bg-[#492B8C] flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white border border-[#E8E3F3] rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-[#492B8C] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-[#492B8C] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-[#492B8C] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Proactive follow-up questions */}
              {messages.length > 0 && !isLoading && (
                <div className="pt-2">
                  <p className="text-xs text-[#6B5B9E] mb-2">Suggested questions:</p>
                  <div className="flex flex-wrap gap-2">
                    {getProactiveQuestions().map((q) => (
                      <button
                        key={q}
                        onClick={() => handleQuickQuestion(q)}
                        disabled={isLoading}
                        className="px-3 py-1.5 text-xs rounded-full bg-white border border-[#E8E3F3] text-[#492B8C] hover:bg-[#492B8C] hover:text-white transition-colors disabled:opacity-50"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Initial questions */}
              {messages.length === 0 && (
                <div className="flex flex-wrap gap-2 justify-center mt-4">
                  {getProactiveQuestions().map((q) => (
                    <button
                      key={q}
                      onClick={() => handleQuickQuestion(q)}
                      disabled={isLoading}
                      className="px-3 py-1.5 text-xs rounded-full bg-white border border-[#E8E3F3] text-[#492B8C] hover:bg-[#492B8C] hover:text-white transition-colors disabled:opacity-50"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-[#E8E3F3] bg-white">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question..."
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 rounded-full bg-[#F4F1FB] border border-[#E8E3F3] text-[#1A0A3D] placeholder:text-[#6B5B9E] text-sm focus:outline-none focus:ring-2 focus:ring-[#492B8C] focus:border-transparent disabled:opacity-50"
                />
                <Button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="w-10 h-10 rounded-full bg-[#FF6B34] hover:bg-[#FF6B34]/90 text-white p-0 disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
