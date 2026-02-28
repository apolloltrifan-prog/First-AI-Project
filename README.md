# School Quest Tracker

A simple school project tracking app with a gamified experience:

- Add homework tasks with difficulty-based XP.
- Complete tasks to earn XP, level up, and build a day streak.
- Unlock badges for milestones.
- Import checklist text copied from a Google Keep list.

## Run the UI

From the project folder:

```bash
python3 server.py
```

Then open:

- `http://localhost:8000`

### Troubleshooting: "Page not found"

If you see "Page not found":

1. Make sure you started the server from this repo directory.
2. Use `http://localhost:8000` (or `http://localhost:8000/index.html`).
3. Keep the terminal running while using the app.

`server.py` includes a friendly fallback so unknown routes still load `index.html`.

## Notes on Google Keep integration

Google Keep does not provide an easy public API for direct browser-side list access. This app uses a practical workflow where you copy checklist text from Keep and import it into the tracker.
