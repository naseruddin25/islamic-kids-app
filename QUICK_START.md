# Teen Deen - Quick Start Guide

## What Changed

### Homepage (index.html)
- Now a welcome/landing page instead of lesson browser
- Two clear paths: "Short Lessons" and "Teen Issues"
- Quick links to specific teen topics

### Navigation (All Pages)
**Old:** Discover | Lessons | Parents | Progress  
**New:** Home | Short Lessons | Teen Issues | Parents | About

### New Pages
1. **teen-issues.html** - Real-life topics hub (faith, friends, social media, emotions, school, intentions)
2. **about.html** - Mission, method, and what Teen Deen is about

### Updated Pages
1. **parents.html** - Expanded with Teen Deen context, weekly routines, quiz sharing info
2. **lessons/index.html** - Title changed to "Short Lessons"
3. **progress.html** - Navigation updated (still accessible via direct link)

## Site Structure

```
Home (index.html)
├── Short Lessons (lessons/)
│   ├── Browse all lessons
│   └── Individual lesson pages
├── Teen Issues (teen-issues.html)
│   ├── Faith & Doubt
│   ├── Friends & Pressure
│   ├── Social Media & Identity
│   ├── Anger, Anxiety, & Emotions
│   ├── School & Discipline
│   └── Intentions & Sincerity
├── Parents (parents.html)
│   ├── What is Teen Deen?
│   ├── How to use with your teen
│   ├── Quiz sharing info
│   └── Suggested routine
└── About (about.html)
    ├── Mission
    ├── Method
    ├── What we cover
    └── Our approach
```

## Key URLs

| Page | URL | Purpose |
|------|-----|---------|
| Home | `/` | Welcome page with two paths |
| Short Lessons | `/lessons/` | Browse all lessons |
| Teen Issues | `/teen-issues.html` | Real-life topics hub |
| Parents | `/parents.html` | Parent guide |
| About | `/about.html` | About Teen Deen |
| Progress | `/progress.html` | Progress tracking (not in main nav) |

## Teen Issues Anchor Links

Direct links to specific topics:
- `/teen-issues.html#faith-doubt`
- `/teen-issues.html#friends-pressure`
- `/teen-issues.html#social-media`
- `/teen-issues.html#anger-anxiety`
- `/teen-issues.html#school-discipline`
- `/teen-issues.html#intentions`

## Testing Locally

1. Open `index.html` in a browser
2. Test navigation between pages
3. Verify all links work
4. Check mobile responsiveness
5. Test hamburger menu on mobile

## Deploying to GitHub Pages

No special steps needed:
- Commit all changes
- Push to `main` branch
- GitHub Pages will automatically deploy
- Site will be live at: `https://naser-labs.github.io/islamic-kids-app/`

## What Still Works

✅ All existing lessons (01-38)  
✅ Lesson reading and navigation  
✅ Quiz functionality  
✅ Progress tracking  
✅ Parent contact info (local storage)  
✅ Search and filters on Short Lessons page  
✅ Mobile navigation drawer  

## Quick Fixes (If Needed)

### If a link doesn't work:
- Check if it's using relative paths (good) vs absolute paths (bad)
- Ensure base path handling is active (`assets/base-path.js`)

### If styles look broken:
- Verify `assets/styles.css` is loading
- Check browser console for errors

### If navigation doesn't show:
- Verify `assets/mobile-nav.js` is loading
- Check for JavaScript errors in console

## Next Steps (Optional)

1. Map specific lessons to Teen Issues topics
2. Create new lessons specifically for teen topics
3. Add recommended learning paths
4. Update README.md with Teen Deen information
5. Add screenshots to GitHub repo

## Support

For questions or issues:
- Open an issue on GitHub: https://github.com/naser-labs/islamic-kids-app
- Review the TEEN_DEEN_SUMMARY.md for implementation details
