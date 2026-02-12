import React, { useState, useEffect, useRef } from 'react';
import { getState, updateProgress } from '../services/api';
import { Play, Pause, Square, SkipForward, Clock, Target, CheckCircle, Coffee, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

const Focus = () => {
    const [assignments, setAssignments] = useState([]);
    const [selectedAssignmentId, setSelectedAssignmentId] = useState(() => localStorage.getItem('focus_assignmentId') || 'none');
    const [mode, setMode] = useState(() => localStorage.getItem('focus_mode') || 'focus');
    const [timeLeft, setTimeLeft] = useState(() => {
        const saved = localStorage.getItem('focus_timeLeft');
        return saved ? parseInt(saved) : 25 * 60;
    });
    const [isActive, setIsActive] = useState(() => localStorage.getItem('focus_isActive') === 'true');
    const [sessionCount, setSessionCount] = useState(0);
    const [totalTimeFocused, setTotalTimeFocused] = useState(0);
    const [tasksCompleted, setTasksCompleted] = useState(0);
    const [lifetimeHours, setLifetimeHours] = useState(0);

    // Resume timer logic on load
    useEffect(() => {
        const lastTime = localStorage.getItem('focus_lastTime');
        const wasActive = localStorage.getItem('focus_isActive') === 'true';

        if (wasActive && lastTime) {
            const elapsed = Math.floor((Date.now() - parseInt(lastTime)) / 1000);
            if (elapsed > 0) {
                setTimeLeft(prev => Math.max(0, prev - elapsed));
                // Optionally update totalTimeFocused if we want to count offline time, 
                // but usually better to only count active page time or ask user.
                // For now, let's just update the countdown.
            }
        }
    }, []);

    // Save state
    useEffect(() => {
        localStorage.setItem('focus_mode', mode);
        localStorage.setItem('focus_timeLeft', timeLeft.toString());
        localStorage.setItem('focus_isActive', isActive.toString());
        localStorage.setItem('focus_assignmentId', selectedAssignmentId);
        localStorage.setItem('focus_lastTime', Date.now().toString());
    }, [mode, timeLeft, isActive, selectedAssignmentId]);

    // Timer Ref for accuracy
    const timerRef = useRef(null);
    const startTimeRef = useRef(null);

    // Load Data
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const data = await getState();
        if (data && data.assignments) {
            // Calculate Stats
            const completed = data.assignments.filter(a => a.progress === 100).length;
            const hours = data.assignments.reduce((acc, curr) => acc + (curr.time_spent || 0), 0);

            setTasksCompleted(completed);
            setLifetimeHours(hours);

            // Filter out completed assignments for selection
            const pending = data.assignments
                .map((a, i) => ({ ...a, originalIndex: i }))
                .filter(a => a.progress < 100);
            setAssignments(pending);
        }
    };

    // Timer Logic
    useEffect(() => {
        if (isActive && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
                // Track total time if in focus mode
                if (mode === 'focus') {
                    setTotalTimeFocused(prev => prev + 1);
                }
            }, 1000);
        } else if (timeLeft === 0) {
            handleTimerComplete();
        }

        return () => clearInterval(timerRef.current);
    }, [isActive, timeLeft, mode]);

    const handleTimerComplete = () => {
        setIsActive(false);
        const audio = new Audio('/happy.wav');
        audio.play().catch(e => console.log("Audio play failed", e));

        if (mode === 'focus') {
            setSessionCount(prev => prev + 1);
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });

            // Auto-switch to break? Or just notify?
            // For now, easy switch logic:
            if ((sessionCount + 1) % 4 === 0) {
                setMode('long-break');
                setTimeLeft(15 * 60);
            } else {
                setMode('short-break');
                setTimeLeft(5 * 60);
            }
        } else {
            // Break over, back to work!
            setMode('focus');
            setTimeLeft(25 * 60);
        }
    };

    const toggleTimer = () => {
        setIsActive(!isActive);
    };

    const resetTimer = () => {
        setIsActive(false);
        if (mode === 'focus') setTimeLeft(25 * 60);
        else if (mode === 'short-break') setTimeLeft(5 * 60);
        else setTimeLeft(15 * 60);
    };

    const switchMode = (newMode) => {
        setIsActive(false);
        setMode(newMode);
        if (newMode === 'focus') setTimeLeft(25 * 60);
        else if (newMode === 'short-break') setTimeLeft(5 * 60);
        else setTimeLeft(15 * 60);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleStopSession = async () => {
        setIsActive(false);
        // Save time spent if an assignment was selected
        if (selectedAssignmentId !== 'none' && totalTimeFocused > 0) {
            try {
                // Convert seconds to fractions of an hour
                const hoursSpent = totalTimeFocused / 3600;
                // Only save if meaningful amount (e.g., > 1 min)
                if (hoursSpent > 0.01) {
                    await updateProgress(parseInt(selectedAssignmentId), null, hoursSpent);
                    // Reset local tracker after save to avoid double counting
                    setTotalTimeFocused(0);
                    alert(`Session saved! You focused for ${Math.round(totalTimeFocused / 60)} minutes.`);
                }
            } catch (e) {
                console.error("Failed to save progress", e);
                alert("Failed to save session time.");
            }
        }
    };

    // Calculate progress for circle (inverted for countdown)
    const totalTime = mode === 'focus' ? 25 * 60 : mode === 'short-break' ? 5 * 60 : 15 * 60;
    const progress = ((totalTime - timeLeft) / totalTime) * 100;

    return (
        <div className="max-w-4xl mx-auto pb-10 space-y-8">
            {/* Header */}
            <div className="text-center space-y-2">
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
                    Focus Mode
                </h1>
                <p className="text-muted-foreground">Eliminate distractions and master your workflow</p>
            </div>

            {/* Main Card */}
            <Card className="border-0 shadow-xl overflow-hidden bg-white dark:bg-slate-950">
                <CardContent className="p-8 md:p-12">

                    {/* Mode Toggles */}
                    <div className="flex justify-center gap-2 mb-10">
                        {[
                            { id: 'focus', label: 'Focus', icon: Target },
                            { id: 'short-break', label: 'Short Break', icon: Coffee },
                            { id: 'long-break', label: 'Long Break', icon: Coffee },
                        ].map((m) => (
                            <button
                                key={m.id}
                                onClick={() => switchMode(m.id)}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all",
                                    mode === m.id
                                        ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md transform scale-105"
                                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                                )}
                            >
                                <m.icon size={14} /> {m.label}
                            </button>
                        ))}
                    </div>

                    {/* Timer Display */}
                    <div className="relative flex justify-center items-center mb-10">
                        {/* SVG Progress Circle */}
                        <div className="relative w-72 h-72 md:w-96 md:h-96">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    cx="50%" cy="50%" r="48%"
                                    fill="transparent"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    className="text-slate-100 dark:text-slate-800"
                                />
                                <circle
                                    cx="50%" cy="50%" r="48%"
                                    fill="transparent"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                    strokeDasharray="300%" // Approx circumference
                                    strokeDashoffset={`${300 - (progress * 3)}%`}
                                    className={cn(
                                        "transition-all duration-1000 ease-linear",
                                        mode === 'focus' ? "text-blue-500" : "text-green-500"
                                    )}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <div className="text-7xl md:text-9xl font-bold font-mono tracking-tighter tabular-nums text-slate-900 dark:text-white">
                                    {formatTime(timeLeft)}
                                </div>
                                <div className="mt-2 text-lg font-medium text-muted-foreground uppercase tracking-widest">
                                    {isActive ? 'Running' : 'Paused'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex justify-center items-center gap-6 mb-12">
                        <Button
                            size="lg"
                            variant="outline"
                            className="h-14 w-14 rounded-full border-2"
                            onClick={resetTimer}
                        >
                            <RotateCcw size={20} />
                        </Button>

                        <Button
                            size="lg"
                            className={cn(
                                "h-20 w-20 rounded-full shadow-lg transition-all transform hover:scale-105",
                                isActive
                                    ? "bg-amber-500 hover:bg-amber-600 text-white"
                                    : "bg-blue-600 hover:bg-blue-700 text-white"
                            )}
                            onClick={toggleTimer}
                        >
                            {isActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                        </Button>

                        {isActive && mode === 'focus' && (
                            <Button
                                size="lg"
                                variant="destructive"
                                className="h-14 w-14 rounded-full border-2"
                                onClick={handleStopSession}
                                title="End Session & Save"
                            >
                                <Square size={20} fill="currentColor" />
                            </Button>
                        )}
                        {!isActive && (
                            <Button
                                size="lg"
                                variant="outline"
                                className="h-14 w-14 rounded-full border-2"
                                onClick={() => handleTimerComplete()} // Skip
                            >
                                <SkipForward size={20} />
                            </Button>
                        )}
                    </div>

                    {/* Assignment Selector */}
                    {mode === 'focus' && (
                        <div className="max-w-md mx-auto">
                            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                                <label className="text-xs font-semibold uppercase text-muted-foreground mb-2 block">
                                    Working on
                                </label>
                                <Select value={selectedAssignmentId} onValueChange={setSelectedAssignmentId}>
                                    <SelectTrigger className="w-full bg-white dark:bg-slate-950 border-0 shadow-sm h-12 text-lg">
                                        <SelectValue placeholder="Select a task..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">General Study (No Assignment)</SelectItem>
                                        {assignments.map(a => (
                                            <SelectItem key={a.originalIndex} value={a.originalIndex.toString()}>
                                                <span className="font-medium mr-2">{a.name}</span>
                                                <Badge variant="outline" className="text-xs">{a.course_code}</Badge>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}

                </CardContent>
            </Card>

            {/* Session Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm text-center">
                    <p className="text-3xl font-bold text-blue-600">{sessionCount}</p>
                    <p className="text-sm text-muted-foreground font-medium">Sessions Completed</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm text-center">
                    <p className="text-3xl font-bold text-green-600">{Math.round(totalTimeFocused / 60)}</p>
                    <p className="text-sm text-muted-foreground font-medium">Minutes (Session)</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm text-center">
                    <p className="text-3xl font-bold text-purple-600">{tasksCompleted}</p>
                    <p className="text-sm text-muted-foreground font-medium">Tasks Completed</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm text-center">
                    <p className="text-3xl font-bold text-orange-600">{lifetimeHours.toFixed(1)}</p>
                    <p className="text-sm text-muted-foreground font-medium">Total Hours</p>
                </div>
            </div>
        </div>
    );
};

export default Focus;
