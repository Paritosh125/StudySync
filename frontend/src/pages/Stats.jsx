// src/pages/Stats.jsx
import React, { useEffect, useState } from "react";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from "recharts";

/**
 * Stats.jsx
 *
 * Block-style summary + Weekly / Monthly bar charts
 * - Reads studySessions from localStorage (array of { timestamp, durationSec, mode })
 * - Displays total time, avg session, most-used mode, today's time
 * - Shows Recent Session + Current Streak (side-by-side)
 * - Weekly / Monthly charts (mins)
 * - Motivational quote & a simple Focus Insight
 *
 * Notes:
 * - Test data is in seconds => we display minutes (1 decimal) in blocks and charts
 * - Charts only show aggregated minutes per day
 */

// small helpers
const toLocalDateKey = (input) => {
    // returns YYYY-MM-DD for a Date or timestamp (local date)
    const d = new Date(input);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
};

const formatMinutesNice = (sec) => {
    const mins = sec / 60;
    if (!isFinite(mins)) return "0m";
    if (mins >= 60) {
        const h = Math.floor(mins / 60);
        const m = Math.round(mins % 60);
        return `${h}h ${m}m`;
    }
    // show one decimal for readability in test mode
    return `${Number(mins.toFixed(1))}m`;
};

const quotes = [
    "Stay consistent — small habits compound.",
    "Focus on progress, not perfection.",
    "Short breaks fuel long productivity.",
    "One more minute matters — keep going.",
    "Discipline wins when motivation fades.",
];

export default function Stats() {
    const [sessions, setSessions] = useState([]);
    const [activeTab, setActiveTab] = useState("weekly");
    const [quote, setQuote] = useState("");

    useEffect(() => {
        // load sessions on mount
        try {
            const raw = localStorage.getItem("studySessions");
            const parsed = Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
            // defensive: ensure each session has required fields
            const clean = (parsed || []).map((s) => ({
                timestamp: s && s.timestamp ? s.timestamp : new Date().toISOString(),
                durationSec: Number(s && s.durationSec) || 0,
                mode: s && s.mode ? s.mode : "Unknown",
            }));
            // sort ascending by time
            clean.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            setSessions(clean);
        } catch (e) {
            setSessions([]);
        }
        setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
    }, []);

    // Derived metrics (defensive)
    const totalTimeSec = sessions.reduce((sum, s) => sum + (s.durationSec || 0), 0);
    const avgSessionSec = sessions.length ? totalTimeSec / sessions.length : 0;

    const modeCount = sessions.reduce((acc, s) => {
        const m = s.mode || "Unknown";
        acc[m] = (acc[m] || 0) + 1;
        return acc;
    }, {});
    const mostUsedMode =
        Object.keys(modeCount).length > 0
            ? Object.entries(modeCount).sort((a, b) => b[1] - a[1])[0][0]
            : "-";

    const todayKey = toLocalDateKey(new Date());
    const todayTimeSec = sessions
        .filter((s) => toLocalDateKey(s.timestamp) === todayKey)
        .reduce((sum, s) => sum + (s.durationSec || 0), 0);

    const recentSession = sessions.length ? sessions[sessions.length - 1] : null;

    // Week (last 7 days)
    const now = new Date();
    const weekDays = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(now);
        d.setDate(now.getDate() - (6 - i)); // oldest first -> today last
        return d;
    });

    const weekData = weekDays.map((d) => {
        const key = toLocalDateKey(d);
        const dayTime = sessions
            .filter((s) => toLocalDateKey(s.timestamp) === key)
            .reduce((sum, s) => sum + (s.durationSec || 0), 0);
        return {
            day: d.toLocaleDateString(undefined, { weekday: "short" }),
            time: Number((dayTime / 60).toFixed(1)), // minutes numeric
        };
    });

    // Month (last 30 days)
    const monthDays = Array.from({ length: 30 }).map((_, i) => {
        const d = new Date(now);
        d.setDate(now.getDate() - (29 - i));
        return d;
    });

    const monthData = monthDays.map((d) => {
        const key = toLocalDateKey(d);
        const dayTime = sessions
            .filter((s) => toLocalDateKey(s.timestamp) === key)
            .reduce((sum, s) => sum + (s.durationSec || 0), 0);
        return {
            day: d.getDate(),
            time: Number((dayTime / 60).toFixed(1)),
        };
    });

    // Focus insight (simple heuristic: morning vs evening sessions count)
    const morningCount = sessions.filter((s) => new Date(s.timestamp).getHours() < 12).length;
    const eveningCount = sessions.length - morningCount;
    let focusInsight = "No clear pattern yet — keep logging sessions.";
    if (sessions.length > 3) {
        focusInsight =
            morningCount > eveningCount
                ? "You seem to focus better in the mornings 🌅"
                : "You focus more in afternoons/evenings 🌙";
    }

    // Streak calculation (consecutive calendar days with >=1 session)
    const uniqueDateSet = new Set(sessions.map((s) => toLocalDateKey(s.timestamp)));
    const computeCurrentStreak = () => {
        let streak = 0;
        const today = new Date();
        let cursor = new Date(today);
        while (true) {
            const key = toLocalDateKey(cursor);
            if (uniqueDateSet.has(key)) {
                streak += 1;
                cursor.setDate(cursor.getDate() - 1);
            } else {
                break;
            }
        }
        return streak;
    };

    const computeBestStreak = () => {
        if (!uniqueDateSet.size) return 0;
        // make sorted array of unique date objects
        const arr = Array.from(uniqueDateSet)
            .map((k) => new Date(k + "T00:00:00"))
            .sort((a, b) => a - b);
        let best = 1;
        let cur = 1;
        for (let i = 1; i < arr.length; i++) {
            const prev = arr[i - 1];
            const curr = arr[i];
            // difference in days:
            const diff = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
            if (diff === 1) {
                cur += 1;
                best = Math.max(best, cur);
            } else {
                cur = 1;
            }
        }
        return best;
    };

    const currentStreak = computeCurrentStreak();
    const bestStreak = computeBestStreak();

    // Recent session display helpers
    const recentDisplay = recentSession
        ? {
            mode: recentSession.mode,
            time: formatMinutesNice(recentSession.durationSec || 0),
            when: new Date(recentSession.timestamp).toLocaleString(),
        }
        : null;

    // If there are zero sessions, still show block UI with zeros
    return (
        <div className="p-6 space-y-6">
            {/* Top summary blocks */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-sky-50 rounded-xl shadow">
                    <p className="text-sm text-gray-600">Total Study Time</p>
                    <p className="text-xl font-bold">{formatMinutesNice(totalTimeSec)}</p>
                </div>

                <div className="p-4 bg-emerald-50 rounded-xl shadow">
                    <p className="text-sm text-gray-600">Average Session</p>
                    <p className="text-xl font-bold">{formatMinutesNice(avgSessionSec)}</p>
                </div>

                <div className="p-4 bg-yellow-50 rounded-xl shadow">
                    <p className="text-sm text-gray-600">Most Used Mode</p>
                    <p className="text-xl font-bold">{mostUsedMode}</p>
                </div>

                <div className="p-4 bg-violet-50 rounded-xl shadow">
                    <p className="text-sm text-gray-600">Today's Study</p>
                    <p className="text-xl font-bold">{formatMinutesNice(todayTimeSec)}</p>
                </div>
            </div>

            {/* Recent session + Streak (side by side, smaller blocks) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white rounded-xl shadow">
                    <p className="text-sm text-gray-600">Most Recent Session</p>
                    {recentDisplay ? (
                        <div className="mt-2 flex items-center justify-between">
                            <div>
                                <div className="font-semibold">{recentDisplay.mode}</div>
                                <div className="text-sm text-gray-700">{recentDisplay.time}</div>
                                <div className="text-xs text-gray-500 mt-1">{recentDisplay.when}</div>
                            </div>
                            {/* <div className="text-xs text-gray-400">#{sessions.length}</div> */}
                        </div>
                    ) : (
                        <div className="mt-2 text-sm text-gray-500">No sessions yet</div>
                    )}
                </div>

                <div className="p-4 bg-white rounded-xl shadow">
                    <p className="text-sm text-gray-600">Current Streak</p>
                    <div className="mt-2 flex items-center justify-between">
                        <div>
                            <div className="text-2xl font-bold">{currentStreak} day {currentStreak !== 1 ? "s" : ""}</div>
                            <div className="text-sm text-gray-700 mt-1">Best: {bestStreak} day 👑   {bestStreak !== 1 ? "s" : ""}</div>
                        </div>
                        <div className="text-xs text-gray-400">Keep it going ✨</div>
                    </div>
                </div>
            </div>

            {/* Motivation & Insight */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-orange-50 rounded-xl shadow">
                    <p className="text-sm text-gray-600">Motivational Quote</p>
                    <p className="italic mt-2">“{quote}”</p>
                </div>
                <div className="p-4 bg-pink-50 rounded-xl shadow">
                    <p className="text-sm text-gray-600">Focus Insight</p>
                    <p className="font-semibold mt-2">{focusInsight}</p>
                    <p className="text-xs text-gray-500 mt-2">
                        Tip: Try scheduling your toughest tasks when you're most focused.
                    </p>
                </div>
            </div>

            {/* Chart area with tab switcher */}
            <div className="p-4 bg-white rounded-xl shadow">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-3">
                        <button
                            onClick={() => setActiveTab("weekly")}
                            className={`px-4 py-1 rounded ${activeTab === "weekly" ? "bg-sky-600 text-white" : "bg-gray-100 text-gray-700"
                                }`}
                        >
                            Weekly
                        </button>
                        <button
                            onClick={() => setActiveTab("monthly")}
                            className={`px-4 py-1 rounded ${activeTab === "monthly" ? "bg-sky-600 text-white" : "bg-gray-100 text-gray-700"
                                }`}
                        >
                            Monthly
                        </button>
                    </div>

                    <div className="text-sm text-gray-500">Chart shows minutes (m)</div>
                </div>

                {activeTab === "weekly" ? (
                    <>
                        <p className="mb-2 font-semibold">Weekly Study (mins)</p>
                        <div style={{ width: "100%", height: 220 }}>
                            <ResponsiveContainer>
                                <BarChart data={weekData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="day" />
                                    <YAxis />
                                    <Tooltip formatter={(v) => `${v} m`} />
                                    <Bar dataKey="time" name="minutes" fill="#0ea5e9" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </>
                ) : (
                    <>
                        <p className="mb-2 font-semibold">Monthly Study (mins)</p>
                        <div style={{ width: "100%", height: 220 }}>
                            <ResponsiveContainer>
                                <BarChart data={monthData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="day" />
                                    <YAxis />
                                    <Tooltip formatter={(v) => `${v} m`} />
                                    <Bar dataKey="time" name="minutes" fill="#10b981" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </>
                )}
            </div>


        </div>
    );
}
