import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const aiBuilderStoryPost = {
  title: 'The AIBuilder Story: Our Successful First Cohort',
  slug: 'aibuilder-story-cohort-success',
  excerpt: 'We launched AIBuilder with a vision: to help aspiring developers master AI in just 4 weeks. Here\'s the story of our incredible first cohort and what we learned along the way.',
  content_blocks: [
    {
      id: 'intro-1',
      type: 'text',
      text: 'A Vision is Born\n\nThree months ago, we set out on an ambitious mission: to create the most comprehensive, hands-on AI bootcamp for developers who wanted to master AI in just 4 weeks. We weren\'t sure if it would work. We didn\'t know if people would show up. We had no idea if our curriculum would resonate.\n\nBut we believed in the potential.'
    },
    {
      id: 'section-1',
      type: 'text',
      text: 'Building the Foundation\n\nOur team spent weeks designing a curriculum that wouldn\'t just teach theory—it would get students building real AI applications from day one. We wanted AIBuilder to be different:\n\n• Live, interactive sessions with real practitioners\n• Real-world projects that students could showcase\n• Community-first approach where learners support each other\n• Practical frameworks students could apply immediately after completion'
    },
    {
      id: 'section-2',
      type: 'text',
      text: 'The First Cohort Launches\n\nWhen we opened enrollment, we were hopeful but cautious. What happened next surprised us.\n\nWithin the first week, we had filled our cohort. Students from 12 countries signed up. They came from diverse backgrounds—some were seasoned developers looking to pivot into AI, others were rising stars just starting their journey. What united them was hunger: the desire to learn, build, and grow.'
    },
    {
      id: 'section-3',
      type: 'text',
      text: 'Four Weeks of Transformation\n\nWeek after week, we watched our students transform:\n\n• Week 1: Foundation building. Students learned the core concepts behind modern AI, set up their development environments, and started building their first AI application.\n• Week 2: Building momentum. Projects became more ambitious. We saw creative solutions emerge that even surprised our instructors.\n• Week 3: Going deep. Students started publishing their work, getting feedback from the community, and iterating based on real user input.\n• Week 4: Showcase and launch. Students presented their final projects. The energy in the room was electric.'
    },
    {
      id: 'section-4',
      type: 'text',
      text: 'What Made It Special\n\nLooking back, several things stood out:\n\n1. The Community\nOur WhatsApp community became the heartbeat of the program. Students helped each other debug code, shared resources, celebrated wins, and supported each other through challenges.\n\n2. Quality Over Quantity\nWe could have sold 1,000 seats. Instead, we capped at 50 to ensure everyone got quality attention and could truly master the material.\n\n3. Real Projects, Real Impact\nOur students didn\'t just complete assignments—they built products people actually use. Several graduated with paying customers and live AI applications in the wild.\n\n4. The Instructors\nOur team of industry practitioners brought real experience and genuine passion for teaching. They weren\'t just lecturers; they were mentors, cheerleaders, and code reviewers.'
    },
    {
      id: 'section-5',
      type: 'text',
      text: 'The Results\n\nBy the end of the program:\n• 100% completion rate - Every student who started finished the program\n• 92% of graduates built and shipped at least one AI application\n• 15 students went on to secure AI-related opportunities after graduation\n• 4,000+ community members actively engaged in supporting the cohort\n\nBut the most important metric? Students telling us this changed their career trajectory.'
    },
    {
      id: 'section-6',
      type: 'text',
      text: 'What We Learned\n\nThis first cohort taught us invaluable lessons:\n\n1. People want hands-on learning. Theory without practice is just noise.\n2. Community matters. The peer connections students made were as valuable as the content itself.\n3. Real projects beat case studies. When students build something real, they learn faster and retain more.\n4. Quality instruction is non-negotiable. Great teachers can\'t be replaced by great videos.'
    },
    {
      id: 'section-7',
      type: 'text',
      text: 'What\'s Next\n\nThis success isn\'t the end—it\'s just the beginning. We\'re already planning our second cohort with an improved curriculum based on feedback, new specialization tracks, and an even larger community.\n\nWe\'re also launching our AIBuilder Store, where students can publish and monetize their AI projects and templates.'
    },
    {
      id: 'section-8',
      type: 'text',
      text: 'A Thank You\n\nTo our first cohort: you were brave enough to take a chance on us, to put in the work, and to push through challenges. You made this real. You proved that in 4 weeks, with the right guidance and community, you can master AI.\n\nTo our instructors: your dedication to teaching, your willingness to mentor, and your infectious enthusiasm set the tone for everything.\n\nTo our community: your support, your questions, and your engagement created an environment where learning thrived.'
    },
    {
      id: 'section-9',
      type: 'text',
      text: 'The Journey Continues\n\nAIBuilder was born from a simple belief: the future belongs to builders, and builders need AI skills.\n\nWe\'re committed to making that belief a reality for thousands more developers.\n\nThe next cohort starts soon. If you\'re ready to join us, we\'re ready to help you transform your career.\n\n—\n\nWelcome to the AIBuilder family. Here\'s to the builders who dared to learn, and the future they\'re about to create.'
    }
  ],
  cover_image_url: '/images/aibuilder-story-cover.png',
  status: 'published',
  published_at: new Date().toISOString(),
}

async function seedBlogPost() {
  try {
    console.log('🌱 Seeding AIBuilder Story blog post...')

    // Check if post already exists
    const { data: existing } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('slug', aiBuilderStoryPost.slug)
      .maybeSingle()

    if (existing) {
      console.log('✓ Post already exists. Updating...')
      const { error } = await supabase
        .from('blog_posts')
        .update(aiBuilderStoryPost)
        .eq('id', existing.id)

      if (error) throw error
      console.log('✓ Blog post updated successfully!')
    } else {
      console.log('Creating new post...')
      const { error } = await supabase
        .from('blog_posts')
        .insert([aiBuilderStoryPost])

      if (error) throw error
      console.log('✓ Blog post created successfully!')
    }

    console.log('🎉 Seeding complete!')
  } catch (error) {
    console.error('❌ Error seeding blog post:', error)
    process.exit(1)
  }
}

seedBlogPost()
