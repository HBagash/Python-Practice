// Loads Pyodide and runs student programs one at a time.

const PYODIDE_URL = "https://cdn.jsdelivr.net/pyodide/v0.27.7/full/";

const Engine = {
  ready: false,
  busy: false,
  _mod: null,
  _loading: null,
  _listeners: [],

  onStatus(fn) { this._listeners.push(fn); },
  _status(state, text) { this._listeners.forEach(fn => fn(state, text)); },

  load() {
    if (this._loading) return this._loading;
    this._status("loading", "Loading Python...");
    this._loading = (async () => {
      try {
        const py = await loadPyodide({ indexURL: PYODIDE_URL });
        const mod = py.runPython("import types\ntypes.ModuleType('ide')");
        py.runPython(window.PY_HARNESS, { globals: mod.__dict__ });
        this.py = py;
        this._mod = mod;
        this.ready = true;
        this._status("ready", "Python ready");
      } catch (e) {
        console.error(e);
        this._status("error", "Python failed to load - check your internet connection and refresh");
        this._loading = null;
        throw e;
      }
    })();
    return this._loading;
  },

  // opts: { inputs: array|null, record: bool, emit(text, kind), ask(prompt) -> Promise<string|null> }
  async run(code, opts = {}) {
    await this.load();
    if (this.busy) throw new Error("busy");
    this.busy = true;
    const py = this.py;
    const emit = opts.emit || (() => {});
    const ask = opts.ask || (async () => null);
    let pyInputs = null;
    try {
      if (opts.inputs) pyInputs = py.toPy(opts.inputs);
      const res = await this._mod.run.callKwargs(code, emit, ask, { inputs: pyInputs, record: !!opts.record });
      const js = res.toJs({ dict_converter: Object.fromEntries });
      res.destroy();
      js.warnings = js.warnings || [];
      js.steps = js.steps || [];
      js.finalVars = js.finalVars || [];
      return js;
    } finally {
      if (pyInputs) pyInputs.destroy();
      this.busy = false;
    }
  },

  stop() {
    if (this._mod) this._mod.stop_current();
  },
};
