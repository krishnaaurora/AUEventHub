'use client'

import React from 'react'
import { CheckCircle2, Pencil, Wand2, Loader2, ShieldCheck } from 'lucide-react'

export function ApprovalLetter({
  letterResult,
  setLetterResult,
  letterHistory,
  letterIndex,
  setLetterIndex,
  letterLoading,
  handleApprovalLetter,
  isEditingLetter,
  setIsEditingLetter
}) {
  if (!letterResult) return null

  return (
    <div className="mt-8">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-1.5 bg-indigo-600 rounded-full" />
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">Approval Letter</h3>
              <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-widest font-semibold">
                {isEditingLetter ? 'Editing' : 'Preview'} Â· AI Draft
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {letterHistory.length > 1 && (
              <div className="flex items-center gap-0.5 bg-indigo-50 border border-indigo-200 rounded-lg px-1 py-0.5 mr-2">
                <button
                  type="button"
                  title="Older draft"
                  onClick={() => {
                    const newIdx = letterIndex + 1
                    if (newIdx < letterHistory.length) {
                      setLetterIndex(newIdx)
                      setLetterResult(prev => ({ ...prev, letter: letterHistory[newIdx] }))
                    }
                  }}
                  disabled={letterIndex >= letterHistory.length - 1}
                  className="p-0.5 text-indigo-500 hover:bg-white rounded disabled:opacity-30 disabled:cursor-not-allowed"
                >â€¹</button>
                <span className="text-[10px] font-bold text-indigo-600 px-1.5">
                  {letterIndex + 1} / {letterHistory.length}
                </span>
                <button
                  type="button"
                  title="Newer draft"
                  onClick={() => {
                    const newIdx = letterIndex - 1
                    if (newIdx >= 0) {
                      setLetterIndex(newIdx)
                      setLetterResult(prev => ({ ...prev, letter: letterHistory[newIdx] }))
                    }
                  }}
                  disabled={letterIndex <= 0}
                  className="p-0.5 text-indigo-500 hover:bg-white rounded disabled:opacity-30 disabled:cursor-not-allowed"
                >â€º</button>
              </div>
            )}

            <button
              type="button"
              onClick={() => handleApprovalLetter()}
              disabled={letterLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-violet-200 bg-violet-50 text-violet-600 hover:bg-violet-100 transition disabled:opacity-50"
            >
              {letterLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
              Redraft
            </button>

            {isEditingLetter ? (
              <button
                type="button"
                onClick={() => setIsEditingLetter(false)}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Done
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingLetter(true)}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-sm transition"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
            )}
          </div>
        </div>

        <div className="p-6 sm:p-8 bg-white">
          {isEditingLetter ? (
            <textarea
              value={letterResult.letter}
              onChange={(e) => setLetterResult(prev => ({ ...prev, letter: e.target.value }))}
              autoFocus
              className="w-full min-h-[520px] text-sm sm:text-base text-slate-800 leading-relaxed font-mono bg-slate-50 border border-indigo-200 rounded-xl p-4 sm:p-6 outline-none focus:border-indigo-400 resize-y transition"
              spellCheck="true"
            />
          ) : (
            <div
              className="cursor-pointer rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-slate-50/50 transition-all p-4 sm:p-6 min-h-[200px]"
              onClick={() => setIsEditingLetter(true)}
              title="Click to edit"
            >
              <pre className="text-sm sm:text-base text-slate-800 whitespace-pre-wrap font-sans leading-relaxed">
                {letterResult.letter}
              </pre>
              <p className="mt-4 text-[10px] text-indigo-400 font-semibold tracking-wider uppercase">Click anywhere to edit</p>
            </div>
          )}
        </div>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center gap-2 text-[10px] text-slate-400">
          <ShieldCheck className="h-3 w-3 shrink-0" />
          This letter is ready to be sent for dean review. All edits are saved locally to this session.
        </div>
      </div>
    </div>
  )
}
