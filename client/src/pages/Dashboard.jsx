import React, { useEffect, useState } from 'react';
import { getState } from '../services/api';
import { Search, Bell, BookOpen, Clock, Users, ArrowRight, User as UserIcon, Calendar as CalendarIcon, ChevronRight, Check, AlertCircle, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const CalendarWidget = () => {
    const days = Array.from({ length: 31 }, (_, i) => i + 1);
    const today = new Date().getDate();
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-bold">December 2025</CardTitle>
                <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6"><ChevronRight className="rotate-180" size={14} /></Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6"><ChevronRight size={14} /></Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted-foreground mb-2">
                    <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {days.map(d => (
                        <div
                            key={d}
                            className={cn(
                                "flex items-center justify-center aspect-square rounded-full text-sm cursor-pointer transition-all hover:bg-accent",
                                d === today && "bg-primary text-primary-foreground font-bold shadow-md",
                                d === 14 && "border-2 border-primary text-primary font-bold"
                            )}
                        >
                            {d}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

const CourseCard = ({ course, index }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="h-full"
    >
        <Card className="h-full overflow-hidden hover:shadow-lg transition-all group border-0 shadow-md">
            <div className="h-28 bg-slate-800 relative">
                <div
                    className="absolute inset-0 opacity-90 transition-opacity group-hover:opacity-100"
                    style={{
                        background: `linear-gradient(135deg, hsl(${index * 60 + 200}, 80%, 60%), hsl(${index * 60 + 240}, 80%, 40%))`
                    }}
                />
                <div className="absolute top-3 left-3">
                    <Badge variant="secondary" className="bg-black/20 backdrop-blur text-white border-0">
                        {course.course_code || 'Course'}
                    </Badge>
                </div>
            </div>
            <CardContent className="p-5 flex flex-col gap-4">
                <div>
                    <h3 className="font-bold text-lg leading-tight line-clamp-1 mb-1">{course.course_name}</h3>
                    <p className="text-sm text-muted-foreground">Instructor Name</p>
                </div>

                <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
                    <div className="flex items-center gap-1"><BookOpen size={14} /> {course.assignments?.length || 0} Assgn</div>
                    <div className="flex items-center gap-1"><Clock size={14} /> 24h</div>
                </div>

                <div className="space-y-1.5 mt-auto">
                    <div className="flex justify-between text-xs font-medium">
                        <span className="text-muted-foreground">Progress</span>
                        <span>{course.progress || 0}%</span>
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary transition-all duration-500" style={{ width: `${course.progress || 0}%` }} />
                    </div>
                </div>
            </CardContent>
        </Card>
    </motion.div>
)

const Dashboard = () => {
    const [state, setState] = useState(null);
    const [loading, setLoading] = useState(true);

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
    const upcoming = assignments.filter(a => (a.progress || 0) < 100).slice(0, 3);

    return (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 pb-10">
            {/* Main Content Column */}
            <div className="xl:col-span-2 flex flex-col gap-8">

                {/* Header */}
                <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Hello Student! 👋</h1>
                        <p className="text-muted-foreground">Let's learn something new today!</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative hidden sm:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="h-10 w-64 rounded-xl border bg-background pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                        </div>
                        <Button variant="outline" size="icon" className="rounded-full relative">
                            <Bell size={18} />
                            <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-destructive border-2 border-background box-content"></span>
                        </Button>
                    </div>
                </header>

                {/* Banner */}
                <div className="relative overflow-hidden rounded-3xl bg-indigo-600 bg-gradient-to-r from-violet-600 to-indigo-600 p-8 md:p-10 text-white shadow-xl shadow-indigo-500/20">
                    <div className="relative z-10 max-w-lg space-y-4">
                        <h2 className="text-2xl md:text-3xl font-bold leading-tight">The right choice for your academic success</h2>
                        <p className="text-indigo-100/90 text-sm md:text-base">Manage your deadlines, track your progress, and excel in your courses with our intelligent assistant.</p>
                        <Button asChild size="lg" className="bg-white text-indigo-600 hover:bg-white/90 border-0 font-bold rounded-xl mt-2">
                            <Link to="/courses">View Courses</Link>
                        </Button>
                    </div>
                    <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 to-transparent pointer-events-none"></div>
                    <div className="absolute -right-10 -bottom-10 text-9xl opacity-10 rotate-12 select-none">🎓</div>
                </div>

                {/* Courses Section */}
                <section>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold">Your Courses</h2>
                        <Button variant="link" asChild className="text-primary px-0">
                            <Link to="/courses">See All</Link>
                        </Button>
                    </div>

                    {courses.length === 0 ? (
                        <Card className="flex flex-col items-center justify-center py-12 text-center border-dashed">
                            <BookOpen className="h-10 w-10 text-muted-foreground/50 mb-4" />
                            <p className="text-lg font-medium">No courses yet</p>
                            <p className="text-sm text-muted-foreground mb-4">Add a course to get started.</p>
                            <Button asChild>
                                <Link to="/courses">Add Course</Link>
                            </Button>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {courses.map((c, i) => <CourseCard key={i} course={c} index={i} />)}
                        </div>
                    )}
                </section>

                {/* Quick Actions */}
                <section>
                    <h2 className="text-xl font-bold mb-6">Quick Actions</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Link to="/courses">
                            <Card className="hover:border-primary/50 transition-colors cursor-pointer group">
                                <CardContent className="flex items-center gap-4 p-5">
                                    <div className="h-12 w-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center transition-colors group-hover:bg-orange-600 group-hover:text-white">
                                        <BookOpen size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold">Add Course</h4>
                                        <p className="text-sm text-muted-foreground">Import syllabus</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                        <Link to="/schedule">
                            <Card className="hover:border-primary/50 transition-colors cursor-pointer group">
                                <CardContent className="flex items-center gap-4 p-5">
                                    <div className="h-12 w-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center transition-colors group-hover:bg-blue-600 group-hover:text-white">
                                        <CalendarIcon size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold">View Schedule</h4>
                                        <p className="text-sm text-muted-foreground">Check deadlines</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    </div>
                </section>
            </div>

            {/* Right Sidebar */}
            <div className="flex flex-col gap-6">

                <CalendarWidget />

                {/* Daily Motivation */}
                <Card className="bg-gradient-to-br from-indigo-50 to-violet-50 border-indigo-100 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-indigo-900">
                            Daily Wisdom <span className="text-xl">💡</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <blockquote className="text-sm font-medium italic text-indigo-800 border-l-2 border-indigo-200 pl-3 py-1">
                            "The beautiful thing about learning is that no one can take it away from you."
                        </blockquote>
                        <Button variant="link" className="mt-2 h-auto p-0 text-indigo-600 font-bold text-xs">
                            Read more <ArrowRight className="ml-1 h-3 w-3" />
                        </Button>
                    </CardContent>
                </Card>

                {/* Upcoming Tasks */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <div className="flex items-center gap-3">
                            <CardTitle className="text-lg">Upcoming</CardTitle>
                            <Badge variant="destructive" className="bg-red-100 text-red-600 hover:bg-red-200 border-0 uppercase text-[10px] tracking-wider px-2">Priority</Badge>
                        </div>
                        <Button variant="ghost" size="sm" asChild className="h-8 text-xs text-primary">
                            <Link to="/schedule">View All</Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="grid gap-3">
                        {upcoming.length === 0 ? (
                            <div className="text-center py-8">
                                <div className="bg-green-100 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Check size={18} className="text-green-600" />
                                </div>
                                <p className="text-sm font-medium">All caught up!</p>
                            </div>
                        ) : (
                            upcoming.map((task, i) => (
                                <div key={i} className="group flex items-start gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary transition-colors border border-transparent hover:border-border/50 cursor-pointer">
                                    <div className={cn(
                                        "shrink-0 h-10 w-10 rounded-2xl flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105",
                                        i === 0 ? "bg-gradient-to-br from-orange-400 to-red-400" : "bg-gradient-to-br from-blue-400 to-indigo-400"
                                    )}>
                                        {i === 0 ? <AlertCircle size={18} /> : <BookOpen size={18} />}
                                    </div>
                                    <div className="flex-1 min-w-0 pt-0.5">
                                        <h4 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{task?.name}</h4>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                            <span className="font-medium bg-background px-1.5 py-0.5 rounded truncate max-w-[80px] shadow-sm">{task?.course}</span>
                                            <span>• {task?.due_date}</span>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-green-600 hover:bg-green-100 rounded-full -mr-1">
                                        <Check size={16} />
                                    </Button>
                                </div>
                            ))
                        )}
                    </CardContent>
                    {upcoming.length > 0 && (
                        <div className="p-4 pt-0">
                            <Button className="w-full text-xs h-9 bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-none border" variant="outline">
                                <Plus className="mr-2 h-3 w-3" /> Add New Task
                            </Button>
                        </div>
                    )}
                </Card>

            </div>
        </div>
    );
};

export default Dashboard;
