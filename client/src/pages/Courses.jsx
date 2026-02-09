import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getState, addSyllabusText, addSyllabusUrl, addSyllabusFile, deleteCourse, addCourseManual, addAssignment } from '../services/api';
import { Trash2, Plus, FileText, Link as LinkIcon, Upload, Loader, BookOpen, CheckCircle, Clock, Users, ArrowLeft, Calendar as CalendarIcon, Keyboard } from 'lucide-react';
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
    const [selectedCourse, setSelectedCourse] = useState(null);
    const location = useLocation();

    // Form Inputs
    const [textInput, setTextInput] = useState('');
    const [urlInput, setUrlInput] = useState('');
    const [fileInput, setFileInput] = useState(null);
    const [manualName, setManualName] = useState('');
    const [manualCode, setManualCode] = useState('');
    const [manualAssignments, setManualAssignments] = useState([]);

    // Add Assignment State
    const [isAddingAssignment, setIsAddingAssignment] = useState(false);
    const [newAssignment, setNewAssignment] = useState({
        name: '',
        type: 'homework',
        due_date: '',
        estimated_hours: 1,
        description: ''
    });

    useEffect(() => {
        loadCourses();
    }, []);

    useEffect(() => {
        if (location.state?.selectedCourse) {
            setSelectedCourse(location.state.selectedCourse);
        }
    }, [location]);

    const loadCourses = async () => {
        const data = await getState();
        if (data) {
            setCourses(data.courses);
            // Update selected course if it exists to show new data
            if (selectedCourse) {
                const updated = data.courses.find(c => c.course_name === selectedCourse.course_name);
                if (updated) setSelectedCourse(updated);
            }
        }
    };

    const handleAddSingleAssignment = async (e) => {
        e.preventDefault();
        if (!selectedCourse) return;

        try {
            const res = await addAssignment(selectedCourse.course_name, newAssignment);
            if (res.data && res.data.success) {
                setNewAssignment({
                    name: '',
                    type: 'homework',
                    due_date: '',
                    estimated_hours: 1,
                    description: ''
                });
                setIsAddingAssignment(false);
                await loadCourses();
            } else {
                alert('Failed to add assignment: ' + (res?.data?.error || 'Unknown error'));
            }
        } catch (err) {
            console.error(err);
            alert('Error adding assignment');
        }
    };

    const addManualAssignment = () => {
        setManualAssignments([...manualAssignments, { name: '', type: 'homework', due_date: '', weight: 0, estimated_hours: 1, description: '' }]);
    };

    const updateManualAssignment = (index, field, value) => {
        const updated = [...manualAssignments];
        updated[index][field] = value;
        setManualAssignments(updated);
    };

    const removeManualAssignment = (index) => {
        setManualAssignments(manualAssignments.filter((_, i) => i !== index));
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
                res = await addSyllabusFile(fileInput, semesterStart);
            } else if (activeTab === 'manual') {
                if (!manualName || !manualCode) { alert("Please enter course name and code"); setLoading(false); return; }
                res = await addCourseManual({
                    course_name: manualName,
                    course_code: manualCode,
                    semester_start: semesterStart,
                    assignments: manualAssignments
                });
            }

            if (res && res.data && res.data.success) {
                // Clear inputs
                setTextInput('');
                setUrlInput('');
                setFileInput(null);

                setManualName('');
                setManualCode('');
                setManualAssignments([]);
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
    };

    const tabs = [
        { id: 'text', label: 'Paste Text', icon: FileText },
        { id: 'url', label: 'URL', icon: LinkIcon },
        { id: 'pdf', label: 'Upload File', icon: Upload },
        { id: 'manual', label: 'Manual Entry', icon: Keyboard },
    ];

    if (selectedCourse) {
        return (
            <div className="space-y-6 pb-10">
                <Button
                    variant="ghost"
                    className="gap-2 pl-0 hover:bg-transparent hover:text-blue-600"
                    onClick={() => setSelectedCourse(null)}
                >
                    <ArrowLeft size={20} /> Back to Courses
                </Button>

                <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="flex-1 space-y-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <Badge variant="secondary" className="text-sm px-3 py-1">{selectedCourse.course_code}</Badge>
                                <span className="text-sm text-muted-foreground font-medium">Professor Name</span>
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight">{selectedCourse.course_name}</h1>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card className="border-0 shadow-sm bg-blue-50 dark:bg-blue-900/20">
                                <CardContent className="p-4 flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg text-blue-600 dark:text-blue-200">
                                        <BookOpen size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground font-semibold uppercase">Total Tasks</p>
                                        <p className="text-xl font-bold">{selectedCourse.assignments?.length || 0}</p>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="border-0 shadow-sm bg-green-50 dark:bg-green-900/20">
                                <CardContent className="p-4 flex items-center gap-3">
                                    <div className="p-2 bg-green-100 dark:bg-green-800 rounded-lg text-green-600 dark:text-green-200">
                                        <CheckCircle size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground font-semibold uppercase">Completed</p>
                                        <p className="text-xl font-bold">{selectedCourse.assignments?.filter(a => a.progress === 100).length || 0}</p>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="border-0 shadow-sm bg-purple-50 dark:bg-purple-900/20">
                                <CardContent className="p-4 flex items-center gap-3">
                                    <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-lg text-purple-600 dark:text-purple-200">
                                        <Clock size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground font-semibold uppercase">Pending</p>
                                        <p className="text-xl font-bold">{selectedCourse.assignments?.filter(a => (a.progress || 0) < 100).length || 0}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="border-0 shadow-md">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                                <CardTitle>Course Assignments</CardTitle>
                                <Button size="sm" onClick={() => setIsAddingAssignment(!isAddingAssignment)}>
                                    <Plus size={16} className="mr-2" /> Add Assignment
                                </Button>
                            </CardHeader>
                            <CardContent>
                                {isAddingAssignment && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="mb-6 p-4 border rounded-xl bg-slate-50 dark:bg-slate-800 space-y-4"
                                    >
                                        <div className="flex justify-between items-center">
                                            <h4 className="font-semibold text-sm">New Assignment</h4>
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsAddingAssignment(false)}>
                                                <Trash2 size={14} />
                                            </Button>
                                        </div>
                                        <div className="space-y-3">
                                            <Input
                                                placeholder="Assignment Name"
                                                value={newAssignment.name}
                                                onChange={(e) => setNewAssignment({ ...newAssignment, name: e.target.value })}
                                                className="bg-white dark:bg-slate-900"
                                            />
                                            <div className="grid grid-cols-2 gap-3">
                                                <Input
                                                    type="date"
                                                    value={newAssignment.due_date}
                                                    onChange={(e) => setNewAssignment({ ...newAssignment, due_date: e.target.value })}
                                                    className="bg-white dark:bg-slate-900"
                                                />
                                                <Input
                                                    type="number"
                                                    placeholder="Est. Hours"
                                                    value={newAssignment.estimated_hours}
                                                    onChange={(e) => setNewAssignment({ ...newAssignment, estimated_hours: parseFloat(e.target.value) })}
                                                    className="bg-white dark:bg-slate-900"
                                                />
                                            </div>
                                            <div className="flex justify-end gap-2 pt-2">
                                                <Button variant="outline" size="sm" onClick={() => setIsAddingAssignment(false)}>Cancel</Button>
                                                <Button size="sm" onClick={handleAddSingleAssignment}>Save Assignment</Button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                                {(!selectedCourse.assignments || selectedCourse.assignments.length === 0) ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No assignments found for this course.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {selectedCourse.assignments.map((assignment, idx) => (
                                            <div key={idx} className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
                                                <div className={cn(
                                                    "h-10 w-10 shrink-0 rounded-full flex items-center justify-center font-bold text-sm",
                                                    assignment.progress === 100
                                                        ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300"
                                                        : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                                )}>
                                                    {idx + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <h4 className={cn(
                                                            "font-semibold text-base line-clamp-1",
                                                            assignment.progress === 100 && "text-muted-foreground line-through"
                                                        )}>{assignment.name}</h4>
                                                        <Badge variant={assignment.progress === 100 ? "secondary" : "default"} className={cn("ml-2 shrink-0", assignment.progress === 100 && "bg-slate-100 text-slate-500")}>
                                                            {assignment.progress === 100 ? "Done" : "Pending"}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{assignment.description || "No description provided."}</p>

                                                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground font-medium">
                                                        <div className="flex items-center gap-1.5">
                                                            <CalendarIcon size={14} />
                                                            Due: {assignment.due_date}
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <Clock size={14} />
                                                            Est: {assignment.estimated_hours}h
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-primary rounded-full"
                                                                    style={{ width: `${assignment.progress || 0}%` }}
                                                                />
                                                            </div>
                                                            {assignment.progress || 0}%
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">Manage Your Courses</h1>
                <p className="text-muted-foreground mt-2">Import syllabi to automatically generate and track assignments</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Enrolled</p>
                            <p className="text-2xl font-bold">{courses.length}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Assignments</p>
                            <p className="text-2xl font-bold">{courses.reduce((sum, c) => sum + (c.assignments?.length || 0), 0)}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Semester</p>
                            <p className="text-2xl font-bold">16w</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                {/* Add Course Form */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="lg:col-span-1"
                >
                    <Card className="border-0 shadow-lg sticky top-24 bg-gradient-to-br from-white to-slate-50 dark:from-slate-950 dark:to-slate-900">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Plus size={20} className="text-blue-600" /> Add New Course
                            </CardTitle>
                            <CardDescription>
                                Import your syllabus to automatically generate assignments.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {/* Custom Tabs */}
                            <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg mb-6">
                                {tabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={cn(
                                            "flex-1 flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-md text-xs font-semibold transition-all",
                                            activeTab === tab.id
                                                ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                                                : "text-muted-foreground hover:text-slate-900 dark:hover:text-slate-200"
                                        )}
                                    >
                                        <tab.icon size={16} /> <span className="hidden sm:inline">{tab.label}</span>
                                    </button>
                                ))}
                            </div>

                            <form onSubmit={handleAddCourse} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                        Semester Start Date
                                    </label>
                                    <Input
                                        type="date"
                                        value={semesterStart}
                                        onChange={(e) => setSemesterStart(e.target.value)}
                                        required
                                        className="rounded-lg"
                                    />
                                </div>

                                {activeTab === 'text' && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="space-y-2"
                                    >
                                        <label className="text-sm font-semibold text-slate-900 dark:text-slate-100">Syllabus Text</label>
                                        <Textarea
                                            rows="6"
                                            placeholder="Paste course syllabus content here..."
                                            value={textInput}
                                            onChange={(e) => setTextInput(e.target.value)}
                                            required
                                            className="font-mono text-sm leading-relaxed rounded-lg resize-none"
                                        />
                                    </motion.div>
                                )}

                                {activeTab === 'url' && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="space-y-2"
                                    >
                                        <label className="text-sm font-semibold text-slate-900 dark:text-slate-100">Course Page URL</label>
                                        <Input
                                            type="url"
                                            placeholder="https://example.university.edu/course"
                                            value={urlInput}
                                            onChange={(e) => setUrlInput(e.target.value)}
                                            required
                                            className="rounded-lg"
                                        />
                                    </motion.div>
                                )}

                                {activeTab === 'pdf' && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="space-y-2"
                                    >
                                        <label className="text-sm font-semibold text-slate-900 dark:text-slate-100">Syllabus File</label>
                                        <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-lg p-8 text-center hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all cursor-pointer relative group">
                                            <input
                                                type="file"
                                                accept=".pdf,.txt,.md"
                                                onChange={(e) => setFileInput(e.target.files[0])}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                required={!fileInput}
                                            />
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                                    <Upload size={24} />
                                                </div>
                                                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                    {fileInput ? fileInput.name : "Click to upload"}
                                                </p>
                                                <p className="text-xs text-muted-foreground">PDF, TXT, MD, up to 10MB</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {activeTab === 'manual' && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="space-y-4"
                                    >
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-slate-900 dark:text-slate-100">Course Name</label>
                                                <Input
                                                    placeholder="Intro to CS"
                                                    value={manualName}
                                                    onChange={(e) => setManualName(e.target.value)}
                                                    required
                                                    className="rounded-lg"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold text-slate-900 dark:text-slate-100">Course Code</label>
                                                <Input
                                                    placeholder="CS101"
                                                    value={manualCode}
                                                    onChange={(e) => setManualCode(e.target.value)}
                                                    required
                                                    className="rounded-lg"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center mb-2">
                                                <label className="text-sm font-semibold text-slate-900 dark:text-slate-100">Assignments</label>
                                                <Button type="button" variant="outline" size="sm" onClick={addManualAssignment} className="h-7 text-xs">
                                                    <Plus size={14} className="mr-1" /> Add
                                                </Button>
                                            </div>

                                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                                                {manualAssignments.map((a, i) => (
                                                    <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 space-y-3 relative group">
                                                        <div className="space-y-2">
                                                            <Input
                                                                placeholder="Assignment Name"
                                                                value={a.name}
                                                                onChange={(e) => updateManualAssignment(i, 'name', e.target.value)}
                                                                className="h-8 text-sm"
                                                                required
                                                            />
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <Input
                                                                    type="date"
                                                                    value={a.due_date}
                                                                    onChange={(e) => updateManualAssignment(i, 'due_date', e.target.value)}
                                                                    className="h-8 text-sm"
                                                                    required
                                                                />
                                                                <div className="relative">
                                                                    <Input
                                                                        type="number"
                                                                        placeholder="Hours"
                                                                        value={a.estimated_hours}
                                                                        onChange={(e) => updateManualAssignment(i, 'estimated_hours', parseFloat(e.target.value))}
                                                                        className="h-8 text-sm pr-8"
                                                                        min="0.5"
                                                                        step="0.5"
                                                                    />
                                                                    <span className="absolute right-2 top-2 text-xs text-muted-foreground">h</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <Button type="button" variant="ghost" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeManualAssignment(i)}>
                                                            <Trash2 size={12} />
                                                        </Button>
                                                    </div>
                                                ))}
                                                {manualAssignments.length === 0 && (
                                                    <div className="text-xs text-muted-foreground text-center py-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors" onClick={addManualAssignment}>
                                                        <Plus size={16} className="mx-auto mb-1 opacity-50" />
                                                        No assignments yet. Click to add.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                <Button type="submit" className="w-full mt-6 rounded-lg h-11 font-semibold" disabled={loading} size="lg">
                                    {loading ? (
                                        <>
                                            <Loader className="animate-spin mr-2" size={18} />
                                            Processing...
                                        </>
                                    ) : 'Process Syllabus'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Course List */}
                <div className="lg:col-span-2 space-y-6">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight mb-2">Your Courses</h2>
                        <p className="text-muted-foreground">{courses.length} course{courses.length !== 1 ? 's' : ''} enrolled</p>
                    </div>

                    {courses.length === 0 ? (
                        <Card className="py-16 border-dashed border-2 border-slate-300 dark:border-slate-700">
                            <div className="flex flex-col items-center justify-center text-center px-6">
                                <div className="h-20 w-20 bg-blue-100 dark:bg-blue-950 rounded-full flex items-center justify-center mb-6">
                                    <BookOpen size={40} className="text-blue-600 dark:text-blue-400" />
                                </div>
                                <h3 className="font-bold text-lg">No courses yet</h3>
                                <p className="text-sm text-muted-foreground max-w-xs mt-3 leading-relaxed">
                                    Start by importing your first course syllabus using the form on the left.
                                </p>
                                <Button className="mt-6 rounded-lg" variant="default">
                                    <Plus className="mr-2 h-4 w-4" /> Add First Course
                                </Button>
                            </div>
                        </Card>
                    ) : (
                        <div className="grid gap-4">
                            {courses.map((course, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="group cursor-pointer"
                                    onClick={() => setSelectedCourse(course)}
                                >
                                    <Card className="border-0 shadow-sm hover:shadow-lg transition-all bg-white dark:bg-slate-900 border-l-4 border-l-transparent hover:border-l-blue-500">
                                        <CardContent className="p-6">
                                            <div className="flex items-start justify-between gap-4 mb-4">
                                                <div className="flex-1">
                                                    <div className="flex items-start gap-3">
                                                        <div className="p-3 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-950 dark:to-indigo-950 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                                            <BookOpen className="w-5 h-5" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="font-bold text-lg leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">{course.course_name}</h3>
                                                            <p className="text-sm text-muted-foreground mt-1">{course.course_code}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(idx);
                                                    }}
                                                    className="p-2 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-950/20 transition-colors flex-shrink-0"
                                                    title="Delete Course"
                                                >
                                                    <Trash2 size={18} />
                                                </motion.button>
                                            </div>

                                            <div className="grid grid-cols-3 gap-3">
                                                <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800">
                                                    <div className="text-xs text-muted-foreground font-medium mb-1">Assignments</div>
                                                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{course.assignments ? course.assignments.length : 0}</div>
                                                </div>
                                                <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800">
                                                    <div className="text-xs text-muted-foreground font-medium mb-1">Progress</div>
                                                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{Math.round((course.assignments?.filter(a => a.progress === 100).length || 0) / Math.max(1, course.assignments?.length || 1) * 100)}%</div>
                                                </div>
                                                <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800">
                                                    <div className="text-xs text-muted-foreground font-medium mb-1">Status</div>
                                                    <div className="text-sm font-bold text-purple-600 dark:text-purple-400">Active</div>
                                                </div>
                                            </div>
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
