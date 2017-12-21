const Handlebars = require('handlebars');
const marked = require('marked');
const readFile = require('fs-readfile-promise');

class CoverLetter {

  constructor(letter_path, template_path) {
    this.letter_path = letter_path;
    this.template_path = template_path;
    this.marked = marked;
  }

  renderLetter() {
    return readFile(this.letter_path)
      .then(markdown => {
        return this.marked(markdown.toString());
      });
  }

  renderTemplate() {
    return readFile(this.template_path)
      .then(template => {
        return Handlebars.compile(template)
      })
      .then(template => {
        const letter = this.renderMarkdownLetter();
        return template(letter);
      });
  }

  sendEmail(email) {

  }
}

module.exports = CoverLetter;
