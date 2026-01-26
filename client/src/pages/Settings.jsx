import React, { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '../services/api';
import { Save, Loader } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';

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
        <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    );

    return (
        <div className="max-w-3xl mx-auto pb-10">
            <h1 className="text-3xl font-bold tracking-tight mb-8">Settings</h1>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <form onSubmit={handleSave} className="space-y-6">

                    {/* Study Preferences */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Study Preferences</CardTitle>
                            <CardDescription>Customize your learning schedule and goals.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="hours">Target Study Hours / Day</Label>
                                <Input
                                    id="hours"
                                    type="number"
                                    value={settings.hours_per_day}
                                    onChange={e => handleChange('hours_per_day', parseInt(e.target.value))}
                                    min="1" max="24"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Notifications */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Notifications</CardTitle>
                            <CardDescription>Manage how and when you receive alerts.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="risk">Risk Threshold (%)</Label>
                                <div className="text-sm text-muted-foreground mb-1">
                                    Assignments with weight above this % trigger critical alerts.
                                </div>
                                <Input
                                    id="risk"
                                    type="number"
                                    value={settings.risk_threshold}
                                    onChange={e => handleChange('risk_threshold', parseInt(e.target.value))}
                                />
                            </div>
                            <div className="grid gap-2 mt-4">
                                <Label htmlFor="lead">Notification Lead Time (Days)</Label>
                                <Input
                                    id="lead"
                                    type="number"
                                    value={settings.notification_lead_days}
                                    onChange={e => handleChange('notification_lead_days', parseInt(e.target.value))}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Email Integration */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Email Integration</CardTitle>
                            <CardDescription>Configure email alerts for your assignments.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Enable Email Notifications</Label>
                                    <div className="text-sm text-muted-foreground">
                                        Receive daily summaries and deadline alerts via email.
                                    </div>
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
                                    className="grid gap-2"
                                >
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="student@university.edu"
                                        value={settings.email_to}
                                        onChange={e => handleChange('email_to', e.target.value)}
                                    />
                                </motion.div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="flex justify-end pt-4">
                        <Button type="submit" size="lg" disabled={saving}>
                            {saving ? <Loader className="animate-spin mr-2" size={18} /> : <Save className="mr-2" size={18} />}
                            Save Changes
                        </Button>
                    </div>

                </form>
            </motion.div>
        </div>
    );
};

export default Settings;
