
//Requires
const pool = require('../config/database.js');
const jwt = require('jsonwebtoken');
const { my_secret_key, base_URL, front_URL, base_URL_test } = require('../config/global');
const sgMail = require('@sendgrid/mail');
const path = require('path');
const fs = require('fs-extra');
const hbs = require('handlebars');
const { sendEmail, sendSMS } = require('../utils/utils.js');
const { ENVIRONMENT, SMS_CODES, ATTACHMENT_TYPES, PATH_FILE_CONTRACT, NAME_FILE_CONTRACT, PENDING_APPROVAL,
  ACCOUNT_CONFIRMATION, ACCOUNT_REJECTED, PRE_CLIENT_STATES, ROLES } = require('../utils/constants.js');

//constants
const todayDate = new Date().toLocaleString("es-CO", { timeZone: "America/Bogota" }).replace(/\P.+/, '').replace(/\A.+/, '');
const expirationTime = 5;


//Functions
const compileContract = async function (filePath) {
  const pdf = await fs.readFileSync(filePath).toString("base64");
  return pdf;
};

const compile = async function (templateName, data) {
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
    if (userRow) {
      return {
        status: 200, message: "",
        data: {
          maximumAmount: userRow[0].maximumAmount,
          partialCapacity: userRow[0].partialCapacity,
          transactions: JSON.stringify(transactions) !== '[]' ? transactions : [],
          request: request.length
        }
      };
    } else {
      return { status: 500, message: "Error interno del servidor." };
    }
  } catch (e) {
    return { status: 500, message: "Error interno del servidor." };
  }
};

const getRequestsData = async (userId) => {

  try {
    const userRow = await pool.query('SELECT CLIENT.Company_idCompany, CLIENT.phoneNumber, CLIENT.identificationId, CLIENT.accountBank, CLIENT.accountType, CLIENT.accountNumber, ACCOUNT.idAccount, ACCOUNT.maximumAmount, ACCOUNT.montlyFee, ACCOUNT.partialCapacity, ACCOUNT.documentsUploaded FROM Client CLIENT JOIN User USER JOIN Account ACCOUNT ON (CLIENT.idClient = USER.Client_idClient AND ACCOUNT.Client_idClient = CLIENT.idClient ) where USER.idUser = ?', [userId]);
    const companyInfo = await pool.query('SELECT workingSupport, paymentSupport, fixedFee FROM Company where idCompany = ?', [userRow[0].Company_idCompany]);

    //Interest
    //const interest = await pool.query('SELECT indicatorName, indicatorValue, indicatorRate FROM Indicators where indicatorName = ?', "Interest" );

    /*for (let i = 0; i<indicators.length; i++){
      if(indicators[i].indicatorName)
    }¨*/

    //ManagementValue
    //const adminFee = await pool.query('SELECT indicatorValue FROM Indicators where indicatorName = ?', "Management" );

    if (userRow) {
      return {
        status: 200, message: "",
        data: {
          partialCapacity: userRow[0].partialCapacity,
          maximumAmount: userRow[0].maximumAmount,
          maximumSplit: userRow[0].montlyFee,
          fixedFee: companyInfo[0].fixedFee,
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
    } else {
      return { status: 500, message: "Error interno del servidor." };
    }
  } catch (e) {
    console.log(e);
    return { status: 500, message: "Error interno del servidor." };
  }
};

const getAllCustomers = async (companyId) => {

  try {
    const clientRow = await pool.query('SELECT U.email, U.name, C.identificationId, C.lastName, C.profession, A.totalRemainder FROM Client C JOIN User U JOIN Account A JOIN Company CO ON (C.idClient = U.Client_idClient AND A.Client_idClient = C.idClient AND C.Company_idCompany = CO.idCompany) where C.Company_idCompany = ?', [companyId]);

    if (clientRow) {
      return { status: 200, message: "", data: clientRow };
    } else {
      return { status: 500, message: "Error interno del servidor." };
    }
  } catch (e) {
    return { status: 500, message: "Error interno del servidor." };
  }
};

const getCustomersByAdmin = async () => {

  try {
    const clientRow = await pool.query('SELECT * FROM Client');

    if (clientRow) {
      return { status: 200, message: "", data: clientRow };
    } else {
      return { status: 500, message: "Error interno del servidor." };
    }
  } catch (e) {
    return { status: 500, message: "Error interno del servidor." };
  }
};

const createCustomer = async (body, user, company, adminId) => {


  //NewClient
  const { identificationId, lastName, documentType, phoneNumber, fixedNumber, birthDate, expeditionDate,
    contractType, salary, entryDate, profession, genus, accountBank, accountType, accountNumber, idCompany, companyPayment,
    vehicle, vehicle_type, license_plate_vehicle, clie_address, clie_from } = body;


  const newClient = {
    identificationId, documentType, phoneNumber, fixedNumber, contractType, salary,
    entryDate, profession, genus, accountBank, accountType, accountNumber, birthDate, expeditionDate,
    vehicle, vehicle_type, license_plate_vehicle, clie_address, clie_from
  };

  //newClient.birthDate = new Date(birthDate.split('/')[2], birthDate.split('/')[1], birthDate.split('/')[0]);
  //newClient.expeditionDate = new Date(expeditionDate.split('/')[2], expeditionDate.split('/')[1], expeditionDate.split('/')[0]);

  newClient.registeredBy = adminId;
  newClient.registeredDate = todayDate;
  newClient.Company_idCompany = idCompany;
  newClient.CompanySalaries_idCompanySalaries = companyPayment;

  try {
    await pool.query('START TRANSACTION');

    const clientQuery = await pool.query('INSERT INTO Client SET ?', [newClient]);

    //Insert in user
    const newUser = user;
    newUser.lastName = lastName;
    newUser.registeredBy = adminId;
    newUser.registeredDate = todayDate;
    newUser.createdDate = todayDate;
    newUser.Role_idRole = 4;
    newUser.status = false;
    newUser.Client_idClient = clientQuery.insertId;
    const userQuery = await pool.query('INSERT INTO User SET ?', [newUser]);

    //Create an account
    const companyQuery = await pool.query('SELECT C.maximumSplit, C.defaultAmount, C.approveHumanResources FROM Company C JOIN Client CL ON (C.idCompany = CL.Company_idCompany) where CL.idClient = ?', [clientQuery.insertId]);
    const newAccount = {
      maximumAmount: companyQuery[0].defaultAmount,
      documentsUploaded: false,
      montlyFee: 0,
      totalInterest: 0,
      totalFeeAdministration: 0,
      totalOtherCollection: 0,
      totalRemainder: 0,
      approveHumanResources: companyQuery[0].approveHumanResources === 1 ? true : false,
      registeredBy: adminId,
      registeredDate: todayDate,
      Client_idClient: clientQuery.insertId
    };

    const accountQuery = await pool.query('INSERT INTO Account SET ?', [newAccount]);
    await pool.query('COMMIT');

    console.log("Proceso envio de correo Cuenta pendiente de aprobación");
    //Mailer approval

    // var subject = 'Avanzo (Créditos al instante) - Cuenta pendiente de aprobación';
    // var text = 'Avanzo';
    // var template = PENDING_APPROVAL;
    // let userData = {
    //   email: newUser.email,
    //   name: newUser.name,
    //   url: front_URL,
    //   base_URL_test: base_URL + "/confirmation.png",
    //   footer: base_URL + "/footer.png",

    // };
    // sendEmail(template, userData, '', '', subject, text, '')

    // //Send SMS 
    // if (ENVIRONMENT === 'production') {
    //   const smsCodesQuery = await pool.query('SELECT sms_co_id,sms_co_body FROM avanzo.sms_codes WHERE sms_co_id = ? ', [SMS_CODES.CUSTOMER_PENDING_APPROVAL]);
    //   sendSMS(newClient.phoneNumber, smsCodesQuery[0].sms_co_body);
    // }

    return { status: 200, message: "El cliente ha sido registrado exitosamente." };
  } catch (e) {
    console.log("E", e);
    await pool.query('ROLLBACK');
    return { status: 500, message: "Error interno del servidor. Por favor, intente más tarde." };
  }
};

const updateCustomers = async (body, user, adminId) => {

  //NewClient
  const { accountBank, identificationId, lastName, phoneNumber, profession, idClient, idUser, idAccount, maximumAmount, montlyFee } = body;

  let newClient = {};
  let newUser = {};
  try {
    const currentUser = await pool.query('SELECT U.Role_idRole FROM User U where idUser = ?', [adminId]);


    //only user with role 1 can update , phonenumber,documentnumber,email,bankaccount
    if (currentUser[0].Role_idRole === ROLES.ADMINISTRATOR) {
      //update client
      newClient = { identificationId, phoneNumber, profession, accountBank };
      newClient.registeredBy = adminId;
      newClient.registeredDate = todayDate;

      //Update in user
      newUser = user;
      newUser.lastName = lastName;
      newUser.registeredBy = adminId;
      newUser.registeredDate = todayDate;

    } else {
      //update client
      newClient = { profession };
      newClient.registeredBy = adminId;
      newClient.registeredDate = todayDate;

      //Update in user
      newUser.name = user.name;
      newUser.lastName = lastName;
      newUser.registeredBy = adminId;
      newUser.registeredDate = todayDate;
    }

    await pool.query('START TRANSACTION');

    const clientQuery = await pool.query('UPDATE Client SET ? where idClient = ?', [newClient, idClient]);


    const userQuery = await pool.query('UPDATE User SET ? where idUser = ?', [newUser, idUser]);

    // const consultAccumulated = await pool.query('SELECT accumulatedQuantity FROM Account where idAccount = ?', [idAccount]);

    //Create an account
    const newAccount = {
      maximumAmount: maximumAmount,
      montlyFee: montlyFee,
      registeredBy: adminId,
      registeredDate: todayDate
    };
    const accountQuery = await pool.query('UPDATE Account SET ? where idAccount = ?', [newAccount, idAccount]);
    await pool.query('COMMIT');

    return { status: 200, message: "El cliente ha sido actualizado exitosamente." };

  } catch (e) {
    console.log(e);
    await pool.query('ROLLBACK');

    return { status: 500, message: "Error interno del servidor. Por favor, intente más tarde." };

  }

};

const createMultipleCustomers = async (customersData, adminId) => {

  try {

    for (let i in customersData) {

      const companyNitQuery = await pool.query('SELECT C.idCompany FROM Company C where C.nit = ?', [customersData[i].EmpresaAsociada]);
      if (companyNitQuery !== '[]') {

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
          entryDate: todayDate,
          registeredDate: todayDate,
        };

        //Insert the client
        const clientQuery = await pool.query('INSERT INTO Client SET ?', [new_client]);

        //Insert in user
        const newUser = {
          lastName: customersData[i].Apellido,
          name: customersData[i].Nombre,
          email: customersData[i].CorreoElectronico,
          registeredBy: adminId,
          registeredDate: todayDate,
          createdDate: todayDate,
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
          maximumAmount: customersData[i].CantidadMaximaPrestamo !== " " ? parseInt(customersData[i].CantidadMaximaPrestamo, 10) : parseInt(companyQuery[0].defaultAmount, 10),
          documentsUploaded: false,
          montlyFee: customersData[i].CantidadMaximaCuotas !== " " ? parseInt(customersData[i].CantidadMaximaCuotas, 10) : parseInt(companyQuery[0].maximumSplit, 10),
          totalInterest: 0,
          totalFeeAdministration: 0,
          totalOtherCollection: 0,
          totalRemainder: 0,
          approveHumanResources: companyQuery[0].approveHumanResources === 1 ? true : false,
          registeredBy: adminId,
          registeredDate: todayDate,
          Client_idClient: clientQuery.insertId
        };

        const accountQuery = await pool.query('INSERT INTO Account SET ?', [newAccount]);

      } else {
        return { status: 400, message: "La empresa asociada no se encuentra dentro de nuestros registros." };
      }
    }
    return { status: 200, message: "Los usuarios han sido registrados a la plataforma satisfactoriamente." }
  } catch (e) {
    console.log(e);
    return { status: 500, message: "Error interno del servidor" };
  }


};

const getAllCustomerWithCompanies = async () => {

  try {
    const clientRow = await pool.query('SELECT U.idUser, U.name, U.email, U.createdDate, C.idClient, C.platformState, C.identificationId, U.lastName, C.profession, C.phoneNumber, C.fixedNumber, A.idAccount, A.totalRemainder, A.maximumAmount, A.montlyFee, CO.socialReason FROM Client C JOIN User U JOIN Account A JOIN Company CO ON (C.idClient = U.Client_idClient AND A.Client_idClient = C.idClient AND C.Company_idCompany = CO.idCompany) where C.isDeleted = ?', [false]);
    if (clientRow) {
      return { status: 200, data: clientRow };
    } else {
      return { status: 500, message: "Error interno del servidor." };
    }
  } catch (e) {
    console.log(e);
    return { status: 500, message: "Error interno del servidor." };
  }

};

const getCustomerToApprove = async () => {

  try {
    const clientRow = await pool.query('SELECT N.idNewClient, N.phoneNumber, N.name, N.lastName, N.email, N.createdDate, N.identificationId, N.totalRemainder, CO.socialReason, CO.defaultAmount, CO.maximumSplit, CO.address, CO.idCompany, N.file1, N.file2, N.file3 FROM NewClient N JOIN Company CO ON (N.Company_idCompany = CO.idCompany) where (N.status = ?)', [0]);

    //const cycles = await pool.query('SELECT CS.idCompanySalaries, CS.companyRateName, CS.companyReportDates, CS.companyPaymentDates FROM CompanySalaries CS JOIN Company_has_CompanySalaries CHS ON (CHS.CompanySalaries_idCompanySalaries = CS.idCompanySalaries) where (CHS.Company_idCompany = ?)', clientRow[0].idCompany);

    if (clientRow) {
      return { status: 200, data: clientRow };
    } else {
      return { status: 500, message: "Error interno del servidor." };
    }
  } catch (e) {
    console.log(e);
    return { status: 500, message: "Error interno del servidor." };
  }

};

const getCustomerCountToApprove = async () => {

  try {
    const clientRow = await pool.query('SELECT count(N.idNewClient) as count FROM NewClient N JOIN Company CO ON (N.Company_idCompany = CO.idCompany) where (N.status = ?)', [0]);

    if (clientRow) {
      return { status: 200, data: clientRow[0] };
    } else {
      return { status: 500, message: "Error interno del servidor." };
    }
  } catch (e) {
    console.log(e);
    return { status: 500, message: "Error interno del servidor." };
  }

};

const getDatesListToCustomer = async (companyid) => {

  try {

    //console.log("CI", companyid);

    const cycles = await pool.query('SELECT CS.idCompanySalaries, CS.companyRateName, CS.companyReportDates, CS.companyPaymentDates FROM CompanySalaries CS JOIN Company_has_CompanySalaries CHS ON (CHS.CompanySalaries_idCompanySalaries = CS.idCompanySalaries) where (CHS.Company_idCompany = ?)', companyid);

    //console.log("cycles", cycles);

    if (cycles) {
      return { status: 200, data: cycles };
    } else {
      return { status: 500, message: "Error interno del servidor." };
    }
  } catch (e) {
    console.log(e);
    return { status: 500, message: "Error interno del servidor." };
  }

};

const getTransactionsByUsersId = async (userId) => {

  try {
    const transactionRow = await pool.query('SELECT T.idTransaction, T.quantity, T.transactionType, T.createdDate FROM User U JOIN Client C JOIN Account A JOIN Transaction T ON (C.idClient = U.Client_idClient AND A.Client_idClient = C.idClient AND T.Account_idAccount = A.idAccount) where U.idUser = ?', [userId]);

    if (transactionRow) {
      return { status: 200, data: transactionRow };
    } else {
      return { status: 500, message: "Error interno del servidor." };
    }
  } catch (e) {
    return { status: 500, message: "Error interno del servidor." };
  }

};


// get * newclient
const getNewClientByIdNewClient = async (con,idNewClient) => {

  try {
    const newClient = await con.query('SELECT * FROM NewClient where idNewClient = ?', [idNewClient]);

    if (newClient) {
      return { status: 200, data: newClient[0] };
    } else {
      console.log(con.error)
      return { status: 500, message: "Error interno del servidor." };
    }
  } catch (e) {
    return { status: 500, message: "Error interno del servidor." };
  }

};

// get * newclient
const getClientByClientId = async (con,clientId) => {

  try {
    const userRow = await con.query('SELECT C.idClient, C.identificationId, CO.socialReason, U.idUser FROM Client C JOIN User U JOIN Company CO ON (C.idClient = U.Client_idClient AND CO.idCompany = C.Company_idCompany ) where C.idClient = ?', [clientId]);

    if (userRow) {
      return { status: 200, data: userRow };
    } else {
      console.log(con.error)
      return { status: 500, message: "Error interno del servidor." };
    }
  } catch (e) {
    return { status: 500, message: "Error interno del servidor." };
  }

};

// get * newclient
const insertClientDocuments = async (con,filesPath) => {

  try {
    let fileQuery = await con.query('INSERT INTO ClientDocuments SET ?', [filesPath]);

    if (fileQuery) {
      return { status: 200, data: fileQuery };
    } else {
      console.log(con.error)
      return { status: 500, message: "Error interno del servidor." };
    }
  } catch (e) {
    console.log(e)
    return { status: 500, message: "Error interno del servidor." };
  }

};

// get * Client
const insertClient = async (con,client) => {

  try {
    const clientQuery = await con.query('INSERT INTO client SET ?', [client]);
    if (clientQuery) {
      return { status: 200, data: clientQuery };
    } else {
      console.log(con.error)
      return { status: 500, message: "Error interno del servidor." };
    }
  } catch (e) {
    console.log(e)
    return { status: 500, message: "Error interno del servidor." };
  }

};



const insertAccount = async (con,newAccount) => {

  try {
    const accountQuery = await con.query('INSERT INTO account SET ?', [newAccount]);

    if (accountQuery) {
      return { status: 200, data: accountQuery };
    } else {
      console.log(con.error)
      return { status: 500, message: "Error interno del servidor." };
    }
  } catch (e) {
    console.log(e);
    return { status: 500, message: "Error interno del servidor no SQL." };
  }

};


const updateStateNewClient = async (con,newClientId,newClientState) => {

  try {
    const updateNewClient = await con.query('UPDATE NewClient SET status = ? where idNewClient = ?', [newClientState, newClientId]);

    if (updateNewClient) {
      return { status: 200, data: updateNewClient };
    } else {
      console.log(con.error)
      return { status: 500, message: "Error interno del servidor." };
    }
  } catch (e) {
    return { status: 500, message: "Error interno del servidor." };
  }

};

//Pendiente traer IDENTIFICATION ID
const approveCustomers = async (clientid, approve, adminId, cycleId, rere_id) => {

  try {


    // const newClient = await pool.query('SELECT * FROM NewClient where idNewClient = ?', [clientid]);


    if (approve === "true") {

      try {
        await pool.query('START TRANSACTION');

        //console.log("CI", clientid, approve, cycleId);

        const updateNewClient = await pool.query('UPDATE NewClient SET status = ? where idNewClient = ?', [1, clientid]);

        //const newClient = await pool.query('SELECT * FROM NewClient where idNewClient = ?', [clientid]);

        //DocumentClients
        // const filesPath = {
        //   documentId: newClient[0].file1,
        //   paymentReport: newClient[0].file3
        // };

        // const fileQuery = await pool.query('INSERT INTO ClientDocuments SET ?', [filesPath]);

        //New Client
        // const client = {
        //   identificationId: newClient[0].identificationId,
        //   documentType: newClient[0].documentType,
        //   birthDate: newClient[0].birthDate.toISOString().split("T")[0],
        //   city: newClient[0].city,
        //   //salary: newClient[0].salary,
        //   phoneNumber: newClient[0].phoneNumber,
        //   Company_idCompany: newClient[0].Company_idCompany,
        //   registeredBy: 1,
        //   //registeredDate: todayDate,
        //   entryDate: todayDate.split(" ")[0],
        //   rejectState: false,
        //   isDeleted: false,
        //   platformState: true,
        //   //createdDate: todayDate,
        //   ClientDocuments_idClientDocuments: fileQuery.insertId,
        //   CompanySalaries_idCompanySalaries: cycleId,

        // };

        // //console.log("Client", client);

        // const clientQuery = await pool.query('INSERT INTO Client SET ?', [client]);
         console.log(clientQuery);
        //var clientSql = `INSERT INTO client (identificationId,documentType,birthDate,city,phoneNumber,Company_idCompany,registeredBy,entryDate,rejectState,isDeleted,platformState,ClientDocuments_idClientDocuments,CompanySalaries_idCompanySalaries ) VALUES ('${client.identificationId}','${client.documentType}','${client.birthDate}','${client.city}','${client.phoneNumber}','${client.Company_idCompany}','${client.registeredBy}', '${client.entryDate}',${client.rejectState},${client.isDeleted},${client.platformState},'${client.ClientDocuments_idClientDocuments}','${client.CompanySalaries_idCompanySalaries}')`;
        //const clientQuery = await pool.query(clientSql);

        //Insert in user
        // const newUser = {
        //   name: newClient[0].name,
        //   lastName: newClient[0].lastName,
        //   email: newClient[0].email,
        //   status: true,
        //   registeredBy: 1,
        //   registeredDate: todayDate,
        //   createdDate: todayDate,
        //   Role_idRole: 4,
        //   Client_idClient: clientQuery.insertId,
        //   isConfirmed: true,
        //   Company_idCompany: newClient[0].Company_idCompany
        // };
        // console.log("Se manda a insertar el User");

        // const userQuery = await pool.query('INSERT INTO User SET ?', [newUser]);

        //Create an account
        // const companyQuery = await pool.query('SELECT C.maximumSplit, C.defaultAmount, C.approveHumanResources FROM Company C where C.idCompany = ?', [newClient[0].Company_idCompany]);
        // const newAccount = {
        //   maximumAmount: companyQuery[0].defaultAmount,
        //   accumulatedQuantity: 0,
        //   documentsUploaded: true,
        //   montlyFee: companyQuery[0].maximumSplit,
        //   totalInterest: 0, totalFeeAdministration: 0,
        //   totalOtherCollection: 0, totalRemainder: 0,
        //   approveHumanResources: companyQuery[0].approveHumanResources === 1 ? true : false,
        //   registeredBy: 1,
        //   registeredDate: todayDate,
        //   Client_idClient: clientQuery.insertId,
        //   lastAdministrationDate: todayDate
        // };
        // console.log("Se manda a insertar el Account");

        // const accountQuery = await pool.query('INSERT INTO Account SET ?', [newAccount]);

        //Insert into auth
        //todayDate.setHours(todayDate.getHours() + expirationTime)
        const new_date = new Date();
        new_date.setHours(new_date.getHours() + expirationTime);

        const newAuth = {
          User_idUser: userQuery.insertId,
          registeredBy: 1,
          registeredDate: todayDate,
          createdDate: todayDate,
          password: newClient[0].password,
          expiresOn: new_date.toISOString().replace(/T/, ' ').replace(/\..+/, ''),
        };

        console.log("Se manda a insertar el auth");

        const authQuery = await pool.query('INSERT INTO Auth SET ?', [newAuth]);

        //Confirmation link
        const consultEmail = await pool.query('SELECT U.email, U.name FROM Client C JOIN User U ON (C.idClient = U.Client_idClient) where C.idClient = ?', [clientQuery.insertId]);
        const userRow = await pool.query('SELECT C.idClient, C.identificationId, CO.socialReason, U.idUser FROM Client C JOIN User U JOIN Company CO ON (C.idClient = U.Client_idClient AND CO.idCompany = C.Company_idCompany ) where C.idClient = ?', [clientQuery.insertId]);
        const jwtoken = await jwt.sign({ userRow }, my_secret_key, { expiresIn: '30m' });
        const url = base_URL + `/Account/Confirm/${jwtoken}`;
        //console.log(url.toString());
        console.log("Se hace commit");

        await pool.query('COMMIT');
        //Mailer
        let userData = {
          email: consultEmail[0].email,
          name: consultEmail[0].name,
          url: front_URL,
          base_URL_test: base_URL + "/confirmation.png",
          footer: base_URL + "/footer.png",
          link: url,
        };

        var subject = 'Avanzo (Créditos al instante) - Confirmación de cuenta';
        var text = 'Avanzo';
        var template = ACCOUNT_CONFIRMATION;
        sendEmail(template, userData, NAME_FILE_CONTRACT, ATTACHMENT_TYPES.PDF, subject, text, PATH_FILE_CONTRACT)
        //Send SMS 
        if (ENVIRONMENT === 'production') {
          const smsCodesQuery = await pool.query('SELECT sms_co_id,sms_co_body FROM avanzo.sms_codes WHERE sms_co_id = ? ', [SMS_CODES.APPROVED_CLIENT]);
          sendSMS(newClient[0].phoneNumber, smsCodesQuery[0].sms_co_body);
        }


        return { status: 200, message: "El usuario ha sido aprobado exitosamente." };

      } catch (error) {
        await pool.query('ROLLBACK');
        console.log("line 624", error);
        return { status: 500, message: error };

      }

    } else {


      try {
        await pool.query('START TRANSACTION');

        const clientQuery = await pool.query('UPDATE NewClient SET status = ?,rere_id = ? where idNewClient = ?', [PRE_CLIENT_STATES.REJECTED, rere_id, clientid]);
        //enviar correo y SMS de usuario rechazado
        await pool.query('COMMIT');

        //Mailer
        let userData = {
          email: newClient[0].email,
          name: newClient[0].name,
          url: front_URL,
          base_URL_test: base_URL + "/confirmation.png",
          footer: base_URL + "/footer.png",
        };

        var subject = 'Avanzo (Créditos al instante) - Rechazo de cuenta';
        var text = 'Avanzo';
        var template = ACCOUNT_REJECTED;
        sendEmail(template, userData, '', '', subject, text, '');
        //Send SMS 
        if (ENVIRONMENT === 'production') {
          const smsCodesQuery = await pool.query('SELECT sms_co_id,sms_co_body FROM avanzo.sms_codes WHERE sms_co_id = ? ', [SMS_CODES.CLIENT_REJECTED]);
          sendSMS(newClient[0].phoneNumber, smsCodesQuery[0].sms_co_body);
        }

        return { status: 200, message: "El usuario ha sido rechazado exitosamente." };
      } catch (error) {
        await pool.query('ROLLBACK');
        console.log("line 661", error);
        return { status: 500, message: error };
      }
    }
  } catch (e) {
    console.log("line 666", e);
    await pool.query('ROLLBACK');

    return { status: 500, message: e.sqlMessage };
  }

};

const changeCustomersStatus = async (clientid, active) => {

  //console.log("CI", clientid, active);

  try {
    if (active === "true") {
      const clientQuery = await pool.query('UPDATE Client SET platformState = ? where idClient = ?', [true, clientid]);
      return { status: 200, message: { message: "El usuario ha sido activado exitosamente." } };
    } else {
      const clientQuery = await pool.query('UPDATE Client SET platformState = ? where idClient = ?', [false, clientid]);
      return { status: 200, message: { message: "El usuario ha sido inactivado exitosamente." } };
    }
  } catch (e) {
    console.log(e);
    return { status: 500, message: "Error interno del servidor." };
  }

};

const deleteUser = async (clientid) => {

  //console.log("CI", clientid, active);

  try {
    const clientQuery = await pool.query('UPDATE Client SET isDeleted = ? where idClient = ?', [true, clientid]);
    return { status: 200, message: { message: "El usuario ha sido eliminado exitosamente." } };
  } catch (e) {
    console.log(e);
    return { status: 500, message: "Error interno del servidor." };
  }

};

const makePayments = async (clientid, quantity) => {

  try {

    //Account - Request
    const userRow = await pool.query('SELECT ACCOUNT.idAccount, ACCOUNT.maximumAmount, ACCOUNT.partialCapacity, ACCOUNT.accumulatedQuantity, CLIENT.identificationId FROM Client CLIENT JOIN Account ACCOUNT ON (ACCOUNT.Client_idClient = CLIENT.idClient ) where CLIENT.idClient = ?', [clientid]);

    //console.log("PC", userRow[0].maximumAmount, "AQ", userRow[0].accumulatedQuantity, "Q", quantity);

    //const newPartialCapacity = (parseInt(userRow[0].maximumAmount, 10) - parseInt(userRow[0].accumulatedQuantity, 10) + parseInt(quantity, 10));
    //console.log("NPC", newPartialCapacity);
    const newAccumulatedQuantity = (parseInt(userRow[0].accumulatedQuantity, 10) - parseInt(quantity, 10));
    //console.log("NPC", newAccumulatedQuantity);
    const newAccount = { accumulatedQuantity: newAccumulatedQuantity };

    //console.log("newAccount", newAccount);

    const updateAccount = await pool.query('UPDATE Account SET ? where Client_idClient = ?', [newAccount, clientid]);

    //Transaction
    const paymentTransaction = { quantity: quantity, transactionType: "Pago", createdDate: todayDate, registeredDate: new Date, Account_idAccount: userRow[0].idAccount }

    //Transaction Query
    const transactionQuery = await pool.query('INSERT INTO Transaction SET ?', [paymentTransaction]);


    //const clientQuery = await pool.query('UPDATE Client SET platformState = ? where idClient = ?', [true, clientid]);
    return { status: 200, message: { message: "El pago ha sido realizado exitosamente." } };
    //}else{
    //const clientQuery = await pool.query('UPDATE Client SET platformState = ? where idClient = ?', [false, clientid]);
    //return {status: 200, message: {message: "El pago no ha sido realizado exitosamente."}};
    //}
  } catch (e) {
    console.log(e);
    return { status: 500, message: "Error interno del servidor." };
  }

};

const getCustomerAccountDetail = async (clientid) => {

  try {
    const clientRow = await pool.query('SELECT U.name, U.lastName, U.email, U.createdDate, C.identificationId, C.phoneNumber, A.maximumAmount, A.montlyFee, A.partialCapacity, A.totalCapital, A.totalInterest, A.totalFeeAdministration, A.totalOtherCollection, A.totalRemainder, A.computedCapacity, CO.socialReason FROM Client C JOIN User U JOIN Account A JOIN Company CO ON (C.idClient = U.Client_idClient AND A.Client_idClient = C.idClient AND C.Company_idCompany = CO.idCompany) where C.idClient = ?', [clientid]);
    return { status: 200, data: clientRow[0] };
  } catch (e) {
    console.log(e);
    return { status: 500, message: "Error interno del servidor." };
  }

};


const updateStateCustomer = async (idClient, clie_state) => {


  try {
    const clientQuery = await pool.query('UPDATE Client SET clie_state = ? where idClient = ?', [clie_state, idClient]);
    return { status: 200, message: { message: "El Cliente cambio de estado exitosamente." } };
  } catch (e) {
    console.log(e);
    return { status: 500, message: "Error interno del servidor." };
  }

};

module.exports = {
  getInitialsData, getRequestsData, getAllCustomers, createCustomer, createMultipleCustomers,
  getAllCustomerWithCompanies, getTransactionsByUsersId, getCustomersByAdmin, getCustomerToApprove,
  approveCustomers, changeCustomersStatus, updateCustomers, makePayments, getDatesListToCustomer,
  deleteUser, getCustomerAccountDetail, getCustomerCountToApprove, updateStateCustomer,getNewClientByIdNewClient,
  insertClientDocuments,insertClient,insertAccount,getClientByClientId,updateStateNewClient
}