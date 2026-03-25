export const maxDuration = 30

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

Be concise, helpful, and encouraging. If you don't know something specific (like exact pricing), direct them to express interest via the Google Form or contact support@aibuilder.space.

Always maintain a positive, excited tone about helping people learn AI and build real products. Keep responses short and to the point.`

interface Message {
  role: "user" | "assistant"
  content: string
}

export async function POST(req: Request) {
  const { messages }: { messages: Message[] } = await req.json()

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return Response.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 })
  }

  // Format messages for Gemini API
  const contents = messages.map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }))

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents,
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
        }),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      console.error("Gemini API error:", error)
      return Response.json({ error: "Failed to get response from AI" }, { status: 500 })
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't generate a response."

    return Response.json({ message: text })
  } catch (error) {
    console.error("Chat API error:", error)
    return Response.json({ error: "Failed to process request" }, { status: 500 })
  }
}
