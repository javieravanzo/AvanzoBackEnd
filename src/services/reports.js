//Requires
const pool = require('../config/database.js');
const { excluded_account } = require('../config/global');

//Functions
function parseLocaleNumber(stringNumber) {
  var thousandSeparator = (1111).toLocaleString().replace(/1/g, '');
  var decimalSeparator = (1.1).toLocaleString().replace(/1/g, '');

  return parseFloat(stringNumber
      .replace(new RegExp('\\' + thousandSeparator, 'g'), '')
      .replace(new RegExp('\\' + decimalSeparator), '.')
  );
};

function checkFinalBankState(state, observation, stateRow){

  //Differents states
  let stateOutlay =  getStateIdFromName(stateRow, "Finalizada");
  let stateBankRejected =  getStateIdFromName(stateRow, "Devolución bancaria");
  let stateDefinitelyRejected =  getStateIdFromName(stateRow, "Devolución bancaria");
  let stateWaitingBankOutLay = getStateIdFromName(stateRow, "Pendientes desembolsar por banco");

  //Return variables
  let newState;
  let newObservation;
  let newTransactionState;
  let newTransactionCode;

  if(state === "Pago Exitoso"){
    //console.log("Entro1");
    newState = stateOutlay;
    newObservation = "Solicitud finalizada";
    newTransactionState = true;
    newTransactionCode = "Aprobado";
  }else if(state ===  "Pago Rechazado"){
    //console.log("Entro2");
    if(observation === "Id. no Coincide"){
      //console.log("Entro3");
      newState = stateDefinitelyRejected;
      newObservation = "La cédula no existe o no coincide con los registros";
      newTransactionState = false;
      newTransactionCode = "Rechazado Banco";
    }else if(observation === "Cuenta Invalida"){
      //console.log("Entro4");
      newState = stateBankRejected;
      newObservation = "Algunos datos de la cuenta no coinciden.";
      newTransactionState = false;
      newTransactionCode = "Rechazado Banco";
    }
  }else if(state === "Enviado a Otro Banco"){
    //console.log("Entro5");
    newState = stateWaitingBankOutLay;
    newObservation = "La solicitud está pendiente de desembolsar por el banco.";
    newTransactionState = false;
    newTransactionCode = "Pendiente Banco";
  }

  let data = {
    newState,
    newObservation,
    newTransactionState,
    newTransactionCode
  };

  return data;

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

  //Slect StateRequest
  const stateRow = await pool.query('SELECT * FROM RequestState');

  //Differents states
  let stateOutlay =  getStateIdFromName(stateRow, "En desembolso");

  try {
    const clientRow =  await pool.query('SELECT C.documentType as "Tipo de Identificacion", C.identificationId as "Numero de Identificacion", U.name as "Nombre", U.lastName as "Apellido", BA.bankCode as "Codigo del Banco", R.accountType as "Tipo de Producto o Servicio", R.accountNumber as "Numero del Producto o Servicio", R.quantity as "Valor del Pago o de la recarga", R.idRequest as "Referencia", U.email as "Correo Electronico", CO.socialReason as "Descripcion o Detalle" FROM Client C JOIN User U JOIN Account A JOIN Company CO JOIN Request R JOIN Bank BA ON (C.idClient = U.Client_idClient AND A.Client_idClient = C.idClient AND C.Company_idCompany = CO.idCompany AND R.Account_idAccount = A.idAccount AND R.account = BA.bankName) where R.RequestState_idRequestState = ? and R.account <> ?', [stateOutlay, excluded_account]);
    
    return {status: 200, data: clientRow, message: "OK"};
  
  }catch(e){
    console.log("Error", e);
    return {status: 400, message: "Error al generar el archivo del banco."};
  
  }

};

const generatePendingBankRequest = async () => {

  //Slect StateRequest
  const stateRow = await pool.query('SELECT * FROM RequestState');

  //Differents states
  let stateWaitingBankOutLay =  getStateIdFromName(stateRow, "Pendientes desembolsar por banco");

  try {
    const clientRow =  await pool.query('SELECT C.documentType as "Tipo de Identificacion", C.identificationId as "Numero de Identificacion", U.name as "Nombre", U.lastName as "Apellido", BA.bankCode as "Codigo del Banco", R.accountType as "Tipo de Producto o Servicio", R.accountNumber as "Numero del Producto o Servicio", R.quantity as "Valor del Pago o de la recarga", R.idRequest as "Referencia", U.email as "Correo Electronico", CO.socialReason as "Descripcion o Detalle" FROM Client C JOIN User U JOIN Account A JOIN Company CO JOIN Request R JOIN Bank BA ON (C.idClient = U.Client_idClient AND A.Client_idClient = C.idClient AND C.Company_idCompany = CO.idCompany AND R.Account_idAccount = A.idAccount AND R.account = BA.bankName) where R.RequestState_idRequestState = ? and R.account <> ?', [stateWaitingBankOutLay, excluded_account]);
    
    return {status: 200, data: clientRow, message: "OK"};
  }catch(e){
    console.log("Err", e);
    return {status: 400, message: "Error al generar el archivo del banco."};
  }

};

const generatePendingByHumanResources = async (companyIdToNotInclude) => {

  //Slect StateRequest
  const stateRow = await pool.query('SELECT * FROM RequestState');

  //Differents states
  let statePendingRRHH =  getStateIdFromName(stateRow, "Aprobada Recursos Humanos");

  try {
    const clientRow =  await pool.query('SELECT CO.socialReason as "EMPRESA", U.name as "NOMBRE", C.identificationId as "CEDULA", R.quantity as "MONTO", R.totalValue as "TOTAL A PAGAR", R.split as "CUOTAS", U.lastname as "ESTADO (RESPUESTA DE LA EMPRESA)" FROM Company CO JOIN Client C JOIN User U JOIN Account A JOIN Request R ON (C.idClient = U.Client_idClient AND A.Client_idClient = C.idClient AND C.Company_idCompany = CO.idCompany AND R.Account_idAccount = A.idAccount) where R.RequestState_idRequestState = ? and CO.idCompany <> ? and R.sendRRHHEmail <> ?', [statePendingRRHH, companyIdToNotInclude, true]);
    
    const updateRequest = await pool.query('UPDATE Request R JOIN Account A JOIN Client C SET R.sendRRHHEmail = true where (R.createdDate < NOW() and R.sendRRHHEmail = ? and C.Company_idCompany <> ?)', [false, companyIdToInclude]);
    
    return {status: 200, data: clientRow, message: "OK"};
  
  }catch(e){
    console.log("Err", e);
    return {status: 400, message: "Error al generar el archivo del banco."};
  }

};

const generateParticularPendingByRRHH = async (companyIdToInclude) => {

  //Slect StateRequest
  const stateRow = await pool.query('SELECT * FROM RequestState');

  //Differents states
  let statePendingRRHH =  getStateIdFromName(stateRow, "Aprobada Recursos Humanos");

  try {
    const clientRow =  await pool.query('SELECT C.identificationId as "CEDULA", U.name as "NOMBRE", C.entryDate as "FECHA INGRESO", C.salary as "SALARIO", R.quantity as "MONTO", R.totalValue as "TOTAL A PAGAR", R.split as "CUOTAS", U.lastname as "ESTADO (RESPUESTA DE LA EMPRESA)" FROM Company CO JOIN Client C JOIN User U JOIN Account A JOIN Request R ON (C.idClient = U.Client_idClient AND A.Client_idClient = C.idClient AND C.Company_idCompany = CO.idCompany AND R.Account_idAccount = A.idAccount) where R.RequestState_idRequestState = ? and CO.idCompany = ? and R.sendRRHHEmail <> ?', [statePendingRRHH, companyIdToInclude, true]);
    
    const updateRequest = await pool.query('UPDATE Request R JOIN Account A JOIN Client C SET R.sendRRHHEmail = true where (R.createdDate < NOW() and R.sendRRHHEmail = ? and C.Company_idCompany = ?)', [false, companyIdToInclude]);

    return {status: 200, data: clientRow, message: "OK"};
  
  }catch(e){
    console.log("Err", e);
    return {status: 400, message: "Error al generar el archivo del banco."};
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

              const stateRow = await pool.query('SELECT * FROM RequestState');
              
              //Ahí actualizo a:
              //1.  Finalizada si el campo dice Pago Exitoso.
              //2. Devolución bancaria si dice Pago Rechazado y agrega observación.
              //3. Pendientes por banco cuando estén en período de espera para desembolsar.

              //RejectedPayment
              let rejectedObservation = readData[i].Motivo !== undefined ? readData[i].Motivo.split("|")[0] : null;

              //GetCurrentStates
              let statesAndInfo = checkFinalBankState(readData[i].Estado, rejectedObservation, stateRow);

              //console.log("State", statesAndInfo);

              //Cuerpo de la solicitud.
              let requestBody = {
                RequestState_idRequestState: statesAndInfo.newState,
                bankTransactionState: statesAndInfo.newTransactionState,
                observation: statesAndInfo.newObservation,
                registeredDate: new Date().toLocaleString("es-CO", {timeZone: "America/Bogota"}),
                registeredBy: 0, 
                bankTransactionCode: statesAndInfo.newTransactionCode 
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
    console.log("Error", e);
    return {status: 400, message: "El archivo no ha sido leído correctamente, porque tiene datos que no se pueden interpretar o contiene columnas adicionales."};
  }

};

module.exports = {
  generateBankReports, readBankReport, generatePendingBankRequest, generatePendingByHumanResources, 
  generateParticularPendingByRRHH
};