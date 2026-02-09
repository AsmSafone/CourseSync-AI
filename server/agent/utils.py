import json
import re
from typing import Dict, List
from rich.console import Console
from datetime import datetime
import uuid
import os
import smtplib
import ssl
from email.message import EmailMessage
import hashlib

# Shared console for nice output
console = Console()


def extract_json(text: str) -> Dict:
    """Extract JSON from LLM response robustly.

    Tries several common patterns (```json blocks, fenced blocks, or plain JSON).
    Returns an empty dict on parse failure and prints a helpful message to console.
    """
    try:
        if "```json" in text:
            json_str = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            json_str = text.split("```")[1].split("```")[0].strip()
        else:
            m_arr = re.search(r'\[[\s\S]*\]', text, re.DOTALL)
            if m_arr:
                json_str = m_arr.group()
            else:
                m_obj = re.search(r'\{[\s\S]*\}', text, re.DOTALL)
                if m_obj:
                    json_str = m_obj.group()
                else:
                    json_str = text.strip()

        return json.loads(json_str)
    except Exception as e:
        console.print(f"[red]Failed to parse JSON: {str(e)}[/red]")
        console.print(f"[dim]Raw response:\n{text}[/dim]")
        return {}

def extract_text_from_file(path: str, original_filename: str = "") -> str:
    """Extract text from various file formats."""
    ext = os.path.splitext(original_filename)[1].lower() if original_filename else ""
    
    try:
        if ext == ".pdf":
            from pdfminer.high_level import extract_text
            return extract_text(path)
        elif ext in [".txt", ".md", ".csv", ".json", ".py", ".js", ".html", ".css"]:
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                return f.read()
        else:
            # Fallback for unknown text-like files, try reading as text
            try:
                with open(path, "r", encoding="utf-8", errors="ignore") as f:
                    return f.read()
            except:
                return ""
    except Exception as e:
        console.print(f"[red]Error extracting text from {original_filename}: {e}[/red]")
        return ""

def create_ics_for_assignments(assignments: List[Dict], filename: str) -> None:
    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//CourseSync-Agent//EN",
        "CALSCALE:GREGORIAN",
    ]
    now = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
    for a in assignments:
        due = a.get("due_date", "")
        if not due:
            continue
        try:
            dt = datetime.strptime(due, "%Y-%m-%d")
            dstr = dt.strftime("%Y%m%d")
        except Exception:
            continue
        uid = str(uuid.uuid4())
        title = f"{a.get('course','Course')} - {a.get('name','Assignment')}"
        desc = f"Type: {a.get('type','')} | Weight: {a.get('weight',0)}% | Hours: {a.get('estimated_hours',0)}"
        lines.extend([
            "BEGIN:VEVENT",
            f"UID:{uid}",
            f"DTSTAMP:{now}",
            f"DTSTART;VALUE=DATE:{dstr}",
            f"DTEND;VALUE=DATE:{dstr}",
            f"SUMMARY:{title}",
            f"DESCRIPTION:{desc}",
            "END:VEVENT",
        ])
    lines.append("END:VCALENDAR")
    with open(filename, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

def get_data_dir() -> str:
    path = os.path.join(os.getcwd(), "data")
    os.makedirs(path, exist_ok=True)
    return path

def load_settings() -> Dict:
    path = os.path.join(get_data_dir(), "settings.json")
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}

def save_settings(settings: Dict) -> None:
    path = os.path.join(get_data_dir(), "settings.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(settings, f, indent=2)

def load_state() -> Dict:
    path = os.path.join(get_data_dir(), "data.json")
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}

def send_email(to: str, subject: str, body: str) -> bool:
    host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    port = int(os.getenv("SMTP_PORT", "587"))
    user = os.getenv("SMTP_USER", "")
    password = os.getenv("SMTP_PASS", "")
    if not to or not user or not password:
        return False
    msg = EmailMessage()
    msg["From"] = user
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(body)
    try:
        context = ssl.create_default_context()
        with smtplib.SMTP(host, port) as server:
            server.starttls(context=context)
            server.login(user, password)
            server.send_message(msg)
        return True
    except Exception:
        return False

def notification_id(notif: Dict) -> str:
    raw = f"{notif.get('type','')}|{notif.get('message','')}|{notif.get('send_at','')}"
    return hashlib.sha256(raw.encode('utf-8')).hexdigest()
