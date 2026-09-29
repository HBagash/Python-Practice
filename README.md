# Casting Practice (OCR J277)

A practice site for GCSE students on **data types and casting**, and nothing else from later in the course:

- the 5 OCR data types: **Integer, Real, Character, String, Boolean**
- the 4 casts: **`int()`, `float()`, `str()`, `bool()`**

Code runs in real Python in the browser. A **Variables** table shows each variable's name, value and OCR data type, so students can see what is stored.

## How it works

Students enter their name and pick a difficulty. Everything happens on one coding screen, with a task panel beside a real IDE.

| Tab | What it is |
|---|---|
| 📘 **Lesson** | 30+ short tasks in order, following **PRIMM**. Each task unlocks the next. |
| ♾️ **Endless** | Random tasks, never the same twice, with a streak counter. |
| 🧪 **Free** | Free coding, with a few examples to load. |

PRIMM stages:

- **🔮 Predict:** type what the code will print, or its data type, then press Run to check.
- **🔍 Investigate:** run or debug a program and answer short typed questions.
- **🔧 Modify:** fix a program so it prints exactly the right output.
- **🛠️ Make:** write a program from numbered bullet-point steps. A sample run shows exactly what it should print.

Modify and Make tasks are checked by running the student's code with test inputs. The output must match the model answer line by line, and the named variables must have the right data types (e.g. `age` must be an Integer). Feedback shows the expected line next to what the student printed.

Lesson parts: Data types → `input()` and `int()` → `float()` → `str()` → Store the cast → `bool()` → Put it together.

**Difficulty** (can be changed at any time):

- 🟢 **Easy:** starter code with step comments, plus hints.
- 🟡 **Standard:** no hints.
- 🔴 **Hard:** harder versions of the tasks and extra Predict tasks.

Every Modify/Make task has a **📖 Worked example**: a similar program explained in 3 steps, run live with its Variables table.

**Help** is a set of topic tiles. Each opens one short card with an example, the output and a "watch out" note.

## Handing in

**My report → Export PDF**, then upload it to the Google Classroom assignment. The PDF includes:

- tasks done and predictions right
- endless streak and worked examples used
- the top 3 things to work on, with wrong and right code
- a mistake chart, every lesson task, and the mistake log

## Running it

The site is static files with no install. Students need internet access, because Python (Pyodide), the editor and the PDF maker load from cdn.jsdelivr.net and cdnjs.cloudflare.com.

- **Easiest:** turn on GitHub Pages (Settings → Pages → deploy from `main`) and share the link.
- **Or** open `index.html` directly, or run `python -m http.server` here.

**Teacher tip:** add `?unlock` to the address to open every lesson task.

Progress is saved in the browser on that computer (localStorage). **Save backup / Load backup** on the report page moves work between computers.

## Files

- `js/content.js`: lesson tasks, worked examples, help cards, modes
- `js/endless.js`: the random task generators
- `js/mistakes.js`: the mistake catalogue, and the rules that sort errors into it
- `js/harness.js`: Python side: runs code, records debugger steps, finds mistakes
- `js/engine.js`, `js/ide.js`, `js/store.js`, `js/app.js`: Python loader, IDE, storage, app
- `css/style.css`, `css/app.css`, `css/ide.css`: styles
