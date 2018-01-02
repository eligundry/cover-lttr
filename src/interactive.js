const CoverLetter = require('./cover.js');
const readFile = require('fs-readfile-promise');
const inquirer = require('inquirer');

const interactiveSend = () => {
  const configPromise = readFile('./example/config.json')
    .then(config => {
      return JSON.parse(config)
    });

  const inquirerPromise = inquirer.prompt([
    {
      type: 'input',
      name: 'company',
      message: 'What company are we applying to?',
    },
    {
      type: 'input',
      name: 'to',
      message: 'What email should we send this application to?',
    },
    {
      type: 'input',
      name: 'spreadsheetRowID',
      message: 'What is the row number of this employer in your spreadsheet?',
    },
  ]);

  Promise.all([configPromise, inquirerPromise])
    .then(results => {
      let [config, answers] = [...results];
      Object.assign(config, answers, {
        templateVariables: answers.company,
      });

      const coverLetter = new CoverLetter(config);
      coverLetter.sendLetter(answers.to);
    });
};

interactiveSend();
