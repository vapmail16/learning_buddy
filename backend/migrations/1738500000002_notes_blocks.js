exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumns('notes', {
    blocks: { type: 'jsonb', default: null },
  });
};

exports.down = (pgm) => {
  pgm.dropColumns('notes', ['blocks']);
};
