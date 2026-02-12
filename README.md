# CourseSync-AI

An intelligent academic course management Web Application powered by LLM for syllabus parsing, workload analysis, and smart scheduling.

## Problem Statement

The academic course management landscape faces several critical challenges:

1. **Manual Syllabus Processing**: Time-consuming manual extraction of assignment information from syllabus
2. **Workload Management**: Difficulty in balancing assignments and study time across multiple courses
3. **Deadline Tracking**: Challenge in managing multiple deadlines and prioritizing tasks effectively
4. **Study Planning**: Lack of optimized study schedules that account for workload distribution
5. **Proactive Notifications**: Missing timely reminders and strategic study recommendations

CourseSync-AI redefines academic management through a **multi-agent system** where specialized AI agents collaborate to handle complex tasks. Unlike traditional tools, it doesn't just store data—it actively perceives, plans, and acts to optimize your academic life.

## System Architecture
![System Architecture Diagram](diagram.png)

## System Design & Reasoning Flow

### The Agency of CourseSync
The system is composed of specialized agents working in concert:

1.  **Syllabus Parsing Agent**: Autonomously reads and structures complex course documents.
2.  **Workload Analysis Agent**: Proactively identifies stress points and visualizes risk.
3.  **Scheduling Agent**: Intellectually plans your days based on priorities and energy levels.
4.  **Assistant Agent**: A conversational partner that executes commands and answers queries.

2. **Technology Stack**
   - **Language Models**:
     - Groq LLM (llama-3.3-70b-versatile) for intelligent processing
   
   - **External Services**:
     - Firecrawl API for web page scraping
     - SMTP (configurable via environment) for email notifications
   
   - **Web Framework**:
     - **Backend**: FastAPI for robust REST API
     - **Frontend**: React + Vite for high-performance UI
     - **Styling**: TailwindCSS with Framer Motion for animations
     - **Visualization**: Recharts for interactive analytics
     - **Icons**: Lucide React for modern iconography

3. **Data Structures**
   - Course information (name, code, instructor)
   - Assignments (name, type, due date, weight, hours)
   - Workload analysis (weekly breakdown, risk periods)
   - Study schedule (daily tasks, priorities)
   - Smart notifications (deadlines, reminders, warnings)

### Data Flow

1. **Input Sources**:
   - Manual syllabus text entry via web interface
   - PDF file upload
   - Web page scraping via Firecrawl
   - Configuration via environment variables
   - User preferences (study hours, semester dates) through settings

2. **Processing Pipeline**:
   - Syllabus parsing with structured JSON output
   - Workload analysis with risk identification
   - Schedule optimization with task breakdown
   - Smart notification generation

3. **Output Generation**:
   - Beautiful web dashboard with real-time statistics
   - Interactive course and assignment management
   - Visual workload analysis with charts
   - Personalized study schedules
   - Smart notification panel
   - Calendar export (.ics format)
   - Email notifications (optional) with background scheduler

## Features

- 🤖 **Agentic Chat Assistant**: Command your personal AI to manage courses, upload files, and answer queries naturally.
- 🎓 **Autonomous Import**: Drag-and-drop a PDF, and watch the agent extract every deadline instantly.
- 📋 **Assignment Tracking**: Track progress with visual progress bars
- 📊 **Workload Analysis**: Visual breakdown of weekly hours and risk periods
- 📅 **Smart Scheduling**: AI-generated personalized study schedules
- 🔔 **Smart Notifications**: Strategic reminders and deadline alerts
- 🎯 **Focus Mode**: Pomodoro-style timer with task tracking and detailed insights
- 📆 **Calendar Export**: Export assignments to .ics format
- ⚙️ **Customizable Settings**: Configure study hours, risk thresholds, and notifications
- 📱 **Responsive Design**: Works beautifully on desktop, tablet, and mobile

## Limitations and Future Work

### Current Limitations

1. **Input Constraints**
   - PDF parsing depends on file layout clarity
   - Web scraping limited to publicly accessible pages
   - Initial study hour estimates are generalized averages

2. **Technical Constraints**
   - Groq API dependency
   - No offline mode support
   - Basic error handling

3. **Feature Limitations**
   - No collaborative features
   - Static notification rules
   - Limited customization options

### Future Work

1. **Enhanced Capabilities**
   - Calendar integration via APIs (Google Calendar, Outlook)
   - Dynamic study hour estimation based on historical performance
   - Predictive analytics for grade outcomes
   - Native Mobile App (iOS/Android) with push notifications

2. **Technical Improvements**
   - Multi-LLM provider support
   - Offline mode operation
   - Enhanced error handling
   - Real-time collaboration

3. **Feature Expansions**
   - Collaborative study groups
   - Custom notification rules
   - Learning style adaptation
   - Integration with learning management systems

## Getting Started

### Prerequisites

- Python 3.7+
- pip package manager
- Groq API key
- (Optional) Firecrawl API key for web scraping

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/AsmSafone/CourseSync-AI.git
   cd CourseSync-AI
   ```

2. **Setup Frontend (Required)**
   ```bash
   cd client
   npm install
   npm run build
   cd ..
   ```
   *Note: This builds the React frontend to be served by the Python backend.*

3. **Create and activate virtual environment**
   ```bash
   # Windows
   python -m venv venv
   .\venv\Scripts\activate

   # Linux/Mac
   python -m venv venv
   source venv/bin/activate
   ```

4. **Install backend dependencies**
   ```bash
   pip install -r requirements.txt
   ```

5. **Configuration**
   
   Create a `.env` file in the project root:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   FIRECRAWL_API_KEY=your_firecrawl_api_key_here  # Optional
   
   # SMTP settings for email notifications (optional)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@example.com
   SMTP_PASS=your_email_app_password
   ```

### Running the Application

Start the web server:
```bash
python main.py
```

Or run directly:
```bash
python webui.py
```

Then open your browser and navigate to:
```
http://localhost:8000
```

### Data Persistence

- The application creates a local `data/` folder automatically
- Settings are stored in `data/settings.json`
- Current state (courses and assignments) is stored in `data/data.json` and updated automatically
- Calendar exports default to `data/coursesync_calendar.ics`

## Usage Guide

### Dashboard
- **Overview**: View a summary of your academic progress
- **Notifications**: Check the bell icon for strategic reminders and deadline alerts
- **Widgets**: Track total, completed, and pending assignments

### Courses
1. Navigate to the **Courses** page
2. **Add Course**:
   - **Text**: Paste syllabus content directly
   - **URL**: Provide a course webpage URL for automatic scraping
   - **PDF**: Upload a PDF file containing the syllabus
   - **Manual Entry**: Manually enter course details and assignments
3. **Manage Assignments**:
   - Click on a course to view detailed assignment lists
   - Add new assignments manually
   - Track progress and mark tasks as complete

### Schedule
1. Navigate to the **Schedule** page
2. View your personalized study plan sorted by urgency
3. Filter assignments by **Pending**, **Overdue**, or **Completed**
4. visual indicators for deadlines and priorities

### Focus Mode

- Navigate to **Focus Mode** to start a study session
- **Timer**: Use the built-in Pomodoro timer (25m Focus, 5m Short Break, 15m Long Break)
- **Task Tracking**: Select a specific assignment to log time against
- **Insights**: Track sessions completed, minutes focused, and total hours per assignment
- **Persistence**: Timer state is saved automatically, so you can reload without losing progress

### AI Assistant

- Navigate to the **AI Assistant** page
- **Chat**: Ask questions about your schedule (e.g., "What's due this week?", "How is my progress?")
- **Actions**: The Assistant can add, edit, or delete courses and assignments based on your commands
- **Upload**: You can also upload syllabus files directly in the chat for processing

### Settings

Configure your preferences:
- **Study Preferences**: Daily hours, risk threshold, notification lead days
- **Email Notifications**: Enable/disable, set recipient email, configure scheduler
- **Export**: Download calendar file (.ics format)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.
