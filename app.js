const STORAGE_KEY = "school-quest-tracker-v2";
const KEEP_LIST_URL =
  "https://keep.google.com/#LIST/1gVzWihX1PIjUKA0gxanf4JXWqvNcKO2INpayB8ws3nB2PQ_W90TpSiXZmYmD9xVMCsZl0w";

const state = loadState();

const elements = {
  xp: document.getElementById("xp"),
  level: document.getElementById("level"),
  streak: document.getElementById("streak"),
  completed: document.getElementById("completed"),
  levelMessage: document.getElementById("level-message"),
  xpBar: document.getElementById("xp-bar"),
  taskList: document.getElementById("task-list"),
  emptyState: document.getElementById("empty-state"),
  badgeList: document.getElementById("badge-list"),
  taskForm: document.getElementById("task-form"),
  keepInput: document.getElementById("keep-input"),
  importKeep: document.getElementById("import-keep"),
  clearCompleted: document.getElementById("clear-completed"),
  activityLog: document.getElementById("activity-log"),
  keepLinkText: document.getElementById("keep-link-text"),
  copyKeepLink: document.getElementById("copy-keep-link"),
};

elements.keepLinkText.textContent = `Link: ${KEEP_LIST_URL}`;

elements.taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = document.getElementById("task-title").value.trim();
  if (!title) return;

  addTask({
    title,
    subject: document.getElementById("task-subject").value.trim(),
    due: document.getElementById("task-due").value,
    xp: Number(document.getElementById("task-difficulty").value),
  });

  logActivity(`Added task: ${title}`);
  elements.taskForm.reset();
});

elements.copyKeepLink.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(KEEP_LIST_URL);
    logActivity("Copied Keep link to clipboard.");
  } catch {
    logActivity("Could not copy automatically. Please copy the link text manually.");
  }
});

elements.importKeep.addEventListener("click", () => {
  const lines = elements.keepInput.value
    .split("\n")
    .map((line) => line.replace(/^[\[\]xX\-•\s]+/, "").trim())
    .filter(Boolean);

  if (!lines.length) {
    logActivity("Import skipped: no Keep lines found.");
    return;
  }

  lines.forEach((line) => addTask({ title: line, subject: "Keep import", due: "", xp: 15 }, false));
  saveAndRender();
  logActivity(`Imported ${lines.length} task(s) from Keep.`);
  elements.keepInput.value = "";
});

elements.clearCompleted.addEventListener("click", () => {
  const before = state.tasks.length;
  state.tasks = state.tasks.filter((task) => !task.done);
  const removed = before - state.tasks.length;
  saveAndRender();
  logActivity(`Cleared ${removed} completed task(s).`);
});

function addTask(task, rerender = true) {
  state.tasks.push({
    id: crypto.randomUUID(),
    ...task,
    done: false,
    createdAt: Date.now(),
  });
  if (rerender) saveAndRender();
}

function completeTask(id) {
  const task = state.tasks.find((item) => item.id === id);
  if (!task || task.done) return;

  task.done = true;
  state.xp += task.xp;
  state.completedCount += 1;
  updateStreak();
  unlockBadges();
  saveAndRender();
  logActivity(`Completed: ${task.title} (+${task.xp} XP)`);
}

function updateStreak() {
  const today = new Date().toDateString();
  if (state.lastCompletedDay === today) return;

  const yesterday = new Date(Date.now() - 86400000).toDateString();
  state.streak = state.lastCompletedDay === yesterday ? state.streak + 1 : 1;
  state.lastCompletedDay = today;
}

function unlockBadges() {
  if (state.completedCount >= 1) state.badges.add("✅ First Quest Done");
  if (state.completedCount >= 5) state.badges.add("🔥 5 Task Streak");
  if (state.completedCount >= 15) state.badges.add("🏅 Homework Hero");
  if (state.streak >= 3) state.badges.add("📅 3-Day Focus");
}

function getLevelInfo() {
  const level = Math.floor(state.xp / 100) + 1;
  const xpIntoLevel = state.xp % 100;
  return { level, xpIntoLevel, xpNeeded: 100 };
}

function logActivity(message) {
  state.activity.unshift({
    id: crypto.randomUUID(),
    message,
    createdAt: new Date().toLocaleString(),
  });
  state.activity = state.activity.slice(0, 8);
  saveAndRender();
}

function saveAndRender() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ...state,
      badges: [...state.badges],
    }),
  );
  render();
}

function render() {
  const { level, xpIntoLevel, xpNeeded } = getLevelInfo();
  elements.xp.textContent = state.xp;
  elements.level.textContent = level;
  elements.streak.textContent = state.streak;
  elements.completed.textContent = state.completedCount;
  elements.levelMessage.textContent = `${xpNeeded - xpIntoLevel} XP to level ${level + 1}`;
  elements.xpBar.style.width = `${(xpIntoLevel / xpNeeded) * 100}%`;

  const activeTasks = state.tasks.filter((task) => !task.done);
  elements.emptyState.style.display = activeTasks.length ? "none" : "block";

  elements.taskList.innerHTML = "";
  activeTasks
    .sort((a, b) => (a.due || "9999-12-31").localeCompare(b.due || "9999-12-31"))
    .forEach((task) => {
      const li = document.createElement("li");
      li.className = "task-item";
      li.innerHTML = `
        <div>
          <strong>${escapeHtml(task.title)}</strong>
          <br />
          <small>${escapeHtml(task.subject || "General")} ${task.due ? `• Due ${task.due}` : ""} • ${task.xp} XP</small>
        </div>
      `;
      const button = document.createElement("button");
      button.textContent = "Complete";
      button.addEventListener("click", () => completeTask(task.id));
      li.appendChild(button);
      elements.taskList.appendChild(li);
    });

  elements.badgeList.innerHTML = "";
  [...state.badges].forEach((badge) => {
    const li = document.createElement("li");
    li.textContent = badge;
    elements.badgeList.appendChild(li);
  });

  elements.activityLog.innerHTML = "";
  state.activity.forEach((entry) => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${escapeHtml(entry.createdAt)}</strong><br /><span>${escapeHtml(entry.message)}</span>`;
    elements.activityLog.appendChild(li);
  });
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) throw new Error("No saved state");
    const parsed = JSON.parse(raw);
    return {
      tasks: parsed.tasks || [],
      xp: parsed.xp || 0,
      streak: parsed.streak || 0,
      lastCompletedDay: parsed.lastCompletedDay || "",
      completedCount: parsed.completedCount || 0,
      badges: new Set(parsed.badges || []),
      activity: parsed.activity || [],
    };
  } catch {
    return {
      tasks: [],
      xp: 0,
      streak: 0,
      lastCompletedDay: "",
      completedCount: 0,
      badges: new Set(),
      activity: [{ id: crypto.randomUUID(), message: "App ready. Add your first task.", createdAt: new Date().toLocaleString() }],
    };
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

render();
