// Python code that runs inside Pyodide. It runs the student's program,
// records every step for the debugger, and describes errors and warnings
// in a structured way so the JavaScript side can turn them into feedback.
// Kept as a JS string so the site works when opened straight from a file.
window.PY_HARNESS = String.raw`
import sys, ast, difflib, keyword, builtins, traceback

MAX_STEPS = 200000
MAX_SNAPSHOTS = 4000
FILENAME = "<student>"

CAST_FUNCS = {"int", "float", "str", "bool"}
SHADOW_NAMES = {"print", "input", "int", "float", "str", "bool", "type", "len",
                "list", "sum", "max", "min", "round", "range", "dict", "abs", "pow"}
VAGUE_NAMES = {"var", "variable", "thing", "stuff", "something", "blah", "abc"}
LOOP_OK = {"i", "j", "k", "n", "x", "y", "_"}


class StopRun(Exception):
    pass


class TooManySteps(Exception):
    pass


class NoMoreInput(Exception):
    pass


def safe_repr(v):
    try:
        r = repr(v)
    except Exception:
        r = "<?>"
    if len(r) > 80:
        r = r[:77] + "..."
    return r


def type_name(v):
    t = type(v).__name__
    if t in ("function", "builtin_function_or_method"):
        return "function"
    return t


def snapshot_vars(d):
    out = []
    for k, v in list(d.items()):
        if k.startswith("__"):
            continue
        if type(v).__name__ == "module":
            continue
        out.append([k, safe_repr(v), type_name(v)])
    return out


# ---------------------------------------------------------------- analysis

def is_call_to(node, names):
    return (isinstance(node, ast.Call) and isinstance(node.func, ast.Name)
            and node.func.id in names)


def assignment_kind(value):
    # What kind of value is being stored? Used for simple type tracking.
    if is_call_to(value, {"input"}):
        return "input"
    if is_call_to(value, {"int", "float"}):
        return "number"
    if isinstance(value, ast.Constant) and isinstance(value.value, (int, float)) \
            and not isinstance(value.value, bool):
        return "number"
    if is_call_to(value, {"str"}):
        return "text"
    if isinstance(value, ast.Constant) and isinstance(value.value, str):
        return "text"
    return "other"


def analyse(tree):
    warns = []
    stores = {}      # name -> [(line, kind)]
    loads = {}       # name -> first line used
    loop_names = set()

    for node in ast.walk(tree):
        if isinstance(node, (ast.For, ast.comprehension)):
            for t in ast.walk(node.target):
                if isinstance(t, ast.Name):
                    loop_names.add(t.id)
        if isinstance(node, ast.Assign):
            kind = assignment_kind(node.value)
            for tgt in node.targets:
                if isinstance(tgt, ast.Name):
                    stores.setdefault(tgt.id, []).append((node.lineno, kind))
        elif isinstance(node, (ast.AugAssign, ast.AnnAssign)) and isinstance(node.target, ast.Name):
            stores.setdefault(node.target.id, []).append((node.lineno, "other"))
        elif isinstance(node, ast.Name) and isinstance(node.ctx, ast.Load):
            if node.id not in loads:
                loads[node.id] = node.lineno
        elif isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            stores.setdefault(node.name, []).append((node.lineno, "other"))
            for a in node.args.args:
                stores.setdefault(a.arg, []).append((node.lineno, "other"))

    def kind_at(name, line):
        best = None
        for (ln, kind) in stores.get(name, []):
            if ln < line and (best is None or ln >= best[0]):
                best = (ln, kind)
        return best[1] if best else None

    def uncast_input(node):
        return isinstance(node, ast.Name) and kind_at(node.id, node.lineno) == "input"

    def numberish(node):
        if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)) \
                and not isinstance(node.value, bool):
            return True
        if isinstance(node, ast.Name) and kind_at(node.id, node.lineno) in ("number", "float"):
            return True
        return False

    def whole(node):
        if isinstance(node, ast.Constant):
            return isinstance(node.value, int) and not isinstance(node.value, bool)
        return isinstance(node, ast.Name) and kind_at(node.id, node.lineno) == "number"

    for node in ast.walk(tree):
        # input("...") on its own line: the answer is thrown away
        if isinstance(node, ast.Expr) and is_call_to(node.value, {"input"}):
            warns.append({"code": "input_not_stored", "line": node.lineno, "name": ""})
        # int(x) on its own line: x does not change
        if isinstance(node, ast.Expr) and is_call_to(node.value, CAST_FUNCS):
            fn = node.value.func.id
            warns.append({"code": "cast_not_stored", "line": node.lineno, "name": fn})
        # comparing an uncast input with a number
        if isinstance(node, ast.Compare):
            items = [node.left] + list(node.comparators)
            for a, b in zip(items, items[1:]):
                if (uncast_input(a) and numberish(b)) or (uncast_input(b) and numberish(a)):
                    nm = a.id if uncast_input(a) else b.id
                    warns.append({"code": "compare_str_num", "line": node.lineno, "name": nm})
        if isinstance(node, ast.BinOp):
            l, r = node.left, node.right
            # "5" * 3 gives "555"
            if isinstance(node.op, ast.Mult) and (
                    (uncast_input(l) and whole(r)) or (uncast_input(r) and whole(l))):
                nm = l.id if uncast_input(l) else r.id
                warns.append({"code": "string_repeat", "line": node.lineno, "name": nm})
            # two inputs added together: joins them instead of adding
            if isinstance(node.op, ast.Add) and uncast_input(l) and uncast_input(r):
                warns.append({"code": "maybe_concat_inputs", "line": node.lineno,
                              "name": l.id + " + " + r.id})

    for name, lst in stores.items():
        line = min(ln for ln, _ in lst)
        if name in SHADOW_NAMES:
            warns.append({"code": "shadow_builtin", "line": line, "name": name})
        elif keyword.iskeyword(name):
            pass
        elif len(name) == 1 and name not in loop_names:
            warns.append({"code": "poor_name", "line": line, "name": name})
        elif name.rstrip("0123456789").lower() in VAGUE_NAMES:
            warns.append({"code": "poor_name", "line": line, "name": name})
        elif name[0].isupper() and not name.isupper():
            warns.append({"code": "capital_name", "line": line, "name": name})
        if name not in loads and name not in loop_names and not name.startswith("_") \
                and name not in SHADOW_NAMES:
            close = difflib.get_close_matches(name, list(loads.keys()), n=1, cutoff=0.7)
            warns.append({"code": "unused_variable", "line": line, "name": name,
                          "extra": close[0] if close else ""})

    warns.sort(key=lambda w: w["line"])
    return warns, sorted(stores.keys()), {k: min(l for l, _ in v) for k, v in stores.items()}


# ---------------------------------------------------------------- input rewrite

class InputRewriter(ast.NodeTransformer):
    # Turns input(...) at the top level into (await __ide_input__(...)) so the
    # page can wait for the student to type. Code inside functions is left
    # alone and falls back to a pop-up box.
    def visit_FunctionDef(self, node):
        return node

    visit_AsyncFunctionDef = visit_FunctionDef
    visit_Lambda = visit_FunctionDef
    visit_ClassDef = visit_FunctionDef
    visit_ListComp = visit_FunctionDef
    visit_SetComp = visit_FunctionDef
    visit_DictComp = visit_FunctionDef
    visit_GeneratorExp = visit_FunctionDef

    def visit_Call(self, node):
        self.generic_visit(node)
        if isinstance(node.func, ast.Name) and node.func.id == "input":
            new = ast.Await(ast.Call(func=ast.Name("__ide_input__", ast.Load()),
                                     args=node.args, keywords=node.keywords))
            return ast.copy_location(new, node)
        return node


# ---------------------------------------------------------------- session

class Session:
    def __init__(self, emit, ask, inputs, record):
        self.emit_js = emit          # emit(text, kind)
        self.ask_js = ask            # returns a promise of the typed text
        self.inputs = list(inputs) if inputs is not None else None
        self.record = record
        self.out = []                # what print() produced
        self.console_len = 0
        self.steps = []
        self.nsteps = 0
        self.stopped = False
        self.inputs_used = 0

    def emit(self, text, kind):
        if not text:
            return
        if kind == "out":
            self.out.append(text)
        self.console_len += len(text)
        self.emit_js(text, kind)

    def snap(self, frame, line, event):
        glob = frame.f_globals
        gvars = snapshot_vars(glob)
        lvars = None
        if frame.f_code.co_name != "<module>":
            lvars = snapshot_vars(frame.f_locals)
        return {"line": line, "func": frame.f_code.co_name, "globals": gvars,
                "locals": lvars, "consoleLen": self.console_len, "event": event}

    def tracer(self, frame, event, arg):
        if frame.f_code.co_filename != FILENAME:
            return None
        return self.local_tracer

    def local_tracer(self, frame, event, arg):
        if self.stopped:
            raise StopRun()
        if event == "line":
            self.nsteps += 1
            if self.nsteps > MAX_STEPS:
                raise TooManySteps()
            if self.record and len(self.steps) < MAX_SNAPSHOTS:
                self.steps.append(self.snap(frame, frame.f_lineno, "line"))
        return self.local_tracer

    async def ainput(self, prompt=""):
        prompt = str(prompt)
        self.emit(prompt, "prompt")
        if self.inputs is not None:
            if not self.inputs:
                raise NoMoreInput()
            val = str(self.inputs.pop(0))
        else:
            val = await self.ask_js(prompt)
            if val is None:
                raise StopRun()
            val = str(val)
        self.inputs_used += 1
        self.emit(val + "\n", "input")
        return val

    def sync_input(self, prompt=""):
        prompt = str(prompt)
        self.emit(prompt, "prompt")
        if self.inputs is not None:
            if not self.inputs:
                raise NoMoreInput()
            val = str(self.inputs.pop(0))
        else:
            import js
            val = js.prompt(prompt or "Type your answer")
            if val is None:
                raise StopRun()
            val = str(val)
        self.inputs_used += 1
        self.emit(val + "\n", "input")
        return val


class Writer:
    def __init__(self, session, kind):
        self.session = session
        self.kind = kind

    def write(self, t):
        self.session.emit(str(t), self.kind)
        return len(t)

    def flush(self):
        pass


CURRENT = None


def stop_current():
    if CURRENT is not None:
        CURRENT.stopped = True


def describe_error(e, session, src_lines, all_names, first_assigned, glob):
    info = {"type": type(e).__name__, "msg": str(e), "line": None, "text": "",
            "suggest": "", "assignedLater": False, "lineTypes": {}, "col": None}
    if isinstance(e, StopRun):
        info["type"] = "Stopped"
        info["msg"] = "The program was stopped."
        return info
    if isinstance(e, TooManySteps):
        info["type"] = "TooManySteps"
        info["msg"] = "Your program ran for too long, it may be stuck in a loop."
    if isinstance(e, NoMoreInput):
        info["type"] = "NoMoreInput"
        info["msg"] = "Your program asked for more input than this task gives it."
    if isinstance(e, SyntaxError):
        info["line"] = e.lineno
        info["col"] = e.offset
        info["msg"] = e.msg
        info["text"] = (e.text or "").rstrip("\n")
        tb_lines = ['  File "main.py", line %s' % e.lineno]
        if info["text"].strip():
            stripped = info["text"].lstrip()
            tb_lines.append("    " + stripped)
            if e.offset:
                col = max(0, e.offset - 1 - (len(info["text"]) - len(stripped)))
                tb_lines.append("    " + " " * col + "^")
        tb_lines.append("%s: %s" % (type(e).__name__, e.msg))
        info["tb"] = "\n".join(tb_lines)
        return info

    frame = None
    tb = e.__traceback__
    tb_lines = ["Traceback (most recent call last):"]
    while tb is not None:
        if tb.tb_frame.f_code.co_filename == FILENAME:
            frame = tb.tb_frame
            info["line"] = tb.tb_lineno
            tb_lines.append('  File "main.py", line %s, in %s' % (tb.tb_lineno, tb.tb_frame.f_code.co_name))
            if 0 < tb.tb_lineno <= len(src_lines):
                tb_lines.append("    " + src_lines[tb.tb_lineno - 1].strip())
        tb = tb.tb_next
    if info["line"] and 0 < info["line"] <= len(src_lines):
        info["text"] = src_lines[info["line"] - 1]

    if isinstance(e, NameError):
        name = getattr(e, "name", None)
        if not name:
            import re
            m = re.search(r"name '(\w+)' is not defined", str(e))
            name = m.group(1) if m else ""
        info["name"] = name
        known = [k for k in glob.keys() if not k.startswith("__")]
        known = sorted((set(known) | set(all_names)) - {name})
        lower = [k for k in known if k.lower() == name.lower() and k != name]
        if lower:
            info["suggest"] = lower[0]
            info["caseOnly"] = True
        else:
            close = difflib.get_close_matches(name, known, n=1, cutoff=0.6)
            if not close:
                close = difflib.get_close_matches(name, dir(builtins), n=1, cutoff=0.8)
            if close:
                info["suggest"] = close[0]
        if name in first_assigned and info["line"] and first_assigned[name] > info["line"]:
            info["assignedLater"] = True

    if isinstance(e, (StopRun, TooManySteps, NoMoreInput)):
        info["tb"] = info["msg"]
    else:
        last = "%s: %s" % (type(e).__name__, e)
        if isinstance(e, NameError) and info.get("suggest"):
            last += ". Did you mean: '%s'?" % info["suggest"]
        info["tb"] = "\n".join(tb_lines + [last])

    if frame is not None and info["text"]:
        import re
        names = set(re.findall(r"[A-Za-z_]\w*", info["text"]))
        scope = dict(frame.f_globals)
        scope.update(frame.f_locals)
        for n in names:
            if n in scope and not n.startswith("__"):
                v = scope[n]
                if type(v).__name__ in ("int", "float", "str", "bool"):
                    info["lineTypes"][n] = [type(v).__name__, safe_repr(v)]
    return info


def check_only(src):
    try:
        tree = ast.parse(src, FILENAME)
    except SyntaxError as e:
        return {"ok": False, "error": describe_error(e, None, src.split("\n"), [], {}, {}),
                "warnings": []}
    warns, _, _ = analyse(tree)
    return {"ok": True, "warnings": warns}


async def run(src, emit, ask, inputs=None, record=False):
    global CURRENT
    src_lines = src.split("\n")
    session = Session(emit, ask, None if inputs is None else list(inputs), record)
    CURRENT = session
    result = {"ok": True, "error": None, "warnings": [], "steps": [],
              "out": "", "inputsUsed": 0, "finalVars": []}
    try:
        tree = ast.parse(src, FILENAME)
    except SyntaxError as e:
        result["ok"] = False
        result["error"] = describe_error(e, session, src_lines, [], {}, {})
        CURRENT = None
        return result

    warns, all_names, first_assigned = analyse(tree)
    result["warnings"] = warns

    try:
        rewritten = InputRewriter().visit(tree)
        ast.fix_missing_locations(rewritten)
        code = compile(rewritten, FILENAME, "exec", flags=ast.PyCF_ALLOW_TOP_LEVEL_AWAIT)
    except SyntaxError:
        code = compile(src, FILENAME, "exec")

    glob = {"__name__": "__main__", "__builtins__": builtins,
            "__ide_input__": session.ainput}
    old_out, old_err, old_input = sys.stdout, sys.stderr, builtins.input
    sys.stdout = Writer(session, "out")
    sys.stderr = Writer(session, "err")
    builtins.input = session.sync_input
    sys.settrace(session.tracer)
    try:
        res = eval(code, glob)
        if res is not None and hasattr(res, "__await__"):
            await res
    except BaseException as e:
        result["ok"] = False
        result["error"] = describe_error(e, session, src_lines, all_names, first_assigned, glob)
    finally:
        sys.settrace(None)
        sys.stdout, sys.stderr, builtins.input = old_out, old_err, old_input
        CURRENT = None

    if record:
        end = {"line": None, "func": "<module>", "globals": snapshot_vars(glob),
               "locals": None, "consoleLen": session.console_len,
               "event": "error" if result["error"] else "end"}
        if result["error"]:
            end["line"] = result["error"]["line"]
        session.steps.append(end)
    result["steps"] = session.steps
    result["out"] = "".join(session.out)
    result["inputsUsed"] = session.inputs_used
    result["finalVars"] = snapshot_vars(glob)
    result["truncated"] = session.nsteps > MAX_SNAPSHOTS
    return result
`;
