// Debugg Learn: one course per language. A course is a list of units, and each unit is its own file
// in learn/<lang>/ (see learn/README.md for the format). Units are played in the order of `files`;
// `planned` names the units still to be written, which show on the course map as "coming soon".
// Loaded with plain <script> tags, so the page still works when opened straight from disk.
window.DEBUGG_LEARN = {
  courses: {
    python: {
      name: 'Python',
      files: ['learn/python/01-values.js'],
      planned: ['Strings', 'Lists', 'Conditions', 'Loops', 'Functions', 'Dictionaries', 'The classic traps']
    }
  },
  units: []  // filled in by the unit files
};
