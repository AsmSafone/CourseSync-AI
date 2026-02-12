import React, { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '../services/api';
import { Save, Loader, Bell, Zap, Mail, Palette, Download, LogOut, Shield, User, Smartphone } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const SettingSection = ({ icon: Icon, title, description, children }) => (
    <Card className="border-0 shadow-sm">
        <CardHeader className="pb-5">
            <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 mt-0.5">
                    <Icon className="w-5 h-5" />
                </div>
                <div>
                    <CardTitle className="text-lg">{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent>
            {children}
        </CardContent>
    </Card>
);

const Settings = () => {
    const [settings, setSettings] = useState({
        hours_per_day: 4,
        risk_threshold: 20,
        notification_lead_days: 3,
        email_enabled: false,
        email_to: '',
        email_schedule_enabled: false
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        try {
            const res = await getSettings();
            if (res.data) setSettings(res.data);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    }

    const handleChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));

        if (key === 'notifications_enabled' && value === true) {
            requestNotificationPermission();
        }
    }

    const requestNotificationPermission = async () => {
        if (!("Notification" in window)) {
            alert("This browser does not support desktop notification");
            return;
        }

        if (Notification.permission !== "granted") {
            const permission = await Notification.requestPermission();
            if (permission !== "granted") {
                setSettings(prev => ({ ...prev, notifications_enabled: false }));
                alert("Notification permission denied");
            }
        }
    }

    const testNotification = () => {
        if (Notification.permission === "granted") {
            new Notification("Test Notification", {
                body: "This is how your CourseSync alerts will look!",
                icon: "/vite.svg"
            });
        } else {
            requestNotificationPermission();
        }
    }

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await updateSettings(settings);
            alert("Settings saved successfully");
        } catch (e) {
            alert("Error saving settings");
        }
        setSaving(false);
    }

    if (loading) return (
        <div className="flex justify-center items-center p-12">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                <p className="text-muted-foreground">Loading settings...</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">Settings & Preferences</h1>
                <p className="text-muted-foreground mt-2">Customize your CourseSync experience</p>
            </div>

            {/* Quick Profile Card */}
            <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 overflow-hidden">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                                S
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Safone</h3>
                                <p className="text-sm text-muted-foreground">Premium Student Plan</p>
                                <div className="mt-2 flex gap-2">
                                    <Badge className="bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 border-0">Active</Badge>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-blue-600">4/5</p>
                            <p className="text-xs text-muted-foreground">Courses enrolled</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <form onSubmit={handleSave} className="space-y-6">

                {/* Study Preferences */}
                <SettingSection
                    icon={Zap}
                    title="Study Preferences"
                    description="Customize your learning schedule and study goals."
                >
                    <div className="space-y-4">
                        <div className="grid gap-3">
                            <Label htmlFor="hours" className="text-base font-semibold">Target Study Hours per Day</Label>
                            <div className="flex items-center gap-4">
                                <Input
                                    id="hours"
                                    type="number"
                                    value={settings.hours_per_day}
                                    onChange={e => handleChange('hours_per_day', parseInt(e.target.value))}
                                    min="1" max="24"
                                    className="rounded-lg"
                                />
                                <span className="text-muted-foreground font-medium">hours</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Set your daily study goal to track productivity</p>
                        </div>
                    </div>
                </SettingSection>



                {/* Browser Notifications */}
                <SettingSection
                    icon={Bell}
                    title="Browser Notifications"
                    description="Get real-time alerts for urgent tasks and deadlines."
                >
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                            <div>
                                <Label className="text-base font-semibold block mb-1">Enable Push Notifications</Label>
                                <p className="text-sm text-muted-foreground">
                                    Get alerts for overdue and upcoming assignments
                                </p>
                            </div>
                            <Switch
                                checked={settings.notifications_enabled}
                                onCheckedChange={val => handleChange('notifications_enabled', val)}
                            />
                        </div>

                        {settings.notifications_enabled && (
                            <div className="pt-2">
                                <Button type="button" variant="outline" size="sm" onClick={testNotification}>
                                    Send Test Notification
                                </Button>
                            </div>
                        )}

                        <div className="grid gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                            <Label htmlFor="lead-days" className="text-base font-semibold">Alert Me (Days Before Due Date)</Label>
                            <div className="flex items-center gap-4">
                                <Input
                                    id="lead-days"
                                    type="number"
                                    value={settings.notification_lead_days}
                                    onChange={e => handleChange('notification_lead_days', parseInt(e.target.value))}
                                    min="0" max="30"
                                    className="rounded-lg"
                                />
                                <span className="text-muted-foreground font-medium">days</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Receive notifications this many days before an assignment is due</p>
                        </div>

                        <div className="grid gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                            <Label htmlFor="risk" className="text-base font-semibold">Risk Threshold (%)</Label>
                            <div className="flex items-center gap-4">
                                <Input
                                    id="risk"
                                    type="number"
                                    value={settings.risk_threshold}
                                    onChange={e => handleChange('risk_threshold', parseInt(e.target.value))}
                                    min="1" max="100"
                                    className="rounded-lg"
                                />
                                <span className="text-muted-foreground font-medium">%</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Trigger alerts for high-weight assignments above this threshold</p>
                        </div>

                        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-200">💡 Tip</p>
                            <p className="text-sm text-blue-800 dark:text-blue-300 mt-1">You'll always get notifications for overdue assignments regardless of this setting unless you disable push notifications entirely.</p>
                        </div>
                    </div>
                </SettingSection>

                {/* Email Integration */}
                <SettingSection
                    icon={Mail}
                    title="Email Notifications"
                    description="Receive assignment updates and reminders via email."
                >
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                            <div>
                                <Label className="text-base font-semibold block mb-1">Enable Email Notifications</Label>
                                <p className="text-sm text-muted-foreground">
                                    Receive daily digests and deadline alerts
                                </p>
                            </div>
                            <Switch
                                checked={settings.email_enabled}
                                onCheckedChange={val => handleChange('email_enabled', val)}
                            />
                        </div>

                        {settings.email_enabled && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="grid gap-3 pt-2 border-t border-slate-200 dark:border-slate-800"
                            >
                                <Label htmlFor="email" className="text-base font-semibold">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="your@university.edu"
                                    value={settings.email_to}
                                    onChange={e => handleChange('email_to', e.target.value)}
                                    className="rounded-lg"
                                />
                                <p className="text-xs text-muted-foreground">We'll send notifications to this email address</p>
                            </motion.div>
                        )}

                        <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                            <div>
                                <Label className="text-base font-semibold block mb-1">Weekly Summary</Label>
                                <p className="text-sm text-muted-foreground">
                                    Get a summary every Sunday
                                </p>
                            </div>
                            <Switch checked={settings.email_schedule_enabled} onCheckedChange={val => handleChange('email_schedule_enabled', val)} />
                        </div>
                    </div>
                </SettingSection>

                {/* (Appearance and Privacy sections removed per user request) */}

                {/* Save Button */}
                <div className="flex gap-3 sticky bottom-0 pt-6 pb-2 bg-gradient-to-t from-white dark:from-slate-950 to-transparent">
                    <Button type="submit" size="lg" className="rounded-lg font-semibold flex-1" disabled={saving}>
                        {saving ? (
                            <>
                                <Loader className="animate-spin mr-2" size={18} />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2" size={18} />
                                Save Changes
                            </>
                        )}
                    </Button>
                    <Button variant="outline" size="lg" className="rounded-lg font-semibold" type="button">
                        <LogOut className="w-4 h-4" />
                        <span className="hidden sm:inline ml-2">Sign Out</span>
                    </Button>
                </div>

            </form>
        </div>
    );
};

export default Settings;
