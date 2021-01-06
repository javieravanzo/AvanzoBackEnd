//Requires
const math = require('math');
const fs = require('fs-extra');
const hbs = require('handlebars');
const moment = require('moment');
const path = require('path');
const sgMail = require('@sendgrid/mail');
const mkdirp = require('mkdirp');
const pdf = require('html-pdf');
const crypto = require('crypto');
const bytesFormat = require('biguint-format');

//Imports
const { base_URL, email_api_key, front_URL } = require('../config/global');
const pool = require('../config/database.js');
const helpers = require('../lib/helpers');
const mailer = require('../lib/mailer/requestMailer.js');

//Functions
function getStateIdFromName(row, name) {

  let id = null;

  for (let i in row) {
    const item = row[i];

    if (item.name === name) {
      return (parseInt(item.idRequestState, 10));
    }
  }

  return parseInt(id, 10);

};

function format(d) {
  var formatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  });

  return formatter.format(d);
};

var getDaysInMonth = function (month, year) {
  // Here January is 1 based
  //Day 0 is the last day in the previous month
  //return new Date(year, month, 0).getDate();
  // Here January is 0 based
  return new Date(year, month + 1, 0).getDate();
};

hbs.registerHelper('dateFormat', function (value, format) {

  return moment(value).format(format);

});

const compile = async function (templateName, data) {

  //Production
  const dirPath = path.join(process.cwd(), '../files/templates');
  let filePath ="";
  if(fs.existsSync(dirPath)){
    filePath = path.join(process.cwd(), '../files/templates', `${templateName}.hbs`);
  }else{
    filePath = path.join(process.cwd(), '..\\files\\templates', `${templateName}.hbs`);
  }

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
    if (walletRow) {
      return {
        status: 200, message: "",
        data: {
          walletInfo: walletRow,
          bankInfo: bankRow,
          //bankTypeAccountInfo: accountTypeRow,
        }
      };
    } else {
      return { status: 500, message: "Error interno del servidor." };
    }
  } catch (e) {
    ////console.log(e);
    return { status: 500, message: "Error interno del servidor." };
  }
};

const getOultayDatesLists = async (customerId, split, quantity) => {

  try {

    //Dates
    const userRow = await pool.query('SELECT COMSAL.companyRate, COMSAL.companyPaymentDates FROM User USR JOIN Client CLI JOIN Company COM JOIN Company_has_CompanySalaries CHC JOIN CompanySalaries COMSAL ON (USR.Client_idClient = CLI.idClient AND CLI.Company_idCompany = COM.idCompany AND CHC.Company_idCompany = COM.idCompany AND CHC.CompanySalaries_idCompanySalaries = COMSAL.idCompanySalaries ) where USR.idUser = ?', [customerId]);

    //Interest
    const interestRow = await pool.query('SELECT * FROM Indicators where indicatorName = ?', "Interest");

    const interest = parseFloat(interestRow[0].indicatorRate);

    //ManagementValue
    const adminRow = await pool.query('SELECT * FROM Indicators where indicatorName = ?', "Management");

    const adminValue = adminRow[0].indicatorValue;

    if (userRow) {

      //Define value
      let result = await checkDateList(customerId, split, interest, adminValue, quantity);

      if (result) {
        return { status: 200, data: result };
      }
      return { status: 500, message: "Error interno del servidor." };

    } else {

      return { status: 500, message: "Error interno del servidor." };

    }
  } catch (e) {
    ////console.log(e);
    return { status: 500, message: "Error interno del servidor2." };
  }
};

const checkDateList = async function (customerId, split, interest, adminValue, quantity) {

  try {

    //Dates
    const userRow = await pool.query('SELECT COMSAL.* FROM Client CLI JOIN User USR JOIN CompanySalaries COMSAL ON (USR.Client_idClient = CLI.idClient and CLI.CompanySalaries_idCompanySalaries = COMSAL.idCompanySalaries ) where USR.idUser = ?', [customerId]);

    let today = new Date();

    let variables = await newDateList(userRow);
    let initialDate = variables.initialDate;
    let paymentArray = variables.paymentArray;

    //NumberPayments
    let datesList = new Array();
    let new_date = {};
    let cashValues = [];
    let real_date = null;
    let totalQuantity = 0;
    let totalInterest = 0;

    //Quantity
    let splitQuantity = Math.ceil(quantity / split);

    let arrayDates = await returnDateList(initialDate, paymentArray, split, today, userRow[0].companyPaymentNumber);

    for (let i = 0; i < split; i++) {

      let days_per_split;

      if (arrayDates[i + 1].getTime() !== undefined) {

        days_per_split = Math.ceil((arrayDates[i + 1].getTime() - arrayDates[i].getTime()) / (1000 * 3600 * 24));

      }

      others = {
        days: days_per_split,
        capital: splitQuantity + (quantity * interest * days_per_split),
      };

      ////console.log("Others", others);

      new_date = {
        id: i,
        name: "Descuento No. " + (i + 1),
        //quantity: splitQuantity + (quantity*interest*days_per_split),
        date: arrayDates[i + 1],
      };

      totalInterest = Math.ceil(totalInterest) + Math.ceil(quantity * interest * days_per_split);

      totalQuantity = (totalQuantity + splitQuantity + (quantity * interest * days_per_split));

      if (i === split - 1) {
        lastDate = real_date;
      }

      cashValues.push(others);
      datesList.push(new_date);

    };

    let months = Math.ceil((arrayDates[split].getTime() - arrayDates[0].getTime()) / (1000 * 3600 * 24 * 30));

    let administrationValue = months * adminValue;

    let ivaValue = (0.19) * administrationValue;

    let quantitySplited = Math.ceil(totalQuantity / split);

    for (let i = 0; i < split; i++) {

      datesList[i].quantity = quantitySplited + Math.ceil(administrationValue / split) + Math.ceil(ivaValue / split);

    };

    let subTotal = parseInt(quantity, 10) + Math.ceil(totalInterest) + parseInt(administrationValue, 10);

    let totalValue = parseInt(quantity, 10) + Math.ceil(totalInterest) + parseInt(administrationValue, 10) + parseInt(ivaValue, 10);

    let info = { datesList, totalInterest, administrationValue, subTotal, ivaValue, totalValue };

    return info;

  } catch (e) {

    console.log("Error", e);

    return { status: 500, message: "Error interno del servidor." };

  }

};

const newDateList = async function (userRow) {

  try {

    //Dates
    let paymentArray = userRow[0].companyPaymentDates.split(',');

    let today = new Date();

    //2 -> Number of days AFTER the request
    today.setDate(today.getDate() + 2);

    let todayNumber = parseInt(today.getDate(), 10);

    //ReportDays
    let reportDays = userRow[0].companyReportDates.split(',');

    let reportDate = -1;

    for (let i = 0; i < reportDays.length; i++) {

      //////console.log("Comp", todayNumber, reportDays[i], reportDays[i+1]);

      if (i === 0 && todayNumber < reportDays[i]) {

        reportDate = parseInt(reportDays[0], 10);
        break;

      } else if (todayNumber >= reportDays[i] && todayNumber < reportDays[i + 1]) {

        reportDate = parseInt(reportDays[i + 1], 10);
        break;

      } else {

        //////console.log("I", i, reportDays.length-1, i === reportDays.length-1, todayNumber >= reportDays[i+1]);

        if (i === reportDays.length - 1 && todayNumber >= reportDays[i]) {

          reportDate = parseInt(reportDays[0], 10);
          break;

        }

      }

    };

    let paymentDate = -1;

    for (let j = 0; j < paymentArray.length; j++) {

      //////console.log("Pay", reportDate, paymentArray[j], reportDate < paymentArray[j] );

      if (reportDate < paymentArray[j]) {

        paymentDate = parseInt(paymentArray[j], 10);
        break;

      } else {

        if (j === paymentArray.length - 1 && reportDate >= paymentArray[j]) {

          paymentDate = parseInt(paymentArray[0], 10);
          break;

        }

      }

    };

    let month = todayNumber < parseInt(paymentDate, 10) ? today.getMonth() : today.getMonth() + 1;

    let initialDate = new Date(today.getFullYear(), month, parseInt(paymentDate, 10));

    let data = { initialDate, paymentArray }

    return data;

  } catch (e) {

    console.log("Error", e);

  }

};

const returnDateList = async function (initialDate, paymentArray, split, today, companyPaymentNumber) {

  //////console.log(initialDate, companyRate, firstDate, secondDate, i);
  ////console.log("ID", initialDate);

  let counter = 0;

  let newDate = initialDate;

  let monthsDate = new Date(initialDate);

  //////console.log("Date", monthsDate);

  //////console.log("MonthNumber", parseInt( monthsDate.getMonth(), 10));

  let daysArray = [];

  let months = 1;

  let newToday = new Date();

  //2 -> Number of days AFTER the request
  newToday.setDate(newToday.getDate() + 2);

  daysArray.push(new Date(newToday));

  while (counter < split) {

    let arrayDate = null;

    let monthDays = 0;

    //////console.log("ND", parseInt(newDate.getDate(), 10),parseInt(paymentArray[0], 10), parseInt(paymentArray[1], 10));

    if (companyPaymentNumber > 1) {

      if (parseInt(newDate.getDate(), 10) === parseInt(paymentArray[0], 10) || parseInt(newDate.getDate(), 10) === parseInt(paymentArray[1], 10)) {

        arrayDate = newDate;

        daysArray.push(new Date(arrayDate));

        counter++;

      } else {

        if (parseInt(paymentArray[1], 10) > getDaysInMonth(newDate.getMonth(), newDate.getFullYear()) && (parseInt(newDate.getDate(), 10) === getDaysInMonth(newDate.getMonth(), newDate.getFullYear()))) {

          //////console.log("Entro", "Days of the month:", getDaysInMonth(newDate.getMonth(), newDate.getFullYear()), "Payment Day", parseInt(paymentArray[1], 10), "Current Day", parseInt(newDate.getDate(), 10) );

          arrayDate = new Date(newDate.getFullYear(), newDate.getMonth(), getDaysInMonth(newDate.getMonth(), newDate.getFullYear()));

          daysArray.push(new Date(arrayDate));

          counter++;

        }

      }

    } else {
      //////console.log("Days of the month:", getDaysInMonth(newDate.getMonth(), newDate.getFullYear()), "Payment Day", parseInt(paymentArray[0], 10), "Current Day", parseInt(newDate.getDate(), 10) );
      //////console.log("Days of the month:", getDaysInMonth(newDate.getMonth(), newDate.getFullYear()));

      if (parseInt(newDate.getDate(), 10) === parseInt(paymentArray[0], 10)) {

        arrayDate = newDate;

        daysArray.push(new Date(arrayDate));

        counter++;

      } else {

        if (parseInt(paymentArray[0], 10) > getDaysInMonth(newDate.getMonth(), newDate.getFullYear()) && (parseInt(newDate.getDate(), 10) === getDaysInMonth(newDate.getMonth(), newDate.getFullYear()))) {

          ////console.log("Entro", "Days of the month:", getDaysInMonth(newDate.getMonth(), newDate.getFullYear()), "Payment Day", parseInt(paymentArray[0], 10), "Current Day", parseInt(newDate.getDate(), 10) );

          arrayDate = new Date(newDate.getFullYear(), newDate.getMonth(), getDaysInMonth(newDate.getMonth(), newDate.getFullYear()));

          daysArray.push(new Date(arrayDate));

          counter++;

        }

      }

    }

    newDate.setDate(newDate.getDate() + 1);
    monthDays += 1;

  }

  ////console.log("daysArray", daysArray);

  return daysArray;

};

const createRequest = async (body, file, clientId, files) => {

  try {

    const { quantity, split, moyen, accountType, accountNumber, interest, administration, iva, otherValues,
      totalValue, isBank, fileString, loanData, salary_base, biweekly_salary, general_deduction, fromapp, request_overdraft,request_observation } = body;

    console.log("Fromapp", fromapp);

    const approvedClient = await pool.query('SELECT C.platformState, C.ClientDocuments_idClientDocuments, C.Company_idCompany, U.name AS companyName, CO.nit FROM Client C JOIN User U JOIN Company CO ON (C.Company_idCompany = CO.idCompany and C.Company_idCompany = U.Company_idCompany) where idClient = ?', clientId);
    //////console.log("AC", approvedClient);

    if (parseInt(approvedClient[0].platformState, 10) === 1) {

      //Account - Request
      const userRow = await pool.query('SELECT ACCOUNT.idAccount, ACCOUNT.approveHumanResources, ACCOUNT.maximumAmount, ACCOUNT.partialCapacity, ACCOUNT.accumulatedQuantity, CLIENT.identificationId, U.lastName, U.name FROM Client CLIENT JOIN Account ACCOUNT JOIN User U ON (ACCOUNT.Client_idClient = CLIENT.idClient AND U.Client_idClient = CLIENT.idClient) where CLIENT.idClient = ?', [clientId]);
      //console.log("UR", userRow[0]);

      //////console.log("COND", parseInt(quantity, 10), parseInt(userRow[0].partialCapacity, 10), parseInt(quantity, 10) > parseInt(userRow[0].partialCapacity, 10));
      console.log("=>"+userRow[0].partialCapacity)
      if (parseInt(userRow[0].partialCapacity, 10) >= parseInt(quantity, 10)) {

        let updateNewClient = null;

        //Update paymentSupport and workingSupport
        if (files !== null) {
          updateNewClient = await pool.query('UPDATE ClientDocuments SET paymentSupport = ?, workingSupport = ? where idClientDocuments = ?', [files.paymentSupport, files.workingSupport, approvedClient[0].ClientDocuments_idClientDocuments]);
        }

        //Update client info
        let newClient = {};
        if (isBank === "true") {
          newClient = { accountBank: moyen, accountNumber, accountType };
          const clientInfo = await pool.query('UPDATE Client SET ? where idClient = ?', [newClient, clientId]);
        }

        //Update account value
        const newQuantity = parseInt(userRow[0].accumulatedQuantity, 10) + parseInt(quantity, 10);

        //Previous Capacity
        let difference = parseInt(biweekly_salary, 10) - parseInt(general_deduction, 10);

        let debt_percentage = parseInt(general_deduction, 10) / parseInt(biweekly_salary, 10);

        let available_percentage = 0.5 - debt_percentage;

        let computed_capacity = parseInt(biweekly_salary, 10) * available_percentage;

        const newAccount = { accumulatedQuantity: newQuantity, computedCapacity: computed_capacity };
        const updateAccount = await pool.query('UPDATE Account SET ? where Client_idClient = ?', [newAccount, clientId]);

        //New Request
        const requestState = await pool.query('SELECT * FROM RequestState');
        const newRequest = { quantity, split, account: moyen, accountNumber, accountType, };

        newRequest.administrationValue = administration;
        newRequest.otherValues = otherValues;
        newRequest.totalValue = totalValue;
        newRequest.ivaValue = iva;
        newRequest.interestValue = interest;
        newRequest.computedCapacity = computed_capacity;
        newRequest.creditNumber = math.ceil(math.random() * 10000);
        newRequest.approveHumanResources = parseInt(userRow[0].approveHumanResources, 10) === 1 ? true : false;
        newRequest.createdDate = new Date().toLocaleString("es-CO", { timeZone: "America/Bogota" });
        newRequest.registeredDate = new Date().toLocaleString("es-CO", { timeZone: "America/Bogota" });;
        newRequest.registeredBy = 1;
        newRequest.RequestState_idRequestState = requestState[0].name = "Solicitada" ? requestState[0].idRequestState : -1;
        newRequest.fromapp = fromapp === 'true' ? 1 : 0;
        newRequest.observation = "";
        newRequest.Request_overdraft = request_overdraft === 'true' ? 1 : 0;
        newRequest.Request_observation = request_observation ;

        //Obsevations - Request
        //const observation = {observationContent: ""};
        //const observationInsert = await pool.query('INSERT INTO Observations SET ?', [observation]);
        //////console.log("OI", observationInsert);
        //newRequest.Observations_idObservations = observationInsert.insertId;

        //PreRequestDates - Request
        const preRequestDates = { datesList: "[]", totalQuantity: parseInt(quantity, 10), totalAmount: parseInt(quantity, 10), totalInterest: 0, totalAdmin: 0, totalIva: 0, totalOtherValues: 0 };
        const preRequestDatesRow = await pool.query('INSERT INTO PreRequestDates SET ?', [preRequestDates]);
        newRequest.preRequestDates_idPreRequestDates = preRequestDatesRow.insertId;
        newRequest.Account_idAccount = userRow[0].idAccount;

        //Request
        const request = await pool.query('INSERT INTO Request SET ?', [newRequest]);
        //////console.log("REQ ID", request.insertId);

        //ConsultCodes
        const codes = await pool.query('SELECT numberEmailCode, numberPhoneCode, receiveTime FROM Codes where Client_idClient = ?', [clientId]);

        let filePath = userRow[0].identificationId + '-' + approvedClient[0].Company_idCompany + '/autorización-descuento-' + request.insertId + '.pdf';

        const updatePath = await pool.query('UPDATE Request SET filePath = ? where idRequest = ?', [filePath, request.insertId]);

        //Generate contract
        //Production
        var dest = '../files/documents/' + userRow[0].identificationId + '-' + approvedClient[0].Company_idCompany + '/';

        //Development
        //var dest = './files/documents/'+userRow[0].identificationId+'-'+approvedClient[0].Company_idCompany+'/';

        //////console.log("DL", loanData);

        console.log("Codes", codes[0].receiveTime.getDate());

        let codeDates = codes[0].receiveTime.getDate() + "-" + codes[0].receiveTime.getHours() + ":"
          + codes[0].receiveTime.getMinutes() + ":" + codes[0].receiveTime.getSeconds();

        console.log("CodeDates", codeDates);

        let userData = {
          identificationId: userRow[0].identificationId,
          lastName: userRow[0].lastName,
          name: userRow[0].name,
          quantity: format(quantity),
          split: split,
          idRequest: request.insertId,
          image_path: '../files/documents/' + userRow[0].identificationId + '-' + approvedClient[0].Company_idCompany + '/file.png',
          fileString: fileString,
          idCompany: approvedClient[0].Company_idCompany,
          company: approvedClient[0].companyName,
          splitQuantity: format(loanData),
          emailCode: codes[0].numberEmailCode,
          phoneCode: codes[0].numberPhoneCode,
          emailCodeDate: codeDates,
          phoneCodeDate: codeDates,
        };

        //////console.log("UserData", userData);

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
        const result = await pdf.create(content, config).toFile('../files/documents/' + userRow[0].identificationId + '-' + approvedClient[0].Company_idCompany + '/autorización-descuento-' + request.insertId + '.pdf', (err) => {

          //Development
          //const result = await pdf.create(content, config).toFile('./files/documents/'+userRow[0].identificationId+'-'+approvedClient[0].Company_idCompany+'/autorización-descuento-'+request.insertId+'.pdf', (err) => {

          if (err) {
            return { status: 500, message: { message: "Error interno del servidor." } };
          }
        });

        return { status: 200, message: { message: "Tu solicitud #" + request.insertId + " ha sido creada con éxito. Pronto nos pondremos en contacto contigo." } };
      } else {
        return { status: 400, message: { message: "El usuario no tiene cupo disponible para realizar la solicitud." } };
      }

    } else {
      return { status: 400, message: { message: "Tu usuario ha sido deshabilitado para realizar solicitudes en el sistema." } };
    }
  } catch (e) {
    console.log("Error Servicio", e);
    return { status: 500, message: { message: "Error interno del servidor." } };
  }
};

const updateDocumentsRequest = async (idRequest, clientId, files) => {

  try {

    const approvedClient = await pool.query('SELECT C.platformState, C.ClientDocuments_idClientDocuments, C.Company_idCompany, U.name AS companyName, CO.nit FROM Client C JOIN User U JOIN Company CO ON (C.Company_idCompany = CO.idCompany and C.Company_idCompany = U.Company_idCompany) where idClient = ?', clientId);
    //////console.log("AC", approvedClient);

    if (parseInt(approvedClient[0].platformState, 10) === 1) {

      //Account - Request
      const userRow = await pool.query('SELECT ACCOUNT.idAccount, ACCOUNT.approveHumanResources, ACCOUNT.maximumAmount, ACCOUNT.partialCapacity, ACCOUNT.accumulatedQuantity, CLIENT.identificationId, U.lastName, U.name FROM Client CLIENT JOIN Account ACCOUNT JOIN User U ON (ACCOUNT.Client_idClient = CLIENT.idClient AND U.Client_idClient = CLIENT.idClient) where CLIENT.idClient = ?', [clientId]);
      //console.log("UR", userRow[0]);



      //Update paymentSupport and workingSupport
      if (files !== null) {
        updateNewClient = await pool.query('UPDATE ClientDocuments SET paymentSupport = ?, workingSupport = ? where idClientDocuments = ?', [files.paymentSupport, files.workingSupport, approvedClient[0].ClientDocuments_idClientDocuments]);
      }

      //New Request
      const stateRow = await pool.query('SELECT * FROM RequestState');
      let requeststate = getStateIdFromName(stateRow, "Procesada documentos con cambio");

      const newRequest = {
        registeredDate: new Date(),
        registeredBy: 0,
        RequestState_idRequestState: requeststate,
        observation: "Documentos actualizados",
      };

      //Request
      const request = await pool.query('UPDATE Request set ? where idRequest = ?', [newRequest, idRequest]);
      //////console.log("REQ ID", request.insertId);

      return { status: 200, message: { message: "La solicitud #" + idRequest + " ha sido actualizada con éxito." } };

    } else {
      return { status: 400, message: { message: "Tu usuario ha sido deshabilitado para realizar solicitudes en el sistema." } };
    }
  } catch (e) {
    console.log("Error", e);
    return { status: 500, message: { message: "Error interno del servidor." } };
  }
};

const updateRequestInformation = async (idRequest, body, clientId) => {

  try {

    //console.log("Body", body);
    //console.log("idRequest", idRequest);

    const approvedClient = await pool.query('SELECT C.platformState, C.ClientDocuments_idClientDocuments, C.Company_idCompany, U.name AS companyName, CO.nit FROM Client C JOIN User U JOIN Company CO ON (C.Company_idCompany = CO.idCompany and C.Company_idCompany = U.Company_idCompany) where idClient = ?', clientId);
    //////console.log("AC", approvedClient);

    if (parseInt(approvedClient[0].platformState, 10) === 1) {

      //Account - Request
      const userRow = await pool.query('SELECT ACCOUNT.idAccount, ACCOUNT.approveHumanResources, ACCOUNT.maximumAmount, ACCOUNT.partialCapacity, ACCOUNT.accumulatedQuantity, CLIENT.identificationId, U.lastName, U.name FROM Client CLIENT JOIN Account ACCOUNT JOIN User U ON (ACCOUNT.Client_idClient = CLIENT.idClient AND U.Client_idClient = CLIENT.idClient) where CLIENT.idClient = ?', [clientId]);
      //console.log("UR", userRow[0]);

      //Update client info
      let newClient = {
        accountBank: body.account,
        accountNumber: body.accountNumber,
        accountType: body.accountType
      };

      const clientInfo = await pool.query('UPDATE Client SET ? where idClient = ?', [newClient, clientId]);

      //New Request
      const stateRow = await pool.query('SELECT * FROM RequestState');
      let requeststate = getStateIdFromName(stateRow, "Aprobada Administración");

      const newRequest = {
        account: body.account,
        accountNumber: body.accountNumber,
        accountType: body.accountType,
        registeredDate: new Date(),
        registeredBy: 0,
        RequestState_idRequestState: requeststate,
        observation: "La información ha sido modificada y actualizada por el cliente."
      };

      //Request
      const request = await pool.query('UPDATE Request set ? where idRequest = ?', [newRequest, idRequest]);
      //////console.log("REQ ID", request.insertId);

      return { status: 200, message: { message: "La solicitud #" + idRequest + " ha sido actualizada con éxito." } };

    } else {
      return { status: 400, message: { message: "Tu usuario ha sido deshabilitado para realizar solicitudes en el sistema." } };
    }
  } catch (e) {
    console.log(e);
    return { status: 500, message: { message: "Error interno del servidor." } };
  }
};

const getAllRequests = async (clientId) => {

  try {

    const requestRow = await pool.query('SELECT R.idRequest,R.Request_overdraft,R.Request_observation, RS.name AS stateName, C.identificationId, U.name, U.lastName, C.profession, RS.idRequestState, R.createdDate, R.split, R.quantity, R.totalValue, R.administrationValue, R.interestValue, R.otherValues, R.account, R.accountType, R.accountNumber, R.filePath, R.approveHumanResources, R.observation, R.computedCapacity, C.Company_idCompany, A.totalRemainder FROM Client C JOIN User U JOIN Account A JOIN Request R JOIN RequestState RS ON  (U.Client_idClient = C.idClient AND A.Client_idClient = C.idClient AND A.idAccount = R.Account_idAccount AND R.RequestState_idRequestState = RS.idRequestState AND C.idClient = ?) where (RS.idRequestState < ? or RS.idRequestState = ? ) ORDER BY R.createdDate DESC', [clientId, 5, 9]);
    const company = await pool.query('SELECT CO.idCompany, US.name FROM Client C JOIN Company CO JOIN User US ON (C.Company_idCompany = CO.idCompany AND CO.idCompany = US.Company_idCompany) where C.idClient = ?', [clientId]);

    return { status: 200, data: { request: requestRow, company: company[0] } };

  } catch (e) {
    //console.log(e);
    return { status: 500, message: "Error interno del servidor." };
  }
};

const getAllRequestsWasOutlayed = async (clientId) => {

  try {
    //////console.log("ClientId", clientId);
    const requestRow = await pool.query('SELECT R.idRequest,R.Request_overdraft,R.Request_observation, RS.name AS stateName, C.identificationId, U.name, U.lastName, C.profession, RS.idRequestState, R.totalValue, R.computedCapacity, R.observation, R.createdDate, R.split, R.quantity, R.administrationValue, R.interestValue, R.otherValues, R.account, R.accountType, R.accountNumber, R.filePath, C.Company_idCompany, A.totalRemainder FROM Client C JOIN User U JOIN Account A JOIN Request R JOIN RequestState RS ON  (U.Client_idClient = C.idClient AND A.Client_idClient = C.idClient AND A.idAccount = R.Account_idAccount AND R.RequestState_idRequestState = RS.idRequestState AND C.idClient = ?) where ( RS.idRequestState = ?) ORDER BY R.createdDate DESC', [clientId, 5]);
    const company = await pool.query('SELECT CO.idCompany, US.name FROM Client C JOIN Company CO JOIN User US ON (C.Company_idCompany = CO.idCompany AND CO.idCompany = US.Company_idCompany) where C.idClient = ?', [clientId]);
    return { status: 200, data: { request: requestRow, company: company[0] } };
  } catch (e) {
    //console.log(e);
    return { status: 500, message: "Error interno del servidor." };
  }
};

const getAllRequestWasRejected = async (clientId) => {

  try {
    //////console.log("ClientId", clientId);
    const requestRow = await pool.query('SELECT R.idRequest,R.Request_overdraft,R.Request_observation, RS.name AS stateName, C.identificationId, U.name, U.lastName, C.profession, RS.idRequestState, R.createdDate, R.split, R.quantity, R.administrationValue, R.interestValue, R.otherValues, R.totalValue, R.computedCapacity, R.account, R.accountType, R.accountNumber, R.filePath, R.observation, C.Company_idCompany, A.totalRemainder FROM Client C JOIN User U JOIN Account A JOIN Request R JOIN RequestState RS ON  (U.Client_idClient = C.idClient AND A.Client_idClient = C.idClient AND A.idAccount = R.Account_idAccount AND R.RequestState_idRequestState = RS.idRequestState AND C.idClient = ?) where ( RS.idRequestState = ? or RS.idRequestState = ? or RS.idRequestState = ? or RS.idRequestState = ?) ORDER BY R.createdDate DESC', [clientId, 6, 7, 8, 11]);
    const company = await pool.query('SELECT CO.idCompany, US.name FROM Client C JOIN Company CO JOIN User US ON (C.Company_idCompany = CO.idCompany AND CO.idCompany = US.Company_idCompany) where C.idClient = ?', [clientId]);
    return { status: 200, data: { request: requestRow, company: company[0] } };
  } catch (e) {
    //console.log(e);
    return { status: 500, message: "Error interno del servidor." };
  }
};

const getAllRequestsByCompany = async (companyId) => {

  try {
    //Get the state
    const stateRow = await pool.query('SELECT * FROM RequestState');
    requeststate = getStateIdFromName(stateRow, "Aprobada Recursos Humanos");

    //Get the request
    const requestRow = await pool.query('SELECT R.idRequest,R.Request_overdraft,R.Request_observation, C.identificationId, U.lastName, C.phoneNumber, C.profession, RS.idRequestState, RS.name AS requestStateName, R.createdDate, R.split, R.quantity, R.administrationValue, R.interestValue, R.otherValues, R.account, R.accountType, R.accountNumber, R.filePath, R.totalValue, R.computedCapacity, CD.paymentSupport, CD.workingSupport, C.Company_idCompany, CO.socialReason, U.name, A.totalRemainder FROM Client C JOIN ClientDocuments CD JOIN User U JOIN Company CO JOIN Account A JOIN Request R JOIN RequestState RS ON (U.Client_idClient = C.idClient AND C.ClientDocuments_idClientDocuments = CD.idClientDocuments AND C.idClient = A.Client_idClient AND CO.idCompany = C.Company_idCompany AND A.idAccount = R.Account_idAccount AND R.RequestState_idRequestState = RS.idRequestState) where (R.RequestState_idRequestState = ? and C.Company_idCompany = ?);', [requeststate, companyId]);
    return { status: 200, data: { request: requestRow } };

  } catch (e) {
    return { status: 500, message: "Error interno del servidor." };
  }

};

const approveOrRejectRequest = async (requestid, approve, userId, transactionCode, text) => {

  try {

    //Get the states list.
    const stateRow = await pool.query('SELECT * FROM RequestState');

    //Different request states.
    let stateRequested = getStateIdFromName(stateRow, "Solicitada");
    let stateRH = getStateIdFromName(stateRow, "Aprobada Recursos Humanos");
    let stateAnalysis = getStateIdFromName(stateRow, "Aprobada Administración");
    let stateOutlay = getStateIdFromName(stateRow, "En desembolso");
    let stateDocumentsError = getStateIdFromName(stateRow, "Documentos errados");
    let stateDocumentsChange = getStateIdFromName(stateRow, "Procesada documentos con cambio");
    let stateRejected = getStateIdFromName(stateRow, "Rechazada");

    //Get the request.
    const requestQuery = await pool.query('SELECT quantity, administrationValue, interestValue, ivaValue, RequestState_idRequestState, Account_idAccount, approveHumanResources FROM Request where idRequest = ?', [requestid]);

    //Get the user info.
    const clientEmail = await pool.query('SELECT U.email, A.partialCapacity, A.totalInterest, A.accumulatedQuantity, A.totalFeeAdministration, A.totalRemainder, A.totalIva, A.totalCapital FROM User U JOIN Client C JOIN Account A ON (U.Client_idClient = C.idClient AND A.Client_idClient = C.idClient) where A.idAccount = ?', [requestQuery[0].Account_idAccount]);

    //Set the auxiliar params.
    let requeststate = -1;
    let sendApprovedEmail = -1;
    let response = "";
    let currentRequestState = requestQuery[0].RequestState_idRequestState;

    //Define next request state
    if (requestQuery) {

      //If is approved
      if (approve === "true") {

        response = "aprobada";

        if (userId.role === 1) {

          response = "desembolsada";
          requeststate = stateOutlay;

        } else if (userId.role === 2) {

          if (currentRequestState === stateRequested) {

            requeststate = parseInt(requestQuery[0].approveHumanResources, 10) === 1 ? stateRH : stateAnalysis;

          } else if (currentRequestState === stateRH) {

            requeststate = stateAnalysis;

          } else if (currentRequestState === stateAnalysis) {

            sendApprovedEmail = stateAnalysis;
            requeststate = stateOutlay;

          }

        } else if (userId.role === 3) {

          requeststate = stateAnalysis;

        } else if (userId.role === 5) {

          if (currentRequestState === stateRequested) {
            requeststate = parseInt(requestQuery[0].approveHumanResources, 10) === 1 ? stateRH : stateAnalysis;

          } else if (currentRequestState === stateRH) {
            requeststate = stateAnalysis;

          } else if (currentRequestState === stateAnalysis) {
            sendApprovedEmail = stateAnalysis;
            requeststate = stateOutlay;

          } else if (currentRequestState === stateDocumentsError) {
            requeststate = parseInt(requestQuery[0].approveHumanResources, 10) === 1 ? stateRH : stateAnalysis;

          } else if (currentRequestState === stateDocumentsChange) {
            requeststate = parseInt(requestQuery[0].approveHumanResources, 10) === 1 ? stateRH : stateAnalysis;
          }

        } else {
          return { status: 403, message: "El usuario no tiene los permisos necesarios para para realizar esta acción." };
        }

      } else {

        response = "rechazada";

        if (text === "Documentos Alterados") {
          requeststate = stateDocumentsError;
        } else {
          requeststate = stateRejected;
        }

        sendApprovedEmail = stateRejected;

        //Update account values
        const rejectAccount = { accumulatedQuantity: clientEmail[0].accumulatedQuantity - requestQuery[0].quantity };
        const rejectAccountQuery = await pool.query('UPDATE Account set ? WHERE idAccount = ?', [rejectAccount, requestQuery[0].Account_idAccount]);
      }

    } else {
      return { status: 400, message: { message: "La solicitud no está registrada en nuestro sistema." } }
    }

    //Update Request
    const request = {
      registeredDate: new Date(),
      observation: text,
      registeredBy: userId.idUser,
      RequestState_idRequestState: requeststate,
      bankTransactionCode: (transactionCode !== undefined) ? transactionCode : null
    };

    const updateRequest = await pool.query('UPDATE Request set ? WHERE idRequest = ?', [request, requestid]);

    //Create Transactions - IsAdminApproved
    if (sendApprovedEmail === stateAnalysis) {

      //Transactions
      const quantityTransaction = {
        quantity: requestQuery[0].quantity,
        transactionType: "Préstamo",
        createdDate: new Date(),
        registeredBy: userId.idUser,
        registeredDate: new Date,
        Account_idAccount: requestQuery[0].Account_idAccount
      };

      const transactionQuery = await pool.query('INSERT INTO Transaction SET ?', [quantityTransaction]);

      const administrationTransaction = {
        quantity: requestQuery[0].administrationValue,
        transactionType: "Cuota de administración",
        createdDate: new Date(),
        registeredBy: userId.idUser,
        registeredDate: new Date,
        Account_idAccount: requestQuery[0].Account_idAccount
      };

      const administrationQuery = await pool.query('INSERT INTO Transaction SET ?', [administrationTransaction]);

      const interestTransaction = {
        quantity: requestQuery[0].interestValue,
        transactionType: "Interés",
        createdDate: new Date(),
        registeredBy: userId.idUser,
        registeredDate: new Date,
        Account_idAccount: requestQuery[0].Account_idAccount
      };

      const interestQuery = await pool.query('INSERT INTO Transaction SET ?', [interestTransaction]);

      const ivaTransaction = {
        quantity: requestQuery[0].ivaValue,
        transactionType: "IVA",
        createdDate: new Date(),
        registeredBy: userId.idUser,
        registeredDate: new Date,
        Account_idAccount: requestQuery[0].Account_idAccount
      };

      const ivaQuery = await pool.query('INSERT INTO Transaction SET ?', [ivaTransaction]);

      //RequestOutLay
      const outlay = { datesList: new Date().toString(), totalInterest: requestQuery[0].interestValue, lastComputedDate: new Date(), wasComputed: "false", Request_idRequest: requestid };
      const outlayQuery = await pool.query('INSERT INTO RequestOutLay SET ?', [outlay]);

      //Update account values
      const account = {
        totalCapital: clientEmail[0].totalCapital + requestQuery[0].quantity,
        totalInterest: clientEmail[0].totalInterest + requestQuery[0].interestValue,
        totalFeeAdministration: clientEmail[0].totalFeeAdministration + requestQuery[0].administrationValue,
        totalIva: clientEmail[0].totalIva + requestQuery[0].ivaValue,
        totalRemainder: clientEmail[0].totalRemainder + requestQuery[0].quantity + requestQuery[0].administrationValue + requestQuery[0].interestValue + requestQuery[0].ivaValue
      };

      const accountQuery = await pool.query('UPDATE Account set ? WHERE idAccount = ?', [account, requestQuery[0].Account_idAccount]);

      //Request
      const requestUpdateQuery = await pool.query('UPDATE Request SET Transaction_idTransaction = ? where idRequest = ?', [transactionQuery.insertId, requestid]);

    }

    //Send Emails
    if ((sendApprovedEmail === stateAnalysis) || (sendApprovedEmail === stateRH) ||
      (sendApprovedEmail === stateOutlay)) {

      //Mailer
      sgMail.setApiKey(email_api_key);

      let userData = {
        email: clientEmail[0].email,
        url: front_URL,
        base_URL_test: base_URL + "/approved.png",
        footer: base_URL + "/footer.png",
      };

      let approvalTemplate = sendApprovedEmail === stateAnalysis ? 'approveRequest' : 'preApproveRequest';

      let output = await compile('approveRequest', userData);

      let emailMessage = sendApprovedEmail === stateAnalysis ? "Aprobación" : "Validación";

      let info = {
        from: 'operaciones@avanzo.co', // sender address
        to: clientEmail[0].email, // list of receivers
        subject: 'Avanzo (Créditos al instante) - ' + emailMessage + ' de solicitud  No. ' + requestid, // Subject line
        text: 'Avanzo Créditos', // plain text body
        html: output // html body
      };

      await sgMail.send(info);

    } else if ((sendApprovedEmail === stateRejected) || (sendApprovedEmail === stateRejected)) {

      //Mailer
      sgMail.setApiKey(email_api_key);

      let userData = {
        email: clientEmail[0].email,
        url: front_URL,
        base_URL_test: base_URL + "/rejected.png",
        footer: base_URL + "/footer.png",
      };

      let output = await compile('rejectedRequest', userData);

      let info = {
        from: 'operaciones@avanzo.co', // sender address
        to: clientEmail[0].email, // list of receivers
        subject: 'Avanzo (Créditos al instante) - Rechazo de solicitud  No. ' + requestid, // Subject line
        text: 'Avanzo', // plain text body
        html: output // html body
      };

      await sgMail.send(info);
    }

    return { status: 200, message: { message: "La solicitud ha sido " + response + " satisfactoriamente." } };

  } catch (e) {
    console.log("Error2", e);
    return { status: 500, message: "Error interno del servidor." };
  }

};

const passToProcessWithoutChange = async (requestid, userId) => {

  try {

    //Change the approval/reject state
    const stateRow = await pool.query('SELECT * FROM RequestState');

    let requeststate = getStateIdFromName(stateRow, "Procesadas sin cambio");
    let response = "modificada";

    let request = {
      registeredDate: new Date(),
      registeredBy: userId.idUser,
      RequestState_idRequestState: requeststate,
      bankTransactionCode: null
    };

    const updateRequest = await pool.query('UPDATE Request set ? WHERE idRequest = ?', [request, requestid]);

    if (updateRequest) {
      return { status: 200, message: { message: "La solicitud ha sido " + response + " satisfactoriamente." } };
    } else {
      return { status: 500, message: "Error interno del servidor." };
    }

  } catch (e) {

    //console.log(e);
    return { status: 500, message: "Error interno del servidor." };

  }

};

const passToProcessWithDocuments = async (requestid, userId) => {

  try {

    //Change the approval/reject state
    const stateRow = await pool.query('SELECT * FROM RequestState');

    let requeststate = getStateIdFromName(stateRow, "Aprobada Administración");
    let response = "modificada";

    let request = {
      registeredDate: new Date(),
      registeredBy: userId.idUser,
      RequestState_idRequestState: requeststate,
      bankTransactionCode: null
    };

    const updateRequest = await pool.query('UPDATE Request set ? WHERE idRequest = ?', [request, requestid]);

    if (updateRequest) {
      return { status: 200, message: { message: "La solicitud ha sido " + response + " satisfactoriamente." } };
    } else {
      return { status: 500, message: "Error interno del servidor." };
    }

  } catch (e) {

    //console.log(e);
    return { status: 500, message: "Error interno del servidor." };

  }

};

const passToOutlay = async (requestid, userId) => {

  try {

    //Change the approval/reject state
    const stateRow = await pool.query('SELECT * FROM RequestState');

    let requeststate = getStateIdFromName(stateRow, "Rechazadas por el banco procesadas");
    let response = "procesada";

    let request = {
      registeredDate: new Date(),
      registeredBy: userId.idUser,
      RequestState_idRequestState: requeststate,
      bankTransactionCode: null
    };

    const updateRequest = await pool.query('UPDATE Request set ? WHERE idRequest = ?', [request, requestid]);

    if (updateRequest) {
      return { status: 200, message: { message: "La solicitud ha sido " + response + " satisfactoriamente." } };
    } else {
      return { status: 500, message: "Error interno del servidor." };
    }

  } catch (e) {

    //console.log(e);
    return { status: 500, message: "Error interno del servidor." };

  }

};

const getRequestStatesList = async () => {

  try {
    //Change the approval/reject state
    const stateRow = await pool.query('SELECT idRequestState, name FROM RequestState');
    return { status: 200, data: stateRow };
  } catch (e) {
    return { status: 500, message: "Error interno del servidor." };
  }

};

const getAllRequestsToApprove = async (userId) => {

  try {
    let requeststate = [];
    if (userId.role === 1) {
      //Change the outlay state for superadmin
      const stateRow = await pool.query('SELECT * FROM RequestState');
      requeststate.push(getStateIdFromName(stateRow, "Ninguna"));
      const requestRow = await pool.query('SELECT R.idRequest,R.Request_overdraft,R.Request_observation, C.identificationId, U.lastName, C.phoneNumber, C.profession, RS.idRequestState, RS.name, R.createdDate, R.split, R.quantity, R.totalValue, R.account, R.accountType, R.accountNumber, R.filePath, R.computedCapacity, R.totalValue, C.Company_idCompany, CO.socialReason, U.name FROM Client C JOIN Company CO JOIN User U JOIN Account A JOIN Request R JOIN RequestState RS ON (U.Client_idClient = C.idClient AND CO.idCompany = C.Company_idCompany AND C.idClient = A.Client_idClient AND A.idAccount = R.Account_idAccount AND R.RequestState_idRequestState = RS.idRequestState) where (R.RequestState_idRequestState = ?);', [requeststate[0]]);
      return { status: 200, data: requestRow };
    } else if (userId.role === 2) {
      //Change the approval/reject state for admin
      const stateRow = await pool.query('SELECT * FROM RequestState');
      requeststate.push(getStateIdFromName(stateRow, "Solicitada"));
      requeststate.push(getStateIdFromName(stateRow, "Aprobada Administración"));
      requeststate.push(getStateIdFromName(stateRow, "Aprobada Recursos Humanos"));
      const requestRow = await pool.query('SELECT R.idRequest,R.Request_overdraft,R.Request_observation, C.identificationId, U.lastName, C.phoneNumber, C.profession, RS.idRequestState, RS.name AS requestStateName, R.createdDate, R.split, R.quantity, R.administrationValue, R.interestValue, R.otherValues, R.account, R.accountType, R.accountNumber, R.filePath, R.totalValue, R.computedCapacity, CD.paymentSupport, CD.workingSupport, C.Company_idCompany, CO.socialReason, U.name, A.totalRemainder FROM Client C JOIN ClientDocuments CD JOIN User U JOIN Company CO JOIN Account A JOIN Request R JOIN RequestState RS ON (U.Client_idClient = C.idClient AND C.ClientDocuments_idClientDocuments = CD.idClientDocuments AND C.idClient = A.Client_idClient AND CO.idCompany = C.Company_idCompany AND A.idAccount = R.Account_idAccount AND R.RequestState_idRequestState = RS.idRequestState) where (R.RequestState_idRequestState = ? OR R.RequestState_idRequestState = ? OR R.RequestState_idRequestState = ?);', [requeststate[0], requeststate[1], requeststate[2]]);
      return { status: 200, data: requestRow };
    } else if (userId.role === 3) {
      //Change the approval/reject state for company
      const stateRow = await pool.query('SELECT * FROM RequestState');
      requeststate = getStateIdFromName(stateRow, "Aprobada Recursos Humanos");
      const requestRow = await pool.query('SELECT R.idRequest,R.Request_overdraft,R.Request_observation, C.identificationId, U.lastName, C.phoneNumber, C.profession, RS.idRequestState, RS.name AS requestStateName, R.createdDate, R.split, R.quantity, R.administrationValue, R.interestValue, R.otherValues, R.account, R.accountType, R.accountNumber, R.filePath, R.totalValue, R.computedCapacity, CD.paymentSupport, CD.workingSupport, C.Company_idCompany, CO.socialReason, U.name, A.totalRemainder FROM Client C JOIN ClientDocuments CD JOIN User U JOIN Company CO JOIN Account A JOIN Request R JOIN RequestState RS ON (U.Client_idClient = C.idClient AND C.ClientDocuments_idClientDocuments = CD.idClientDocuments AND C.idClient = A.Client_idClient AND CO.idCompany = C.Company_idCompany AND A.idAccount = R.Account_idAccount AND R.RequestState_idRequestState = RS.idRequestState) where (R.RequestState_idRequestState = ?);', [requeststate]);
      return { status: 200, data: requestRow };
    } else if (userId.role === 5) {
      //Change the approval/reject state for admin
      const stateRow = await pool.query('SELECT * FROM RequestState');
      requeststate.push(getStateIdFromName(stateRow, "Solicitada"));
      requeststate.push(getStateIdFromName(stateRow, "Aprobada Recursos Humanos"));
      const requestRow = await pool.query('SELECT R.idRequest,R.Request_overdraft,R.Request_observation, C.identificationId, U.lastName, C.phoneNumber, C.profession, RS.idRequestState, RS.name AS requestStateName, R.createdDate, R.split, R.quantity, R.administrationValue, R.interestValue, R.otherValues, R.account, R.accountType, R.accountNumber, R.filePath, R.totalValue, R.computedCapacity, CD.paymentSupport, CD.workingSupport, C.Company_idCompany, CO.socialReason, U.name, A.totalRemainder FROM Client C JOIN ClientDocuments CD JOIN User U JOIN Company CO JOIN Account A JOIN Request R JOIN RequestState RS ON (U.Client_idClient = C.idClient AND C.ClientDocuments_idClientDocuments = CD.idClientDocuments AND C.idClient = A.Client_idClient AND CO.idCompany = C.Company_idCompany AND A.idAccount = R.Account_idAccount AND R.RequestState_idRequestState = RS.idRequestState) where (R.RequestState_idRequestState = ? OR R.RequestState_idRequestState = ? OR R.RequestState_idRequestState = ?);', [requeststate[0], requeststate[1], requeststate[2]]);
      return { status: 200, data: requestRow };
    }
    else {
      return { status: 403, message: { message: "El usuario no tiene los permisos necesarios para realizar esta acción." } };
    }
  } catch (e) {
    console.log(e);
    return { status: 500, message: { message: "No es posible traer las solicitudes para aprobar." } };
  }

};

const getRequestsToOutLay = async (userId) => {

  try {
    let requeststate = -1;
    if (userId.role === 1) {
      //Change the approval/reject state
      const stateRow = await pool.query('SELECT * FROM RequestState');
      requeststate = getStateIdFromName(stateRow, "En desembolso");
      const requestRow = await pool.query('SELECT R.idRequest,R.Request_overdraft,R.Request_observation, C.identificationId, U.lastName, C.profession, RS.idRequestState, RS.name, R.createdDate, R.split, R.quantity, R.account, R.accountType, R.accountNumber, R.filePath, C.Company_idCompany FROM Client C JOIN User U JOIN Account A JOIN Request R JOIN RequestState RS ON (U.Client_idClient = C.idClient AND C.idClient = A.Client_idClient AND A.idAccount = R.Account_idAccount AND R.RequestState_idRequestState = RS.idRequestState) where (R.RequestState_idRequestState = ?);', [requeststate]);
      return { status: 200, data: requestRow };
    } else if (userId.role === 2 || userId.role === 5) {
      //Change the approval/reject state
      const stateRow = await pool.query('SELECT * FROM RequestState');
      requeststate = getStateIdFromName(stateRow, "En desembolso");
      const requestRow = await pool.query('SELECT R.idRequest,R.Request_overdraft,R.Request_observation, C.identificationId, U.lastName, C.profession, RS.idRequestState, RS.name, R.createdDate, R.split, R.quantity, R.account, R.accountType, R.accountNumber, R.filePath, C.Company_idCompany FROM Client C JOIN User U JOIN Account A JOIN Request R JOIN RequestState RS ON (U.Client_idClient = C.idClient AND C.idClient = A.Client_idClient AND A.idAccount = R.Account_idAccount AND R.RequestState_idRequestState = RS.idRequestState) where (R.RequestState_idRequestState = ?);', [requeststate]);
      return { status: 200, data: requestRow };
    } else if (userId.role === 3) {
      //Change the approval/reject state
      const stateRow = await pool.query('SELECT * FROM RequestState');
      requeststate = getStateIdFromName(stateRow, "En desembolso");
      const requestRow = await pool.query('SELECT R.idRequest,R.Request_overdraft,R.Request_observation, C.identificationId, U.lastName, C.profession, RS.idRequestState, RS.name, R.createdDate, R.split, R.quantity, R.account, R.accountType, R.accountNumber, R.filePath, C.Company_idCompany FROM Client C JOIN User U JOIN Account A JOIN Request R JOIN RequestState RS ON (U.Client_idClient = C.idClient AND C.idClient = A.Client_idClient AND A.idAccount = R.Account_idAccount AND R.RequestState_idRequestState = RS.idRequestState) where (R.RequestState_idRequestState = ?);', [requeststate]);
      return { status: 200, data: [] };
    } else {
      return { status: 403, message: { message: "El usuario no tiene los permisos necesarios para realizar esta acción." } };
    }
  } catch (e) {
    //console.log(e);
    return { status: 500, message: { message: "No es posible traer las solicitudes para aprobar." } };
  }

};

const getAllRejectedRequest = async () => {

  try {

    //Consult state
    const stateRow = await pool.query('SELECT * FROM RequestState');
    let requeststate = getStateIdFromName(stateRow, "Rechazada");
    let requeststate2 = getStateIdFromName(stateRow, "Documentos errados");

    //Select rows
    const requestRow = await pool.query('SELECT R.idRequest,R.Request_overdraft,R.Request_observation, R.observation, C.identificationId, U.lastName, C.phoneNumber, C.profession, RS.idRequestState, RS.name, R.createdDate, R.split, R.quantity, R.account, R.accountType, R.accountNumber, R.totalValue, R.computedCapacity, A.totalRemainder, R.filePath, C.Company_idCompany, CO.socialReason, A.accumulatedQuantity, U.name FROM Client C JOIN Company CO JOIN User U JOIN Account A JOIN Request R JOIN RequestState RS ON (U.Client_idClient = C.idClient AND CO.idCompany = C.Company_idCompany AND C.idClient = A.Client_idClient AND A.idAccount = R.Account_idAccount AND R.RequestState_idRequestState = RS.idRequestState) where (R.RequestState_idRequestState = ? or R.RequestState_idRequestState = ?);', [requeststate, requeststate2]);

    return { status: 200, data: requestRow };
  } catch (e) {
    //console.log(e);
    return { status: 500, message: { message: "No es posible traer las solicitudes rechazadas." } };
  }

};

const getAllDefinitelyRejected = async () => {

  try {

    //Consult state
    const stateRow = await pool.query('SELECT * FROM RequestState');
    let requeststate = getStateIdFromName(stateRow, "Rechazada");
    //let requeststate2 = getStateIdFromName(stateRow, "Documentos errados");

    //Select rows
    const requestRow = await pool.query('SELECT R.idRequest,R.Request_overdraft,R.Request_observation, R.observation, C.identificationId, U.lastName, C.phoneNumber, C.profession, RS.idRequestState, RS.name, R.createdDate, R.split, R.quantity, R.account, R.accountType, R.accountNumber, R.totalValue, R.computedCapacity, A.totalRemainder, R.filePath, C.Company_idCompany, CO.socialReason, A.accumulatedQuantity, U.name FROM Client C JOIN Company CO JOIN User U JOIN Account A JOIN Request R JOIN RequestState RS ON (U.Client_idClient = C.idClient AND CO.idCompany = C.Company_idCompany AND C.idClient = A.Client_idClient AND A.idAccount = R.Account_idAccount AND R.RequestState_idRequestState = RS.idRequestState) where (R.RequestState_idRequestState = ?);', [requeststate]);

    return { status: 200, data: requestRow };
  } catch (e) {
    const result = await getAllRequests(clientId);
    console.log("Error", e);
    return { status: 500, message: { message: "No es posible traer las solicitudes rechazadas." } };
  }

};

const getAllPendingRHRequest = async () => {

  try {

    //Consult state
    const stateRow = await pool.query('SELECT * FROM RequestState');
    let requeststate = getStateIdFromName(stateRow, "Aprobada Recursos Humanos");

    //Select rows
    const requestRow = await pool.query('SELECT R.idRequest,R.Request_overdraft,R.Request_observation, C.identificationId, U.lastName, C.phoneNumber, C.profession, RS.idRequestState, RS.name, R.createdDate, R.split, R.quantity, R.account, R.accountType, R.accountNumber, R.filePath, R.sendRRHHEmail, C.Company_idCompany, CO.socialReason, A.accumulatedQuantity, U.name FROM Client C JOIN Company CO JOIN User U JOIN Account A JOIN Request R JOIN RequestState RS ON (U.Client_idClient = C.idClient AND CO.idCompany = C.Company_idCompany AND C.idClient = A.Client_idClient AND A.idAccount = R.Account_idAccount AND R.RequestState_idRequestState = RS.idRequestState) where (R.RequestState_idRequestState = ?);', [requeststate]);

    return { status: 200, data: requestRow };
  } catch (e) {
    ////console.log(e);
    return { status: 500, message: { message: "No es posible traer las solicitudes pendientes por RR.HH.." } };
  }

};

const getAllBankRefundedRequest = async () => {

  try {

    //Consult state
    const stateRow = await pool.query('SELECT * FROM RequestState');
    let requeststate = getStateIdFromName(stateRow, "Devolución bancaria");

    //Select rows
    const requestRow = await pool.query('SELECT R.idRequest,R.Request_overdraft,R.Request_observation, C.identificationId, U.lastName, C.phoneNumber, C.profession, RS.idRequestState, RS.name, R.createdDate, R.split, R.quantity, R.account, R.accountType, R.accountNumber, R.totalValue, R.computedCapacity, A.totalRemainder, R.filePath, C.Company_idCompany, CO.socialReason, A.accumulatedQuantity, U.name FROM Client C JOIN Company CO JOIN User U JOIN Account A JOIN Request R JOIN RequestState RS ON (U.Client_idClient = C.idClient AND CO.idCompany = C.Company_idCompany AND C.idClient = A.Client_idClient AND A.idAccount = R.Account_idAccount AND R.RequestState_idRequestState = RS.idRequestState) where (R.RequestState_idRequestState = ?);', [requeststate]);

    return { status: 200, data: requestRow };
  } catch (e) {
    ////console.log(e);
    return { status: 500, message: { message: "No es posible traer las solicitudes devueltas por el banco." } };
  }

};

const getAllProcessWithoutChangeRequest = async () => {

  try {

    //Consult state
    const stateRow = await pool.query('SELECT * FROM RequestState');
    let requeststate1 = getStateIdFromName(stateRow, "Procesadas sin cambio");
    let requeststate2 = getStateIdFromName(stateRow, "Documentos errados");
    //let requeststate3 = getStateIdFromName(stateRow, "Procesadas sin cambio");

    //Select rows
    const requestRow = await pool.query('SELECT R.idRequest,R.Request_overdraft,R.Request_observation, C.identificationId, U.lastName, C.phoneNumber, C.profession, RS.idRequestState, RS.name, R.createdDate, R.split, R.quantity, R.account, R.accountType, R.totalValue, R.computedCapacity, A.totalRemainder, R.accountNumber, R.totalValue, R.computedCapacity, A.totalRemainder, R.filePath, C.Company_idCompany, CO.socialReason, A.accumulatedQuantity, U.name FROM Client C JOIN Company CO JOIN User U JOIN Account A JOIN Request R JOIN RequestState RS ON (U.Client_idClient = C.idClient AND CO.idCompany = C.Company_idCompany AND C.idClient = A.Client_idClient AND A.idAccount = R.Account_idAccount AND R.RequestState_idRequestState = RS.idRequestState) where (R.RequestState_idRequestState = ? or R.RequestState_idRequestState = ?);', [requeststate1, requeststate2]);

    return { status: 200, data: requestRow };
  } catch (e) {
    ////console.log(e);
    return { status: 500, message: { message: "No es posible traer las solicitudes procesadas sin cambio." } };
  }

};

const getAllProcessDocumentsChange = async () => {

  try {

    //Consult state
    const stateRow = await pool.query('SELECT * FROM RequestState');
    let requeststate1 = getStateIdFromName(stateRow, "Procesada documentos con cambio");

    //Select rows
    const requestRow = await pool.query('SELECT R.idRequest,R.Request_overdraft,R.Request_observation, C.identificationId, U.lastName, C.phoneNumber, C.profession, RS.idRequestState, RS.name, R.createdDate, R.split, R.quantity, R.account, R.accountType, R.accountNumber, R.totalValue, R.computedCapacity, A.totalRemainder, R.filePath, C.Company_idCompany, CO.socialReason, A.accumulatedQuantity, U.name FROM Client C JOIN Company CO JOIN User U JOIN Account A JOIN Request R JOIN RequestState RS ON (U.Client_idClient = C.idClient AND CO.idCompany = C.Company_idCompany AND C.idClient = A.Client_idClient AND A.idAccount = R.Account_idAccount AND R.RequestState_idRequestState = RS.idRequestState) where (R.RequestState_idRequestState = ?);', [requeststate1]);

    return { status: 200, data: requestRow };
  } catch (e) {
    ////console.log(e);
    return { status: 500, message: { message: "No es posible traer las solicitudes documentos con cambio." } };
  }

};

const getAllProcessBank = async () => {

  try {

    //Consult state
    const stateRow = await pool.query('SELECT * FROM RequestState');
    let requeststate1 = getStateIdFromName(stateRow, "Rechazadas por el banco procesadas");

    //Select rows
    const requestRow = await pool.query('SELECT R.idRequest,R.Request_overdraft,R.Request_observation, C.identificationId, U.lastName, C.phoneNumber, C.profession, RS.idRequestState, RS.name, R.createdDate, R.split, R.quantity, R.account, R.accountType, R.accountNumber, R.filePath, C.Company_idCompany, CO.socialReason, A.accumulatedQuantity, U.name FROM Client C JOIN Company CO JOIN User U JOIN Account A JOIN Request R JOIN RequestState RS ON (U.Client_idClient = C.idClient AND CO.idCompany = C.Company_idCompany AND C.idClient = A.Client_idClient AND A.idAccount = R.Account_idAccount AND R.RequestState_idRequestState = RS.idRequestState) where (R.RequestState_idRequestState = ?);', [requeststate1]);

    return { status: 200, data: requestRow };
  } catch (e) {
    ////console.log(e);
    return { status: 500, message: { message: "No es posible traer las solicitudes procesadas banco." } };
  }

};

const getAllRequestFinalized = async () => {

  try {

    //Consult state
    const stateRow = await pool.query('SELECT * FROM RequestState');
    let requeststate1 = getStateIdFromName(stateRow, "Finalizada");

    //Select rows
    const requestRow = await pool.query('SELECT R.idRequest,R.Request_overdraft,R.Request_observation, C.identificationId, U.lastName, C.phoneNumber, C.profession, RS.idRequestState, RS.name, R.createdDate, R.split, R.quantity, R.account, R.accountType, R.accountNumber, R.totalValue, R.computedCapacity, A.totalRemainder, R.filePath, C.Company_idCompany, CO.socialReason, A.accumulatedQuantity, U.name FROM Client C JOIN Company CO JOIN User U JOIN Account A JOIN Request R JOIN RequestState RS ON (U.Client_idClient = C.idClient AND CO.idCompany = C.Company_idCompany AND C.idClient = A.Client_idClient AND A.idAccount = R.Account_idAccount AND R.RequestState_idRequestState = RS.idRequestState) where (R.RequestState_idRequestState = ?);', [requeststate1]);

    return { status: 200, data: requestRow };
  } catch (e) {
    ////console.log(e);
    return { status: 500, message: { message: "No es posible traer las solicitudes finalizadas." } };
  }

};

const generateContracts = async (customerid, split, quantity, company) => {

  try {

    //Account - Request
    const userRow = await pool.query('SELECT CLIENT.identificationId, U.name, U.lastName, ACCOUNT.idAccount, ACCOUNT.approveHumanResources, ACCOUNT.maximumAmount, ACCOUNT.partialCapacity, ACCOUNT.accumulatedQuantity, CLIENT.identificationId, U.lastName, U.name FROM Client CLIENT JOIN Account ACCOUNT JOIN User U ON (ACCOUNT.Client_idClient = CLIENT.idClient AND U.Client_idClient = CLIENT.idClient) where CLIENT.idClient = ?', [customerid]);
    console.log("USERROW", userRow[0]);

    //Production
    var dest = '../files/contracts/' + userRow[0].identificationId + '-' + company + '/';
    mkdirp.sync(dest);

    let userData = {
      identificationId: userRow[0].identificationId,
      lastName: userRow[0].lastName,
      name: userRow[0].name,
      quantity: format(quantity),
      split: split,
      idRequest: 45,
      image_path: '../files/documents/' + userRow[0].identificationId + '-' + company + '/file.png',
      idCompany: company,
      company: 'Empresa Ejemplo',
      splitQuantity: format(80000),
      emailCode: '123456',
      phoneCode: '834578',
      emailCodeDate: new Date().toLocaleString("es-CO", { timeZone: "America/Bogota" }),
      phoneCodeDate: new Date().toLocaleString("es-CO", { timeZone: "America/Bogota" }),
    };

    console.log("UserData", userData);

    mkdirp.sync(dest);
    const content = await compile('contract', userData);

    //Pdf config
    var config = {
      border: {
        "top": "60px",            // default is 0, units: mm, cm, in, px
        "right": "8px",
        "bottom": "50px",
        "left": "8px"
      },

      format: "A4",
    };

    //Production
    const result = await pdf.create(content, config).toFile('../files/documents/' + userRow[0].identificationId + '-' + company + '/autorización-descuento-' + 45 + '.pdf', (err) => {

      //Development
      //const result = await pdf.create(content, config).toFile('./files/documents/'+userRow[0].identificationId+'-'+approvedClient[0].Company_idCompany+'/autorización-descuento-'+request.insertId+'.pdf', (err) => {

      if (err) {
        return { status: 500, message: { message: "Error interno del servidor." } };
      }
    });

    return { status: 200, data: "true" };

  } catch (e) {
    console.log(e);
  }

};

const generateRequestCodes = async (clientId, phoneNumber, email) => {

  try {

    if (phoneNumber !== null && phoneNumber !== "" && email !== null && email !== "") {

      console.log("PhoneNumber", phoneNumber, "Email", email);

      //CheckQuery
      const userRow = await pool.query('SELECT C.idClient, U.idUser, U.email FROM Client C JOIN User U ON (C.idClient = U.Client_idClient) where C.phoneNumber = ? and U.email = ?', [phoneNumber, email]);

      console.log("UserRow", userRow);

      if (userRow.length > 0) {

        if (parseInt(userRow[0].idUser, 10) === parseInt(clientId)) {

          const emailCode = Math.floor(100000 + Math.random() * 900000);

          //Encrypt Codes
          const newEmailCode = await helpers.encryptPassword(emailCode.toString());

          //console.log("EC", emailCode);

          const phoneCode = Math.floor(100000 + Math.random() * 900000);

          //Encrypt Codes
          const newPhoneCode = await helpers.encryptPassword(phoneCode.toString());

          let objectCode = {
            numberEmailCode: emailCode.toString(),
            numberPhoneCode: phoneCode.toString(),
            emailCode: newEmailCode,
            phoneCode: newPhoneCode,
            Client_idClient: userRow[0].idClient,
            sendTime: new Date(),
            receiveTime: null,
          };

          console.log("Codes", objectCode);

          const checkClient = await pool.query('SELECT idCodes FROM Codes where Client_idClient = ?', [userRow[0].idClient]);

          if (checkClient.length > 0) {

            const updateCodes = await pool.query('UPDATE Codes SET ? where Client_idClient = ?', [objectCode, userRow[0].idClient]);

          } else {

            const insertCodes = await pool.query('INSERT INTO Codes SET ?', [objectCode]);

          }

          //Mailer
          sgMail.setApiKey(email_api_key);

          let userData = {
            email: userRow[0].email,
            url: front_URL,
            emailCode: emailCode,
            base_URL_test: base_URL + "/confirmation.png",
            footer: base_URL + "/footer.png",
          };

          let output = await compile('transactionCode', userData);

          let info = {
            from: 'operaciones@avanzo.co', // sender address
            to: userRow[0].email, // list of receivers
            subject: 'Avanzo (Créditos al instante) - Código de validación', // Subject line
            text: 'Avanzo', // plain text body
            html: output // html body
          };

          await sgMail.send(info);

          return { status: 200, message: "Los códigos han sido enviados" };

        } else {

          return { status: 400, message: "Los datos ingresados no coinciden con el registro actual. Por favor, contáctanos." };

        }

      } else {

        return { status: 400, message: "Los datos ingresados no coinciden con el registro actual. Por favor, contáctanos." };

      }

    } else {

      return { status: 400, message: "Los datos ingresados no son válidos." };

    }

  } catch (e) {
    console.log("E", e);
  }

};

const checkNewCodes = async (clientId, userid, phonecode, emailcode, ipAddress) => {

  try {

    if (phonecode !== null && phonecode !== "" && emailcode !== null && emailcode !== "") {

      //CheckQuery
      const userRow = await pool.query('SELECT C.idClient, CO.idCodes, CO.emailCode, CO.phoneCode FROM Codes CO JOIN Client C ON (CO.Client_idClient = C.idClient) where C.idClient = ?', [clientId]);

      if (userRow.length > 0) {

        let validEmailCode = await helpers.matchPassword(emailcode.toString(), userRow[0].emailCode);

        let validPhoneCode = await helpers.matchPassword(phonecode.toString(), userRow[0].phoneCode);

        let updateCodes = {
          receiveTime: new Date(),
          receiveIP: ipAddress
        };

        console.log("ReceiveTime", updateCodes);

        const updateDates = await pool.query('UPDATE Codes SET ? WHERE Client_idClient = ?', [updateCodes, clientId]);

        if (validEmailCode) {
          return { status: 200, message: "Los códigos son auténticos" };
        } else {
          return { status: 400, message: "Los códigos ingresados no coinciden con el registro." };
        }

      } else {

        return { status: 400, message: "Los códigos ingresados no coinciden con el registro." };

      }

    } else {

      return { status: 400, message: "Los códigos ingresados no son números válidos." };

    }

  } catch (e) {
    ////console.log(e);
  }

};

module.exports = {
  getOutLaysData, getOultayDatesLists, createRequest, getAllRequests, getAllRequestsToApprove,
  getAllRequestsWasOutlayed, approveOrRejectRequest, getRequestStatesList, getAllRequestsByCompany,
  getRequestsToOutLay, getAllRequestWasRejected, generateContracts, getAllRejectedRequest,
  getAllPendingRHRequest, generateRequestCodes, checkNewCodes, getAllBankRefundedRequest,
  passToProcessWithoutChange, passToProcessWithDocuments, passToOutlay, getAllDefinitelyRejected,
  getAllProcessWithoutChangeRequest, updateDocumentsRequest, updateRequestInformation,
  getAllProcessDocumentsChange, getAllProcessBank, getAllRequestFinalized
};