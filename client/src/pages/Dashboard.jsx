import React, { useEffect, useState } from 'react';
import { getState } from '../services/api';
import { Search, Bell, BookOpen, Clock, Users, ArrowRight, User as UserIcon, Calendar as CalendarIcon, ChevronRight, Check, AlertCircle, Plus, Zap, Target, TrendingUp, Brain } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const CalendarWidget = ({ completedDates }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const prevMonthDays = Array.from({ length: firstDayOfMonth }, (_, i) => {
        const d = new Date(year, month, 0).getDate() - firstDayOfMonth + i + 1;
        return { day: d, current: false };
    });

    const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => ({
        day: i + 1,
        current: true
    }));

    const nextMonthDays = Array.from({ length: 42 - (prevMonthDays.length + currentMonthDays.length) }, (_, i) => ({
        day: i + 1,
        current: false
    }));

    const today = new Date();
    const isToday = (d) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

    const isCompleted = (d) => {
        if (!completedDates) return false;
        const dateStr = new Date(year, month, d).toDateString();
        return completedDates.has(dateStr);
    };

    const changeMonth = (offset) => {
        setCurrentDate(new Date(year, month + offset, 1));
    };

    return (
        <Card className="border-0 shadow-sm bg-white dark:bg-slate-950 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-4 space-y-0">
                <CardTitle className="text-base font-bold">
                    {monthNames[month]} {year}
                </CardTitle>
                <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => changeMonth(-1)}>
                        <ChevronRight className="rotate-180" size={14} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => changeMonth(1)}>
                        <ChevronRight size={14} />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="px-3 pb-4">
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                    <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {prevMonthDays.map((d, i) => (
                        <div key={`prev-${i}`} className="flex items-center justify-center aspect-square text-xs text-slate-300 dark:text-slate-700">
                            {d.day}
                        </div>
                    ))}
                    {currentMonthDays.map((d) => {
                        const completed = isCompleted(d.day);
                        return (
                            <div
                                key={`curr-${d.day}`}
                                className={cn(
                                    "flex flex-col items-center justify-center aspect-square rounded-lg text-xs font-semibold cursor-pointer transition-all hover:bg-slate-100 dark:hover:bg-slate-800 relative",
                                    isToday(d.day) && "bg-blue-600 text-white shadow-md hover:bg-blue-700 font-bold",
                                    !isToday(d.day) && "text-slate-700 dark:text-slate-300",
                                    completed && !isToday(d.day) && "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                                )}
                            >
                                {d.day}
                                {completed && (
                                    <div className={cn(
                                        "w-1 h-1 rounded-full mt-0.5",
                                        isToday(d.day) ? "bg-white" : "bg-green-500"
                                    )} />
                                )}
                            </div>
                        );
                    })}
                    {nextMonthDays.map((d, i) => (
                        <div key={`next-${i}`} className="flex items-center justify-center aspect-square text-xs text-slate-300 dark:text-slate-700">
                            {d.day}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

const CourseCard = ({ course, index }) => {
    const navigate = useNavigate();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="h-full"
            whileHover={{ y: -4 }}
            onClick={() => navigate('/courses', { state: { selectedCourse: course } })}
        >
            <Card className="h-full overflow-hidden hover:shadow-lg transition-all group border-0 shadow-md bg-white dark:bg-slate-900 cursor-pointer">
                <div className="h-24 bg-gradient-to-br sm:h-32 relative overflow-hidden">
                    <div
                        className="absolute inset-0 opacity-90 transition-opacity group-hover:opacity-100"
                        style={{
                            background: `linear-gradient(135deg, hsl(${index * 60 + 200}, 80%, 60%), hsl(${index * 60 + 240}, 80%, 40%))`
                        }}
                    />
                    <div className="absolute top-4 left-4 z-10">
                        <Badge variant="secondary" className="bg-black/30 backdrop-blur-sm text-white border-white/20">
                            {course.course_code || 'Course'}
                        </Badge>
                    </div>
                    <div className="absolute bottom-3 right-3 opacity-20 group-hover:opacity-40 transition-opacity text-4xl">📚</div>
                </div>
                <CardContent className="p-5 flex flex-col gap-3">
                    <div>
                        <h3 className="font-bold text-lg leading-tight line-clamp-2 mb-0.5">{course.course_name}</h3>
                        <p className="text-xs text-muted-foreground font-medium">{course.instructor}</p>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground">
                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                            <BookOpen size={12} /> {course.assignments?.length || 0} Tasks
                        </div>
                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                            <Clock size={12} /> 4 weeks
                        </div>
                    </div>

                    <div className="space-y-1.5 mt-auto pt-2 border-t border-slate-200 dark:border-slate-800">
                        <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-600 dark:text-slate-400">Progress</span>
                            <span className="text-primary">{course.progress || 0}%</span>
                        </div>
                        <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${course.progress || 0}%` }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

const Dashboard = () => {
    const [state, setState] = useState(null);
    const [loading, setLoading] = useState(true);

    // Daily motivation for the dashboard only
    const getDailyMotivation = () => {
        const quotes = [
            "Keep going — small steps every day add up.",
            "Progress, not perfection. You're doing great!",
            "Learn something new today — curiosity wins.",
            "Mistakes are proof you're trying. Keep trying.",
            "A little progress each day leads to big results.",
            "You've got this — focus, breathe, code.",
            "Turn 'I can't' into 'I'll try'. One line at a time.",
            "Consistency beats intensity. Show up today.",
            "Small wins build momentum. Celebrate one now.",
            "Challenge accepted — grow a little every day."
        ];
        const now = new Date();
        const seed = now.getFullYear() * 365 + now.getMonth() * 31 + now.getDate();
        return quotes[seed % quotes.length];
    };

    const dailyMotivation = getDailyMotivation();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await getState();
            setState(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (!state) return (
        <div className="flex h-full items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    );

    const { courses, assignments } = state;
    const upcoming = assignments.filter(a => (a.progress || 0) < 100).slice(0, 5);
    const completed = assignments.filter(a => a.progress === 100).length;
    const total = assignments.length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const overdue = assignments.filter(a => {
        const dueDate = new Date(a.due_date);
        return dueDate < new Date() && a.progress < 100;
    }).length;

    // Calculate course progress properly from assignments
    const coursesWithProgress = courses.map(course => {
        const courseAssignments = assignments.filter(a => a.course === course.course_name);
        const courseCompleted = courseAssignments.filter(a => a.progress === 100).length;
        const progress = courseAssignments.length > 0
            ? Math.round((courseCompleted / courseAssignments.length) * 100)
            : 0;
        return { ...course, progress, assignments: courseAssignments };
    });

    // Calculate dynamic stats
    const avgProgress = total > 0
        ? Math.round(assignments.reduce((acc, a) => acc + (a.progress || 0), 0) / total)
        : 0;

    const hoursTracked = Math.round(
        assignments.reduce((acc, a) => acc + ((a.estimated_hours || 1) * (a.progress || 0) / 100), 0)
    );

    // Calculate Streak based on completed_at dates
    const getStreakData = () => {
        if (!assignments) return { streak: 0, dates: new Set() };

        // Get all unique completed dates
        const dates = new Set();
        assignments.forEach(a => {
            let dateStr = null;
            if (a.completed_at) {
                dateStr = a.completed_at;
            } else if (a.progress === 100 && a.due_date) {
                // Fallback for pre-existing completions: use due_date
                dateStr = a.due_date;
            }

            if (dateStr) {
                const date = new Date(dateStr);
                if (!isNaN(date)) {
                    dates.add(date.toDateString());
                }
            }
        });

        // Check streak
        let streak = 0;
        const today = new Date();
        // Check up to 365 days back
        for (let i = 0; i < 365; i++) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            if (dates.has(d.toDateString())) {
                streak++;
            } else {
                // If it's today and we haven't done anything, don't break streak yet IF we have a streak from yesterday?
                // No, standard streak logic: if today is absent, streak is broken unless we count "current streak active if yesterday was active".
                // Let's be lenient: if today is missing, but yesterday is present, streak is alive.
                if (i === 0) continue;
                break;
            }
        }
        return { streak, dates };
    };

    const { streak, dates: completedDates } = getStreakData();

    const StatCard = ({ icon: Icon, title, value, subtitle, color }) => (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-full"
        >
            <Card className="h-full border-0 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-white to-slate-50 dark:from-slate-950 dark:to-slate-900">
                <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className={cn(
                        "p-3 rounded-xl w-fit",
                        color
                    )}>
                        <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm text-muted-foreground font-medium">{title}</p>
                        <h3 className="text-3xl font-bold mt-1">{value}</h3>
                        <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );

    return (
        <div className="space-y-8 pb-10">
            {/* Header (now relative so motivation card can be positioned within dashboard only) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight">
                        <span className="bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">Welcome back!</span>
                        <span className="ml-2">👋</span>
                    </h1>
                    <p className="text-muted-foreground mt-2">Here's your learning overview for today</p>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="hidden md:block w-72 p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/20 dark:to-slate-900/80 border border-amber-100 dark:border-amber-800 shadow-lg shadow-amber-500/5"
                >
                    <div className="flex items-start gap-3">
                        <div className="text-2xl pt-1">✨</div>
                        <div className="flex-1">
                            <div className="text-xs text-amber-600 dark:text-amber-300 font-bold uppercase tracking-wider">Daily Motivation</div>
                            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1 leading-snug">{dailyMotivation}</div>
                            <div className="text-[10px] text-muted-foreground mt-2 font-medium">Tip: Small steps create big results.</div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={BookOpen}
                    title="Active Courses"
                    value={courses.length}
                    subtitle="Enrolled this semester"
                    color="bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                />
                <StatCard
                    icon={Check}
                    title="Completed"
                    value={completed}
                    subtitle={`${completionRate}% overall progress`}
                    color="bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400"
                />
                <StatCard
                    icon={AlertCircle}
                    title="Pending"
                    value={total - completed}
                    subtitle={overdue > 0 ? `${overdue} overdue` : "All on track"}
                    color={overdue > 0 ? "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400" : "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400"}
                />
                <StatCard
                    icon={TrendingUp}
                    title="Streak"
                    value={`${streak} days`}
                    subtitle="Task completion streak"
                    color="bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400"
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="xl:col-span-2 space-y-6">
                    {/* Courses Section */}
                    <section>
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-bold">Your Courses</h2>
                                <p className="text-sm text-muted-foreground mt-1">Manage your enrolled courses</p>
                            </div>
                            <Button variant="outline" asChild className="rounded-lg">
                                <Link to="/courses">View All</Link>
                            </Button>
                        </div>

                        {courses.length === 0 ? (
                            <Card className="flex flex-col items-center justify-center py-16 text-center border-dashed border-2">
                                <BookOpen className="h-12 w-12 text-muted-foreground/40 mb-4" />
                                <p className="text-lg font-semibold">No courses yet</p>
                                <p className="text-sm text-muted-foreground mb-6 max-w-xs">Add a course by importing your syllabus to start tracking assignments</p>
                                <Button asChild className="rounded-lg">
                                    <Link to="/courses">Add Your First Course</Link>
                                </Button>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {coursesWithProgress.slice(0, 4).map((c, i) => <CourseCard key={i} course={c} index={i} />)}
                            </div>
                        )}
                    </section>

                    {/* Quick Start Guide */}
                    <section>
                        <h2 className="text-2xl font-bold mb-6">Getting Started</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                whileHover={{ y: -4 }}
                                className="group cursor-pointer"
                            >
                                <Card className="h-full border-0 shadow-sm hover:shadow-lg transition-all bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-950/30 dark:to-indigo-900/20">
                                    <Link to="/courses">
                                        <CardContent className="p-6 flex flex-col items-center text-center">
                                            <div className="p-3 rounded-xl bg-indigo-200 dark:bg-indigo-800 text-indigo-600 dark:text-indigo-400 mb-3 group-hover:scale-110 transition-transform">
                                                <BookOpen className="w-6 h-6" />
                                            </div>
                                            <h3 className="font-bold text-sm">Add a Course</h3>
                                            <p className="text-xs text-muted-foreground mt-2">Import syllabus to auto-generate assignments</p>
                                        </CardContent>
                                    </Link>
                                </Card>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                whileHover={{ y: -4 }}
                                className="group cursor-pointer"
                            >
                                <Card className="h-full border-0 shadow-sm hover:shadow-lg transition-all bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20">
                                    <Link to="/schedule">
                                        <CardContent className="p-6 flex flex-col items-center text-center">
                                            <div className="p-3 rounded-xl bg-blue-200 dark:bg-blue-800 text-blue-600 dark:text-blue-400 mb-3 group-hover:scale-110 transition-transform">
                                                <CalendarIcon className="w-6 h-6" />
                                            </div>
                                            <h3 className="font-bold text-sm">View Schedule</h3>
                                            <p className="text-xs text-muted-foreground mt-2">Track your assignment deadlines</p>
                                        </CardContent>
                                    </Link>
                                </Card>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                whileHover={{ y: -4 }}
                                className="group cursor-pointer"
                            >
                                <Card className="h-full border-0 shadow-sm hover:shadow-lg transition-all bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20">
                                    <Link to="/settings">
                                        <CardContent className="p-6 flex flex-col items-center text-center">
                                            <div className="p-3 rounded-xl bg-purple-200 dark:bg-purple-800 text-purple-600 dark:text-purple-400 mb-3 group-hover:scale-110 transition-transform">
                                                <Target className="w-6 h-6" />
                                            </div>
                                            <h3 className="font-bold text-sm">Configure</h3>
                                            <p className="text-xs text-muted-foreground mt-2">Customize your preferences</p>
                                        </CardContent>
                                    </Link>
                                </Card>
                            </motion.div>
                        </div>
                    </section>
                </div>

                {/* Right Sidebar */}
                <div className="space-y-6">
                    {/* Calendar Widget */}
                    <CalendarWidget completedDates={completedDates} />

                    {/* Quick Stats */}
                    <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-slate-50 dark:from-slate-950 dark:to-slate-900">
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-2">
                                <Brain className="w-5 h-5 text-purple-600" /> Study Stats
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium">Overall Progress</span>
                                    <span className="text-xs font-bold text-primary">{completionRate}%</span>
                                </div>
                                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${completionRate}%` }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800">
                                    <p className="text-xs text-muted-foreground font-medium">Avg Completion</p>
                                    <p className="text-2xl font-bold mt-1">{avgProgress}%</p>
                                </div>
                                <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800">
                                    <p className="text-xs text-muted-foreground font-medium">Est. Hours</p>
                                    <p className="text-2xl font-bold mt-1">{hoursTracked}h</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Upcoming Tasks */}
                    <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-slate-50 dark:from-slate-950 dark:to-slate-900">
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-2">
                                <Zap className="w-5 h-5 text-amber-600" /> Next Up
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {upcoming.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="bg-green-100 dark:bg-green-950 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                                        <Check size={20} className="text-green-600 dark:text-green-400" />
                                    </div>
                                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">All caught up! 🎉</p>
                                </div>
                            ) : (
                                <>
                                    {upcoming.slice(0, 3).map((task, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="group flex items-start gap-3 p-3 rounded-lg bg-slate-100/50 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer border border-transparent hover:border-slate-300 dark:hover:border-slate-600"
                                        >
                                            <div className={cn(
                                                "shrink-0 h-9 w-9 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-sm flex-none",
                                                i === 0 ? "bg-gradient-to-br from-orange-400 to-red-500" :
                                                    i === 1 ? "bg-gradient-to-br from-blue-400 to-indigo-500" :
                                                        "bg-gradient-to-br from-pink-400 to-purple-500"
                                            )}>
                                                {i + 1}
                                            </div>
                                            <div className="flex-1 min-w-0 pt-0.5">
                                                <h4 className="font-semibold text-sm truncate text-slate-900 dark:text-slate-100">{task?.name}</h4>
                                                <p className="text-xs text-muted-foreground mt-0.5 truncate">{task?.course}</p>
                                                <div className="flex items-center gap-1 mt-1.5">
                                                    <Clock className="w-3 h-3 text-muted-foreground" />
                                                    <span className="text-xs text-muted-foreground">{task?.due_date}</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                    {upcoming.length > 3 && (
                                        <Button variant="outline" size="sm" asChild className="w-full text-xs rounded-lg">
                                            <Link to="/schedule">View All Tasks</Link>
                                        </Button>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>


                </div>
            </div>
        </div>
    );
};

export default Dashboard;
