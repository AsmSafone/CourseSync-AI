import React, { useState, useEffect } from 'react';
import { getState, updateProgress } from '../services/api';
import { Calendar as CalIcon, Check, Circle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const Schedule = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

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

    // Group by Month or distinct date? Let's Group by Date.
    const grouped = items.reduce((acc, item) => {
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

    return (
        <div className="max-w-4xl mx-auto pb-10">
            <h1 className="text-3xl font-bold tracking-tight mb-8">Schedule</h1>

            {loading && (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            )}

            {!loading && items.length === 0 && (
                <Card className="flex flex-col items-center justify-center py-16 text-center border-dashed">
                    <CalIcon size={48} className="mx-auto mb-4 text-muted-foreground/50" />
                    <h3 className="text-lg font-semibold">No assignments found</h3>
                    <p className="text-sm text-muted-foreground mt-2">Add a course to populate your schedule!</p>
                </Card>
            )}

            <div className="space-y-8">
                {dates.map((date, idx) => {
                    const dateObj = new Date(date);
                    const isToday = new Date().toDateString() === dateObj.toDateString();
                    const isPast = dateObj < new Date() && !isToday;

                    return (
                        <motion.div
                            key={date}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                        >
                            <h3 className={cn(
                                "text-lg font-bold mb-3 flex items-center gap-2",
                                isToday ? "text-primary" : "text-foreground"
                            )}>
                                {isToday && <Badge>Today</Badge>}
                                {new Date(date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                            </h3>

                            <Card>
                                <div className="divide-y divide-border">
                                    {grouped[date].map((item, i) => (
                                        <div
                                            key={item.originalIndex}
                                            className={cn(
                                                "flex items-center gap-4 p-5 hover:bg-muted/50 transition-colors group",
                                                item.progress === 100 && "bg-muted/30"
                                            )}
                                        >
                                            <button
                                                onClick={() => handleToggle(item)}
                                                className={cn(
                                                    "shrink-0 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-primary/20",
                                                    item.progress === 100
                                                        ? "bg-green-500 border-green-500 text-white"
                                                        : "border-muted-foreground/30 text-transparent hover:border-primary"
                                                )}
                                            >
                                                <Check size={14} strokeWidth={3} />
                                            </button>

                                            <div className="flex-1 min-w-0">
                                                <div className={cn(
                                                    "font-medium text-base transition-colors",
                                                    item.progress === 100 ? "text-muted-foreground line-through" : "text-foreground"
                                                )}>
                                                    {item.name}
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                                                    <span className="font-semibold text-primary/80 bg-primary/5 px-1.5 py-0.5 rounded">{item.course}</span>
                                                    {item.type && <span>• {item.type}</span>}
                                                    {item.estimated_hours > 0 && <span>• {item.estimated_hours}h est.</span>}
                                                </div>
                                            </div>

                                            {item.progress < 100 && isPast && (
                                                <Badge variant="destructive" className="flex items-center gap-1">
                                                    <AlertCircle size={12} /> Overdue
                                                </Badge>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default Schedule;
