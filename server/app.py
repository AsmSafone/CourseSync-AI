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
    send_email, notification_id, extract_text_from_file, create_ics_for_assignments
)

import logging

# Configure logging
logging.basicConfig(
    filename='server_debug.log',
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

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

class AssignmentModel(BaseModel):
    name: str
    type: str = "homework"
    due_date: str
    weight: float = 0
    estimated_hours: float = 1
    description: Optional[str] = ""

class ManualCourseRequest(BaseModel):
    course_name: str
    course_code: str
    semester_start: str = "2025-09-01"
    assignments: List[AssignmentModel]

class ChatRequest(BaseModel):
    question: str

class AddAssignmentRequest(BaseModel):
    course_name: str
    assignment: AssignmentModel

# API Routes
@app.post("/api/chat")
async def chat_with_assistant(request: ChatRequest):
    """Chat with the academic assistant"""
    try:
        logger.info(f"Chat request: {request.question}")
        result = agent.chat(request.question, state.courses, state.all_assignments)
        logger.info(f"Agent response: {result}")
        
        # Helper to format response
        def format_response(msg):
             return {"success": True, "response": msg}

        if isinstance(result, dict) and "action" in result:
            action = result["action"]
            content = result.get("content", "")
            data = result.get("data", {})
            logger.info(f"Action detected: {action}")
            
            if action == "add_course":
                syllabus_text = data.get("syllabus_text", "")
                if not syllabus_text:
                     # Check if course_name is provided instead (for simple "add course" commands)
                     course_name = data.get("course_name", "")
                     if course_name:
                         syllabus_text = course_name
                     else:
                         logger.warning("Add course action but no syllabus text or course name")
                         return format_response(f"{content}\n(No syllabus text found to process)")

                try:
                    # Check if URL
                    if syllabus_text.startswith("http"):
                        logger.info(f"Scraping URL: {syllabus_text}")
                        scraped = agent.scrape_course_page(syllabus_text)
                        if not scraped:
                             logger.error("Scraping failed")
                             return format_response(f"{content}\n(Failed to scrape the URL provided)")
                        course_data = agent.parse_syllabus(scraped, "2025-09-01") # Default date
                    else:
                        logger.info(f"Parsing syllabus text: {syllabus_text}")
                        # For simple commands like "Add Math 101", parse_syllabus handles the string intelligently
                        course_data = agent.parse_syllabus(syllabus_text, "2025-09-01")
                    
                    logger.info(f"Parsed course data: {course_data}")
                    if course_data:
                        # Ensure 'assignments' key exists
                        if "assignments" not in course_data:
                             course_data["assignments"] = []
                        
                        for a in course_data["assignments"]:
                            a["course"] = course_data.get("course_name", "N/A")
                            a["course_code"] = course_data.get("course_code", "")
                            a["progress"] = 0
                        state.courses.append(course_data)
                        state.all_assignments.extend(course_data["assignments"])
                        state.persist()
                        logger.info("Course persisted (chat action)")
                        return format_response(f"{content}\n\n✅ Automatically added course: {course_data.get('course_name')}")
                    else:
                        logger.error("Failed to parse course details")
                        return format_response(f"{content}\n(Failed to extract course details)")
                except Exception as e:
                     logger.exception("Error processing add_course action")
                     return format_response(f"{content}\n(Error adding course: {str(e)})")

            elif action == "add_assignment":
                course_target = data.get("course_name", "")
                assignment_data = data.get("assignment", {})
                
                if not course_target or not assignment_data:
                    return format_response(f"{content}\n(Missing course name or assignment details)")

                target_lower = course_target.lower()
                found_course = None
                for course in state.courses:
                    if target_lower in course.get("course_name", "").lower() or target_lower in course.get("course_code", "").lower():
                        found_course = course
                        break
                
                if found_course:
                    new_assignment = {
                        "name": assignment_data.get("name", "New Assignment"),
                        "type": assignment_data.get("type", "homework"),
                        "due_date": assignment_data.get("due_date", datetime.now().strftime("%Y-%m-%d")),
                        "weight": assignment_data.get("weight", 0),
                        "estimated_hours": assignment_data.get("estimated_hours", 1),
                        "description": assignment_data.get("description", ""),
                        "course": found_course.get("course_name", ""),
                        "course_code": found_course.get("course_code", ""),
                        "progress": 0
                    }
                    found_course.setdefault("assignments", []).append(new_assignment)
                    state.all_assignments.append(new_assignment)
                    state.persist()
                    return format_response(f"{content}\n\n✅ Added assignment '{new_assignment['name']}' to {found_course['course_name']}")
                else:
                    return format_response(f"{content}\n(Course '{course_target}' not found)")

            elif action == "delete_course":
                target = data.get("course_name", "").lower()
                logger.info(f"Deleting course target: {target}")
                if not target:
                    return format_response(f"{content}\n(No course name specified)")

                for i, c in enumerate(state.courses):
                    if target in c.get("course_name", "").lower() or target in c.get("course_code", "").lower():
                         course = state.courses.pop(i)
                         # remove assignments
                         state.all_assignments = [a for a in state.all_assignments if a.get("course") != course.get("course_name")]
                         state.persist()
                         logger.info(f"Deleted course {course.get('course_name')}")
                         return format_response(f"{content}\n\n🗑️ Deleted course: {course.get('course_name')}")
                
                logger.warning(f"Course not found: {target}")
                return format_response(f"{content}\n(Could not find course '{target}' to delete)")

            elif action == "edit_course":
                 return format_response(f"{content}\n(Editing courses via chat is not fully supported yet. Please delete and re-add.)")
            
            else:
                 return format_response(content)
        
        # Fallback
        return format_response(str(result))

    except Exception as e:
        logger.exception("Chat endpoint error")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/state")
async def get_state():
    """Get current application state"""
    # Calculate course progress
    courses_with_progress = []
    for course in state.courses:
        course_name = course.get("course_name", "")
        course_assignments = [a for a in state.all_assignments if a.get("course") == course_name]
        
        if course_assignments:
            completed = sum(1 for a in course_assignments if a.get("progress", 0) == 100)
            progress = round((completed / len(course_assignments)) * 100)
        else:
            progress = 0
        
        course_copy = course.copy()
        course_copy["progress"] = progress
        course_copy["assignments"] = course_assignments
        courses_with_progress.append(course_copy)
    
    # Get pending assignments (not completed)
    pending_assignments = [a for a in state.all_assignments if a.get("progress", 0) < 100]
    
    return {
        "courses": courses_with_progress,
        "assignments": state.all_assignments,
        "settings": state.settings,
        "stats": {
            "total_courses": len(state.courses),
            "total_assignments": len(state.all_assignments),
            "completed_assignments": sum(1 for a in state.all_assignments if a.get("progress", 0) == 100),
            "pending_assignments": len(pending_assignments),
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
        msg = str(e)
        lower = msg.lower()
        if "rate limit" in lower or "rate limited" in lower or "groq api unavailable" in lower or "groq" in lower:
            # Service unavailable / rate limit - return 503 so client can retry
            raise HTTPException(status_code=503, detail="LLM service unavailable or rate limited. Try again later.")
        raise HTTPException(status_code=500, detail=msg)

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
        msg = str(e)
        lower = msg.lower()
        if "rate limit" in lower or "rate limited" in lower or "groq api unavailable" in lower or "groq" in lower:
            raise HTTPException(status_code=503, detail="LLM service unavailable or rate limited. Try again later.")
        raise HTTPException(status_code=500, detail=msg)

@app.post("/api/syllabus/file")
async def add_syllabus_file(file: UploadFile = File(...), semester_start: str = "2025-09-01"):
    """Add syllabus from any text-based file (PDF, TXT, MD, etc.)"""
    try:
        logger.info(f"Received file upload: {file.filename}")
        # Save uploaded file temporarily
        temp_path = os.path.join(data_dir, f"temp_{file.filename}")
        with open(temp_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        # Extract text using updated helper
        text = extract_text_from_file(temp_path, file.filename)
        os.remove(temp_path)  # Clean up
        
        logger.info(f"Extracted {len(text)} chars from file.")
        if len(text) < 50:
            logger.warning(f"Extracted text too short: {text}")

        if not text.strip():
            logger.error("No content extracted from file.")
            return {"success": False, "error": "No content extracted from file. Only text-based files (PDF, TXT, MD, etc.) are supported."}
        
        course_data = agent.parse_syllabus(text, semester_start)
        logger.info(f"Parsed course data: {course_data}")

        if course_data and "assignments" in course_data:
            for a in course_data["assignments"]:
                a["course"] = course_data.get("course_name", "N/A")
                a["course_code"] = course_data.get("course_code", "")
                a["progress"] = a.get("progress", 0)
            state.courses.append(course_data)
            state.all_assignments.extend(course_data["assignments"])
            state.persist()
            logger.info("Course persisted successfully.")
            return {"success": True, "course": course_data}
        else:
            logger.error("Failed to parse syllabus: Missing 'assignments' key or empty result.")
            return {"success": False, "error": "Failed to parse syllabus from file"}
    except Exception as e:
        logger.exception("Error in add_syllabus_file:")
        msg = str(e)
        lower = msg.lower()
        if "rate limit" in lower or "rate limited" in lower or "groq api unavailable" in lower or "groq" in lower:
            raise HTTPException(status_code=503, detail="LLM service unavailable or rate limited. Try again later.")
        raise HTTPException(status_code=500, detail=msg)

@app.post("/api/course/manual")
async def add_course_manual(request: ManualCourseRequest):
    """Add a course manually (bypassing AI parsing)"""
    try:
        assignments = []
        for a in request.assignments:
             assignments.append({
                 "name": a.name,
                 "type": a.type,
                 "due_date": a.due_date,
                 "weight": a.weight,
                 "estimated_hours": a.estimated_hours,
                 "description": a.description if a.description else "",
                 "course": request.course_name,
                 "course_code": request.course_code,
                 "progress": 0
             })
        
        course_data = {
            "course_name": request.course_name,
            "course_code": request.course_code,
            "assignments": assignments
        }
        
        state.courses.append(course_data)
        state.all_assignments.extend(assignments)
        state.persist()
        return {"success": True, "course": course_data}
    except Exception as e:
        logger.exception("Error adding course manually")
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
    try:
        from datetime import datetime, timedelta
        
        notifications = []
        now = datetime.now()
        lead_days = state.settings.get("notification_lead_days", 3)
        
        for assignment in state.all_assignments:
            if assignment.get("progress", 0) == 100:  # Skip completed
                continue
            
            due_date_str = assignment.get("due_date", "")
            if not due_date_str:
                continue
            
            try:
                due_date = datetime.strptime(due_date_str, "%Y-%m-%d")
            except:
                continue
            
            days_until = (due_date - now).days
            
            # Create notifications based on urgency
            notification_type = "info"
            title = ""
            message = ""
            
            if days_until < 0:  # Overdue
                notification_type = "error"
                title = "🚨 OVERDUE!"
                message = f"{assignment['name']} ({assignment['course']}) was due {abs(days_until)} days ago!"
            elif days_until == 0:  # Due today
                notification_type = "warning"
                title = "⏰ Due Today!"
                message = f"{assignment['name']} ({assignment['course']}) is due today!"
            elif days_until == 1:  # Due tomorrow
                notification_type = "warning"
                title = "📌 Due Tomorrow!"
                message = f"{assignment['name']} ({assignment['course']}) is due tomorrow!"
            elif days_until <= lead_days:  # Within lead days
                notification_type = "success"
                title = "📋 Upcoming"
                message = f"{assignment['name']} ({assignment['course']}) is due in {days_until} days"
            else:
                continue  # Don't create notification
            
            notifications.append({
                "id": notification_id({"type": notification_type, "message": message, "send_at": now.isoformat()}),
                "type": notification_type,
                "title": title,
                "message": message,
                "assignment": assignment['name'],
                "course": assignment['course'],
                "due_date": due_date_str,
                "days_until": days_until,
                "timestamp": now.isoformat()
            })
        
        return {"success": True, "notifications": notifications}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/assignments")
async def add_assignment(request: AddAssignmentRequest):
    """Add an assignment to an existing course"""
    try:
        target_course = None
        target_lower = request.course_name.lower()
        
        # Find course
        for course in state.courses:
            if course.get("course_name", "").lower() == target_lower or course.get("course_code", "").lower() == target_lower:
                target_course = course
                break
        
        if not target_course:
            # Try partial match if exact match fails
            for course in state.courses:
                if target_lower in course.get("course_name", "").lower():
                    target_course = course
                    break
        
        if not target_course:
            return {"success": False, "error": f"Course '{request.course_name}' not found"}

        # process assignment
        a = request.assignment
        new_assignment = {
            "name": a.name,
            "type": a.type,
            "due_date": a.due_date,
            "weight": a.weight,
            "estimated_hours": a.estimated_hours,
            "description": a.description,
            "course": target_course.get("course_name"),
            "course_code": target_course.get("course_code"),
            "progress": 0
        }
        
        target_course.setdefault("assignments", []).append(new_assignment)
        state.all_assignments.append(new_assignment)
        state.persist()
        
        return {"success": True, "assignment": new_assignment}

    except Exception as e:
        logger.exception("Error adding assignment")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/progress")
async def update_progress(update: ProgressUpdate):
    """Update assignment progress"""
    try:
        if 0 <= update.assignment_index < len(state.all_assignments):
            assignment = state.all_assignments[update.assignment_index]
            old_progress = assignment.get("progress", 0)
            new_progress = max(0, min(100, update.progress))
            
            assignment["progress"] = new_progress
            
            # Update completed_at timestamp
            if new_progress == 100 and old_progress < 100:
                assignment["completed_at"] = datetime.now().isoformat()
            elif new_progress < 100:
                # Remove completion timestamp if getting un-completed
                assignment.pop("completed_at", None)
                
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

