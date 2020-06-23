//Requires
const math = require('math');
const pool = require('../config/database.js');
const fs = require('fs-extra');
const hbs = require('handlebars');
const moment = require('moment');
const path = require('path');
const sgMail = require('@sendgrid/mail');
const {base_URL} = require('../config/global');
const mkdirp = require('mkdirp');
const pdf = require('html-pdf');
const jwt = require('jsonwebtoken');

//const { checkDateList } = require('./loan');

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

function format(d) {
  console.log("D", d)
  var formatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  });

  return formatter.format(d);
};

var getDaysInMonth = function(month,year) {
  // Here January is 1 based
  //Day 0 is the last day in the previous month
  //return new Date(year, month, 0).getDate();
  // Here January is 0 based
  return new Date(year, month+1, 0).getDate();
};

hbs.registerHelper('dateFormat', function(value, format){

  return moment(value).format(format);

});

const compile = async function(templateName, data){

  //Production
  const filePath = path.join(process.cwd(), '../files/templates', `${templateName}.hbs`);
  
  //Development
  //const filePath = path.join(process.cwd(), './files/templates', `${templateName}.hbs`);
  
  const html = await fs.readFile(filePath, 'utf-8');
  let template = hbs.compile(html);
  
  let result = template(data);

  return result;

};

//Services
const getOutLaysData = async () => {

  try {
    const bankRow = await pool.query('SELECT * FROM Bank where isWallet = ?', false);
    //const accountTypeRow = await pool.query('SELECT * FROM AccountTypes');
    const walletRow = await pool.query('SELECT * FROM Bank where isWallet = ?', true);
    if(walletRow){
      return {status: 200, message: "", 
                data: {
                    walletInfo: walletRow,
                    bankInfo: bankRow,
                    //bankTypeAccountInfo: accountTypeRow,
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

const getOultayDatesLists = async (customerId, split, quantity) => {

  try {

    //Dates
    const userRow =  await pool.query('SELECT COMSAL.companyRate, COMSAL.companyPaymentDates FROM User USR JOIN Client CLI JOIN Company COM JOIN Company_has_CompanySalaries CHC JOIN CompanySalaries COMSAL ON (USR.Client_idClient = CLI.idClient AND CLI.Company_idCompany = COM.idCompany AND CHC.Company_idCompany = COM.idCompany AND CHC.CompanySalaries_idCompanySalaries = COMSAL.idCompanySalaries ) where USR.idUser = ?', [customerId]);

    //Interest
    const interestRow = await pool.query('SELECT * FROM Indicators where indicatorName = ?', "Interest" );
    
    const interest = parseFloat(interestRow[0].indicatorRate);

    //ManagementValue
    const adminRow = await pool.query('SELECT * FROM Indicators where indicatorName = ?', "Management");

    const adminValue = adminRow[0].indicatorValue;   

    if(userRow){
      
      //Define value
      let result = await checkDateList(customerId, split, interest, adminValue, quantity);

      return {status: 200, data: result};
    }else{
      return {status: 500, message: "Error interno del servidor1."};
    }
  }catch(e){
    console.log(e);
    return {status: 500, message: "Error interno del servidor2."};
  }
};

const newDateList = async function(userRow){
  
  try{

    //Dates
    //const userRow =  await pool.query('SELECT COMSAL.* FROM User USR JOIN Client CLI JOIN Company COM JOIN Company_has_CompanySalaries CHC JOIN CompanySalaries COMSAL ON (USR.Client_idClient = CLI.idClient AND CLI.Company_idCompany = COM.idCompany AND CHC.Company_idCompany = COM.idCompany AND CHC.CompanySalaries_idCompanySalaries = COMSAL.idCompanySalaries ) where USR.idUser = ?', [customerId]);
    
    //let playmentSplited = userRow[0].companyPaymentDates.split(',');

    let paymentArray = userRow[0].companyPaymentDates.split(',');


    //console.log("UR", userRow[0].companyPaymentNumber, userRow[0].companyPaymentNumber === 1, userRow[0].companyFirstDate, userRow[0].companySecondDate);

    /*if(parseInt(userRow[0].companyPaymentNumber,10) === 2){
      paymentArray.push(playmentSplited[0].companyFirstDate);
      paymentArray.push(userRow[0].companySecondDate);
    }else if(parseInt(userRow[0].companyPaymentNumber, 10) === 1){
      paymentArray.push(userRow[0].companyFirstDate);
    }*/

    //console.log("Payment", paymentArray);

    let today = new Date();

    //console.log("Today: ", today);

    today.setDate(today.getDate());

    //console.log("Today: ", today);

    let todayNumber = parseInt(today.getDate(), 10);

    //ReportDays
    let reportDays = userRow[0].companyReportDates.split(',');

    let reportDate = -1;

    for (let i = 0; i < reportDays.length ; i++){

      //console.log("Comp", todayNumber, reportDays[i], reportDays[i+1]);

      if( i === 0 && todayNumber < reportDays[i]){

        reportDate = parseInt(reportDays[0], 10);
        break;

      }else if ( todayNumber >= reportDays[i] && todayNumber < reportDays[i+1] ){

        reportDate = parseInt(reportDays[i+1], 10);
        break;
        
      }else{

        //console.log("I", i, reportDays.length-1, i === reportDays.length-1, todayNumber >= reportDays[i+1]);

        if( i === reportDays.length-1 && todayNumber >= reportDays[i] ){

          reportDate = parseInt(reportDays[0], 10);
          break;

        }

      }

    }

    console.log("ReportDate", parseInt(reportDate, 10));

    console.log("PaymentArray", paymentArray);

    let paymentDate  = -1;

    for (let j = 0; j < paymentArray.length; j++ ){

      //console.log("Pay", reportDate, paymentArray[j], reportDate < paymentArray[j] );

      if( reportDate < paymentArray[j] ){

        paymentDate = parseInt(paymentArray[j], 10);
        break;
      
      }else{

        if( j === paymentArray.length-1 && reportDate >= paymentArray[j] ){

          paymentDate = parseInt(paymentArray[0], 10);
          break;

        }

      }

    };

    let month = todayNumber < parseInt(paymentDate,10) ? today.getMonth() : today.getMonth()+1;

    let initialDate = new Date(today.getFullYear(), month, parseInt(paymentDate,10));

    console.log("initialDate", initialDate);

    let data = {initialDate, paymentArray}

    return data;

  }catch(e){

    console.log("E", e);

  }

};

const checkDateList = async function(customerId, split, interest, adminValue, quantity){

  try {

    //Dates
    const userRow =  await pool.query('SELECT COMSAL.* FROM Client CLI JOIN User USR JOIN CompanySalaries COMSAL ON (USR.Client_idClient = CLI.idClient and CLI.CompanySalaries_idCompanySalaries = COMSAL.idCompanySalaries ) where USR.idUser = ?', [customerId]);   
    
    console.log("Salaries", userRow);

    let today = new Date();

    //let new_info = await newDateList(customerId);
    let variables = await newDateList(userRow);

    let initialDate = variables.initialDate;
    let paymentArray = variables.paymentArray;

    //NumberPayments
    let datesList = new Array();
    let new_date = {};
    let cashValues = [];
    let collectedDates = [];
    collectedDates.push(new Date(today));
    let asignedDate = null;
    let real_date = null;
    let totalQuantity = 0;
    let totalInterest = 0;

    //Quantity
    let splitQuantity = Math.ceil(quantity / split);

    let arrayDates = await returnDateList(initialDate, paymentArray, split, today, userRow[0].companyPaymentNumber);

    console.log("ArrayDates", arrayDates);

    for (let i=0; i<split; i++){  

      let days_per_split;

      if(arrayDates[i+1].getTime() !== undefined){

        days_per_split = Math.ceil((arrayDates[i+1].getTime() - arrayDates[i].getTime()) / (1000 * 3600 * 24));

      }

      others = {
        days: days_per_split,
        capital: splitQuantity + (quantity*interest*days_per_split),
      };     

      new_date = {
        id: i,
        name: "Descuento No. " + (i+1),
        //quantity: splitQuantity + (quantity*interest*days_per_split),
        date: arrayDates[i+1],
      };

      totalInterest = Math.ceil(totalInterest) + Math.ceil(quantity*interest*days_per_split);

      totalQuantity = (totalQuantity + splitQuantity + (quantity*interest*days_per_split));
      
      if(i === split-1){
        lastDate = real_date;
      }
      
      cashValues.push(others);
      datesList.push(new_date);

    };

    let months = Math.ceil((arrayDates[split].getTime() - arrayDates[0].getTime()) / (1000 * 3600 * 24 * 30));

    let administrationValue = months * adminValue;

    //console.log("administrationValue", administrationValue);
    //console.log("Months", months);

    let ivaValue = (0.19) * administrationValue;

    //console.log("IVA", ivaValue);

    let quantitySplited = Math.ceil(totalQuantity / split);

    for (let i=0; i<split; i++){
    
      datesList[i].quantity = quantitySplited + Math.ceil(administrationValue / split) + Math.ceil(ivaValue / split);

    };

    let subTotal = parseInt(quantity, 10) + Math.ceil(totalInterest) + parseInt(administrationValue, 10);

    let totalValue = parseInt(quantity, 10) + Math.ceil(totalInterest) + parseInt(administrationValue, 10) + parseInt(ivaValue, 10);

    let info = { datesList, totalInterest, administrationValue, subTotal, ivaValue, totalValue};

    return info;

  }catch(e){

    console.log(e);
    return {status: 500, message: "Error interno del servidor."};

  }

};

const returnDateList = async function(initialDate, paymentArray, split, today, companyPaymentNumber){

  //console.log(initialDate, companyRate, firstDate, secondDate, i);
  //console.log("ID", initialDate);
  
  let counter = 0;

  let newDate = initialDate;

  let monthsDate = new Date(initialDate);
  
  //console.log("Date", monthsDate);

  //console.log("MonthNumber", parseInt( monthsDate.getMonth(), 10));

  let daysArray = [];

  let months = 1;

  daysArray.push(new Date (initialDate)); 

  console.log("DatesArray", daysArray);
  
  while(counter < split){  

    let arrayDate = null;

    let monthDays = 0;

    //console.log("ND", parseInt(newDate.getDate(), 10),parseInt(paymentArray[0], 10), parseInt(paymentArray[1], 10));

    if(companyPaymentNumber > 1){

      if(parseInt(newDate.getDate(), 10) === parseInt(paymentArray[0], 10) || parseInt(newDate.getDate(), 10) === parseInt(paymentArray[1], 10)){

        arrayDate = newDate;

        daysArray.push( new Date (arrayDate) ); 

        counter++;

      }else{
        
        if(parseInt(paymentArray[1], 10) > getDaysInMonth(newDate.getMonth(), newDate.getFullYear()) && (parseInt(newDate.getDate(), 10) === getDaysInMonth(newDate.getMonth(), newDate.getFullYear())) ){

          console.log("Entro", "Days of the month:", getDaysInMonth(newDate.getMonth(), newDate.getFullYear()), "Payment Day", parseInt(paymentArray[1], 10), "Current Day", parseInt(newDate.getDate(), 10) );

          arrayDate = new Date (newDate.getFullYear(), newDate.getMonth(), getDaysInMonth(newDate.getMonth(), newDate.getFullYear()));

          daysArray.push(  new Date (arrayDate)); 

          counter++;

        }

      }

    }else{

      //console.log("Days of the month:", getDaysInMonth(newDate.getMonth(), newDate.getFullYear()), "Payment Day", parseInt(paymentArray[0], 10), "Current Day", parseInt(newDate.getDate(), 10) );
      //console.log("Days of the month:", getDaysInMonth(newDate.getMonth(), newDate.getFullYear()));
      if(parseInt(newDate.getDate(), 10) === parseInt(paymentArray[0], 10)){

        arrayDate = newDate;

        daysArray.push( new Date (arrayDate) ); 

        counter++;

      }else{

        if(parseInt(paymentArray[0], 10) > getDaysInMonth(newDate.getMonth(), newDate.getFullYear()) && (parseInt(newDate.getDate(), 10) === getDaysInMonth(newDate.getMonth(), newDate.getFullYear())) ){

          console.log("Entro", "Days of the month:", getDaysInMonth(newDate.getMonth(), newDate.getFullYear()), "Payment Day", parseInt(paymentArray[0], 10), "Current Day", parseInt(newDate.getDate(), 10) );

          arrayDate = new Date (newDate.getFullYear(), newDate.getMonth(), getDaysInMonth(newDate.getMonth(), newDate.getFullYear()));

          daysArray.push(  new Date (arrayDate)); 

          counter++;

        }

      }

    }

    newDate.setDate(newDate.getDate()+1);
    monthDays += 1;

  }

  //console.log("daysArray", daysArray);

  return daysArray;

};

const createRequest = async (body, file, clientId, files) => {  

  try{

    const { quantity, split, moyen, accountType, accountNumber, interest, administration, isBank,
            fileString, loanData } = body;

    const approvedClient = await pool.query('SELECT C.platformState, C.ClientDocuments_idClientDocuments, C.Company_idCompany, U.name AS companyName, CO.nit FROM Client C JOIN User U JOIN Company CO ON (C.Company_idCompany = CO.idCompany and C.Company_idCompany = U.Company_idCompany) where idClient = ?', clientId);
    //console.log("AC", approvedClient);

    if (parseInt(approvedClient[0].platformState, 10) === 1){
     
        //Account - Request
        const userRow =  await pool.query('SELECT ACCOUNT.idAccount, ACCOUNT.maximumAmount, ACCOUNT.partialCapacity, ACCOUNT.accumulatedQuantity, CLIENT.identificationId, U.lastName, U.name FROM Client CLIENT JOIN Account ACCOUNT JOIN User U ON (ACCOUNT.Client_idClient = CLIENT.idClient AND U.Client_idClient = CLIENT.idClient) where CLIENT.idClient = ?', [clientId]);
        //console.log("UR", userRow[0]);
        
        //console.log("COND", parseInt(quantity, 10), parseInt(userRow[0].partialCapacity, 10), parseInt(quantity, 10) > parseInt(userRow[0].partialCapacity, 10));
        if ( parseInt(userRow[0].partialCapacity, 10) >= parseInt(quantity, 10)){

          //console.log("Files", files);
          
          //console.log("CD", approvedClient[0].ClientDocuments_idClientDocuments);
          let updateNewClient = null;
          //Update paymentSupport and workingSupport
          if (files !== null){
            updateNewClient = await pool.query('UPDATE ClientDocuments SET paymentSupport = ?, workingSupport = ? where idClientDocuments = ?', [files.paymentSupport, files.workingSupport, approvedClient[0].ClientDocuments_idClientDocuments]);
          }
          
          //Update client info
          let newClient = {};
          if(isBank === "true"){
            newClient = { accountBank: moyen, accountNumber, accountType };
            const clientInfo = await pool.query('UPDATE Client SET ? where idClient = ?', [newClient, clientId]);
          }

          //Update account value
          const newQuantity = parseInt(userRow[0].accumulatedQuantity, 10) + parseInt(quantity, 10);
          const newAccount = { accumulatedQuantity: newQuantity };
          const updateAccount = await pool.query('UPDATE Account SET ? where Client_idClient = ?', [newAccount, clientId]);

          //New Request
          const requestState = await pool.query('SELECT * FROM RequestState');
          const newRequest = {quantity, split, account: moyen, accountNumber, accountType};
          newRequest.administrationValue = administration;
          newRequest.interestValue = interest;
          newRequest.creditNumber = math.ceil(math.random()*10000);
          newRequest.approveHumanResources = true;
          newRequest.createdDate = new Date();
          newRequest.registeredBy = 1;
          newRequest.RequestState_idRequestState = requestState[0].name = "Solicitada" ? requestState[0].idRequestState : -1;
          newRequest.observation = "";

          //Obsevations - Request
          //const observation = {observationContent: ""};
          //const observationInsert = await pool.query('INSERT INTO Observations SET ?', [observation]);
          //console.log("OI", observationInsert);
          //newRequest.Observations_idObservations = observationInsert.insertId;
          
          //PreRequestDates - Request
          const preRequestDates = {datesList: "[]", totalQuantity: parseInt(quantity,10), totalAmount: parseInt(quantity,10), totalInterest: 0, totalAdmin: 0, totalIva: 0, totalOtherValues: 0};
          const preRequestDatesRow = await pool.query('INSERT INTO PreRequestDates SET ?', [preRequestDates]);
          //console.log("PRD", preRequestDatesRow);
          newRequest.preRequestDates_idPreRequestDates = preRequestDatesRow.insertId;
          
          //console.log("URW", userRow);
          newRequest.Account_idAccount = userRow[0].idAccount;
          //Request
          const request = await pool.query('INSERT INTO Request SET ?', [newRequest]);
          //console.log("REQ ID", request.insertId);

          let filePath = userRow[0].identificationId+'-'+approvedClient[0].Company_idCompany+'/autorización-descuento-'+request.insertId+'.pdf';

          const updatePath = await pool.query('UPDATE Request SET filePath = ? where idRequest = ?', [filePath, request.insertId]);

          //Generate contract
          //Production
          var dest = '../files/documents/'+userRow[0].identificationId+'-'+approvedClient[0].Company_idCompany+'/';
          
          //Development
          //var dest = './files/documents/'+userRow[0].identificationId+'-'+approvedClient[0].Company_idCompany+'/';
          
          console.log("DL", loanData);

          let userData = {
            identificationId: userRow[0].identificationId,
            lastName: userRow[0].lastName,
            name: userRow[0].name,
            quantity: format(quantity),
            split: split,
            idRequest: request.insertId,
            image_path: '../files/documents/'+userRow[0].identificationId+'-'+approvedClient[0].Company_idCompany+'/file.png',
            fileString: fileString,
            idCompany: approvedClient[0].Company_idCompany,
            company: approvedClient[0].companyName,
            splitQuantity: format(loanData),
          };

          //console.log("UserData", userData);

          mkdirp.sync(dest);
          const content = await compile('contract', userData);
          
          //Pdf config
          var config = {
            border: {
              "top": "60px",            // default is 0, units: mm, cm, in, px
              "right": "10px",
              "bottom": "50px",
              "left": "10px"
            },

            format: "A4", 
          };

          //Production
          const result = await pdf.create(content, config).toFile('../files/documents/'+userRow[0].identificationId+'-'+approvedClient[0].Company_idCompany+'/autorización-descuento-'+request.insertId+'.pdf', (err) => {

          //Development
          //const result = await pdf.create(content, config).toFile('./files/documents/'+userRow[0].identificationId+'-'+approvedClient[0].Company_idCompany+'/autorización-descuento-'+request.insertId+'.pdf', (err) => {
          
            if(err){
              return {status: 500, message: {message: "Error interno del servidor."}};
            }
          });

          return {status: 200, message: {message: "La solicitud #"+request.insertId+" ha sido creada exitosamente."}};
        }else{
          return {status: 404, message: {message: "El usuario no tiene cupo disponible para realizar la solicitud."}};
        }
      
    }else{
      return {status: 404, message: {message: "Tu usuario ha sido deshabilitado para realizar solicitudes en el sistema."}};
    }
  }catch(e){
    console.log(e);
    return {status: 500, message: {message: "Error interno del servidor."}};
  }    
};

const getAllRequests = async (clientId) => {
  
  try{ 
    //console.log("ClientId", clientId);
    const requestRow =  await pool.query('SELECT R.idRequest, RS.name AS stateName, C.identificationId, U.name, U.lastName, C.profession, RS.idRequestState, R.createdDate, R.split, R.quantity, R.administrationValue, R.interestValue, R.othersValue, R.account, R.accountType, R.accountNumber, R.filePath, C.Company_idCompany, A.totalRemainder FROM Client C JOIN User U JOIN Account A JOIN Request R JOIN RequestState RS ON  (U.Client_idClient = C.idClient AND A.Client_idClient = C.idClient AND A.idAccount = R.Account_idAccount AND R.RequestState_idRequestState = RS.idRequestState) where (C.idClient = ? and RS.idRequestState < ?) ORDER BY R.createdDate DESC', [clientId, 5]);
    const company = await pool.query('SELECT CO.idCompany, US.name FROM Client C JOIN Company CO JOIN User US ON (C.Company_idCompany = CO.idCompany AND CO.idCompany = US.Company_idCompany) where C.idClient = ?', [clientId]);
    return {status: 200, data: {request: requestRow, company: company[0]}};
  }catch(e){
    console.log(e);
    return {status: 500, message: "Error interno del servidor."};
  } 
};

const getAllRequestsWasOutlayed = async (clientId) => {
  
  try{ 
    //console.log("ClientId", clientId);
    const requestRow =  await pool.query('SELECT R.idRequest, RS.name AS stateName, C.identificationId, U.name, U.lastName, C.profession, RS.idRequestState, R.createdDate, R.split, R.quantity, R.administrationValue, R.interestValue, R.othersValue, R.account, R.accountType, R.accountNumber, R.filePath, C.Company_idCompany, A.totalRemainder FROM Client C JOIN User U JOIN Account A JOIN Request R JOIN RequestState RS ON  (U.Client_idClient = C.idClient AND A.Client_idClient = C.idClient AND A.idAccount = R.Account_idAccount AND R.RequestState_idRequestState = RS.idRequestState) where (C.idClient = ? and RS.idRequestState = ?) ORDER BY R.createdDate DESC', [clientId, 5]);
    const company = await pool.query('SELECT CO.idCompany, US.name FROM Client C JOIN Company CO JOIN User US ON (C.Company_idCompany = CO.idCompany AND CO.idCompany = US.Company_idCompany) where C.idClient = ?', [clientId]);
    return {status: 200, data: {request: requestRow, company: company[0]}};
  }catch(e){
    console.log(e);
    return {status: 500, message: "Error interno del servidor."};
  } 
};

const getAllRequestWasRejected = async (clientId) => {
  
  try{ 
    //console.log("ClientId", clientId);
    const requestRow =  await pool.query('SELECT R.idRequest, RS.name AS stateName, C.identificationId, U.name, U.lastName, C.profession, RS.idRequestState, R.createdDate, R.split, R.quantity, R.administrationValue, R.interestValue, R.othersValue, R.account, R.accountType, R.accountNumber, R.filePath, R.observation, C.Company_idCompany, A.totalRemainder FROM Client C JOIN User U JOIN Account A JOIN Request R JOIN RequestState RS ON  (U.Client_idClient = C.idClient AND A.Client_idClient = C.idClient AND A.idAccount = R.Account_idAccount AND R.RequestState_idRequestState = RS.idRequestState) where (C.idClient = ? and RS.idRequestState = ?) ORDER BY R.createdDate DESC', [clientId, 6]);
    const company = await pool.query('SELECT CO.idCompany, US.name FROM Client C JOIN Company CO JOIN User US ON (C.Company_idCompany = CO.idCompany AND CO.idCompany = US.Company_idCompany) where C.idClient = ?', [clientId]);
    return {status: 200, data: {request: requestRow, company: company[0]}};
  }catch(e){
    console.log(e);
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

const approveOrRejectRequest = async (requestid, approve, userId, transactionCode, text) => { 

  try{
    //Change the approval/reject state
    const stateRow = await pool.query('SELECT * FROM RequestState');

    const requestQuery = await pool.query('SELECT quantity, administrationValue, interestValue, RequestState_idRequestState, Account_idAccount, approveHumanResources FROM Request where idRequest = ?', [requestid])
    const clientEmail = await pool.query('SELECT U.email, A.partialCapacity, A.totalInterest, A.accumulatedQuantity, A.totalFeeAdministration, A.totalRemainder FROM User U JOIN Client C JOIN Account A ON (U.Client_idClient = C.idClient AND A.Client_idClient = C.idClient) where A.idAccount = ?', [requestQuery[0].Account_idAccount]);
    let requeststate = -1;
    let sendApprovedEmail = -1;
    let response = "";
    if(requestQuery){
      if(approve === "true"){
        response = "aprobada";
        if(userId.role === 1 ){
          response = "desembolsada";
          requeststate = getStateIdFromName(stateRow, "Desembolsada");
          
          
        }else if(userId.role === 2 ){
          let stateRequested = getStateIdFromName(stateRow, "Solicitada");
          let stateAnalysis = getStateIdFromName(stateRow, "Evaluada");
          let stateRH = getStateIdFromName(stateRow, "Aprobada RR.HH.");
          let stateApprove = getStateIdFromName(stateRow, "Aprobada Admon.");
          if(requestQuery[0].RequestState_idRequestState === stateRequested){
            requeststate = stateAnalysis;
          }else if(requestQuery[0].RequestState_idRequestState === stateAnalysis){
            requeststate = requestQuery[0].approveHumanResources === 1 ? stateRH : stateApprove;
          }else if (requestQuery[0].RequestState_idRequestState === stateRH){
            sendApprovedEmail = getStateIdFromName(stateRow, "Aprobada Admon.");
            requeststate = stateApprove;
          }
        }else if(userId.role === 3 ){
          requeststate = getStateIdFromName(stateRow, "Aprobada Admon.");  
        }else{
          return {status: 403, message: "El usuario no tiene los permisos necesarios para para realizar esta acción."};
        }
      }else{
        response = "rechazada";
        requeststate = getStateIdFromName(stateRow, "Rechazada");
        sendApprovedEmail = getStateIdFromName(stateRow, "Rechazada");
        //Update account values
        const rejectAccount = { accumulatedQuantity: clientEmail[0].accumulatedQuantity - requestQuery[0].quantity};
        const rejectAccountQuery = await pool.query('UPDATE Account set ? WHERE idAccount = ?', [rejectAccount, requestQuery[0].Account_idAccount]);
      }
    }else{
      return {status: 404, message: {message: "La solicitud no está registrada en nuestro sistema."}}
    }  

    const request = {registeredDate: new Date(), observation: text, registeredBy: userId, RequestState_idRequestState: requeststate, bankTransactionCode: (transactionCode !== undefined) ? transactionCode : null };
    //console.log("R", request);
    const updateRequest = await pool.query('UPDATE Request set ? WHERE idRequest = ?', [request, requestid]);
    if (updateRequest){
      //console.log("SAE", sendApprovedEmail, getStateIdFromName(stateRow, "Aprobada Admon."));
      if (sendApprovedEmail === getStateIdFromName(stateRow, "Aprobada Admon.")){

        //Transactions
        const quantityTransaction = {quantity: requestQuery[0].quantity, transactionType: "Préstamo", createdDate: new Date(), registeredBy: userId.idUser, registeredDate: new Date, Account_idAccount: requestQuery[0].Account_idAccount};
        const administrationTransaction = {quantity: requestQuery[0].administrationValue, transactionType: "Cuota de administración", createdDate: new Date(), registeredBy: userId.idUser, registeredDate: new Date, Account_idAccount: requestQuery[0].Account_idAccount}
        const transactionQuery = await pool.query('INSERT INTO Transaction SET ?', [quantityTransaction]);
        const administrationQuery = await pool.query('INSERT INTO Transaction SET ?', [administrationTransaction]);
        
        //Request
        const requestUpdateQuery = await pool.query('UPDATE Request SET Transaction_idTransaction = ? where idRequest = ?', [transactionQuery.insertId, requestid]);
        
        //RequestOutLay
        const outlay = {outLayDate: new Date(),  totalInterest: requestQuery[0].interestValue, lastComputedDate: new Date(), wasComputed: "false", Request_idRequest: requestid};
        const outlayQuery = await pool.query('INSERT INTO RequestOutLay SET ?', [outlay]);

        //Update account values
        const account = {totalInterest: clientEmail[0].totalInterest + requestQuery[0].interestValue, totalFeeAdministration: clientEmail[0].totalFeeAdministration + requestQuery[0].administrationValue, totalRemainder: clientEmail[0].totalRemainder + requestQuery[0].quantity + requestQuery[0].administrationValue + requestQuery[0].interestValue };
        const accountQuery = await pool.query('UPDATE Account set ? WHERE idAccount = ?', [account, requestQuery[0].Account_idAccount]);

        //Mailer
        sgMail.setApiKey('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');

        let userData = {
          email: consultEmail[0].email,
          url: front_URL,
          base_URL_test: base_URL + "/approved.png",
          footer: base_URL + "/footer.png",
        };
  
        let output = await compile('approveRequest', userData);

        let info = {
            from: 'operaciones@avanzo.co', // sender address
            to: clientEmail[0].email, // list of receivers
            subject: 'Avanzo (Créditos al instante) - Aprobación de solicitud  No. '  + requestid, // Subject line
            text: 'Hola', // plain text body
            html: output // html body
        };

        await sgMail.send(info);
      
      }else if(sendApprovedEmail = getStateIdFromName(stateRow, "Rechazada")){
        
        console.log("Text", text, "Correo");

        //Mailer
        sgMail.setApiKey('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');

        let userData = {
          email: consultEmail[0].email,
          url: front_URL,
          base_URL_test: base_URL + "/rejected.png",
          footer: base_URL + "/footer.png",
        };
  
        let output = await compile('rejectedRequest', userData);

        let info = {
            from: 'operaciones@avanzo.co', // sender address
            to: clientEmail[0].email, // list of receivers
            subject: 'Avanzo (Créditos al instante) - Rechazo de solicitud  No. '  + requestid, // Subject line
            text: 'Avanzo', // plain text body
            html: output // html body
        };

        await sgMail.send(info);
      }

      return {status: 200, message: {message: "La solicitud ha sido " + response + " satisfactoriamente."}};
    }else{
      return {status: 500, message: "Error interno del servidor."};
    }
  }catch(e){
    console.log(e);
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
      //Change the outlay state for superadmin
      const stateRow = await pool.query('SELECT * FROM RequestState');
      requeststate.push(getStateIdFromName(stateRow, "Aprobada Admon."));
      const requestRow =  await pool.query('SELECT R.idRequest, C.identificationId, U.lastName, C.phoneNumber, C.profession, RS.idRequestState, RS.name, R.createdDate, R.split, R.quantity, R.account, R.accountType, R.accountNumber, R.filePath, C.Company_idCompany, CO.socialReason, U.name FROM Client C JOIN Company CO JOIN User U JOIN Account A JOIN Request R JOIN RequestState RS ON (U.Client_idClient = C.idClient AND CO.idCompany = C.Company_idCompany AND C.idClient = A.Client_idClient AND A.idAccount = R.Account_idAccount AND R.RequestState_idRequestState = RS.idRequestState) where (R.RequestState_idRequestState = ?);', [requeststate[0]]);
      return {status: 200, data: requestRow};
    }else if(userId.role === 2){
      //Change the approval/reject state for admin
      const stateRow = await pool.query('SELECT * FROM RequestState');
      requeststate.push(getStateIdFromName(stateRow, "Solicitada"));
      requeststate.push(getStateIdFromName(stateRow, "Evaluada"));
      requeststate.push(getStateIdFromName(stateRow, "Aprobada RR.HH."));
      requeststate.push(getStateIdFromName(stateRow, "Aprobada Admon."));
      const requestRow =  await pool.query('SELECT R.idRequest, C.identificationId, U.lastName, C.phoneNumber, C.profession, RS.idRequestState, RS.name AS requestStateName, R.createdDate, R.split, R.quantity, R.administrationValue, R.interestValue, R.othersValue, R.account, R.accountType, R.accountNumber, R.filePath, CD.paymentSupport, CD.workingSupport, C.Company_idCompany, CO.socialReason, U.name, A.totalRemainder FROM Client C JOIN ClientDocuments CD JOIN User U JOIN Company CO JOIN Account A JOIN Request R JOIN RequestState RS ON (U.Client_idClient = C.idClient AND C.ClientDocuments_idClientDocuments = CD.idClientDocuments AND C.idClient = A.Client_idClient AND CO.idCompany = C.Company_idCompany AND A.idAccount = R.Account_idAccount AND R.RequestState_idRequestState = RS.idRequestState) where (R.RequestState_idRequestState = ? OR R.RequestState_idRequestState = ? OR R.RequestState_idRequestState = ?);', [requeststate[0], requeststate[1], requeststate[2]]);
      return {status: 200, data: requestRow};    
    }else if(userId.role === 3 ){
      //Change the approval/reject state for company
      const stateRow = await pool.query('SELECT * FROM RequestState');
      requeststate = getStateIdFromName(stateRow, "Aprobada RR.HH.");
      const requestRow =  await pool.query('SELECT R.idRequest, C.identificationId, C.lastName, C.phoneNumber, C.profession, RS.idRequestState, RS.name AS requestStateName, R.createdDate, R.split, R.quantity, R.account, R.accountType, R.accountNumber, R.filePath, C.Company_idCompany, CO.socialReason, U.name FROM Client C JOIN User U JOIN Account A JOIN Company CO JOIN Request R JOIN RequestState RS ON (U.Client_idClient = C.idClient AND CO.idCompany = C.Company_idCompany AND C.idClient = A.Client_idClient AND A.idAccount = R.Account_idAccount AND R.RequestState_idRequestState = RS.idRequestState) where (R.RequestState_idRequestState = ? and R.approveHumanResources = ?);', [requeststate, 1]);
      return {status: 200, data: requestRow};
    }else{
      return {status: 403, message: {message: "El usuario no tiene los permisos necesarios para realizar esta acción."}};
    }
  }catch(e){
    console.log(e);
    return {status: 500, message: {message: "No es posible traer las solicitudes para aprobar."}};
  }

};

const getRequestsToOutLay = async (userId) => {  

  try{
    let requeststate = -1;
    if(userId.role === 1){
      //Change the approval/reject state
      const stateRow = await pool.query('SELECT * FROM RequestState');
      requeststate = getStateIdFromName(stateRow, "Aprobada Admon.");
      const requestRow =  await pool.query('SELECT R.idRequest, C.identificationId, U.lastName, C.profession, RS.idRequestState, RS.name, R.createdDate, R.split, R.quantity, R.account, R.accountType, R.accountNumber, R.filePath, C.Company_idCompany FROM Client C JOIN User U JOIN Account A JOIN Request R JOIN RequestState RS ON (U.Client_idClient = C.idClient AND C.idClient = A.Client_idClient AND A.idAccount = R.Account_idAccount AND R.RequestState_idRequestState = RS.idRequestState) where (R.RequestState_idRequestState = ?);', [requeststate]);
      return {status: 200, data: requestRow};
    }else if(userId.role === 2 ){
      //Change the approval/reject state
      const stateRow = await pool.query('SELECT * FROM RequestState');
      requeststate = getStateIdFromName(stateRow, "Evaluada");
      const requestRow =  await pool.query('SELECT R.idRequest, C.identificationId, U.lastName, C.profession, RS.idRequestState, RS.name, R.createdDate, R.split, R.quantity, R.account, R.accountType, R.accountNumber, R.filePath, C.Company_idCompany FROM Client C JOIN User U JOIN Account A JOIN Request R JOIN RequestState RS ON (U.Client_idClient = C.idClient AND C.idClient = A.Client_idClient AND A.idAccount = R.Account_idAccount AND R.RequestState_idRequestState = RS.idRequestState) where (R.RequestState_idRequestState = ?);', [requeststate]);
      return {status: 200, data: requestRow};
    }else{
      return {status: 403, message: {message: "El usuario no tiene los permisos necesarios para realizar esta acción."}};
    }
  }catch(e){
    console.log(e);
    return {status: 500, message: {message: "No es posible traer las solicitudes para aprobar."}};
  }

};

const getAllRejectedRequest = async () => {

  try{
    
    //Consult state
    const stateRow = await pool.query('SELECT * FROM RequestState');
    let requeststate = getStateIdFromName(stateRow, "Rechazada");
    console.log("RS", requeststate);

    //Select rows
    const  requestRow =  await pool.query('SELECT R.idRequest, R.observation, C.identificationId, U.lastName, C.phoneNumber, C.profession, RS.idRequestState, RS.name, R.createdDate, R.split, R.quantity, R.account, R.accountType, R.accountNumber, R.filePath, C.Company_idCompany, CO.socialReason, A.accumulatedQuantity, U.name FROM Client C JOIN Company CO JOIN User U JOIN Account A JOIN Request R JOIN RequestState RS ON (U.Client_idClient = C.idClient AND CO.idCompany = C.Company_idCompany AND C.idClient = A.Client_idClient AND A.idAccount = R.Account_idAccount AND R.RequestState_idRequestState = RS.idRequestState) where (R.RequestState_idRequestState = ?);', [requeststate]);
    
    return {status: 200, data: requestRow};
  }catch(e){
    console.log(e);
    return {status: 500, message: {message: "No es posible traer las solicitudes rechazadas."}};
  }

};

const getAllPendingRHRequest = async () => {

  try{
    
    //Consult state
    const stateRow = await pool.query('SELECT * FROM RequestState');
    let requeststate = getStateIdFromName(stateRow, "Evaluada");
    console.log("RS", requeststate);

    //Select rows
    const  requestRow =  await pool.query('SELECT R.idRequest, C.identificationId, U.lastName, C.phoneNumber, C.profession, RS.idRequestState, RS.name, R.createdDate, R.split, R.quantity, R.account, R.accountType, R.accountNumber, R.filePath, C.Company_idCompany, CO.socialReason, A.accumulatedQuantity, U.name FROM Client C JOIN Company CO JOIN User U JOIN Account A JOIN Request R JOIN RequestState RS ON (U.Client_idClient = C.idClient AND CO.idCompany = C.Company_idCompany AND C.idClient = A.Client_idClient AND A.idAccount = R.Account_idAccount AND R.RequestState_idRequestState = RS.idRequestState) where (R.RequestState_idRequestState = ?);', [requeststate]);
    
    return {status: 200, data: requestRow};
  }catch(e){
    console.log(e);
    return {status: 500, message: {message: "No es posible traer las solicitudes rechazadas."}};
  }

};

const generateContracts = async (customerid, split, quantity, company) => {

  try{

    //Account - Request
    const userRow =  await pool.query('SELECT ACCOUNT.idAccount, ACCOUNT.maximumAmount, ACCOUNT.partialCapacity, ACCOUNT.accumulatedQuantity, CLIENT.identificationId, CLIENT.lastName FROM Client CLIENT JOIN Account ACCOUNT ON (ACCOUNT.Client_idClient = CLIENT.idClient ) where CLIENT.idClient = ?', [customerid]);
    
    //Production
    var dest = '../files/contracts/'+userRow[0].identificationId+'-'+company+'/';
    mkdirp.sync(dest);
    const content = await compile('contract', {identificationId: userRow[0].identificationId, name: userRow[0].lastName});
    
    
    //Production
    const result = await pdf.create(content, {}).toFile('../files/contracts/'+userRow[0].identificationId+'-'+company+'/contrato-libranza1.pdf', (err) => {
      if(err){
        //console.log("Entro2");
        return {status: 500, data: "false"};
      }
      return 200;
    });
    return {status: 200, data: "true"};
    
  }catch(e){
    console.log(e);
  }

};

const generateRequestCodes = async (clientId, phoneNumber, email) => {

  try{

    if(phoneNumber !== null && phoneNumber !== "" && email !== null && email !== ""){

      //CheckQuery
      const userRow =  await pool.query('SELECT C.idClient, U.idUser FROM Client C JOIN User U ON (C.idClient = U.Client_idClient) where C.phoneNumber = ? and U.email = ?', [phoneNumber, email]);      

      console.log("UserRow", userRow);

      if(userRow.length > 0){
        
        if(parseInt(userRow[0].idUser, 10) === parseInt(clientId)){
        
          return {status: 200, data: "Coincide."}
  
        }else{
  
          return {status: 404, message: "Los datos ingresados no coinciden con el registro actual."};
        
        }

      }else{

        return {status: 404, message: "Los datos ingresados no coinciden con el registro actual."};

      }

     

    }else{

      return {status: 404, message: "Los datos ingresados no son válidos."};

    }

  }catch(e){
    console.log(e);
  }

};


module.exports = {
  getOutLaysData, getOultayDatesLists, createRequest, getAllRequests, getAllRequestsToApprove,
  getAllRequestsWasOutlayed, approveOrRejectRequest, getRequestStatesList, getAllRequestsByCompany,
  getRequestsToOutLay, getAllRequestWasRejected, generateContracts, getAllRejectedRequest,
  getAllPendingRHRequest, generateRequestCodes
}