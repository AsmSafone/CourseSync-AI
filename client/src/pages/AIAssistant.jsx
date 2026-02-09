import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles, Brain, MessageSquare, Trash2, ArrowRight, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { chatWithAI, addSyllabusFile } from '../services/api';
import { cn } from '@/lib/utils';

const AIAssistant = () => {
    const [messages, setMessages] = useState([
        { id: 1, role: 'assistant', content: "Hello! I'm your CourseSync AI assistant. Ask me anything about your courses, assignments, or study schedule! You can also upload a syllabus (PDF, TXT, MD) or paste a link to add a course." }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, loading]);

    const handleSend = async (e) => {
        e?.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = { id: Date.now(), role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const res = await chatWithAI(input);
            if (res.data && res.data.success) {
                setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: res.data.response }]);
            } else {
                setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: "Sorry, I had trouble thinking of an answer. Please try again." }]);
            }
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: "An error occurred. Make sure the server is running." }]);
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const tempId = Date.now();
        setMessages(prev => [...prev, { id: tempId, role: 'user', content: `Uploading ${file.name}...` }]);
        setLoading(true);

        try {
            // Use API service
            const res = await addSyllabusFile(file, '2025-09-01');

            setMessages(prev => prev.filter(m => m.id !== tempId)); // remove loading msg

            if (res.data.success) {
                setMessages(prev => [...prev,
                { id: Date.now(), role: 'user', content: `Uploaded ${file.name}` },
                { id: Date.now() + 1, role: 'assistant', content: `✅ Successfully processed ${file.name} and added the course: ${res.data.course.course_name}` }
                ]);
            } else {
                setMessages(prev => [...prev,
                { id: Date.now(), role: 'user', content: `Uploaded ${file.name}` },
                { id: Date.now() + 1, role: 'assistant', content: `Failed to process file: ${res.data.error}` }
                ]);
            }
        } catch (error) {
            console.error(error);
            setMessages(prev => prev.filter(m => m.id !== tempId));
            setMessages(prev => [...prev, { id: Date.now(), role: 'assistant', content: `Error uploading file: ${error.message}` }]);
        } finally {
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const clearChat = () => {
        setMessages([{ id: Date.now(), role: 'assistant', content: "Chat cleared. How can I help you now?" }]);
    };

    const suggestedQuestions = [
        "What assignments are due this week?",
        "How is my overall progress?",
        "Which course needs most attention?",
        "Can you suggest a study plan?"
    ];

    return (
        <div className="flex flex-col h-[calc(100vh-120px)] max-w-4xl mx-auto space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
                        <Brain className="text-blue-600" /> AI Assistant
                    </h1>
                    <p className="text-muted-foreground text-sm flex items-center gap-1 mt-1">
                        <Sparkles size={14} className="text-amber-500" /> Powered by CourseSync Intelligence
                    </p>
                </div>
                <Button variant="ghost" size="sm" onClick={clearChat} className="text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20">
                    <Trash2 size={16} className="mr-2" /> Clear Chat
                </Button>
            </div>

            {/* Chat Container */}
            <Card className="flex-1 flex flex-col overflow-hidden border-0 shadow-xl bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800">
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
                >
                    <AnimatePresence initial={false}>
                        {messages.map((msg) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                className={cn(
                                    "flex gap-4 max-w-[85%]",
                                    msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                                )}
                            >
                                <div className={cn(
                                    "shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm",
                                    msg.role === 'assistant'
                                        ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white"
                                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                )}>
                                    {msg.role === 'assistant' ? <Bot size={18} /> : <User size={18} />}
                                </div>
                                <div className={cn(
                                    "p-4 rounded-2xl text-sm leading-relaxed",
                                    msg.role === 'assistant'
                                        ? "bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-100 dark:border-slate-800"
                                        : "bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-500/20"
                                )}>
                                    {msg.content}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {loading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex gap-4"
                        >
                            <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center">
                                <Bot size={18} />
                            </div>
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 rounded-tl-none border border-slate-100 dark:border-slate-800">
                                <div className="flex gap-1.5 items-center h-4">
                                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    {messages.length === 1 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                            {suggestedQuestions.map((q, i) => (
                                <Button
                                    key={i}
                                    variant="outline"
                                    size="sm"
                                    className="text-xs rounded-full bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-slate-200 dark:border-slate-700"
                                    onClick={() => {
                                        setInput(q);
                                    }}
                                >
                                    {q} <ArrowRight size={10} className="ml-1" />
                                </Button>
                            ))}
                        </div>
                    )}
                    <form onSubmit={handleSend} className="relative flex gap-2">
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileSelect}
                            accept=".pdf,.txt,.md"
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-slate-500 hover:text-blue-600"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={loading}
                        >
                            <Paperclip size={20} />
                        </Button>
                        <Input
                            placeholder="Ask about courses, upload syllabus, or paste a link..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={loading}
                            className="flex-1 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 rounded-xl h-12 pl-4 pr-12 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                        />
                        <Button
                            type="submit"
                            disabled={!input.trim() || loading}
                            className="absolute right-1.5 top-1.5 h-9 w-9 p-0 rounded-lg bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all hover:scale-105"
                        >
                            <Send size={18} />
                        </Button>
                    </form>
                    <p className="text-[10px] text-center text-muted-foreground mt-3">
                        AI can make mistakes. Verify important academic deadlines.
                    </p>
                </div>
            </Card>
        </div>
    );
};

export default AIAssistant;
