// Debuggit Learn: one course per language. A course is a list of units, and each unit is its own file
// in learn/<lang>/ (see learn/README.md for the format). Units are played in the order of `files`;
// `planned` names the units still to be written, which show on the course map as "coming soon".
// Loaded with plain <script> tags, so the page still works when opened straight from disk.
window.DEBUGG_LEARN = {
  courses: {
    python: {
      name: 'Python',
      files: ['learn/python/01-values.js', 'learn/python/02-strings.js', 'learn/python/03-lists.js'],
      planned: ['Conditions', 'Loops', 'Functions', 'Dictionaries', 'The classic traps']
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
