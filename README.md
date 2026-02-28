# School Quest Tracker

A simple school project tracking app with a gamified experience:

- Add homework tasks with difficulty-based XP.
- Complete tasks to earn XP, level up, and build a day streak.
- Unlock badges for milestones.
- Import checklist text copied from a Google Keep list.

## Run

This is a static app, so you can open `index.html` directly or serve it locally:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Notes on Google Keep integration

Google Keep does not provide an easy public API for direct browser-side list access. This app uses a practical workflow where you copy checklist text from Keep and import it into the tracker.
