// Everything is saved in this browser's localStorage, so nothing leaves the
// computer. Students can download a backup file to move to another computer.

const STORE_KEY = "pypractice.v1";

const Store = {
  data: null,

  blank() {
    return { version: 3, student: { name: "", group: "" }, mode: "standard", tab: "lesson", lessonPos: 0, tasks: {}, mistakes: [], sandbox: "", endless: { done: 0, streak: 0, best: 0, slips: 0 }, created: Date.now() };
  },

  load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      this.data = raw ? Object.assign(this.blank(), JSON.parse(raw)) : this.blank();
      if (this.data.version < 3) this.data = Object.assign(this.blank(), { student: this.data.student, mode: this.data.mode });
    } catch (e) {
      this.data = this.blank();
    }
    return this.data;
  },

  save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn("Could not save", e);
    }
  },

  task(id) {
    if (!this.data.tasks[id]) this.data.tasks[id] = { code: null, solved: false, attempts: 0, hints: 0, answers: {} };
    return this.data.tasks[id];
  },

  // Log a mistake. Identical mistakes (same place, same code line) within
  // five minutes count once, so running the same broken code again doesn't
  // inflate the report.
  logMistake(key, where, detail = "", line = "") {
    if (!key || !MISTAKES[key]) return false;
    const sig = [key, where, detail, line].join("|");
    const now = Date.now();
    const dup = this.data.mistakes.some(m => m.sig === sig && now - m.t < 5 * 60 * 1000);
    if (dup) return false;
    this.data.mistakes.push({ t: now, key, where, detail: String(detail).slice(0, 200), line: String(line).slice(0, 200), sig });
    if (this.data.mistakes.length > 2000) this.data.mistakes.splice(0, this.data.mistakes.length - 2000);
    this.save();
    return true;
  },

  reset() {
    this.data = this.blank();
    this.save();
  },
};
