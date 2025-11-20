"""Thin entrypoint wrapper that delegates to the cleaned package implementation.

This file is intentionally small: the real implementation lives in
`coursesync-agent/agent/` to keep modules focused and testable.
"""

try:
    # Load environment variables from a .env file if python-dotenv is available.
    # This must run before importing package modules that read os.environ at import time.
    from dotenv import load_dotenv

    load_dotenv()
except Exception:
    # If python-dotenv isn't installed, continue silently; environment vars may still be set externally.
    pass

from agent.cli import run_cli
from agent.utils import console


if __name__ == "__main__":
    try:
        run_cli()
    except KeyboardInterrupt:
        console.print("\n\n[yellow]👋 Interrupted. Goodbye![/yellow]")
    except Exception as e:
        console.print(f"\n[red]❌ Error: {str(e)}[/red]")
        console.print("[dim]Check your API keys and internet connection.[/dim]")