//Requires
// const { validationResult } = require('express-validator');
// const jwt = require('jsonwebtoken');
// const Excel = require('xlsx');

//Imports
var request = require('request');
const fs = require('fs-extra');
var pdf = require('html-pdf');

const hbs = require('handlebars');
const path = require('path');
const { registerSMS, registerEmail, changeStateMail, changeStateSMS } = require('../services/utils.js')
//constans send SMS
const { PATH_FILE_CONTRACT, NAME_FILE_CONTRACT, URL_SEND_SMS, SMS_CODES, AUTH_SEND_SMS, FROM_SEND_SMS, SG_MAIL_API_KEY, FROM_SEND_EMAIL, STATE, CUSTOMER_CONTRACT } = require('../utils/constants.js');

// send mails
const sgMail = require('@sendgrid/mail');

const generateContract = async (userDataContract) => {
  //Generamos Un pdf de prueba con datos de usuario
  var objPdf = { isPdf: false, path: '' };
  try {
    let outputContract = await compile(CUSTOMER_CONTRACT, userDataContract);
    var options = {
      format: 'Letter',
      header: {
        "height": "45mm",
        "contents": "<img src='https://avanzo.co/wp-content/uploads/2017/05/Logo-1.png' style=\"width:50%;\" />"
      },
    };

    let objToPdf = { html: outputContract, options: options, userName: userDataContract.name }
    let res = await nombre(objToPdf);
    if (res.filename) {
      objPdf.isPdf = true;
      objPdf.path = res.filename;
    }
    return objPdf;

  } catch (error) {
    console.log("E- 39 : ", error);
    return objPdf;
  }
}

const nombre = (objToPdf) => {
  return new Promise((resolve) => {
    try {
      console.log("#############################################");
      console.log("############### GENERANDO PDF ###############");
      console.log("#############################################");

      pdf.create(objToPdf.html, objToPdf.options).toFile(PATH_FILE_CONTRACT + objToPdf.userName + '_' + NAME_FILE_CONTRACT, function (err, res) {
        if (err) {
          console.log("#############################################");
          console.log("ERROR GENERANDO PDF")
          console.log("#############################################");
          console.log(err);
          resolve(err);
        } else {
          console.log("#############################################");
          console.log("PDF GENERADO")
          console.log("#############################################");
          resolve(res);
        }
      });
    } catch (error) {
      console.log("E-67 : ", error);

      resolve(error);
    }
  });
};

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
    return res.status(500).json("No es posible enviar mensaje de texto de momento.");
  };

};

const sendEmail = async (templateName, userData, attachmentName, attachmentType, subject, text, isCompilePdf) => {

  try {

    //let email = registerEmail(subject,text,templateName,attachmentName,attachmentType,pathFileToCompile,userData);
    var res = { status: 200, json: '' };

    sgMail.setApiKey(SG_MAIL_API_KEY);
    let output = await compile(templateName, userData);
    var pathFileCompiled = '';
    var fileToCompiles = null;

    let info = {
      from: FROM_SEND_EMAIL, // sender address
      to: userData.email, // list of receivers
      subject: subject, // Subject line
      text: text, // plain text body
      html: output, // html body,
    };

    if (isCompilePdf) {
      let pdfGenerated = await generateContract(userData);

      if (pdfGenerated.isPdf) {
        pathFileCompiled = pdfGenerated.path;
        let fileToCompile = await compileContract(pdfGenerated.path);
        if (fileToCompile) {
          info.attachments = [
            {
              content: fileToCompile,
              filename: attachmentName,
              type: attachmentType,
              disposition: 'attachment'
            }
          ]
        }
      } else {
        console.log("Error generando el pdf de contrato");
      }

    }
    let email = registerEmail(subject, text, templateName, attachmentName, attachmentType, pathFileCompiled, userData).then(/*email => console.log(email)*/);

    await sgMail.send(info).catch(err => {
      changeStateMail(email.insertId, STATE.FALSE);
      console.log("Error", err.response.body);
    });

  } catch (e) {
    console.log("E-119", e);
    return res.status(500).json("No es posible enviar mensaje de texto de momento.");
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
  try {
    const pdf = await fs.readFileSync(filePath).toString("base64");
    return pdf;
  } catch (error) {
    console.log("E- 153 : ", error);
  }

};

const downloadFile=async function (filePath) {

};

module.exports = {
  sendSMS, sendEmail,downloadFile
};