// The app: one coding screen with a task panel (Lesson, Endless, Free),
// a Help page of short topic cards, and the report.

const $ = (s, r = document) => r.querySelector(s);
const view = () => $("#view");
let ide = null;          // the IDE on the coding screen
let current = null;      // the task being shown
let endlessTask = null;  // the current endless task

// Teachers can add ?unlock to the address to open every lesson task.
const UNLOCK_ALL = /[?&]unlock\b/.test(location.search);

// Help topic for each kind of mistake, for the report.
const HELP_FOR = {
  missing_num_cast: "input", concat_not_add: "input", compare_str_num: "input", input_not_stored: "input", brackets: "input",
  missing_str_cast: "str", missing_space: "str",
  int_on_decimal: "float", invalid_cast: "int", casting_predict: "int",
  string_repeat: "store", cast_not_stored: "store",
  datatype_quotes: "types", datatype_real_int: "types", datatype_bool: "bool", datatype_choice: "types",
};

function mode() { return Store.data.mode || "standard"; }
function studentName() { return (Store.data.student.name || "").trim(); }
function logMistake(key, where, detail, line) { Store.logMistake(key, where, detail, line); }

// ================================================================ lesson tasks
function lessonTasks() { return LESSON.filter(t => !t.only || t.only === mode()); }

// The task as the student sees it in the current mode.
function resolve(base) {
  const t = Object.assign({}, base, { storeId: base.id });
  if (mode() === "hard" && base.hard) Object.assign(t, base.hard, { storeId: base.id + "@hard", isHard: true });
  if (mode() === "easy" && base.easy) Object.assign(t, base.easy);
  else if (mode() === "easy" && t.stage === "make" && t.steps) t.code = easyScaffold(t);
  return t;
}

// Easy mode: turn each step into a comment to write the code under.
function easyScaffold(t) {
  return (t.code || "") + t.steps.map((s, i) => `# ${i + 1}. ${stripTags(s)}\n\n`).join("");
}
function isDone(id) { return !!(Store.task(id).solved || Store.task(id + "@hard").solved); }
function firstUndone() {
  const list = lessonTasks();
  const i = list.findIndex(t => !isDone(t.id));
  return i < 0 ? list.length : i;
}
function stateFor(task) {
  if (task.endless) return task.state || (task.state = { answers: {}, attempts: 0, hints: 0 });
  return Store.task(task.storeId);
}
function markDone(task) {
  const st = stateFor(task);
  if (st.solved) return;
  st.solved = true;
  st.solvedAt = Date.now();
  if (task.endless) {
    const e = Store.data.endless;
    e.done++;
    e.streak = st.slips ? 0 : e.streak + 1;
    e.best = Math.max(e.best, e.streak);
  }
  Store.save();
}
function slip(task) {
  const st = stateFor(task);
  st.slips = (st.slips || 0) + 1;
  if (task.endless) { Store.data.endless.streak = 0; Store.data.endless.slips++; }
  Store.save();
}

// ================================================================ routing
function route() {
  const hash = location.hash.replace(/^#/, "") || "home";
  const [page, arg] = hash.split("/");
  if (ide) { ide.stop(); ide = null; }
  current = null;
  document.querySelectorAll(".nav a").forEach(a => a.classList.toggle("active", a.dataset.page === page));
  renderModeSwitch();
  if (page !== "home" && page !== "help" && !studentName()) { location.replace("#home"); return; }
  window.scrollTo(0, 0);
  if (page === "code") renderCoder();
  else if (page === "help") renderHelp(arg);
  else if (page === "report") renderReport();
  else renderHome();
}

function renderModeSwitch() {
  const box = $("#mode-switch");
  box.innerHTML = Object.entries(MODES).map(([k, m]) =>
    `<button class="mode-btn ${k === mode() ? "on" : ""}" data-mode="${k}" title="${esc(m.blurb)}">${m.icon} ${m.name}</button>`).join("");
  box.querySelectorAll(".mode-btn").forEach(b => b.addEventListener("click", () => setMode(b.dataset.mode)));
}

function setMode(m) {
  if (m === mode()) return;
  Store.data.mode = m;
  Store.save();
  endlessTask = null;
  toast(`${MODES[m].icon} ${MODES[m].name}`);
  route();
}

// ================================================================ welcome
function renderHome() {
  const name = studentName();
  view().innerHTML = `
    <div class="welcome card">
      <div class="welcome-emoji">🐍</div>
      <h1>Casting &amp; data types</h1>
      <p class="lead">Practise <code>int()</code> <code>float()</code> <code>str()</code> <code>bool()</code></p>
      <form id="setup">
        <label>Name <input id="st-name" value="${esc(name)}" required autocomplete="off"></label>
        <label>Class <input id="st-group" value="${esc(Store.data.student.group)}" autocomplete="off"></label>
        <div class="field-label">Difficulty</div>
        <div class="mode-cards">${Object.entries(MODES).map(([k, m]) => `
          <label class="mode-card ${k === mode() ? "on" : ""}"><input type="radio" name="mode" value="${k}" ${k === mode() ? "checked" : ""}>
          <span class="mode-card-title">${m.icon} ${m.name}</span><span class="mode-card-blurb">${esc(m.blurb)}</span></label>`).join("")}</div>
        <button class="btn btn-primary btn-big" type="submit">${name ? "Continue →" : "Start →"}</button>
      </form>
    </div>`;
  view().querySelectorAll('input[name="mode"]').forEach(r => r.addEventListener("change", () =>
    view().querySelectorAll(".mode-card").forEach(c => c.classList.toggle("on", c.querySelector("input").checked))));
  $("#setup").addEventListener("submit", e => {
    e.preventDefault();
    Store.data.student.name = $("#st-name").value.trim();
    Store.data.student.group = $("#st-group").value.trim();
    Store.data.mode = view().querySelector('input[name="mode"]:checked').value;
    Store.save();
    location.hash = "#code";
  });
}

// ================================================================ the coding screen
function renderCoder() {
  const tab = Store.data.tab || "lesson";
  view().innerHTML = `
    <div class="coder">
      <aside class="panel card">
        <div class="panel-tabs" role="tablist">
          ${[["lesson", "📘 Lesson"], ["endless", "♾️ Endless"], ["free", "🧪 Free"]].map(([k, l]) =>
            `<button class="panel-tab ${k === tab ? "on" : ""}" data-tab="${k}" role="tab" aria-selected="${k === tab}">${l}</button>`).join("")}
        </div>
        <div id="panel-body"></div>
      </aside>
      <div class="coder-ide"><div id="ide"></div></div>
    </div>`;
  view().querySelectorAll(".panel-tab").forEach(b => b.addEventListener("click", () => {
    Store.data.tab = b.dataset.tab;
    Store.save();
    if (ide) ide.stop();
    renderCoder();
  }));
  ide = new IDE($("#ide"), {
    showCheck: false,
    onChange: code => {
      if (!current) { if (Store.data.tab === "free") { Store.data.sandbox = code; Store.save(); } return; }
      if (["modify", "make", "investigate"].includes(current.stage)) { stateFor(current).code = code; if (!current.endless) Store.save(); }
    },
    onMistake: (key, detail, line) => {
      if (current && ["predict", "predictType", "investigate"].includes(current.stage)) return;
      logMistake(key, current ? current.id : "free", detail, line);
    },
    onRun: res => current && onTaskRun(current, res),
    onCheck: code => current && checkTask(current, code),
  });
  if (tab === "free") showFree();
  else if (tab === "endless") showTask(endlessTask || (endlessTask = nextEndlessTask(mode())));
  else showLesson(Store.data.lessonPos);
}

// ---------------------------------------------------------------- free
const FREE_EXAMPLES = [
  { name: "The 5 data types", code: 'age = 15\nheight = 1.62\ngrade = "A"\nname = "Sam"\nhas_pet = True\nprint(name, age, height, grade, has_pet)\n' },
  { name: "All 4 casts", code: 'text = "7"\nwhole = int(text)\ndecimal = float(text)\nback = str(whole)\nyes = bool(1)\nprint(text * 2, whole * 2, decimal * 2, back * 2, yes)\n' },
  { name: "The 55 bug", code: 'first = input("Number: ")\nsecond = input("Number: ")\nprint(first + second)\n' },
];

function showFree() {
  current = null;
  ide.lockRun(false);
  ide.setReadOnly(false);
  ide.presetInputs = null;
  ide.el.ide.classList.add("no-check");
  ide.load(Store.data.sandbox || FREE_EXAMPLES[0].code, "");
  $("#panel-body").innerHTML = `
    <div class="stage-row"><span class="stage-badge s-free">🧪 Free coding</span></div>
    <p class="task-text">Try anything.<br>Watch the <b>Variables</b> table.</p>
    <div class="free-examples">${FREE_EXAMPLES.map((e, i) => `<button class="btn btn-sm" data-ex="${i}">${esc(e.name)}</button>`).join("")}</div>`;
  $("#panel-body").querySelectorAll("[data-ex]").forEach(b => b.addEventListener("click", () => {
    ide.load(FREE_EXAMPLES[b.dataset.ex].code, "");
    Store.data.sandbox = ide.getCode();
    Store.save();
  }));
}

// ---------------------------------------------------------------- lesson
function showLesson(pos) {
  const list = lessonTasks();
  const limit = UNLOCK_ALL ? list.length - 1 : Math.min(firstUndone(), list.length - 1);
  if (pos == null || pos > limit) pos = Math.min(firstUndone(), list.length - 1);
  pos = Math.max(0, pos);
  Store.data.lessonPos = pos;
  Store.save();
  showTask(resolve(list[pos]), { pos, total: list.length });
}

function showLessonComplete() {
  current = null;
  ide.el.ide.classList.add("no-check");
  $("#panel-body").innerHTML = `
    <div class="complete">
      <div class="complete-emoji">🎉</div>
      <h2>Lesson done!</h2>
      <p>Try ♾️ <b>Endless</b> or a harder difficulty.</p>
      <div class="complete-actions">
        <a class="btn btn-primary" href="#report">📄 Export my report</a>
        <button class="btn" id="to-endless">♾️ Endless</button>
      </div>
    </div>`;
  $("#to-endless").addEventListener("click", () => { Store.data.tab = "endless"; Store.save(); renderCoder(); });
}

// ---------------------------------------------------------------- a task in the panel
function showTask(task, where) {
  current = task;
  const st = stateFor(task);
  const stage = STAGES[task.stage];
  const easy = mode() === "easy";
  const isProgram = task.stage === "modify" || task.stage === "make";
  const locked = task.stage === "predict" || task.stage === "predictType";

  // Editor set-up for this task.
  ide.el.ide.classList.toggle("no-check", !isProgram);
  ide.presetInputs = task.stage === "predict" ? (task.inputs || []) : null;
  ide.setReadOnly(locked);
  ide.load(st.code != null && !locked ? st.code : task.code || "", task.code || "");
  ide.lockRun(locked && !st.guess, locked ? "Make your prediction first" : "");

  const e = Store.data.endless;
  const top = task.endless
    ? `<div class="panel-top"><span>♾️ Endless</span><span class="stats">✅ ${e.done} · 🔥 ${e.streak}${e.best ? ` · best ${e.best}` : ""}</span></div>`
    : `<div class="panel-top"><span>${esc(task.part)}</span><span>${where.pos + 1} / ${where.total}</span></div>
       <div class="meter"><span style="width:${(firstUndone() / where.total) * 100}%"></span></div>`;

  $("#panel-body").innerHTML = `${top}
    <div class="stage-row"><span class="stage-badge s-${task.stage}">${stage.icon} ${stage.label}</span>${task.isHard ? `<span class="tag tag-hard">🔴 Hard</span>` : ""}</div>
    <div id="task-main"></div>
    <div id="task-feedback"></div>
    <div id="hint-list"></div>
    <div class="panel-help">
      ${task.example ? `<button class="btn btn-sm" id="worked-btn">📖 Worked example</button>` : ""}
      ${easy && task.hints && task.hints.length ? `<button class="btn btn-sm" id="hint-btn">💡 Hint</button>` : ""}
    </div>
    <div class="panel-nav">
      ${task.endless ? `<button class="btn btn-ghost" id="skip-btn">Skip ↷</button>` : `<button class="btn btn-ghost" id="back-btn" ${where.pos === 0 ? "disabled" : ""}>← Back</button>`}
      <button class="btn btn-primary" id="next-btn">Next →</button>
    </div>`;

  const main = $("#task-main");
  if (locked) renderPredict(task, main);
  else if (task.stage === "investigate") renderInvestigate(task, main);
  else if (task.stage === "question") renderQuestion(task, main);
  else renderProgramTask(task, main);

  // hints (easy only)
  const drawHints = () => {
    $("#hint-list").innerHTML = (task.hints || []).slice(0, st.hints || 0).map(h => `<div class="hint">💡 ${h}</div>`).join("");
    const b = $("#hint-btn");
    if (b) b.disabled = (st.hints || 0) >= task.hints.length;
  };
  drawHints();
  task._drawHints = drawHints;
  const hb = $("#hint-btn");
  if (hb) hb.addEventListener("click", () => { st.hints = (st.hints || 0) + 1; Store.save(); drawHints(); });
  const wb = $("#worked-btn");
  if (wb) wb.addEventListener("click", () => { st.worked = (st.worked || 0) + 1; Store.save(); showWorked(task.example); });

  const nextBtn = $("#next-btn");
  const refresh = () => {
    const done = !!stateFor(task).solved;
    nextBtn.disabled = !(done || (UNLOCK_ALL && !task.endless));
    nextBtn.classList.toggle("pulse", done);
  };
  task._refresh = refresh;
  refresh();
  nextBtn.addEventListener("click", () => {
    if (task.endless) { endlessTask = nextEndlessTask(mode()); showTask(endlessTask); return; }
    if (where.pos + 1 >= lessonTasks().length) return showLessonComplete();
    showLesson(where.pos + 1);
  });
  const back = $("#back-btn");
  if (back) back.addEventListener("click", () => showLesson(where.pos - 1));
  const skip = $("#skip-btn");
  if (skip) skip.addEventListener("click", () => { if (!st.solved) slip(task); endlessTask = nextEndlessTask(mode()); showTask(endlessTask); });
}

function feedback(html, cls) {
  const el = $("#task-feedback");
  if (el) el.innerHTML = html ? `<div class="feedback ${cls}">${html}</div>` : "";
}

// ---------------------------------------------------------------- predict
function renderPredict(task, main) {
  const st = stateFor(task);
  const typeTask = task.stage === "predictType";
  const q = typeTask ? `What <b>data type</b> is <code>${esc(task.code.split("=")[0].trim())}</code>?` : "What will it print?";
  const draw = () => {
    let html = `<p class="task-text">${q}</p>`;
    if (task.inputs && task.inputs.length) html += `<p class="small">The user types ${task.inputs.map(x => `<span class="c-typed">${esc(x)}</span>`).join(" then ")}</p>`;
    if (!st.guess) {
      html += `<div class="answer-row"><input class="answer-input" id="guess" autocomplete="off" spellcheck="false" placeholder="${typeTask ? "e.g. Integer" : "My prediction"}">
        <button class="btn btn-primary" id="lock-btn">Lock in</button></div>
        ${typeTask ? `<div class="type-reminder">Integer · Real · Character · String · Boolean</div>` : `<div class="type-reminder">If it crashes, type <b>error</b>.</div>`}`;
    } else {
      html += `<div class="guess-row">🔮 You said <code class="guess">${esc(st.guess)}</code></div>`;
      if (!st.ran) html += `<div class="do-now">Now press <b>▶ Run</b> ➜</div>`;
    }
    main.innerHTML = html;
    const lock = $("#lock-btn");
    if (lock) {
      const inp = $("#guess");
      const go = () => {
        if (!inp.value.trim()) return inp.focus();
        st.guess = inp.value.trim();
        if (!task.endless) Store.save();
        ide.lockRun(false, "ready");
        draw();
      };
      lock.addEventListener("click", go);
      inp.addEventListener("keydown", e => { if (e.key === "Enter") go(); });
      setTimeout(() => inp.focus(), 30);
    }
    if (st.ran) feedback(`${st.match ? "✓ Correct!" : `✗ It was <code>${esc(st.actual)}</code>`}<br>${task.why}`, st.match ? "good" : "bad");
  };
  task._draw = draw;
  draw();
}

function onTaskRun(task, res) {
  const st = stateFor(task);
  if (task.stage !== "predict" && task.stage !== "predictType") return;
  if (!st.guess) return;
  let match, actual;
  if (task.stage === "predictType") {
    const v = res.finalVars.find(x => x[2] !== "function");
    actual = v ? ocrType(v[2], v[1]) : "?";
    match = OCR_ALIASES[normPred(st.guess)] === actual;
  } else {
    match = predictionMatches(st.guess, res);
    actual = res.error ? res.error.type : res.out.trim();
  }
  const first = !st.ran;
  ide.lockRun(false);
  st.ran = true;
  st.match = match;
  st.actual = actual;
  if (first && !match) {
    logMistake(task.mistake, task.endless ? "endless" : task.id, `Predicted "${st.guess}", got "${actual}": ${task.code.replace(/\n/g, " / ")}`, task.code.split("\n").pop());
    slip(task);
  }
  markDone(task);
  task._draw();
  task._refresh();
}

// ---------------------------------------------------------------- investigate
function renderInvestigate(task, main) {
  const st = stateFor(task);
  const qs = task.questions;
  const draw = () => {
    const open = qs.findIndex((_, i) => !(st.answers[i] && st.answers[i].done));
    let html = `<p class="task-text">${task.task}</p>`;
    qs.forEach((q, i) => {
      if (open >= 0 && i > open) return;
      const a = st.answers[i] || { wrong: 0 };
      html += `<div class="inv-q"><div class="q-text">${i + 1}. ${q.q}</div>`;
      if (a.done) html += `<div class="guess-row"><code class="guess">${esc(a.value)}</code> ${a.revealed ? "" : "✓"}</div>`;
      else {
        html += `<div class="answer-row"><input class="answer-input" id="ans-${i}" autocomplete="off" spellcheck="false" placeholder="Answer">
          <button class="btn btn-primary" data-ans="${i}">Check</button></div>`;
        if (a.wrong) html += `<div class="feedback bad">✗ Try again.${a.wrong >= 3 ? ` <button class="linkish" data-reveal="${i}">Show answer</button>` : ""}</div>`;
      }
      html += "</div>";
    });
    if (open < 0) html += `<div class="key-idea">💡 ${task.key}</div>`;
    main.innerHTML = html;
    main.querySelectorAll("[data-ans]").forEach(b => {
      const i = +b.dataset.ans;
      const inp = $("#ans-" + i);
      const check = () => {
        const q = qs[i];
        const a = st.answers[i] || (st.answers[i] = { wrong: 0 });
        if (!inp.value.trim()) return inp.focus();
        if (answerOk(inp.value, q.accept)) { a.done = true; a.value = inp.value.trim(); }
        else {
          a.wrong++;
          if (a.wrong === 1) { logMistake(q.mistake, task.id, `Answered "${inp.value.trim()}": ${q.q.replace(/<[^>]+>/g, "")}`, ""); slip(task); }
        }
        finish();
      };
      b.addEventListener("click", check);
      inp.addEventListener("keydown", e => { if (e.key === "Enter") check(); });
      if (i === open) setTimeout(() => inp.focus(), 30);
    });
    main.querySelectorAll("[data-reveal]").forEach(b => b.addEventListener("click", () => {
      const i = +b.dataset.reveal;
      Object.assign(st.answers[i], { done: true, revealed: true, value: qs[i].answer });
      finish();
    }));
  };
  const finish = () => {
    if (qs.every((_, k) => st.answers[k] && st.answers[k].done)) markDone(task);
    if (!task.endless) Store.save();
    draw();
    task._refresh();
  };
  draw();
}

// ---------------------------------------------------------------- endless question
function renderQuestion(task, main) {
  const st = stateFor(task);
  const draw = () => {
    main.innerHTML = `<div class="task-text">${task.task}</div>` + (st.solved
      ? `<div class="guess-row"><code class="guess">${esc(st.value)}</code></div>`
      : `<div class="answer-row"><input class="answer-input" id="q-ans" autocomplete="off" placeholder="int, float, str or bool"><button class="btn btn-primary" id="q-btn">Check</button></div>`);
    const b = $("#q-btn");
    if (!b) return;
    const inp = $("#q-ans");
    const check = () => {
      if (!inp.value.trim()) return;
      if (answerOk(inp.value, task.accept)) { st.value = inp.value.trim(); markDone(task); feedback("✓ Correct!", "good"); }
      else {
        if (!st.wrong) { logMistake(task.mistake, "endless", `Which cast: answered "${inp.value.trim()}"`, ""); slip(task); }
        st.wrong = (st.wrong || 0) + 1;
        if (st.wrong >= 2) { st.value = task.answer; markDone(task); feedback(`✗ It's <code>${esc(task.answer)}</code>.`, "bad"); }
        else feedback("✗ Try again.", "bad");
      }
      draw();
      task._refresh();
    };
    b.addEventListener("click", check);
    inp.addEventListener("keydown", e => { if (e.key === "Enter") check(); });
    setTimeout(() => inp.focus(), 30);
  };
  draw();
}

// ---------------------------------------------------------------- modify / make
const CHIP_CLASS = { Integer: "int", Real: "float", Character: "char", String: "str", Boolean: "bool" };

// Run the model solution to get the exact output each test should give.
const EXPECTED = {};
async function prepareExpected(task) {
  const key = task.storeId || task.id;
  if (EXPECTED[key]) return EXPECTED[key];
  const result = { lines: [], sample: null };
  if (task.solution) {
    for (let i = 0; i < task.tests.length; i++) {
      const { res, segs } = await runSnippet(task.solution, task.tests[i].inputs);
      result.lines.push(H.lines(res.out));
      if (i === 0) result.sample = segs;
    }
  } else if (task.sample) {
    result.sample = [{ text: "> ", kind: "cmd-prompt" }, { text: "python main.py\n", kind: "cmd" }, { text: task.sample + "\n", kind: "out" }];
  }
  EXPECTED[key] = result;
  return result;
}

// Compare the student's output with the expected lines. Returns a problem or null.
function compareOutput(out, expected, inputs) {
  const got = H.lines(out);
  if (!got.length) return { mistake: "wrong_output", msg: "It didn't print anything." };
  for (let i = 0; i < expected.length; i++) {
    const e = expected[i], g = got[i];
    if (g === e) continue;
    const where = expected.length > 1 ? `Line ${i + 1}` : "It";
    if (g == null) return { mistake: "wrong_output", msg: `${where} is missing. It should be: <code>${esc(e)}</code>` };
    let mistake = "wrong_output", tip = "";
    const squash = s => s.toLowerCase().replace(/\s+/g, "");
    if (squash(g) === squash(e)) { mistake = g.replace(/\s/g, "") === e.replace(/\s/g, "") ? "missing_space" : "wrong_output"; tip = "Check spaces and capital letters."; }
    else if (inputs.length > 1 && g.includes(inputs.join(""))) { mistake = "concat_not_add"; tip = "The inputs were joined, not added."; }
    else if (g.replace(/\.0\b/g, "") === e.replace(/\.0\b/g, "")) { mistake = "datatype_real_int"; tip = "Should it be a Real or an Integer?"; }
    return { mistake, msg: `${where} should be:<div class="out-mini ok">${esc(e)}</div>You printed:<div class="out-mini">${esc(g)}</div>${tip}` };
  }
  if (got.length > expected.length) return { mistake: "wrong_output", msg: `You printed an extra line:<div class="out-mini">${esc(got[expected.length])}</div>` };
  return null;
}

// Which mistake is it when a variable has the wrong data type?
function typeMistake(want, got) {
  if (want === "Integer" || want === "Real") return got === "String" || got === "Character" ? "missing_num_cast" : "int_on_decimal";
  if (want === "Boolean") return "datatype_bool";
  if (want === "Character") return "datatype_choice";
  return "datatype_quotes";
}

function stripTags(s) { return String(s).replace(/<[^>]+>/g, "").replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim(); }

function renderProgramTask(task, main) {
  main.innerHTML = `
    ${task.title ? `<div class="task-title">${esc(task.title)}</div>` : ""}
    <ol class="task-steps">${task.steps.map(s => `<li>${s}</li>`).join("")}</ol>
    <div class="demo-label">It should look like this:</div>
    <div id="sample-run" class="small muted">Loading...</div>
    <button class="btn btn-check-big" id="check-btn">✓ Check my code</button>`;
  $("#check-btn").addEventListener("click", () => checkTask(task, ide.getCode()));
  prepareExpected(task).then(r => {
    const el = $("#sample-run");
    if (el && current === task) el.outerHTML = r.sample ? termView(r.sample) : "";
  });
}

async function checkTask(task, code) {
  const st = stateFor(task);
  if (Engine.busy || ide.running) return;
  ide.exitDebug();
  ide.setRunning(true);
  st.attempts = (st.attempts || 0) + 1;
  feedback("Checking...", "neutral");
  const expected = await prepareExpected(task);
  let fail = null, firstRes = null;
  const seen = new Set();
  const where = task.endless ? "endless" : task.id;
  const logOnce = (k, d, l) => { if (k && !seen.has(k)) { seen.add(k); logMistake(k, where, stripTags(d), l); } };
  for (let i = 0; i < task.tests.length; i++) {
    const test = task.tests[i];
    let res;
    try { res = await Engine.run(code, { inputs: test.inputs }); } catch (e) { fail = { msg: "Could not run." }; break; }
    if (!firstRes) firstRes = res;
    if (res.error) {
      const cls = classifyError(res.error, res.warnings);
      logOnce(cls.key, `${res.error.type}: ${res.error.msg}`, res.error.text || "");
      fail = { test, msg: `<b>${esc(res.error.type)}</b> on line ${res.error.line || "?"}.<br>${esc((MISTAKES[cls.key] || {}).fix || "")}` };
      break;
    }
    const vars = res.finalVars || [];
    let v = null;
    // 1. the right variables, with the right data types
    for (const [name, want] of Object.entries(task.vars || {})) {
      const found = vars.find(x => x[0] === name);
      if (!found) { v = { mistake: "name_mismatch", msg: `Make a variable called <code>${esc(name)}</code>.` }; break; }
      const got = ocrType(found[2], found[1]);
      if (got !== want) { v = { mistake: typeMistake(want, got), msg: `<code>${esc(name)}</code> should be <span class="vb-chip t-${CHIP_CLASS[want]}">${want}</span> but it is <span class="vb-chip t-${CHIP_CLASS[got] || "str"}">${got}</span>.` }; break; }
    }
    // 2. things the code must use
    if (!v) for (const [re, msg, mistake] of task.mustUse || []) if (!H.uses(code, re)) { v = { mistake, msg: esc(msg) }; break; }
    // 3. the exact output
    if (!v && task.solution) v = compareOutput(res.out, expected.lines[i], test.inputs);
    if (!v && test.check) v = test.check({ out: res.out, inputs: test.inputs, code, vars });
    if (v) { logOnce(v.mistake, v.msg, ""); fail = { test, msg: v.msg }; break; }
  }
  if (firstRes) {
    const lines = code.split("\n");
    firstRes.warnings.forEach(w => { const info = WARNINGS[w.code]; if (info && info.log) logOnce(info.key, info.text(w), lines[w.line - 1] || ""); });
  }
  ide.setRunning(false);
  if (firstRes) ide.showResult(firstRes, code, false, false);
  if (!fail) {
    markDone(task);
    feedback(`✓ Correct! ${st.attempts === 1 ? "First try!" : ""}`, "good");
  } else {
    if (st.attempts === 1) slip(task);
    const typed = fail.test && fail.test.inputs.length ? `<div class="small">When the user types ${fail.test.inputs.map(x => `<span class="c-typed">${esc(x)}</span>`).join(" then ")}:</div>` : "";
    feedback(`✗ Not yet.${typed}${fail.msg}${st.attempts >= 3 && mode() !== "easy" ? `<div class="small">Stuck? Try 📖 Worked example.</div>` : ""}`, "bad");
    if (mode() === "easy" && task._drawHints && task.hints && (st.hints || 0) < task.hints.length) { st.hints = (st.hints || 0) + 1; task._drawHints(); }
  }
  if (!task.endless) Store.save();
  task._refresh();
}

// ---------------------------------------------------------------- worked example
async function showWorked(id) {
  const ex = WORKED[id];
  if (!ex) return;
  const box = document.createElement("div");
  box.className = "modal-back";
  box.innerHTML = `<div class="modal card" role="dialog" aria-label="Worked example">
    <div class="modal-head"><h2>📖 ${esc(ex.title)}</h2><button class="btn btn-ghost" id="close-worked" aria-label="Close">✕</button></div>
    ${codeView(ex.code)}
    <ol class="worked-steps">${ex.steps.map(s => `<li>${s}</li>`).join("")}</ol>
    <div id="worked-out" class="small muted">Running...</div>
  </div>`;
  document.body.appendChild(box);
  const close = () => { box.remove(); document.removeEventListener("keydown", onKey); };
  const onKey = e => { if (e.key === "Escape") close(); };
  document.addEventListener("keydown", onKey);
  box.addEventListener("click", e => { if (e.target === box) close(); });
  $("#close-worked").addEventListener("click", close);
  $("#close-worked").focus();
  const { res, segs } = await runSnippet(ex.code, ex.inputs || []);
  const outEl = $("#worked-out");
  if (!outEl) return;
  outEl.outerHTML = `<div class="worked-grid"><div>${termView(segs)}</div><div class="ide worked-vars"><table class="vars"><thead><tr><th>Name</th><th>Value</th><th>Type</th></tr></thead><tbody>${varRows(res.finalVars || [])}</tbody></table></div></div>`;
}

// ================================================================ shared helpers
function codeView(code) {
  const n = code.split("\n").length;
  return `<div class="code-view cm-s-dark-ide"><div class="ln">${Array.from({ length: n }, (_, i) => i + 1).join("\n")}</div><pre>${highlight(code)}</pre></div>`;
}
function termView(segs) {
  return `<div class="ide mini-term"><div class="console">${segs.map(s => `<span class="c-${s.kind}">${esc(s.text)}</span>`).join("")}</div></div>`;
}
async function runSnippet(code, inputs) {
  const segs = [{ text: "> ", kind: "cmd-prompt" }, { text: "python main.py\n", kind: "cmd" }];
  const push = (text, kind) => { const last = segs[segs.length - 1]; if (last.kind === kind) last.text += text; else segs.push({ text, kind }); };
  while (Engine.busy) await new Promise(r => setTimeout(r, 100));
  const res = await Engine.run(code, { inputs: inputs || [], emit: push });
  if (res.error && res.error.type !== "Stopped") push((segs[segs.length - 1].text.endsWith("\n") ? "" : "\n") + (res.error.tb || res.error.type) + "\n", "err");
  return { res, segs };
}
function normPred(s) {
  return String(s).toLowerCase().replace(/["']/g, "").replace(/\(\)$/, "").replace(/\s+/g, " ").trim();
}
function predictionMatches(guess, res) {
  const g = normPred(guess);
  if (!g) return false;
  if (res.error) return /error|crash/.test(g) || g.includes(res.error.type.toLowerCase());
  return g === normPred(res.out);
}
function answerOk(ans, accept) {
  const raw = ans.trim();
  const a = raw.toLowerCase().replace(/\s+/g, " ").replace(/^["']|["']$/g, "");
  return accept.some(x => x.startsWith("/") ? new RegExp(x.slice(1, x.lastIndexOf("/")), "i").test(raw) : a === x.toLowerCase());
}
function highlight(code) {
  if (!window.CodeMirror || !CodeMirror.runMode) return esc(code);
  const parts = [];
  CodeMirror.runMode(code, "python", (text, style) => parts.push(style ? `<span class="cm-${style.replace(/ +/g, " cm-")}">${esc(text)}</span>` : esc(text)));
  return parts.join("");
}

// ================================================================ help
function renderHelp(id) {
  const topic = HELP.find(h => h.id === id);
  if (!topic) {
    view().innerHTML = `<h1 class="page-title">❔ Help</h1><p class="lead">Pick a topic.</p>
      <div class="help-grid">${HELP.map(h => `<a class="help-tile" href="#help/${h.id}"><span class="help-icon">${h.icon}</span><span>${esc(h.title)}</span></a>`).join("")}</div>`;
    return;
  }
  const i = HELP.indexOf(topic);
  view().innerHTML = `
    <div class="help-card card">
      <a href="#help" class="back">← All topics</a>
      <h1><span class="help-icon">${topic.icon}</span> ${esc(topic.title)}</h1>
      <div class="help-body">${topic.body}</div>
      ${topic.code ? codeView(topic.code) : ""}
      ${topic.output ? `<div class="demo-label">Prints</div>${termView([{ text: topic.output, kind: "out" }])}` : ""}
      ${topic.watch ? `<div class="watch">⚠ ${topic.watch}</div>` : ""}
      <div class="help-nav">
        ${i > 0 ? `<a class="btn" href="#help/${HELP[i - 1].id}">← ${esc(HELP[i - 1].title)}</a>` : "<span></span>"}
        ${topic.code ? `<button class="btn btn-run-big" id="try-it">▶ Try it</button>` : ""}
        ${i < HELP.length - 1 ? `<a class="btn" href="#help/${HELP[i + 1].id}">${esc(HELP[i + 1].title)} →</a>` : "<span></span>"}
      </div>
    </div>`;
  const t = $("#try-it");
  if (t) t.addEventListener("click", () => {
    Store.data.sandbox = topic.code + "\n";
    Store.data.tab = "free";
    Store.save();
    location.hash = studentName() ? "#code" : "#home";
  });
}

// ================================================================ report
function reportData() {
  const counts = {};
  for (const m of Store.data.mistakes) counts[m.key] = (counts[m.key] || 0) + 1;
  const ranked = Object.entries(counts).filter(([k]) => MISTAKES[k]).sort((a, b) => b[1] - a[1]);
  const list = lessonTasks();
  const done = list.filter(t => isDone(t.id));
  const firstTry = done.filter(t => { const st = [Store.task(t.id), Store.task(t.id + "@hard")].find(s => s.solved); return st && !st.slips; });
  let preds = 0, predsRight = 0;
  list.filter(t => t.stage === "predict" || t.stage === "predictType").forEach(t => {
    [Store.task(t.id), Store.task(t.id + "@hard")].forEach(s => { if (s.ran) { preds++; if (s.match) predsRight++; } });
  });
  const worked = Object.values(Store.data.tasks).reduce((n, t) => n + (t.worked || 0), 0);
  const parts = [...new Set(list.map(t => t.part))].map(p => ({ name: p, total: list.filter(t => t.part === p).length, done: list.filter(t => t.part === p && isDone(t.id)).length }));
  return { ranked, list, done, firstTry, preds, predsRight, worked, parts, e: Store.data.endless };
}

function renderReport() {
  const d = reportData();
  const max = d.ranked.length ? d.ranked[0][1] : 1;
  view().innerHTML = `
    <h1 class="page-title">📄 My report</h1>
    <div class="card export-card">
      <ol class="export-steps">
        <li>Press <b>Export PDF</b>.</li>
        <li>In Google Classroom: <b>Add or create → File</b>.</li>
        <li>Pick the PDF. Press <b>Hand in</b>.</li>
      </ol>
      <button class="btn btn-primary btn-big" id="dl-report">⬇ Export PDF</button>
    </div>
    <div class="tiles">
      <div class="tile"><div class="tile-val">${d.done.length}<span>/${d.list.length}</span></div><div class="tile-label">lesson tasks</div></div>
      <div class="tile"><div class="tile-val">${d.predsRight}<span>/${d.preds}</span></div><div class="tile-label">predictions right</div></div>
      <div class="tile"><div class="tile-val">${d.e.done}</div><div class="tile-label">endless tasks</div></div>
      <div class="tile"><div class="tile-val">${d.e.best}</div><div class="tile-label">best streak</div></div>
    </div>
    <div class="card"><h2>Work on next</h2>
      ${d.ranked.length ? d.ranked.slice(0, 3).map(([k, n], i) => {
        const m = MISTAKES[k];
        const help = HELP.find(h => h.id === HELP_FOR[k]);
        return `<div class="focus-item"><div class="focus-num">${i + 1}</div><div><b>${esc(m.title)}</b> <span class="muted">×${n}</span><div>${esc(m.advice)}</div>${help ? `<a href="#help/${help.id}">${help.icon} Help: ${esc(help.title)}</a>` : ""}</div></div>`;
      }).join("") : `<p class="muted">No mistakes yet.</p>`}
    </div>
    <div class="card"><h2>My mistakes</h2>
      ${d.ranked.length ? `<div class="bars">${d.ranked.slice(0, 8).map(([k, n]) => `<div class="bar-row" title="${esc(MISTAKES[k].title)}: ${n}"><div class="bar-label">${esc(MISTAKES[k].title)}</div><div class="bar-track"><span class="bar" style="width:${Math.max(4, n / max * 100)}%"></span></div><div class="bar-val">${n}</div></div>`).join("")}</div>` : `<p class="muted">None yet.</p>`}
    </div>
    <div class="report-actions">
      <button class="btn btn-ghost" id="dl-backup">Save backup</button>
      <label class="btn btn-ghost">Load backup<input type="file" id="load-backup" accept=".json" hidden></label>
      <button class="btn btn-ghost btn-danger" id="reset-all">Delete my data</button>
    </div>`;
  $("#dl-report").addEventListener("click", exportPdf);
  $("#dl-backup").addEventListener("click", () => download(`python-backup-${slug(studentName() || "student")}.json`, JSON.stringify(Store.data), "application/json"));
  $("#load-backup").addEventListener("change", async e => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      if (!data || !data.tasks || !Array.isArray(data.mistakes)) throw new Error("bad");
      if (!confirm("Replace your work with this backup?")) return;
      Store.data = Object.assign(Store.blank(), data);
      Store.save();
      renderReport();
    } catch (err) { alert("That isn't a backup file."); }
  });
  $("#reset-all").addEventListener("click", () => {
    if (!confirm("Delete ALL your work on this computer?")) return;
    Store.reset();
    location.hash = "#home";
  });
}

function slug(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
function download(filename, text, type) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
function fmtTime(t) {
  const d = new Date(t);
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" }) + " " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

// ================================================================ PDF export (for Google Classroom)
function pdfText(s) {
  return String(s ?? "").replace(/<[^>]+>/g, "")
    .replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/[–—]/g, "-").replace(/→/g, "->").replace(/×/g, "x")
    .replace(/[^\x20-\x7E\n£°]/g, "").replace(/ {2,}/g, " ").trim();
}

function exportPdf() {
  if (!window.jspdf) { alert("The PDF maker didn't load. Check the internet and refresh."); return; }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth(), PH = doc.internal.pageSize.getHeight(), M = 40, blue = [47, 91, 211];
  let y = 48;
  const d = reportData();
  const name = studentName() || "(no name)";
  const ensure = h => { if (y + h > PH - 50) { doc.addPage(); y = 50; } };
  const heading = t => { ensure(40); doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.setTextColor(28, 34, 48); doc.text(t, M, y); y += 8; doc.setDrawColor(221, 225, 231); doc.line(M, y, W - M, y); y += 16; };
  const para = (t, o = {}) => {
    doc.setFont(o.font || "helvetica", o.bold ? "bold" : "normal"); doc.setFontSize(o.size || 10); doc.setTextColor(...(o.color || [28, 34, 48]));
    doc.splitTextToSize(pdfText(t), W - M * 2 - (o.indent || 0)).forEach(l => { ensure(14); doc.text(l, M + (o.indent || 0), y); y += (o.size || 10) + 4; });
  };
  const table = (head, body, extra = {}) => {
    doc.autoTable(Object.assign({ startY: y, head: [head], body: body.map(r => r.map(pdfText)), margin: { left: M, right: M }, theme: "striped", headStyles: { fillColor: blue, fontSize: 9 }, styles: { fontSize: 9, cellPadding: 4 } }, extra));
    y = doc.lastAutoTable.finalY + 22;
  };

  doc.setFillColor(...blue); doc.rect(0, 0, W, 6, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(20); doc.setTextColor(28, 34, 48);
  doc.text("Casting & data types: my report", M, y); y += 22;
  doc.setFont("helvetica", "normal"); doc.setFontSize(11); doc.setTextColor(95, 107, 125);
  doc.text(pdfText(`${name}${Store.data.student.group ? "  |  " + Store.data.student.group : ""}  |  ${MODES[mode()].name}  |  ${new Date().toLocaleString()}`), M, y); y += 24;

  table(["Lesson tasks", "Right first time", "Predictions right", "Endless tasks", "Best streak", "Worked examples"],
    [[`${d.done.length} / ${d.list.length}`, String(d.firstTry.length), `${d.predsRight} / ${d.preds}`, String(d.e.done), String(d.e.best), String(d.worked)]],
    { theme: "grid", styles: { fontSize: 12, halign: "center", cellPadding: 7 }, headStyles: { fillColor: blue, fontSize: 9, halign: "center" } });

  heading("Work on next");
  if (!d.ranked.length) para("No mistakes recorded yet.");
  d.ranked.slice(0, 3).forEach(([k, n], i) => {
    const m = MISTAKES[k];
    ensure(50);
    para(`${i + 1}. ${m.title}  (x${n})`, { bold: true, size: 11 });
    para(m.advice, { indent: 14 });
    if (m.bad && m.good) {
      para("Wrong:", { indent: 14, bold: true, color: [192, 54, 44] });
      m.bad.split("\n").forEach(l => para(l, { indent: 28, font: "courier", size: 9 }));
      para("Right:", { indent: 14, bold: true, color: [29, 122, 70] });
      m.good.split("\n").forEach(l => para(l, { indent: 28, font: "courier", size: 9 }));
    }
    y += 6;
  });

  heading("My mistakes");
  if (!d.ranked.length) para("None yet.");
  else {
    const max = d.ranked[0][1];
    table(["Mistake", "Times", ""], d.ranked.slice(0, 10).map(([k, n]) => [MISTAKES[k].title, String(n), ""]), {
      columnStyles: { 0: { cellWidth: 300 }, 1: { cellWidth: 40, halign: "right" } },
      didDrawCell: c => { if (c.section !== "body" || c.column.index !== 2) return; const n = d.ranked[c.row.index][1]; doc.setFillColor(...blue); doc.rect(c.cell.x + 4, c.cell.y + c.cell.height / 2 - 4, Math.max(3, (c.cell.width - 8) * n / max), 8, "F"); },
    });
  }

  heading("Lesson progress");
  table(["Part", "Done"], d.parts.map(p => [p.name, `${p.done} / ${p.total}`]));

  heading("Every lesson task");
  table(["Part", "Task", "Result"], d.list.map(t => {
    const s = [Store.task(t.id + "@hard"), Store.task(t.id)].find(x => x.solved) || Store.task(t.id);
    const what = STAGES[t.stage].label + (t.stage.startsWith("predict") ? ": " + t.code.split("\n").pop() : "");
    let result = "-";
    if (t.stage.startsWith("predict")) result = s.ran ? (s.match ? "Predicted right" : `Predicted "${s.guess}"`) : "-";
    else if (s.solved) result = s.slips ? "Done" : "Done first time";
    else if (s.attempts || Object.keys(s.answers).length) result = "Started";
    return [t.part, what, result];
  }), { columnStyles: { 1: { cellWidth: 220, font: "courier", fontSize: 8 } } });

  heading("Mistake log (latest 30)");
  const log = Store.data.mistakes.slice(-30).reverse().map(m => [fmtTime(m.t), (MISTAKES[m.key] || {}).title || m.key, [m.line, m.detail].filter(Boolean).join("\n")]);
  if (!log.length) para("Nothing yet.");
  else table(["When", "Mistake", "Detail"], log, { columnStyles: { 0: { cellWidth: 70 }, 1: { cellWidth: 150 }, 2: { font: "courier", fontSize: 8 } } });

  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p); doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(140);
    doc.text(pdfText(name), M, PH - 24);
    doc.text(`Page ${p} of ${pages}`, W - M, PH - 24, { align: "right" });
  }
  doc.save(`Casting report - ${pdfText(name).replace(/[^A-Za-z0-9 -]/g, "") || "student"}.pdf`);
  toast("Saved to Downloads");
}

// ================================================================ misc
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove("show"), 1600);
}

function init() {
  Store.load();
  const status = $("#py-status");
  Engine.onStatus((state, text) => { status.className = "py-status " + state; status.textContent = text; });
  Engine.load().catch(() => {});
  window.addEventListener("hashchange", route);
  route();
}
document.addEventListener("DOMContentLoaded", init);
