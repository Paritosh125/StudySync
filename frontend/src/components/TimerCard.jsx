import { useEffect, useRef, useState } from "react";

/**
 * TimerCard.jsx (full file)
 * - Pomodoro / Custom / Open Focus
 * - Test / Real segmented control
 * - Custom input that updates timer when stopped
 * - Break settings that update immediately (and update running break if active)
 * - Auto-cycle visible only in Pomodoro mode; shows progress 0/4
 * - LocalStorage persistence
 * - Cleaner, professional UI (Tailwind v4 classes)
 */

/* ------------------------ Config ------------------------ */
const BREAK_SUGGESTIONS = [
    "Go touch some grass 🌱",
    "Do a quick stretch 🧘",
    "Grab water 💧",
    "Quick doodle 🎨",
    "Walk around 🚶",
    "Listen to a song 🎵",
    "Take deep breaths 😌",
    "Look far away for 20 seconds 👀",
];

const TESTS = { POMODORO: 15, SHORT: 5, LONG: 10 };
const PROD = { POMODORO: 25 * 60, SHORT: 5 * 60, LONG: 15 * 60 };
const LONG_BREAK_AFTER = 4;

export default function TimerCard({ theme }) {
    // theme (your palette)
    const THEME = {
        accent: "#2b2d42",
        soft: "#8d99ae",
        light: "#edf2f4",
        alert1: "#ef233c",
        alert2: "#d90429",
    };

    /* ------------------------ Modes ------------------------ */
    const MODE_POMODORO = "Pomodoro";
    const MODE_CUSTOM = "Custom";
    const MODE_OPEN = "Open Focus";

    /* ------------------------ Persistent State (localStorage-backed) ------------------------ */
    const [isTestMode, setIsTestMode] = useState(() => {
        const v = localStorage.getItem("isTestMode");
        return v === null ? true : v === "true";
    });

    const [mode, setMode] = useState(() => localStorage.getItem("mode") || MODE_POMODORO);

    const [customValue, setCustomValue] = useState(() => {
        const raw = localStorage.getItem("customValue");
        if (raw != null) return Number(raw);
        return isTestMode ? 10 : 25;
    });

    const [breakType, setBreakType] = useState(() => localStorage.getItem("breakType") || "short");
    const [shortBreakValue, setShortBreakValue] = useState(() => {
        const raw = localStorage.getItem("shortBreakValue");
        return raw != null ? Number(raw) : isTestMode ? TESTS.SHORT : 5;
    });
    const [longBreakValue, setLongBreakValue] = useState(() => {
        const raw = localStorage.getItem("longBreakValue");
        return raw != null ? Number(raw) : isTestMode ? TESTS.LONG : 15;
    });

    const [autoCycle, setAutoCycle] = useState(() => localStorage.getItem("autoCycle") === "true");
    const [completedSessions, setCompletedSessions] = useState(() => Number(localStorage.getItem("completedSessions")) || 0);
    const [completedCycles, setCompletedCycles] = useState(() => Number(localStorage.getItem("completedCycles")) || 0);
    const [pomodoroCountSinceLong, setPomodoroCountSinceLong] = useState(() => Number(localStorage.getItem("pomodoroCountSinceLong")) || 0);

    const [studySessions, setStudySessions] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem("studySessions")) || [];
        } catch {
            return [];
        }
    });

    /* ------------------------ Runtime State ------------------------ */
    // countdown seconds (for Pomodoro / Custom / Break)
    const [secondsLeft, setSecondsLeft] = useState(0);
    // count-up seconds for Open Focus
    const [openElapsed, setOpenElapsed] = useState(() => Number(localStorage.getItem("openElapsed")) || 0);

    const [isActive, setIsActive] = useState(false);
    const [isOnBreak, setIsOnBreak] = useState(false);
    const [breakSuggestion, setBreakSuggestion] = useState("");

    // to store paused session for manual breaks
    const pausedSessionRef = useRef(null);

    /* ------------------------ Refs ------------------------ */
    const intervalRef = useRef(null);
    const wasRunningRef = useRef(false);

    /* ------------------------ Derived helpers ------------------------ */
    const POMODORO_SEC = isTestMode ? TESTS.POMODORO : PROD.POMODORO;
    const OPEN_SESSION_SEC = isTestMode ? TESTS.POMODORO : PROD.POMODORO; // same core chunk
    const getCustomSeconds = (val = customValue) => (isTestMode ? Math.max(1, Number(val) || 1) : Math.max(1, Math.floor((Number(val) || 1) * 60)));
    const getBreakSeconds = (type = breakType) => {
        if (isTestMode) return type === "short" ? Math.max(1, Number(shortBreakValue) || 1) : Math.max(1, Number(longBreakValue) || 1);
        return type === "short" ? Math.max(1, Math.floor((Number(shortBreakValue) || 1) * 60)) : Math.max(1, Math.floor((Number(longBreakValue) || 1) * 60));
    };

    const formatTime = (secs) => {
        const mm = String(Math.floor(secs / 60)).padStart(2, "0");
        const ss = String(secs % 60).padStart(2, "0");
        return `${mm}:${ss}`;
    };

    /* ------------------------ Persist to localStorage ------------------------ */
    useEffect(() => localStorage.setItem("mode", mode), [mode]);
    useEffect(() => localStorage.setItem("customValue", String(customValue)), [customValue]);
    useEffect(() => localStorage.setItem("breakType", breakType), [breakType]);
    useEffect(() => localStorage.setItem("shortBreakValue", String(shortBreakValue)), [shortBreakValue]);
    useEffect(() => localStorage.setItem("longBreakValue", String(longBreakValue)), [longBreakValue]);
    useEffect(() => localStorage.setItem("autoCycle", String(autoCycle)), [autoCycle]);
    useEffect(() => localStorage.setItem("completedSessions", String(completedSessions)), [completedSessions]);
    useEffect(() => localStorage.setItem("completedCycles", String(completedCycles)), [completedCycles]);
    useEffect(() => localStorage.setItem("pomodoroCountSinceLong", String(pomodoroCountSinceLong)), [pomodoroCountSinceLong]);
    useEffect(() => localStorage.setItem("openElapsed", String(openElapsed)), [openElapsed]);
    useEffect(() => localStorage.setItem("studySessions", JSON.stringify(studySessions)), [studySessions]);
    useEffect(() => localStorage.setItem("isTestMode", String(isTestMode)), [isTestMode]);

    /* ------------------------ Utility: log session entry ------------------------ */
    const logSession = (durationSec, sessionMode) => {
        const entry = { timestamp: new Date().toISOString(), durationSec: Number(durationSec), mode: sessionMode };
        setStudySessions(prev => [...prev, entry]);
    };

    /* ------------------------ Pick suggestion ------------------------ */
    const pickSuggestion = () => BREAK_SUGGESTIONS[Math.floor(Math.random() * BREAK_SUGGESTIONS.length)];

    /* ------------------------ Initialize timer on mode / test-mode changes (only when not active / not on break) ------------------------ */
    useEffect(() => {
        if (isActive || isOnBreak) return;
        if (mode === MODE_POMODORO) setSecondsLeft(POMODORO_SEC);
        else if (mode === MODE_CUSTOM) setSecondsLeft(getCustomSeconds());
        else if (mode === MODE_OPEN) {
            setSecondsLeft(0);
            setOpenElapsed(Number(localStorage.getItem("openElapsed")) || 0);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, isTestMode]);

    /* ------------------------ Timer Loop ------------------------ */
    useEffect(() => {
        // clear previous
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        if (!isActive) return;

        wasRunningRef.current = true;

        intervalRef.current = setInterval(() => {
            // OPEN focus (count up)
            if (mode === MODE_OPEN && !isOnBreak) {
                setOpenElapsed(prev => {
                    const next = prev + 1;
                    // check how many OPEN_SESSION_SEC chunks crossed in this tick
                    const prevChunks = Math.floor(prev / OPEN_SESSION_SEC);
                    const newChunks = Math.floor(next / OPEN_SESSION_SEC);
                    const delta = newChunks - prevChunks;
                    if (delta > 0) {
                        // increment and log for each chunk
                        setCompletedSessions(c => c + delta);
                        for (let i = 0; i < delta; i++) logSession(OPEN_SESSION_SEC, MODE_OPEN);
                    }
                    return next;
                });
                return;
            }

            // countdown timers: secondsLeft
            setSecondsLeft(prev => (prev > 1 ? prev - 1 : 0));
        }, 1000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [isActive, mode, isOnBreak, OPEN_SESSION_SEC, isTestMode]);

    /* ------------------------ Handle countdown completion (Pomodoro / Custom / Break) ------------------------ */
    useEffect(() => {
        // ignore Open Focus here (handled separately)
        if (mode === MODE_OPEN) return;
        if (secondsLeft !== 0) return;
        if (!wasRunningRef.current) return;

        wasRunningRef.current = false;

        // If we finished while on a break -> end break
        if (isOnBreak) {
            // If pausedSessionRef exists (manual break) restore it
            if (pausedSessionRef.current) {
                const { savedMode, savedSecondsLeft, savedOpenElapsed } = pausedSessionRef.current;
                pausedSessionRef.current = null;
                setIsOnBreak(false);
                setBreakSuggestion("");
                setMode(savedMode);
                if (savedMode === MODE_OPEN) {
                    setOpenElapsed(savedOpenElapsed || 0);
                    setSecondsLeft(0);
                } else {
                    setSecondsLeft(savedSecondsLeft || getCustomSeconds());
                }
                // keep stopped; user must Start
                setIsActive(false);
                return;
            }

            // Normal break finished -> restore fresh session for current mode
            setIsOnBreak(false);
            setBreakSuggestion("");
            if (mode === MODE_POMODORO) setSecondsLeft(POMODORO_SEC);
            else if (mode === MODE_CUSTOM) setSecondsLeft(getCustomSeconds());
            // If autoCycle is on and pomodoro mode, the break end auto-restarts in pomodoro path, but here this code path is for break finishing by countdown; we will keep stopped unless pomodoro+autoCycle and we earlier set isActive true for auto breaks when they began
            return;
        }

        // Work session finished (Pomodoro/Custom)
        setCompletedSessions(c => c + 1);
        logSession(mode === MODE_POMODORO ? POMODORO_SEC : getCustomSeconds(), mode);

        if (mode === MODE_POMODORO) {
            // increment pomodoroCountSinceLong (functional update) and decide next action
            setPomodoroCountSinceLong(prev => {
                const next = prev + 1;
                const willBeLong = (next % LONG_BREAK_AFTER) === 0;

                if (autoCycle) {
                    // auto-start break of calculated type
                    setIsOnBreak(true);
                    setBreakSuggestion(pickSuggestion());
                    setSecondsLeft(getBreakSeconds(willBeLong ? "long" : "short"));
                    setIsActive(true); // break runs automatically
                    if (willBeLong) setCompletedCycles(c => c + 1);
                } else {
                    // prepare short break but do NOT auto-start
                    setIsOnBreak(true);
                    setBreakSuggestion(pickSuggestion());
                    setSecondsLeft(getBreakSeconds("short"));
                    setIsActive(false);
                }

                // reset to 0 after reaching LONG_BREAK_AFTER to track next cycle
                return willBeLong ? 0 : next;
            });

            return;
        }

        // Custom: stop and wait
        setIsActive(false);
    }, [secondsLeft]); // eslint-disable-line

    /* ------------------------ Actions: start/pause/reset/breaks ------------------------ */
    function handleStartPause() {
        // Starting Open Focus when we had saved openElapsed is okay; just toggle run
        setIsActive(s => !s);
    }

    function handleReset() {
        // Reset behavior per mode
        if (mode === MODE_OPEN) {
            setOpenElapsed(0);
            localStorage.removeItem("openElapsed");
            setIsActive(false);
            setIsOnBreak(false);
            setBreakSuggestion("");
            pausedSessionRef.current = null;
            wasRunningRef.current = false;
            return;
        }

        // For countdown modes
        setIsActive(false);
        setIsOnBreak(false);
        setBreakSuggestion("");
        pausedSessionRef.current = null;
        wasRunningRef.current = false;
        if (mode === MODE_POMODORO) setSecondsLeft(POMODORO_SEC);
        else if (mode === MODE_CUSTOM) setSecondsLeft(getCustomSeconds());
    }

    function takeManualBreak() {
        if (isOnBreak) return;
        // Save current session state so we can restore after manual break
        pausedSessionRef.current = {
            savedMode: mode,
            savedSecondsLeft: mode === MODE_OPEN ? undefined : secondsLeft,
            savedOpenElapsed: mode === MODE_OPEN ? openElapsed : undefined,
        };
        setIsOnBreak(true);
        setBreakSuggestion(pickSuggestion());
        setSecondsLeft(getBreakSeconds(breakType));
        // break should be started but timer paused after taking manual break (user must resume)
        setIsActive(false);
    }

    function resumePausedFocus() {
        // Resume to paused session (after manual break) WITHOUT auto-starting
        if (!pausedSessionRef.current) return;
        const { savedMode, savedSecondsLeft, savedOpenElapsed } = pausedSessionRef.current;
        pausedSessionRef.current = null;
        setIsOnBreak(false);
        setBreakSuggestion("");
        setMode(savedMode);
        if (savedMode === MODE_OPEN) {
            setOpenElapsed(savedOpenElapsed || 0);
            setSecondsLeft(0);
        } else {
            setSecondsLeft(savedSecondsLeft ?? getCustomSeconds());
        }
        setIsActive(false); // user must press Start to continue
    }

    function skipBreak() {
        if (!isOnBreak) return;
        // If pausedSessionRef exists (manual break), end break will restore paused session
        if (pausedSessionRef.current) {
            const { savedMode, savedSecondsLeft, savedOpenElapsed } = pausedSessionRef.current;
            pausedSessionRef.current = null;
            setIsOnBreak(false);
            setBreakSuggestion("");
            setMode(savedMode);
            if (savedMode === MODE_OPEN) {
                setOpenElapsed(savedOpenElapsed || 0);
                setSecondsLeft(0);
            } else {
                setSecondsLeft(savedSecondsLeft ?? getCustomSeconds());
            }
            setIsActive(false);
            wasRunningRef.current = false;
            return;
        }

        // Normal skip: restore fresh session for the current working mode
        setIsOnBreak(false);
        setBreakSuggestion("");
        if (mode === MODE_POMODORO) setSecondsLeft(POMODORO_SEC);
        else if (mode === MODE_CUSTOM) setSecondsLeft(getCustomSeconds());
        setIsActive(false);
        wasRunningRef.current = false;
    }

    /* ------------------------ Ensure UI values reflect input changes ------------------------ */
    // When user edits customValue while stopped & not on break -> update secondsLeft immediately
    useEffect(() => {
        if (mode === MODE_CUSTOM && !isActive && !isOnBreak) {
            setSecondsLeft(getCustomSeconds(customValue));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [customValue]);

    // When break values changed, and a break is currently active and it matches the selected breakType -> update secondsLeft
    useEffect(() => {
        if (!isOnBreak) return;
        // update running break timer if user changed the numeric values
        setSecondsLeft(getBreakSeconds(breakType));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shortBreakValue, longBreakValue, breakType]);

    /* ------------------------ Ensure pomodoroCountSinceLong resets properly ------------------------ */
    useEffect(() => {
        if (pomodoroCountSinceLong >= LONG_BREAK_AFTER) {
            // reset and increment completedCycles (rare because we reset earlier in flow, but safe guard)
            setPomodoroCountSinceLong(0);
            setCompletedCycles(c => c + 1);
        }
    }, [pomodoroCountSinceLong]);

    /* ------------------------ Small helpers for UI ------------------------ */
    const unitLabel = isTestMode ? "sec" : "min";
    const displayTime = mode === MODE_OPEN ? formatTime(openElapsed) : formatTime(secondsLeft);



    /* ------------------------ UI JSX ------------------------ */
    return (

        <div className="w-full max-w-4xl mx-auto p-4 sm:p-6">

            <div
                className="rounded-2xl shadow-lg p-4 sm:p-6"
                style={{ background: THEME.light }}
            >
                {/* Top row */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    {/* Modes */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        {[MODE_POMODORO, MODE_CUSTOM, MODE_OPEN].map((m) => {
                            const active = mode === m;
                            return (
                                <button
                                    key={m}
                                    onClick={() => {
                                        setMode(m);
                                        setIsActive(false);
                                        setIsOnBreak(false);
                                        setBreakSuggestion("");
                                        pausedSessionRef.current = null;
                                        if (m === MODE_POMODORO) setSecondsLeft(POMODORO_SEC);
                                        else if (m === MODE_CUSTOM) setSecondsLeft(getCustomSeconds());
                                        else setSecondsLeft(0);
                                    }}
                                    className={`px-3 sm:px-4 py-1 rounded-full font-medium transition text-sm sm:text-base ${active
                                        ? "bg-white shadow-md"
                                        : "bg-transparent border border-white/40"
                                        }`}
                                    style={{
                                        color: active ? THEME.alert1 : THEME.accent,
                                    }}
                                >
                                    {m}
                                </button>
                            );
                        })}
                    </div>

                    {/* Test / Real segmented control + indicators */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                        <div className="flex items-center rounded-full overflow-hidden border border-white/30">
                            <button
                                onClick={() => {
                                    setIsTestMode(true);
                                    setIsActive(false);
                                    setIsOnBreak(false);
                                }}
                                className={`px-3 py-1 text-xs sm:text-sm ${isTestMode
                                    ? "bg-white text-black"
                                    : "bg-transparent text-[gray]"
                                    } `}
                            >
                                Test
                            </button>
                            <button
                                onClick={() => {
                                    setIsTestMode(false);
                                    setIsActive(false);
                                    setIsOnBreak(false);
                                }}
                                className={`px-3 py-1 text-xs sm:text-sm ${!isTestMode
                                    ? "bg-white text-black"
                                    : "bg-transparent text-[gray]"
                                    } `}
                            >
                                Real
                            </button>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="text-xs sm:text-sm bg-white/90 px-2 sm:px-3 py-1 rounded-lg shadow-sm text-center min-w-[60px]">
                                <div className="text-[10px] sm:text-xs text-[var(--soft,#8d99ae)]">
                                    Sessions
                                </div>
                                <div className="font-semibold">{completedSessions}</div>
                            </div>

                            <div className="text-xs sm:text-sm bg-white/90 px-2 sm:px-3 py-1 rounded-lg shadow-sm text-center min-w-[60px]">
                                <div className="text-[10px] sm:text-xs text-[var(--soft,#8d99ae)]">
                                    Cycles
                                </div>
                                <div className="font-semibold">{completedCycles}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Center content: Timer big + controls */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 items-start">
                    {/* Left column */}
                    <div className="md:col-span-1 w-full">
                        <div className="rounded-xl p-4 bg-white">
                            <div className="text-xs text-[var(--soft,#8d99ae)]">Current</div>
                            <div className="text-base sm:text-lg font-semibold mt-1">{mode}</div>
                            <div className="mt-3 text-xs sm:text-sm text-[var(--soft,#8d99ae)]">
                                Break type: {breakType === "short" ? "Short" : "Long"}
                            </div>
                            <div className="mt-3">
                                <div className="text-xs text-[var(--soft,#8d99ae)]">
                                    Pomodoro progress
                                </div>
                                <div className="text-xs sm:text-sm mt-1 font-medium">
                                    {pomodoroCountSinceLong} / {LONG_BREAK_AFTER} until long break
                                </div>
                            </div>

                            {mode === MODE_POMODORO && (
                                <div className="mt-3 text-xs text-[var(--soft,#8d99ae)]">
                                    Auto-cycle {autoCycle ? "enabled" : "disabled"}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Center column */}
                    <div className="md:col-span-1 flex flex-col items-center w-full">
                        <div
                            className="rounded-3xl p-4 sm:p-6 w-full text-center"
                            style={{ background: "#f5f7f9" }}
                        >
                            <div className="text-xs sm:text-sm text-[var(--soft,#8d99ae)] mb-2">
                                {isOnBreak
                                    ? breakType === "short"
                                        ? "Short Break"
                                        : "Long Break"
                                    : `${mode} Session`}
                            </div>

                            <div className="text-[3rem] sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-mono font-extrabold">
                                {displayTime}
                            </div>

                            {isOnBreak && breakSuggestion && (
                                <div className="mt-3 sm:mt-4 text-base sm:text-lg text-[var(--accent,#2b2d42)] font-medium italic">
                                    💡 {breakSuggestion}
                                </div>
                            )}

                            <div className="mt-3 sm:mt-4 text-xs sm:text-sm text-[var(--soft,#8d99ae)]">
                                {mode === MODE_OPEN
                                    ? `Open focus — every ${OPEN_SESSION_SEC} ${isTestMode ? "sec" : "sec(min)"
                                    } counts as 1 session`
                                    : `Session length: ${mode === MODE_POMODORO
                                        ? isTestMode
                                            ? `${POMODORO_SEC} sec`
                                            : `25 min`
                                        : `${customValue} ${unitLabel}`
                                    }`}
                            </div>

                            {/* Controls */}
                            <div className="mt-4 sm:mt-5 flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
                                <button
                                    onClick={handleStartPause}
                                    className="px-4 sm:px-5 py-2 rounded-lg font-semibold shadow text-sm sm:text-base"
                                    style={{
                                        background: isActive ? THEME.soft : THEME.accent,
                                        color: isActive ? "#000" : "#fff",
                                    }}
                                >
                                    {isActive ? "Pause" : "Start"}
                                </button>

                                <button
                                    onClick={handleReset}
                                    className="px-3 sm:px-4 py-2 rounded-lg border text-sm sm:text-base"
                                    style={{ borderColor: THEME.soft, color: THEME.accent }}
                                >
                                    Reset
                                </button>

                                {!isOnBreak && (
                                    <button
                                        onClick={takeManualBreak}
                                        className="px-3 sm:px-4 py-2 rounded-lg border text-sm sm:text-base"
                                        style={{ borderColor: THEME.accent, color: THEME.accent }}
                                    >
                                        Take Break
                                    </button>
                                )}

                                {isOnBreak && (
                                    <>
                                        <button
                                            onClick={skipBreak}
                                            className="px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base"
                                            style={{ background: THEME.alert1, color: "#fff" }}
                                        >
                                            Skip Break
                                        </button>
                                        {pausedSessionRef.current ? (
                                            <button
                                                onClick={resumePausedFocus}
                                                className="px-3 sm:px-4 py-2 rounded-lg border text-sm sm:text-base"
                                                style={{ borderColor: THEME.soft, color: THEME.accent }}
                                            >
                                                Resume Focus
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    setIsOnBreak(false);
                                                    setBreakSuggestion("");
                                                    setIsActive(false);
                                                }}
                                                className="px-3 sm:px-4 py-2 rounded-lg border text-sm sm:text-base"
                                                style={{ borderColor: THEME.soft, color: THEME.accent }}
                                            >
                                                End Break
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {mode === MODE_CUSTOM && (
                            <div className="w-full mt-4">
                                <label className="block text-xs text-[var(--soft,#8d99ae)] mb-1">
                                    Custom session length
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min={1}
                                        value={customValue}
                                        onChange={(e) => {
                                            const v = Math.max(1, Number(e.target.value || 1));
                                            setCustomValue(v);
                                            if (!isActive && !isOnBreak) {
                                                setSecondsLeft(getCustomSeconds(v));
                                            }
                                        }}
                                        className="w-20 sm:w-28 px-2 py-2 rounded-md border text-sm sm:text-base"
                                    />
                                    <span className="text-xs sm:text-sm text-[var(--soft,#8d99ae)]">
                                        {unitLabel}
                                    </span>
                                </div>
                                <div className="mt-2 text-[10px] sm:text-xs text-[var(--soft,#8d99ae)]">
                                    Edit to change the session length (updates immediately when timer
                                    is stopped)
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right column */}
                    <div className="md:col-span-1 w-full">
                        <div className="rounded-2xl p-4 shadow-lg bg-white">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                                <div>
                                    <div className="text-xs text-[var(--soft,#8d99ae)]">
                                        Break Settings
                                    </div>
                                    <div className="text-base sm:text-lg font-semibold">
                                        Customize
                                    </div>
                                </div>
                                <div className="text-[10px] sm:text-sm text-[var(--soft,#8d99ae)]">
                                    Syncs with timer
                                </div>
                            </div>

                            <div className="mt-4 space-y-3">
                                <div>
                                    <label className="block text-xs text-[var(--soft,#8d99ae)]">
                                        Break type
                                    </label>
                                    <select
                                        value={breakType}
                                        onChange={(e) => {
                                            setBreakType(e.target.value);
                                            if (isOnBreak) setSecondsLeft(getBreakSeconds(e.target.value));
                                        }}
                                        className="mt-1 w-full rounded-md px-2 sm:px-3 py-2 border text-sm sm:text-base"
                                        style={{ borderColor: THEME.soft }}
                                    >
                                        <option value="short">Short Break</option>
                                        <option value="long">Long Break</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                    <div>
                                        <label className="block text-xs text-[var(--soft,#8d99ae)]">
                                            Short
                                        </label>
                                        <div className="mt-1 flex items-center gap-2">
                                            <input
                                                type="number"
                                                min={1}
                                                value={shortBreakValue}
                                                onChange={(e) => {
                                                    const v = Math.max(1, Number(e.target.value || 1));
                                                    setShortBreakValue(v);
                                                    if (isOnBreak && breakType === "short")
                                                        setSecondsLeft(getBreakSeconds("short"));
                                                }}
                                                className="w-full rounded-md px-2 py-2 border text-sm sm:text-base"
                                                style={{ borderColor: THEME.soft }}
                                            />
                                            <span className="text-xs">{unitLabel}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs text-[var(--soft,#8d99ae)]">
                                            Long
                                        </label>
                                        <div className="mt-1 flex items-center gap-2">
                                            <input
                                                type="number"
                                                min={1}
                                                value={longBreakValue}
                                                onChange={(e) => {
                                                    const v = Math.max(1, Number(e.target.value || 1));
                                                    setLongBreakValue(v);
                                                    if (isOnBreak && breakType === "long")
                                                        setSecondsLeft(getBreakSeconds("long"));
                                                }}
                                                className="w-full rounded-md px-2 py-2 border text-sm sm:text-base"
                                                style={{ borderColor: THEME.soft }}
                                            />
                                            <span className="text-xs">{unitLabel}</span>
                                        </div>
                                    </div>
                                </div>

                                {mode === MODE_POMODORO && (
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <input
                                            id="autoCycle"
                                            type="checkbox"
                                            checked={autoCycle}
                                            onChange={(e) => setAutoCycle(e.target.checked)}
                                        />
                                        <label htmlFor="autoCycle" className="text-xs sm:text-sm">
                                            Enable Auto-Cycle (Pomodoro only)
                                        </label>
                                        <div className="ml-auto text-xs text-[var(--soft,#8d99ae)]">
                                            {pomodoroCountSinceLong}/{LONG_BREAK_AFTER}
                                        </div>
                                    </div>
                                )}

                                <div className="text-[10px] sm:text-xs text-[var(--soft,#8d99ae)]">
                                    Note: Auto-cycle runs 4 Pomodoro sessions (with short breaks), then
                                    a long break automatically.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    );
}
