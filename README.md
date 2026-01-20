# Solarpunk Portfolio

A Flask-based portfolio builder that teaches Git/GitHub etiquette while helping you create and deploy a professional portfolio to GitHub Pages.

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR-USERNAME/solarpunk-portfolio.git
cd solarpunk-portfolio
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Run the Application

```bash
python app.py
```

This will open your browser to `http://localhost:5000`

## Pages

- **`/admin`** - Build your portfolio with drag-and-drop sections and color schemes
- **`/explain`** - Learn about Git, GitHub, and how deployment works
- **`/preview`** - Preview your portfolio before deploying

## Features

- **10 Accessibility-Focused Color Schemes** - All meet WCAG AA contrast requirements
- **Drag-and-Drop Sections** - Reorder your portfolio sections easily
- **Live Preview** - See changes as you make them
- **One-Click Deploy** - Automatically pushes to GitHub Pages
- **Educational** - Learn Git basics while building

## Portfolio Sections

- Bio (name, title, summary)
- Photo
- Skills
- Projects
- Contact information
- Social links (LinkedIn, GitHub, Instagram)

## Deployment

1. Fill out your portfolio in the builder
2. Click "Deploy to GitHub Pages"
3. Your portfolio will be live at: `https://YOUR-USERNAME.github.io/solarpunk-portfolio/`

## What's Happening Under the Hood

When you deploy, the tool runs these Git commands:

```bash
git add output/index.html portfolio_data.json
git commit -m "Deploy portfolio - [timestamp]"
git subtree push --prefix output origin gh-pages
```

## Requirements

- Python 3.7+
- Git installed and configured
- A GitHub account

## File Structure

```
solarpunk-portfolio/
├── app.py              # Flask application
├── requirements.txt    # Python dependencies
├── portfolio_data.json # Your portfolio content (generated)
├── static/
│   ├── css/           # Admin interface styles
│   └── js/            # Builder JavaScript
├── templates/
│   ├── admin.html     # Portfolio builder
│   ├── explain.html   # Git/GitHub tutorial
│   └── portfolio.html # Generated portfolio template
└── output/
    └── index.html     # Your deployed portfolio
```

## Troubleshooting

**"Not a git repository" error:**
Make sure you cloned the repo (not just downloaded it) and you're in the project directory.

**Deployment fails:**
- Ensure you have push access to the repository
- Check that your Git credentials are configured
- Make sure you have an internet connection

**GitHub Pages not showing:**
- It can take 1-2 minutes for changes to appear
- Check repository Settings > Pages to ensure gh-pages branch is selected

## License

MIT
