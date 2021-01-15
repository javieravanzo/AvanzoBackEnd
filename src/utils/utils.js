//Requires
// const { validationResult } = require('express-validator');
// const jwt = require('jsonwebtoken');
// const Excel = require('xlsx');

//Imports
var request = require('request');
const fs = require('fs-extra');
const hbs = require('handlebars');
const path = require('path');

//constans send SMS
const { URL_SEND_SMS,SMS_CODES,AUTH_SEND_SMS,FROM_SEND_SMS,SG_MAIL_API_KEY,FROM_SEND_EMAIL } = require('../utils/constants.js');

// send mails
const sgMail = require('@sendgrid/mail');
 


  const sendSMS = async (to,body) => {

    try {
       
      var options = {
        'method': 'POST',
        'url': URL_SEND_SMS,
        'headers': {
          'Authorization': AUTH_SEND_SMS,
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({"from":FROM_SEND_SMS,"to":"57"+to,"text":body})
      
      };
      request(options, function (error, response) {
        if (error) throw new Error(error);
        console.log("Respuesta de envio SMS : \n",response.body);
      });
      

    } catch(e) {
        console.log(e);
        res.status(500).json("No es posible enviar mensaje de texto de momento.");
    };

  };

  const sendEmail = async (templateName,userData,attachmentName,attachmentType,subject,text,pathFileToCompile) => {

    try {
       
      sgMail.setApiKey(SG_MAIL_API_KEY);
      let output = await compile(templateName, userData);
      
      let fileToCompile =pathFileToCompile !=='' ?  await compileContract(pathFileToCompile) : null ;

      let info = {
        from: FROM_SEND_EMAIL, // sender address
        to: userData.email, // list of receivers
        subject: subject, // Subject line
        text: text, // plain text body
        html: output, // html body,
      };
      if (fileToCompile !==null) {
        info.attachments =[
          {
            content: fileToCompile ,
            filename: attachmentName,
            type: attachmentType,
            disposition: 'attachment'
          }
        ] 
      }


      await sgMail.send(info).catch(err => {
        console.log("Error", err);
      });



    } catch(e) {
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
  sendSMS,sendEmail
};