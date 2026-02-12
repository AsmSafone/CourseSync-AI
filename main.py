"""Entrypoint for CourseSync-Agent Web UI.

Usage:
    python main.py         # Run web UI
"""

from server.app import app
from server.agent.utils import console

try:
    # Load environment variables from a .env file if python-dotenv is available.
    from dotenv import load_dotenv
    
    load_dotenv()
    console.print("[green]Environment variables loaded from .env file.[/green]")
except Exception:
    # If python-dotenv isn't installed, continue silently; environment vars may still be set externally.
    console.print("[yellow]python-dotenv not installed. Skipping .env loading.[/yellow]")
    pass


if __name__ == "__main__":
    # Run web UI
    try:
        import uvicorn
        console.print("\n[bold cyan]Starting CourseSync Web UI...[/bold cyan]")
        console.print("[green]Open your browser to: http://localhost:8000[/green]\n")
        uvicorn.run("server.app:app", host="0.0.0.0", port=8000, reload=True)
    except ImportError:
        console.print("[red]Error: uvicorn not installed. Install with: pip install uvicorn[/red]")
    except KeyboardInterrupt:
        console.print("\n\n[yellow]Interrupted. Goodbye![/yellow]")
    except Exception as e:
        console.print(f"\n[red]Error starting web UI: {str(e)}[/red]")
        console.print("[dim]Check your API keys and internet connection.[/dim]")
