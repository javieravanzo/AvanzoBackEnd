//Requires
const pool = require('../config/database.js');
const jwt = require('jsonwebtoken');
const {my_secret_key, base_URL} = require('../config/global');
//const helpers = require('../lib/helpers');
//const sgMail = require('@sendgrid/mail');

//Services
const integrationRegister = async (identificationId, client, user, auth) => {
  
  try{
     console.log("U", identificationId, user.email, client.phoneNumber);    
   const userRow = await pool.query('SELECT C.idClient, C.identificationId, U.idUser FROM Client C JOIN User U ON (C.idClient = U.Client_idClient) where C.identificationId = ?', [identificationId]);
    //console.log("Row", userRow);
    if(userRow.length !== 0){

      const newUser = user;
      newUser.registeredBy = 1;
      newUser.registeredDate = new Date();

      const updateUser = await pool.query('UPDATE User SET ? WHERE idUser = ?', [newUser, userRow[0].idUser]);

      const newClient = client;

      newClient.birthDate = new Date(client.birthDate.split('-')[2], client.birthDate.split('-')[1], client.birthDate.split('-')[0]);
      newClient.expeditionDate = new Date(client.expeditionDate.split('-')[2], client.expeditionDate.split('-')[1], client.expeditionDate.split('-')[0]);
      newClient.documentType = "Cédula";
      newClient.registeredBy = 1;
      newClient.registeredDate = new Date();

      const updateClient = await pool.query('UPDATE Client SET ? WHERE identificationId = ?', [newClient, identificationId]);
      console.log("up", updateClient);

      //Check token_info
      const userRow = await pool.query('SELECT * FROM User U JOIN Auth A ON (A.User_idUser = U.idUser) where U.email = ?', [user.email]);

      //Confirmation link
      const jwtoken = await jwt.sign({userRow}, my_secret_key, { expiresIn: '8h' });

      const userAuth = { idAuth: userRow[0].idAuth, expiresOn: new Date(), registeredDate: new Date() };
      const new_date = new Date();
      new_date.setHours(new_date.getHours()+8);
      userAuth.expiresOn = new_date;

      delete userRow[0].password;
      delete userRow[0].Administrator_idAdministrator;
      delete userRow[0].Client_idClient;
      delete userRow[0].Company_idCompany;
      delete userRow[0].expiresOn;
      delete userRow[0].idAuth;
      delete userRow[0].idUser;
      delete userRow[0].isConfirmed;
      delete userRow[0].registeredBy;


      return { status: 200, message: "El usuario ya se encuentra registrado.",
              data: { access_token: jwtoken, expires_on: userAuth.expiresOn, user_info: userRow[0]}
            }; 

    }else{

      return { status: 404, message: "El usuario no ha sido registrado en la plataforma."}
      
    }  
  }catch(e){
    console.log(e);
    return {status: 500, message: "Error interno del servidor."};
  }
     
};

const integrationCheckPhone = async (phoneNumber) => {

  try{
    const clientQuery = await pool.query('SELECT idClient FROM Client where phoneNumber = ?', [phoneNumber]);
    if(clientQuery.length>0){
      return {status: 200, message: "El número se encuentra registrado en nuestro sistema."};
    }else{
      return {status: 200, message: "El número no se encuentra registrado en nuestro sistema."}
    }
  }catch(e) {
    return {status: 500, message: "No es posible realizar la validación del número en este momento."};
  };

};

module.exports = {
  integrationRegister, integrationCheckPhone
}
