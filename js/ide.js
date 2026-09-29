// A small Python IDE: editor, terminal, variables panel, problems list and a
// step-through debugger.
//
// The debugger records every line the program runs (with the variables at
// that moment), then lets the student step forwards and backwards through it.

const FONT_KEY = "pypractice.font";

// Table rows for variables: name, value and OCR data type.
function varRows(vars, prevVars = null) {
  const prevMap = prevVars ? new Map(prevVars.map(v => [v[0], v[1] + "|" + v[2]])) : null;
  return vars.filter(v => v[2] !== "function").map(v => {
    const changed = prevMap && prevMap.get(v[0]) !== v[1] + "|" + v[2];
    const ocr = ocrType(v[2], v[1]);
    const cls = ocr === "Character" ? "t-char" : "t-" + v[2];
    return `<tr class="${changed ? "changed" : ""}"><td><code>${esc(v[0])}</code></td><td><code class="val">${esc(v[1])}</code></td><td><span class="type-pill ${cls}">${esc(ocr)}</span></td></tr>`;
  }).join("");
}

class IDE {
  constructor(root, opts) {
    this.opts = Object.assign({ code: "", where: "sandbox", showCheck: false, onChange: () => {}, onCheck: null, onMistake: () => {}, onRun: () => {}, starter: "", filename: "main.py" }, opts);
    this.root = root;
    this.segments = [];
    this.steps = null;
    this.pos = 0;
    this.marks = [];
    this.pendingInput = null;
    this.running = false;
    this.prefixLen = 0;
    this.build();
  }

  build() {
    const checkBtn = this.opts.showCheck ? `<button class="tb-btn tb-check" data-act="check" title="Test your program with the test inputs">✓ Check answer</button>` : "";
    this.root.innerHTML = `
      <div class="ide">
        <div class="ide-toolbar">
          <button class="tb-btn tb-run" data-act="run" title="Run (Ctrl+Enter)"><span class="tb-ico">▶</span> Run</button>
          <button class="tb-btn tb-debug" data-act="debug" title="Run, then step through line by line (F5)"><span class="tb-ico">🐞</span> Debug</button>
          <button class="tb-btn tb-stop" data-act="stop" disabled title="Stop the program"><span class="tb-ico">■</span> Stop</button>
          <span class="dbg-controls" hidden>
            <span class="tb-sep"></span>
            <button class="tb-btn" data-act="first" title="Go to the start">⏮</button>
            <button class="tb-btn" data-act="back" title="Step back (Shift+F10)">◀ Back</button>
            <button class="tb-btn tb-step" data-act="next" title="Step forward (F10)">Step ▶</button>
            <button class="tb-btn" data-act="cont" title="Jump to the next breakpoint, or the end">⏭ Continue</button>
            <button class="tb-btn" data-act="exit" title="Stop debugging">✕ Stop debugging</button>
          </span>
          <span class="spacer"></span>
          ${checkBtn}
          <span class="tb-sep"></span>
          <button class="tb-btn tb-ghost" data-act="font-" title="Smaller text">A−</button>
          <button class="tb-btn tb-ghost" data-act="font+" title="Bigger text">A+</button>
          <button class="tb-btn tb-ghost" data-act="reset" title="Put the starting code back">↺ Reset</button>
        </div>
        <div class="ide-body">
          <div class="ide-editor-col">
            <div class="ide-tabs"><span class="ide-tab"><span class="py-ico">🐍</span> ${esc(this.opts.filename)}<span class="tab-dot" hidden>●</span></span></div>
            <div class="ide-editor"></div>
          </div>
          <div class="ide-vars">
            <div class="pane-head"><span>Variables</span><span class="vars-state"></span></div>
            <div class="dbg-explain" hidden></div>
            <input type="range" class="dbg-slider" min="0" value="0" aria-label="Step" hidden>
            <table class="vars"><thead><tr><th>Name</th><th>Value</th><th>Type</th></tr></thead><tbody></tbody></table>
          </div>
        </div>
        <div class="ide-terminal">
          <div class="pane-head"><span>Terminal</span><button class="tb-btn tb-ghost tb-xs" data-act="clear">Clear</button></div>
          <div class="console" tabindex="0"></div>
        </div>
        <div class="ide-status">
          <span class="st-state"><span class="st-dot"></span><span class="st-text">Ready</span></span>
          <span class="spacer"></span>
          <span class="st-pos">Ln 1, Col 1</span><span class="st-extra">Spaces: 4</span><span class="st-extra">UTF-8</span><span>Python 3.12</span>
        </div>
      </div>
      <div class="problems" hidden></div>`;
    const q = s => this.root.querySelector(s);
    this.el = {
      ide: q(".ide"), editor: q(".ide-editor"), console: q(".console"), problems: q(".problems"),
      dbgControls: q(".dbg-controls"), dbgExplain: q(".dbg-explain"), varsState: q(".vars-state"),
      vars: q(".vars tbody"), slider: q(".dbg-slider"), stText: q(".st-text"), stPos: q(".st-pos"), tabDot: q(".tab-dot"),
      run: q('[data-act="run"]'), debugBtn: q('[data-act="debug"]'), stop: q('[data-act="stop"]'), check: q('[data-act="check"]'),
    };

    this.cm = CodeMirror(this.el.editor, {
      value: this.opts.code,
      mode: "python",
      theme: "dark-ide",
      lineNumbers: true,
      lineWrapping: true,
      indentUnit: 4,
      tabSize: 4,
      indentWithTabs: false,
      matchBrackets: true,
      autoCloseBrackets: true,
      styleActiveLine: true,
      gutters: ["breakpoints", "CodeMirror-linenumbers", "problems-gutter"],
      extraKeys: {
        "Ctrl-Enter": () => this.run(false),
        "Cmd-Enter": () => this.run(false),
        "F5": () => this.run(true),
        "F10": () => this.stepBy(1),
        "Shift-F10": () => this.stepBy(-1),
        "Ctrl-/": "toggleComment",
        "Tab": cm => cm.somethingSelected() ? cm.indentSelection("add") : cm.replaceSelection("    ", "end"),
        "Shift-Tab": cm => cm.indentSelection("subtract"),
      },
    });
    this.applyFont();
    this.cm.on("change", () => {
      this.opts.onChange(this.cm.getValue());
      this.el.tabDot.hidden = this.cm.getValue() === this.opts.starter;
      if (this.steps) this.exitDebug();
      this.clearMarks();
    });
    this.cm.on("cursorActivity", () => {
      const c = this.cm.getCursor();
      this.el.stPos.textContent = `Ln ${c.line + 1}, Col ${c.ch + 1}`;
    });
    this.cm.on("gutterClick", (cm, line, gutter) => {
      if (gutter !== "problems-gutter") this.toggleBreakpoint(line);
    });
    this.el.tabDot.hidden = this.cm.getValue() === this.opts.starter;

    this.root.addEventListener("click", e => {
      const b = e.target.closest("[data-act]");
      if (!b || b.disabled || !this.root.contains(b)) return;
      const act = b.dataset.act;
      if (act === "run") this.run(false);
      else if (act === "debug") this.run(true);
      else if (act === "stop") this.stop();
      else if (act === "check" && this.opts.onCheck) this.opts.onCheck(this.cm.getValue());
      else if (act === "reset") this.resetCode();
      else if (act === "clear") { this.segments = []; this.renderConsole(); }
      else if (act === "font+") this.changeFont(1);
      else if (act === "font-") this.changeFont(-1);
      else if (act === "first") this.goTo(0);
      else if (act === "back") this.stepBy(-1);
      else if (act === "next") this.stepBy(1);
      else if (act === "cont") this.continueToBreakpoint();
      else if (act === "exit") this.exitDebug();
    });
    this.el.slider.addEventListener("input", () => this.goTo(+this.el.slider.value));
    this.el.console.addEventListener("click", () => {
      const inp = this.el.console.querySelector("input");
      if (inp) inp.focus();
    });
    this.renderConsole();
    this.showVars(null);
    setTimeout(() => this.cm.refresh(), 0);
  }

  // ------------------------------------------------------------ editor helpers
  getCode() { return this.cm.getValue(); }
  setCode(code) { this.cm.setValue(code); }
  refresh() { this.cm.refresh(); }

  resetCode() {
    if (this.cm.getValue() !== this.opts.starter && !confirm("Put the starting code back? Your changes will be lost.")) return;
    this.cm.setValue(this.opts.starter);
  }

  applyFont() {
    let size = 15;
    try { size = +localStorage.getItem(FONT_KEY) || 15; } catch (e) {}
    this.root.style.setProperty("--code-size", size + "px");
    if (this.cm) this.cm.refresh();
  }

  changeFont(d) {
    let size = parseInt(getComputedStyle(this.root).getPropertyValue("--code-size")) || 15;
    size = Math.max(11, Math.min(26, size + d));
    try { localStorage.setItem(FONT_KEY, size); } catch (e) {}
    this.applyFont();
  }

  toggleBreakpoint(line) {
    const info = this.cm.lineInfo(line);
    if (info.gutterMarkers && info.gutterMarkers.breakpoints) {
      this.cm.setGutterMarker(line, "breakpoints", null);
    } else {
      const m = document.createElement("div");
      m.className = "bp-marker";
      m.title = "Breakpoint: Continue stops here when debugging";
      this.cm.setGutterMarker(line, "breakpoints", m);
    }
  }

  breakpointLines() {
    const set = new Set();
    this.cm.eachLine(h => {
      const info = this.cm.lineInfo(h);
      if (info.gutterMarkers && info.gutterMarkers.breakpoints) set.add(info.line + 1);
    });
    return set;
  }

  clearMarks() {
    this.marks.forEach(([h, where, cls]) => this.cm.removeLineClass(h, where, cls));
    this.marks = [];
    this.cm.clearGutter("problems-gutter");
  }

  markLine(line, cls, gutterText, title) {
    if (!line || line < 1 || line > this.cm.lineCount()) return;
    const h = this.cm.addLineClass(line - 1, "background", cls);
    this.marks.push([h, "background", cls]);
    if (gutterText) {
      const g = document.createElement("div");
      g.className = "problem-marker " + cls;
      g.textContent = gutterText;
      g.title = title || "";
      this.cm.setGutterMarker(line - 1, "problems-gutter", g);
    }
  }

  setStatus(text, state) {
    this.el.stText.textContent = text;
    this.el.ide.dataset.state = state || "ready";
  }

  // ------------------------------------------------------------ terminal
  emit(text, kind) {
    const last = this.segments[this.segments.length - 1];
    if (last && last.kind === kind) last.text += text;
    else this.segments.push({ text, kind });
    this.renderConsole();
  }

  renderConsole(limit = Infinity) {
    const c = this.el.console;
    let used = 0;
    let html = "";
    for (const s of this.segments) {
      if (used >= limit) break;
      const t = s.text.slice(0, Math.max(0, limit - used));
      used += t.length;
      html += `<span class="c-${s.kind}">${esc(t)}</span>`;
    }
    if (!this.segments.length) html = `<span class="c-muted">Press ▶ Run (or Ctrl+Enter) to run ${esc(this.opts.filename)}. Its output appears here.</span>`;
    c.innerHTML = html;
    c.scrollTop = c.scrollHeight;
  }

  ask(prompt) {
    this.setStatus("Waiting for input: type in the terminal and press Enter", "input");
    return new Promise(resolve => {
      const box = document.createElement("input");
      box.className = "c-input-box";
      box.type = "text";
      box.autocomplete = "off";
      box.spellcheck = false;
      box.setAttribute("aria-label", prompt || "Type your answer");
      this.el.console.appendChild(box);
      box.focus();
      this.el.console.scrollTop = this.el.console.scrollHeight;
      this.pendingInput = v => { this.pendingInput = null; box.remove(); this.setStatus("Running...", "running"); resolve(v); };
      box.addEventListener("keydown", e => {
        if (e.key === "Enter") { e.preventDefault(); this.pendingInput && this.pendingInput(box.value); }
      });
    });
  }

  // ------------------------------------------------------------ running
  setRunning(on) {
    this.running = on;
    this.el.run.disabled = on || !!this.runLocked;
    this.el.debugBtn.disabled = on || !!this.runLocked;
    if (this.el.check) this.el.check.disabled = on;
    this.el.stop.disabled = !on;
    if (on) this.setStatus("Running...", "running");
  }

  stop() {
    Engine.stop();
    if (this.pendingInput) this.pendingInput(null);
  }

  async run(debug) {
    if (this.running || Engine.busy || this.runLocked) return;
    this.exitDebug();
    this.clearMarks();
    this.segments = [];
    const cmd = `${debug ? "python -m pdb" : "python"} ${this.opts.filename}\n`;
    this.emit("> ", "cmd-prompt");
    this.emit(cmd, "cmd");
    this.prefixLen = 2 + cmd.length;
    this.setRunning(true);
    if (!Engine.ready) this.setStatus("Loading Python...", "running");
    this.showVars(null, "running...");
    const code = this.cm.getValue();
    let res;
    try {
      res = await Engine.run(code, { record: debug, inputs: this.presetInputs || null, emit: (t, k) => this.emit(t, k), ask: p => this.ask(p) });
    } catch (e) {
      this.setRunning(false);
      this.emit("Could not run: " + e.message + "\n", "err");
      this.setStatus("Error", "error");
      return;
    }
    this.setRunning(false);
    this.lastResult = res;
    const cls = this.showResult(res, code, true);
    this.showVars(res.finalVars, res.error ? "when it crashed" : "at the end");
    if (debug && res.steps.length) this.enterDebug(res.steps, cls);
    this.opts.onRun(res, code);
    return res;
  }

  // Show the error and warnings from a run. Returns the classified error, if any.
  showResult(res, code, logIt, toConsole = true) {
    const say = (t, k) => { if (toConsole) this.emit(t, k); };
    const lines = code.split("\n");
    const items = [];
    let cls = null;
    if (res.error) {
      cls = classifyError(res.error, res.warnings);
      const e = res.error;
      if (cls.key) {
        this.markLine(e.line, "err-line", "✖", e.type + ": " + e.msg);
        const last = this.segments.length ? this.segments[this.segments.length - 1].text : "";
        say((last && !last.endsWith("\n") ? "\n" : "") + (e.tb || `${e.type}: ${e.msg}`) + "\n", "err");
        items.push(`<div class="problem problem-error"><div class="problem-head">✖ ${esc(e.type)} ${e.line ? "on line " + e.line : ""}: what does it mean?</div>
          ${e.text ? `<pre class="problem-code">${esc(e.text)}</pre>` : ""}
          <div class="problem-body">${cls.friendly}</div></div>`);
        if (logIt) this.opts.onMistake(cls.key, e.type + ": " + e.msg, e.text || "");
        this.setStatus(`${e.type} on line ${e.line || "?"}`, "error");
      } else {
        say("\n^C Program stopped\n", "muted");
        this.setStatus("Stopped", "ready");
      }
    } else {
      this.setStatus("Finished", "ready");
    }
    const last = this.segments.length ? this.segments[this.segments.length - 1].text : "";
    say((last && !last.endsWith("\n") ? "\n" : "") + "> ", "cmd-prompt");
    for (const w of res.warnings) {
      const info = WARNINGS[w.code];
      if (!info || !info.log) continue;
      const logged = info.log;
      this.markLine(w.line, logged ? "warn-line" : "tip-line", logged ? "⚠" : "💡", info.text(w));
      items.push(`<div class="problem ${logged ? "problem-warn" : "problem-tip"}"><div class="problem-head">${logged ? "⚠ Warning" : "💡 Tip"}</div>
        <div class="problem-body">${esc(info.text(w))}</div></div>`);
      if (logIt && logged) this.opts.onMistake(info.key, info.text(w), lines[w.line - 1] || "");
    }
    this.el.problems.hidden = !items.length;
    this.el.problems.innerHTML = items.length ? `<div class="problems-title">Problems (${items.length})</div>` + items.join("") : "";
    return cls;
  }

  // The variables table, with the OCR data type name for each variable.
  showVars(vars, state = "", prevVars = null) {
    this.el.varsState.textContent = state;
    if (!vars) {
      this.el.vars.innerHTML = `<tr><td colspan="3" class="c-muted">${state === "running..." ? "Running..." : "Press ▶ Run to see your variables."}</td></tr>`;
      return;
    }
    this.el.vars.innerHTML = varRows(vars, prevVars) || `<tr><td colspan="3" class="c-muted">No variables yet.</td></tr>`;
  }

  // Start fresh: new code, empty terminal, no old variables.
  load(code, starter) {
    if (starter !== undefined) this.opts.starter = starter;
    this.exitDebug();
    this.lastResult = null;
    this.cm.setValue(code);
    this.segments = [];
    this.renderConsole();
    this.showVars(null);
    this.el.problems.hidden = true;
    this.setStatus("Ready", "ready");
  }

  // Used by Predict tasks: no running until a prediction is made.
  lockRun(locked, why = "") {
    this.runLocked = locked;
    [this.el.run, this.el.debugBtn].forEach(b => { b.disabled = locked || this.running; b.title = locked ? why : ""; });
    this.el.ide.classList.toggle("run-ready", !locked && !!why);
  }

  setReadOnly(on) {
    this.cm.setOption("readOnly", on);
    this.el.ide.classList.toggle("read-only", on);
  }

  // ------------------------------------------------------------ debugger
  enterDebug(steps, cls) {
    this.steps = steps;
    this.errorInfo = cls;
    this.el.dbgControls.hidden = false;
    this.el.dbgExplain.hidden = false;
    this.el.slider.hidden = false;
    this.el.slider.max = steps.length - 1;
    this.el.ide.classList.add("is-debugging");
    this.goTo(0);
  }

  exitDebug() {
    if (!this.steps) return;
    this.steps = null;
    this.el.dbgControls.hidden = true;
    this.el.dbgExplain.hidden = true;
    this.el.slider.hidden = true;
    this.el.ide.classList.remove("is-debugging");
    if (this.dbgMark) { this.cm.removeLineClass(this.dbgMark, "background", "dbg-line"); this.dbgMark = null; }
    this.renderConsole();
    if (this.lastResult) this.showVars(this.lastResult.finalVars, this.lastResult.error ? "when it crashed" : "at the end");
    this.setStatus("Finished", "ready");
  }

  stepBy(d) {
    if (!this.steps) return;
    this.goTo(Math.max(0, Math.min(this.steps.length - 1, this.pos + d)));
  }

  continueToBreakpoint() {
    if (!this.steps) return;
    const bps = this.breakpointLines();
    for (let i = this.pos + 1; i < this.steps.length; i++) {
      if (bps.has(this.steps[i].line) && this.steps[i].event === "line") return this.goTo(i);
    }
    this.goTo(this.steps.length - 1);
  }

  goTo(i) {
    const steps = this.steps;
    if (!steps) return;
    this.pos = i;
    const s = steps[i];
    const prev = i > 0 ? steps[i - 1] : null;
    this.el.slider.value = i;
    if (this.dbgMark) { this.cm.removeLineClass(this.dbgMark, "background", "dbg-line"); this.dbgMark = null; }
    if (s.line && s.event === "line") {
      this.dbgMark = this.cm.addLineClass(s.line - 1, "background", "dbg-line");
      this.cm.scrollIntoView({ line: s.line - 1, ch: 0 }, 60);
    }
    let explain;
    if (s.event === "end") explain = `<b>Finished.</b> These are the final values.`;
    else if (s.event === "error") explain = `<b class="err-text">Crashed on line ${s.line}.</b> ${this.errorInfo && this.errorInfo.key ? esc(MISTAKES[this.errorInfo.key].title) : ""}`;
    else explain = `<span class="dbg-swatch"></span> Line <b>${s.line}</b> is about to run${s.func !== "<module>" ? ` (in <code>${esc(s.func)}()</code>)` : ""}.`;
    this.el.dbgExplain.innerHTML = explain;
    this.setStatus(`Debugging: step ${i + 1} of ${steps.length}`, "debug");

    const withScope = (list, scope) => (list || []).map(v => Object.assign([...v], { scope }));
    const cur = [...withScope(s.locals, "local"), ...withScope(s.globals, "")];
    const old = prev ? [...(prev.locals || []), ...(prev.globals || [])] : null;
    this.showVars(cur, `step ${i + 1}/${steps.length}`, old);
    this.renderConsole(s.event === "line" ? this.prefixLen + s.consoleLen : Infinity);
  }
}
