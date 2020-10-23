
//Requires
const jwt = require('jsonwebtoken');
const Excel = require('xlsx');

//Imports
const { generateBankReports, readBankReport, generatePendingBankRequest,
        generatePendingByHumanResources, generateParticularPendingByRRHH } = require('../services/reports');

//Functions
function getAdminId(req){
  //Get the admin with token

  //Get the clientId
  const bearerHeader = req.headers['authorization'];
  //Get the real token
  const bearer = bearerHeader.split(" ")[1];
  //Set the token
  const decoded = jwt.decode(bearer);
  return (decoded.userRow[0].Administrator_idAdministrator);  

};

function processQueryData(data){ 
 
  let newArray = [];

  let arrayLength = parseInt(data.length);

  for (let i = 0; i<arrayLength; i++){

    let newObject = data[i];

    if( newObject['Tipo de Identificacion'] === 'Cédula' ){
      newObject['Tipo de Identificacion'] = '1';
    }else if( newObject['Tipo de Identificacion'] === 'Cédula de Extranjería' ){
      newObject['Tipo de Identificacion'] = '2';
    }else if( newObject['Tipo de Identificacion'] === 'Pasaporte' ){
      newObject['Tipo de Identificacion'] = '5';
    }

    if( newObject['Tipo de Producto o Servicio'] === 'Cuenta corriente' ){
      newObject['Tipo de Producto o Servicio'] = 'CC';
    }else if( newObject['Tipo de Producto o Servicio'] === 'Cuenta de ahorros' ){
      newObject['Tipo de Producto o Servicio'] = 'CA';
    }else if( newObject['Tipo de Producto o Servicio'] === 'Tarjeta Prepago Maestro' ){
      newObject['Tipo de Producto o Servicio'] = 'TP';
    }else if( newObject['Tipo de Producto o Servicio'] === 'Depósitos Electrónicos' ){
      newObject['Tipo de Producto o Servicio'] = 'DE';
    }else if( newObject['Tipo de Producto o Servicio'] === 'null' ){
      if( newObject['Codigo del Banco'] === '51' ){
        newObject['Tipo de Producto o Servicio'] = 'DP';
      }else{
        newObject['Tipo de Producto o Servicio'] = 'OP';
      }
    }

    newObject['Referencia'] = newObject['Referencia'] + " " + newObject['Numero de Identificacion'];

    newArray.push(newObject);
    
  }

  return newArray;

};

function processReportByRRHHData(data){

  let newArray = [];

  for (let i = 0; i<data.length; i++){

    let newObject = data[i];

    newObject['NOMBRE'] = newObject['NOMBRE'] + " " + newObject['ESTADO (RESPUESTA DE LA EMPRESA)'];

    newObject['ESTADO (RESPUESTA DE LA EMPRESA)'] = "";

    newArray.push(newObject);
    
  };

  return newArray;

};

function processReportByRRHHData(data){

  let newArray = [];

  for (let i = 0; i<data.length; i++){

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
      Author: "Cristian Orjuela",
      CreatedDate: new Date(),
    };

    workbook.SheetNames.push("Hoja 1");

    const result = await generateBankReports();

    const processData = processQueryData(result.data);

    let final_woorkbook = Excel.utils.json_to_sheet(processData);

    workbook.Sheets["Hoja 1"] = final_woorkbook;

    let date = new Date();

    console.log("Date", date);
    
    let day = date.getDate();
    let month = date.getMonth() + 1;
    let year = date.getFullYear();

    console.log("Days", day, month, year);

    let workbookAbout = Excel.writeFile(workbook, "../files/writes/Desembolsos_"+day+"-"+month+"-"+year+".xlsx", {bookType: 'xlsx', type: 'binary'});

    let url = "/Desembolsos_"+day+"-"+month+"-"+year+".xlsx";
    //console.log("Length", result.data.length);

    if(result){
      res.status(200).json({data: url});  
    }else{
      res.status(500).json({message: "El archivo no puede ser generado en este momento."}); 
    }   
  }catch(e) {
    console.log("Error", e);
      res.status(500).json({message: "El archivo no puede ser generado en este momento."}); 
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
      CreatedDate: new Date(),
    };

    workbook.SheetNames.push("Hoja 1");

    const result = await generatePendingBankRequest();

    const processData = processQueryData(result.data);

    let final_woorkbook = Excel.utils.json_to_sheet(processData);

    workbook.Sheets["Hoja 1"] = final_woorkbook;

    let date = new Date();
    
    let day = date.getDate();
    let month = date.getMonth() + 1;
    let year = date.getFullYear();

    let workbookAbout = Excel.writeFile(workbook, "../files/writes/PendientesTerminarDesembolsoPorBanco_"+day+"-"+month+"-"+year+".xlsx", {bookType: 'xlsx', type: 'binary'});

    let url = "/PendientesTerminarDesembolsoPorBanco_"+day+"-"+month+"-"+year+".xlsx";

    if(result){
      res.status(200).json({data: url});  
    }else{
      res.status(500).json({message: "El archivo no puede ser generado en este momento."}); 
    }   
  }catch(e) {
    console.log("Error", e);
    res.status(500).json({message: "El archivo no puede ser generado en este momento."}); 
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
      CreatedDate: new Date(),
    };

    workbook.SheetNames.push("Hoja 1");

    const result = await generatePendingByHumanResources(companyIdToNotInclude);

    //console.log("Result", result.data);

    const processData = processReportByRRHHData(result.data);

    let final_woorkbook = Excel.utils.json_to_sheet(processData);

    workbook.Sheets["Hoja 1"] = final_woorkbook;

    let date = new Date();

    console.log("Date", date);
    
    let day = date.getDate();
    let month = date.getMonth() + 1;
    let year = date.getFullYear();

    console.log("Days", day, month, year);

    let workbookAbout = Excel.writeFile(workbook, "../files/writes/PendientesPorRRHH_"+day+"-"+month+"-"+year+".xlsx", {bookType: 'xlsx', type: 'binary'});

    let url = "/PendientesPorRRHH_"+day+"-"+month+"-"+year+".xlsx";

    if(result){
      res.status(200).json({data: url});  
    }else{
      res.status(500).json({message: "El archivo no puede ser generado en este momento."}); 
    }   
  }catch(e) {
    console.log("Error", e);
    res.status(500).json({message: "El archivo no puede ser generado en este momento."}); 
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
      CreatedDate: new Date(),
    };

    workbook.SheetNames.push("Hoja 1");

    const result = await generateParticularPendingByRRHH(companyIdToInclude);

    const processData = processReportByRRHHData(result.data);

    let final_woorkbook = Excel.utils.json_to_sheet(processData);

    workbook.Sheets["Hoja 1"] = final_woorkbook;

    let date = new Date();
   
    let day = date.getDate();
    let month = date.getMonth() + 1;
    let year = date.getFullYear();

    let workbookAbout = Excel.writeFile(workbook, "../files/writes/PendientesPorRRHEnIGS_"+day+"-"+month+"-"+year+".xlsx", {bookType: 'xlsx', type: 'binary'});

    let url = "/PendientesPorRRHEnIGS_"+day+"-"+month+"-"+year+".xlsx";

    if(result){
      res.status(200).json({data: url});  
    }else{
      res.status(500).json({message: "El archivo no puede ser generado en este momento."}); 
    }   
  }catch(e) {
    console.log("Error", e);
    res.status(500).json({message: "El archivo no puede ser generado en este momento."}); 
  };

};

//Check both formats
const receiveBankReport = async (req, res, next) => {
    
  try {

    //console.log("Read", req);
    //console.log("Write", req.write);
    //console.log("Read", req.files[0].path);
  
    //Get the user id
    const adminId = getAdminId(req);

    // Create a workbook, like a file.
    var readWorkbook = Excel.readFile(req.files.read[0].path, {cellDates: true});
    var writeWorkbook = Excel.readFile(req.files.write[0].path, {cellDates: true});

    // Define the sheet of work.
    var readSheet = readWorkbook.Sheets[readWorkbook.SheetNames[0]];
    var writeSheet = writeWorkbook.Sheets[writeWorkbook.SheetNames[0]];

    // Map the xlsx format to json.
    var readData = Excel.utils.sheet_to_json(readSheet);
    var writeData = Excel.utils.sheet_to_json(writeSheet);

    try {
      const result = await readBankReport(readData, writeData);
      res.status(result.status).json({message: result.message});      
    }catch(e) {
        res.status(500).json({message:"No es posible realizar el registro en este momento."}); 
    };
 
  }catch(e) {
    console.log("Error", e);
      res.status(500).json({message: "El archivo no puede ser generado en este momento."}); 
  };

};

module.exports = {
  generateBankReport, receiveBankReport, generatePendingRequestReport, generatePendingByRRHH,
  generateParticularPendingRequestByRRHH
};