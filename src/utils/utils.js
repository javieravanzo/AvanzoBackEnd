//Requires
// const { validationResult } = require('express-validator');
// const jwt = require('jsonwebtoken');
// const Excel = require('xlsx');

//Imports
var request = require('request');
const fs = require('fs-extra');
const wkhtmltopdf = require('wkhtmltopdf');
const hbs = require('handlebars');
const path = require('path');
const { registerSMS, registerEmail, changeStateMail, changeStateSMS } = require('../services/utils.js')
//constans send SMS
const { URL_SEND_SMS, SMS_CODES, AUTH_SEND_SMS, FROM_SEND_SMS, SG_MAIL_API_KEY, FROM_SEND_EMAIL, STATE } = require('../utils/constants.js');

// send mails
const sgMail = require('@sendgrid/mail');



const sendSMS = async (to, body) => {

  try {
    let sms = registerSMS(to, body).then(/*sms => console.log(sms)*/);
    var options = {
      'method': 'POST',
      'url': URL_SEND_SMS,
      'headers': {
        'Authorization': AUTH_SEND_SMS,
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ "from": FROM_SEND_SMS, "to": "57" + to, "text": body })
    };
    request(options, function (error, response) {
      if (error) {
        changeStateSMS(sms.data.insertId, STATE.FALSE);
        throw new Error(error);
      }
      console.log("Respuesta de envio SMS : \n", response.body);
    });
  } catch (e) {
    console.log(e);
    res.status(500).json("No es posible enviar mensaje de texto de momento.");
  };

};

const sendEmail = async (templateName, userData, attachmentName, attachmentType, subject, text, pathFileToCompile) => {

  try {

    //let email = registerEmail(subject,text,templateName,attachmentName,attachmentType,pathFileToCompile,userData);

    let email = registerEmail(subject, text, templateName, attachmentName, attachmentType, pathFileToCompile, userData).then(/*email => console.log(email)*/);
    sgMail.setApiKey(SG_MAIL_API_KEY);
    let output = await compile(templateName, userData);

    //Generamos Un pdf de prueba con datos de usuario
    console.log("#############################################");
    console.log("############### GENERANDO PDF ###############");
    wkhtmltopdf(output, {
      output: 'demo.pdf',
      pageSize: 'letter'
    });
    console.log("#############################################");

    let fileToCompile = pathFileToCompile !== '' ? await compileContract(pathFileToCompile) : null;
    let info = {
      from: FROM_SEND_EMAIL, // sender address
      to: userData.email, // list of receivers
      subject: subject, // Subject line
      text: text, // plain text body
      html: output, // html body,
    };
    if (fileToCompile !== null) {
      info.attachments = [
        {
          content: fileToCompile,
          filename: attachmentName,
          type: attachmentType,
          disposition: 'attachment'
        }
      ]
    }

    await sgMail.send(info).catch(err => {
      console-log(email)
      changeStateMail(email.data.insertId, STATE.FALSE);
      console.log("Error", err);
    });

  } catch (e) {
    console.log(e);
    res.status(500).json("No es posible enviar mensaje de texto de momento.");
  };

};

const compile = async function (templateName, data) {

  //Production
  const filePath = path.join(process.cwd(), '../files/templates', `${templateName}.hbs`);

  //Development
  //const filePath = path.join(process.cwd(), './files/templates', `${templateName}.hbs`);

  const html = await fs.readFile(filePath, 'utf-8');
  //console.log("HTML Puro", html);
  let template = hbs.compile(html);
  //console.log("HTML Compilado", template);
  let result = template(data);
  //console.log("HTML Con estilos", result);

  return result;

};

const compileContract = async function (filePath) {
  const pdf = await fs.readFileSync(filePath).toString("base64");
  return pdf;
};
module.exports = {
  sendSMS, sendEmail
};