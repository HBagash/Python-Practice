// Endless mode: random PRIMM tasks on data types and casting.
// Each generator returns a task in the same shape as a LESSON task.

const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const dec = () => pick(["1.5", "2.25", "0.5", "3.75", "2.5", "4.5", "1.25"]);
const money = () => pick(["2.50", "1.25", "0.75", "3.50", "4.25", "1.50"]);
const INT = '<span class="vb-chip t-int">Integer</span>';
const REAL = '<span class="vb-chip t-float">Real</span>';
const STR = '<span class="vb-chip t-str">String</span>';
const BOOL = '<span class="vb-chip t-bool">Boolean</span>';

const GEN = {
  // ---- predict the data type of a value
  predictType() {
    const [name, value, why, mistake] = pick([
      ["score", String(rnd(2, 99)), "A whole number is an <b>Integer</b>.", "datatype_real_int"],
      ["height", dec(), "A decimal point makes it a <b>Real</b>.", "datatype_real_int"],
      ["price", rnd(2, 9) + ".0", ".0 still makes it a <b>Real</b>.", "datatype_real_int"],
      ["age", `"${rnd(11, 16)}"`, "Quotes make it a <b>String</b>.", "datatype_quotes"],
      ["grade", `"${pick(["A", "B", "C", "D"])}"`, "One letter in quotes is a <b>Character</b>.", "datatype_choice"],
      ["town", `"${pick(["Leeds", "Hull", "York", "Derby"])}"`, "Text in quotes is a <b>String</b>.", "datatype_quotes"],
      ["is_open", pick(["True", "False"]), "True/False is a <b>Boolean</b>.", "datatype_bool"],
      ["answer", `"${pick(["True", "False"])}"`, "Quotes make it a <b>String</b>.", "datatype_bool"],
      ["phone", `"0${rnd(7000, 7999)}${rnd(100000, 999999)}"`, "Phone numbers are <b>Strings</b>.", "datatype_choice"],
      ["total", `${rnd(10, 50)} / ${pick([2, 4, 5])}`, "<code>/</code> always gives a <b>Real</b>.", "datatype_real_int"],
      ["whole", `int(${dec()})`, "<code>int()</code> makes an <b>Integer</b>.", "int_on_decimal"],
      ["words", `str(${rnd(10, 99)})`, "<code>str()</code> makes a <b>String</b>.", "missing_str_cast"],
      ["flag", `bool(${rnd(0, 1)})`, "<code>bool()</code> makes a <b>Boolean</b>.", "datatype_bool"],
      ["amount", `float(${rnd(2, 9)})`, "<code>float()</code> makes a <b>Real</b>.", "datatype_real_int"],
    ]);
    return { stage: "predictType", code: `${name} = ${value}`, why, mistake };
  },

  // ---- predict the output
  predict(level) {
    const a = rnd(2, 9), b = rnd(2, 9);
    const easy = [
      () => ({ code: `print(${a} + ${b})`, why: "Integers are <b>added</b>.", mistake: "datatype_quotes" }),
      () => ({ code: `print("${a}" + "${b}")`, why: "Strings are <b>joined</b>.", mistake: "concat_not_add" }),
      () => ({ code: `print(int("${a}") + ${b})`, why: "<code>int()</code> makes an Integer, so it's added.", mistake: "casting_predict" }),
      () => ({ code: `print(float(${a}))`, why: "<code>float()</code> adds <b>.0</b>.", mistake: "datatype_real_int" }),
      () => ({ code: `print(str(${a}) + str(${b}))`, why: "Two Strings are <b>joined</b>.", mistake: "concat_not_add" }),
      () => ({ code: `print(bool(${pick([0, 1])}))`, why: "1 → True, 0 → False.", mistake: "datatype_bool" }),
    ];
    const harder = [
      () => ({ code: `print(int(${a}.${b}))`, why: "<code>int()</code> <b>chops</b>, it doesn't round.", mistake: "int_on_decimal" }),
      () => ({ code: `print(int("${dec()}"))`, why: "<code>int()</code> can't read decimals. Crash!", mistake: "int_on_decimal" }),
      () => ({ code: `print("Total: " + ${a})`, why: "Can't join a String and an Integer. Crash!", mistake: "missing_str_cast" }),
      () => ({ code: `print("${a}" * ${b > 4 ? 3 : b})`, why: "A String × number <b>repeats</b> it.", mistake: "string_repeat" }),
      () => ({ code: `number = input("Number: ")\nprint(number * 2)`, inputs: [String(a + 10)], why: "input() gives a String, so × 2 repeats it.", mistake: "string_repeat" }),
      () => ({ code: `first = input("Number: ")\nsecond = input("Number: ")\nprint(first + second)`, inputs: [String(a + 10), String(b + 20)], why: "Two Strings from input() are <b>joined</b>.", mistake: "concat_not_add" }),
      () => ({ code: `x = "${a}"\nint(x)\nprint(x * 2)`, why: "The cast wasn't <b>stored</b>.", mistake: "cast_not_stored" }),
      () => ({ code: `print(float("${dec()}") + 1)`, why: "<code>float()</code> reads decimals.", mistake: "datatype_real_int" }),
      () => ({ code: `print(bool("${pick(["", "hi", "False", "0"])}"))`, why: "Empty String → False. Anything else → True.", mistake: "datatype_bool" }),
    ];
    const pool = level === "easy" ? easy : level === "hard" ? harder : easy.concat(harder);
    return Object.assign({ stage: "predict" }, pick(pool)());
  },

  // ---- which cast?
  question() {
    const [q, ans, mistake] = pick([
      ["Number of goals scored", "int", "missing_num_cast"],
      ["Price of a drink, e.g. 1.20", "float", "int_on_decimal"],
      ["Height in metres", "float", "int_on_decimal"],
      ["Number of people in a class", "int", "missing_num_cast"],
      ["Temperature, e.g. 21.5", "float", "int_on_decimal"],
      ["A number you want to join to text with +", "str", "missing_str_cast"],
      ["Age in years", "int", "missing_num_cast"],
      ["Weight in kg, e.g. 2.3", "float", "int_on_decimal"],
      ["1 or 0 turned into True or False", "bool", "datatype_bool"],
    ]);
    return { stage: "question", task: `Which cast would you use?<div class="big-q">${q}</div>`, accept: [ans, ans + "()"], answer: ans + "()", mistake, code: "" };
  },

  // ---- make / modify programs from templates
  program(level, stage) {
    const pool = level === "hard" ? TEMPLATES.hard : level === "easy" ? TEMPLATES.easy : TEMPLATES.easy.concat(TEMPLATES.hard);
    const t = pick(pool)();
    t.stage = stage;
    if (stage === "modify") {
      t.code = t.buggy;
      t.steps = t.fixSteps;
      t.title = "Fix the bug";
    } else {
      t.code = t.starter || "";
      if (level === "easy") t.code += t.steps.map((s, i) => `# ${i + 1}. ${s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()}\n\n`).join("");
    }
    return t;
  },
};

// Program templates. Each gives bullet-point steps, a model solution (which
// sets the exact expected output), the variables to check, and a buggy
// version for Modify tasks.
const TEMPLATES = {
  easy: [
    () => {
      const [x, y, z] = pick([["home", "away", "goals"], ["cats", "dogs", "pets"], ["boys", "girls", "pupils"], ["red", "blue", "cars"]]);
      const X = x[0].toUpperCase() + x.slice(1), Y = y[0].toUpperCase() + y.slice(1);
      return {
        title: `Total ${z}`,
        steps: [`Ask <code>"${X}: "</code>. Store it in <code>${x}</code> as an ${INT}`, `Ask <code>"${Y}: "</code>. Store it in <code>${y}</code> as an ${INT}`, `Print <b>Total ${z}:</b> and the total`],
        solution: `${x} = int(input("${X}: "))\n${y} = int(input("${Y}: "))\nprint("Total ${z}:", ${x} + ${y})`,
        buggy: `${x} = input("${X}: ")\n${y} = input("${Y}: ")\nprint("Total ${z}:", ${x} + ${y})\n`,
        fixSteps: [`It joins the numbers instead of adding`, `Make <code>${x}</code> and <code>${y}</code> ${INT}s`],
        vars: { [x]: "Integer", [y]: "Integer" },
        tests: [{ inputs: [String(rnd(2, 9)), String(rnd(2, 9))] }, { inputs: [String(rnd(10, 40)), String(rnd(10, 40))] }],
        example: "ex-add",
      };
    },
    () => {
      const [what, prompt, times, unit] = pick([["kg", "Weight in kg: ", 1000, "grams"], ["litres", "Litres: ", 1000, "ml"], ["metres", "Metres: ", 100, "cm"]]);
      return {
        title: `${what} to ${unit}`,
        steps: [`Ask <code>"${prompt}"</code>. Store it in <code>amount</code> as a ${REAL}`, `Print <b>That is</b>, amount × ${times}, <b>${unit}</b>`],
        solution: `amount = float(input("${prompt}"))\nprint("That is", amount * ${times}, "${unit}")`,
        buggy: `amount = int(input("${prompt}"))\nprint("That is", amount * ${times}, "${unit}")\n`,
        fixSteps: ["It crashes on decimals like 1.5", `Make <code>amount</code> a ${REAL}`],
        vars: { amount: "Real" },
        tests: [{ inputs: [dec()] }, { inputs: [dec()] }],
        example: "ex-float",
      };
    },
    () => {
      const n = rnd(2, 5);
      return {
        title: "Future age",
        steps: [`Ask <code>"Age: "</code>. Store it in <code>age</code> as an ${INT}`, `Print <b>In ${n} years you will be</b> and age + ${n}`, "Join with <code>+</code> and <code>str()</code>"],
        solution: `age = int(input("Age: "))\nprint("In ${n} years you will be " + str(age + ${n}))`,
        buggy: `age = int(input("Age: "))\nprint("In ${n} years you will be " + (age + ${n}))\n`,
        fixSteps: ["It crashes", "Keep the <code>+</code>. Use <code>str()</code>"],
        vars: { age: "Integer" },
        mustUse: [[/str\s*\(/, "Join with + and str().", "missing_str_cast"]],
        tests: [{ inputs: [String(rnd(11, 16))] }, { inputs: [String(rnd(8, 12))] }],
        example: "ex-str",
      };
    },
    () => {
      const k = pick([2, 3, 10]);
      return {
        title: "Store the cast",
        starter: 'number = input("Number: ")\n',
        steps: ["Keep line 1", `Cast <code>number</code> to an ${INT} and <b>store it back</b> in <code>number</code>`, `Print number × ${k}`],
        solution: `number = input("Number: ")\nnumber = int(number)\nprint(number * ${k})`,
        buggy: `number = input("Number: ")\nint(number)\nprint(number * ${k})\n`,
        fixSteps: ["The cast does nothing", "Store it: <code>number = int(number)</code>"],
        vars: { number: "Integer" },
        tests: [{ inputs: [String(rnd(10, 30))] }, { inputs: [String(rnd(31, 60))] }],
        example: "ex-store",
      };
    },
  ],
  hard: [
    () => ({
      title: "Price × amount",
      steps: [`Ask <code>"Price: "</code>. Store it in <code>price</code> as a ${REAL}`, `Ask <code>"How many? "</code>. Store it in <code>amount</code> as an ${INT}`, "Make <code>total</code> = price × amount", "Print <b>Total: £</b> and the total, using <code>+</code> and <code>str()</code>"],
      solution: 'price = float(input("Price: "))\namount = int(input("How many? "))\ntotal = price * amount\nprint("Total: £" + str(total))',
      buggy: 'price = int(input("Price: "))\namount = input("How many? ")\ntotal = price * amount\nprint("Total: £" + str(total))\n',
      fixSteps: ["There are <b>2 bugs</b>", `<code>price</code> must be a ${REAL}, <code>amount</code> an ${INT}`],
      vars: { price: "Real", amount: "Integer", total: "Real" },
      mustUse: [[/str\s*\(/, "Join with + and str().", "missing_str_cast"]],
      tests: [{ inputs: [money(), String(rnd(2, 6))] }, { inputs: [money(), String(rnd(2, 6))] }],
      example: "ex-together",
    }),
    () => ({
      title: "Split the bill",
      steps: [`Ask <code>"Bill: £"</code>. Store it in <code>bill</code> as a ${REAL}`, `Ask <code>"People: "</code>. Store it in <code>people</code> as an ${INT}`, "Print <b>Each pays £</b> and bill ÷ people, using <code>+</code> and <code>str()</code>"],
      solution: 'bill = float(input("Bill: £"))\npeople = int(input("People: "))\nprint("Each pays £" + str(bill / people))',
      buggy: 'bill = float(input("Bill: £"))\npeople = input("People: ")\nprint("Each pays £" + bill / people)\n',
      fixSteps: ["There are <b>2 bugs</b>", `<code>people</code> must be an ${INT}`, "Use <code>str()</code> to join"],
      vars: { bill: "Real", people: "Integer" },
      mustUse: [[/str\s*\(/, "Join with + and str().", "missing_str_cast"]],
      tests: [{ inputs: [String(rnd(2, 9) * 4), "4"] }, { inputs: [String(rnd(2, 9) * 2), "2"] }],
      example: "ex-together",
    }),
    () => ({
      title: "Family tickets",
      starter: "ADULT = 8.50\nCHILD = 4.25\n",
      steps: ["Keep lines 1 and 2", `Ask <code>"Adults: "</code> and <code>"Children: "</code>. Store as ${INT}s in <code>adults</code> and <code>children</code>`, "Print <b>Total:</b> and adults × ADULT + children × CHILD"],
      solution: 'ADULT = 8.50\nCHILD = 4.25\nadults = int(input("Adults: "))\nchildren = int(input("Children: "))\nprint("Total:", adults * ADULT + children * CHILD)',
      buggy: 'ADULT = 8.50\nCHILD = 4.25\nadults = input("Adults: ")\nchildren = input("Children: ")\nprint("Total:", adults * ADULT + children * CHILD)\n',
      fixSteps: ["It crashes", `<code>adults</code> and <code>children</code> must be ${INT}s`],
      vars: { adults: "Integer", children: "Integer" },
      tests: [{ inputs: [String(rnd(1, 4)), String(rnd(1, 4))] }, { inputs: [String(rnd(1, 4)), String(rnd(0, 4))] }],
      example: "ex-together",
    }),
    () => ({
      title: "Age in months",
      steps: [`Ask <code>"Name: "</code>. Store it in <code>name</code> ${STR}`, `Ask <code>"Age: "</code>. Store it in <code>age</code> as an ${INT}`, "Print e.g. <b>Sam is 168 months old</b>, using <code>+</code> and <code>str()</code>"],
      solution: 'name = input("Name: ")\nage = int(input("Age: "))\nprint(name + " is " + str(age * 12) + " months old")',
      buggy: 'name = input("Name: ")\nage = input("Age: ")\nprint(name + " is " + age * 12 + " months old")\n',
      fixSteps: ["There are <b>2 bugs</b>", `<code>age</code> must be an ${INT}`, "Use <code>str()</code> to join"],
      vars: { name: "String", age: "Integer" },
      mustUse: [[/str\s*\(/, "Join with + and str().", "missing_str_cast"]],
      tests: [{ inputs: [pick(["Sam", "Ava", "Leo"]), String(rnd(11, 16))] }, { inputs: [pick(["Mia", "Kai", "Zara"]), String(rnd(11, 16))] }],
      example: "ex-together",
    }),
    () => ({
      title: "Yes or no",
      steps: [`Ask <code>"Member? 1 = yes, 0 = no: "</code>. Store it in <code>answer</code> as an ${INT}`, `Make <code>member</code> = <code>bool(answer)</code> ${BOOL}`, "Print <b>Member:</b> and member"],
      solution: 'answer = int(input("Member? 1 = yes, 0 = no: "))\nmember = bool(answer)\nprint("Member:", member)',
      buggy: 'answer = input("Member? 1 = yes, 0 = no: ")\nmember = bool(answer)\nprint("Member:", member)\n',
      fixSteps: ["Typing 0 prints <b>Member: True</b>. Why?", `<code>answer</code> must be an ${INT} first`],
      vars: { answer: "Integer", member: "Boolean" },
      tests: [{ inputs: ["1"] }, { inputs: ["0"] }],
      example: "ex-store",
    }),
  ],
};

let endlessCount = 0;

// Pick the next endless task for this difficulty.
function nextEndlessTask(level) {
  const mix = {
    easy: ["predictType", "predictType", "predict", "predict", "question", "make", "make", "modify"],
    standard: ["predictType", "predict", "predict", "question", "make", "make", "make", "modify", "modify"],
    hard: ["predictType", "predict", "predict", "make", "make", "make", "modify", "modify"],
  }[level];
  const kind = pick(mix);
  const task = kind === "make" || kind === "modify" ? GEN.program(level, kind) : GEN[kind](level);
  task.id = "endless-" + (++endlessCount) + "-" + Date.now();
  task.storeId = task.id;
  task.part = "Endless";
  task.endless = true;
  return task;
}
