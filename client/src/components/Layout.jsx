import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Calendar, Settings, Menu, Bell, LogOut, User, X, AlertCircle, Clock, Sparkles, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { getNotifications } from '@/services/api';

const Layout = ({ children }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const location = useLocation();
    const notificationRef = useRef(null);

    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };

        if (showNotifications) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showNotifications]);

    useEffect(() => {
        // Load notifications on mount
        loadNotifications();
        // Refresh every 30 seconds
        const interval = setInterval(loadNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadNotifications = async () => {
        try {
            const res = await getNotifications();
            if (res.data && res.data.notifications) {
                setNotifications(res.data.notifications);
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    };

    const overdue = notifications.filter(n => n.days_until < 0).length;
    const urgent = notifications.filter(n => n.days_until >= 0 && n.days_until <= 1).length;

    const navItems = [
        { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/courses', icon: BookOpen, label: 'Courses' },
        { to: '/schedule', icon: Calendar, label: 'Schedule' },
        { to: '/focus', icon: Target, label: 'Focus Mode' },
        { to: '/assistant', icon: Sparkles, label: 'AI Assistant' },
        { to: '/settings', icon: Settings, label: 'Settings' },
    ];

    return (
        <div className="flex h-screen flex-col bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 text-foreground font-sans overflow-hidden">
            {/* Top Navigation Bar */}
            <nav className="sticky top-0 z-40 border-b border-slate-200/50 dark:border-slate-800/50 bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl shadow-sm">
                <div className="max-w-[100rem] mx-auto flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
                    {/* Logo & Brand */}
                    <motion.div
                        className="flex items-center cursor-pointer"
                        whileHover={{ scale: 1.02 }}
                        onClick={() => window.location.href = '/'}
                    >
                        <div className="flex flex-col">
                            <h1 className="font-extrabold text-2xl tracking-tight leading-none flex">
                                <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">Course</span>
                                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Sync</span>
                                <span className="bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">AI</span>
                            </h1>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] flex gap-1 mt-1">
                                <span className="text-indigo-500">Smart</span>
                                <span className="text-slate-400 dark:text-slate-500">Learning</span>
                                <span className="text-slate-400 dark:text-slate-500">Manager</span>
                            </p>
                        </div>
                    </motion.div>

                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex items-center gap-1">
                        {navItems.map((item) => {
                            const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
                            return (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    className={cn(
                                        "group relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300",
                                        isActive
                                            ? "text-blue-600 dark:text-blue-400"
                                            : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100/50 dark:hover:bg-slate-900/50"
                                    )}
                                >
                                    <item.icon
                                        size={18}
                                        className={cn(
                                            "transition-transform duration-300 group-hover:scale-110",
                                            isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400"
                                        )}
                                    />
                                    <span>{item.label}</span>

                                    {isActive && (
                                        <motion.div
                                            layoutId="nav-active"
                                            className="absolute inset-0 bg-blue-50 dark:bg-blue-950/30 rounded-xl -z-10 border border-blue-100/50 dark:border-blue-900/50"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                    {isActive && (
                                        <motion.div
                                            layoutId="nav-active-pill"
                                            className="absolute bottom-1 left-4 right-4 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                </NavLink>
                            );
                        })}
                    </div>

                    {/* Right Section */}
                    <div className="flex items-center gap-2">

                        <div className="relative" ref={notificationRef}>
                            <motion.button
                                whileHover={{ scale: 1.05, backgroundColor: 'rgba(0,0,0,0.05)' }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="inline-flex items-center justify-center h-10 w-10 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/50 transition-all relative group"
                            >
                                <Bell size={20} />
                                {(overdue + urgent) > 0 && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="absolute top-1 right-1 flex items-center justify-center"
                                    >
                                        <span className="absolute h-3 w-3 bg-red-500 rounded-full animate-pulse" />
                                        <span className="relative h-3 w-3 bg-red-400 rounded-full" />
                                    </motion.div>
                                )}
                                {(overdue + urgent) > 0 && (
                                    <span className="absolute -bottom-8 right-0 px-2 py-1 bg-red-500 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                        {overdue + urgent} alert{overdue + urgent !== 1 ? 's' : ''}
                                    </span>
                                )}
                            </motion.button>

                            {/* Notification Panel */}
                            <AnimatePresence>
                                {showNotifications && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                        className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 origin-top-right"
                                    >
                                        <div className="p-4 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 rounded-t-xl z-10">
                                            <h3 className="font-bold text-sm flex items-center gap-2">
                                                <Bell size={16} />
                                                Notifications
                                            </h3>
                                            <p className="text-xs text-muted-foreground mt-1">{notifications.length} total • {overdue} overdue</p>
                                        </div>

                                        {notifications.length === 0 ? (
                                            <div className="p-8 text-center">
                                                <div className="text-4xl mb-2">🎉</div>
                                                <p className="text-sm text-muted-foreground">All caught up! No notifications</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2 p-2">
                                                {notifications.slice(0, 5).map((notif, idx) => (
                                                    <motion.div
                                                        key={notif.id}
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: idx * 0.05 }}
                                                        className={cn(
                                                            "p-3 rounded-lg text-xs border-l-4 transition-all hover:shadow-md cursor-pointer",
                                                            notif.type === 'error' && "bg-red-50 dark:bg-red-950/20 border-red-500 hover:bg-red-100 dark:hover:bg-red-950/40",
                                                            notif.type === 'warning' && "bg-amber-50 dark:bg-amber-950/20 border-amber-500 hover:bg-amber-100 dark:hover:bg-amber-950/40",
                                                            notif.type === 'success' && "bg-green-50 dark:bg-green-950/20 border-green-500 hover:bg-green-100 dark:hover:bg-green-950/40",
                                                            notif.type === 'info' && "bg-blue-50 dark:bg-blue-950/20 border-blue-500 hover:bg-blue-100 dark:hover:bg-blue-950/40",
                                                        )}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="font-semibold text-sm">{notif.title || (notif.assignment && notif.assignment.title) || 'Notification'}</div>
                                                            <div className="text-2xs text-muted-foreground">{notif.days_until != null ? (notif.days_until < 0 ? `${Math.abs(notif.days_until)}d overdue` : `${notif.days_until}d`) : ''}</div>
                                                        </div>
                                                        <div className="text-muted-foreground mt-1 text-xs">{notif.message}</div>
                                                        <div className="mt-2 flex items-center justify-between text-2xs text-muted-foreground">
                                                            <div>{(notif.course && (notif.course.name || notif.course.title)) || notif.course || (notif.assignment && notif.assignment.course) || ''}</div>
                                                            <div>{notif.due_date ? new Date(notif.due_date).toLocaleDateString() : ''}</div>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                                {notifications.length > 5 && (
                                                    <div className="text-center p-2">
                                                        <p className="text-xs text-muted-foreground">+{notifications.length - 5} more</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>



                        {/* Mobile Menu Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="lg:hidden text-slate-600 dark:text-slate-400"
                        >
                            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </Button>
                    </div>
                </div>
                {/* Motivation card removed from layout; shown on Dashboard only */}
                {/* Mobile Navigation Menu */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden"
                        >
                            <div className="px-4 py-4 space-y-2">
                                {navItems.map((item) => {
                                    const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
                                    return (
                                        <NavLink
                                            key={item.to}
                                            to={item.to}
                                            onClick={closeMobileMenu}
                                            className={cn(
                                                "flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold transition-all duration-200",
                                                isActive
                                                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-blue-800/50"
                                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900"
                                            )}
                                        >
                                            <item.icon
                                                size={20}
                                                className={isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}
                                            />
                                            <span>{item.label}</span>
                                        </NavLink>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
};

export default Layout;
