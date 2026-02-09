"""Entrypoint for CourseSync-Agent Web UI.

Usage:
    python main.py         # Run web UI
"""

try:
    # Load environment variables from a .env file if python-dotenv is available.
    # This must run before importing package modules that read os.environ at import time.
    from dotenv import load_dotenv

    load_dotenv()
except Exception:
    # If python-dotenv isn't installed, continue silently; environment vars may still be set externally.
    pass

from server.app import app
from server.agent.utils import console


if __name__ == "__main__":
    # Run web UI
    try:
        import uvicorn
        console.print("\n[bold cyan]🚀 Starting CourseSync Web UI...[/bold cyan]")
        console.print("[green]📱 Open your browser to: http://localhost:8000[/green]\n")
        console.print("[green]📱 Open your browser to: http://localhost:8000[/green]\n")
        uvicorn.run("server.app:app", host="0.0.0.0", port=8000, reload=True)
    except ImportError:
        console.print("[red]❌ Error: uvicorn not installed. Install with: pip install uvicorn[/red]")
    except KeyboardInterrupt:
        console.print("\n\n[yellow]👋 Interrupted. Goodbye![/yellow]")
    except Exception as e:
        console.print(f"\n[red]❌ Error starting web UI: {str(e)}[/red]")
        console.print("[dim]Check your API keys and internet connection.[/dim]")
