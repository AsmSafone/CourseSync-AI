from typing import Dict, List
from datetime import datetime
from rich.table import Table
from rich.panel import Panel
from rich import box
from rich.prompt import Prompt
import os
import threading
import time

from .agent import CourseSyncAgent
from .utils import console
from .utils import get_data_dir, load_settings, save_settings, load_state
from .utils import send_email, notification_id


class CourseSyncCLI:
    """Beautiful CLI Interface for CourseSync"""

    def __init__(self):
        self.agent = CourseSyncAgent()
        self.courses = []
        self.all_assignments = []
        self.data_dir = get_data_dir()
        base = {
            "hours_per_day": 4,
            "risk_threshold": 20,
            "notification_lead_days": 3,
            "calendar_filename": os.path.join(self.data_dir, "coursesync_calendar.ics"),
            "email_enabled": False,
            "email_to": "",
            "email_schedule_enabled": False,
            "notification_poll_seconds": 60,
        }
        loaded = load_settings()
        self.settings = {**base, **loaded}
        save_settings(self.settings)
        state = load_state()
        self.courses = state.get("courses", [])
        self.all_assignments = state.get("assignments", [])
        self.sent_notifications = state.get("sent_notifications", [])
        self.scheduler_thread = None
        self.scheduler_stop_event = threading.Event()

    def show_banner(self):
        """Display welcome banner"""
        banner = """
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   ██████╗ ██████╗ ██╗   ██╗██████╗ ███████╗███████╗  ║
║  ██╔════╝██╔═══██╗██║   ██║██╔══██╗██╔════╝██╔════╝  ║
║  ██║     ██║   ██║██║   ██║██████╔╝███████╗█████╗    ║
║  ██║     ██║   ██║██║   ██║██╔══██╗╚════██║██╔══╝    ║
║  ╚██████╗╚██████╔╝╚██████╔╝██║  ██║███████║███████╗  ║
║   ╚═════╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚══════╝╚══════╝  ║
║                                                       ║
║        Smart Deadline & Workload Balancer 🎓         ║
║                  Powered by AI                        ║
╚═══════════════════════════════════════════════════════╝
        """
        console.print(banner, style="bold cyan")
        console.print("\n[dim]Making campus life smarter, one deadline at a time.[/dim]\n")

    def main_menu(self):
        """Display main menu"""
        while True:
            console.print("\n[bold cyan]═══ Main Menu ═══[/bold cyan]\n")

            menu = Table(show_header=False, box=box.SIMPLE)
            menu.add_column("Option", style="cyan")
            menu.add_column("Description", style="white")

            menu.add_row("1", "📄 Add Course Syllabus (Text)")
            menu.add_row("2", "📎 Add Syllabus from PDF")
            menu.add_row("3", "🌐 Scrape Course Page (URL)")
            menu.add_row("4", "📊 Analyze Workload")
            menu.add_row("5", "📅 Generate Study Schedule")
            menu.add_row("6", "🔔 View Smart Notifications")
            menu.add_row("7", "📋 View All Assignments")
            menu.add_row("8", "✅ Track Progress")
            menu.add_row("9", "📆 Export Calendar (.ics)")
            menu.add_row("10", "⚙️  Settings")
            menu.add_row("11", "💾 Save Data")
            menu.add_row("12", "🚪 Exit")

            console.print(menu)

            choice = Prompt.ask("\n[bold yellow]Select option[/bold yellow]", choices=["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"])

            if choice == "1":
                self.add_syllabus_text()
            elif choice == "2":
                self.add_syllabus_pdf()
            elif choice == "3":
                self.scrape_course_url()
            elif choice == "4":
                self.show_workload_analysis()
            elif choice == "5":
                self.show_schedule()
            elif choice == "6":
                self.show_notifications()
            elif choice == "7":
                self.show_assignments()
            elif choice == "8":
                self.track_progress()
            elif choice == "9":
                self.export_calendar()
            elif choice == "10":
                self.settings_menu()
            elif choice == "11":
                self.save_data()
            elif choice == "12":
                console.print("\n[bold green]👋 Stay organized! See you soon![/bold green]\n")
                break

    def add_syllabus_text(self):
        """Add syllabus via text input"""
        console.print("\n[bold cyan]📄 Add Course Syllabus[/bold cyan]")
        console.print("[dim]Paste your syllabus content (press Ctrl+D or Ctrl+Z when done):[/dim]\n")

        lines = []
        try:
            while True:
                line = input()
                lines.append(line)
        except EOFError:
            pass

        syllabus_text = "\n".join(lines)

        if not syllabus_text.strip():
            console.print("[yellow]⚠️  No content provided.[/yellow]")
            return

        semester_start = Prompt.ask("\n[yellow]Semester start date[/yellow]", default="2025-09-01")

        course_data = self.agent.parse_syllabus(syllabus_text, semester_start)

        if course_data and "assignments" in course_data:
            for a in course_data["assignments"]:
                a["course"] = course_data.get("course_name", "N/A")
                a["course_code"] = course_data.get("course_code", "")
                a["progress"] = a.get("progress", 0)
            self.courses.append(course_data)
            self.all_assignments.extend(course_data["assignments"])

            console.print(f"\n[green]✅ Added {course_data.get('course_name', 'course')} with {len(course_data['assignments'])} assignments![/green]")
            self.display_course_summary(course_data)
            self.persist()
        else:
            console.print("[red]❌ Failed to parse syllabus.[/red]")
            console.print("[bold cyan]\nManual Entry Fallback[/bold cyan]")
            cname = Prompt.ask("[yellow]Course name[/yellow]", default="Untitled Course")
            ccode = Prompt.ask("[yellow]Course code[/yellow]", default="N/A")
            instr = Prompt.ask("[yellow]Instructor[/yellow]", default="N/A")
            try:
                count = int(Prompt.ask("[yellow]Number of assignments[/yellow]", default="1"))
            except Exception:
                count = 1
            type_defaults = {"quiz": 2, "homework": 5, "project": 20, "exam": 8, "presentation": 10}
            manual_course = {"course_name": cname, "course_code": ccode, "instructor": instr, "assignments": []}
            for i in range(count):
                console.print(f"\n[bold]Assignment {i+1}[/bold]")
                name = Prompt.ask("[yellow]Name[/yellow]", default=f"Assignment {i+1}")
                atype = Prompt.ask("[yellow]Type[/yellow]", default="homework")
                due = Prompt.ask("[yellow]Due date (YYYY-MM-DD)[/yellow]", default=datetime.now().strftime("%Y-%m-%d"))
                weight = int(Prompt.ask("[yellow]Weight (%)[/yellow]", default="10"))
                default_h = type_defaults.get(atype.lower(), 5)
                hours = int(Prompt.ask("[yellow]Estimated hours[/yellow]", default=str(default_h)))
                desc = Prompt.ask("[yellow]Description[/yellow]", default="")
                a = {
                    "course": cname,
                    "course_code": ccode,
                    "name": name,
                    "type": atype,
                    "due_date": due,
                    "weight": weight,
                    "estimated_hours": hours,
                    "description": desc,
                    "progress": 0,
                }
                manual_course["assignments"].append(a)
            self.courses.append(manual_course)
            self.all_assignments.extend(manual_course["assignments"])
            console.print(f"\n[green]✅ Added {cname} with {len(manual_course['assignments'])} assignments![/green]")
            self.display_course_summary(manual_course)
            self.persist()

    def scrape_course_url(self):
        """Scrape course page from URL"""
        console.print("\n[bold cyan]🌐 Scrape Course Page[/bold cyan]")
        url = Prompt.ask("[yellow]Enter course webpage URL[/yellow]")

        content = self.agent.scrape_course_page(url)

        if content:
            semester_start = Prompt.ask("\n[yellow]Semester start date[/yellow]", default="2025-09-01")
            course_data = self.agent.parse_syllabus(content, semester_start)

            if course_data and "assignments" in course_data:
                for a in course_data["assignments"]:
                    a["course"] = course_data.get("course_name", "N/A")
                    a["course_code"] = course_data.get("course_code", "")
                    a["progress"] = a.get("progress", 0)
                self.courses.append(course_data)
                self.all_assignments.extend(course_data["assignments"])
                console.print(f"\n[green]✅ Scraped and parsed {course_data.get('course_name', 'course')}![/green]")
                self.display_course_summary(course_data)
                self.persist()
            else:
                console.print("[red]❌ Failed to parse scraped content.[/red]")
        else:
            console.print("[yellow]⚠️  Scraping failed. Try manual input instead.[/yellow]")

    def add_syllabus_pdf(self):
        console.print("\n[bold cyan]📎 Add Syllabus from PDF[/bold cyan]")
        path = Prompt.ask("[yellow]Enter PDF file path[/yellow]")
        try:
            from .utils import extract_text_from_pdf
            text = extract_text_from_pdf(path)
        except Exception as e:
            console.print(f"[red]❌ Failed to read PDF: {str(e)}[/red]")
            return
        if not text.strip():
            console.print("[yellow]⚠️  No content extracted from PDF.[/yellow]")
            return
        semester_start = Prompt.ask("\n[yellow]Semester start date[/yellow]", default="2025-09-01")
        course_data = self.agent.parse_syllabus(text, semester_start)
        if course_data and "assignments" in course_data:
            for a in course_data["assignments"]:
                a["course"] = course_data.get("course_name", "N/A")
                a["course_code"] = course_data.get("course_code", "")
                a["progress"] = a.get("progress", 0)
            self.courses.append(course_data)
            self.all_assignments.extend(course_data["assignments"])
            console.print(f"\n[green]✅ Added {course_data.get('course_name', 'course')} from PDF![/green]")
            self.display_course_summary(course_data)
        else:
            console.print("[red]❌ Failed to parse syllabus from PDF.[/red]")

    def display_course_summary(self, course_data: Dict):
        """Display course summary"""
        panel = Panel(
            f"[bold]{course_data.get('course_name', 'Unknown')}[/bold]\n"
            f"Code: {course_data.get('course_code', 'N/A')}\n"
            f"Instructor: {course_data.get('instructor', 'N/A')}\n"
            f"Assignments: {len(course_data.get('assignments', []))}",
            title="📚 Course Summary",
            border_style="green",
        )
        console.print(panel)

    def show_assignments(self):
        """Display all assignments"""
        if not self.all_assignments:
            console.print("\n[yellow]📋 No assignments yet. Add a course first![/yellow]")
            return

        console.print(f"\n[bold cyan]📋 All Assignments ({len(self.all_assignments)})[/bold cyan]\n")

        table = Table(title="Assignment Overview", box=box.ROUNDED)
        table.add_column("Course", style="cyan")
        table.add_column("Assignment", style="white")
        table.add_column("Type", style="yellow")
        table.add_column("Due Date", style="magenta")
        table.add_column("Weight", style="green")
        table.add_column("Hours", style="blue")
        table.add_column("Progress", style="white")

        for assignment in sorted(self.all_assignments, key=lambda x: x.get("due_date", "")):
            table.add_row(
                assignment.get("course", "N/A"),
                assignment.get("name", ""),
                assignment.get("type", ""),
                assignment.get("due_date", ""),
                f"{assignment.get('weight', 0)}%",
                f"{assignment.get('estimated_hours', 0)}h",
                f"{assignment.get('progress', 0)}%",
            )

        console.print(table)

    def show_workload_analysis(self):
        """Display workload analysis"""
        if not self.all_assignments:
            console.print("\n[yellow]⚠️  No assignments to analyze. Add courses first![/yellow]")
            return

        console.print("\n[bold cyan]📊 Workload Analysis[/bold cyan]\n")

        analysis = self.agent.analyze_workload(self.all_assignments)

        if not analysis:
            console.print("[red]❌ Analysis failed.[/red]")
            return

        # Summary Panel
        summary = Panel(
            f"[bold]Total Study Hours:[/bold] {analysis.get('total_hours', 0)}h\n"
            f"[bold]Risk Weeks:[/bold] {len(analysis.get('risk_weeks', []))}\n"
            f"[bold]Priority Assignments:[/bold] {len(analysis.get('priority_assignments', []))}",
            title="📈 Summary",
            border_style="cyan",
        )
        console.print(summary)

        # Weekly Breakdown
        if "weekly_breakdown" in analysis:
            console.print("\n[bold]Weekly Hour Distribution:[/bold]")
            breakdown_table = Table(box=box.SIMPLE)
            breakdown_table.add_column("Week", style="cyan")
            breakdown_table.add_column("Hours", style="yellow")
            breakdown_table.add_column("Status", style="white")

            for week, hours in analysis["weekly_breakdown"].items():
                threshold = self.settings.get("risk_threshold", 20)
                status = "🔴 HIGH RISK" if hours > threshold else "🟢 Normal" if hours < max(10, threshold - 5) else "🟡 Moderate"
                breakdown_table.add_row(week, f"{hours}h", status)

            console.print(breakdown_table)

        # Recommendations
        if analysis.get("recommendations"):
            console.print("\n[bold yellow]💡 Recommendations:[/bold yellow]")
            for i, rec in enumerate(analysis["recommendations"], 1):
                console.print(f"  {i}. {rec}")

    def show_schedule(self):
        """Display study schedule"""
        if not self.all_assignments:
            console.print("\n[yellow]⚠️  No assignments to schedule. Add courses first![/yellow]")
            return

        default_hours = str(self.settings.get("hours_per_day", 4))
        hours_per_day = int(Prompt.ask("\n[yellow]Study hours per day[/yellow]", default=default_hours))
        self.settings["hours_per_day"] = hours_per_day

        console.print("\n[bold cyan]📅 Generating Your Study Schedule[/bold cyan]\n")

        schedule = self.agent.create_schedule(self.all_assignments, hours_per_day)

        if not schedule or "daily_schedule" not in schedule:
            console.print("[red]❌ Schedule generation failed.[/red]")
            return

        # Display daily schedule
        for date in sorted(schedule["daily_schedule"].keys())[:14]:  # Show 2 weeks
            tasks = schedule["daily_schedule"][date]

            if not tasks:
                continue

            total_hours = sum(t.get("hours", 0) for t in tasks)

            console.print(f"\n[bold cyan]📆 {date}[/bold cyan] [dim]({total_hours}h total)[/dim]")

            for task in tasks:
                priority_icon = {"high": "🔴", "medium": "🟡", "low": "🟢"}.get(task.get("priority", "low"), "⚪")
                console.print(f"  {priority_icon} {task.get('task', '')} [dim]({task.get('hours', 0)}h)[/dim]")
                console.print(f"     [dim]→ {task.get('assignment', '')}[/dim]")

        # Warnings
        if schedule.get("warnings"):
            console.print("\n[bold red]⚠️  Warnings:[/bold red]")
            for warning in schedule["warnings"]:
                console.print(f"  • {warning}")

    def show_notifications(self):
        """Display smart notifications"""
        if not self.all_assignments:
            console.print("\n[yellow]⚠️  No assignments to notify about. Add courses first![/yellow]")
            return

        console.print("\n[bold cyan]🔔 Generating Smart Notifications[/bold cyan]\n")

        schedule = self.agent.create_schedule(self.all_assignments, self.settings.get("hours_per_day", 4))
        notifications = self.agent.generate_notifications(schedule, self.all_assignments)

        if not notifications:
            console.print("[yellow]No notifications generated.[/yellow]")
            return

        for notif in notifications[:10]:
            urgency_style = {
                "high": "bold red",
                "medium": "bold yellow",
                "low": "dim white",
            }.get(notif.get("urgency", "low"), "white")

            urgency_icon = {
                "high": "🚨",
                "medium": "⚡",
                "low": "ℹ️",
            }.get(notif.get("urgency", "low"), "📢")

            panel = Panel(
                f"[{urgency_style}]{notif.get('message', '')}[/{urgency_style}]\n\n"
                f"[bold]Action:[/bold] {notif.get('action', '')}\n"
                f"[dim]Send at: {notif.get('send_at', '')}[/dim]",
                title=f"{urgency_icon} {notif.get('type', 'notification').upper()}",
                border_style=urgency_style.split()[0] if " " in urgency_style else urgency_style,
            )
            console.print(panel)
            console.print()

        if self.settings.get("email_enabled") and self.settings.get("email_to"):
            sent = 0
            for notif in notifications[:10]:
                nid = notification_id(notif)
                if nid in self.sent_notifications:
                    continue
                subject = f"CourseSync: {notif.get('type','').title()}"
                body = f"{notif.get('message','')}\n\nAction: {notif.get('action','')}\nSend at: {notif.get('send_at','')}"
                if send_email(self.settings.get("email_to"), subject, body):
                    sent += 1
                    self.sent_notifications.append(nid)
                    self.persist()
            if sent > 0:
                console.print(f"[green]✅ Sent {sent} notification emails to {self.settings.get('email_to')}[/green]")
            else:
                console.print("[yellow]⚠️  Email notifications not sent. Check SMTP settings and credentials.[/yellow]")

    def save_data(self):
        """Save all data to file"""
        if not self.courses:
            console.print("\n[yellow]⚠️  No data to save.[/yellow]")
            return

        data = {
            "timestamp": datetime.now().isoformat(),
            "courses": self.courses,
            "total_assignments": len(self.all_assignments),
            "settings": self.settings,
        }

        filename = os.path.join(self.data_dir, f"coursesync_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")

        with open(filename, "w") as f:
            import json

            json.dump(data, f, indent=2)

        console.print(f"\n[green]✅ Data saved to {filename}[/green]")
        self.persist()

    def track_progress(self):
        if not self.all_assignments:
            console.print("\n[yellow]📋 No assignments yet. Add a course first![/yellow]")
            return
        console.print("\n[bold cyan]✅ Track Progress[/bold cyan]")
        for idx, a in enumerate(sorted(self.all_assignments, key=lambda x: x.get("due_date", "")), 1):
            console.print(f"{idx}. {a.get('course','N/A')} - {a.get('name','')} [dim]{a.get('due_date','')}[/dim] [dim]{a.get('progress',0)}%[/dim]")
        choice = Prompt.ask("\n[yellow]Select assignment number[/yellow]", default="1")
        try:
            idx = int(choice) - 1
        except Exception:
            console.print("[red]❌ Invalid selection.[/red]")
            return
        if idx < 0 or idx >= len(self.all_assignments):
            console.print("[red]❌ Out of range.[/red]")
            return
        pct = Prompt.ask("[yellow]Enter progress percentage (0-100)[/yellow]", default=str(self.all_assignments[idx].get("progress", 0)))
        try:
            val = max(0, min(100, int(pct)))
            self.all_assignments[idx]["progress"] = val
            console.print("[green]✅ Progress updated.[/green]")
            self.persist()
        except Exception:
            console.print("[red]❌ Invalid percentage.[/red]")

    def export_calendar(self):
        if not self.all_assignments:
            console.print("\n[yellow]⚠️  No assignments to export.[/yellow]")
            return
        from .utils import create_ics_for_assignments
        filename = Prompt.ask("[yellow]ICS filename[/yellow]", default=self.settings.get("calendar_filename", os.path.join(self.data_dir, "coursesync_calendar.ics")))
        self.settings["calendar_filename"] = filename
        try:
            create_ics_for_assignments(self.all_assignments, filename)
            console.print(f"\n[green]✅ Calendar exported to {filename}[/green]")
        except Exception as e:
            console.print(f"[red]❌ Failed to export calendar: {str(e)}[/red]")

    def settings_menu(self):
        console.print("\n[bold cyan]⚙️ Settings[/bold cyan]")
        console.print(f"Current daily hours: {self.settings.get('hours_per_day',4)}")
        console.print(f"Risk threshold: {self.settings.get('risk_threshold',20)}h/week")
        console.print(f"Notification lead: {self.settings.get('notification_lead_days',3)} days")
        console.print(f"Calendar file: {self.settings.get('calendar_filename','coursesync_calendar.ics')}")
        console.print(f"Email enabled: {self.settings.get('email_enabled', False)}")
        console.print(f"Email to: {self.settings.get('email_to', '')}")
        console.print(f"Email scheduler: {self.settings.get('email_schedule_enabled', False)}")
        console.print(f"Poll seconds: {self.settings.get('notification_poll_seconds', 60)}")
        h = Prompt.ask("[yellow]Set daily hours[/yellow]", default=str(self.settings.get("hours_per_day", 4)))
        r = Prompt.ask("[yellow]Set risk threshold (hours/week)[/yellow]", default=str(self.settings.get("risk_threshold", 20)))
        n = Prompt.ask("[yellow]Set notification lead (days)[/yellow]", default=str(self.settings.get("notification_lead_days", 3)))
        c = Prompt.ask("[yellow]Set calendar filename[/yellow]", default=self.settings.get("calendar_filename", "coursesync_calendar.ics"))
        e = Prompt.ask("[yellow]Enable email notifications (true/false)[/yellow]", default=str(self.settings.get("email_enabled", False)))
        et = Prompt.ask("[yellow]Notification email address[/yellow]", default=self.settings.get("email_to", ""))
        es = Prompt.ask("[yellow]Enable scheduler (true/false)[/yellow]", default=str(self.settings.get("email_schedule_enabled", False)))
        ps = Prompt.ask("[yellow]Poll interval seconds[/yellow]", default=str(self.settings.get("notification_poll_seconds", 60)))
        try:
            self.settings["hours_per_day"] = int(h)
            self.settings["risk_threshold"] = int(r)
            self.settings["notification_lead_days"] = int(n)
            self.settings["calendar_filename"] = c
            self.settings["email_enabled"] = (str(e).lower() in ["true", "1", "yes", "y"]) if isinstance(e, str) else bool(e)
            self.settings["email_to"] = et
            self.settings["email_schedule_enabled"] = (str(es).lower() in ["true", "1", "yes", "y"]) if isinstance(es, str) else bool(es)
            self.settings["notification_poll_seconds"] = int(ps)
            console.print("[green]✅ Settings updated.[/green]")
            save_settings(self.settings)
            self.persist()
        except Exception:
            console.print("[red]❌ Invalid settings values.[/red]")

    def start_scheduler(self):
        if self.scheduler_thread and self.scheduler_thread.is_alive():
            return
        if not (self.settings.get("email_enabled") and self.settings.get("email_to") and self.settings.get("email_schedule_enabled")):
            return
        def worker():
            while not self.scheduler_stop_event.is_set():
                try:
                    schedule = self.agent.create_schedule(self.all_assignments, self.settings.get("hours_per_day", 4))
                    notifications = self.agent.generate_notifications(schedule, self.all_assignments) or []
                    now = datetime.now()
                    for notif in notifications:
                        nid = notification_id(notif)
                        if nid in self.sent_notifications:
                            continue
                        ts = notif.get("send_at", "")
                        try:
                            dt = datetime.strptime(ts, "%Y-%m-%d %H:%M")
                        except Exception:
                            continue
                        if dt <= now:
                            subject = f"CourseSync: {notif.get('type','').title()}"
                            body = f"{notif.get('message','')}\n\nAction: {notif.get('action','')}\nSend at: {notif.get('send_at','')}"
                            if send_email(self.settings.get("email_to"), subject, body):
                                self.sent_notifications.append(nid)
                                self.persist()
                except Exception:
                    pass
                time.sleep(max(10, int(self.settings.get("notification_poll_seconds", 60))))
        self.scheduler_stop_event.clear()
        self.scheduler_thread = threading.Thread(target=worker, daemon=True)
        self.scheduler_thread.start()

    def persist(self):
        state = {
            "timestamp": datetime.now().isoformat(),
            "courses": self.courses,
            "assignments": self.all_assignments,
            "settings": self.settings,
            "sent_notifications": self.sent_notifications,
        }
        try:
            path = os.path.join(self.data_dir, "data.json")
            with open(path, "w", encoding="utf-8") as f:
                import json
                json.dump(state, f, indent=2)
        except Exception:
            pass

    def run(self):
        """Run the CLI application"""
        self.show_banner()

        # Load environment keys (clients reads os.environ at import time). If keys are missing
        # we warn the user but continue so the CLI stays interactive instead of exiting.
        from .clients import GROQ_API_KEY, FIRECRAWL_API_KEY

        if not GROQ_API_KEY:
            console.print("[yellow]⚠️  GROQ_API_KEY not set! Some AI features will be disabled. Add it to a .env or set the GROQ_API_KEY environment variable.[/yellow]")

        if not FIRECRAWL_API_KEY:
            console.print("[yellow]⚠️  FIRECRAWL_API_KEY not set (optional). Some scraping features may be limited.[/yellow]")

        if self.settings.get("email_schedule_enabled"):
            self.start_scheduler()
        # Proceed to the interactive menu even if API keys are missing.
        self.main_menu()


def run_cli():
    cli = CourseSyncCLI()
    cli.run()
