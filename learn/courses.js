// Debuggit Learn: one course per language. A course is a list of units, and each unit is its own file
// in learn/<lang>/ (see learn/README.md for the format). Units are played in the order of `files`;
// `planned` names the units still to be written, which show on the course map as "coming soon".
// Loaded with plain <script> tags, so the page still works when opened straight from disk.
window.DEBUGG_LEARN = {
  courses: {
    python: {
      name: 'Python',
      files: ['learn/python/01-values.js', 'learn/python/02-strings.js', 'learn/python/03-lists.js',
        'learn/python/04-conditions.js', 'learn/python/05-loops.js',
        'learn/python/06-functions.js', 'learn/python/07-dictionaries.js'],
      // Part 1 gets a heading above its first unit, as Part 2 (below) has one above its units.
      heading: { title: 'Python Part 1: The basics', summary: 'Values, text, lists, decisions, loops, functions and dictionaries.' },
      planned: ['The classic traps'],
      // Part 2 shows as a teaser until its units are written; move each into `files` as it lands.
      sections: [{
        id: 'part-2',
        title: 'Python Part 2: Intermediate',
        summary: 'Tuples and sets, tidier loops, comprehensions, more flexible functions, working with text, and handling errors.',
        planned: ['Tuples and sets', 'Looping tools', 'Comprehensions', 'More on functions', 'Working with text', 'Errors and exceptions']
      }]
    },
    // Coming soon: a tab with the planned units, and no lessons yet. `sections` are later parts of
    // the same course, shown under their own heading; Embedded C follows ideas/embedded-c-roadmap.md.
    c: {
      name: 'C',
      soon: true,
      files: [],
      planned: ['Values and printf', 'Types and integer maths', 'Conditions and loops', 'Functions',
        'Arrays and strings', 'Pointers', 'Structs and memory'],
      sections: [{
        id: 'embedded',
        title: 'Embedded C',
        summary: 'The C that runs on microcontrollers: bits, registers, interrupts and timing.',
        planned: ['Fixed-width types', 'Bits and masks', 'Registers', 'Data layout', 'Integer maths',
          'Time', 'Interrupts', 'Structure', 'Robust firmware', 'The classic traps']
      }]
    }
  },
  units: []  // filled in by the unit files
};
