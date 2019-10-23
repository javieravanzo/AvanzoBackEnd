//Requires
const pool = require('../config/database.js');
const helpers = require('../lib/helpers');
const sgMail = require('@sendgrid/mail');
const jwt = require('jsonwebtoken');
const {my_secret_key, base_URL} = require('../config/global');

//Services
const integrationRegister = async (identificationId, client, user, auth) => {
    
    try{
       
      //New Client
      const newClient = client;
      newClient.registeredDate = new Date();
      const clientQuery = await pool.query('INSERT INTO Client set ?', [newClient]);
      
      //Insert in user
      const newUser = user;
      newUser.registeredDate = new Date();
      newUser.Role_idRole = 4;
      newUser.status = false;
      newUser.Client_idClient = clientQuery[0].insertId;  
      
      const userUpdateQuery = await pool.query('INSERT INTO User SET ?', [newUser]);
      //Insert into auth
      const newAuth = { User_idUser: userRow[0].idUser, registeredBy: 1, registeredDate: new Date(),
                          createdDate: new Date()};
      newAuth.password = await helpers.encryptPassword("0123456789");
      const authQuery = await pool.query('INSERT INTO Auth SET ?', [newAuth]);
      
      //Confirmation link
      const jwtoken = await jwt.sign({userRow}, my_secret_key, { expiresIn: '30m' });       
      const url = base_URL + `Account/Confirm/${jwtoken}`;
      
      //Mailer
      sgMail.setApiKey('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');

        let output = `<div>
                <div class="header-confirmation">
                  <h2 class="confirmation-title">
                    Avanzo
                  </h2>
                  <h4 class="confirmation-subtitle">
                    Créditos al instante
                  </h4>
                </div>
            
                <hr/>
                
                <div class="greet-confirmation">
                  <h3 class="greet-title">
                    Hola, apreciado ${user.name}.
                  </h3>
                  <br/>
                  <img alt="userLogo" class="user-logo" src="imageURL"/>
                  <h3>
                    Gracias por registrarse en nuestra plataforma. Aquí te ofrecemos diferentes soluciones para tu vida.
                  </h3>
                </div>
            
                <div class="body-confirmation">
                  <h3 class="body-title">
                    Para continuar en el proceso, por favor realice la confirmación de su cuenta.
                  </h3>
                  <h3>
                    Confirme su cuenta, haciendo clic <a href="${url}">aquí</a>.
                  </h3>
                </div>
            
                <div class="footer-confirmation">
                  <h3 class="footer-title">
                    Gracias por confiar en nosotros.
                  </h3>
                  <div>
                    <img alt="avanzoLogo" class="avanzo-logo" src="logoURL"/>
                  </div>
                </div>
            
              </div>`;

        let info = {
            from: 'operaciones@avanzo.co', // sender address
            to: user.email, // list of receivers
            subject: 'Avanzo (Desembolsos al instante) - Confirmación de cuenta', // Subject line
            text: 'Hello world?', // plain text body
            html: output // html body
        };

        await sgMail.send(info);

        return {status: 200, message: "Ha sido registrado satisfactoriamente. Confirme su cuenta para poder iniciar sesión."};
  }catch(e){
    return {status: 500, message: "Error interno del servidor."};
  }    
};

module.exports = {
  integrationRegister
}