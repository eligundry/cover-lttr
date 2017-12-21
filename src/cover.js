const Handlebars = require('handlebars');
const marked = require('marked');
const readFile = require('fs-readfile-promise');

class CoverLetter {

  constructor(letter_path, template_path) {
    this.letter_path = letter_path;
    this.template_path = template_path;
    this.marked = marked;
    this.templateVariables = {};
  }

  renderLetter() {
    return readFile(this.letter_path)
      .then(markdown => {
        return this.marked(markdown.toString());
      })
      .then(letter => {
        const template = Handlebars.compile(letter);
        return template(this.template_variables);
      });
  }

  renderCoverLetter() {
    let templatePromise = readFile(this.template_path)
      .then(template => {
        return Handlebars.compile(template.toString());
      });
    const renderPromises = [templatePromise, this.renderLetter()];

    return Promise.all(renderPromises)
      .then((results) => {
        const [template, letter] = [...results];
        const templateVariables = {};

        // Insert the letter body into the template variables
        Object.assign(templateVariables, {body: letter}, this.templateVariables);

        return template(templateVariables);
      });
  }

  sendLetter(email) {

  }
}

module.exports = CoverLetter;
