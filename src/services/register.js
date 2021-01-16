//Requires
const pool = require('../config/database.js');
const helpers = require('../lib/helpers');
const sgMail = require('@sendgrid/mail');
const jwt = require('jsonwebtoken');
const { my_secret_key, base_URL, front_URL, base_URL_test } = require('../config/global');

const { sendEmail, sendSMS } = require('../utils/utils.js');
const { ENVIRONMENT, SMS_CODES, ATTACHMENT_TYPES, PATH_FILE_CONTRACT, NAME_FILE_CONTRACT, PENDING_APPROVAL,
  ACCOUNT_CONFIRMATION } = require('../utils/constants.js');
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
        createdDate: new Date().toLocaleString("es-CO", { timeZone: "America/Bogota" })
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
    await pool.query('START TRANSACTION');

    const userRow = await pool.query('SELECT C.idClient, C.identificationId, CO.socialReason, U.idUser, U.status FROM Client C JOIN User U JOIN Company CO ON (C.idClient = U.Client_idClient AND CO.idCompany = C.Company_idCompany ) where (C.identificationId = ? OR U.email = ?)', [client.identificationId, user.email]);
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
        // createdDate: new Date().toLocaleString("es-CO", {timeZone: "America/Bogota"}),
        //registeredDate: new Date().toLocaleString("es-CO", {timeZone: "America/Bogota"}),
        registeredBy: 0,
        Company_idCompany: client.Company_idCompany,
        city: client.city,
        birthDate: '2020-10-24',//client.birthDate,
        CompanySalaries_idCompanySalaries: client.salary,
        Role_idRole: 4,
        gender: client.gender,
        vehicle: client.vehicle,
        vehicle_type: client.vehicle_type,
        license_plate_vehicle: client.license_plate_vehicle,
        clie_address: client.clie_address,
        clie_from: client.clie_from
      };
      console.log(preClient);
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
        const smsCodesQuery = await pool.query('SELECT sms_co_id,sms_co_body FROM avanzo.sms_codes WHERE sms_co_id = ? ', [SMS_CODES.CUSTOMER_PENDING_APPROVAL]);
        sendSMS(preClient.phoneNumber, smsCodesQuery[0].sms_co_body);
      }
      await pool.query('COMMIT');

      return { status: 200, message: "Has sido registrado satisfactoriamente. Entrarás a un proceso de aprobación interno y serás informado a través de correo electrónico." };
      
    } else {

      if (parseInt(consultUser[0].status, 10) === 0) {

        //DocumentClients
        const filesPath = files;
        const fileQuery = await pool.query('INSERT INTO ClientDocuments SET ?', [filesPath]);

        //New Client
        const newClient = client;
        newClient.registeredBy = 1;
        newClient.documentType = "Cédula";
        newClient.isApproved = false;
        newClient.entryDate = new Date().toLocaleString("es-CO", { timeZone: "America/Bogota" });
        newClient.registeredDate = new Date().toLocaleString("es-CO", { timeZone: "America/Bogota" });
        newClient.createdDate = new Date().toLocaleString("es-CO", { timeZone: "America/Bogota" });
        newClient.ClientDocuments_idClientDocuments = fileQuery.insertId;

        const clientQuery = await pool.query('UPDATE Client SET ? where identificationId = ?', [newClient, client.identificationId]);

        //Insert in user
        const newUser = user;
        newUser.registeredBy = 1;
        newUser.registeredDate = new Date().toLocaleString("es-CO", { timeZone: "America/Bogota" });
        newUser.createdDate = new Date().toLocaleString("es-CO", { timeZone: "America/Bogota" });
        newUser.Role_idRole = 4;
        newUser.status = true;
        const userQuery = await pool.query('UPDATE User SET ? where email = ?', [newUser, user.email]);


        //Insert into auth
        const newAuth = {
          User_idUser: consultUser[0].idUser, registeredBy: 1, registeredDate: new Date().toLocaleString("es-CO", { timeZone: "America/Bogota" }),
          createdDate: new Date().toLocaleString("es-CO", { timeZone: "America/Bogota" })
        };
        newAuth.password = await helpers.encryptPassword(auth.password);
        const authQuery = await pool.query('INSERT INTO Auth SET ?', [newAuth]);
        await pool.query('COMMIT');

        return { status: 200, message: "Tu usuario ha sido actualizado exitosamente. Entrarás a un proceso de aprobación interno y serás informado a través de correo electrónico." };

      } else {

        return { status: 400, message: "Tu usuario ya ha sido registrado anteriormente en la plataforma con tu cédula o con tu correo. Inicia sesión o espera el correo de aprobación de tu cuenta." };

      }
    }
  } catch (e) {
    console.log("E", e);
    await pool.query('ROLLBACK');

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
        createdDate: new Date().toLocaleString("es-CO", { timeZone: "America/Bogota" })
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