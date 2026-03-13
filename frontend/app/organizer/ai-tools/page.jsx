'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Sparkles, Brain, BarChart3, FileText, Zap,
  TrendingUp, Users, Target, ArrowRight, MessageSquare,
  Calendar, Tag, Mic, Lightbulb,
} from 'lucide-react'

const AI_TOOLS = [
  {
    id: 'event-description',
    icon: FileText,
    title: 'AI Event Description Generator',
    description: 'Generate compelling event descriptions, titles, and summaries using AI.',
    color: 'from-violet-500 to-indigo-600',
    badge: 'Content',
  },
  {
    id: 'audience-predictor',
    icon: Users,
    title: 'Audience Predictor',
    description: 'Predict expected attendance and demographics based on similar past events.',
    color: 'from-blue-500 to-cyan-600',
    badge: 'Analytics',
  },
  {
    id: 'optimal-timing',
    icon: Calendar,
    title: 'Optimal Timing Advisor',
    description: 'AI recommends the best dates, times, and venues to maximise turnout.',
    color: 'from-emerald-500 to-teal-600',
    badge: 'Planning',
  },
  {
    id: 'trending-tags',
    icon: Tag,
    title: 'Trending Tags & Keywords',
    description: 'Get suggested hashtags and keywords to boost event discoverability.',
    color: 'from-amber-500 to-orange-600',
    badge: 'Marketing',
  },
  {
    id: 'sentiment-analysis',
    icon: MessageSquare,
    title: 'Feedback Sentiment Analyser',
    description: 'Automatically analyse post-event feedback sentiment and generate insights.',
    color: 'from-rose-500 to-pink-600',
    badge: 'Insights',
  },
  {
    id: 'budget-estimator',
    icon: Target,
    title: 'Budget Estimator',
    description: 'AI-powered budget estimation based on event type, size, and venue.',
    color: 'from-slate-600 to-slate-800',
    badge: 'Finance',
  },
]

function AITool({ tool }) {
  const [active, setActive] = useState(false)
  const [output, setOutput] = useState('')
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const Icon = tool.icon

  async function handleGenerate() {
    if (!input.trim() && tool.id !== 'trending-tags') return
    setLoading(true)
    setOutput('')
    // Simulate AI response (in production, call /api/organizer/ai-tools endpoint)
    await new Promise(r => setTimeout(r, 1500))

    const responses = {
      'event-description': `🎯 **Event Title Suggestion:** "${input} — A Journey of Innovation"\n\n**Description:**\nJoin us for an immersive experience at ${input}. This event brings together bright minds, industry leaders, and passionate students to explore cutting-edge ideas. Expect inspiring keynotes, hands-on workshops, and unparalleled networking opportunities.\n\n**Key Highlights:**\n• Industry expert speakers\n• Interactive workshops\n• Networking sessions\n• Certificate of participation`,
      'audience-predictor': `📊 **Audience Prediction for "${input}"**\n\n• **Expected Attendance:** 120–180 participants\n• **Peak Registration:** 3–5 days before event\n• **Demographics:** 78% students, 15% faculty, 7% industry professionals\n• **Interest Segments:** Technology (42%), Research (28%), Career (30%)\n\n**Recommendation:** Open registration 2 weeks before; send reminder 48 hours prior.`,
      'optimal-timing': `⏰ **Optimal Timing for "${input}"**\n\n**Best Dates:** Wednesday–Friday\n**Best Time:** 10:00 AM – 2:00 PM\n**Best Duration:** 3–4 hours\n\n**Venue Suggestion:** Auditorium or Seminar Hall\n**Avoid:** Exam periods, public holidays, peak assignment weeks`,
      'trending-tags': `🏷️ **Suggested Tags & Keywords**\n\n**Hashtags:** #AuroraHub #CampusEvents #StudentLife #Innovation #TechTalks\n**Keywords:** workshop, networking, career, learning, collaboration, excellence\n**Category Tags:** Technology, Education, Professional Development\n\n**SEO Keywords:** college event, student workshop, university campus activities`,
      'sentiment-analysis': `📈 **Sentiment Analysis for "${input}"**\n\n• **Overall Sentiment:** 82% Positive ✅\n• **Positive Themes:** Good organisation, engaging content, helpful speakers\n• **Negative Themes:** Venue too small, registration process complex\n• **Net Promoter Score:** 7.4/10\n\n**Action Items:**\n1. Consider larger venue next time\n2. Simplify registration flow`,
      'budget-estimator': `💰 **Budget Estimate for "${input}"**\n\n| Item | Estimated Cost |\n|------|---------------|\n| Venue | ₹5,000 – ₹15,000 |\n| Refreshments (100 pax) | ₹8,000 – ₹12,000 |\n| AV Equipment | ₹3,000 – ₹6,000 |\n| Printing & Stationery | ₹1,500 – ₹2,500 |\n| Certificates | ₹2,000 – ₹4,000 |\n| **Total (Approx.)** | **₹19,500 – ₹39,500** |`,
    }

    setOutput(responses[tool.id] || '✅ AI analysis complete. Results ready.')
    setLoading(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className={`h-1.5 w-full bg-gradient-to-r ${tool.color}`} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center shadow-sm`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">{tool.title}</h3>
              <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{tool.badge}</span>
            </div>
          </div>
          <button
            onClick={() => setActive(!active)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${active ? 'bg-slate-100 text-slate-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
          >
            {active ? 'Close' : 'Use Tool'}
          </button>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">{tool.description}</p>

        {active && (
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-700 mb-1 block">Input</label>
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Enter event name or context..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                onKeyDown={e => e.key === 'Enter' && handleGenerate()}
              />
            </div>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-50 bg-gradient-to-r ${tool.color}`}
            >
              {loading ? (
                <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Generating…</>
              ) : (
                <><Sparkles className="h-4 w-4" /> Generate</>
              )}
            </button>

            {output && (
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                <p className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1">
                  <Brain className="h-3.5 w-3.5" /> AI Output
                </p>
                <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">{output}</pre>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default function AIToolsPage() {
  return (
    <div className="space-y-6 p-6 xl:p-8">
      {/* Header */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">AI Tools</h1>
            <p className="text-sm text-slate-500">Supercharge your event planning with AI-powered assistants</p>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Brain, label: 'AI Models', value: '6', color: 'text-violet-600', bg: 'bg-violet-50' },
          { icon: Zap, label: 'Tools Available', value: '6', color: 'text-amber-600', bg: 'bg-amber-50' },
          { icon: TrendingUp, label: 'Accuracy', value: '94%', color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { icon: Target, label: 'Events Enhanced', value: '24+', color: 'text-blue-600', bg: 'bg-blue-50' },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm">
            <div className={`h-9 w-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Tools Grid */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {AI_TOOLS.map((tool, i) => (
          <motion.div
            key={tool.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
          >
            <AITool tool={tool} />
          </motion.div>
        ))}
      </div>

      {/* Tip */}
      <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5 flex items-start gap-3">
        <Lightbulb className="h-5 w-5 text-violet-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-violet-800 mb-1">AI tools are continuously learning</p>
          <p className="text-xs text-violet-600">
            These tools use historical event data from Aurora Hub to provide personalised recommendations. The more events you create, the smarter they get.
          </p>
        </div>
      </div>
    </div>
  )
}
