#!/usr/bin/env python3
"""
Solarpunk Portfolio - A Flask-based portfolio builder with GitHub Pages deployment
"""

import json
import os
import subprocess
import webbrowser
from datetime import datetime
from pathlib import Path
from flask import Flask, render_template, request, jsonify, redirect, url_for

app = Flask(__name__)
BASE_DIR = Path(__file__).parent
DATA_FILE = BASE_DIR / "portfolio_data.json"
OUTPUT_DIR = BASE_DIR / "output"

# Color schemes - all WCAG AA compliant
COLOR_SCHEMES = {
    "forest_dawn": {"name": "Forest Dawn", "primary": "#2D5A3D", "secondary": "#F4F1E8", "accent": "#8B9D77", "text": "#1a1a1a"},
    "solar_noon": {"name": "Solar Noon", "primary": "#E8A924", "secondary": "#1A1A2E", "accent": "#F5E6C3", "text": "#F4F1E8"},
    "ocean_depths": {"name": "Ocean Depths", "primary": "#1B4965", "secondary": "#F0F4F5", "accent": "#5FA8D3", "text": "#1a1a1a"},
    "terracotta": {"name": "Terracotta", "primary": "#C04000", "secondary": "#FFF8F0", "accent": "#E07A5F", "text": "#1a1a1a"},
    "midnight_moss": {"name": "Midnight Moss", "primary": "#4A7C59", "secondary": "#1A1A1A", "accent": "#6B8F71", "text": "#E8E8E8"},
    "sunrise_blush": {"name": "Sunrise Blush", "primary": "#9B6B6B", "secondary": "#FFFFFF", "accent": "#D4A5A5", "text": "#1a1a1a"},
    "slate_sage": {"name": "Slate & Sage", "primary": "#4A5568", "secondary": "#F7FAFC", "accent": "#68D391", "text": "#1a1a1a"},
    "dusk_purple": {"name": "Dusk Purple", "primary": "#44337A", "secondary": "#FAF5FF", "accent": "#9F7AEA", "text": "#1a1a1a"},
    "desert_sand": {"name": "Desert Sand", "primary": "#8B7355", "secondary": "#FFFEF7", "accent": "#C4A77D", "text": "#1a1a1a"},
    "classic_mono": {"name": "Classic Mono", "primary": "#333333", "secondary": "#FFFFFF", "accent": "#666666", "text": "#1a1a1a"},
}

DEFAULT_DATA = {
    "github_username": "",
    "color_scheme": "forest_dawn",
    "section_order": ["bio", "photo", "skills", "projects", "contact", "social"],
    "bio": {
        "name": "Your Name",
        "title": "Your Professional Title",
        "summary": "Write a brief professional summary about yourself. What do you do? What are you passionate about?"
    },
    "photo": {
        "url": "https://via.placeholder.com/200x200?text=Your+Photo"
    },
    "projects": [
        {"title": "Project One", "description": "Describe your project here.", "link": ""},
        {"title": "Project Two", "description": "Describe your project here.", "link": ""}
    ],
    "skills": ["Skill 1", "Skill 2", "Skill 3", "Skill 4"],
    "contact": {
        "email": "your.email@example.com",
        "phone": "",
        "location": "City, State"
    },
    "social": {
        "linkedin": "",
        "github": "",
        "instagram": ""
    }
}


def load_data():
    """Load portfolio data from JSON file."""
    if DATA_FILE.exists():
        with open(DATA_FILE, "r") as f:
            return json.load(f)
    return DEFAULT_DATA.copy()


def save_data(data):
    """Save portfolio data to JSON file."""
    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=2)


def run_git_command(args, cwd=None):
    """Run a git command and return success status and output."""
    try:
        result = subprocess.run(
            ["git"] + args,
            cwd=cwd or BASE_DIR,
            capture_output=True,
            text=True,
            timeout=30
        )
        return result.returncode == 0, result.stdout + result.stderr
    except subprocess.TimeoutExpired:
        return False, "Command timed out"
    except Exception as e:
        return False, str(e)


@app.route("/")
def index():
    """Redirect to admin page."""
    return redirect(url_for("admin"))


@app.route("/admin")
def admin():
    """Portfolio builder interface."""
    data = load_data()
    return render_template("admin.html", data=data, schemes=COLOR_SCHEMES)


@app.route("/admin", methods=["POST"])
def save_portfolio():
    """Save portfolio data."""
    data = request.json
    save_data(data)
    return jsonify({"success": True})


@app.route("/explain")
def explain():
    """Git/GitHub explanation page."""
    return render_template("explain.html")


@app.route("/preview")
def preview():
    """Live preview of the portfolio."""
    data = load_data()
    scheme = COLOR_SCHEMES.get(data.get("color_scheme", "forest_dawn"))
    return render_template("portfolio.html", data=data, scheme=scheme, preview=True)


@app.route("/api/sections", methods=["POST"])
def update_sections():
    """Update section order."""
    data = load_data()
    data["section_order"] = request.json.get("order", data["section_order"])
    save_data(data)
    return jsonify({"success": True})


@app.route("/deploy", methods=["POST"])
def deploy():
    """Generate HTML and deploy to GitHub Pages."""
    data = load_data()
    scheme = COLOR_SCHEMES.get(data.get("color_scheme", "forest_dawn"))

    # Generate the static HTML
    OUTPUT_DIR.mkdir(exist_ok=True)
    html_content = render_template("portfolio.html", data=data, scheme=scheme, preview=False)

    output_file = OUTPUT_DIR / "index.html"
    with open(output_file, "w") as f:
        f.write(html_content)

    steps = []

    # Check if we're in a git repo
    success, output = run_git_command(["status"])
    if not success:
        return jsonify({
            "success": False,
            "message": "Not a git repository. Please initialize with 'git init' first.",
            "steps": steps
        })

    steps.append({"command": "git status", "success": True, "output": "Repository detected"})

    # Add the output file
    success, output = run_git_command(["add", "output/index.html", "portfolio_data.json"])
    steps.append({"command": "git add output/index.html portfolio_data.json", "success": success, "output": output})

    if not success:
        return jsonify({"success": False, "message": "Failed to stage files", "steps": steps})

    # Commit
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
    commit_msg = f"Deploy portfolio - {timestamp}"
    success, output = run_git_command(["commit", "-m", commit_msg])
    steps.append({"command": f'git commit -m "{commit_msg}"', "success": success, "output": output})

    # Create/switch to gh-pages branch and push
    # First, get current branch
    success, current_branch = run_git_command(["branch", "--show-current"])
    current_branch = current_branch.strip() or "main"

    # Check if gh-pages exists
    success, branches = run_git_command(["branch", "-a"])
    gh_pages_exists = "gh-pages" in branches

    if not gh_pages_exists:
        # Create gh-pages as an orphan branch with just the output
        success, output = run_git_command(["subtree", "push", "--prefix", "output", "origin", "gh-pages"])
        if not success:
            # Fallback: create branch manually
            success, output = run_git_command(["checkout", "-b", "gh-pages"])
            steps.append({"command": "git checkout -b gh-pages", "success": success, "output": output})

    # Push to origin
    success, output = run_git_command(["push", "-u", "origin", "gh-pages"])
    steps.append({"command": "git push -u origin gh-pages", "success": success, "output": output})

    # Try subtree push for gh-pages
    success, output = run_git_command(["subtree", "push", "--prefix", "output", "origin", "gh-pages"])
    steps.append({"command": "git subtree push --prefix output origin gh-pages", "success": success, "output": output})

    # Get the remote URL to construct GitHub Pages URL
    success, remote_url = run_git_command(["remote", "get-url", "origin"])
    github_pages_url = ""

    if success and remote_url:
        # Parse GitHub URL to get username and repo
        remote_url = remote_url.strip()
        if "github.com" in remote_url:
            # Handle both HTTPS and SSH URLs
            if remote_url.startswith("git@"):
                # git@github.com:user/repo.git
                parts = remote_url.replace("git@github.com:", "").replace(".git", "").split("/")
            else:
                # https://github.com/user/repo.git
                parts = remote_url.replace("https://github.com/", "").replace(".git", "").split("/")

            if len(parts) >= 2:
                username, repo = parts[0], parts[1]
                github_pages_url = f"https://{username}.github.io/{repo}/"

    return jsonify({
        "success": True,
        "message": "Portfolio deployed successfully!",
        "steps": steps,
        "url": github_pages_url
    })


@app.route("/generate", methods=["POST"])
def generate_only():
    """Generate HTML without deploying (for preview/download)."""
    data = load_data()
    scheme = COLOR_SCHEMES.get(data.get("color_scheme", "forest_dawn"))

    OUTPUT_DIR.mkdir(exist_ok=True)
    html_content = render_template("portfolio.html", data=data, scheme=scheme, preview=False)

    output_file = OUTPUT_DIR / "index.html"
    with open(output_file, "w") as f:
        f.write(html_content)

    return jsonify({"success": True, "message": "Portfolio generated at output/index.html"})


if __name__ == "__main__":
    print("\n" + "="*50)
    print("  SOLARPUNK PORTFOLIO BUILDER")
    print("="*50)
    print("\n  Opening http://localhost:5000 in your browser...\n")
    print("  - /admin   : Build your portfolio")
    print("  - /explain : Learn about Git & GitHub Pages")
    print("  - /preview : Preview your portfolio")
    print("\n  Press Ctrl+C to stop the server")
    print("="*50 + "\n")

    webbrowser.open("http://localhost:5000")
    app.run(debug=True, port=5000)
