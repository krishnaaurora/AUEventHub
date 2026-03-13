"use client"

import { useMemo, useState } from 'react'

export default function CategoryUpcomingClient({ categories, upcomingEvents }) {
  const [selectedCategory, setSelectedCategory] = useState('All')

  const filteredUpcoming = useMemo(() => {
    if (selectedCategory === 'All') return upcomingEvents
    return upcomingEvents.filter((event) => event.category === selectedCategory)
  }, [selectedCategory, upcomingEvents])

  return (
    <>
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Filters</p>
            <h2 className="mt-2 text-2xl font-semibold">Event Categories</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className={`rounded-full px-4 py-2 text-xs font-semibold ${
                selectedCategory === 'All'
                  ? 'bg-slate-900 text-white'
                  : 'border border-slate-200 text-slate-600'
              }`}
              onClick={() => setSelectedCategory('All')}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category}
                className={`rounded-full px-4 py-2 text-xs font-semibold ${
                  selectedCategory === category
                    ? 'bg-cyan-600 text-white'
                    : 'border border-slate-200 text-slate-600'
                }`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Upcoming</p>
            <h2 className="mt-2 text-2xl font-semibold">Upcoming Events</h2>
          </div>
          <button className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600">
            View Calendar
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredUpcoming.map((event) => (
            <div
              key={event.id}
              className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="relative overflow-hidden rounded-2xl">
                <img src={event.poster} alt={event.title} className="h-36 w-full object-cover" />
              </div>
              <div className="mt-4 space-y-2">
                <h3 className="text-base font-semibold">{event.title}</h3>
                <p className="text-xs text-slate-500">{event.date}</p>
                <p className="text-xs text-slate-500">{event.venue}</p>
                <p className="text-xs text-slate-500">Organizer: {event.organizer}</p>
                <p className="text-xs font-semibold text-amber-600">Seats left: {event.seats}</p>
              </div>
              <button className="mt-4 w-full rounded-full bg-slate-900 px-3 py-2 text-xs font-semibold text-white">
                Register
              </button>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
