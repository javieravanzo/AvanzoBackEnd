//Requires
const pool = require('../config/database.js');
const helpers = require('../lib/helpers');
const sgMail = require('@sendgrid/mail');
const jwt = require('jsonwebtoken');
const {my_secret_key, base_URL} = require('../config/global');

//Services
const integrationRegister = async (identificationId, client, user, auth) => {

 
  
  try{
    
    const userRow = await pool.query('SELECT C.idClient, C.identificationId, U.idUser FROM Client C JOIN User U ON (C.idClient = U.Client_idClient) where C.identificationId = ? and U.email = ? ', [identificationId, user.email]);

    if(userRow.length === 0){

     /*const newClient = client;

      newClient.birthDate = new Date(client.birthDate.split('/')[2], client.birthDate.split('/')[1], client.birthDate.split('/')[0]);
      newClient.expeditionDate = new Date(client.expeditionDate.split('/')[2], client.expeditionDate.split('/')[1], client.expeditionDate.split('/')[0]);
      newClient.documentType = "Cédula";
      newClient.registeredBy = 1;
      newClient.registeredDate = new Date();
      newClient.Company_idCompany = 1;

      //New client
      const clientQuery = await pool.query('INSERT INTO Client SET ?', [newClient]);
      //console.log("clientQuery", clientQuery);  
        
      //Insert in user
      const newUser = user;
      newUser.registeredDate = new Date();
      newUser.Role_idRole = 4;
      newUser.status = true;
      newUser.Client_idClient = clientQuery.insertId;
      newUser.registeredBy = 1;
      newUser.registeredDate = new Date();
      newUser.createdDate = new Date();
      newUser.isConfirmed = true;
      const userQuery = await pool.query('INSERT INTO User SET ?', [newUser]);
      //console.log("userQuery", userQuery);
      
      //Account
      const companyQuery = await pool.query('SELECT C.maximumSplit, C.defaultAmount, C.approveHumanResources FROM Company C where C.idCompany = ?', [1]);
      //console.log("companyQuery", companyQuery);
      const newAccount = {maximumAmount: companyQuery[0].defaultAmount, partialCapacity: companyQuery[0].defaultAmount,
        documentsUploaded: false, montlyFee: 0, totalInterest: 0, totalFeeAdministration: 0,
        totalOtherCollection: 0, totalRemainder: 0, approveHumanResources: companyQuery[0].approveHumanResources === 1 ? true : false,
        registeredBy: 1, registeredDate: new Date(), Client_idClient: clientQuery.insertId};
      const accountQuery = await pool.query('INSERT INTO Account SET ?', [newAccount]);
      //console.log("accountQuery", accountQuery);
    
      //Insert into auth
      const newAuth = { User_idUser: userQuery.insertId, registeredBy: 1, registeredDate: new Date(),
                          createdDate: new Date()};
      newAuth.password = await helpers.encryptPassword("12345678");
      const authQuery = await pool.query('INSERT INTO Auth SET ?', [newAuth]);
      //console.log("authQuery", authQuery);

      //Check token_info
      const userRow = await pool.query('SELECT * FROM User U JOIN Auth A ON (A.User_idUser = U.idUser) where U.email = ?', [user.email]);
      //console.log("userRow", userRow);

      //Confirmation link
      const jwtoken = await jwt.sign({userRow}, my_secret_key, { expiresIn: '8h' });
      const userData = { idUser: userQuery.insertId, name: user.name, email: user.email, roleId: 4 };      
      const userAuth = { idAuth: authQuery.insertId, expiresOn: new Date(), registeredDate: new Date() };
      const new_date = new Date();
      new_date.setHours(new_date.getHours()+8);
      userAuth.expiresOn = new_date;     
      const result2 = await pool.query('UPDATE Auth set ? WHERE User_idUser = ?', [userAuth, userQuery.insertId]);
      return { status: 404, message: "El usuario ha sido registrado satisfactoriamente.",
              data: { access_token: jwtoken, expires_on: userAuth.expiresOn, user_info: userData
              }
            };*/
      return { status: 404, message: "El usuario no ha sido registrado."}               
    }else{

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
      return {status: 500, message: "El número se encuentra registrado en nuestro sistema."};
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