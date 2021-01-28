//Requires
const pool = require('../config/database.js');
const helpers = require('../lib/helpers');
const sgMail = require('@sendgrid/mail');
const jwt = require('jsonwebtoken');
const { my_secret_key, base_URL, front_URL, base_URL_test } = require('../config/global');

const { sendEmail, sendSMS } = require('../utils/utils.js');
const { ENVIRONMENT, SMS_CODES, PENDING_APPROVAL, PRE_CLIENT_STATES } = require('../utils/constants.js');
//Services
const registerCustomer = async (identificationId, client, user, auth) => {

  try {

    const userRow = await pool.query('SELECT C.idClient, C.identificationId, CO.socialReason, U.idUser FROM Client C JOIN User U JOIN Company CO ON (C.idClient = U.Client_idClient AND CO.idCompany = C.Company_idCompany ) where C.identificationId = ?', [identificationId]);
    //console.log("UserREGISTERRow", userRow);

    if (JSON.stringify(userRow) != '[]') {

      //New Client
      const newClient = client;
      newClient.registeredDate = new Date().toLocaleString("es-CO", { timeZone: "America/Bogota" });
      clientQuery = await pool.query('UPDATE Client set ? WHERE identificationId = ?', [newClient, identificationId]);

      //Insert in user
      const newUser = user;
      newUser.registeredDate = new Date().toLocaleString("es-CO", { timeZone: "America/Bogota" });
      newUser.Role_idRole = 4;
      newUser.status = true;
      newUser.Client_idClient = userRow[0].idClient;

      const userUpdateQuery = await pool.query('UPDATE User SET ? WHERE Client_idClient = ?', [newUser, userRow[0].idClient]);
      //Insert into auth
      const newAuth = {
        User_idUser: userRow[0].idUser, registeredBy: 1, registeredDate: new Date().toLocaleString("es-CO", { timeZone: "America/Bogota" }),
        createdAt: new Date().toLocaleString("es-CO", { timeZone: "America/Bogota" })
      };
      newAuth.password = await helpers.encryptPassword(auth.password);
      const authQuery = await pool.query('INSERT INTO Auth SET ?', [newAuth]);

      //Confirmation link
      const jwtoken = await jwt.sign({ userRow }, my_secret_key, { expiresIn: '30m' });
      const url = base_URL + `/Account/Confirm/${jwtoken}`;
      //console.log(url);

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
                  Hola, apreciado/a ${user.name}.
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
                  Confirme su cuenta, haciendo clic <a href="${base_URL + `/Account/Confirm/${jwtoken}`}">aquí</a>.
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
        subject: 'Avanzo (Créditos al instante) - Confirmación de cuenta', // Subject line
        text: 'Avanzo', // plain text body
        html: output // html body
      };

      await sgMail.send(info);

      return { status: 200, message: "Ha sido registrado satisfactoriamente. Confirme su cuenta para poder iniciar sesión." };
    } else {
      return { status: 500, message: "Tu usuario no se encuentra registrado en nuestro sistema. Por favor, solicita a tu empresa la inscripción en Avanzo." };
    }
  } catch (e) {
    return { status: 500, message: "Error interno del servidor." };
  }
};

const newPreregister = async (client, user, files, auth) => {

  let consultUser = [];

  try {


    const userPre = await pool.query(`SELECT * FROM avanzo.NewClient nc WHERE nc.status <> ${PRE_CLIENT_STATES.REJECTED} AND (nc.email = ? OR nc.identificationId = ? OR nc.phoneNumber = ?) `, [user.email, client.identificationId, client.phoneNumber]);
    if (JSON.stringify(userPre) === '[]') {
      const userRow = await pool.query('SELECT C.idClient, C.identificationId, CO.socialReason, U.idUser, U.status,U.email FROM Client C JOIN User U JOIN Company CO ON (C.idClient = U.Client_idClient AND CO.idCompany = C.Company_idCompany ) where (C.identificationId = ? OR U.email = ?)', [client.identificationId, user.email]);
      //console.log("UR", userRow);
      consultUser = userRow;

      if (JSON.stringify(userRow) === '[]') {

        //Select the totalRemainder by Company
        const companyQuery = await pool.query('SELECT C.maximumSplit, C.defaultAmount, C.approveHumanResources FROM Company C where C.idCompany = ?', [client.Company_idCompany]);

        //Create password
        const newPassword = await helpers.encryptPassword(auth.password);

        //Create client
        const preClient = {
          name: user.name,
          lastName: user.lastName,
          documentType: client.documentType,
          identificationId: client.identificationId,
          phoneNumber: client.phoneNumber,
          email: user.email,
          password: newPassword,
          file1: files.documentId,
          file2: null,
          file3: files.paymentReport,
          //status: 0 = Created, 1 = Approved, 2 = Rejected.
          status: 0,
          totalRemainder: companyQuery[0].defaultAmount,
          // createdAt: new Date().toLocaleString("es-CO", {timeZone: "America/Bogota"}),
          //registeredDate: new Date().toLocaleString("es-CO", {timeZone: "America/Bogota"}),
          registeredBy: 0,
          Company_idCompany: client.Company_idCompany,
          city: client.city,
          birthDate: client.birthDate,
          CompanySalaries_idCompanySalaries: client.salary,
          Role_idRole: 4,
          gender: client.gender,
          vehicle: client.vehicle,
          vehicle_type: client.vehicle_type,
          license_plate_vehicle: client.license_plate_vehicle,
          clie_address: client.clie_address,
          clie_from: client.clie_from
        };
        const preClientQuery = await pool.query('INSERT INTO NewClient SET ?', [preClient]);


        var subject = 'Avanzo (Créditos al instante) - Cuenta pendiente de aprobación';
        var text = 'Avanzo';
        var template = PENDING_APPROVAL;
        let userData = {
          email: preClient.email,
          name: preClient.name,
          url: front_URL,
          base_URL_test: base_URL + "/confirmation.png",
          footer: base_URL + "/footer.png",
        };

        sendEmail(template, userData, '', '', subject, text, '')
        //Send SMS 
        if (ENVIRONMENT === 'production') {
          const smsCodesQuery = await pool.query('SELECT sms_co_id,sms_co_body FROM avanzo.SmsCodes WHERE sms_co_id = ? ', [SMS_CODES.CUSTOMER_PENDING_APPROVAL]);
          sendSMS(preClient.phoneNumber, smsCodesQuery[0].sms_co_body);
        }

        return { status: 200, message: "Has sido registrado satisfactoriamente. Entrarás a un proceso de aprobación interno y serás informado a través de correo electrónico." };

      } 
      messages = [];
       console.log(userRow[0].email,user.email);
       console.log(userRow[0].identificationId , client.identificationId);

       if (userRow[0].email === user.email) {
        messages.push("Este email ya esta registrado");
      }
      if (userRow[0].identificationId === client.identificationId) {
        messages.push("Este numero de documento ya esta registrado");
      }
      return { status: 500, message: messages };


    } else {
      console.log(userPre[0].phoneNumber, user.phoneNumber);
      messages = [];
      if (userPre[0].email === user.email) {
        messages.push("Este email ya esta registrado");
      }
      if (userPre[0].identificationId === client.identificationId) {
        messages.push("Este numero de documento ya esta registrado");
      }
      if (userPre[0].phoneNumber === client.phoneNumber) {
        messages.push("Este numero de telefono ya esta registrado");
      }
      return { status: 404, message: messages };

    }
  } catch (e) {
    console.log("E", e);

    return { status: 500, message: { message: "Error interno del servidor." } };
  }

};

const registerAdmins = async (admin, user, auth) => {

  //NewObject
  const newAdmin = admin;
  const newUser = user;

  try {

    //Consult administrator
    const userRow = await pool.query('SELECT * FROM User U JOIN Administrator A ON (U.Administrator_idAdministrator = A.idAdministrator) where (U.email = ? AND A.identificationId = ?)', [user.email, admin.identificationId]);

    if (JSON.stringify(userRow) != '[]') {

      const adminQuery = await pool.query('UPDATE Administrator SET ? WHERE idAdministrator = ?', [newAdmin, userRow[0].Administrator_idAdministrator]);

      //Insert in user
      newUser.registeredDate = new Date().toLocaleString("es-CO", { timeZone: "America/Bogota" });
      newUser.status = true;
      const result2 = await pool.query('UPDATE User SET ? WHERE idUser = ?', [newUser, userRow[0].idUser]);

      //Auth
      const newAuth = {
        User_idUser: userRow[0].idUser, registeredBy: 1, registeredDate: new Date().toLocaleString("es-CO", { timeZone: "America/Bogota" }),
        createdAt: new Date().toLocaleString("es-CO", { timeZone: "America/Bogota" })
      };
      newAuth.password = await helpers.encryptPassword(auth.password);
      const result3 = await pool.query('INSERT INTO Auth SET ?', [newAuth]);

      //Confirmation link
      const jwtoken = await jwt.sign({ userRow }, my_secret_key, { expiresIn: '30m' });
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
                    Hola, apreciado/a ${user.name}.
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
                    Confirme su cuenta, haciendo clic <a href="${base_URL + `/Account/Confirm/${jwtoken}`}">aquí</a>.
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
        subject: 'Avanzo (Créditos al instante) - Confirmación de cuenta', // Subject line
        text: 'Hello world?', // plain text body
        html: output // html body
      };

      await sgMail.send(info);

      return { status: 200, message: "Ha sido registrado satisfactoriamente. Hemos envíado un correo electrónico que le permitirá confirmar su cuenta e iniciar sesión." };
    } else {
      return { status: 400, message: "El correo electrónico y el número de documento no se encuentran registrados en nuestro sistema." };
    }
  } catch (e) {
    throw (e);
    //return {status: 500, message: "Error interno del servidor."};
  }
};

module.exports = {
  registerCustomer, registerAdmins, newPreregister
}