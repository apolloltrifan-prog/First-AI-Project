const STORAGE_KEY = "school-quest-tracker-v1";

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
};

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

  elements.taskForm.reset();
});

elements.importKeep.addEventListener("click", () => {
  const lines = elements.keepInput.value
    .split("\n")
    .map((line) => line.replace(/^[\[\]xX\-•\s]+/, "").trim())
    .filter(Boolean);

  lines.forEach((line) => addTask({ title: line, subject: "Keep import", due: "", xp: 15 }, false));
  saveAndRender();
  elements.keepInput.value = "";
});

elements.clearCompleted.addEventListener("click", () => {
  state.tasks = state.tasks.filter((task) => !task.done);
  saveAndRender();
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
    };
  } catch {
    return {
      tasks: [],
      xp: 0,
      streak: 0,
      lastCompletedDay: "",
      completedCount: 0,
      badges: new Set(),
    };
  }
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

render();
