# Lessons System Documentation

## How Lessons Work

### Data Structure

All lessons are defined in `assets/lessons.json`. This file contains:
- `version`: Schema version number
- `lessons`: Array of lesson objects

Each lesson object has:
```json
{
  "id": "lesson-01",           // Unique identifier (kebab-case)
  "number": 1,                  // Display number
  "title": "Lesson Title",      // Display title
  "minutes": 5,                 // Reading time in minutes
  "tags": ["Category Name"]     // Array of category tags
}
```

### File Locations

```
islamic-kids-app/
├── assets/
│   ├── lessons.json          # Master lesson index
│   ├── app.js                # Lesson loading & rendering
│   ├── main.js               # Filtering & interaction
│   └── base-path.js          # GitHub Pages path resolution
├── lessons/
│   ├── index.html            # Lessons list page
│   └── lesson.html           # Single lesson view template
└── index.html                # Home page (shows featured lessons)
```

### How Lessons Load

1. **Base Path Resolution** (`base-path.js`):
   - Detects if site is on GitHub Pages under a subpath
   - Provides `withBase()` helper for all asset/page URLs
   - Configured via `<meta name="site-base" content="/islamic-kids-app">`

2. **Data Loading** (`app.js`):
   - Fetches `assets/lessons.json` using correct base path
   - Handles errors with user-friendly messages
   - Logs diagnostic info when `?debug=1` is in URL

3. **Rendering**:
   - **Home page**: Shows first 3 lessons as "featured"
   - **Lessons page**: Shows all lessons with search/filter
   - **Lesson detail**: Loads by `?id=lesson-XX` parameter

## Adding a New Lesson

### Step 1: Add to lessons.json

Edit `assets/lessons.json` and add a new entry:

```json
{
  "id": "lesson-39",
  "number": 39,
  "title": "Your New Lesson Title",
  "minutes": 5,
  "tags": ["Appropriate Category"]
}
```

**Important**:
- Use a unique `id` (format: `lesson-XX`)
- Number sequentially
- Use existing tag categories (see below)

### Step 2: Validate

Run the validation script locally:
```bash
node scripts/validate.js
```

This checks:
- JSON schema is valid
- All required fields present
- No duplicate IDs or numbers

### Step 3: Commit & Deploy

```bash
git add assets/lessons.json
git commit -m "Add lesson XX: Your Title"
git push origin main
```

GitHub Actions will automatically deploy to Pages.

## Lesson Categories (Tags)

Current categories used in filters:

| Filter Button | Tag Names |
|--------------|-----------|
| Belief (foundations) | `Foundations of Faith` |
| Character | `Role Models & Character`, `Strength of Character`, `Modesty & Personal Conduct` |
| Worship | `Prayer & Worship`, `Purification & Cleanliness`, `Pillars of Islam & Iman` |
| Identity | `Important Modern Topics`, `Wrap-Up & Reference` |
| Social Life | `Unity & Following the Right Path` |
| Purpose | `Pillars of Islam & Iman` |

## Testing Locally

### Option 1: Simple HTTP Server

Using Python (built-in on most systems):

```bash
# From project root
python -m http.server 8080
```

Then open: `http://localhost:8080/`

**Important**: Test navigation to ensure relative paths work correctly.

### Option 2: VS Code Live Server

1. Install "Live Server" extension in VS Code
2. Right-click `index.html` → "Open with Live Server"

### Option 3: Node.js Static Server

```bash
npm install -g serve
serve .
```

### Testing Checklist

When testing locally or on GitHub Pages:

- [ ] Home page loads and shows 3 featured lessons
- [ ] Clicking a lesson card navigates to lesson detail
- [ ] Lessons page shows all lessons
- [ ] Search filter works
- [ ] Category chips filter correctly
- [ ] Lesson detail page loads with correct content
- [ ] Quiz functionality works
- [ ] Share buttons appear correctly (mobile vs desktop)
- [ ] Navigation links work from all pages
- [ ] Service worker registers (check console)
- [ ] Works offline after first load

### Debug Mode

Add `?debug=1` to any page URL to see:
- Current base path
- Lessons JSON URL being fetched
- Number of lessons loaded
- Any fetch errors with full details

Examples:
- `https://naser-labs.github.io/islamic-kids-app/?debug=1`
- `https://naser-labs.github.io/islamic-kids-app/lessons/?debug=1`

## GitHub Pages Deployment

### Base Path Configuration

The site is deployed at: `https://naser-labs.github.io/islamic-kids-app/`

**Critical**: The `/islamic-kids-app/` subpath requires:
1. `<meta name="site-base" content="/islamic-kids-app">` in all HTML files
2. All asset/page URLs use `withBase()` helper
3. Service worker accounts for base path

### Deployment Process

1. Push to `main` branch
2. GitHub Actions workflow runs (`.github/workflows/deploy.yml`)
3. Static files published to `gh-pages` branch
4. Available at GitHub Pages URL within ~2 minutes

### Common Issues

**Problem**: "Loading lessons..." never resolves

**Causes**:
1. Incorrect base path → 404 on `assets/lessons.json`
2. JavaScript not loaded → check browser console
3. CORS issue → only happens with wrong deployment config

**Solution**:
- Add `?debug=1` to URL and check console
- Verify base path meta tag is correct
- Check Network tab for 404s

**Problem**: Links navigate to wrong pages

**Causes**:
- Hardcoded `/` paths instead of using `withBase()`
- Missing base path helper script

**Solution**:
- Ensure `<script src="assets/base-path.js"></script>` is first script
- Use `withBase('path')` for all internal links

## Architecture Notes

### Why Separate `app.js` and `main.js`?

- `app.js`: Core data loading, lesson rendering, quiz logic
- `main.js`: UI interactions, filtering, search

Both are loaded on all pages for simplicity. Future optimization could conditionally load based on page type.

### Why Not Use a Build System?

- Static-only requirement (GitHub Pages, no backend)
- Simplicity for contributors
- No dependencies to install
- Works offline immediately

### Progressive Enhancement

1. HTML loads first with "Loading..." message
2. `base-path.js` determines deployment context
3. `app.js` + `main.js` fetch data and render
4. Service worker enables offline (if supported)
5. Fallbacks for older browsers (no ES6 modules)

## Future Enhancements

Potential improvements (not yet implemented):

1. **Individual Lesson Content Pages**:
   - Create `lessons/lesson-01/index.html` for each lesson
   - Add full 5-minute reading content
   - Link from lessons.json `path` field

2. **Better Quiz Questions**:
   - Store quiz data in lessons.json
   - Multiple questions per lesson
   - Varied question types

3. **Build-Time Generation**:
   - Script to generate lesson.json from markdown files
   - Auto-update table of contents
   - Validate content structure

4. **Accessibility Audit**:
   - ARIA labels for dynamic content
   - Keyboard navigation testing
   - Screen reader compatibility

## Support

For issues:
1. Check browser console for errors
2. Use `?debug=1` for diagnostics
3. Verify base path configuration
4. Review GitHub Actions logs for deployment errors
