//Requires
const math = require('math');
const pool = require('../config/database.js');
const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const hbs = require('handlebars');
const moment = require('moment');
const path = require('path');

//Functions
function getStateIdFromName (row, name){
  
  const id = null;

  for (let i in row){
    const item = row[i];
    
    if(item.name === name){
      return (parseInt(item.idRequestState, 10));
    }
  }

  return parseInt(id,10);
  
};

hbs.registerHelper('dateFormat', function(value, format){

  return moment(value).format(format);

});

const compile = async function(templateName, data){

  const filePath = path.join(process.cwd(), 'files/templates', `${templateName}.hbs`);
  const html = await fs.readFile(filePath, 'utf-8');
  let template = hbs.compile(html);
  let new_user = {
    name: "Juan",
    email: "juan@gmail.com",
    identificationId: "1032488213"
  }

  let  result = template(new_user);
  return result;

};

//Services
const getOutLaysData = async () => {

  try {
    const bankRow = await pool.query('SELECT * FROM Bank');
    const accountTypeRow = await pool.query('SELECT * FROM AccountTypes');
    const walletRow = await pool.query('SELECT * FROM Wallet');
    if(walletRow){
      return {status: 200, message: "", 
              data: {
                walletInfo: walletRow,
                bankInfo: bankRow,
                bankTypeAccountInfo: accountTypeRow,
              }
              };
    }else{
        return {status: 500, message: "Error interno del servidor."};
    }
  }catch(e) {
    return {status: 500, message: "Error interno del servidor."};
  }
};

const getOultayDatesLists = async (customerId, split, quantity) => {

  try {
    //Dates
    const userRow =  await pool.query('SELECT COMSAL.companyRate, COMSAL.companyFirstDate, COMSAL.companySecondDate FROM User USR JOIN Client CLI JOIN Company COM JOIN CompanySalaries COMSAL ON (USR.Client_idClient = CLI.idClient AND CLI.Company_idCompany = COM.idCompany AND COM.CompanySalaries_idCompanySalaries = COMSAL.idCompanySalaries ) where USR.idUser = ?', [customerId]);
    const dateRate = userRow[0].companyRate;

    //Interest
    const interestRow = await pool.query('SELECT interestValue FROM InterestRequest');
    const interest = parseInt(interestRow[0].interestValue, 10);

    //ManagementValue
    const adminRow = await pool.query('SELECT managementPaymentValue FROM ManagementPayment');
    const adminValue = adminRow[0].managementPaymentValue;
    

    if(userRow){
      //Define value
      const realRequestValue = (quantity*interest*split) + (quantity*adminValue*split) + parseInt(quantity, 10);
      const partialQuantity = realRequestValue / split;
      const datesList = [];
      let firstDate = new Date();

      for (let i=0; i<split; i++){
        
        //console.log("FD", firstDate);

        let new_date = {
          id: i,
          name: "Desembolso No. " + (i+1),
          quantity: partialQuantity,
          date: firstDate
        };
        
        datesList.push(new_date);
        firstDate.setDate((firstDate.getDate()+dateRate));
      }
      
      return {status: 200, data: datesList};
    }else{
        return {status: 500, message: "Error interno del servidor1."};
    }
  } catch(e) {
      return {status: 500, message: "Error interno del servidor2."};
  }
};

const createRequest = async (body, file, clientId) => {  

  //console.log(body.quantity);

  try{
    const requestState = await pool.query('SELECT * FROM RequestState');
    //console.log("OI", requestState);
    const {quantity, split, moyen, accountType, accountNumber, isBank } = body;
    //New Request
    const newRequest = {quantity, split, account: moyen, accountNumber, accountType};
    newRequest.creditNumber = math.ceil(math.random()*10000);
    newRequest.approveHumanResources = true;
    newRequest.createdDate = new Date();
    newRequest.filePath = "./files/images/nueva_imagen.png";
    newRequest.RequestState_idRequestState = requestState[0].name = "Solicitada" ? requestState[0].idRequestState : -1;
    //Obsevations - Request
    const observation = {observationContent: ""};
    const observationInsert = await pool.query('INSERT INTO Observations SET ?', [observation]);
    //console.log("OI", observationInsert);
    newRequest.Observations_idObservations = observationInsert.insertId;
    //PreRequestDates - Request
    const preRequestDates = {firstDate: new Date(), firstQuantity: 282341};
    const preRequestDatesRow = await pool.query('INSERT INTO PreRequestDates SET ?', [preRequestDates]);
    //console.log("PRD", preRequestDatesRow);
    newRequest.preRequestDates_idPreRequestDates = preRequestDatesRow.insertId;
    //Account - Request
    const userRow =  await pool.query('SELECT ACCOUNT.idAccount FROM Client CLIENT JOIN Account ACCOUNT ON (ACCOUNT.Client_idClient = CLIENT.idClient ) where CLIENT.idClient = ?', [clientId]);
    //console.log("URW", userRow);
    newRequest.Account_idAccount = userRow[0].idAccount;
    //Request
    const request = await pool.query('INSERT INTO Request SET ?', [newRequest]);
    //console.log("REQ", request);
    return {status: 200, message: {message: "La solicitud ha sido creada exitosamente."}};
  }catch(e){
    console.log(e);
    return {status: 500, message: {message: "Error interno del servidor."}};
  }    
};

const getAllRequests = async (clientId) => {
  
  try{ 
    const requestRow =  await pool.query('SELECT R.idRequest, RS.name AS stateName, C.identificationId, U.name, C.lastName, C.profession, RS.idRequestState, RS.name, R.createdDate, R.split, R.quantity, R.account, R.accountType, R.accountNumber, R.filePath, C.Company_idCompany FROM Client C JOIN User U JOIN Account A JOIN Request R JOIN RequestState RS ON  (U.Client_idClient = C.idClient AND A.Client_idClient = C.idClient AND A.idAccount = R.Account_idAccount AND R.RequestState_idRequestState = RS.idRequestState) where C.idClient = ?', [clientId]);
    const company = await pool.query('SELECT CO.idCompany, US.name FROM Client C JOIN Company CO JOIN User US ON (C.Company_idCompany = CO.idCompany AND CO.idCompany = US.Company_idCompany) where C.idClient = ?', [clientId]);
    return {status: 200, data: {request: requestRow, company: company[0]}};
  }catch(e){
    //console.log(e);
    return {status: 500, message: "Error interno del servidor."};
  } 
};

const getAllRequestsByCompany = async (companyId) => {

  try{
    const requestRow =  await pool.query('SELECT R.idRequest, C.identificationId, C.lastName, C.profession, RS.idRequestState, RS.name, R.createdDate, R.split, R.quantity, R.account, R.accountType, R.accountNumber, R.filePath, C.Company_idCompany FROM Client C JOIN Account A JOIN Request R JOIN RequestState RS ON  (C.idClient = A.Client_idClient AND A.idAccount = R.Account_idAccount AND R.RequestState_idRequestState = RS.idRequestState) where C.Company_idCompany = ?', [companyId]);
    return {status: 200, data: {request: requestRow}};
  }catch(e){
    return {status: 500, message: "Error interno del servidor."};
  }

};

const approveOrRejectRequest = async (requestid, approve, userId) => { 

  try{
    //Change the approval/reject state
    const stateRow = await pool.query('SELECT * FROM RequestState');
    const requestQuery = await pool.query('SELECT quantity, RequestState_idRequestState, Account_idAccount FROM Request where idRequest = ?', [requestid])
    let requeststate = -1;
    let response = "";
    if(requestQuery){
      if(approve === "true"){
        response = "aprobada";
        if(userId.role === 1 ){
          requeststate = getStateIdFromName(stateRow, "Desembolsada");
          const transaction = {quantity: requestQuery[0].quantity, transactionType: "Préstamo", createdDate: new Date(), registeredBy: userId.idUser, registeredDate: new Date, Account_idAccount: requestQuery[0].Account_idAccount};
          const transactionQuery = await pool.query('INSERT INTO Transaction SET ?', [transaction]);
          const requestUpdateQuery = await pool.query('UPDATE Request SET Transaction_idTransaction = ? where idRequest = ?', [transactionQuery.insertId, requestid]);
        }else if(userId.role === 2 ){
          let stateAnalysis = getStateIdFromName(stateRow, "En evaluación");
          let stateApprove = getStateIdFromName(stateRow, "Aprobando Admon.");
          requeststate = requestQuery[0].RequestState_idRequestState === stateAnalysis ? stateApprove : stateAnalysis;
        }else if(userId.role === 3 ){
          requeststate = getStateIdFromName(stateRow, "Aprobando RR.HH.");  
        }else{
          return {status: 403, message: "El usuario no tiene los permisos necesarios para para realizar esta acción."};
        }
      }else{
        response = "rechazada";
        requeststate = getStateIdFromName(stateRow, "Rechazada");
      }
    }else{
      return {status: 404, message: {message: "La solicitud no está registrada en nuestro sistema."}}
    }  

    const request = {registeredDate: new Date(), registeredBy: userId, RequestState_idRequestState: requeststate};
    const updateRequest = await pool.query('UPDATE Request set ? WHERE idRequest = ?', [request, requestid]);
    if (updateRequest){
      return {status: 200, message: {message: "La solicitud ha sido " + response + "satisfactoriamente."}};
    }else{
      return {status: 500, message: "Error interno del servidor."};
    }
  }catch(e){
    return {status: 500, message: "Error interno del servidor."};
  }

};

const getRequestStatesList = async () => { 

  try{
    //Change the approval/reject state
    const stateRow = await pool.query('SELECT idRequestState, name FROM RequestState');
    return {status: 200, data: stateRow};
  }catch(e){
    return {status: 500, message: "Error interno del servidor."};
  }

};

const getAllRequestsToApprove = async (userId) => {  

  try{
    let requeststate = [];
    if(userId.role === 1){
      //Change the outlay state
      const stateRow = await pool.query('SELECT * FROM RequestState');
      requeststate.push(getStateIdFromName(stateRow, "Aprobando Admon."));
      const requestRow =  await pool.query('SELECT R.idRequest, C.identificationId, C.lastName, C.profession, RS.idRequestState, RS.name, R.createdDate, R.split, R.quantity, R.account, R.accountType, R.accountNumber, R.filePath, C.Company_idCompany FROM Client C JOIN Account A JOIN Request R JOIN RequestState RS ON (C.idClient = A.Client_idClient AND A.idAccount = R.Account_idAccount AND R.RequestState_idRequestState = RS.idRequestState) where (R.RequestState_idRequestState = ?);', [requeststate[0]]);
      return {status: 200, data: requestRow};
    }else if(userId.role === 2){
      //Change the approval/reject state
      const stateRow = await pool.query('SELECT * FROM RequestState');
      requeststate.push(getStateIdFromName(stateRow, "Solicitada"));
      requeststate.push(getStateIdFromName(stateRow, "En evaluación"));
      const requestRow =  await pool.query('SELECT R.idRequest, C.identificationId, C.lastName, C.profession, RS.idRequestState, RS.name AS requestStateName, R.createdDate, R.split, R.quantity, R.account, R.accountType, R.accountNumber, R.filePath, C.Company_idCompany FROM Client C JOIN Account A JOIN Request R JOIN RequestState RS ON (C.idClient = A.Client_idClient AND A.idAccount = R.Account_idAccount AND R.RequestState_idRequestState = RS.idRequestState) where (R.RequestState_idRequestState = ? OR R.RequestState_idRequestState = ? );', [requeststate[0], requeststate[1]]);
      return {status: 200, data: requestRow};    
    }else if(userId.role === 4 ){
      //Change the approval/reject state
      const stateRow = await pool.query('SELECT * FROM RequestState');
      requeststate = getStateIdFromName(stateRow, "En evaluación");
      const requestRow =  await pool.query('SELECT R.idRequest, C.identificationId, C.lastName, C.profession, RS.idRequestState, RS.name AS requestStateName, R.createdDate, R.split, R.quantity, R.account, R.accountType, R.accountNumber, R.filePath, C.Company_idCompany FROM Client C JOIN Account A JOIN Request R JOIN RequestState RS ON (C.idClient = A.Client_idClient AND A.idAccount = R.Account_idAccount AND R.RequestState_idRequestState = RS.idRequestState) where (R.RequestState_idRequestState = ?);', [requeststate]);
      return {status: 200, data: requestRow};
    }else{
      return {status: 403, message: {message: "El usuario no tiene los permisos necesarios para realizar esta acción."}};
    }
  }catch(e){
    return {status: 500, message: {message: "No es posible traer las solicitudes para aprobar."}};
  }

};

const getRequestsToOutLay = async (userId) => {  

  try{
    let requeststate = -1;
    if(userId.role === 1){
      //Change the approval/reject state
      const stateRow = await pool.query('SELECT * FROM RequestState');
      requeststate = getStateIdFromName(stateRow, "Aprobando Admon.");
      const requestRow =  await pool.query('SELECT R.idRequest, C.identificationId, C.lastName, C.profession, RS.idRequestState, RS.name, R.createdDate, R.split, R.quantity, R.account, R.accountType, R.accountNumber, R.filePath, C.Company_idCompany FROM Client C JOIN Account A JOIN Request R JOIN RequestState RS ON (C.idClient = A.Client_idClient AND A.idAccount = R.Account_idAccount AND R.RequestState_idRequestState = RS.idRequestState) where (R.RequestState_idRequestState = ?);', [requeststate]);
      return {status: 200, data: requestRow};
    }else if(userId.role === 4 ){
      //Change the approval/reject state
      const stateRow = await pool.query('SELECT * FROM RequestState');
      requeststate = getStateIdFromName(stateRow, "En evaluación");
      const requestRow =  await pool.query('SELECT R.idRequest, C.identificationId, C.lastName, C.profession, RS.idRequestState, RS.name, R.createdDate, R.split, R.quantity, R.account, R.accountType, R.accountNumber, R.filePath, C.Company_idCompany FROM Client C JOIN Account A JOIN Request R JOIN RequestState RS ON (C.idClient = A.Client_idClient AND A.idAccount = R.Account_idAccount AND R.RequestState_idRequestState = RS.idRequestState) where (R.RequestState_idRequestState = ?);', [requeststate]);
      return {status: 200, data: requestRow};
    }else{
      return {status: 403, message: {message: "El usuario no tiene los permisos necesarios para realizar esta acción."}};
    }
  }catch(e){
    return {status: 500, message: {message: "No es posible traer las solicitudes para aprobar."}};
  }

};

const generateContracts = async (customerid, split, quantity) => {

  try{

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const content = await compile('contract', user);

    await page.setContent(content);
    await page.emulateMedia('screen');
    await page.pdf({
      path: '/files/contracts/contrato-libranza'+toString(2)+'.pdf',
      format: 'A4',
      printBackground: true
    });

    await browser.close();
    process.exit();

    return {status: 200, message: {message: "El pdf ha sido generado exitosamente"}};
  }catch(e){
    //console.log(e);
  }

};


module.exports = {
  getOutLaysData, getOultayDatesLists, createRequest, getAllRequests, getAllRequestsToApprove,
  approveOrRejectRequest, getRequestStatesList, getAllRequestsByCompany, getRequestsToOutLay, generateContracts
}