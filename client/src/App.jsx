import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import Schedule from './pages/Schedule';
import Settings from './pages/Settings';
import AIAssistant from './pages/AIAssistant';
import Focus from './pages/Focus';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/assistant" element={<AIAssistant />} />
          <Route path="/focus" element={<Focus />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
