
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const hours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
const periods = ['AM', 'PM'];

const ScrollColumn = ({ items, value, onChange }) => {
    return (
        <div className="h-40 overflow-y-auto snap-y snap-mandatory w-16 text-center scrollbar-hide">
            <div className="h-14"></div>
            {items.map((item) => (
                <div
                    key={item}
                    onClick={() => onChange(item)}
                    className={`h-10 flex items-center justify-center snap-center cursor-pointer transition-all ${item === value ? 'text-indigo-600 font-bold text-xl scale-110' : 'text-slate-400 text-sm opacity-60'
                        }`}
                >
                    {item}
                </div>
            ))}
            <div className="h-14"></div>
        </div>
    );
};

export const IOSStyleTimePicker = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);

    // Internal state for display
    const [hour, setHour] = useState('12');
    const [minute, setMinute] = useState('00');
    const [period, setPeriod] = useState('PM');

    useEffect(() => {
        if (value) {
            const [h, m] = value.split(':');
            if (h && m) {
                let parsedH = parseInt(h);
                const p = parsedH >= 12 ? 'PM' : 'AM';
                const displayH = parsedH > 12 ? String(parsedH - 12).padStart(2, '0') : (parsedH === 0 || parsedH === 12 ? '12' : String(parsedH).padStart(2, '0'));

                setHour(displayH);
                setMinute(m);
                setPeriod(p);
            }
        }
    }, [value]);

    const handleUpdate = (type, val) => {
        let newH = type === 'hour' ? val : hour;
        let newM = type === 'minute' ? val : minute;
        let newP = type === 'period' ? val : period;

        if (type === 'hour') setHour(val);
        if (type === 'minute') setMinute(val);
        if (type === 'period') setPeriod(val);

        // Convert to 24h format for output
        let isoH = parseInt(newH);
        if (newP === 'PM' && isoH !== 12) isoH += 12;
        if (newP === 'AM' && isoH === 12) isoH = 0;

        onChange(`${String(isoH).padStart(2, '0')}:${newM}`);
    };

    return (
        <div className="relative w-full">
            <div
                className="w-full p-3 rounded-xl border border-slate-200 bg-white cursor-pointer hover:border-indigo-400 focus:ring-2 focus:ring-indigo-100 flex justify-between items-center transition-all bg-white"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={`font-medium ${value ? 'text-slate-700' : 'text-slate-400'}`}>
                    {value ? `${hour}:${minute} ${period}` : 'Select Time'}
                </span>
                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>

            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-full left-0 sm:left-auto sm:right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-100 z-50 w-full sm:w-64 overflow-hidden"
                >
                    <div className="flex justify-between px-6 py-2 bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <span>Hour</span>
                        <span>Min</span>
                        <span>AM/PM</span>
                    </div>
                    <div className="flex justify-center relative py-2 bg-white">
                        {/* Highlighter Band */}
                        <div className="absolute top-1/2 -translate-y-1/2 w-full h-10 bg-gradient-to-r from-indigo-50 via-white to-indigo-50 border-y border-indigo-100 pointer-events-none z-0 opacity-50"></div>

                        <div className="relative z-10 flex gap-2">
                            <ScrollColumn items={hours} value={hour} onChange={(v) => handleUpdate('hour', v)} />
                            <div className="h-40 flex items-center text-slate-300 font-light text-2xl pb-1">:</div>
                            <ScrollColumn items={minutes} value={minute} onChange={(v) => handleUpdate('minute', v)} />
                            <div className="w-2"></div>
                            <ScrollColumn items={periods} value={period} onChange={(v) => handleUpdate('period', v)} />
                        </div>
                    </div>
                    <button
                        className="w-full py-3 bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors"
                        onClick={() => setIsOpen(false)}
                    >
                        Confirm Time
                    </button>
                </motion.div>
            )}
            <style jsx>{`
            .scrollbar-hide::-webkit-scrollbar {
                display: none;
            }
            .scrollbar-hide {
                -ms-overflow-style: none;
                scrollbar-width: none;
            }
        `}</style>
        </div>
    );
};
