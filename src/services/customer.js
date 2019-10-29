
//Requires
const pool = require('../config/database.js');

//Services
const getInitialsData = async (userId) => {

  //console.log("UI", userId);

  try {
      const userRow = await pool.query('SELECT ACCOUNT.idAccount, ACCOUNT.maximumAmount, ACCOUNT.partialCapacity FROM Client CLIENT JOIN User USER JOIN Account ACCOUNT ON (CLIENT.idClient = USER.Client_idClient AND ACCOUNT.Client_idClient = CLIENT.idClient ) where USER.idUser = ?', [userId]);
      //console.log("UR", userRow);
      const transactions = await pool.query('SELECT * FROM Transaction where Account_idAccount = ?', [userRow[0].idAccount]);
      //console.log("UT", transactions);
      const request = await pool.query('SELECT REQUEST.idRequest FROM Request REQUEST JOIN RequestState REQUESTSTATE ON (REQUESTSTATE.idRequestState = REQUEST.RequestState_idRequestState AND REQUESTSTATE.name <> ?) where REQUEST.Account_idAccount = ?', ["Desembolsada", userRow[0].idAccount]);
     // console.log("URE", request);
      //console.log("userRow[0].maximumAmount", userRow[0].maximumAmount);
      //console.log(JSON.stringify(transactions) !== '[]' ? transactions : '[]');
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
      const userRow =  await pool.query('SELECT CLIENT.Company_idCompany, ACCOUNT.idAccount, ACCOUNT.maximumAmount, ACCOUNT.partialCapacity, ACCOUNT.documentsUploaded FROM Client CLIENT JOIN User USER JOIN Account ACCOUNT ON (CLIENT.idClient = USER.Client_idClient AND ACCOUNT.Client_idClient = CLIENT.idClient ) where USER.idUser = ?', [userId]);
      const companyInfo = await pool.query('SELECT maximumSplit FROM Company where idCompany = ?', [userRow[0].Company_idCompany]);
      const interest = await pool.query('SELECT interestValue FROM InterestRequest');
      const adminFee = await pool.query('SELECT managementPaymentValue FROM ManagementPayment');
      if(userRow){
        return {status: 200, message: "", 
                data: {
                  maximumAmount: userRow[0].maximumAmount,
                  maximumSplit: companyInfo[0].maximumSplit,
                  haveDocumentsLoaded: userRow[0].documentsUploaded === 1 ? true : false,
                  interestValue: interest[0].interestValue,
                  adminValue: adminFee[0].managementPaymentValue,
                  otherCollectionValue: 0,
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

const createCustomer = async (body, user, company, adminId) => {
 
  //NewClient
  const {identificationId, lastName, documentType, phoneNumber, fixedNumber, birthDate, expeditionDate, 
         contractType, salary, entryDate, profession, genus, accountBank, accountType, accountNumber} = body;
  
  const newClient = {identificationId, lastName, documentType, phoneNumber, fixedNumber, contractType, salary,
     entryDate, profession, genus, accountBank, accountType, accountNumber};

  newClient.birthDate = new Date(birthDate.split('/')[2], birthDate.split('/')[1], birthDate.split('/')[0]);
  newClient.expeditionDate = new Date(expeditionDate.split('/')[2], expeditionDate.split('/')[1], expeditionDate.split('/')[0]);

  newClient.registeredBy = adminId;
  newClient.registeredDate = new Date();
  newClient.Company_idCompany = company;

  try{

    const clientQuery = await pool.query('INSERT INTO Client SET ?', [newClient]);

    //Insert in user
    const newUser = user;
    newUser.registeredBy = adminId;
    newUser.registeredDate = new Date();
    newUser.createdDate = new Date();
    newUser.Role_idRole = 4;
    newUser.status = true;
    newUser.Client_idClient = clientQuery.insertId;
    const userQuery = await pool.query('INSERT INTO User SET ?', [newUser]);

    //Create an account
    const companyQuery = await pool.query('SELECT C.maximumSplit, C.defaultAmount, C.approveHumanResources FROM Company C JOIN Client CL ON (C.idCompany = CL.Company_idCompany) where CL.idClient = ?', [clientQuery.insertId]);
    const newAccount = {maximumAmount: companyQuery[0].defaultAmount, partialCapacity: companyQuery[0].defaultAmount,
                        documentsUploaded: false, montlyFee: 0, totalInterest: 0, totalFeeAdministration: 0,
                        totalOtherCollection: 0, totalRemainder: 0, approveHumanResources: companyQuery[0].approveHumanResources === 1 ? true : false,
                        registeredBy: adminId, registeredDate: new Date(), Client_idClient: clientQuery.insertId};
    const accountQuery = await pool.query('INSERT INTO Account SET ?', [newAccount]);

    return {status: 200, message: "El cliente ha sido registrado exitosamente."};
  }catch(e){
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
          status: true,
          Client_idClient: clientQuery.insertId
        };
        
        //Insert the user
        const userQuery = await pool.query('INSERT INTO User SET ?', [newUser]);

        //Consult the company info
        const companyQuery = await pool.query('SELECT C.maximumSplit, C.defaultAmount, C.approveHumanResources FROM Company C JOIN Client CL ON (C.idCompany = CL.Company_idCompany) where CL.idClient = ?', [clientQuery.insertId]);
        
        //Create the account
        const newAccount = {
          maximumAmount: companyQuery[0].defaultAmount,
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
          Client_idClient: clientQuery.insertId
        };
        
        const accountQuery = await pool.query('INSERT INTO Account SET ?', [newAccount]);
        return {status: 200, message: "Los usuarios han sido registrados a la plataforma satisfactoriamente."};
      }else{
        return {status: 404, message: "La empresa asociada no se encuentra dentro de nuestros registros."};
      }
    }    
  }catch(e){
    return {status: 500, message: "Error interno del servidor"};
  }
  

};

const getAllCustomerWithCompanies = async () =>{
  
  try {
    const clientRow =  await pool.query('SELECT U.name, C.identificationId, C.lastName, C.profession, A.totalRemainder, CO.socialReason FROM Client C JOIN User U JOIN Account A JOIN Company CO ON (C.idClient = U.Client_idClient AND A.Client_idClient = C.idClient AND C.Company_idCompany = CO.idCompany)');
    
    if(clientRow){
      return {status: 200, data: clientRow};
    }else{
      return {status: 500, message: "Error interno del servidor."};
    }
  }catch(e) {
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

module.exports = {
  getInitialsData, getRequestsData, getAllCustomers, createCustomer, createMultipleCustomers, 
  getAllCustomerWithCompanies, getTransactionsByUsersId
}