const Handlebars = require('handlebars');
const _ = require('lodash');
const dotenv = require('dotenv');
const mailcomposer = require('mailcomposer');
const mailgun = require('mailgun-js');
const marked = require('marked');
const readFile = require('fs-readfile-promise');

// Push environment variables on to the node process
dotenv.config()

class CoverLetter {

  constructor(config) {
    this.marked = marked;
    this.from = this.getConfigKey(
      config,
      'from',
      null,
      'COVER_FROM_EMAIL',
    )
    this.letterPath = this.getConfigKey(
      config,
      'letterPath',
      './example/letter.md',
      'COVER_LETTER_PATH'
    );
    this.templatePath = this.getConfigKey(
      config,
      'templatePath',
      './example/template.html',
      'COVER_TEMPLATE_PATH'
    );
    this.mailgun = mailgun({
      apiKey: this.getConfigKey(config, 'mailgunApiKey', null, 'MAILGUN_API_KEY'),
      domain: this.getConfigKey(config, 'mailgunDomain', null, 'MAILGUN_DOMAIN'),
    });
    this.templateVariables = this.getConfigKey(
      config,
      'templateVariables',
      {}
    );
  }

  getConfigKey(config, key, defaultValue, processKey) {
    // Try to grab the value from the passed in config
    let value = _.get(config, key, defaultValue)

    if ((value === null || value === defaultValue) && processKey) {
      value = _.get(process.env, processKey, defaultValue);
    }

    return value;
  }

  renderLetter() {
    return readFile(this.letterPath)
      .then(markdown => {
        return this.marked(markdown.toString());
      })
      .then(letter => {
        const template = Handlebars.compile(letter);
        return template(this.template_variables);
      });
  }

  renderCoverLetter() {
    let templatePromise = readFile(this.templatePath)
      .then(template => {
        return Handlebars.compile(template.toString());
      });
    const renderPromises = [templatePromise, this.renderLetter()];

    return Promise.all(renderPromises)
      .then((results) => {
        const [template, letter] = [...results];
        const templateVariables = {};

        // Insert the letter body into the template variables
        Object.assign(
          templateVariables,
          {body: letter},
          this.templateVariables
        );

        return template(templateVariables);
      });
  }

  renderPlainTextLetter() {
    return readFile(this.letterPath)
      .then(letter => {
        const template = Handlebars.compile(letter.toString());
        return template(this.templateVariables);
      });
  }

  sendLetter(email) {
    let renderPromises = [
      this.renderCoverLetter(),
      this.renderPlainTextLetter(),
    ];

    return Promise.all(renderPromises)
      .then(results => {
        const [htmlMsg, txtMsg] = [...results];
        const message = mailcomposer({
          from: this.from,
          to: email,
          subject: this.templateVariables.subject,
          text: txtMsg,
          html: htmlMsg,
        });

        return {
          to: email,
          message: message,
        };
      })
      .then(message => {
        return this.mailgun.messages().sendMime(message, (error, body) => {
          debugger
        })
      })
      .catch(err => {debugger})
  }
}

module.exports = CoverLetter;
