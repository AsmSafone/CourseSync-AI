import React, { useState, useEffect } from 'react';
import { getState, addSyllabusText, addSyllabusUrl, addSyllabusPdf, deleteCourse } from '../services/api';
import { Trash2, Plus, FileText, Link as LinkIcon, Upload, Loader, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const Courses = () => {
    const [courses, setCourses] = useState([]);
    const [activeTab, setActiveTab] = useState('text'); // text, url, pdf
    const [semesterStart, setSemesterStart] = useState('2025-09-01');
    const [loading, setLoading] = useState(false);

    // Form Inputs
    const [textInput, setTextInput] = useState('');
    const [urlInput, setUrlInput] = useState('');
    const [fileInput, setFileInput] = useState(null);

    useEffect(() => {
        loadCourses();
    }, []);

    const loadCourses = async () => {
        const data = await getState();
        if (data) setCourses(data.courses);
    };

    const handleAddCourse = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            let res;
            if (activeTab === 'text') {
                res = await addSyllabusText(textInput, semesterStart);
            } else if (activeTab === 'url') {
                res = await addSyllabusUrl(urlInput, semesterStart);
            } else if (activeTab === 'pdf') {
                if (!fileInput) { alert("Please select a file"); setLoading(false); return; }
                res = await addSyllabusPdf(fileInput, semesterStart);
            }

            if (res && res.data && res.data.success) {
                // Clear inputs
                setTextInput('');
                setUrlInput('');
                setFileInput(null);
                // Reload
                await loadCourses();
            } else {
                alert('Failed to add course: ' + (res?.data?.error || 'Unknown error'));
            }
        } catch (err) {
            console.error(err);
            alert('Error adding course. Check console for details.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (index) => {
        if (!window.confirm("Are you sure you want to delete this course and all its assignments?")) return;
        try {
            await deleteCourse(index);
            loadCourses();
        } catch (e) {
            console.error(e);
            alert("Failed to delete course");
        }
    }

    const tabs = [
        { id: 'text', label: 'Paste Text', icon: FileText },
        { id: 'url', label: 'URL', icon: LinkIcon },
        { id: 'pdf', label: 'Upload PDF', icon: Upload },
    ];

    return (
        <div className="max-w-7xl mx-auto pb-10">
            <h1 className="text-3xl font-bold tracking-tight mb-8">Manage Courses</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

                {/* Add Course Form */}
                <Card className="border-primary/10 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Plus size={20} className="text-primary" /> Add New Course
                        </CardTitle>
                        <CardDescription>
                            Import your syllabus to automatically generate assignments.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Custom Tabs */}
                        <div className="flex gap-1 p-1 bg-muted rounded-lg mb-6">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all",
                                        activeTab === tab.id
                                            ? "bg-background text-foreground shadow-sm font-bold"
                                            : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                                    )}
                                >
                                    <tab.icon size={16} /> {tab.label}
                                </button>
                            ))}
                        </div>

                        <form onSubmit={handleAddCourse} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Semester Start Date
                                </label>
                                <Input
                                    type="date"
                                    value={semesterStart}
                                    onChange={(e) => setSemesterStart(e.target.value)}
                                    required
                                />
                            </div>

                            {activeTab === 'text' && (
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold leading-none">Syllabus Text</label>
                                    <Textarea
                                        rows="6"
                                        placeholder="Paste course syllabus content here..."
                                        value={textInput}
                                        onChange={(e) => setTextInput(e.target.value)}
                                        required
                                        className="font-mono text-sm leading-relaxed"
                                    />
                                </div>
                            )}

                            {activeTab === 'url' && (
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold leading-none">Course Page URL</label>
                                    <Input
                                        type="url"
                                        placeholder="https://example.university.edu/course"
                                        value={urlInput}
                                        onChange={(e) => setUrlInput(e.target.value)}
                                        required
                                    />
                                </div>
                            )}

                            {activeTab === 'pdf' && (
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold leading-none">Syllabus PDF</label>
                                    <div className="border-2 border-dashed border-muted-foreground/20 bg-muted/30 rounded-lg p-10 text-center hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer relative">
                                        <input
                                            type="file"
                                            accept=".pdf"
                                            onChange={(e) => setFileInput(e.target.files[0])}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            required={!fileInput}
                                        />
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
                                                <Upload size={20} />
                                            </div>
                                            <p className="text-sm font-medium text-foreground">
                                                {fileInput ? fileInput.name : "Click to upload or drag and drop"}
                                            </p>
                                            <p className="text-xs text-muted-foreground">PDF, up to 10MB</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <Button type="submit" className="w-full mt-2" disabled={loading} size="lg">
                                {loading ? <Loader className="animate-spin mr-2" size={18} /> : 'Process Syllabus'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Course List */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold tracking-tight">Your Courses</h2>

                    {courses.length === 0 ? (
                        <Card className="py-12 border-dashed">
                            <div className="flex flex-col items-center justify-center text-center">
                                <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                    <BookOpen size={24} className="text-muted-foreground" />
                                </div>
                                <h3 className="font-semibold text-lg">No courses added</h3>
                                <p className="text-sm text-muted-foreground max-w-xs mt-1">
                                    Use the form to import your first course syllabus.
                                </p>
                            </div>
                        </Card>
                    ) : (
                        <div className="grid gap-4">
                            {courses.map((course, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <Card className="hover:shadow-md transition-shadow group">
                                        <CardContent className="p-6 flex justify-between items-start gap-4">
                                            <div className="space-y-1">
                                                <h3 className="font-bold text-lg leading-none group-hover:text-primary transition-colors">{course.course_name}</h3>
                                                <p className="text-sm text-muted-foreground">{course.course_code}</p>
                                                <div className="pt-2">
                                                    <Badge variant="secondary" className="font-semibold">
                                                        {course.assignments ? course.assignments.length : 0} Assignments
                                                    </Badge>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(idx)}
                                                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                title="Delete Course"
                                            >
                                                <Trash2 size={18} />
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Courses;
