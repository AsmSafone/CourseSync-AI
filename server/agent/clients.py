import os
import requests
from .utils import console

# Configuration from environment
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

FIRECRAWL_API_KEY = os.getenv("FIRECRAWL_API_KEY")
FIRECRAWL_API_URL = "https://api.firecrawl.dev/v0/scrape"


class GroqClient:
    """Groq LLM API Client"""

    @staticmethod
    def call(system_prompt: str, user_prompt: str, temperature=0.3) -> str:
        """Call Groq API with prompts"""
        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": GROQ_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": temperature,
            "max_tokens": 2000,
        }

        try:
            response = requests.post(GROQ_API_URL, headers=headers, json=payload, timeout=30)
            response.raise_for_status()
            result = response.json()
            return result["choices"][0]["message"]["content"]
        except Exception as e:
            console.print(f"[red]❌ Groq API Error: {str(e)}[/red]")
            raise


class FirecrawlClient:
    """Firecrawl Web Scraping Client"""

    @staticmethod
    def scrape(url: str) -> str:
        """Scrape webpage content"""
        if not FIRECRAWL_API_KEY:
            console.print("[yellow]⚠️  FIRECRAWL_API_KEY not set![/yellow]")
            return ""

        headers = {
            "Authorization": f"Bearer {FIRECRAWL_API_KEY}",
            "Content-Type": "application/json",
        }

        payload = {"url": url, "formats": ["markdown"]}

        try:
            response = requests.post(FIRECRAWL_API_URL, headers=headers, json=payload, timeout=30)
            response.raise_for_status()
            result = response.json()
            return result.get("data", {}).get("markdown", "")
        except Exception as e:
            console.print(f"[yellow]⚠️  Firecrawl Warning: {str(e)}[/yellow]")
            return ""
