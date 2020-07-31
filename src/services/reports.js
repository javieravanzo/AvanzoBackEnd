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
const pool = require('../config/database.js');


//Services
const generateBankReports = async () => {

  try {
    const clientRow =  await pool.query('SELECT C.documentType as "Tipo de Identificacion", C.identificationId as "Numero de Identificacion", U.name as "Nombre", U.lastName as "Apellido", BA.bankCode as "Codigo del Banco", R.accountType as "Tipo de Producto o Servicio", R.accountNumber as "Numero del Producto o Servicio", R.quantity as "Valor del Pago o de la recarga", R.idRequest as "Referencia", U.email as "Correo Electronico", CO.socialReason as "Descripcion o Detalle" FROM Client C JOIN User U JOIN Account A JOIN Company CO JOIN Request R JOIN Bank BA ON (C.idClient = U.Client_idClient AND A.Client_idClient = C.idClient AND C.Company_idCompany = CO.idCompany AND R.Account_idAccount = A.idAccount AND R.account = BA.bankName)');
    
    return {status: 200, data: clientRow, message: "OK"};
  }catch(e){
    return {status: 404, message: "FAIL"};
  }

};

module.exports = {
  generateBankReports
};