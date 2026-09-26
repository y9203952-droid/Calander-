const STORAGE = {
  thought: "our-little-world-thought-v2",
  thoughtTime: "our-little-world-thought-time-v2",
  moods: "our-little-world-moods-v2"
};

const defaultThought = `Thank u for making this

This is really sweet now I am gonna write everything I feel here ps tumhri buraiya chalegi

Me tumhe guilty feel karne h tumhe bad feel ho Jase ki tumne koi crime ki hi isliye v sab nhi kaha tha i know v sab bas ek dream hai`;

const $ = (id) => document.getElementById(id);

function formatTime(date = new Date()) {
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(date);
}

function formatDateTime(iso) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(d);
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[char]));
}

function thoughtToHtml(text) {
  return text
    .trim()
    .split(/\n\s*\n/)
    .map(block => `<p>${escapeHtml(block).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

let thought = load(STORAGE.thought, defaultThought);
let thoughtTime = load(STORAGE.thoughtTime, new Date().toISOString());

$("thoughtText").innerHTML = thoughtToHtml(thought);
$("thoughtTime").textContent = formatDateTime(thoughtTime);

function openThoughtEditor() {
  $("thoughtEditor").value = thought;
  $("thoughtText").hidden = true;
  $("thoughtEditor").hidden = false;
  $("thoughtActions").hidden = false;
  $("editThoughtBtn").hidden = true;
  $("thoughtEditor").focus();
}

function closeThoughtEditor() {
  $("thoughtText").hidden = false;
  $("thoughtEditor").hidden = true;
  $("thoughtActions").hidden = true;
  $("editThoughtBtn").hidden = false;
}

$("editThoughtBtn").addEventListener("click", openThoughtEditor);

$("cancelThoughtBtn").addEventListener("click", closeThoughtEditor);

$("saveThoughtBtn").addEventListener("click", () => {
  const next = $("thoughtEditor").value.trim();
  if (!next) return;
  thought = next;
  thoughtTime = new Date().toISOString();
  save(STORAGE.thought, thought);
  save(STORAGE.thoughtTime, thoughtTime);
  $("thoughtText").innerHTML = thoughtToHtml(thought);
  $("thoughtTime").textContent = formatDateTime(thoughtTime);
  closeThoughtEditor();
});

function renderMoods() {
  const moods = load(STORAGE.moods, []);
  const timeline = $("moodTimeline");
  timeline.innerHTML = "";

  $("emptyMood").hidden = moods.length !== 0;

  moods.slice().sort((a,b) => new Date(a.time) - new Date(b.time)).forEach((mood, index) => {
    const item = document.createElement("article");
    item.className = "mood-item";
    item.style.animationDelay = `${Math.min(index * 45, 300)}ms`;
    item.innerHTML = `
      <div class="mood-node" aria-hidden="true">${escapeHtml(mood.emoji)}</div>
      <div class="mood-card">
        <div class="mood-card-top">
          <span class="mood-label">${escapeHtml(mood.label)}</span>
          <time class="mood-time">${escapeHtml(formatDateTime(mood.time))}</time>
        </div>
        ${mood.note ? `<p class="mood-note">${escapeHtml(mood.note)}</p>` : ""}
      </div>
    `;
    timeline.appendChild(item);
  });
}

renderMoods();

function updateClock() {
  $("currentTime").textContent = formatTime();
}
updateClock();
setInterval(updateClock, 1000);

let selectedMood = { emoji: "🥰", label: "Loved" };

$("addMoodBtn").addEventListener("click", () => {
  $("moodModal").hidden = false;
  document.body.style.overflow = "hidden";
});

function closeMoodModal() {
  $("moodModal").hidden = true;
  document.body.style.overflow = "";
  $("moodNote").value = "";
}

$("closeMoodModal").addEventListener("click", closeMoodModal);

$("moodModal").addEventListener("click", (event) => {
  if (event.target === $("moodModal")) closeMoodModal();
});

document.querySelectorAll(".mood-choice").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".mood-choice").forEach(b => b.classList.remove("selected"));
    button.classList.add("selected");
    selectedMood = {
      emoji: button.dataset.emoji,
      label: button.dataset.label
    };
  });
});

$("saveMoodBtn").addEventListener("click", () => {
  const moods = load(STORAGE.moods, []);
  moods.push({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    ...selectedMood,
    note: $("moodNote").value.trim(),
    time: new Date().toISOString()
  });
  save(STORAGE.moods, moods);
  renderMoods();
  closeMoodModal();

  const newest = $("moodTimeline").lastElementChild;
  if (newest) newest.scrollIntoView({ behavior: "smooth", block: "center" });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !$("moodModal").hidden) closeMoodModal();
});
