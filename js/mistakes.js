// The catalogue of mistakes we track, and the rules that turn a Python error
// or warning into one of them.

const TOPICS = {
  print: { name: "Print", spec: "Course intro" },
  variables: { name: "Variables", spec: "2.2.1" },
  input: { name: "Input", spec: "2.2.1" },
  datatypes: { name: "Data types", spec: "2.2.2" },
  casting: { name: "Casting", spec: "2.2.2" },
  syntax: { name: "Syntax (typing rules)", spec: "2.2.1" },
};

const MISTAKES = {
  // ---- casting
  missing_num_cast: {
    title: "Doing maths with text (forgot int() or float())",
    topic: "casting",
    explain: "input() always gives you a string. Python can't do maths with a string, even if it looks like a number.",
    fix: "Wrap the input in int() for whole numbers or float() for decimals.",
    bad: 'age = input("Age? ")\nprint(age + 1)',
    good: 'age = int(input("Age? "))\nprint(age + 1)',
    advice: "Every time you use input() for a number, cast it straight away: int(input(...)) or float(input(...)).",
  },
  missing_str_cast: {
    title: "Joining a number to text with + (forgot str())",
    topic: "casting",
    explain: "+ can join two strings, or add two numbers, but it can't mix them. A number has to become a string before it can be joined.",
    fix: "Use str() around the number, or use a comma in print() instead of +.",
    bad: 'score = 10\nprint("Score: " + score)',
    good: 'score = 10\nprint("Score: " + str(score))\nprint("Score:", score)',
    advice: "When you print a number with +, wrap it in str(). Or use commas in print(), which handle any data type.",
  },
  concat_not_add: {
    title: '"5" + "5" gave "55" (strings joined, not added)',
    topic: "casting",
    explain: "Two strings joined with + are stuck together, so \"5\" + \"5\" is \"55\" and not 10. No error appears, the answer is just wrong.",
    fix: "Cast both inputs to int() or float() before adding them.",
    bad: 'a = input("First: ")\nb = input("Second: ")\nprint(a + b)',
    good: 'a = int(input("First: "))\nb = int(input("Second: "))\nprint(a + b)',
    advice: "This one gives no error message, so test your programs with real numbers and check the answer is right.",
  },
  string_repeat: {
    title: '"5" * 3 gave "555" (string repeated, not multiplied)',
    topic: "casting",
    explain: "Multiplying a string by a whole number repeats it. \"5\" * 3 is \"555\", not 15.",
    fix: "Cast the input to int() or float() first.",
    bad: 'num = input("Number: ")\nprint(num * 3)',
    good: 'num = int(input("Number: "))\nprint(num * 3)',
    advice: "Cast inputs to numbers before you do any maths with them.",
  },
  int_on_decimal: {
    title: "Used int() on a decimal (should be float())",
    topic: "casting",
    explain: 'int() only understands whole numbers. int("3.5") crashes, and int(3.5) quietly chops off the .5 so you lose part of the answer.',
    fix: "Use float() for anything that could have a decimal point, like prices, heights or temperatures.",
    bad: 'price = int(input("Price: "))   # user types 2.50',
    good: 'price = float(input("Price: "))',
    advice: "Ask yourself: could this value ever have a decimal point? If yes, use float().",
  },
  invalid_cast: {
    title: "Tried to cast text that isn't a number",
    topic: "casting",
    explain: 'int() and float() only work on strings that look like numbers. int("ten") or int("") crashes.',
    fix: "Check what was typed. When you test, type digits (like 10) and don't leave the answer empty.",
    bad: 'age = int("fifteen")',
    good: 'age = int("15")',
    advice: "Remember casting only changes the data type. It can't understand words like \"ten\".",
  },
  compare_str_num: {
    title: "Compared a string with a number",
    topic: "casting",
    explain: 'input() gives a string, so age > 12 crashes, and age == 18 is always False because "18" is not the same as 18.',
    fix: "Cast the input to int() or float() before comparing it with a number.",
    bad: 'age = input("Age? ")\nif age > 12:',
    good: 'age = int(input("Age? "))\nif age > 12:',
    advice: "Before comparing, check both sides are the same data type.",
  },
  cast_not_stored: {
    title: "Cast but didn't store the result",
    topic: "casting",
    explain: "int(num) on its own line makes a new integer and then throws it away. It does NOT change num.",
    fix: "Store the result: num = int(num). Or cast straight away: num = int(input(...)).",
    bad: "num = input()\nint(num)\nprint(num * 2)",
    good: "num = input()\nnum = int(num)\nprint(num * 2)",
    advice: "Casting gives you a new value. You have to store it in a variable with = to keep it.",
  },
  shadow_builtin: {
    title: "Used a Python word (print, input, str, int...) as a variable name",
    topic: "variables",
    explain: "If you call a variable str or input, you replace Python's own function. After that, str() or input() stops working.",
    fix: "Pick a different name, for example user_input or text instead of input or str.",
    bad: 'str = "hello"\nprint(str(5))',
    good: 'greeting = "hello"\nprint(str(5))',
    advice: "Don't name variables after Python functions like print, input, int, str, float or type.",
  },
  // ---- variables
  name_mismatch: {
    title: "Variable name spelt differently (typo or capital letter)",
    topic: "variables",
    explain: "Python is case sensitive, and every letter counts. name, Name and nmae are three different variables.",
    fix: "Use exactly the same spelling and capital letters every time you use the variable.",
    bad: 'name = "Sam"\nprint("Hi " + Name)',
    good: 'name = "Sam"\nprint("Hi " + name)',
    advice: "Copy the variable name from where you created it, and keep variable names in lowercase.",
  },
  used_before_assigned: {
    title: "Used a variable before it was created",
    topic: "variables",
    explain: "Python runs from top to bottom. A variable has to be given a value on an earlier line before you can use it.",
    fix: "Move the line that creates the variable above the line that uses it.",
    bad: "print(total)\ntotal = 5",
    good: "total = 5\nprint(total)",
    advice: "Trace your program from the top. Has every variable been set before it is used?",
  },
  undefined_variable: {
    title: "Used a variable that doesn't exist",
    topic: "variables",
    explain: "Python found a name it doesn't know. Either the variable was never created, or it was meant to be text in quotes.",
    fix: "Create the variable first, or put speech marks around it if it is meant to be text.",
    bad: "print(total)",
    good: "total = 10\nprint(total)",
    advice: "Check every name you use has been created with = first.",
  },
  missing_quotes: {
    title: "Forgot the speech marks around text",
    topic: "print",
    explain: "Without speech marks, Python thinks a word is a variable name and goes looking for it.",
    fix: 'Put speech marks around text: print("Hello") not print(Hello).',
    bad: "print(Hello)",
    good: 'print("Hello")',
    advice: "Text you want printed exactly as it is needs speech marks. Variable names don't.",
  },
  assign_backwards: {
    title: "Assignment written the wrong way round",
    topic: "variables",
    explain: "= means \"set the variable on the LEFT to the value on the RIGHT\". It isn't like = in maths, so 5 = x doesn't work.",
    fix: "Put the variable name on the left: x = 5, name = \"Sam\".",
    bad: '"Sam" = name',
    good: 'name = "Sam"',
    advice: 'Read x = 5 as "x is set to 5". The variable always goes on the left.',
  },
  invalid_name: {
    title: "Invalid variable name (space, dash, starts with a number, keyword)",
    topic: "variables",
    explain: "Variable names can only use letters, numbers and _. They can't start with a number, contain spaces or dashes, or be a Python keyword like class or if.",
    fix: "Use snake_case: first_name, not first name, first-name or 1st_name.",
    bad: 'first name = "Sam"\n1st_score = 10',
    good: 'first_name = "Sam"\nfirst_score = 10',
    advice: "Use lowercase words joined by underscores: first_name, total_cost.",
  },
  poor_name: {
    title: "Variable name doesn't say what it holds",
    topic: "variables",
    explain: "Names like x, a or thing don't tell anyone reading your code what is stored in them.",
    fix: "Choose a name that describes the data: age, total_price, first_name.",
    bad: 'x = "Aisha"\ny = 15',
    good: 'first_name = "Aisha"\nage = 15',
    advice: "Pick names someone else could understand without reading the rest of the program.",
  },
  // ---- input
  input_not_stored: {
    title: "input() answer not stored in a variable",
    topic: "input",
    explain: "input() gives back what the user typed. If you don't store it with =, the answer is lost straight away.",
    fix: 'Store it: name = input("What is your name? ")',
    bad: 'input("What is your name? ")\nprint("Hello " + name)',
    good: 'name = input("What is your name? ")\nprint("Hello " + name)',
    advice: "Every input() needs a variable and = in front of it.",
  },
  input_args: {
    title: "Gave input() more than one thing",
    topic: "input",
    explain: "input() only takes one thing: the question to show. Commas don't work like they do in print().",
    fix: 'Join the prompt into one string: input("How old are you, " + name + "? ")',
    bad: 'age = input("How old are you", name)',
    good: 'age = input("How old are you " + name + "? ")',
    advice: "Build your question as a single string before passing it to input().",
  },
  input_count: {
    title: "Asked for a different number of inputs than the task needs",
    topic: "input",
    explain: "The task tests your program by typing a set number of answers. Your program asked for more than that.",
    fix: "Re-read the task and check how many questions you should ask.",
    bad: "", good: "",
    advice: "Match your program to exactly what the task asks for.",
  },
  // ---- print
  missing_space: {
    title: "Missing space when joining with +",
    topic: "print",
    explain: '+ joins strings with nothing in between, so "Hello" + name gives HelloSam. A comma in print() adds a space for you.',
    fix: 'Add a space inside the speech marks: "Hello " + name, or use a comma: print("Hello", name).',
    bad: 'print("Hello" + name)',
    good: 'print("Hello " + name)\nprint("Hello", name)',
    advice: "Remember + adds no space and , adds one space.",
  },
  print_join: {
    title: "Forgot a comma or + between items in print()",
    topic: "print",
    explain: "When you print more than one thing you have to join them with a comma or a +.",
    fix: 'print("Hello", name) or print("Hello " + name)',
    bad: 'print("Hello" name)',
    good: 'print("Hello", name)',
    advice: "Put a , or + between each item inside print().",
  },
  print_no_brackets: {
    title: "print without brackets",
    topic: "print",
    explain: "In Python 3, print is a function, so it needs brackets.",
    fix: 'print("Hello")',
    bad: 'print "Hello"',
    good: 'print("Hello")',
    advice: "Always write print( ... ) with brackets.",
  },
  // ---- data types knowledge
  datatype_quotes: {
    title: 'Thought "42" is a number (quotes make it a string)',
    topic: "datatypes",
    explain: 'Anything inside speech marks is a string. "42" is a string, 42 is an integer.',
    fix: "Look for speech marks first. If there are any, it's a string.",
    bad: "", good: "",
    advice: "Check for speech marks before deciding the data type.",
  },
  datatype_real_int: {
    title: "Mixed up integer and real (float)",
    topic: "datatypes",
    explain: "An integer is a whole number (7). A real / float has a decimal point (7.0 or 3.5). Dividing with / always gives a float.",
    fix: "Look for a decimal point. If there is one, it's a real (float).",
    bad: "", good: "",
    advice: "Whole numbers are integers. Anything with a decimal point is real.",
  },
  datatype_bool: {
    title: "Mixed up Boolean values",
    topic: "datatypes",
    explain: 'A Boolean can only be True or False, written with a capital letter and no quotes. "True" in quotes is a string.',
    fix: "Use True/False with no speech marks for yes/no data.",
    bad: "", good: "",
    advice: "Use a Boolean for any yes/no or on/off data.",
  },
  datatype_choice: {
    title: "Chose the wrong data type for some data",
    topic: "datatypes",
    explain: "Phone numbers and postcodes are strings, because you never do maths with them and a leading 0 would be lost. Money and measurements are real. Counts are integers.",
    fix: "Ask: will I do maths with it? Could it have a decimal? Is it yes/no?",
    bad: "", good: "",
    advice: "Match the data type to how the data will be used.",
  },
  casting_predict: {
    title: "Predicted the result of a cast wrongly",
    topic: "casting",
    explain: "Casting changes the data type. int() makes whole numbers and chops off decimals (it doesn't round). float() adds .0. str() makes text.",
    fix: "Re-read the casting table in Help.",
    bad: "", good: "",
    advice: "Practise predicting what int(), float() and str() give before running code.",
  },
  // ---- syntax
  missing_quote_close: {
    title: "String not closed (missing speech mark)",
    topic: "syntax",
    explain: "Every string needs a speech mark at the start and one at the end.",
    fix: "Add the missing speech mark.",
    bad: 'print("Hello)',
    good: 'print("Hello")',
    advice: "Count your speech marks. There should always be an even number.",
  },
  brackets: {
    title: "Brackets don't match",
    topic: "syntax",
    explain: "Every ( needs a matching ). This often happens with int(input(...)), which needs two closing brackets.",
    fix: "Count your brackets. int(input(\"Age? \")) ends with ))",
    bad: 'age = int(input("Age? ")',
    good: 'age = int(input("Age? "))',
    advice: "When you open a bracket, close it before you do anything else.",
  },
  eq_vs_assign: {
    title: "Used = instead of == in a comparison",
    topic: "syntax",
    explain: "= stores a value. == checks whether two values are the same.",
    fix: "if age == 18:",
    bad: "if age = 18:",
    good: "if age == 18:",
    advice: "Use = to store and == to compare.",
  },
  missing_colon: {
    title: "Missing colon at the end of if/for/while/def",
    topic: "syntax",
    explain: "Lines that start a block of code (if, else, for, while, def) must end with a colon.",
    fix: "if age > 12:",
    bad: "if age > 12", good: "if age > 12:",
    advice: "If the next line is indented, this line probably needs a colon.",
  },
  indentation: {
    title: "Indentation (spaces at the start of lines) is wrong",
    topic: "syntax",
    explain: "Python uses indentation to group code. Lines in the same block have to line up exactly.",
    fix: "Use the Tab key and line up lines in the same block.",
    bad: 'print("a")\n    print("b")', good: 'print("a")\nprint("b")',
    advice: "Only indent after a line ending with a colon.",
  },
  smart_quotes: {
    title: "Curly quotes copied from a document",
    topic: "syntax",
    explain: "“ and ” come from Word or a website and Python doesn't understand them. It needs straight quotes \".",
    fix: "Delete the curly quotes and type them again in the editor.",
    bad: "print(“Hello”)", good: 'print("Hello")',
    advice: "Type code yourself rather than copying it from documents.",
  },
  syntax_other: {
    title: "Other syntax error",
    topic: "syntax",
    explain: "Python couldn't understand the way a line is written.",
    fix: "Look at the highlighted line and the line above it for typos.",
    bad: "", good: "",
    advice: "Read error messages carefully. They tell you the line number.",
  },
  zero_division: {
    title: "Divided by zero",
    topic: "syntax",
    explain: "You can't divide a number by 0.",
    fix: "Check the value you're dividing by.",
    bad: "print(10 / 0)", good: "print(10 / 2)",
    advice: "Test your programs with different inputs.",
  },
  infinite_loop: {
    title: "Program never finished (stuck in a loop)",
    topic: "syntax",
    explain: "The program kept running without stopping.",
    fix: "Check your loop condition will eventually become False.",
    bad: "while True:\n    print(1)", good: "",
    advice: "Make sure every loop has a way to end.",
  },
  wrong_output: {
    title: "Program ran but gave the wrong answer",
    topic: "general",
    explain: "There was no error, but the output didn't match what the task asked for.",
    fix: "Re-read the task. Use the debugger to step through and watch the variables.",
    bad: "", good: "",
    advice: "Test with the example inputs and compare your output carefully.",
  },
  other_runtime: {
    title: "Other runtime error",
    topic: "general",
    explain: "The program crashed while it was running.",
    fix: "Read the error message and look at the highlighted line.",
    bad: "", good: "",
    advice: "Use the debugger to find out which line goes wrong.",
  },
};
TOPICS.general = { name: "General", spec: "" };

// Warnings from static analysis: some are logged as mistakes, some are just tips.
const WARNINGS = {
  input_not_stored: { key: "input_not_stored", log: true, text: w => `Line ${w.line}: the answer from input() isn't stored in a variable, so it is lost.` },
  cast_not_stored: { key: "cast_not_stored", log: true, text: w => `Line ${w.line}: ${w.name}(...) on its own line does nothing. Store it, e.g. num = ${w.name}(num).` },
  compare_str_num: { key: "compare_str_num", log: true, text: w => `Line ${w.line}: ${w.name} came from input() so it's a string, but you're comparing it with a number.` },
  string_repeat: { key: "string_repeat", log: true, text: w => `Line ${w.line}: ${w.name} is still a string from input(), so * repeats it instead of multiplying.` },
  maybe_concat_inputs: { key: "concat_not_add", log: false, text: w => `Line ${w.line}: ${w.name} joins two strings from input(). If they're numbers, cast them with int() or float() first.` },
  shadow_builtin: { key: "shadow_builtin", log: true, text: w => `Line ${w.line}: "${w.name}" is the name of a Python function. Choose a different variable name.` },
  poor_name: { key: "poor_name", log: true, text: w => `Line ${w.line}: "${w.name}" doesn't say what it holds. Choose a more meaningful name.` },
  capital_name: { key: "name_mismatch", log: false, text: w => `Line ${w.line}: variable names usually start with a lowercase letter ("${w.name[0].toLowerCase() + w.name.slice(1)}"). Mixing capitals causes mismatches.` },
  unused_variable: { key: "name_mismatch", log: false, text: w => w.extra ? `Line ${w.line}: you created "${w.name}" but never used it. Did you mean to use it instead of "${w.extra}"?` : `Line ${w.line}: you created "${w.name}" but never used it.` },
};

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// Turn an error from the harness into {key, friendly}.
function classifyError(err, warnings = []) {
  const msg = err.msg || "";
  const text = err.text || "";
  const t = err.type;
  let key = "other_runtime";
  let friendly = "";

  if (t === "Stopped") return { key: null, friendly: "Program stopped." };
  if (t === "TooManySteps") key = "infinite_loop";
  else if (t === "NoMoreInput") key = "input_count";
  else if (t === "SyntaxError" || t === "IndentationError" || t === "TabError") {
    const target = text.split("=")[0].trim();
    if (/Missing parentheses in call to 'print'/.test(msg)) key = "print_no_brackets";
    else if (/invalid character '[“”‘’]/.test(msg)) key = "smart_quotes";
    else if (/unterminated string|EOL while scanning|unterminated triple/.test(msg)) key = "missing_quote_close";
    else if (/was never closed|unmatched|does not match opening/.test(msg)) key = "brackets";
    else if (/invalid decimal literal/.test(msg) && /^\s*\d+[A-Za-z_]/.test(text)) key = "invalid_name";
    else if (/cannot assign to (expression|literal)/.test(msg) && /^[A-Za-z_]\w*(\s*-\s*[A-Za-z_]\w*)+$/.test(target)) key = "invalid_name";
    else if (/cannot assign to (literal|expression|function call)/.test(msg)) key = "assign_backwards";
    else if (/Maybe you meant '==' or ':=' instead of '='/.test(msg) || /^\s*(if|elif|while)\b[^=]*[^=!<>]=[^=]/.test(text)) key = "eq_vs_assign";
    else if (/expected ':'/.test(msg)) key = "missing_colon";
    else if (t === "IndentationError" || t === "TabError" || /indent/.test(msg)) key = "indentation";
    else if (/^\s*[A-Za-z_]\w*(\s+[A-Za-z_]\w*)+\s*=[^=]/.test(text) && !/^\s*(if|elif|while|for|def|return|print)\b/.test(text)) key = "invalid_name";
    else if (/^\s*(class|def|if|for|while|in|is|and|or|not|import|from|return|pass|global|with|as|try|else|elif|lambda|yield|del|raise|True|False|None)\s*=[^=]/.test(text)) key = "invalid_name";
    else if (/Perhaps you forgot a comma/.test(msg) && /print\s*\(/.test(text) && !/["']/.test(text)) key = "missing_quotes";
    else if (/Perhaps you forgot a comma/.test(msg)) key = "print_join";
    else key = "syntax_other";
  } else if (t === "TypeError") {
    if (/can only concatenate str \(not "(int|float|bool)"\) to str/.test(msg)) key = "missing_str_cast";
    else if (/unsupported operand type\(s\) for [+\-*/%]+: '(int|float)' and 'str'/.test(msg)) key = "missing_num_cast";
    else if (/unsupported operand type\(s\) for [\-*/%]+: 'str' and '(int|float|str)'/.test(msg)) key = "missing_num_cast";
    else if (/can't multiply sequence by non-int/.test(msg)) key = "missing_num_cast";
    else if (/not supported between instances of '(str|int|float)' and '(str|int|float)'/.test(msg)) key = "compare_str_num";
    else if (/'(str|int|float|bool)' object is not callable/.test(msg)) key = "shadow_builtin";
    else if (/cannot be interpreted as an integer/.test(msg)) key = "missing_num_cast";
    else if (/input expected at most 1 argument/.test(msg)) key = "input_args";
  } else if (t === "ValueError") {
    const m = msg.match(/invalid literal for int\(\) with base 10: '(.*)'/);
    if (m) key = /^\s*-?\d*\.\d+\s*$/.test(m[1]) ? "int_on_decimal" : "invalid_cast";
    else if (/could not convert string to float/.test(msg)) key = "invalid_cast";
  } else if (t === "NameError") {
    if (warnings.some(w => w.code === "input_not_stored")) key = "input_not_stored";
    else if (err.assignedLater) key = "used_before_assigned";
    else if (err.suggest && !isBuiltinName(err.suggest)) key = "name_mismatch";
    else if (/\bprint\s*\(/.test(text) && /^[A-Z]?[a-z]+$/.test(err.name || "")) key = "missing_quotes";
    else if (err.suggest) key = "name_mismatch";
    else key = "undefined_variable";
  } else if (t === "ZeroDivisionError") key = "zero_division";
  else if (t === "EOFError") key = "input_count";

  friendly = friendlyMessage(key, err);
  return { key, friendly };
}

function isBuiltinName(n) {
  return ["print", "input", "int", "float", "str", "bool", "type", "len", "round", "range", "max", "min", "sum", "abs"].includes(n);
}

function typesNote(err) {
  const entries = Object.entries(err.lineTypes || {});
  if (!entries.length) return "";
  return "<div class='types-note'>On this line: " + entries.map(([n, [ty, val]]) =>
    `<code>${esc(n)}</code> is <span class="type-pill t-${esc(ty)}">${esc(ty)}</span> <code>${esc(val)}</code>`).join(", ") + "</div>";
}

function friendlyMessage(key, err) {
  const m = MISTAKES[key];
  let extra = "";
  if (key === "name_mismatch" && err.suggest) {
    extra = err.caseOnly
      ? `You wrote <code>${esc(err.name)}</code> but the variable is called <code>${esc(err.suggest)}</code>. Capital letters matter!`
      : `You wrote <code>${esc(err.name)}</code>. Did you mean <code>${esc(err.suggest)}</code>?`;
  } else if (key === "used_before_assigned") {
    extra = `<code>${esc(err.name)}</code> is created further down. Python runs from top to bottom.`;
  } else if ((key === "missing_quotes" || key === "undefined_variable") && err.name) {
    extra = `Python doesn't know <code>${esc(err.name)}</code>. If it's text, put it in speech marks: <code>"${esc(err.name)}"</code>. If it's a variable, create it first.`;
  } else if (key === "int_on_decimal") {
    extra = "The value has a decimal point, so use <code>float()</code> instead of <code>int()</code>.";
  }
  if (!m) return extra;
  return `<strong>${esc(m.title)}</strong><br>${extra || esc(m.explain)}<br><span class="fix">How to fix it: ${esc(m.fix)}</span>${typesNote(err)}`;
}
