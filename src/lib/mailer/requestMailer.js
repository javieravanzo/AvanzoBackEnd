//Requires
const sgMail = require('@sendgrid/mail');
const path = require('path');
const fs = require('fs-extra');
const hbs = require('handlebars');

//Functions
const compile = async function(templateName, data){

  //Production
  const filePath = path.join(process.cwd(), '../files/templates', `${templateName}.hbs`);
  
  //Development
  //const filePath = path.join(process.cwd(), './files/templates', `${templateName}.hbs`);
  
  const html = await fs.readFile(filePath, 'utf-8');
  let template = hbs.compile(html);
  
  let result = template(data);

  return result;

};

//Global Mailer
const mailer = {};

mailer.requestAuthorizationMailer = async (userData, email, requestid) => {

  try{
    //Mailer
    sgMail.setApiKey(email_api_key);

    //Compile Template
    let output = await compile('approveRequest', userData);

    //Email Info
    let info = {
      from: 'operaciones@avanzo.co', // sender address
      to: email, // list of receivers
      subject: 'Avanzo (Créditos al instante) - Aprobación de solicitud  No. '  + requestid, // Subject line
      text: 'Avanzo Créditos', // plain text body
      html: output // html body
    };

    await sgMail.send(info, (err) => {
      if (err){
        return false;
      }
      return true;
    });

  }catch(e){
    console.log(e);
  }

};

module.exports = mailer;