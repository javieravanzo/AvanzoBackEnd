
//Requires
const jwt = require('jsonwebtoken');
const Excel = require('xlsx');
const { banks } = require('../utils/constants.js');
const { utils } = require('../utils/utils.js');

var fs = require('fs');
//Imports
const { generateBankReports, readBankReport, generatePendingBankRequest,
  generatePendingByHumanResources, generateParticularPendingByRRHH } = require('../services/reports');
const dbSequelize = require('../config/database_sequelize.js');
const { REQUEST_STATE } = require('../utils/constants.js');

//Functions
function getAdminId(req) {
  //Get the admin with token

  //Get the clientId
  const bearerHeader = req.headers['authorization'];
  //Get the real token
  const bearer = bearerHeader.split(" ")[1];
  //Set the token
  const decoded = jwt.decode(bearer);
  return (decoded.userRow[0].Administrator_idAdministrator);

};

function processQueryData(data, bank_id) {

  let newArray = [];

  let arrayLength = parseInt(data.length);

  switch (parseInt(bank_id, 10)) {
    case banks.BANCO_DAVIVIENDA:
      for (let i = 0; i < arrayLength; i++) {

        let newObject = data[i];

        if (newObject['Tipo de Identificacion'] === 'Cédula') {
          newObject['Tipo de Identificacion'] = '1';
        } else if (newObject['Tipo de Identificacion'] === 'Cédula de Extranjería') {
          newObject['Tipo de Identificacion'] = '2';
        } else if (newObject['Tipo de Identificacion'] === 'Pasaporte') {
          newObject['Tipo de Identificacion'] = '5';
        }

        if (newObject['Tipo de Producto o Servicio'] === 'Cuenta corriente') {
          newObject['Tipo de Producto o Servicio'] = 'CC';
        } else if (newObject['Tipo de Producto o Servicio'] === 'Cuenta de ahorros') {
          newObject['Tipo de Producto o Servicio'] = 'CA';
        } else if (newObject['Tipo de Producto o Servicio'] === 'Tarjeta Prepago Maestro') {
          newObject['Tipo de Producto o Servicio'] = 'TP';
        } else if (newObject['Tipo de Producto o Servicio'] === 'Depósitos Electrónicos') {
          newObject['Tipo de Producto o Servicio'] = 'DE';
        } else if (newObject['Tipo de Producto o Servicio'] === 'null') {
          if (newObject['Codigo del Banco'] === '51') {
            newObject['Tipo de Producto o Servicio'] = 'DP';
          } else {
            newObject['Tipo de Producto o Servicio'] = 'OP';
          }
        }

        newObject['Referencia'] = newObject['Referencia'] + " " + newObject['Numero de Identificacion'];

        newArray.push(newObject);

      }
      break;
    case banks.BANCOLOMBIA:
      for (let i = 0; i < arrayLength; i++) {

        let newObject = data[i];

        if (newObject['Tipo Documento Beneficiario'] === 'Cédula') {
          newObject['Tipo Documento Beneficiario'] = '1';
        } else if (newObject['Tipo Documento Beneficiario'] === 'Cédula de Extranjería') {
          newObject['Tipo Documento Beneficiario'] = '2';
        } else if (newObject['Tipo Documento Beneficiario'] === 'Pasaporte') {
          newObject['Tipo Documento Beneficiario'] = '5';
        }

        newArray.push(newObject);

      }
      break;
    default:
  }



  return newArray;

};

function processReportByRRHHData(data) {

  let newArray = [];

  for (let i = 0; i < data.length; i++) {

    let newObject = data[i];

    newObject['NOMBRE'] = newObject['NOMBRE'] + " " + newObject['ESTADO (RESPUESTA DE LA EMPRESA)'];

    newObject['ESTADO (RESPUESTA DE LA EMPRESA)'] = "";

    newArray.push(newObject);

  };

  return newArray;

};

function processReportByRRHHData(data) {

  let newArray = [];

  for (let i = 0; i < data.length; i++) {

    let newObject = data[i];

    newObject['NOMBRE'] = newObject['NOMBRE'] + " " + newObject['ESTADO (RESPUESTA DE LA EMPRESA)'];

    newObject['ESTADO (RESPUESTA DE LA EMPRESA)'] = "";

    newArray.push(newObject);

  };

  return newArray;

};

//Extract report file
const generateBankReport = async (req, res, next) => {

  try {
    //Get the user id
    const adminId = getAdminId(req);

    // Create a workbook to write.
    let workbook = Excel.utils.book_new();

    // Define the sheet of work.
    workbook.Props = {
      Title: "Reporte del banco",
      Author: "Avanzo",
      createdAt: new Date().toLocaleString("es-CO", { timeZone: "America/Bogota" }),
    };

    workbook.SheetNames.push("Hoja 1");

    const result = await generateBankReports(req.params.bank_id);



    if (result.status === 200) {

      let date_ob = new Date();
      let bank = await dbSequelize.bank.findByPk(req.params.bank_id);

      // current date
      // adjust 0 before single digit date
      let day = ("0" + date_ob.getDate()).slice(-2);
      // current month
      let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
      // current year
      let year = date_ob.getFullYear();
      // prints date in YYYY-MM-DD format
      console.log(year + "-" + month + "-" + day);

      const processData = processQueryData(result.data, req.params.bank_id);

      var final_woorkbook = null;
      let arrayRequest = [];
      result.data.forEach(element => {
        console.log(element);
        arrayRequest.push({ requestId: element.Referencia, requestState: 4 });
      });
      switch (parseInt(req.params.bank_id, 10)) {
        case banks.BANCO_DAVIVIENDA:
          final_woorkbook = Excel.utils.json_to_sheet(result.data);
          break;
        case banks.BANCOLOMBIA:
          let pagador = {
            "NIT PAGADOR": "111111",
            "TIPO DE PAGO": 220,
            "APLICACIÓN": 1,
            "SECUENCIA DE ENVIÓ": "A1",
            "NRO CUENTA A DEBITAR": 11222222,
            "TIPO DE CUENTA A DEBITAR": "AA",
            "DESCRIPCION DEL PAGO": "dexscrjakas",

          }
          final_woorkbook = Excel.utils.json_to_sheet([pagador], { header: ["NIT PAGADOR", "TIPO DE PAGO", "APLICACIÓN", "SECUENCIA DE ENVIÓ", "NRO CUENTA A DEBITAR", "TIPO DE CUENTA A DEBITAR", "DESCRIPCION DEL PAGO"] });

          Excel.utils.sheet_add_json(final_woorkbook, result.data, {
            origin: "A4", header: ["Tipo Documento Beneficiario",
              "Nit Beneficiario",
              "Nombre Beneficiario",
              "Tipo Transaccion",
              "Código Banco",
              "No Cuenta Beneficiario",
              "Email",
              "Documento Autorizado",
              "Referencia",
              "OficinaEntrega",
              "ValorTransaccion",
              "Fecha de aplicación"]
          });

          break;
        case banks.EFECTY:
          var txt = "\"01\"|DOCUMENTO|TIPODOCUMENTO|VALOR|FECHA|NOMBRES|APELLIDO1|APELLIDO2|TELEFONO|COMENTARIOS|CODIGOPS|PIN\n";
          var sec = 1;
          result.data.forEach(function (element) {
            //console.log(element);
            txt += `"${sec < 9 ? "0" + (sec += 1) : sec += 1}"|"${element.DOCUMENTO}"|"${element.TIPODOCUMENTO}"|"${element.VALOR}"|"${element.FECHA}"|"${element.NOMBRES}"|"${element.APELLIDO1}"|"${element.APELLIDO2}"|"${element.TELEFONO}"|"${element.COMENTARIOS}"|"${element.CODIGOPS}"|"${element.PIN}"\n`;
          });
          fs.writeFile("files/writes/Desembolsos_" + day + "-" + month + "-" + year + ".txt", txt, function (erro) {
            if (erro) {
              throw erro;
            }
          });
          break;
        case 'Papayas':
          console.log('Mangoes and papayas are $2.79 a pound.');
          // expected output: "Mangoes and papayas are $2.79 a pound."
          break;
        default:
          console.log(`No existe este banco en nuestras constantes id banco: ${bank_id}.`);
          return { status: 400, message: `No existe este banco en nuestras constantes id banco: ${bank_id}.` };

      }

      var url = "";
      if (parseInt(req.params.bank_id, 10) !== banks.EFECTY) {
        workbook.Sheets["Hoja 1"] = final_woorkbook;
        let workbookAbout = Excel.writeFile(workbook, "files/writes/Desembolsos_" + bank.bankName + "_" + day + "-" + month + "-" + year + ".xlsx", { bookType: 'xlsx', type: 'binary' });
        url = "/Desembolsos_" + bank.bankName + "_" + day + "-" + month + "-" + year + ".xlsx";
      } else {
        url = "/Desembolsos_" + bank.bankName + "_" + day + "-" + month + "-" + year + ".txt";
      }

      const objGeneratedBankFiles = {
        bank_id: bank.idBank,
        geba_path: url,
        geba_json_requests: { requests: arrayRequest },

      };
      const generatedbankfiles = await dbSequelize.generatedbankfiles.create(objGeneratedBankFiles);

      console.log(generatedbankfiles);
      ////console.log("Length", result.data.length);
      if (result) {
        res.status(200).json({ data: url });
      } else {
        res.status(500).json({ message: "El archivo no puede ser generado en este momento." });
      }
    } else if (result.status === 400) {
      res.status(400).json({ message: result.message });
    }


  } catch (e) {
    console.log("Error", e);
    res.status(500).json({ message: "El archivo no puede ser generado en este momento." });
  };

};

//Generate pending report file
const generatePendingRequestReport = async (req, res, next) => {

  try {

    //Get the user id
    const adminId = getAdminId(req);

    // Create a workbook to write.
    let workbook = Excel.utils.book_new();

    // Define the sheet of work.
    workbook.Props = {
      Title: "Pendientes finalizar por banco",
      Author: "Cristian Orjuela",
      createdAt: new Date().toLocaleString("es-CO", { timeZone: "America/Bogota" }),
    };

    workbook.SheetNames.push("Hoja 1");

    const result = await generatePendingBankRequest();

    const processData = processQueryData(result.data);

    let final_woorkbook = Excel.utils.json_to_sheet(processData);

    workbook.Sheets["Hoja 1"] = final_woorkbook;

    //let date = new Date().toLocaleString("es-CO", {timeZone: "America/Bogota"});
    let date = new Date();

    //let day = date.split(" ")[0].split("-")[2];
    //let month = date.split(" ")[0].split("-")[1];
    //let year = date.split(" ")[0].split("-")[0];
    let day = date.getDate();
    let month = date.getMonth();
    let year = date.getFullYear();

    let workbookAbout = Excel.writeFile(workbook, "files/writes/PendientesTerminarDesembolsoPorBanco_" + day + "-" + month + "-" + year + ".xlsx", { bookType: 'xlsx', type: 'binary' });

    let url = "/PendientesTerminarDesembolsoPorBanco_" + day + "-" + month + "-" + year + ".xlsx";

    if (result) {
      res.status(200).json({ data: url });
    } else {
      res.status(500).json({ message: "El archivo no puede ser generado en este momento." });
    }
  } catch (e) {
    //console.log("Error", e);
    res.status(500).json({ message: "El archivo no puede ser generado en este momento." });
  };

};

//Generate pending by RRHH
const generatePendingByRRHH = async (req, res, next) => {

  try {

    //Get the user id
    const adminId = getAdminId(req);

    let companyIdToNotInclude = req.headers.companyidtonotinclude;

    // Create a workbook to write.
    let workbook = Excel.utils.book_new();

    // Define the sheet of work.
    workbook.Props = {
      Title: "Pendientes aprobar por recursos humanos",
      Author: "Cristian Orjuela",
      createdAt: new Date().toLocaleString("es-CO", { timeZone: "America/Bogota" }),
    };

    workbook.SheetNames.push("Hoja 1");

    const result = await generatePendingByHumanResources(companyIdToNotInclude);

    ////console.log("Result", result.data);

    const processData = processReportByRRHHData(result.data);

    let final_woorkbook = Excel.utils.json_to_sheet(processData);

    workbook.Sheets["Hoja 1"] = final_woorkbook;

    //let date = new Date().toLocaleString("es-CO", {timeZone: "America/Bogota"});
    let date = new Date();

    //let day = date.split(" ")[0].split("-")[2];
    //let month = date.split(" ")[0].split("-")[1];
    //let year = date.split(" ")[0].split("-")[0];
    let day = date.getDate();
    let month = date.getMonth();
    let year = date.getFullYear();

    //console.log("Days", day, month, year);

    let workbookAbout = Excel.writeFile(workbook, "files/writes/PendientesPorRRHH_" + day + "-" + month + "-" + year + ".xlsx", { bookType: 'xlsx', type: 'binary' });

    let url = "/PendientesPorRRHH_" + day + "-" + month + "-" + year + ".xlsx";

    if (result) {
      res.status(200).json({ data: url });
    } else {
      res.status(500).json({ message: "El archivo no puede ser generado en este momento." });
    }
  } catch (e) {
    //console.log("Error", e);
    res.status(500).json({ message: "El archivo no puede ser generado en este momento." });
  };

};

//Generate particular request pending by RRHH
const generateParticularPendingRequestByRRHH = async (req, res, next) => {

  try {

    //Get the user id
    const adminId = getAdminId(req);

    let companyIdToInclude = req.headers.companyidtoinclude;

    // Create a workbook to write.
    let workbook = Excel.utils.book_new();

    // Define the sheet of work.
    workbook.Props = {
      Title: "Pendientes aprobar por recursos humanos en IGS",
      Author: "Cristian Orjuela",
      createdAt: new Date().toLocaleString("es-CO", { timeZone: "America/Bogota" }),
    };

    workbook.SheetNames.push("Hoja 1");

    const result = await generateParticularPendingByRRHH(companyIdToInclude);

    const processData = processReportByRRHHData(result.data);

    let final_woorkbook = Excel.utils.json_to_sheet(processData);

    workbook.Sheets["Hoja 1"] = final_woorkbook;

    //let date = new Date().toLocaleString("es-CO", {timeZone: "America/Bogota"});
    let date = new Date();

    //let day = date.split(" ")[0].split("-")[2];
    //let month = date.split(" ")[0].split("-")[1];
    //let year = date.split(" ")[0].split("-")[0];
    let day = date.getDate();
    let month = date.getMonth();
    let year = date.getFullYear();

    let workbookAbout = Excel.writeFile(workbook, "files/writes/PendientesPorRRHEnIGS_" + day + "-" + month + "-" + year + ".xlsx", { bookType: 'xlsx', type: 'binary' });

    let url = "/PendientesPorRRHEnIGS_" + day + "-" + month + "-" + year + ".xlsx";

    if (result) {
      res.status(200).json({ data: url });
    } else {
      res.status(500).json({ message: "El archivo no puede ser generado en este momento." });
    }
  } catch (e) {
    //console.log("Error", e);
    res.status(500).json({ message: "El archivo no puede ser generado en este momento." });
  };

};

//Check both formats
const receiveBankReport = async (req, res, next) => {

  try {

    ////console.log("Read", req);
    ////console.log("Write", req.write);
    ////console.log("Read", req.files[0].path);
    //Get the user id
    try {
      const adminId = getAdminId(req);
      const generatebankfile = await dbSequelize.generatedbankfiles.findByPk(req.body.geba_id);
      // const generatebankfile = await dbSequelize.sequelize.query("SELECT * FROM GeneratedBankFiles WHERE geba_id =8");
      let arrayRequests = [];
      if (generatebankfile !== null) {


        generatebankfile.geba_json_requests.requests.forEach(function (element) {
          console.log(element);
          arrayRequests.push(element.requestId)
        });


        // Create a workbook, like a file.
        var readWorkbook = Excel.readFile(req.files.read[0].path, { cellDates: true });

        // Define the sheet of work.
        var readSheet = readWorkbook.Sheets[readWorkbook.SheetNames[0]];



        // Map the xlsx format to json.
        // range:14  indicates the place of the header
        var readData = Excel.utils.sheet_to_json(readSheet, { range: 14 });


        for (let i in readData) {
          // readData[i].process = readData[i].process === true ? readData[i].process :  false;

          const requ = await dbSequelize.request.findOne({
            attributes: ['idRequest', 'RequestState_idRequestState', 'Account_idAccount'],
            where: {
              quantity: parseInt(readData[i].Valor.replace("$", "").replace(".", ""), 10),
            }, where: (sequelize.literal(`SUBSTRING(Request.accountNumber, -4) = ${readData[i]["Numero Destino"].slice(-4)}`)),
            include: [{
              model: dbSequelize.account}]
          });

          

          console.log("_______________________________________________________________");
          console.log(requ.Account_idAccount);
          console.log("_______________________________________________________________");

          if (arrayRequests.includes(requ.idRequest) && readData[i]["Estado"].trim().toLowerCase() === "Pago Exitoso".toLowerCase()) {

            let changeStateNewClient = await requ.update({ RequestState_idRequestState: REQUEST_STATE.FINISHED });
            console.log("Se actualiza el estado del request : " + requ.idRequest);
            console.log("Nuevo estado : " + REQUEST_STATE.FINISHED);

          }



          res.status(200).json({ message: "Créditos actualizados con exito" });


          // const result = await readBankReport(readData);


          // generatebankfile.geba_json_requests.requests.forEach(function (element) {
          //   console.log(element);

          // });
        }
      } else {
        res.status(404).json({ message: "Error No se encontro este registro de archivo" });
        throw new Error("Error cambiando estado newClient");
      }

    } catch (error) {
      console.log("E - ", error);
      res.status(404).json({ message: "Error No se encontro este registro de archivo" });
      throw new Error("Error interno");

    }





  } catch (e) {
    //console.log("Error", e);
    res.status(500).json({ message: "Error interno del servidor" });
  };

};


const downloadFile = async (req, res, next) => {

  try {

    //utils.downloadFile(req.params.fileName);
    res.download('files/writes/' + req.params.fileName);
    res.status(200)
  } catch (e) {
    //console.log("Error", e);
    res.status(500).json({ message: "El archivo no puede ser generado en este momento." });
  };

};

module.exports = {
  generateBankReport, receiveBankReport, generatePendingRequestReport, generatePendingByRRHH,
  generateParticularPendingRequestByRRHH, downloadFile
};