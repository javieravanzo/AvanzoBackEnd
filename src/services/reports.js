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

//Functions
function parseLocaleNumber(stringNumber) {
  var thousandSeparator = (1111).toLocaleString().replace(/1/g, '');
  var decimalSeparator = (1.1).toLocaleString().replace(/1/g, '');

  return parseFloat(stringNumber
      .replace(new RegExp('\\' + thousandSeparator, 'g'), '')
      .replace(new RegExp('\\' + decimalSeparator), '.')
  );
};

function getStateIdFromName (row, name){
  
  let id = null;

  for (let i in row){
    const item = row[i];
    
    if(item.name === name){
      return (parseInt(item.idRequestState, 10));
    }
  }

  return parseInt(id,10);
  
};

//Services
const generateBankReports = async () => {

  try {
    const clientRow =  await pool.query('SELECT C.documentType as "Tipo de Identificacion", C.identificationId as "Numero de Identificacion", U.name as "Nombre", U.lastName as "Apellido", BA.bankCode as "Codigo del Banco", R.accountType as "Tipo de Producto o Servicio", R.accountNumber as "Numero del Producto o Servicio", R.quantity as "Valor del Pago o de la recarga", R.idRequest as "Referencia", U.email as "Correo Electronico", CO.socialReason as "Descripcion o Detalle" FROM Client C JOIN User U JOIN Account A JOIN Company CO JOIN Request R JOIN Bank BA ON (C.idClient = U.Client_idClient AND A.Client_idClient = C.idClient AND C.Company_idCompany = CO.idCompany AND R.Account_idAccount = A.idAccount AND R.account = BA.bankName) where R.RequestState_idRequestState = ?', [4]);
    
    return {status: 200, data: clientRow, message: "OK"};
  }catch(e){
    return {status: 404, message: "FAIL"};
  }

};

const readBankReport = async (readData, writeData) => {

  try{
   
    for (let i in readData){

      for (let j in writeData){

        let completeName = writeData[j].Nombre + " " + writeData[j].Apellido;

        //console.log("Nombre", completeName, readData[i].Titular);

        //Comparar nombre
        if( completeName === readData[i].Titular){
          
          //console.log("No. Cuenta", writeData[j]['Numero del Producto o Servicio'], (readData[i]['Numero Destino']).slice(-4));

          //Comparar número de cuenta
          if ( (writeData[j]['Numero del Producto o Servicio']).slice(-4) === (readData[i]['Numero Destino']).slice(-4) ) {
                      
            let readValue = parseLocaleNumber((readData[i].Valor).replace('$', '').replace('.', '').replace(',', '.'));

            //console.log("Valor", parseInt(writeData[j]['Valor del Pago o de la recarga'], 10), parseInt(readValue, 10));

            //Comparar el valor
            if (parseInt(writeData[j]['Valor del Pago o de la recarga'], 10) === parseInt(readValue, 10)){

              //Si todo coincide, hago un spli del campo Referencia y saco el id de la solicitud.
              let requestId = writeData[j]['Referencia'].split(' ')[0];


              //Change the approval/reject state
              const stateRow = await pool.query('SELECT * FROM RequestState');
              
              //Ahí actualizo a:
              //1.  Finalizada si el campo dice Pago Exitoso
              //2. Devolución bancaria si dice Pago Rechazado y agrega observación
              //Tomar las solicitudes que están en desembolso.
              let stateOutlay =  getStateIdFromName(stateRow, "Finalizada");
              let stateBankRejected =  getStateIdFromName(stateRow, "Devolución bancaria");

              //Cuerpo de la solicitud.
              let requestBody = {
                RequestState_idRequestState: (readData[i].Estado === "Pago Exitoso") ? stateOutlay : stateBankRejected,
                bankTransactionState: (readData[i].Estado === "Pago Exitoso") ? true : false,
                observation: (readData[i].Estado === "Pago Exitoso") ? "Solicitud finalizada" : readData[i].Motivo, 
                registeredDate: new Date(),
                registeredBy: 0, 
                bankTransactionCode: (readData[i].Estado === "Pago Exitoso") ? "Aprobado" : "Rechazado Banco",
              };

              //console.log("RI", requestId);
              //console.log("RB", requestBody);
              
              const updateRequest = await pool.query('UPDATE Request set ? WHERE idRequest = ?', [requestBody, requestId]);

              //console.log("Se pudo concretar.");
            }

          }

        }
         
      }
    }

    return {status: 200, message: "Los archivos han sido leídos correctamente."};
  }catch(e){
    return {status: 404, message: "El archivo no ha sido leído correctamente."};
  }

};

module.exports = {
  generateBankReports, readBankReport
};