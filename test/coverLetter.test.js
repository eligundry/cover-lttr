const CoverLetter = require('../src/cover.js');

const LETTER_PATH = './example/letter.md';
const TEMPLATE_PATH = './example/template.html';
const DEFAULT_CONFIG = {
  from: 'Eli Gundry <eligundry@gmail.com>',
  letterPath: LETTER_PATH,
  templatePath: TEMPLATE_PATH,
  templateVariables: {
    to: 'tom@example.com',
    subject: 'I Would Like A Job',
  },
}

test('it can be initialized', () => {
  const cl = new CoverLetter(DEFAULT_CONFIG);

  expect(cl.letterPath).toBe(LETTER_PATH)
  expect(cl.templatePath).toBe(TEMPLATE_PATH);
  expect(cl.templateVariables).toBe(DEFAULT_CONFIG['templateVariables']);
});

test('it can render the markdown letter', () => {
  const cl = new CoverLetter(DEFAULT_CONFIG);

  cl.renderLetter().then(letter => {
    expect(letter).toContain('<p>');
  });
});

test('it can render the letter into the template', () => {
  const cl = new CoverLetter(DEFAULT_CONFIG);

  cl.renderCoverLetter().then(document => {
    expect(document).toContain('<p>');
    expect(document).toContain('DOCTYPE');
  });
});

test('it can send the cover letter in an email', () => {
  const cl = new CoverLetter(DEFAULT_CONFIG);

  cl.sendLetter('eligundry@gmail.com').then(res => {
    debugger;
  });
});
