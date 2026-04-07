import { Wand2, Loader2, Pencil, Plus, Image as ImageIcon, X } from 'lucide-react'

export default function EventDetails({
  form,
  updateField,
  descriptionGenerated,
  aiDescLoading,
  handleGenerateDescription,
  descHistory,
  descIndex,
  descSource,
  posterProgress,
  isDragging,
  handleFileDrop,
  handleFileSelect
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
      <h2 className="text-base font-semibold text-slate-800">Event Details</h2>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Max Participants</label>
        <input
          type="number"
          min="1"
          value={form.max_participants}
          onChange={(e) => updateField('max_participants', e.target.value)}
          placeholder="e.g. 100"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:bg-white transition sm:max-w-xs"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-slate-700">
            Description <span className="text-rose-500">*</span>
          </label>
          <div className="flex items-center gap-3">
            {descHistory.length > 1 && (
              <div className="flex items-center gap-0.5 bg-indigo-50 border border-indigo-200 rounded-lg px-1 py-0.5">
                <button
                  type="button"
                  title="Previous draft"
                  onClick={() => {
                    const newIdx = descIndex + 1
                    if (newIdx < descHistory.length) {
                      updateField('description', descHistory[newIdx])
                    }
                  }}
                  disabled={descIndex >= descHistory.length - 1}
                  className="p-0.5 hover:bg-white rounded text-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed"
                >â€¹</button>
                <span className="text-[10px] font-bold text-indigo-600 px-1.5">
                  {descIndex + 1} / {descHistory.length}
                </span>
                <button
                  type="button"
                  title="Next draft"
                  onClick={() => {
                    const newIdx = descIndex - 1
                    if (newIdx >= 0) {
                      updateField('description', descHistory[newIdx])
                    }
                  }}
                  disabled={descIndex <= 0}
                  className="p-0.5 hover:bg-white rounded text-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed"
                >â€º</button>
              </div>
            )}
            <button
              type="button"
              onClick={handleGenerateDescription}
              disabled={aiDescLoading}
              className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
            >
              {aiDescLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
              {aiDescLoading ? 'Generating...' : 'AI Generate'}
            </button>
          </div>
        </div>
        <textarea
          rows={5}
          value={form.description}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder="Describe what the event is about..."
          className={`w-full rounded-xl border bg-slate-50 px-4 py-2.5 text-sm outline-none transition resize-none ${
            descIndex >= 0 ? 'border-indigo-300 focus:border-indigo-500' : 'border-slate-200 focus:border-indigo-400 focus:bg-white'
          }`}
        />
        {descIndex >= 0 && descHistory.length > 0 && (
          <div className="flex items-center justify-between mt-1.5 px-1">
            <span className={`text-[10px] font-semibold tracking-widest uppercase rounded px-2 py-0.5 ${
              descSource === 'gemini-2.0-flash' ? 'bg-blue-50 text-blue-500' :
              descSource === 'grok' ? 'bg-purple-50 text-purple-500' :
              'bg-slate-100 text-slate-400'
            }`}>
              {descSource === 'gemini-2.0-flash' ? 'âœ¦ Gemini 2.0' : descSource === 'grok' ? 'âœ¦ Grok' : 'âœ¦ Fallback'}
            </span>
            <span className="text-[10px] text-slate-400">Draft {descIndex + 1} of {descHistory.length} â€¢ {descHistory.length > 1 ? 'Navigate with â† â†’' : 'Generate more by clicking AI Generate again'}</span>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Guest Speakers</label>
        <input
          value={form.guest_speakers}
          onChange={(e) => updateField('guest_speakers', e.target.value)}
          placeholder="e.g. Dr. Smith, Prof. Sharma"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:bg-white transition"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Instructions for Participants</label>
        <textarea
          rows={3}
          value={form.instructions}
          onChange={(e) => updateField('instructions', e.target.value)}
          placeholder="Any special instructions..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:bg-white transition resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Event Poster</label>
        {form.poster ? (
          <div className="relative group rounded-2xl border border-slate-200 bg-slate-50 p-2 overflow-hidden aspect-[16/9] max-w-lg">
            <img src={form.poster} alt="Poster Preview" className="h-full w-full object-cover rounded-xl" />
            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
              <button
                type="button"
                onClick={() => updateField('poster', '')}
                className="rounded-xl bg-white/20 px-4 py-2 text-xs font-semibold text-white hover:bg-white/30 backdrop-blur-md border border-white/20 transition flex items-center gap-2"
              >
                <Pencil className="h-3.5 w-3.5" /> Change Poster
              </button>
              <button
                type="button"
                onClick={() => updateField('poster', '')}
                className="rounded-xl bg-rose-500/80 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-600 transition flex items-center gap-2"
              >
                <X className="h-3.5 w-3.5" /> Remove
              </button>
            </div>
          </div>
        ) : (
          <div
            onDragOver={(e) => { e.preventDefault(); }}
            onDragLeave={() => {}}
            onDrop={handleFileDrop}
            className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 transition-all cursor-pointer hover:bg-slate-50 relative ${isDragging ? 'border-indigo-400 bg-indigo-50/50 scale-[0.99]' : 'border-slate-300'
              }`}
            onClick={() => document.getElementById('poster-input').click()}
          >
            <input
              id="poster-input"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
              <ImageIcon className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-slate-800">Drag and drop your poster</p>
            <p className="text-xs text-slate-400 mt-1">or click to browse from device (JPG, PNG, max 2MB)</p>

            {posterProgress > 0 && (
              <div className="absolute bottom-4 left-4 right-4 h-1 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${posterProgress}%` }} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}