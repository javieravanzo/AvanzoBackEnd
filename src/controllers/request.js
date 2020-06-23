
//Requires
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
var buffer = require('buffer');
var path = require('path');
var fs = require('fs');

//Imports
const { getOutLaysData, getOultayDatesLists, createRequest, getAllRequests, getAllRequestsToApprove,
        getAllRequestsByCompany, approveOrRejectRequest, getRequestStatesList, getRequestsToOutLay,
        generateContracts, getAllRequestsWasOutlayed, getAllRequestWasRejected, getAllRejectedRequest,
        getAllPendingRHRequest, generateRequestCodes
      } = require('../services/request');

//Get the client with token
function getClientId(req){

    //Get the clientId
    const bearerHeader = req.headers['authorization'];
    //Get the real token
    const bearer = bearerHeader.split(" ")[1];
    //Set the token
    const decoded = jwt.decode(bearer);
    //console.log("DEC", decoded);
    return (decoded.userRow[0].Client_idClient);  

};

//Get the user with token
function getUserId(req){

  //Get the clientId
  const bearerHeader = req.headers['authorization'];
  //Get the real token
  const bearer = bearerHeader.split(" ")[1];
  //Set the token
  const decoded = jwt.decode(bearer);
  //console.log("Decoded", decoded);

  return {idUser: decoded.userRow[0].idUser, role: decoded.userRow[0].Role_idRole, email: decoded.userRow[0].email};  

};

function getCompanyId(req){

  //Get the clientId
  const bearerHeader = req.headers['authorization'];
  //Get the real token
  const bearer = bearerHeader.split(" ")[1];
  //Set the token
  const decoded = jwt.decode(bearer);
  return (decoded.userRow[0].Company_idCompany);  

};

//Controllers
const getOutLayData = async (req, res, next) => {

  try {
      const result = await getOutLaysData();
      if(result.status === 200){
          res.status(result.status).json(result.data);
      }else{
          res.status(result.status).json(result.message);
      }
      next();
  } catch(e) {
      res.status(500).json("No es posible obtener la información en este momento.");
  };
};

const getOultayDatesList = async (req, res, next) => {

  //Validate input
  const errors = validationResult(req); 

  if (!errors.isEmpty()) {
      res.status(422).json({ message: errors.errors[0].msg });
      return;
  }

  const {split, quantity} = req.headers;
  const customerid = getUserId(req);

  try {
    const result = await getOultayDatesLists(customerid.idUser, split, quantity);
    if(result.status === 200){
        res.status(result.status).json(result.data);
    }else{
        res.status(result.status).json(result.message);
    }
    next();
  } catch(e) {
    res.status(500).json("No es posible obtener la información en este momento.");
  };

};

const decode_base64 = async (base64str , filename) => {

  var image = new Image();
  image.src = base64str;
 
  var base64DataReplaced = await base64str.replace('/^data:image\/png;base64,/', "");
  var buf = Buffer.from(base64DataReplaced,'base64');

  //Production
  fs.writeFile(path.join('../files/','/images/',filename), buf, function(error){
  
  //Development
  //fs.writeFile(path.join('./files/','/images/', 'imagen3.png'), image, function(error){
    if(error){
      return {status: 500, message: "Error con el archivo de firma."}
    }else{
      return true;
    }
  });

};

function dataURLtoFile(dataurl, filename) {
 
  var arr = dataurl.split(','),
      mime = arr[0].match(/:(.*?);/)[1],
      bstr = atob(arr[1]), 
      n = bstr.length, 
      u8arr = new Uint8Array(n);
      
  while(n--){
      u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new File([u8arr], filename, {type:mime});
};

const createNewRequest = async (req, res, next) => {

  const clientId = getClientId(req);
  //console.log("CI", req.body.file);
  //fs.writeFile("/files/images/arghhhh.jpg", new Buffer.from(req.body.file, "base64"), function(err) {});
  //console.log("RF", req.files);
  let files = null;
  //Guardar archivos
  if(req.files.paymentSupport !== undefined){
    files = {paymentSupport: path.normalize(req.files.paymentSupport[0].path).replace("../files/documents/",""), 
                 workingSupport: path.normalize(req.files.workingSupport[0].path).replace("../files/documents/","")};
  }else{
    files = null;
  }
  
  try {
    //Decode
    //decode_base64(req.body.file);

    //Usage example:
    //var file = dataURLtoFile(req.body.file, 'hello.png');
    //console.log("FileT", file);

    //Request
    const result = await createRequest(req.body, req.file, clientId, files);
    if(result.status === 200){
        res.status(result.status).json(result.message);
    }else{
        res.status(result.status).json(result.message);
    }
    next();
  } catch(e) {
    res.status(500).json({message: "No es posible obtener la información en este momento."});
  };

};

const getAllRequest = async (req, res, next) => {

  const clientId = getClientId(req);
  //console.log("CI", clientId);

  try {
    const result = await getAllRequests(clientId);
    if(result.status === 200){
        res.status(result.status).json(result.data);
    }else{
        res.status(result.status).json(result.message);
    }
    next();
  } catch(e) {
    res.status(500).json("No es posible obtener la información en este momento.");
  };
};

const getAllRequestWasOutlayedC = async (req, res, next) => {

  const clientId = getClientId(req);
  //console.log("CI", clientId);

  try {
    const result = await getAllRequestsWasOutlayed(clientId);
    if(result.status === 200){
        res.status(result.status).json(result.data);
    }else{
        res.status(result.status).json(result.message);
    }
    next();
  } catch(e) {
    console.log(e);
    res.status(500).json("No es posible obtener la información en este momento.");
  };
};

const getAllRequestWasRejectedC = async (req, res, next) => {

  const clientId = getClientId(req);
  //console.log("CI", clientId);

  try {
    const result = await getAllRequestWasRejected(clientId);
    if(result.status === 200){
        res.status(result.status).json(result.data);
    }else{
        res.status(result.status).json(result.message);
    }
    next();
  } catch(e) {
    console.log(e);
    res.status(500).json("No es posible obtener la información en este momento.");
  };
};

const getAllRequestByCompany = async (req, res, next) => {

  const companyId = getCompanyId(req);

  try {
    if(companyId !== null){
      const result = await getAllRequestsByCompany(companyId);
      if(result.status === 200){
          res.status(result.status).json(result.data);
      }else{
          res.status(result.status).json(result.message);
      }
    }else{
      res.status(403).json({message: "El usuario no tiene los permisos para realizar esta acción"});
    }
    
    next();
  } catch(e) {
    res.status(500).json("No es posible obtener la información en este momento.");
  };

};

const approveOrReject = async (req, res, next) => {

  const userId = getUserId(req);
  const {requestid, approve, transactioncode, text} = req.headers;

  try {
    const result = await approveOrRejectRequest(requestid, approve, userId, transactioncode, text);
    if(result.status === 200){
        res.status(result.status).json(result.message);
    }else{
        res.status(result.status).json(result.message);
    }
    next();
  } catch(e) {
    res.status(500).json("No es posible obtener la información en este momento.");
  };

};

const getRequestStateList = async (req, res, next) => {

  try {
    const result = await getRequestStatesList();
    if(result.status === 200){
        res.status(result.status).json(result.data);
    }else{
        res.status(result.status).json(result.message);
    }
    next();
  }catch(e) {
    res.status(500).json("No es posible obtener la información en este momento.");
  };  

};

const getRequestsToApprove = async (req, res, next) => {

  const userId = getUserId(req);

  try {
    const result = await getAllRequestsToApprove(userId);
    if(result.status === 200){
      res.status(result.status).json(result.data);
    }else{
      res.status(result.status).json(result.message);
    }
    next();
  }catch(e) {
    res.status(500).json("No es posible obtener la información en este momento.");
  };  

};

const getRequestToOutLay = async (req, res, next) => {

  const userId = getUserId(req);

  try {
    const result = await getRequestsToOutLay(userId);
    if(result.status === 200){
      res.status(result.status).json(result.data);
    }else{
      res.status(result.status).json(result.message);
    }
    next();
  }catch(e) {
    res.status(500).json("No es posible obtener la información en este momento.");
  };  

};

const getRejectedRequest = async (req, res, next) => {

  try {
    const result = await getAllRejectedRequest();
    if(result.status === 200){
      res.status(result.status).json(result.data);
    }else{
      res.status(result.status).json(result.message);
    }
    next();
  }catch(e) {
    res.status(500).json("No es posible obtener la información en este momento.");
  };   

};

const getPendingRRHHRequest = async (req, res, next) => {

  try {
    const result = await getAllPendingRHRequest();
    if(result.status === 200){
      res.status(result.status).json(result.data);
    }else{
      res.status(result.status).json(result.message);
    }
    next();
  }catch(e) {
    res.status(500).json("No es posible obtener la información en este momento.");
  };   

};

const generateContract = async (req, res, next) => {

  //Validate input
  const errors = validationResult(req); 

  if (!errors.isEmpty()) {
      res.status(422).json({ message: errors.errors[0].msg });
      return;
  }

  const {split, quantity, company} = req.headers;
  const customerid = getClientId(req);

  try {
    const result = await generateContracts(customerid, split, quantity, company);
    //console.log("R", result);
    if(result){
      res.status(200).json(result.data);
    }else{
      res.status(500).json("No es posible generar el documento en este momento.");
    }
    next();
  }catch(e) {
    console.log("E", e);
    res.status(500).json("No es posible generar el documento en este momento.");
  };  

};

const generateCodes = async (req, res, next) => {

  const {clientid, phonenumber, email} = req.headers;

  console.log(clientid, phonenumber, email);

  try {
    const result = await generateRequestCodes(clientid, phonenumber, email);
    if(result.status === 200){
      res.status(result.status).json(result.message);
    }else{
      res.status(result.status).json(result.message);
    }
    next();
  }catch(e) {
    res.status(500).json("No es posible obtener la información en este momento.");
  };

};

module.exports = {
  getOutLayData, getOultayDatesList, createNewRequest, getAllRequest, getAllRequestByCompany,
  approveOrReject, getRequestStateList, getRequestsToApprove, getRequestToOutLay, generateContract,
  getAllRequestWasRejectedC, getAllRequestWasOutlayedC, getRejectedRequest, getPendingRRHHRequest,
  generateCodes
};
