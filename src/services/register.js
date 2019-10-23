//Requires
const pool = require('../config/database.js');
const helpers = require('../lib/helpers');
const sgMail = require('@sendgrid/mail');
const jwt = require('jsonwebtoken');
const {my_secret_key, base_URL} = require('../config/global');

//Services
const registerCustomer = async (identificationId, client, user, auth) => {
    
    try{

        const userRow = await pool.query('SELECT C.idClient, C.identificationId, CO.socialReason, U.idUser FROM Client C JOIN User U JOIN Company CO ON (C.idClient = U.Client_idClient AND CO.idCompany = C.Company_idCompany ) where C.identificationId = ?', [identificationId]);
        
        if(JSON.stringify(userRow)  != '[]'){
            
          //New Client
          const newClient = client;
          newClient.registeredDate = new Date();
          clientQuery = await pool.query('UPDATE Client set ? WHERE identificationId = ?', [newClient, identificationId]);
          
          //Insert in user
          const newUser = user;
          newUser.registeredDate = new Date();
          newUser.Role_idRole = 4;
          newUser.status = true;
          newUser.Client_idClient = userRow[0].idClient;  
          
          const userUpdateQuery = await pool.query('UPDATE User SET ? WHERE Client_idClient = ?', [newUser, userRow[0].idClient]);
          //Insert into auth
          const newAuth = { User_idUser: userRow[0].idUser, registeredBy: 1, registeredDate: new Date(),
                              createdDate: new Date()};
          newAuth.password = await helpers.encryptPassword(auth.password);
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
        }else{
          return {status: 500, message: "Tu usuario no se encuentra registrado en nuestro sistema. Por favor, solicita a tu empresa la inscripción en Avanzo."};
        }        
    }catch(e){
      return {status: 500, message: "Error interno del servidor."};
    }    
};

const registerAdmins = async (admin, user, auth) => {
    
    //NewObject
    const newAdmin = admin;
    const newUser = user;

    try{

      //Consult administrator
      const userRow = await pool.query('SELECT * FROM User U JOIN Administrator A ON (U.Administrator_idAdministrator = A.idAdministrator) where (U.email = ? AND A.identificationId = ?)', [user.email,admin.identificationId]);
     
      if(JSON.stringify(userRow)  != '[]'){     
      
        const adminQuery = await pool.query('UPDATE Administrator SET ? WHERE idAdministrator = ?', [newAdmin, userRow[0].Administrator_idAdministrator]);

        //Insert in user
        newUser.registeredDate = new Date(); 
        newUser.status = true;
        const result2 = await pool.query('UPDATE User SET ? WHERE idUser = ?', [newUser, userRow[0].idUser]);

        //Auth
        const newAuth = { User_idUser: userRow[0].idUser, registeredBy: 1, registeredDate: new Date(),
                          createdDate: new Date()};
        newAuth.password = await helpers.encryptPassword(auth.password);
        const result3 = await pool.query('INSERT INTO Auth SET ?', [newAuth]);
        
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

        return {status: 200, message: "Ha sido registrado satisfactoriamente. Hemos envíado un correo electrónico que le permitirá confirmar su cuenta e iniciar sesión."};
      }else{
        return {status: 400, message: "El correo electrónico y el número de documento no se encuentran registrados en nuestro sistema."};
      }
  }catch(e){
    throw(e);
    //return {status: 500, message: "Error interno del servidor."};
  }    
};
 
module.exports = {
    registerCustomer, registerAdmins
}