//Requires
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');

//Imports
const { createCompanies, getCompanies, getAllCompaniesForUser, updateCompanies,
        getCompanyWithSalaries, activateCompanies, updateCompanySalary } = require('../services/company');

//Functions
//Get the user with token
function getUserId(req){

  //Get the clientId
  const bearerHeader = req.headers['authorization'];
  //Get the real token
  const bearer = bearerHeader.split(" ")[1];
  //Set the token
  const decoded = jwt.decode(bearer);
  return (parseInt(decoded.userRow[0].Administrator_idAdministrator, 10));  

}; 

//Get the admin with token
function getAdminId(req){

  //Get the clientId
  const bearerHeader = req.headers['authorization'];
  //Get the real token
  const bearer = bearerHeader.split(" ")[1];
  //Set the token
  const decoded = jwt.decode(bearer);
  return (decoded.userRow[0].Administrator_idAdministrator);  

};

const createCompany = async (req, res, next) => {

  //Validate input
  const errors = validationResult(req); 

  if (!errors.isEmpty()) {
      res.status(422).json({ message: errors.errors[0].msg });
      return;
  }

  const userId = getUserId(req);

  try {
    const result = await createCompanies(req, userId);
    if(result.status === 200){
        res.status(result.status).json(result.message);
    }else{
        res.status(result.status).json(result.message);
    }
    next();
  } catch(e) {
    //console.log("Error", e.stack);
    res.status(500).json({message: "Por favor, valida los datos ingresados e intenta nuevamente."});
  }

};

const updateCompany = async (req, res, next) => {

  //Validate input
  const errors = validationResult(req); 

  if (!errors.isEmpty()) {
      res.status(422).json({ message: errors.errors[0].msg });
      return;
  }

  const userId = getUserId(req);

  try {
    const result = await updateCompanies(req, userId);
    if(result.status === 200){
        res.status(result.status).json(result.message);
    }else{
        res.status(result.status).json(result.message);
    }
    next();
  } catch(e) {
    res.status(500).json("No es posible obtener la información en este momento.");
  }

};

const getAllCompanies = async (req, res, next) => {

  //Validate input
  const errors = validationResult(req); 

  if (!errors.isEmpty()) {
      res.status(422).json({ message: errors.errors[0].msg });
      return;
  }

  const userId = getUserId(req);

  try {
    const result = await getCompanies(req, userId);
    if(result.status === 200){
        res.status(result.status).json(result.data);
    }else{
        res.status(result.status).json(result.message);
    }
    next();
  } catch(e) {
    res.status(500).json("No es posible obtener la información en este momento.");
  }
};

const getCompaniesForUser = async (req, res, next) => {

  try {
    const result = await getAllCompaniesForUser( );
    if(result.status === 200){
        res.status(result.status).json(result.data);
    }else{
        res.status(result.status).json({message: result.message});
    }
    next();
  } catch(e) {
    res.status(500).json("No es posible obtener la información en este momento.");
  }

};

const getCompanyWithSalary = async (req, res, next) => {
  
  const {companyid} = req.headers;

  try {
    const result = await getCompanyWithSalaries(companyid);
    if(result.status === 200){
        res.status(result.status).json(result.data);
    }else{
        res.status(result.status).json({message: result.message});
    }
    next();
  } catch(e) {
    res.status(500).json("No es posible obtener la información en este momento.");
  }

};

const updateSalaries = async (req, res, next) => {
  
  try {
    const result = await updateCompanySalary(req.body);
    if(result.status === 200){
        res.status(result.status).json({message: result.message});
    }else{
        res.status(result.status).json({message: result.message});
    }
    next();
  } catch(e) {
    res.status(500).json("No es posible actualizar el ciclo de pago.");
  }

};

const activateCompany = async (req, res, next) => {
    
  try {

      //Get the user id
      const adminId = getAdminId(req);
      const {companyid, status} = req.headers;

      //console.log("CI", clientid, "S", status);
      const result = await activateCompanies(companyid, status);
      if(result.status === 200){
          res.status(result.status).json(result.message);
      }else{
          res.status(result.status).json(result.message);
      }
      next();
  } catch(e) {
      console.log(e);
      res.status(500).json("No es posible realizar el cambio de estado en este momento.");
  };

};


module.exports = {
  createCompany, getAllCompanies, getCompaniesForUser, updateCompany, getCompanyWithSalary,
  activateCompany, updateSalaries
};

