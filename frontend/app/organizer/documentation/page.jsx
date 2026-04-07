'use client'

import React from 'react'
import { 
  FileText, 
  Bot, 
  Database, 
  Sparkles, 
  FileEdit, 
  Mail, 
  FileDown, 
  Brain, 
  Users,
  ArrowDown,
  Wand2,
  CheckCircle2
} from 'lucide-react'
import { motion } from 'framer-motion'

const features = [
  { icon: Bot, label: 'Chatbot-driven documentation', color: 'indigo' },
  { icon: Database, label: 'Auto-fetch data (registrations, attendance, winners)', color: 'blue' },
  { icon: Sparkles, label: 'AI-generated structured report', color: 'violet' },
  { icon: FileEdit, label: 'Editable Word-like editor', color: 'emerald' },
  { icon: Mail, label: 'Gmail integration (pre-filled mail)', color: 'rose' },
  { icon: FileDown, label: 'Export as PDF / Word', color: 'slate' },
  { icon: Brain, label: 'AI text improvement (rewrite, summary)', color: 'amber' },
  { icon: Users, label: 'Multi-recipient sharing', color: 'cyan' },
]

const flowSteps = [
  { step: 1, label: 'Open Documentation Page', icon: FileText },
  { step: 2, label: 'Start Chatbot 🤖', icon: Bot },
  { step: 3, label: 'Chatbot asks details (remarks, summary, etc.)', icon: Wand2 },
  { step: 4, label: 'System fetches DB data', icon: Database },
  { step: 5, label: 'AI generates report', icon: Sparkles },
  { step: 6, label: 'Opens in Editor (user can edit)', icon: FileEdit },
  { step: 7, label: 'Action (Gmail, PDF, Word)', icon: CheckCircle2 },
]

const colorMap = {
  indigo: 'bg-indigo-50 text-indigo-600',
  blue: 'bg-blue-50 text-blue-600',
  violet: 'bg-violet-50 text-violet-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  rose: 'bg-rose-50 text-rose-600',
  slate: 'bg-slate-50 text-slate-600',
  amber: 'bg-amber-50 text-amber-600',
  cyan: 'bg-cyan-50 text-cyan-600',
}

export default function DocumentationPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-12 pb-20">
      {/* Header Section */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-widest border border-indigo-100">
          <Sparkles className="h-3 w-3" />
          Feature Roadmap
        </div>
        <h1 className="text-4xl font-black tracking-tight text-slate-900">
          ADDING SOON <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">AI DOCUMENTATION FEATURE</span>
        </h1>
        <p className="text-slate-500 max-w-2xl mx-auto text-lg leading-relaxed">
          Unlock the future of event reporting with our upcoming AI-powered documentation suite for Aurora Hub organizers.
        </p>
      </motion.header>

      {/* Features Grid */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-1 bg-indigo-600 rounded-full" />
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="text-emerald-500">🟢</span> FEATURES
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div 
                key={feature.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="group relative bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform ${colorMap[feature.color]}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="font-semibold text-slate-800 leading-snug">{feature.label}</p>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </div>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* Flow Section */}
      <section className="space-y-8 bg-slate-50/50 rounded-[3rem] p-8 md:p-12 border border-slate-200/50 shadow-inner">
        <div className="flex flex-col items-center gap-2 mb-8 text-center">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <span className="text-indigo-500">🔄</span> EXPECTED FLOW
            </h2>
            <p className="text-sm text-slate-500">From opening the page to finalizing your report</p>
        </div>

        <div className="flex flex-col items-center">
          {flowSteps.map((step, index) => {
            const Icon = step.icon
            const isLast = index === flowSteps.length - 1
            
            return (
              <React.Fragment key={step.step}>
                <motion.div 
                   initial={{ opacity: 0, x: -20 }}
                   whileInView={{ opacity: 1, x: 0 }}
                   viewport={{ once: true }}
                   className="flex items-center gap-6 w-full max-w-xl group"
                >
                  <div className="relative">
                    <div className="h-14 w-14 rounded-full bg-white border-2 border-indigo-100 flex items-center justify-center shadow-md group-hover:border-indigo-400 group-hover:shadow-indigo-100 transition-all z-10 relative">
                       <span className="absolute -top-1 -left-1 h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                         {step.step}
                       </span>
                       <Icon className="h-6 w-6 text-indigo-600 group-hover:scale-110 transition-transform" />
                    </div>
                  </div>
                  <div className="flex-1 bg-white border border-slate-100 p-4 rounded-2xl shadow-sm group-hover:shadow-md transition-all">
                    <p className="font-bold text-slate-900">{step.label}</p>
                  </div>
                </motion.div>
                {!isLast && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    whileInView={{ opacity: 1, height: 'auto' }}
                    viewport={{ once: true }}
                    className="py-1 flex flex-col items-center"
                  >
                    <ArrowDown className="h-10 w-10 text-slate-200" />
                  </motion.div>
                )}
              </React.Fragment>
            )
          })}
        </div>
      </section>

      {/* Footer / CTA Section */}
      <footer className="text-center p-8 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl text-white shadow-xl">
        <h3 className="text-xl font-bold mb-2">Ready for a faster workflow?</h3>
        <p className="text-indigo-100/80 mb-6 text-sm">We are working hard to bring these features to you by next week.</p>
        <button className="px-6 py-3 bg-white text-indigo-600 rounded-full font-bold shadow-lg hover:scale-105 transition-transform active:scale-95 flex items-center gap-2 mx-auto">
          Notify Me When Live
          <Mail className="h-4 w-4" />
        </button>
      </footer>
    </div>
  )
}
