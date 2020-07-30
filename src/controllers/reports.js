
//Requires
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const Excel = require('xlsx');

//Imports
const { generateBankReports } = require('../services/reports');

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

  for (let i = 0; i<data.length; i++){

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
    }

    newObject['Referencia'] = newObject['Referencia'] + " " + newObject['Numero de Identificacion'];

    newArray.push(newObject);
    
  }

  //console.log("ResultArray", newArray);

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

    let final_woorkbook = Excel.utils.json_to_sheet(result.data);

    workbook.Sheets["Hoja 1"] = final_woorkbook;

    let date = new Date();
    
    let day = date.getDay();
    let month = date.getMonth();
    let year = date.getFullYear();

    let workbookAbout = Excel.writeFile(workbook, "../files/writes/Desembolsos_"+day+"-"+month+"-"+year+".xlsx", {bookType: 'xlsx', type: 'binary'});

    let url = "/Desembolsos_"+day+"-"+month+"-"+year+".xlsx";
    //console.log("Length", result.data.length);

    //console.log("Result", result);



    if(result){

      /*for (i= 0; i<result.data.length-1; i++ ){

        let newRegister = [];
        
        console.log("Result", result.data[i]);


      }*/

      //console.log("sheetHeaders", sheetHeaders);

      //sheetHeaders.push(result.data);

      //console.log("NEWsheetHeaders", sheetHeaders);

      res.status(200).json({data: url});  
    }else{
      res.status(500).json({message: "El archivo no puede ser generado en este momento."}); 
    }   
  }catch(e) {
    console.log("Error", e);
      res.status(500).json({message: "El archivo no puede ser generado en este momento."}); 
  };

};

module.exports = {
  generateBankReport
};