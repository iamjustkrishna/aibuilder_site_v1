import { createClient } from "@supabase/supabase-js"

export const maxDuration = 30

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// AI Builder Cohort FAQ context for the chatbot
const systemPrompt = `You are the AI Builder Cohort Assistant, a helpful and friendly AI that answers questions about the AI Builder Cohort program.

About the AI Builder Cohort (Season 01):
- A 4-week program that teaches you to build AI apps and agents from scratch
- 2-3 live classes per week, plus 2-4 recorded project videos each week
- All sessions are recorded for replay within 24 hours
- No coding experience required - designed for mixed audiences from beginners to experienced developers

Two Tiers:
1. Standard Tier - For learners who want to explore and learn AI development
2. Contributor Tier - Includes everything in Standard PLUS access to our AI Store where you can:
   - Upload your finished AI products
   - Set your own prices (free, one-time, or subscription)
   - Keep 100% of your earnings - no platform fees, no commissions

4-Week Curriculum:
- Week 1: Understand AI - Foundation concepts, prompting, AI landscape
- Week 2: Build AI App - Create working AI applications using tools like v0, Cursor, Claude
- Week 3: Build Agents - Agentic workflows, autonomous systems, advanced patterns
- Week 4: Launch - Deploy, monetize, and publish on AI Store

Tools Covered: v0.app, Cursor, Claude, ChatGPT, Replit, Bolt.new, LangChain, n8n, Supabase, and more

Key Points:
- Contributors can start earning from platform launch day
- Founding cohort Contributors get priority placement
- Refund available within the first week if it's not working out
- Can upgrade from Standard to Contributor anytime
- Support email: support@aibuilder.space

WhatsApp Community: Available for all participants

RESPONSE GUIDELINES:
- Keep answers SHORT and CONCISE - match response length to the question complexity
- For simple questions (yes/no, single facts), give 1-2 sentence answers
- For complex questions, give structured but brief answers (3-5 sentences max)
- NEVER give unnecessarily long answers for short queries
- Be direct, helpful, and encouraging
- If you don't know something specific (like exact pricing), direct them to support@aibuilder.space

IMPORTANT: Be proactive! After answering, suggest ONE relevant follow-up question. For example:
- If they ask about the curriculum, ask if they want to know about any specific week
- If they ask about pricing, ask about their experience level or goals
- If they ask about earning, ask about what kind of AI product they want to build`

interface Message {
  role: "user" | "assistant"
  content: string
}

// Generate summary using Groq
async function generateSummary(messages: Message[], apiKey: string): Promise<string> {
  const conversationText = messages.map(m => `${m.role}: ${m.content}`).join("\n")

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "You are a summarizer. Be extremely brief - 2 sentences max."
          },
          {
            role: "user",
            content: `Summarize the user's interests from this chat in 2 sentences:\n\n${conversationText}`
          }
        ],
        temperature: 0.3,
        max_tokens: 100,
      }),
    })

    if (!response.ok) {
      console.error("Summary generation failed:", await response.text())
      return ""
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || ""
  } catch (error) {
    console.error("Summary generation error:", error)
    return ""
  }
}

export async function POST(req: Request) {
  const { messages, sessionId }: { messages: Message[], sessionId: string } = await req.json()

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return Response.json({ error: "GROQ_API_KEY not configured" }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Get existing session context
  let existingSummary = ""
  let messageCount = 0

  const { data: sessionData } = await supabase
    .from("chat_sessions")
    .select("summary, message_count, messages")
    .eq("session_id", sessionId)
    .single()

  if (sessionData) {
    existingSummary = sessionData.summary || ""
    messageCount = sessionData.message_count || 0
  }

  // Build context with previous summary if exists
  let contextPrefix = ""
  if (existingSummary) {
    contextPrefix = `Previous conversation context: ${existingSummary}\n\nContinuing conversation:\n`
  }

  // Format messages for Groq API (OpenAI-compatible format)
  const groqMessages = [
    { role: "system", content: systemPrompt },
    ...messages.map((msg) => ({
      role: msg.role,
      content: msg.role === "user" && messages.indexOf(msg) === 0 && contextPrefix
        ? contextPrefix + msg.content
        : msg.content,
    })),
  ]

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: groqMessages,
        temperature: 0.7,
        max_tokens: 1024,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error("Groq API error:", error)
      return Response.json({ error: "Failed to get response from AI" }, { status: 500 })
    }

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response."

    // Update message count
    const newMessageCount = messageCount + 1
    const allMessages = [...messages, { role: "assistant" as const, content: text }]

    // Generate summary every 3 messages
    let newSummary = existingSummary
    if (newMessageCount % 3 === 0) {
      newSummary = await generateSummary(allMessages, apiKey)
    }

    // Upsert session data
    await supabase
      .from("chat_sessions")
      .upsert({
        session_id: sessionId,
        messages: allMessages,
        summary: newSummary,
        message_count: newMessageCount,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "session_id"
      })

    return Response.json({
      message: text,
      messageCount: newMessageCount
    })
  } catch (error) {
    console.error("Chat API error:", error)
    return Response.json({ error: "Failed to process request" }, { status: 500 })
  }
}
