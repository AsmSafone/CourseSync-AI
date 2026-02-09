from datetime import datetime
from typing import List, Dict
from rich.progress import Progress, SpinnerColumn, TextColumn

import json

from .clients import GroqClient, FirecrawlClient
from .prompts import (
    SYLLABUS_PARSER_PROMPT,
    WORKLOAD_ANALYZER_PROMPT,
    SCHEDULE_OPTIMIZER_PROMPT,
    NOTIFICATION_PROMPT,
    AI_ASSISTANT_PROMPT,
)
from .utils import console, extract_json


class CourseSyncAgent:
    """Core CourseSync AI agent with parsing, analysis and scheduling helpers."""

    def __init__(self):
        # GROQ_API_KEY missing check is handled by client; we keep an early guard to be friendly
        self.groq = GroqClient()
        self.firecrawl = FirecrawlClient()

    def parse_syllabus(self, syllabus_text: str, semester_start: str) -> Dict:
        """Parse syllabus and extract assignments"""
        user_prompt = f"""Semester starts on: {semester_start}

Syllabus content:
{syllabus_text}

Extract all assignments in JSON format."""

        with Progress(SpinnerColumn(), TextColumn("[progress.description]{task.description}"), console=console) as progress:
            progress.add_task("🔍 Parsing syllabus...", total=None)
            response = self.groq.call(SYLLABUS_PARSER_PROMPT, user_prompt)

        return extract_json(response)

    def scrape_course_page(self, url: str) -> str:
        """Scrape course webpage for syllabus"""
        if not self.firecrawl:
            console.print("[yellow]⚠️  Firecrawl not configured. Using manual input.[/yellow]")
            return ""

        with Progress(SpinnerColumn(), TextColumn("[progress.description]{task.description}"), console=console) as progress:
            progress.add_task("🌐 Scraping course page...", total=None)
            content = self.firecrawl.scrape(url)

        return content

    def analyze_workload(self, assignments: List[Dict]) -> Dict:
        """Analyze workload distribution"""
        user_prompt = f"""Current date: {datetime.now().strftime('%Y-%m-%d')}

        Assignments:
        {json.dumps(assignments, indent=2)}

        Analyze the workload and identify risk periods."""

        with Progress(SpinnerColumn(), TextColumn("[progress.description]{task.description}"), console=console) as progress:
            progress.add_task("📊 Analyzing workload...", total=None)
            response = self.groq.call(WORKLOAD_ANALYZER_PROMPT, user_prompt)

        return extract_json(response)

    def create_schedule(self, assignments: List[Dict], hours_per_day=4) -> Dict:
        """Create optimized study schedule"""
        user_prompt = f"""Current date: {datetime.now().strftime('%Y-%m-%d')}
        Available study hours per day: {hours_per_day}

        Assignments:
        {json.dumps(assignments, indent=2)}

        Create a detailed study schedule."""

        with Progress(SpinnerColumn(), TextColumn("[progress.description]{task.description}"), console=console) as progress:
            progress.add_task("📅 Creating schedule...", total=None)
            response = self.groq.call(SCHEDULE_OPTIMIZER_PROMPT, user_prompt, temperature=0.5)

        return extract_json(response)

    def generate_notifications(self, schedule: Dict, assignments: List[Dict]) -> List[Dict]:
        """Generate smart notifications"""
        user_prompt = f"""Current date: {datetime.now().strftime('%Y-%m-%d')}

        Schedule:
        {json.dumps(schedule, indent=2)}

        Assignments:
        {json.dumps(assignments, indent=2)}

        Generate strategic notifications."""

        with Progress(SpinnerColumn(), TextColumn("[progress.description]{task.description}"), console=console) as progress:
            progress.add_task("🔔 Generating notifications...", total=None)
            response = self.groq.call(NOTIFICATION_PROMPT, user_prompt, temperature=0.7)

        result = extract_json(response)
        return result if isinstance(result, list) else result.get("notifications", [])

    def chat(self, question: str, courses: List[Dict], assignments: List[Dict]) -> Dict:
        """Answer student questions about their courses"""
        user_prompt = f"""Student Question: {question}

        Context:
        Courses: {json.dumps(courses, indent=2)}
        Assignments: {json.dumps(assignments, indent=2)}

        Answer the student's question based on the context."""

        with Progress(SpinnerColumn(), TextColumn("[progress.description]{task.description}"), console=console) as progress:
            progress.add_task("🤖 Thinking...", total=None)
            response = self.groq.call(AI_ASSISTANT_PROMPT, user_prompt, temperature=0.7)

        # Try to parse as JSON action
        try:
            parsed = extract_json(response)
            if parsed and "action" in parsed:
                return parsed
        except:
            pass
            
        # Fallback to chat
        return {"action": "chat", "content": response}
