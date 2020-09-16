
//Requires
const pool = require('../config/database.js');
const jwt = require('jsonwebtoken');
const {my_secret_key, base_URL, front_URL, base_URL_test} = require('../config/global');
const sgMail = require('@sendgrid/mail');
const path = require('path');
const fs = require('fs-extra');
const hbs = require('handlebars');

//Functions
const compileContract = async function(filePath){
  const pdf = await fs.readFileSync(filePath).toString("base64");
  return pdf;
};

const compile = async function(templateName, data){

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

//Services
const getInitialsData = async (userId) => {

  //console.log("UI", userId);

  try {
      const userRow = await pool.query('SELECT ACCOUNT.idAccount, ACCOUNT.maximumAmount, ACCOUNT.partialCapacity FROM Client CLIENT JOIN User USER JOIN Account ACCOUNT ON (CLIENT.idClient = USER.Client_idClient AND ACCOUNT.Client_idClient = CLIENT.idClient ) where USER.idUser = ?', [userId]);
      //console.log("UR", userRow);
      const transactions = await pool.query('SELECT * FROM Transaction where Account_idAccount = ? ORDER BY createdDate DESC LIMIT 3', [userRow[0].idAccount]);
      //console.log("UT", transactions);
      const request = await pool.query('SELECT REQUEST.idRequest FROM Request REQUEST JOIN RequestState REQUESTSTATE ON (REQUESTSTATE.idRequestState = REQUEST.RequestState_idRequestState AND REQUESTSTATE.idRequestState < ?) where REQUEST.Account_idAccount = ?', [5, userRow[0].idAccount]);
      //console.log("URE", request);
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
      const userRow =  await pool.query('SELECT CLIENT.Company_idCompany, CLIENT.phoneNumber, CLIENT.identificationId, CLIENT.accountBank, CLIENT.accountType, CLIENT.accountNumber, ACCOUNT.idAccount, ACCOUNT.maximumAmount, ACCOUNT.montlyFee, ACCOUNT.partialCapacity, ACCOUNT.documentsUploaded FROM Client CLIENT JOIN User USER JOIN Account ACCOUNT ON (CLIENT.idClient = USER.Client_idClient AND ACCOUNT.Client_idClient = CLIENT.idClient ) where USER.idUser = ?', [userId]);
      const companyInfo = await pool.query('SELECT workingSupport, paymentSupport FROM Company where idCompany = ?', [userRow[0].Company_idCompany]);
      
      //Interest
      //const interest = await pool.query('SELECT indicatorName, indicatorValue, indicatorRate FROM Indicators where indicatorName = ?', "Interest" );
      
      /*for (let i = 0; i<indicators.length; i++){
        if(indicators[i].indicatorName)
      }¨*/

      //ManagementValue
      //const adminFee = await pool.query('SELECT indicatorValue FROM Indicators where indicatorName = ?', "Management" );
      
      if(userRow){
        return {status: 200, message: "", 
                data: {
                  partialCapacity: userRow[0].partialCapacity,
                  maximumAmount: userRow[0].maximumAmount,
                  maximumSplit: userRow[0].montlyFee,
                  workingSupport: companyInfo[0].workingSupport,
                  paymentSupport: companyInfo[0].paymentSupport,
                  haveDocumentsLoaded: userRow[0].documentsUploaded === 1 ? true : false,
                  //interestValue: interest[0].interestValue,
                  //adminValue: adminFee[0].managementPaymentRate,
                  otherCollectionValue: 0,
                  phoneNumber: userRow[0].phoneNumber,
                  idCompany: userRow[0].Company_idCompany,
                  identificationId: userRow[0].identificationId,
                  accountNumber: userRow[0].accountNumber,
                  accountBank: userRow[0].accountBank,
                  accountType: userRow[0].accountType,
                }
               };
      }else{
        return {status: 500, message: "Error interno del servidor."};
      }
  }catch(e) {
    console.log(e);
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

const createCustomer = async (body, user, company, adminId) => {
 
  //NewClient
  const {identificationId, lastName, documentType, phoneNumber, fixedNumber, birthDate, expeditionDate, 
         contractType, salary, entryDate, profession, genus, accountBank, accountType, accountNumber, idCompany, companyPayment} = body;
  
  const newClient = {identificationId, documentType, phoneNumber, fixedNumber, contractType, salary,
     entryDate, profession, genus, accountBank, accountType, accountNumber, birthDate, expeditionDate };

  //newClient.birthDate = new Date(birthDate.split('/')[2], birthDate.split('/')[1], birthDate.split('/')[0]);
  //newClient.expeditionDate = new Date(expeditionDate.split('/')[2], expeditionDate.split('/')[1], expeditionDate.split('/')[0]);

  newClient.registeredBy = adminId;
  newClient.registeredDate = new Date();
  newClient.Company_idCompany = idCompany;
  newClient.CompanySalaries_idCompanySalaries = companyPayment;

  try{

    const clientQuery = await pool.query('INSERT INTO Client SET ?', [newClient]);

    //Insert in user
    const newUser = user;
    newUser.lastName = lastName;
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
    console.log("E", e);
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

    const consultAccumulated = await pool.query('SELECT accumulatedQuantity FROM Account where idAccount = ?', [idAccount]);

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
  
    for (let i in customersData){

      const companyNitQuery = await pool.query('SELECT C.idCompany FROM Company C where C.nit = ?', [customersData[i].EmpresaAsociada]);
      if (companyNitQuery !== '[]'){
        
        //Create the client
        let new_client = {
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

        //Insert the client
        const clientQuery = await pool.query('INSERT INTO Client SET ?', [new_client]);

        //Insert in user
        const newUser = {
          lastName: customersData[i].Apellido,
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
        
        //Create the account
        const newAccount = {
          maximumAmount: customersData[i].CantidadMaximaPrestamo !== " " ? parseInt(customersData[i].CantidadMaximaPrestamo,10) : parseInt(companyQuery[0].defaultAmount, 10),
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

      }else{
        return {status: 404, message: "La empresa asociada no se encuentra dentro de nuestros registros."};
      } 
    } 
    return {status: 200, message: "Los usuarios han sido registrados a la plataforma satisfactoriamente."}   
  }catch(e){
    console.log(e);
    return {status: 500, message: "Error interno del servidor"};
  }
  

};

const getAllCustomerWithCompanies = async () =>{
  
  try {
    const clientRow =  await pool.query('SELECT U.idUser, U.name, U.email, U.createdDate, C.idClient, C.platformState, C.identificationId, U.lastName, C.profession, C.phoneNumber, C.fixedNumber, A.idAccount, A.totalRemainder, A.maximumAmount, A.montlyFee, CO.socialReason FROM Client C JOIN User U JOIN Account A JOIN Company CO ON (C.idClient = U.Client_idClient AND A.Client_idClient = C.idClient AND C.Company_idCompany = CO.idCompany) where C.isDeleted = ?', [false]);
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
    const clientRow =  await pool.query('SELECT N.idNewClient, N.phoneNumber, N.name, N.lastName, N.email, N.createdDate, N.identificationId, N.totalRemainder, CO.socialReason, CO.defaultAmount, CO.maximumSplit, CO.address, CO.idCompany, N.file1, N.file2, N.file3 FROM NewClient N JOIN Company CO ON (N.Company_idCompany = CO.idCompany) where (N.status = ?)', [0]);
    
    //const cycles = await pool.query('SELECT CS.idCompanySalaries, CS.companyRateName, CS.companyReportDates, CS.companyPaymentDates FROM CompanySalaries CS JOIN Company_has_CompanySalaries CHS ON (CHS.CompanySalaries_idCompanySalaries = CS.idCompanySalaries) where (CHS.Company_idCompany = ?)', clientRow[0].idCompany);

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

const getCustomerCountToApprove = async () =>{
  
  try {
    const clientRow =  await pool.query('SELECT count(N.idNewClient) as count FROM NewClient N JOIN Company CO ON (N.Company_idCompany = CO.idCompany) where (N.status = ?)', [0]);
    
    if(clientRow){
      return {status: 200, data: clientRow[0]};
    }else{
      return {status: 500, message: "Error interno del servidor."};
    }
  }catch(e) {
    console.log(e);
    return {status: 500, message: "Error interno del servidor."};
  }

};

const getDatesListToCustomer = async (companyid) =>{
  
  try {

    //console.log("CI", companyid);
  
    const cycles = await pool.query('SELECT CS.idCompanySalaries, CS.companyRateName, CS.companyReportDates, CS.companyPaymentDates FROM CompanySalaries CS JOIN Company_has_CompanySalaries CHS ON (CHS.CompanySalaries_idCompanySalaries = CS.idCompanySalaries) where (CHS.Company_idCompany = ?)', companyid);

    //console.log("cycles", cycles);

    if(cycles){
      return {status: 200, data: cycles};
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
const approveCustomers = async (clientid, approve, adminId, cycleId) => {
  
  try{   
    
    if(approve === "true"){

      //console.log("CI", clientid, approve, cycleId);
      
      const updateNewClient = await pool.query('UPDATE NewClient SET status = ? where idNewClient = ?', [1, clientid]);
      
      const newClient = await pool.query('SELECT * FROM NewClient where idNewClient = ?', [clientid]);
      
      //DocumentClients
      const filesPath = {
        documentId: newClient[0].file1,
        paymentReport: newClient[0].file3
      };

      const fileQuery = await pool.query('INSERT INTO ClientDocuments SET ?', [filesPath]);

      //New Client
      const client = {
        identificationId: newClient[0].identificationId,
        documentType: newClient[0].documentType,
        birthDate: newClient[0].birthDate,
        city: newClient[0].city,
        salary: newClient[0].salary,
        phoneNumber: newClient[0].phoneNumber,
        Company_idCompany: newClient[0].Company_idCompany,
        registeredBy: 1,
        registeredDate: new Date(),
        rejectState: false,
        isDeleted: false,
        platformState:  true,
        createdDate: new Date(),
        ClientDocuments_idClientDocuments: fileQuery.insertId,
        CompanySalaries_idCompanySalaries: cycleId,
        
      };

      //console.log("Client", client);
      
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
      //console.log(url.toString());
   
      //Production
      let contractFile = await compileContract("../files/contracts/contratoAvanzo.pdf");

      //Development
      //let contractFile = await compileContract("./files/contracts/contratoAvanzo.pdf");

      //Mailer
      sgMail.setApiKey('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');
      
      let userData = {
        email: consultEmail[0].email,
        name: consultEmail[0].name,
        url: front_URL,
        base_URL_test: base_URL + "/confirmation.png",
        footer: base_URL + "/footer.png",
        link: url,
      };

      /*let userData = {
        email: 'ccorjuelav@unal.edu.co',
        name: 'Cristian',
        url: front_URL,
        base_URL_test: base_URL + "/confirmation.png",
        footer: base_URL + "/footer.png",
        link: "http://www.google.com",
      };*/

      let output = await compile('accountConfirmation', userData);

      //console.log("Output", output);

      let info = {
          from: 'operaciones@avanzo.co', // sender address
          to: userData.email, // list of receivers
          subject: 'Avanzo (Créditos al instante) - Confirmación de cuenta', // Subject line
          text: 'Avanzo', // plain text body
          html: output, // html body,
          attachments: [
            {
              content: contractFile,
              filename: 'contratoAvanzo.pdf',
              type: 'application/pdf',
              disposition: 'attachment'
            }
          ]
      };

      await sgMail.send(info).catch(err => {
        console.log("Error", err);
      });

      return {status: 200, message: "El usuario ha sido aprobado exitosamente."};

    }else{

      const clientQuery = await pool.query('UPDATE NewClient SET status = ? where idNewClient = ?', [2, clientid]);
      
      return {status: 200, message: "El usuario ha sido rechazado exitosamente."};
    }
  }catch(e){
    console.log(e);
    return {status: 500, message: e.sqlMessage};
  }

};

const changeCustomersStatus = async (clientid, active) => {

  //console.log("CI", clientid, active);
  
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

const deleteUser = async (clientid) => {

  //console.log("CI", clientid, active);
  
  try{   
    const clientQuery = await pool.query('UPDATE Client SET isDeleted = ? where idClient = ?', [true, clientid]);
    return {status: 200, message: {message: "El usuario ha sido eliminado exitosamente."}};
  }catch(e){
    console.log(e);
    return {status: 500, message: "Error interno del servidor."};
  }

};

const makePayments = async(clientid, quantity) => {

  try{   

    //Account - Request
    const userRow =  await pool.query('SELECT ACCOUNT.idAccount, ACCOUNT.maximumAmount, ACCOUNT.partialCapacity, ACCOUNT.accumulatedQuantity, CLIENT.identificationId FROM Client CLIENT JOIN Account ACCOUNT ON (ACCOUNT.Client_idClient = CLIENT.idClient ) where CLIENT.idClient = ?', [clientid]);

    //console.log("PC", userRow[0].maximumAmount, "AQ", userRow[0].accumulatedQuantity, "Q", quantity);

    //const newPartialCapacity = (parseInt(userRow[0].maximumAmount, 10) - parseInt(userRow[0].accumulatedQuantity, 10) + parseInt(quantity, 10));
    //console.log("NPC", newPartialCapacity);
    const newAccumulatedQuantity = (parseInt(userRow[0].accumulatedQuantity, 10) - parseInt(quantity, 10));
    //console.log("NPC", newAccumulatedQuantity);
    const newAccount = { accumulatedQuantity: newAccumulatedQuantity };

    //console.log("newAccount", newAccount);

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

const getCustomerAccountDetail = async(clientid) => {

  try{   
    const clientRow =  await pool.query('SELECT U.name, U.lastName, U.email, U.createdDate, C.identificationId, C.phoneNumber, A.maximumAmount, A.montlyFee, A.partialCapacity, A.totalCapital, A.totalInterest, A.totalFeeAdministration, A.totalOtherCollection, A.totalRemainder, A.computedCapacity, CO.socialReason FROM Client C JOIN User U JOIN Account A JOIN Company CO ON (C.idClient = U.Client_idClient AND A.Client_idClient = C.idClient AND C.Company_idCompany = CO.idCompany) where C.idClient = ?', [clientid]);
    return {status: 200, data: clientRow[0]};
  }catch(e){
    console.log(e);
    return {status: 500, message: "Error interno del servidor."};
  }

};

module.exports = {
  getInitialsData, getRequestsData, getAllCustomers, createCustomer, createMultipleCustomers, 
  getAllCustomerWithCompanies, getTransactionsByUsersId, getCustomersByAdmin, getCustomerToApprove,
  approveCustomers, changeCustomersStatus, updateCustomers, makePayments, getDatesListToCustomer,
  deleteUser, getCustomerAccountDetail, getCustomerCountToApprove
}