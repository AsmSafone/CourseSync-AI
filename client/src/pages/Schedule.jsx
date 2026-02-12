import React, { useState, useEffect } from 'react';
import { getState, updateProgress, exportCalendar } from '../services/api';
import { Calendar as CalIcon, Check, Circle, AlertCircle, Flag, Clock, Flame, TrendingUp, Zap, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const Schedule = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, pending, overdue, completed
    const [courseFilter, setCourseFilter] = useState('all');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await getState();
            if (data) {
                const indexed = data.assignments.map((a, i) => ({ ...a, originalIndex: i }));
                // Sort: Overdue/Pending first, then by date
                const sorted = indexed.sort((a, b) => {
                    const dateA = new Date(a.due_date);
                    const dateB = new Date(b.due_date);
                    return dateA - dateB;
                });
                setItems(sorted);
            }
        } finally {
            setLoading(false);
        }
    }

    const handleToggle = async (item) => {
        const newProgress = item.progress === 100 ? 0 : 100;
        // Optimistic update
        setItems(prev => prev.map(p => p.originalIndex === item.originalIndex ? { ...p, progress: newProgress } : p));

        try {
            await updateProgress(item.originalIndex, newProgress);
        } catch (e) {
            alert("Failed to update progress");
            loadData(); // Revert on error
        }
    }

    // Filter items
    let filtered = items;
    if (filter === 'pending') {
        filtered = items.filter(a => a.progress < 100 && new Date(a.due_date) >= new Date());
    } else if (filter === 'overdue') {
        filtered = items.filter(a => a.progress < 100 && new Date(a.due_date) < new Date());
    } else if (filter === 'completed') {
        filtered = items.filter(a => a.progress === 100);
    }

    if (courseFilter !== 'all') {
        filtered = filtered.filter(a => a.course === courseFilter);
    }

    // Get unique courses
    const uniqueCourses = [...new Set(items.map(item => item.course))].sort();

    // Group by Month/Week
    const grouped = filtered.reduce((acc, item) => {
        const date = item.due_date || "No Date";
        if (!acc[date]) acc[date] = [];
        acc[date].push(item);
        return acc;
    }, {});

    const dates = Object.keys(grouped).sort((a, b) => {
        if (a === "No Date") return 1;
        if (b === "No Date") return -1;
        return new Date(a) - new Date(b);
    });

    const stats = {
        total: items.length,
        completed: items.filter(a => a.progress === 100).length,
        pending: items.filter(a => a.progress < 100 && new Date(a.due_date) >= new Date()).length,
        overdue: items.filter(a => a.progress < 100 && new Date(a.due_date) < new Date()).length,
    };

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">Assignment Schedule</h1>
                    <p className="text-muted-foreground mt-2">Track and manage all your academic deadlines</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">Total</p>
                                <p className="text-2xl font-bold">{stats.total}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-lg bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400">
                                <Check className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">Completed</p>
                                <p className="text-2xl font-bold">{stats.completed}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                                <Clock className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">Pending</p>
                                <p className="text-2xl font-bold">{stats.pending}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-lg bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400">
                                <AlertCircle className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">Overdue</p>
                                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.overdue}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="flex gap-2 flex-wrap">
                    {[
                        { id: 'all', label: 'All', icon: TrendingUp },
                        { id: 'pending', label: 'Pending', icon: Clock },
                        { id: 'overdue', label: 'Overdue', icon: AlertCircle },
                        { id: 'completed', label: 'Completed', icon: Check },
                    ].map(btn => (
                        <motion.button
                            key={btn.id}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setFilter(btn.id)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all",
                                filter === btn.id
                                    ? "bg-blue-600 dark:bg-blue-600 text-white shadow-lg"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                            )}
                        >
                            <btn.icon className="w-4 h-4" /> {btn.label}
                        </motion.button>
                    ))}
                </div>

                <div className="w-full sm:w-auto">
                    <select
                        value={courseFilter}
                        onChange={(e) => setCourseFilter(e.target.value)}
                        className="w-full sm:w-48 px-4 py-2 rounded-lg font-semibold text-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors appearance-none"
                    >
                        <option value="all">All Courses</option>
                        {uniqueCourses.map(course => (
                            <option key={course} value={course}>{course}</option>
                        ))}
                    </select>
                </div>
            </div>

            {loading && (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            )}

            {!loading && items.length === 0 && (
                <Card className="flex flex-col items-center justify-center py-20 text-center border-dashed border-2">
                    <CalIcon size={48} className="mx-auto mb-4 text-muted-foreground/40" />
                    <h3 className="text-lg font-semibold">No assignments yet</h3>
                    <p className="text-sm text-muted-foreground mt-2 max-w-xs">Add a course to populate your schedule and start tracking assignments!</p>
                </Card>
            )}

            {!loading && filtered.length === 0 && items.length > 0 && (
                <Card className="flex flex-col items-center justify-center py-16 text-center border-dashed border-2">
                    <Check size={40} className="mx-auto mb-4 text-green-600 dark:text-green-400" />
                    <h3 className="text-lg font-semibold">All done!</h3>
                    <p className="text-sm text-muted-foreground mt-2">No {filter} assignments. Great job!</p>
                </Card>
            )}

            {!loading && filtered.length > 0 && (
                <div className="space-y-7">
                    {dates.map((date, idx) => {
                        const dateObj = new Date(date);
                        const isToday = new Date().toDateString() === dateObj.toDateString();
                        const isTomorrow = new Date(new Date().setDate(new Date().getDate() + 1)).toDateString() === dateObj.toDateString();
                        const isPast = dateObj < new Date() && !isToday;

                        return (
                            <motion.div
                                key={date}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div>
                                        {isToday && (
                                            <Badge className="bg-blue-600 dark:bg-blue-600 text-white shadow-sm mb-2">
                                                <Flame className="w-3 h-3 mr-1" /> Today
                                            </Badge>
                                        )}
                                        {isTomorrow && (
                                            <Badge className="bg-amber-600 dark:bg-amber-600 text-white shadow-sm mb-2">
                                                Tomorrow
                                            </Badge>
                                        )}
                                    </div>
                                    <h3 className={cn(
                                        "text-xl font-bold",
                                        isToday ? "text-blue-600 dark:text-blue-400" : isPast ? "text-slate-500 dark:text-slate-500" : "text-foreground"
                                    )}>
                                        {new Date(date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                                    </h3>
                                </div>

                                <Card className="border-0 shadow-md overflow-hidden bg-white dark:bg-slate-950">
                                    <div className="divide-y divide-slate-200 dark:divide-slate-800">
                                        {grouped[date].map((item, i) => {
                                            const urgency = grouped[date].length === 1 ? 'high' : i === 0 ? 'high' : 'normal';
                                            return (
                                                <motion.div
                                                    key={item.originalIndex}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.05 }}
                                                    className={cn(
                                                        "flex items-center gap-4 p-5 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors group",
                                                        item.progress === 100 && "bg-green-50/30 dark:bg-green-950/10"
                                                    )}
                                                >
                                                    {/* Checkbox */}
                                                    <motion.button
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => handleToggle(item)}
                                                        className={cn(
                                                            "shrink-0 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20",
                                                            item.progress === 100
                                                                ? "bg-green-500 dark:bg-green-600 border-green-500 dark:border-green-600 text-white shadow-md"
                                                                : "border-slate-300 dark:border-slate-600 text-transparent hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                                                        )}
                                                    >
                                                        <Check size={16} strokeWidth={3} className="transition-transform group-hover:scale-110" />
                                                    </motion.button>

                                                    {/* Priority Flag */}
                                                    {item.progress < 100 && isPast && (
                                                        <div className="shrink-0">
                                                            <Flag size={18} className="text-red-600 dark:text-red-400 fill-red-600 dark:fill-red-400" />
                                                        </div>
                                                    )}

                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className={cn(
                                                            "font-semibold text-base transition-colors",
                                                            item.progress === 100 ? "text-slate-500 dark:text-slate-500 line-through" : "text-foreground"
                                                        )}>
                                                            {item.name}
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs">
                                                            <span className="font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950 px-2 py-1 rounded-full">{item.course}</span>
                                                            {item.type && (
                                                                <span className="text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                                                    {item.type}
                                                                </span>
                                                            )}
                                                            {item.estimated_hours > 0 && (
                                                                <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                                                                    <Clock size={12} /> {item.estimated_hours}h
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Status Badge */}
                                                    {item.progress < 100 && isPast && (
                                                        <Badge variant="destructive" className="flex items-center gap-1 shadow-md bg-red-600 dark:bg-red-700 text-white border-0 hover:bg-red-700">
                                                            <AlertCircle size={12} /> Overdue
                                                        </Badge>
                                                    )}
                                                    {item.progress === 100 && (
                                                        <Badge className="flex items-center gap-1 bg-green-600 dark:bg-green-700 text-white border-0">
                                                            <Check size={12} /> Done
                                                        </Badge>
                                                    )}
                                                    {item.progress < 100 && !isPast && (
                                                        <Badge className="flex items-center gap-1 bg-blue-600 dark:bg-blue-700 text-white border-0">
                                                            <Clock size={12} /> Pending
                                                        </Badge>
                                                    )}
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            )}
            {/* Mobile Floating Export Button */}
            <Button
                onClick={() => window.open(exportCalendar(), '_blank')}
                className="fixed bottom-20 right-6 z-50 rounded-full h-14 w-14 shadow-xl bg-blue-600 hover:bg-blue-700 text-white"
                size="icon"
            >
                <Download size={24} />
            </Button>
        </div>
    );
};

export default Schedule;
