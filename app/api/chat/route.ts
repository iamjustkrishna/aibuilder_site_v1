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

Three Tiers:
1. Foundational Tier - For beginners who want to learn AI through live sessions and recordings
2. Builder Tier - Everything in Foundational PLUS 1-on-1 mentor support, code reviews, and priority Q&A
3. Architect Tier - Everything in Builder PLUS access to our AI Store where you can:
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
- Architects can start earning from platform launch day
- Founding cohort Architects get priority placement
- Refund available within the first week if it's not working out
- Can upgrade from Foundational to Builder or Architect anytime
- Support email: support@aibuilder.space

WhatsApp Community: Available for all participants

RESPONSE GUIDELINES:
- Keep answers SHORT and CONCISE - match response length to the question complexity
- For simple questions (yes/no, single facts), give 1-2 sentence answers
- For complex questions, give structured but brief answers (3-5 sentences max)
- NEVER give unnecessarily long answers for short queries
- Be direct, helpful, and encouraging
- If you don't know something specific (like exact pricing), direct them to support@aibuilder.space

IMPORTANT: Be proactive! After answering, suggest ONE relevant follow-up question.

CRITICAL: You MUST end every response with a JSON block containing insights about the user. Format:
###USER_INSIGHTS###
{"interest_level": "high/medium/low", "experience": "beginner/intermediate/advanced/unknown", "interested_in": ["curriculum", "pricing", "earning", "tools", "other"], "potential_tier": "foundational/builder/architect/undecided", "key_questions": ["brief question 1"], "notes": "one line about what they seem to want"}
###END_INSIGHTS###

This JSON block will be parsed and removed from the visible response. Always include it.`

interface Message {
  role: "user" | "assistant"
  content: string
}

interface UserInsights {
  interest_level?: string
  experience?: string
  interested_in?: string[]
  potential_tier?: string
  key_questions?: string[]
  notes?: string
}

function parseInsights(text: string): { cleanText: string; insights: UserInsights | null } {
  const insightsMatch = text.match(/###USER_INSIGHTS###\s*([\s\S]*?)\s*###END_INSIGHTS###/)
  
  if (!insightsMatch) {
    return { cleanText: text, insights: null }
  }

  const cleanText = text.replace(/###USER_INSIGHTS###[\s\S]*?###END_INSIGHTS###/, "").trim()
  
  try {
    const insights = JSON.parse(insightsMatch[1].trim())
    return { cleanText, insights }
  } catch {
    return { cleanText, insights: null }
  }
}

export async function POST(req: Request) {
  const { messages, sessionId }: { messages: Message[], sessionId: string } = await req.json()

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return Response.json({ error: "GROQ_API_KEY not configured" }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Get existing session data
  let existingInsights: UserInsights = {}
  const { data: sessionData } = await supabase
    .from("chat_sessions")
    .select("summary, message_count")
    .eq("session_id", sessionId)
    .single()

  if (sessionData?.summary) {
    try {
      existingInsights = JSON.parse(sessionData.summary)
    } catch {
      existingInsights = {}
    }
  }

  // Add context about previous insights if available
  let contextNote = ""
  if (Object.keys(existingInsights).length > 0) {
    contextNote = `\n\nPrevious user context: ${JSON.stringify(existingInsights)}`
  }

  // Format messages for Groq API
  const groqMessages = [
    { role: "system", content: systemPrompt + contextNote },
    ...messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
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
    const rawText = data.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response."

    // Parse insights from response
    const { cleanText, insights } = parseInsights(rawText)

    // Merge new insights with existing ones
    if (insights) {
      const mergedInsights: UserInsights = {
        ...existingInsights,
        ...insights,
        interested_in: [...new Set([...(existingInsights.interested_in || []), ...(insights.interested_in || [])])],
        key_questions: [...(existingInsights.key_questions || []), ...(insights.key_questions || [])].slice(-5),
      }

      // Save to database
      const messageCount = (sessionData?.message_count || 0) + 1
      
      await supabase
        .from("chat_sessions")
        .upsert({
          session_id: sessionId,
          summary: JSON.stringify(mergedInsights),
          message_count: messageCount,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "session_id"
        })
    }

    return Response.json({
      message: cleanText,
    })
  } catch (error) {
    console.error("Chat API error:", error)
    return Response.json({ error: "Failed to process request" }, { status: 500 })
  }
}
