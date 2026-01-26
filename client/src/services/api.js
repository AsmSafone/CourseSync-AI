import axios from 'axios';

// In production, this should be configurable
const API_URL = import.meta.env.PROD ? '' : 'http://localhost:8000';

const api = axios.create({
    baseURL: API_URL,
});

export const getRoot = () => api.get('/');

export const getState = async () => {
    try {
        const res = await api.get('/api/state');
        return res.data;
    } catch (error) {
        console.error("Error fetching state", error);
        return null;
    }
};

export const getSchedule = () => api.get('/api/schedule');
export const getNotifications = () => api.get('/api/notifications');

export const updateProgress = (assignment_index, progress) =>
    api.post('/api/progress', { assignment_index, progress });

export const addSyllabusText = (syllabus_text, semester_start) =>
    api.post('/api/syllabus/text', { syllabus_text, semester_start });

export const addSyllabusUrl = (url, semester_start) =>
    api.post('/api/syllabus/url', { url, semester_start });

export const addSyllabusPdf = (file, semester_start) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/api/syllabus/pdf?semester_start=${semester_start}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};

export const getSettings = () => api.get('/api/settings');
export const updateSettings = (settings) => api.post('/api/settings', settings);
export const deleteCourse = (index) => api.delete(`/api/course/${index}`);
export const getWorkload = () => api.get('/api/workload');

export default api;
