const CoverLetter = require('../src/cover.js');

const LETTER_PATH = './example/letter.md';
const TEMPLATE_PATH = './example/template.html';

test('it can be initialized', () => {
  const cl = new CoverLetter(LETTER_PATH, TEMPLATE_PATH);

  expect(cl.letter_path).toBe(LETTER_PATH)
  expect(cl.template_path).toBe(TEMPLATE_PATH);
});

test('it can render the markdown letter', () => {
  const cl = new CoverLetter(LETTER_PATH, TEMPLATE_PATH);

  cl.renderLetter().then(letter => {
    expect(letter).toContain('<p>');
    done();
  });
});

test('it can render the letter into the template', () => {
  const cl = new CoverLetter(LETTER_PATH, TEMPLATE_PATH);

  cl.renderCoverLetter().then(document => {
    expect(document).toContain('<p>');
    expect(document).toContain('DOCTYPE');
    done();
  });
});
