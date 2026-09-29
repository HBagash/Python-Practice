// Lesson content: OCR J277 data types and casting only.
// int(), float(), str(), bool() and the 5 data types:
// integer, real, Boolean, character, string.
//
// Task stages follow PRIMM:
//   predict      type what it will print, then Run to check
//   predictType  type the data type, then Run and check the Variables table
//   investigate  run/debug a program and answer short typed questions
//   modify       change a program so it passes the tests
//   make         write a program that passes the tests
//
// Modes: easy uses task.easy (scaffold code) and shows hints. Hard swaps in
// task.hard, and includes tasks marked only: "hard".

const H = {
  norm: s => String(s).toLowerCase().replace(/[ \t]+/g, " ").replace(/ *\n */g, "\n").trim(),
  has: (out, s) => H.norm(out).includes(H.norm(s)),
  nums: out => (String(out).match(/-?\d+(?:\.\d+)?/g) || []).map(Number),
  hasNum: (out, n, tol = 0.001) => H.nums(out).some(x => Math.abs(x - n) <= tol),
  code: c => c.split("\n").map(l => l.replace(/#.*$/, "")).join("\n"),
  uses: (c, re) => re.test(H.code(c)),
  lines: out => String(out).split("\n").map(l => l.replace(/\s+$/, "")).filter(l => l !== ""),
};

// Is the right number in the output? If not, were the inputs joined?
function numberCheck(expected, joined, tol = 0.001) {
  return ({ out }) => {
    if (H.hasNum(out, expected, tol)) return null;
    if (joined && out.includes(joined)) return { mistake: "concat_not_add", msg: `It printed ${joined}. The inputs were joined, not added.` };
    return { mistake: "wrong_output", msg: `${expected} should be in the output.` };
  };
}
function textCheck(expected) {
  return ({ out }) => H.has(out, expected) ? null : { mistake: "wrong_output", msg: `It should print: ${expected}` };
}

// OCR names for the data types Python shows.
function ocrType(pyType, value) {
  if (pyType === "int") return "Integer";
  if (pyType === "float") return "Real";
  if (pyType === "bool") return "Boolean";
  if (pyType === "str") return /^(['"]).\1$/.test(value || "") ? "Character" : "String";
  return pyType;
}
const OCR_ALIASES = {
  integer: "Integer", int: "Integer",
  real: "Real", float: "Real",
  boolean: "Boolean", bool: "Boolean",
  character: "Character", char: "Character",
  string: "String", str: "String",
};

// ====================================================================== worked examples
const WORKED = {
  "ex-types": {
    title: "The 5 data types",
    code: 'score = 42\nprice = 1.99\ninitial = "S"\ntown = "Leeds"\nis_open = True\nprint(score, price, initial, town, is_open)',
    steps: ["Whole number → <b>Integer</b>", "Decimal point → <b>Real</b>", "One letter in quotes → <b>Character</b>", "Words in quotes → <b>String</b>", "True / False → <b>Boolean</b>"],
    output: "42 1.99 S Leeds True",
  },
  "ex-add": {
    title: "Adding two inputs",
    code: 'cats = int(input("Cats? "))\ndogs = int(input("Dogs? "))\nprint("Pets:", cats + dogs)',
    steps: ["<code>input()</code> gives a <b>String</b>", "<code>int()</code> makes it an <b>Integer</b>", "Now <code>+</code> adds instead of joining"],
    inputs: ["2", "3"],
    output: "Cats? 2\nDogs? 3\nPets: 5",
  },
  "ex-float": {
    title: "Decimals need float()",
    code: 'kg = float(input("Weight in kg: "))\nprint("Grams:", kg * 1000)',
    steps: ["Weights can have decimals", "So use <code>float()</code>, not <code>int()</code>", "<code>kg</code> is a <b>Real</b>"],
    inputs: ["1.5"],
    output: "Weight in kg: 1.5\nGrams: 1500.0",
  },
  "ex-str": {
    title: "Joining a number with +",
    code: 'goals = 3\nprint("Goals: " + str(goals))',
    steps: ["<code>goals</code> is an <b>Integer</b>", "<code>str()</code> makes it a <b>String</b>", "Now <code>+</code> can join them"],
    output: "Goals: 3",
  },
  "ex-store": {
    title: "Store the cast",
    code: 'number = input("Number: ")\nnumber = int(number)\nprint(number * 10)',
    steps: ["Line 1: <code>number</code> is a <b>String</b>", "Line 2: cast it <b>and</b> store it with <code>=</code>", "Line 3: <code>number</code> is an <b>Integer</b>"],
    inputs: ["4"],
    output: "Number: 4\n40",
  },
  "ex-together": {
    title: "Using all three casts",
    code: 'price = float(input("Price: "))\nhow_many = int(input("How many? "))\ntotal = price * how_many\nprint("Total: £" + str(total))',
    steps: ["Price has pence → <code>float()</code>", "Amount is whole → <code>int()</code>", "Joining with <code>+</code> → <code>str()</code>"],
    inputs: ["2.5", "3"],
    output: "Price: 2.5\nHow many? 3\nTotal: £7.5",
  },
};

// ====================================================================== lesson
// Coding tasks (modify / make) use bullet-point steps and a model solution.
// The expected output for each test comes from running the solution, and the
// student's output must match it line by line. `vars` lists variables that
// must exist with a given OCR data type. `mustUse` is [regex, message, mistake].
const LESSON = [
  // ---------------------------------------------------------------- data types
  { part: "Data types", id: "l-type1", stage: "predictType", code: "age = 15", why: "A whole number is an <b>Integer</b>.", mistake: "datatype_real_int" },
  { part: "Data types", id: "l-type2", stage: "predictType", code: "height = 1.62", why: "A decimal point makes it a <b>Real</b>.", mistake: "datatype_real_int" },
  { part: "Data types", id: "l-type3", stage: "predictType", code: 'age = "15"', why: "Quotes make it a <b>String</b>, even with digits inside.", mistake: "datatype_quotes" },
  { part: "Data types", id: "l-type4", stage: "predictType", code: 'grade = "A"', why: "One letter in quotes is a <b>Character</b>.", mistake: "datatype_choice" },
  { part: "Data types", id: "l-type5", stage: "predictType", code: "has_pet = True", why: "True or False is a <b>Boolean</b>.", mistake: "datatype_bool" },
  { part: "Data types", id: "l-type6", stage: "predictType", only: "hard", code: "price = 7.0", why: ".0 still makes it a <b>Real</b>.", mistake: "datatype_real_int" },
  { part: "Data types", id: "l-type7", stage: "predictType", only: "hard", code: 'answer = "True"', why: "Quotes make it a <b>String</b>.", mistake: "datatype_bool" },
  { part: "Data types", id: "l-dt-p1", stage: "predict", code: "print(5 + 3)", why: "Integers are <b>added</b>.", mistake: "datatype_quotes" },
  { part: "Data types", id: "l-dt-p2", stage: "predict", code: 'print("5" + "3")', why: "Strings are <b>joined</b>.", mistake: "concat_not_add" },
  {
    part: "Data types", id: "l-dt-make1", stage: "make", example: "ex-types", title: "Shop item",
    steps: [
      'Make <code>item</code> = <code>"Pen"</code> <span class="vb-chip t-str">String</span>',
      'Make <code>price</code> = <code>0.99</code> <span class="vb-chip t-float">Real</span>',
      'Make <code>stock</code> = <code>25</code> <span class="vb-chip t-int">Integer</span>',
      'Make <code>size</code> = <code>"M"</code> <span class="vb-chip t-char">Character</span>',
      'Make <code>on_sale</code> = <code>True</code> <span class="vb-chip t-bool">Boolean</span>',
      "Print all five on one line, in that order, with commas",
    ],
    solution: 'item = "Pen"\nprice = 0.99\nstock = 25\nsize = "M"\non_sale = True\nprint(item, price, stock, size, on_sale)',
    tests: [{ inputs: [] }],
    vars: { item: "String", price: "Real", stock: "Integer", size: "Character", on_sale: "Boolean" },
    hints: ["Quotes for the String and the Character. No quotes for True.", "print(item, price, stock, size, on_sale)"],
  },
  {
    part: "Data types", id: "l-dt-make2", stage: "make", example: "ex-types", title: "About me",
    steps: [
      "Make <code>age</code>: your age <span class=\"vb-chip t-int\">Integer</span>",
      "Make <code>height</code>: your height in metres <span class=\"vb-chip t-float\">Real</span>",
      "Make <code>initial</code>: the first letter of your name <span class=\"vb-chip t-char\">Character</span>",
      "Make <code>name</code>: your name <span class=\"vb-chip t-str\">String</span>",
      "Make <code>has_pet</code>: True or False <span class=\"vb-chip t-bool\">Boolean</span>",
      "Print all five",
    ],
    sample: "14 1.62 S Sam True",
    tests: [{ inputs: [], check: ({ out }) => out.trim() ? null : { mistake: "wrong_output", msg: "Print your variables." } }],
    vars: { age: "Integer", height: "Real", initial: "Character", name: "String", has_pet: "Boolean" },
    hints: ['initial = "S"', "has_pet = True"],
  },

  // ---------------------------------------------------------------- input + int()
  { part: "input() and int()", id: "l-in-p1", stage: "predict", code: 'first = input("Number: ")\nsecond = input("Number: ")\nprint(first + second)', inputs: ["12", "30"], why: "<code>input()</code> gives <b>Strings</b>. <code>+</code> joins them.", mistake: "concat_not_add" },
  { part: "input() and int()", id: "l-in-p2", stage: "predict", code: 'first = int(input("Number: "))\nsecond = int(input("Number: "))\nprint(first + second)', inputs: ["12", "30"], why: "<code>int()</code> makes <b>Integers</b>, so they're added.", mistake: "concat_not_add" },
  {
    part: "input() and int()", id: "l-in-inv", stage: "investigate",
    code: 'first = input("Number: ")\nsecond = input("Number: ")\ntotal = first + second\nprint(total)',
    task: "Run it. Type <b>12</b> then <b>30</b>.",
    questions: [
      { q: "What did it print?", accept: ["1230"], answer: "1230", mistake: "concat_not_add" },
      { q: "Look at the Variables table. What data type is <code>first</code>?", accept: ["string", "str"], answer: "String", mistake: "missing_num_cast" },
      { q: "Which cast makes it an Integer?", accept: ["int", "int()"], answer: "int()", mistake: "missing_num_cast" },
    ],
    key: "Cast input straight away: <code>int(input(...))</code>",
  },
  {
    part: "input() and int()", id: "l-in-mod", stage: "modify", example: "ex-add", title: "Fix the 55 bug",
    code: 'first = input("Enter a number: ")\nsecond = input("Enter another number: ")\nprint("The total is", first + second)\n',
    steps: ["Run it: 25 and 25 gives <b>2525</b>", "Change it so <code>first</code> and <code>second</code> are <span class=\"vb-chip t-int\">Integer</span>", "25 and 25 must print <b>The total is 50</b>"],
    solution: 'first = int(input("Enter a number: "))\nsecond = int(input("Enter another number: "))\nprint("The total is", first + second)',
    tests: [{ inputs: ["25", "25"] }, { inputs: ["20", "17"] }],
    vars: { first: "Integer", second: "Integer" },
    hints: ["Wrap each <code>input()</code> in <code>int()</code>."],
  },
  {
    part: "input() and int()", id: "l-in-make1", stage: "make", example: "ex-add", title: "Add two numbers",
    steps: [
      'Ask <code>"Enter a number: "</code>. Store it in <code>first</code> as an <span class="vb-chip t-int">Integer</span>',
      'Ask <code>"Enter another number: "</code>. Store it in <code>second</code> as an <span class="vb-chip t-int">Integer</span>',
      "Print <b>The total is</b> and the total",
    ],
    solution: 'first = int(input("Enter a number: "))\nsecond = int(input("Enter another number: "))\nprint("The total is", first + second)',
    tests: [{ inputs: ["12", "30"] }, { inputs: ["5", "3"] }],
    vars: { first: "Integer", second: "Integer" },
    hints: ['first = int(input("Enter a number: "))', 'print("The total is", first + second)'],
    hard: {
      steps: [
        'Ask for 3 numbers: <code>"Number 1: "</code>, <code>"Number 2: "</code>, <code>"Number 3: "</code>',
        'Store them in <code>a</code>, <code>b</code>, <code>c</code> as <span class="vb-chip t-int">Integers</span>',
        "Make <code>total</code> = the sum",
        "Print <b>The total is</b> and the total",
      ],
      solution: 'a = int(input("Number 1: "))\nb = int(input("Number 2: "))\nc = int(input("Number 3: "))\ntotal = a + b + c\nprint("The total is", total)',
      tests: [{ inputs: ["5", "3", "2"] }, { inputs: ["10", "20", "30"] }],
      vars: { a: "Integer", b: "Integer", c: "Integer", total: "Integer" },
    },
  },
  {
    part: "input() and int()", id: "l-in-make2", stage: "make", example: "ex-add", title: "Double it",
    steps: [
      'Ask <code>"How many sweets? "</code>. Store it in <code>sweets</code> as an <span class="vb-chip t-int">Integer</span>',
      "Make <code>double</code> = sweets × 2",
      "Print <b>Double is</b> and the answer",
    ],
    solution: 'sweets = int(input("How many sweets? "))\ndouble = sweets * 2\nprint("Double is", double)',
    tests: [{ inputs: ["12"] }, { inputs: ["7"] }],
    vars: { sweets: "Integer", double: "Integer" },
    hints: ["× in Python is <code>*</code>"],
  },

  // ---------------------------------------------------------------- float()
  { part: "float()", id: "l-fl-p1", stage: "predict", code: "print(int(3.9))", why: "<code>int()</code> <b>chops off</b> the decimal. It doesn't round.", mistake: "int_on_decimal" },
  { part: "float()", id: "l-fl-p2", stage: "predict", code: 'print(int("2.5"))', why: "<code>int()</code> can't read decimals. It crashes.", mistake: "int_on_decimal" },
  { part: "float()", id: "l-fl-p3", stage: "predict", code: 'print(float("2.5") * 2)', why: "<code>float()</code> reads decimals. <b>Real</b> × 2 = 5.0", mistake: "datatype_real_int" },
  {
    part: "float()", id: "l-fl-inv", stage: "investigate",
    code: 'height = int(input("Height in m: "))\nprint(height * 100, "cm")',
    task: "Run it. Type <b>1.5</b>.",
    questions: [
      { q: "What is the error called?", accept: ["valueerror"], answer: "ValueError", mistake: "int_on_decimal" },
      { q: "Which cast should line 1 use instead?", accept: ["float", "float()"], answer: "float()", mistake: "int_on_decimal" },
      { q: "Change it and run again with 1.5. How many cm?", accept: ["150", "150.0", "150.0 cm", "150 cm"], answer: "150.0", mistake: "int_on_decimal" },
    ],
    key: "Could it have a decimal point? Use <code>float()</code>.",
  },
  {
    part: "float()", id: "l-fl-mod", stage: "modify", example: "ex-float", title: "Fix the weight crash",
    code: 'weight = int(input("Weight in kg: "))\nprint("That is", weight * 1000, "grams")\n',
    steps: ["Run it and type <b>1.5</b>. It crashes", "Make <code>weight</code> a <span class=\"vb-chip t-float\">Real</span>", "1.5 must print <b>That is 1500.0 grams</b>"],
    solution: 'weight = float(input("Weight in kg: "))\nprint("That is", weight * 1000, "grams")',
    tests: [{ inputs: ["1.5"] }, { inputs: ["2.25"] }],
    vars: { weight: "Real" },
    hints: ["Swap <code>int</code> for <code>float</code>."],
  },
  {
    part: "float()", id: "l-fl-make1", stage: "make", example: "ex-float", title: "Shopping total",
    steps: [
      'Ask <code>"Price of item 1: "</code>. Store it in <code>price1</code> as a <span class="vb-chip t-float">Real</span>',
      'Ask <code>"Price of item 2: "</code>. Store it in <code>price2</code> as a <span class="vb-chip t-float">Real</span>',
      "Print <b>Total:</b> and the total",
    ],
    solution: 'price1 = float(input("Price of item 1: "))\nprice2 = float(input("Price of item 2: "))\nprint("Total:", price1 + price2)',
    tests: [{ inputs: ["2.50", "1.25"] }, { inputs: ["0.99", "4.01"] }],
    vars: { price1: "Real", price2: "Real" },
    hints: ['price1 = float(input("Price of item 1: "))'],
    hard: {
      steps: [
        'Ask <code>"Price: "</code>. Store it in <code>price</code> as a <span class="vb-chip t-float">Real</span>',
        'Ask <code>"How many? "</code>. Store it in <code>amount</code> as an <span class="vb-chip t-int">Integer</span>',
        "Make <code>total</code> = price × amount",
        "Print <b>Total:</b> and the total",
      ],
      solution: 'price = float(input("Price: "))\namount = int(input("How many? "))\ntotal = price * amount\nprint("Total:", total)',
      tests: [{ inputs: ["2.50", "3"] }, { inputs: ["1.25", "4"] }],
      vars: { price: "Real", amount: "Integer", total: "Real" },
    },
  },

  // ---------------------------------------------------------------- str()
  { part: "str()", id: "l-st-p1", stage: "predict", code: 'print("Score: " + 10)', why: "<code>+</code> can't join a <b>String</b> and an <b>Integer</b>.", mistake: "missing_str_cast" },
  { part: "str()", id: "l-st-p2", stage: "predict", code: 'print("Score: " + str(10))', why: "<code>str()</code> makes 10 a <b>String</b>, so it joins.", mistake: "missing_str_cast" },
  { part: "str()", id: "l-st-p3", stage: "predict", code: "print(str(10) + str(5))", why: "Two <b>Strings</b> join: 105.", mistake: "concat_not_add" },
  {
    part: "str()", id: "l-st-mod", stage: "modify", example: "ex-str", title: "Fix the score",
    code: 'score = 10\nbonus = 5\ntotal = score + bonus\nprint("Total: " + total)\n',
    steps: ["Run it. It crashes", "Keep the <code>+</code>. Use <code>str()</code>", "It must print <b>Total: 15</b>"],
    solution: 'score = 10\nbonus = 5\ntotal = score + bonus\nprint("Total: " + str(total))',
    tests: [{ inputs: [] }],
    mustUse: [[/str\s*\(/, "Use str() to fix it.", "missing_str_cast"]],
    hints: ["<code>str(total)</code>"],
  },
  {
    part: "str()", id: "l-st-make1", stage: "make", example: "ex-str", title: "Next year",
    steps: [
      'Ask <code>"How old are you? "</code>. Store it in <code>age</code> as an <span class="vb-chip t-int">Integer</span>',
      "Print <b>Next year you will be</b> and age + 1",
      "Join with <code>+</code> and <code>str()</code> (no commas)",
    ],
    solution: 'age = int(input("How old are you? "))\nprint("Next year you will be " + str(age + 1))',
    tests: [{ inputs: ["14"] }, { inputs: ["11"] }],
    vars: { age: "Integer" },
    mustUse: [[/str\s*\(/, "Join with + and str(), not commas.", "missing_str_cast"]],
    hints: ['print("Next year you will be " + str(age + 1))'],
    hard: {
      steps: [
        'Ask <code>"How old are you? "</code>. Store it in <code>age</code> as an <span class="vb-chip t-int">Integer</span>',
        "Print <b>In 10 years you will be</b> and age + 10",
        "Join with <code>+</code> and <code>str()</code> (no commas)",
      ],
      solution: 'age = int(input("How old are you? "))\nprint("In 10 years you will be " + str(age + 10))',
      tests: [{ inputs: ["14"] }, { inputs: ["9"] }],
    },
  },
  {
    part: "str()", id: "l-st-make2", stage: "make", example: "ex-str", title: "Score card",
    steps: [
      'Ask <code>"Name: "</code>. Store it in <code>name</code> <span class="vb-chip t-str">String</span>',
      'Ask <code>"Score: "</code>. Store it in <code>score</code> as an <span class="vb-chip t-int">Integer</span>',
      "Print e.g. <b>Sam scored 7 points</b>",
      "Join with <code>+</code> and <code>str()</code>",
    ],
    solution: 'name = input("Name: ")\nscore = int(input("Score: "))\nprint(name + " scored " + str(score) + " points")',
    tests: [{ inputs: ["Sam", "7"] }, { inputs: ["Ava", "10"] }],
    vars: { name: "String", score: "Integer" },
    mustUse: [[/str\s*\(/, "Join with + and str(), not commas.", "missing_str_cast"]],
    hints: ['Watch the spaces: " scored " and " points"'],
  },

  // ---------------------------------------------------------------- store the cast
  { part: "Store the cast", id: "l-sc-p1", stage: "predict", code: 'number = "4"\nint(number)\nprint(number * 2)', why: "<code>int(number)</code> wasn't <b>stored</b>. It's still the String \"4\".", mistake: "cast_not_stored" },
  { part: "Store the cast", id: "l-sc-p2", stage: "predict", code: 'number = "4"\nnumber = int(number)\nprint(number * 2)', why: "Stored with <code>=</code>, so now it's an <b>Integer</b>.", mistake: "cast_not_stored" },
  {
    part: "Store the cast", id: "l-sc-inv", stage: "investigate",
    code: 'number = input("Number: ")\nint(number)\nprint(number * 2)',
    task: "Press <b>🐞 Debug</b>. Type <b>12</b>. Press <b>Step ▶</b> until line 3.",
    questions: [
      { q: "What data type is <code>number</code>?", accept: ["string", "str"], answer: "String", mistake: "cast_not_stored" },
      { q: "Type the fixed line 2.", accept: ["/^number\\s*=\\s*int\\(\\s*number\\s*\\)$/"], answer: "number = int(number)", mistake: "cast_not_stored" },
    ],
    key: "A cast must be stored: <code>number = int(number)</code>",
  },
  {
    part: "Store the cast", id: "l-sc-mod", stage: "modify", example: "ex-store", title: "Fix the cast",
    code: 'number = input("Number: ")\nint(number)\nprint(number * 2)\n',
    steps: ["Run it: 12 prints <b>1212</b>", "Fix line 2 so the cast is <b>stored</b>", "12 must print <b>24</b>"],
    solution: 'number = input("Number: ")\nnumber = int(number)\nprint(number * 2)',
    tests: [{ inputs: ["12"] }, { inputs: ["21"] }],
    vars: { number: "Integer" },
    hints: ["Line 2 needs <code>number =</code> at the start."],
  },
  {
    part: "Store the cast", id: "l-sc-make", stage: "make", example: "ex-store", title: "Years into months",
    code: 'years = input("How many years? ")\n',
    steps: [
      "Keep line 1",
      'On line 2, cast <code>years</code> to an <span class="vb-chip t-int">Integer</span> and <b>store it back</b> in <code>years</code>',
      "Print <b>That is</b> … <b>months</b>",
    ],
    solution: 'years = input("How many years? ")\nyears = int(years)\nprint("That is", years * 12, "months")',
    tests: [{ inputs: ["12"] }, { inputs: ["30"] }],
    vars: { years: "Integer" },
    mustUse: [[/^\s*years\s*=\s*int\(\s*years\s*\)/m, "Add the line: years = int(years)", "cast_not_stored"]],
    hints: ["years = int(years)"],
  },

  // ---------------------------------------------------------------- bool()
  { part: "bool()", id: "l-bo-p1", stage: "predict", code: "print(bool(1))", why: "1 becomes <b>True</b>.", mistake: "datatype_bool" },
  { part: "bool()", id: "l-bo-p2", stage: "predict", code: "print(bool(0))", why: "0 becomes <b>False</b>.", mistake: "datatype_bool" },
  { part: "bool()", id: "l-bo-p3", stage: "predict", code: 'print(bool(""))', why: "An empty String is <b>False</b>.", mistake: "datatype_bool" },
  { part: "bool()", id: "l-bo-p4", stage: "predict", only: "hard", code: 'print(bool("False"))', why: "Any String with something in it is <b>True</b>, even \"False\"!", mistake: "datatype_bool" },
  {
    part: "bool()", id: "l-bo-make", stage: "make", title: "Has a pet?",
    steps: [
      'Ask <code>"Pet? 1 = yes, 0 = no: "</code>. Store it in <code>answer</code> as an <span class="vb-chip t-int">Integer</span>',
      'Make <code>has_pet</code> = <code>bool(answer)</code> <span class="vb-chip t-bool">Boolean</span>',
      "Print <b>Has pet:</b> and has_pet",
    ],
    solution: 'answer = int(input("Pet? 1 = yes, 0 = no: "))\nhas_pet = bool(answer)\nprint("Has pet:", has_pet)',
    tests: [{ inputs: ["1"] }, { inputs: ["0"] }],
    vars: { answer: "Integer", has_pet: "Boolean" },
    hints: ["has_pet = bool(answer)"],
  },

  // ---------------------------------------------------------------- put it together
  {
    part: "Put it together", id: "l-pt-tickets", stage: "make", example: "ex-together", title: "Cinema tickets",
    code: "PRICE = 7.50\n",
    steps: [
      "Keep line 1",
      'Ask <code>"How many tickets? "</code>. Store it in <code>tickets</code> as an <span class="vb-chip t-int">Integer</span>',
      "Make <code>total</code> = tickets × PRICE <span class=\"vb-chip t-float\">Real</span>",
      "Print <b>Total: £</b> and the total, using <code>+</code> and <code>str()</code>",
    ],
    solution: 'PRICE = 7.50\ntickets = int(input("How many tickets? "))\ntotal = tickets * PRICE\nprint("Total: £" + str(total))',
    tests: [{ inputs: ["3"] }, { inputs: ["4"] }],
    vars: { tickets: "Integer", total: "Real" },
    mustUse: [[/str\s*\(/, "Join with + and str().", "missing_str_cast"]],
    hard: {
      code: "ADULT = 7.50\nCHILD = 5.25\n",
      steps: [
        "Keep lines 1 and 2",
        'Ask <code>"Adults: "</code> and <code>"Children: "</code>. Store as <span class="vb-chip t-int">Integers</span> in <code>adults</code> and <code>children</code>',
        "Make <code>total</code> = adults × ADULT + children × CHILD",
        "Print <b>Total: £</b> and the total, using <code>+</code> and <code>str()</code>",
      ],
      solution: 'ADULT = 7.50\nCHILD = 5.25\nadults = int(input("Adults: "))\nchildren = int(input("Children: "))\ntotal = adults * ADULT + children * CHILD\nprint("Total: £" + str(total))',
      tests: [{ inputs: ["3", "2"] }, { inputs: ["1", "4"] }],
      vars: { adults: "Integer", children: "Integer", total: "Real" },
    },
  },
  {
    part: "Put it together", id: "l-pt-months", stage: "modify", example: "ex-together", title: "Fix 2 bugs",
    code: 'name = input("Name: ")\nage = input("Age: ")\nmonths = age * 12\nprint(name + " is " + months + " months old")\n',
    steps: ["There are <b>2 bugs</b>", "<code>age</code> must be an <span class=\"vb-chip t-int\">Integer</span>", "Sam, 14 must print <b>Sam is 168 months old</b>"],
    solution: 'name = input("Name: ")\nage = int(input("Age: "))\nmonths = age * 12\nprint(name + " is " + str(months) + " months old")',
    tests: [{ inputs: ["Sam", "14"] }, { inputs: ["Ava", "12"] }],
    vars: { age: "Integer", months: "Integer" },
    hints: ["Bug 1: cast the age with <code>int()</code>.", "Bug 2: <code>months</code> needs <code>str()</code>."],
  },
  {
    part: "Put it together", id: "l-pt-bill", stage: "make", example: "ex-together", title: "Split the bill",
    steps: [
      'Ask <code>"Bill: £"</code>. Store it in <code>bill</code> as a <span class="vb-chip t-float">Real</span>',
      'Ask <code>"People: "</code>. Store it in <code>people</code> as an <span class="vb-chip t-int">Integer</span>',
      "Make <code>each</code> = bill ÷ people",
      "Print <b>Each pays £</b> and each, using <code>+</code> and <code>str()</code>",
    ],
    solution: 'bill = float(input("Bill: £"))\npeople = int(input("People: "))\neach = bill / people\nprint("Each pays £" + str(each))',
    tests: [{ inputs: ["25", "4"] }, { inputs: ["7.50", "3"] }],
    vars: { bill: "Real", people: "Integer", each: "Real" },
    mustUse: [[/str\s*\(/, "Join with + and str().", "missing_str_cast"]],
    hints: ["÷ in Python is <code>/</code>"],
  },
  {
    part: "Put it together", id: "l-pt-profile", stage: "make", example: "ex-together", title: "Final challenge: profile",
    steps: [
      'Ask <code>"Name: "</code> → <code>name</code> <span class="vb-chip t-str">String</span>',
      'Ask <code>"Age: "</code> → <code>age</code> <span class="vb-chip t-int">Integer</span>',
      'Ask <code>"Height in m: "</code> → <code>height</code> <span class="vb-chip t-float">Real</span>',
      "Line 1: <b>Name: Sam</b>",
      "Line 2: <b>Age next year: 15</b>",
      "Line 3: <b>Height in cm: 150.0</b>",
    ],
    solution: 'name = input("Name: ")\nage = int(input("Age: "))\nheight = float(input("Height in m: "))\nprint("Name:", name)\nprint("Age next year:", age + 1)\nprint("Height in cm:", height * 100)',
    tests: [{ inputs: ["Sam", "14", "1.5"] }, { inputs: ["Ava", "12", "1.75"] }],
    vars: { name: "String", age: "Integer", height: "Real" },
    hints: ["Three inputs, three casts (or none for the name).", 'print("Height in cm:", height * 100)'],
  },
];

const MODES = {
  easy: { name: "Easy", icon: "🟢", blurb: "Hints and help in the code." },
  standard: { name: "Standard", icon: "🟡", blurb: "No hints." },
  hard: { name: "Hard", icon: "🔴", blurb: "Harder tasks." },
};

const STAGES = {
  predict: { icon: "🔮", label: "Predict" },
  predictType: { icon: "🔮", label: "Predict the type" },
  investigate: { icon: "🔍", label: "Investigate" },
  modify: { icon: "🔧", label: "Modify" },
  make: { icon: "🛠️", label: "Make" },
  question: { icon: "❓", label: "Question" },
};

// ====================================================================== help topics
const HELP = [
  {
    id: "types", icon: "🧱", title: "The 5 data types",
    body: `<table class="table help-table"><tbody>
      <tr><td><span class="vb-chip t-int">Integer</span></td><td>Whole number</td><td><code>15</code></td></tr>
      <tr><td><span class="vb-chip t-float">Real</span></td><td>Has a decimal point</td><td><code>1.62</code></td></tr>
      <tr><td><span class="vb-chip t-char">Character</span></td><td>One letter in quotes</td><td><code>"A"</code></td></tr>
      <tr><td><span class="vb-chip t-str">String</span></td><td>Text in quotes</td><td><code>"Sam"</code></td></tr>
      <tr><td><span class="vb-chip t-bool">Boolean</span></td><td>True or False</td><td><code>True</code></td></tr>
    </tbody></table>`,
    watch: '<code>"15"</code> has quotes, so it\'s a <b>String</b>.',
    code: 'age = 15\nheight = 1.62\ngrade = "A"\nname = "Sam"\nhas_pet = True',
  },
  { id: "int", icon: "🔢", title: "int()", body: "Makes an <b>Integer</b> (whole number).", code: 'age = int("15")\nprint(age + 1)', output: "16", watch: "<code>int(3.9)</code> gives 3. It chops, it doesn't round.<br><code>int(\"2.5\")</code> crashes." },
  { id: "float", icon: "💧", title: "float()", body: "Makes a <b>Real</b> (decimal number).", code: 'price = float("2.50")\nprint(price * 2)', output: "5.0", watch: "Use it for prices, heights, weights." },
  { id: "str", icon: "🔤", title: "str()", body: "Makes a <b>String</b>, so you can join it with <code>+</code>.", code: 'score = 10\nprint("Score: " + str(score))', output: "Score: 10", watch: '<code>"Score: " + 10</code> crashes.' },
  { id: "bool", icon: "✅", title: "bool()", body: "Makes a <b>Boolean</b>: True or False.", code: 'print(bool(1))\nprint(bool(0))\nprint(bool(""))', output: "True\nFalse\nFalse", watch: '<code>bool("False")</code> is True! Any non-empty String is True.' },
  { id: "input", icon: "⌨️", title: "input() + casting", body: "<code>input()</code> always gives a <b>String</b>. Cast it straight away.", code: 'age = int(input("Age: "))\nprice = float(input("Price: "))', watch: "Count the brackets: <code>int(input(\"...\"))</code> ends with <code>))</code>" },
  { id: "store", icon: "📦", title: "Store the cast", body: "A cast makes a <b>new</b> value. Store it with <code>=</code>.", code: 'number = input("Number: ")\nnumber = int(number)', watch: "<code>int(number)</code> on its own does nothing." },
  { id: "ide", icon: "🐞", title: "Using the IDE", body: `<ul class="plain">
      <li><b>▶ Run</b> runs your code.</li>
      <li><b>🐞 Debug</b> then <b>Step ▶</b> goes line by line.</li>
      <li>The <b>Variables</b> table shows each value and its data type.</li>
      <li>Click beside a line number for a <span class="bp-dot"></span> breakpoint.</li></ul>` },
];
