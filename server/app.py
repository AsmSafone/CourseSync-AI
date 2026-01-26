"""FastAPI web server for CourseSync-Agent web UI"""

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import os
import json
import threading
import time
from datetime import datetime

from .agent.agent import CourseSyncAgent
from .agent.utils import (
    get_data_dir, load_settings, save_settings, load_state,
    send_email, notification_id, extract_text_from_pdf, create_ics_for_assignments
)

app = FastAPI(title="CourseSync-Agent Web UI")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize agent and state
agent = CourseSyncAgent()
data_dir = get_data_dir()

# State management
class State:
    def __init__(self):
        self.courses = []
        self.all_assignments = []
        self.sent_notifications = []
        self.settings = self._load_settings()
        self.scheduler_thread = None
        self.scheduler_stop_event = threading.Event()
        self._load_state()
    
    def _load_settings(self):
        base = {
            "hours_per_day": 4,
            "risk_threshold": 20,
            "notification_lead_days": 3,
            "calendar_filename": os.path.join(data_dir, "coursesync_calendar.ics"),
            "email_enabled": False,
            "email_to": "",
            "email_schedule_enabled": False,
            "notification_poll_seconds": 60,
        }
        loaded = load_settings()
        settings = {**base, **loaded}
        save_settings(settings)
        return settings
    
    def _load_state(self):
        state = load_state()
        self.courses = state.get("courses", [])
        self.all_assignments = state.get("assignments", [])
        self.sent_notifications = state.get("sent_notifications", [])
    
    def persist(self):
        state = {
            "timestamp": datetime.now().isoformat(),
            "courses": self.courses,
            "assignments": self.all_assignments,
            "settings": self.settings,
            "sent_notifications": self.sent_notifications,
        }
        try:
            path = os.path.join(data_dir, "data.json")
            with open(path, "w", encoding="utf-8") as f:
                json.dump(state, f, indent=2)
        except Exception as e:
            print(f"Error persisting state: {e}")

state = State()

# Pydantic models
class SyllabusRequest(BaseModel):
    syllabus_text: str
    semester_start: str

class URLRequest(BaseModel):
    url: str
    semester_start: str

class ProgressUpdate(BaseModel):
    assignment_index: int
    progress: int

class SettingsUpdate(BaseModel):
    hours_per_day: Optional[int] = None
    risk_threshold: Optional[int] = None
    notification_lead_days: Optional[int] = None
    calendar_filename: Optional[str] = None
    email_enabled: Optional[bool] = None
    email_to: Optional[str] = None
    email_schedule_enabled: Optional[bool] = None
    notification_poll_seconds: Optional[int] = None

# API Routes


@app.get("/api/state")
async def get_state():
    """Get current application state"""
    return {
        "courses": state.courses,
        "assignments": state.all_assignments,
        "settings": state.settings,
        "stats": {
            "total_courses": len(state.courses),
            "total_assignments": len(state.all_assignments),
            "completed_assignments": sum(1 for a in state.all_assignments if a.get("progress", 0) == 100),
        }
    }

@app.post("/api/syllabus/text")
async def add_syllabus_text(request: SyllabusRequest):
    """Add syllabus from text"""
    try:
        course_data = agent.parse_syllabus(request.syllabus_text, request.semester_start)
        
        if course_data and "assignments" in course_data:
            for a in course_data["assignments"]:
                a["course"] = course_data.get("course_name", "N/A")
                a["course_code"] = course_data.get("course_code", "")
                a["progress"] = a.get("progress", 0)
            state.courses.append(course_data)
            state.all_assignments.extend(course_data["assignments"])
            state.persist()
            return {"success": True, "course": course_data}
        else:
            return {"success": False, "error": "Failed to parse syllabus"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/syllabus/url")
async def add_syllabus_url(request: URLRequest):
    """Add syllabus from URL"""
    try:
        content = agent.scrape_course_page(request.url)
        if not content:
            return {"success": False, "error": "Failed to scrape URL"}
        
        course_data = agent.parse_syllabus(content, request.semester_start)
        
        if course_data and "assignments" in course_data:
            for a in course_data["assignments"]:
                a["course"] = course_data.get("course_name", "N/A")
                a["course_code"] = course_data.get("course_code", "")
                a["progress"] = a.get("progress", 0)
            state.courses.append(course_data)
            state.all_assignments.extend(course_data["assignments"])
            state.persist()
            return {"success": True, "course": course_data}
        else:
            return {"success": False, "error": "Failed to parse scraped content"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/syllabus/pdf")
async def add_syllabus_pdf(file: UploadFile = File(...), semester_start: str = "2025-09-01"):
    """Add syllabus from PDF"""
    try:
        # Save uploaded file temporarily
        temp_path = os.path.join(data_dir, f"temp_{file.filename}")
        with open(temp_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        # Extract text
        text = extract_text_from_pdf(temp_path)
        os.remove(temp_path)  # Clean up
        
        if not text.strip():
            return {"success": False, "error": "No content extracted from PDF"}
        
        course_data = agent.parse_syllabus(text, semester_start)
        
        if course_data and "assignments" in course_data:
            for a in course_data["assignments"]:
                a["course"] = course_data.get("course_name", "N/A")
                a["course_code"] = course_data.get("course_code", "")
                a["progress"] = a.get("progress", 0)
            state.courses.append(course_data)
            state.all_assignments.extend(course_data["assignments"])
            state.persist()
            return {"success": True, "course": course_data}
        else:
            return {"success": False, "error": "Failed to parse syllabus from PDF"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/workload")
async def get_workload():
    """Get workload analysis"""
    if not state.all_assignments:
        return {"error": "No assignments to analyze"}
    
    try:
        analysis = agent.analyze_workload(state.all_assignments)
        return {"success": True, "analysis": analysis}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/schedule")
async def get_schedule(hours_per_day: int = None):
    """Get study schedule"""
    if not state.all_assignments:
        return {"error": "No assignments to schedule"}
    
    try:
        hours = hours_per_day or state.settings.get("hours_per_day", 4)
        schedule = agent.create_schedule(state.all_assignments, hours)
        return {"success": True, "schedule": schedule}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/notifications")
async def get_notifications():
    """Get smart notifications"""
    if not state.all_assignments:
        return {"error": "No assignments to notify about"}
    
    try:
        schedule = agent.create_schedule(state.all_assignments, state.settings.get("hours_per_day", 4))
        notifications = agent.generate_notifications(schedule, state.all_assignments) or []
        return {"success": True, "notifications": notifications}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/progress")
async def update_progress(update: ProgressUpdate):
    """Update assignment progress"""
    try:
        if 0 <= update.assignment_index < len(state.all_assignments):
            state.all_assignments[update.assignment_index]["progress"] = max(0, min(100, update.progress))
            state.persist()
            return {"success": True}
        else:
            return {"success": False, "error": "Invalid assignment index"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/calendar")
async def export_calendar():
    """Export calendar as ICS file"""
    if not state.all_assignments:
        raise HTTPException(status_code=400, detail="No assignments to export")
    
    try:
        filename = state.settings.get("calendar_filename", os.path.join(data_dir, "coursesync_calendar.ics"))
        create_ics_for_assignments(state.all_assignments, filename)
        return FileResponse(
            filename,
            media_type="text/calendar",
            filename=os.path.basename(filename)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/settings")
async def get_settings():
    """Get current settings"""
    return state.settings

@app.post("/api/settings")
async def update_settings(settings_update: SettingsUpdate):
    """Update settings"""
    try:
        update_dict = settings_update.dict(exclude_unset=True)
        state.settings.update(update_dict)
        save_settings(state.settings)
        state.persist()
        return {"success": True, "settings": state.settings}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/course/{course_index}")
async def delete_course(course_index: int):
    """Delete a course"""
    try:
        if 0 <= course_index < len(state.courses):
            course = state.courses.pop(course_index)
            # Remove associated assignments
            state.all_assignments = [
                a for a in state.all_assignments 
                if a.get("course") != course.get("course_name")
            ]
            state.persist()
            return {"success": True}
        else:
            return {"success": False, "error": "Invalid course index"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Static file serving for React build
static_dir = os.path.join(os.path.dirname(__file__), "static")

if os.path.exists(static_dir):
    # Mount assets
    assets_dir = os.path.join(static_dir, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    # Serve index.html on root
    @app.get("/")
    async def read_root():
        return FileResponse(os.path.join(static_dir, "index.html"))

    # Catch-all for SPA client-side routing
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Don't intercept API calls (though they should be handled above)
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="API endpoint not found")
            
        # Check if acts file exists (like vite.svg)
        potential_path = os.path.join(static_dir, full_path)
        if os.path.isfile(potential_path):
            return FileResponse(potential_path)
            
        # Default to index.html
        return FileResponse(os.path.join(static_dir, "index.html"))
else:
    @app.get("/")
    async def read_root():
        return JSONResponse({"message": "Frontend not found. Please run 'npm run build' in client directory."})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

