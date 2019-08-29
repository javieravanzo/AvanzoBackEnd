//Requires
const pool = require('../config/database.js');

//Services
const getInitialsData = async (customerId) => {

  try {
      const userRow = await pool.query('SELECT ACCOUNT.idAccount, ACCOUNT.maximumAmount, ACCOUNT.partialCapacity FROM client CLIENT JOIN user USER JOIN account ACCOUNT ON (CLIENT.idClient = USER.Client_idClient AND ACCOUNT.Client_idClient = CLIENT.idClient ) where user.idUser = ?', [customerId]);
      const transactions = await pool.query('SELECT * FROM transaction where Account_idAccount = ?', [userRow[0].idAccount]);
      const request = await pool.query('SELECT REQUEST.idRequest FROM request REQUEST JOIN requeststate REQUESTSTATE ON (REQUESTSTATE.idRequestState = REQUEST.RequestState_idRequestState AND REQUESTSTATE.name <> "Desembolsada") where REQUEST.Account_idAccount = ?', [userRow[0].idAccount]);
      if(userRow){
          return {status: 200, message: "", 
                  data: {
                    maximumAmount: userRow[0].maximumAmount,
                    partialCapacity: userRow[0].partialCapacity,
                    transactions: transactions,
                    request: request,
                  }
                 };
      }else{
          return {status: 500, message: "Error interno del servidor."};
      }
  } catch(e) {
      return {status: 500, message: "Error interno del servidor."};
      throw e;
  }
};

const getRequestsData = async (customerId) => {

  try {
      const userRow =  await pool.query('SELECT CLIENT.Company_idCompany, ACCOUNT.idAccount, ACCOUNT.maximumAmount, ACCOUNT.partialCapacity, ACCOUNT.documentsUploaded FROM client CLIENT JOIN user USER JOIN account ACCOUNT ON (CLIENT.idClient = USER.Client_idClient AND ACCOUNT.Client_idClient = CLIENT.idClient ) where user.idUser = ?', [customerId]);
      const companyInfo = await pool.query('SELECT maximumSplit FROM company where idCompany = ?', [userRow[0].Company_idCompany]);
      const interest = await pool.query('SELECT interestValue FROM interestrequest');
      console.log(interest);
      const adminFee = await pool.query('SELECT managementPaymentValue FROM managementpayment');
    console.log(adminFee);
      if(userRow){
          return {status: 200, message: "", 
                  data: {
                    maximumAmount: userRow[0].maximumAmount,
                    maximumSplit: companyInfo[0].maximumSplit,
                    haveDocumentsLoaded: userRow[0].documentsUploaded,
                    interestValue: interest[0].interestValue,
                    adminValue: adminFee[0].managementPaymentValue,
                    otherCollectionValue: 0,
                  }
                 };
      }else{
          return {status: 500, message: "Error interno del servidor."};
      }
  } catch(e) {
      return {status: 500, message: "Error interno del servidor."};
      throw e;
  }
};

module.exports = {
  getInitialsData, getRequestsData
}