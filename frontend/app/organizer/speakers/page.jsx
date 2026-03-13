'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic, Plus, Trash2, Edit3, Clock, User, X,
  Calendar, GripVertical, Save, ChevronDown, ChevronUp,
  Users, MapPin,
} from 'lucide-react'

const TALK_TYPES = ['Keynote', 'Workshop', 'Panel Discussion', 'Lightning Talk', 'Networking', 'Break', 'Q&A Session', 'Demo']

function SpeakerCard({ speaker, onEdit, onDelete }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-400 to-violet-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
          {speaker.name?.charAt(0)?.toUpperCase() || 'S'}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-slate-900 truncate">{speaker.name}</h3>
          <p className="text-sm text-slate-500 truncate">{speaker.title} · {speaker.organization}</p>
          {speaker.bio && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{speaker.bio}</p>}
          {speaker.topic && (
            <span className="mt-2 inline-block bg-indigo-50 text-indigo-700 rounded-full px-2.5 py-0.5 text-xs font-medium">
              🎤 {speaker.topic}
            </span>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => onEdit(speaker)} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-100">
            <Edit3 className="h-4 w-4" />
          </button>
          <button onClick={() => onDelete(speaker.id)} className="rounded-lg border border-rose-200 p-2 text-rose-500 hover:bg-rose-50">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function ScheduleItem({ item, index, onDelete, onEdit }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
    >
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <GripVertical className="h-4 w-4 text-slate-300 shrink-0" />
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-slate-500 bg-slate-100 rounded px-2 py-0.5">{item.time || '--:--'}</span>
          <span className="text-xs font-medium text-indigo-700 bg-indigo-50 rounded px-2 py-0.5">{item.type || 'Session'}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 text-sm truncate">{item.title || 'Untitled Session'}</p>
          {item.speaker && <p className="text-xs text-slate-500">{item.speaker}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {item.duration && <span className="text-xs text-slate-400">{item.duration} min</span>}
          {expanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-100 px-4 py-3 bg-slate-50"
          >
            {item.description && <p className="text-sm text-slate-600 mb-3">{item.description}</p>}
            {item.location && (
              <p className="text-xs text-slate-500 flex items-center gap-1 mb-2">
                <MapPin className="h-3 w-3" /> {item.location}
              </p>
            )}
            <div className="flex gap-2">
              <button onClick={() => onEdit(item, index)} className="text-xs text-indigo-600 hover:underline">Edit</button>
              <button onClick={() => onDelete(index)} className="text-xs text-rose-600 hover:underline">Remove</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function SpeakerModal({ speaker, onClose, onSave }) {
  const [form, setForm] = useState(speaker || { name: '', title: '', organization: '', bio: '', topic: '', email: '' })

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-slate-900">{speaker?.id ? 'Edit Speaker' : 'Add Speaker'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3">
          {[
            { key: 'name', label: 'Full Name *', placeholder: 'e.g., Dr. Priya Sharma' },
            { key: 'title', label: 'Title / Designation', placeholder: 'e.g., Professor of Computer Science' },
            { key: 'organization', label: 'Organization', placeholder: 'e.g., IIT Bombay' },
            { key: 'topic', label: 'Talk Topic', placeholder: 'e.g., Future of AI in Education' },
            { key: 'email', label: 'Email', placeholder: 'speaker@example.com' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="text-xs font-medium text-slate-700 mb-1 block">{label}</label>
              <input
                type="text"
                value={form[key] || ''}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
          ))}
          <div>
            <label className="text-xs font-medium text-slate-700 mb-1 block">Bio</label>
            <textarea
              rows={2}
              value={form.bio || ''}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              placeholder="Brief bio..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none"
            />
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-5">
          <button onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">Cancel</button>
          <button
            onClick={() => { onSave({ ...form, id: form.id || Date.now().toString() }); onClose() }}
            disabled={!form.name?.trim()}
            className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4 inline mr-1" /> Save Speaker
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function ScheduleModal({ item, onClose, onSave }) {
  const [form, setForm] = useState(item || { title: '', type: 'Keynote', time: '', duration: 30, speaker: '', description: '', location: '' })

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-slate-900">{item?.title ? 'Edit Session' : 'Add Schedule Item'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-700 mb-1 block">Start Time</label>
              <input type="time" value={form.time || ''} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 mb-1 block">Duration (min)</label>
              <input type="number" value={form.duration || ''} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200" placeholder="30" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700 mb-1 block">Session Title *</label>
            <input type="text" value={form.title || ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g., Opening Keynote" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700 mb-1 block">Session Type</label>
            <select value={form.type || ''} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200">
              {TALK_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          {[
            { key: 'speaker', label: 'Speaker Name', placeholder: 'Dr. Priya Sharma' },
            { key: 'location', label: 'Room / Hall', placeholder: 'Main Auditorium' },
            { key: 'description', label: 'Description', placeholder: 'Brief session description...' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="text-xs font-medium text-slate-700 mb-1 block">{label}</label>
              <input type="text" value={form[key] || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200" />
            </div>
          ))}
        </div>
        <div className="flex gap-3 justify-end mt-5">
          <button onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">Cancel</button>
          <button
            onClick={() => { onSave({ ...form, id: form.id || Date.now().toString() }); onClose() }}
            disabled={!form.title?.trim()}
            className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4 inline mr-1" /> Save Session
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function SpeakersSchedulePage() {
  const [speakers, setSpeakers] = useState([])
  const [schedule, setSchedule] = useState([])
  const [activeTab, setActiveTab] = useState('speakers')
  const [speakerModal, setSpeakerModal] = useState(null)  // null | {} | speakerObj
  const [scheduleModal, setScheduleModal] = useState(null)
  const [editScheduleIndex, setEditScheduleIndex] = useState(null)

  function saveSpeaker(speaker) {
    setSpeakers(prev => {
      const idx = prev.findIndex(s => s.id === speaker.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = speaker; return next }
      return [...prev, speaker]
    })
  }

  function deleteSpeaker(id) { setSpeakers(prev => prev.filter(s => s.id !== id)) }

  function saveScheduleItem(item) {
    setSchedule(prev => {
      if (editScheduleIndex !== null) {
        const next = [...prev]; next[editScheduleIndex] = item; return next
      }
      return [...prev, item].sort((a, b) => (a.time || '').localeCompare(b.time || ''))
    })
    setEditScheduleIndex(null)
  }

  function deleteScheduleItem(index) { setSchedule(prev => prev.filter((_, i) => i !== index)) }

  function editScheduleItem(item, index) { setEditScheduleIndex(index); setScheduleModal(item) }

  return (
    <div className="space-y-6 p-6 xl:p-8">
      {/* Header */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg">
            <Mic className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Speakers & Schedule</h1>
            <p className="text-sm text-slate-500">Manage your event speakers, sessions, and agenda</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: Users, label: 'Speakers', value: speakers.length, color: 'text-violet-600', bg: 'bg-violet-50' },
          { icon: Calendar, label: 'Sessions', value: schedule.length, color: 'text-blue-600', bg: 'bg-blue-50' },
          { icon: Clock, label: 'Total Duration', value: `${schedule.reduce((sum, s) => sum + (Number(s.duration) || 0), 0)} min`, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm text-center">
            <div className={`h-9 w-9 mx-auto rounded-xl ${bg} flex items-center justify-center mb-2`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {['speakers', 'schedule'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-lg px-5 py-2 text-sm font-semibold capitalize transition-colors ${
              activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab === 'speakers' ? '🎤 Speakers' : '📅 Schedule'}
          </button>
        ))}
      </div>

      {/* Speakers Tab */}
      {activeTab === 'speakers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">{speakers.length} speaker{speakers.length !== 1 ? 's' : ''} added</p>
            <button
              onClick={() => setSpeakerModal({})}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" /> Add Speaker
            </button>
          </div>
          {speakers.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
              <Mic className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="font-semibold text-slate-500">No speakers yet</p>
              <p className="text-sm text-slate-400 mt-1">Click "Add Speaker" to start building your lineup</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              <AnimatePresence>
                {speakers.map(speaker => (
                  <SpeakerCard key={speaker.id} speaker={speaker} onEdit={s => setSpeakerModal(s)} onDelete={deleteSpeaker} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* Schedule Tab */}
      {activeTab === 'schedule' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">{schedule.length} session{schedule.length !== 1 ? 's' : ''} scheduled</p>
            <button
              onClick={() => { setScheduleModal({}); setEditScheduleIndex(null) }}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" /> Add Session
            </button>
          </div>
          {schedule.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
              <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="font-semibold text-slate-500">No sessions scheduled yet</p>
              <p className="text-sm text-slate-400 mt-1">Click "Add Session" to build your event agenda</p>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {schedule.map((item, i) => (
                  <ScheduleItem key={item.id || i} item={item} index={i} onDelete={deleteScheduleItem} onEdit={editScheduleItem} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {speakerModal !== null && (
          <SpeakerModal
            speaker={speakerModal?.id ? speakerModal : null}
            onClose={() => setSpeakerModal(null)}
            onSave={saveSpeaker}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {scheduleModal !== null && (
          <ScheduleModal
            item={scheduleModal?.id ? scheduleModal : null}
            onClose={() => { setScheduleModal(null); setEditScheduleIndex(null) }}
            onSave={saveScheduleItem}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
