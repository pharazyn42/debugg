// Debuggit Learn: one course per language. A course is a list of units, and each unit is its own file
// in learn/<lang>/ (see learn/README.md for the format). Units are played in the order of `files`;
// `planned` names the units still to be written, which show on the course map as "coming soon".
// Loaded with plain <script> tags, so the page still works when opened straight from disk.
window.DEBUGG_LEARN = {
  courses: {
    python: {
      name: 'Python',
      files: ['learn/python/01-values.js'],
      planned: ['Strings', 'Lists', 'Conditions', 'Loops', 'Functions', 'Dictionaries', 'The classic traps']
    },
    // Coming soon: a tab with the planned units, and no lessons yet. The embedded units follow
    // ideas/embedded-c-roadmap.md.
    c: {
      name: 'C',
      soon: true,
      files: [],
      planned: ['Values and printf', 'Types and integer maths', 'Conditions and loops', 'Functions',
        'Arrays and strings', 'Pointers', 'Structs and memory', 'Embedded C: bits and registers']
    }
  },
  units: []  // filled in by the unit files
};
