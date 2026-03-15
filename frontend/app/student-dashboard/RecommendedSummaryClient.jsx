"use client"

import { useState } from 'react'

export default function RecommendedSummaryClient({ recommendedEvents }) {
  const [selectedEvent, setSelectedEvent] = useState(recommendedEvents[0])
  const [showSkeletons] = useState(false)

  return (
    <>
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-600">AI Recommended</p>
            <h2 className="mt-2 text-2xl font-semibold">Recommended For You</h2>
            <p className="text-sm text-slate-500">
              Based on your department, past registrations, and campus trends.
            </p>
          </div>
          <button className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:border-cyan-300">
            Refresh AI
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {showSkeletons
            ? Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-60 rounded-2xl bg-slate-100/80 animate-pulse" />
              ))
            : recommendedEvents.map((event) => (
                <div
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className="group cursor-pointer rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="relative overflow-hidden rounded-2xl">
                    <img src={event.poster} alt={event.title} className="h-36 w-full object-cover" />
                    <span className="absolute left-3 top-3 rounded-full bg-cyan-600 px-3 py-1 text-[10px] font-semibold uppercase text-white">
                      AI Recommended
                    </span>
                  </div>
                  <div className="mt-4 space-y-2">
                    <h3 className="text-base font-semibold">{event.title}</h3>
                    <p className="text-xs text-slate-500">{event.venue}</p>
                    <p className="text-xs text-slate-500">{event.dateTime}</p>
                    <span className="inline-flex rounded-full bg-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-600">
                      {event.category}
                    </span>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button className="flex-1 rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-cyan-400">
                      View Details
                    </button>
                    <button className="flex-1 rounded-full bg-slate-900 px-3 py-2 text-xs font-semibold text-white">
                      Register
                    </button>
                  </div>
                </div>
              ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">AI Event Summary</h3>
          <p className="text-sm text-slate-500">Generated summary for the selected event</p>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <img
              src={selectedEvent.poster}
              alt={selectedEvent.title}
              className="h-40 w-full rounded-2xl object-cover"
            />
            <div className="mt-4 space-y-2">
              <h4 className="text-base font-semibold">{selectedEvent.title}</h4>
              <p className="text-xs text-slate-500">Organizer: {selectedEvent.organizer}</p>
              <p className="text-xs text-slate-500">Venue: {selectedEvent.venue}</p>
              <p className="text-xs text-slate-500">Date & Time: {selectedEvent.dateTime}</p>
              <p className="text-xs text-slate-600">{selectedEvent.description}</p>
            </div>

            <div className="mt-4 rounded-2xl bg-white p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-600">AI Event Summary</p>
              <p className="mt-2 text-xs text-slate-600">{selectedEvent.aiSummary}</p>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-600">
              <div>
                <p className="font-semibold text-slate-800">Guest Speakers</p>
                <p>{selectedEvent.speakers.join(', ')}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-800">Schedule Timeline</p>
                <ul className="mt-2 space-y-1">
                  {selectedEvent.schedule.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-semibold text-slate-800">Instructions</p>
                <ul className="mt-2 space-y-1">
                  {selectedEvent.instructions.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
