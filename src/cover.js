const Handlebars = require('handlebars');
const _ = require('lodash');
const dotenv = require('dotenv');
const mailcomposer = require('mailcomposer');
const mailgun = require('mailgun-js');
const marked = require('marked');
const queryString = require('query-string');
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
    this.resumePath = this.getConfigKey(
      config,
      'resumePath',
      './example/resume.pdf',
      'COVER_RESUME_PATH'
    );
    this.spreadsheetRowID = this.getConfigKey(
      config,
      'spreadsheetRowID'
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
    this.googleAnalyticsID = this.getConfigKey(
      config,
      'googleAnalyticsID',
      null,
      'GOOGLE_ANALYTICS_ID'
    )
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
        return template(this.templateVariables);
      });
  }

  renderCoverLetter() {
    const templatePromise = readFile(this.templatePath)
      .then(template => {
        return Handlebars.compile(template.toString());
      });
    const renderPromises = [
      templatePromise,
      this.renderLetter()
    ];

    return Promise.all(renderPromises)
      .then((results) => {
        let templateVariables = {};
        const [template, letter] = [...results];

        // Insert the letter body into the template variables
        Object.assign(
          templateVariables,
          {
            body: letter,
            trackingPixel: this.constructTrackingPixelURL(),
          },
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
        const opts = {
          from: this.from,
          to: email,
          subject: this.templateVariables.subject,
          text: txtMsg,
          html: htmlMsg,
        };
        const mail = new mailcomposer.MailComposer(opts);

        return mail.compile().build((err, compiledMessage) => {
          const data = {
            to: email,
            message: compiledMessage.toString('ascii'),
          };

          return this.mailgun.messages().sendMime(data, (error, body) => {
            if (error) {
              throw new Exception(body);
            }
          });
        });
      });
  }

  constructTrackingPixelURL(spreadsheetRowID) {
    if (!this.googleAnalyticsID || !spreadsheetRowID) {
      return false;
    }

    const queryStringParts = {
      v: 1,
      tid: this.googleAnalyticsID,
      cid: spreadsheetRowID,
      t: 'event',
      ec: 'email',
      ea: 'open',
      el: spreadsheetRowID,
      cs: 'cover-letter',
      cm: 'email',
      cn: 'Cover Letter',
    };
    const query = queryString.stringify(queryStringParts);

    return `http://www.google-analytics.com/collect?${query}`;
  }
}

module.exports = CoverLetter;
