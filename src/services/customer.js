
//Requires
const pool = require('../config/database.js');
const jwt = require('jsonwebtoken');
const {my_secret_key, base_URL} = require('../config/global');
const sgMail = require('@sendgrid/mail');
const path = require('path');
const fs = require('fs-extra');

//Services
const getInitialsData = async (userId) => {

  //console.log("UI", userId);

  try {
      const userRow = await pool.query('SELECT ACCOUNT.idAccount, ACCOUNT.maximumAmount, ACCOUNT.partialCapacity FROM Client CLIENT JOIN User USER JOIN Account ACCOUNT ON (CLIENT.idClient = USER.Client_idClient AND ACCOUNT.Client_idClient = CLIENT.idClient ) where USER.idUser = ?', [userId]);
      //console.log("UR", userRow);
      const transactions = await pool.query('SELECT * FROM Transaction where Account_idAccount = ? ORDER BY createdDate DESC LIMIT 3', [userRow[0].idAccount]);
      //console.log("UT", transactions);
      const request = await pool.query('SELECT REQUEST.idRequest FROM Request REQUEST JOIN RequestState REQUESTSTATE ON (REQUESTSTATE.idRequestState = REQUEST.RequestState_idRequestState AND REQUESTSTATE.name <> ?) where REQUEST.Account_idAccount = ?', ["Desembolsada", userRow[0].idAccount]);
      // console.log("URE", request);
      if(userRow){
        return {status: 200, message: "", 
                data: {
                  maximumAmount: userRow[0].maximumAmount,
                  partialCapacity: userRow[0].partialCapacity,
                  transactions: JSON.stringify(transactions) !== '[]' ? transactions : [],
                  request: request.length 
                }
                };
      }else{
          return {status: 500, message: "Error interno del servidor."};
      }
  } catch(e) {
      return {status: 500, message: "Error interno del servidor."};
  }
};

const getRequestsData = async (userId) => {

  try {
      const userRow =  await pool.query('SELECT CLIENT.Company_idCompany, CLIENT.phoneNumber, CLIENT.accountBank, CLIENT.accountType, CLIENT.accountNumber, ACCOUNT.idAccount, ACCOUNT.maximumAmount, ACCOUNT.partialCapacity, ACCOUNT.documentsUploaded FROM Client CLIENT JOIN User USER JOIN Account ACCOUNT ON (CLIENT.idClient = USER.Client_idClient AND ACCOUNT.Client_idClient = CLIENT.idClient ) where USER.idUser = ?', [userId]);
      const companyInfo = await pool.query('SELECT maximumSplit FROM Company where idCompany = ?', [userRow[0].Company_idCompany]);
      const interest = await pool.query('SELECT interestValue FROM InterestRequest');
      const adminFee = await pool.query('SELECT managementPaymentValue FROM ManagementPayment');
      if(userRow){
        return {status: 200, message: "", 
                data: {
                  partialCapacity: userRow[0].partialCapacity,
                  maximumAmount: userRow[0].maximumAmount,
                  maximumSplit: companyInfo[0].maximumSplit,
                  haveDocumentsLoaded: userRow[0].documentsUploaded === 1 ? true : false,
                  interestValue: interest[0].interestValue,
                  adminValue: adminFee[0].managementPaymentValue,
                  otherCollectionValue: 0,
                  phoneNumber: userRow[0].phoneNumber,
                  accountNumber: userRow[0].accountNumber,
                  accountBank: userRow[0].accountBank,
                  accountType: userRow[0].accountType,
                }
               };
      }else{
        return {status: 500, message: "Error interno del servidor."};
      }
  }catch(e) {
    return {status: 500, message: "Error interno del servidor."};
  }
};

const getAllCustomers = async (companyId) => {

  try {
    const clientRow =  await pool.query('SELECT U.email, U.name, C.identificationId, C.lastName, C.profession, A.totalRemainder FROM Client C JOIN User U JOIN Account A JOIN Company CO ON (C.idClient = U.Client_idClient AND A.Client_idClient = C.idClient AND C.Company_idCompany = CO.idCompany) where C.Company_idCompany = ?', [companyId]);

    if(clientRow){
      return {status: 200, message: "", data: clientRow};
    }else{
      return {status: 500, message: "Error interno del servidor."};
    }
  }catch(e) {
    return {status: 500, message: "Error interno del servidor."};
  }
};

const getCustomersByAdmin = async ( ) => {

  try {
    const clientRow =  await pool.query('SELECT * FROM Client');
    
    if(clientRow){
      return {status: 200, message: "", data: clientRow};
    }else{
      return {status: 500, message: "Error interno del servidor."};
    }
  }catch(e) {
    return {status: 500, message: "Error interno del servidor."};
  }
};

const compileContract = async function(filePath){
  const html = await fs.readFile(filePath, 'utf-8');
  //let template = hbs.compile(html);
  //let  result = template(data);
  return html;
};

const createCustomer = async (body, user, company, adminId) => {
 
  //NewClient
  const {identificationId, lastName, documentType, phoneNumber, fixedNumber, birthDate, expeditionDate, 
         contractType, salary, entryDate, profession, genus, accountBank, accountType, accountNumber, idCompany} = body;
  
  const newClient = {identificationId, lastName, documentType, phoneNumber, fixedNumber, contractType, salary,
     entryDate, profession, genus, accountBank, accountType, accountNumber, birthDate, expeditionDate};

  //newClient.birthDate = new Date(birthDate.split('/')[2], birthDate.split('/')[1], birthDate.split('/')[0]);
  //newClient.expeditionDate = new Date(expeditionDate.split('/')[2], expeditionDate.split('/')[1], expeditionDate.split('/')[0]);

  newClient.registeredBy = adminId;
  newClient.registeredDate = new Date();
  newClient.Company_idCompany = idCompany;

  try{

    const clientQuery = await pool.query('INSERT INTO Client SET ?', [newClient]);

    //Insert in user
    const newUser = user;
    newUser.registeredBy = adminId;
    newUser.registeredDate = new Date();
    newUser.createdDate = new Date();
    newUser.Role_idRole = 4;
    newUser.status = false;
    newUser.Client_idClient = clientQuery.insertId;
    const userQuery = await pool.query('INSERT INTO User SET ?', [newUser]);

    //Create an account
    const companyQuery = await pool.query('SELECT C.maximumSplit, C.defaultAmount, C.approveHumanResources FROM Company C JOIN Client CL ON (C.idCompany = CL.Company_idCompany) where CL.idClient = ?', [clientQuery.insertId]);
    const newAccount = {maximumAmount: companyQuery[0].defaultAmount,
                        partialCapacity: companyQuery[0].defaultAmount,
                        documentsUploaded: false,
                        montlyFee: 0,
                        totalInterest: 0,
                        totalFeeAdministration: 0,
                        totalOtherCollection: 0,
                        totalRemainder: 0,
                        approveHumanResources: companyQuery[0].approveHumanResources === 1 ? true : false,
                        registeredBy: adminId,
                        registeredDate: new Date(),
                        Client_idClient: clientQuery.insertId};
    const accountQuery = await pool.query('INSERT INTO Account SET ?', [newAccount]);

    return {status: 200, message: "El cliente ha sido registrado exitosamente."};
  }catch(e){
    return {status: 500, message: "Error interno del servidor. Por favor, intente más tarde."};

  }    

};

const updateCustomers = async (body, user, adminId) => {
 
  //NewClient
  const {identificationId, lastName, phoneNumber, profession, idClient, idUser, idAccount, maximumAmount, montlyFee} = body;
  
  const newClient = {identificationId, phoneNumber, profession};
  newClient.registeredBy = adminId;
  newClient.registeredDate = new Date();

  try{

    const clientQuery = await pool.query('UPDATE Client SET ? where idClient = ?', [newClient, idClient]);

    //Insert in user
    const newUser = user;
    newUser.lastName = lastName;
    newUser.registeredBy = adminId;
    newUser.registeredDate = new Date();
    const userQuery = await pool.query('UPDATE User SET ? where idUser = ?', [newUser, idUser]);

    //Create an account
    const newAccount = {maximumAmount: maximumAmount,
                        montlyFee: montlyFee, 
                        registeredBy: adminId,
                        registeredDate: new Date()};
    const accountQuery = await pool.query('UPDATE Account SET ? where idAccount = ?', [newAccount, idAccount]);

    return {status: 200, message: "El cliente ha sido actualizado exitosamente."};
  }catch(e){
    console.log(e);
    return {status: 500, message: "Error interno del servidor. Por favor, intente más tarde."};

  }    

};

const createMultipleCustomers = async (customersData, adminId) => {

  try{
  //console.log("CD", customersData);
    
    for (let i in customersData){
      
      const companyNitQuery = await pool.query('SELECT C.idCompany FROM Company C where C.nit = ?', [customersData[i].EmpresaAsociada]);
      if (companyNitQuery !== '[]'){
        //Create the client
        let new_client = {
          lastName: customersData[i].Apellido,
          documentType: customersData[i].TipoDocumento,
          identificationId: customersData[i].NumeroDocumento,
          expeditionDate: customersData[i].FechaExpedicionCedula,
          birthDate: customersData[i].FechaNacimiento,
          phoneNumber: customersData[i].NumeroCelular,
          fixedNumber: customersData[i].NumeroFijo,
          genus: customersData[i].Genero,
          Company_idCompany: companyNitQuery[0].idCompany,
          registeredBy: adminId,
          registeredDate: new Date(),
        };

        //console.log("New Client", new_client);

        //Insert the client
        const clientQuery = await pool.query('INSERT INTO Client SET ?', [new_client]);
        //console.log("ClientQuery", clientQuery);

        //Insert in user
        const newUser = {
          name: customersData[i].Nombre,
          email: customersData[i].CorreoElectronico,
          registeredBy: adminId,
          registeredDate: new Date(),
          createdDate: new Date(),
          Role_idRole: 4,
          status: false,
          Client_idClient: clientQuery.insertId
        };
        
        //Insert the user
        const userQuery = await pool.query('INSERT INTO User SET ?', [newUser]);

        //Consult the company info
        const companyQuery = await pool.query('SELECT C.maximumSplit, C.defaultAmount, C.approveHumanResources FROM Company C JOIN Client CL ON (C.idCompany = CL.Company_idCompany) where CL.idClient = ?', [clientQuery.insertId]);
        
        console.log("MCA", customersData[i].CantidadMaximaPrestamo, customersData[i].CantidadMaximaPrestamo !== " ");
        console.log("FEE", customersData[i].CantidadMaximaCuotas);
        //Create the account
        const newAccount = {
          maximumAmount: customersData[i].CantidadMaximaPrestamo !== " " ? parseInt(customersData[i].CantidadMaximaPrestamo,10) : parseInt(companyQuery[0].defaultAmount, 10),
          partialCapacity: customersData[i].CantidadMaximaPrestamo !== " " ? parseInt(customersData[i].CantidadMaximaPrestamo, 10) : parseInt(companyQuery[0].defaultAmount, 10),
          documentsUploaded: false,
          montlyFee: customersData[i].CantidadMaximaCuotas !== " " ? parseInt(customersData[i].CantidadMaximaCuotas, 10) : parseInt(companyQuery[0].maximumSplit, 10),
          totalInterest: 0,
          totalFeeAdministration: 0,
          totalOtherCollection: 0,
          totalRemainder: 0,
          approveHumanResources: companyQuery[0].approveHumanResources === 1 ? true : false,
          registeredBy: adminId,
          registeredDate: new Date(),
          Client_idClient: clientQuery.insertId
        };
        
        const accountQuery = await pool.query('INSERT INTO Account SET ?', [newAccount]);
        return {status: 200, message: "Los usuarios han sido registrados a la plataforma satisfactoriamente."};
      }else{
        return {status: 404, message: "La empresa asociada no se encuentra dentro de nuestros registros."};
      }
    }    
  }catch(e){
    console.log(e);
    return {status: 500, message: "Error interno del servidor"};
  }
  

};

const getAllCustomerWithCompanies = async () =>{
  
  try {
    const clientRow =  await pool.query('SELECT U.idUser, U.name, U.email, U.createdDate, C.idClient, C.platformState, C.identificationId, U.lastName, C.profession, C.phoneNumber, C.fixedNumber, A.idAccount, A.totalRemainder, A.maximumAmount, A.montlyFee, CO.socialReason FROM Client C JOIN User U JOIN Account A JOIN Company CO ON (C.idClient = U.Client_idClient AND A.Client_idClient = C.idClient AND C.Company_idCompany = CO.idCompany)');
    if(clientRow){
      return {status: 200, data: clientRow};
    }else{
      return {status: 500, message: "Error interno del servidor."};
    }
  }catch(e) {
    console.log(e);
    return {status: 500, message: "Error interno del servidor."};
  }

};

const getCustomerToApprove = async () =>{
  
  try {
    const clientRow =  await pool.query('SELECT N.idNewClient, N.name, N.lastName, N.email, N.createdDate, N.identificationId, N.totalRemainder, CO.socialReason, CO.defaultAmount, CO.maximumSplit, CO.address, N.file1, N.file2, N.file3 FROM NewClient N JOIN Company CO ON (N.Company_idCompany = CO.idCompany) where (N.status = ?)', [0]);
    
    if(clientRow){
      return {status: 200, data: clientRow};
    }else{
      return {status: 500, message: "Error interno del servidor."};
    }
  }catch(e) {
    console.log(e);
    return {status: 500, message: "Error interno del servidor."};
  }

};

const getTransactionsByUsersId = async (userId) => {

  try {
    const transactionRow =  await pool.query('SELECT T.idTransaction, T.quantity, T.transactionType, T.createdDate FROM User U JOIN Client C JOIN Account A JOIN Transaction T ON (C.idClient = U.Client_idClient AND A.Client_idClient = C.idClient AND T.Account_idAccount = A.idAccount) where U.idUser = ?', [userId]);

    if(transactionRow){
      return {status: 200, data: transactionRow};
    }else{
      return {status: 500, message: "Error interno del servidor."};
    }
  }catch(e) {
    return {status: 500, message: "Error interno del servidor."};
  }

};

//Pendiente traer IDENTIFICATION ID
const approveCustomers = async (clientId, approve, adminId, observation, identificationId) => {
  
  try{   
    
    if(approve === "true"){
      console.log("CI", clientId);
      const updateNewClient = await pool.query('UPDATE NewClient SET status = ? where idNewClient = ?', [1, clientId]);

      const newClient = await pool.query('SELECT * FROM NewClient where idNewClient = ?', [clientId]);

      //DocumentClients
      const filesPath = {
        documentId: newClient[0].file1,
        photo: newClient[0].file2,
        paymentReport: newClient[0].file3
      };

      const fileQuery = await pool.query('INSERT INTO ClientDocuments SET ?', [filesPath]);

      //New Client
      const client = {
        identificationId: newClient[0].identificationId,
        documentType: "Cédula",
        phoneNumber: newClient[0].phoneNumber,
        Company_idCompany: newClient[0].Company_idCompany,
        registeredBy: 1,
        registeredDate: new Date(),
        platformState:  true,
        createdDate: new Date(),
        ClientDocuments_idClientDocuments: fileQuery.insertId,
      };
      
      const clientQuery = await pool.query('INSERT INTO Client SET ?', [client]);
      
      //Insert in user
      const newUser = {
        name: newClient[0].name,
        lastName: newClient[0].lastName,
        email: newClient[0].email,
        status: true,
        registeredBy: 1,
        registeredDate: new Date(),
        createdDate: new Date(),
        Role_idRole: 4,
        Client_idClient: clientQuery.insertId,
      };
      
      const userQuery = await pool.query('INSERT INTO User SET ?', [newUser]);
      
      //Create an account
      const companyQuery = await pool.query('SELECT C.maximumSplit, C.defaultAmount, C.approveHumanResources FROM Company C where C.idCompany = ?', [newClient[0].Company_idCompany]);
      const newAccount = {maximumAmount: companyQuery[0].defaultAmount,
                         partialCapacity: companyQuery[0].defaultAmount,
                         documentsUploaded: true,
                         montlyFee: companyQuery[0].maximumSplit,
                         totalInterest: 0, totalFeeAdministration: 0,
                         totalOtherCollection: 0, totalRemainder: 0,
                         approveHumanResources: companyQuery[0].approveHumanResources === 1 ? true : false,
                         registeredBy: 1, registeredDate: new Date(), Client_idClient: clientQuery.insertId};
      const accountQuery = await pool.query('INSERT INTO Account SET ?', [newAccount]);

      //Insert into auth
      const newAuth = { User_idUser: userQuery.insertId,
                        registeredBy: 1,
                        registeredDate: new Date(),
                        createdDate: new Date(),
                        password: newClient[0].password};
      
      const authQuery = await pool.query('INSERT INTO Auth SET ?', [newAuth]);
      
      //Confirmation link
      const consultEmail = await pool.query('SELECT U.email, U.name FROM Client C JOIN User U ON (C.idClient = U.Client_idClient) where C.idClient = ?', [clientQuery.insertId]);
      const userRow = await pool.query('SELECT C.idClient, C.identificationId, CO.socialReason, U.idUser FROM Client C JOIN User U JOIN Company CO ON (C.idClient = U.Client_idClient AND CO.idCompany = C.Company_idCompany ) where C.idClient = ?', [clientQuery.insertId]);
      const jwtoken = await jwt.sign({userRow}, my_secret_key, { expiresIn: '30m' });       
      const url = base_URL + `/Account/Confirm/${jwtoken}`;
      console.log(url.toString());
      
      //let contractFile = await compileContract("./files/contracts/contractoAvanzo.pdf");

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
                  Hola, apreciado/a ${consultEmail[0].name}.
                </h3>
                <br/>
                
                <h3>
                  Gracias por registrarte en nuestra plataforma. Aquí te ofrecemos diferentes soluciones para tu vida.
                </h3>
              </div>
          
              <div class="body-confirmation">
                <h3 class="body-title">
                  Te informamos que tu usuario ha sido aprobado para interactuar en la plataforma. 
                </h3>
                <h3>
                 Para continuar con el proceso, por favor realiza la confirmación de tu cuenta, haciendo clic <a href="${base_URL+ `/Account/Confirm/${jwtoken}`}">aquí</a>.
                </h3>
              </div>
          
              <div class="footer-confirmation">
                <h3 class="footer-title">
                  Gracias por confiar en nosotros.
                </h3>
              </div>
          
            </div>`;

      let info = {
          from: 'operaciones@avanzo.co', // sender address
          to: consultEmail[0].email, // list of receivers
          subject: 'Avanzo (Desembolsos al instante) - Confirmación de cuenta', // Subject line
          text: 'Hola', // plain text body
          html: output, // html body,
          
      };

      /*attachments: [
        {
          content: contractFile,
          filename: 'Contrato Avanzo.pdf',
          type: 'application/pdf',
          disposition: 'attachment',
          contentId: 'mytext'
        }
      ]*/

      await sgMail.send(info);

      return {status: 200, message: "El usuario ha sido aprobado exitosamente."};

    }else{

      const clientQuery = await pool.query('UPDATE NewClient SET status = ? where idClient = ?', [2, clientId]);
      
      return {status: 200, message: "El usuario ha sido rechazado exitosamente."};
    }
  }catch(e){
    console.log(e);
    return {status: 500, message: "Error interno del servidor."};
  }

};

const changeCustomersStatus = async (clientid, active) => {

  console.log("CI", clientid, active);
  
  try{   
    if(active === "true"){
      const clientQuery = await pool.query('UPDATE Client SET platformState = ? where idClient = ?', [true, clientid]);
      return {status: 200, message: {message:"El usuario ha sido activado exitosamente."}};
    }else{
      const clientQuery = await pool.query('UPDATE Client SET platformState = ? where idClient = ?', [false, clientid]);
      return {status: 200, message: {message: "El usuario ha sido inactivado exitosamente."}};
    }
  }catch(e){
    console.log(e);
    return {status: 500, message: "Error interno del servidor."};
  }

};

const makePayments = async(clientid, quantity) => {

  try{   

    //Account - Request
    const userRow =  await pool.query('SELECT ACCOUNT.idAccount, ACCOUNT.maximumAmount, ACCOUNT.partialCapacity, ACCOUNT.accumulatedQuantity, CLIENT.identificationId FROM Client CLIENT JOIN Account ACCOUNT ON (ACCOUNT.Client_idClient = CLIENT.idClient ) where CLIENT.idClient = ?', [clientid]);

    console.log("PC", userRow[0].maximumAmount, "AQ", userRow[0].accumulatedQuantity, "Q", quantity);

    const newPartialCapacity = (parseInt(userRow[0].maximumAmount, 10) - parseInt(userRow[0].accumulatedQuantity, 10) + parseInt(quantity, 10));
    console.log("NPC", newPartialCapacity);
    const newAccumulatedQuantity = (parseInt(userRow[0].accumulatedQuantity, 10) - parseInt(quantity, 10));
    console.log("NPC", newAccumulatedQuantity);
    const newAccount = { partialCapacity: newPartialCapacity, accumulatedQuantity: newAccumulatedQuantity };

    console.log("newAccount", newAccount);

    const updateAccount = await pool.query('UPDATE Account SET ? where Client_idClient = ?', [newAccount, clientid]);

    //Transaction
    const paymentTransaction = {quantity: quantity, transactionType: "Pago", createdDate: new Date(), registeredDate: new Date, Account_idAccount: userRow[0].idAccount}
    
    //Transaction Query
    const transactionQuery = await pool.query('INSERT INTO Transaction SET ?', [paymentTransaction]);
        

    //const clientQuery = await pool.query('UPDATE Client SET platformState = ? where idClient = ?', [true, clientid]);
    return {status: 200, message: {message:"El pago ha sido realizado exitosamente."}};
  //}else{
    //const clientQuery = await pool.query('UPDATE Client SET platformState = ? where idClient = ?', [false, clientid]);
    //return {status: 200, message: {message: "El pago no ha sido realizado exitosamente."}};
  //}
  }catch(e){
    console.log(e);
    return {status: 500, message: "Error interno del servidor."};
  }

};

module.exports = {
  getInitialsData, getRequestsData, getAllCustomers, createCustomer, createMultipleCustomers, 
  getAllCustomerWithCompanies, getTransactionsByUsersId, getCustomersByAdmin, getCustomerToApprove,
  approveCustomers, changeCustomersStatus, updateCustomers, makePayments
}