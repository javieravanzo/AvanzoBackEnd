//Requires
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const Excel = require('xlsx');

//Imports
const { getInitialsData, getRequestsData, getAllCustomers, createCustomer, createMultipleCustomers,
        getAllCustomerWithCompanies, getTransactionsByUsersId, getCustomersByAdmin } = require('../services/customer');

//Get the company with token
function getCompanyId(req){

    //Get the clientId
    const bearerHeader = req.headers['authorization'];
    //Get the real token
    const bearer = bearerHeader.split(" ")[1];
    //Set the token
    const decoded = jwt.decode(bearer);
    return (decoded.userRow[0].Company_idCompany);  
  
}; 

//Get the user with token
function getUserId(req){

    //Get the clientId
    const bearerHeader = req.headers['authorization'];
    //Get the real token
    const bearer = bearerHeader.split(" ")[1];
    //Set the token
    const decoded = jwt.decode(bearer);
    return (decoded.userRow[0].idUser);  

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

//Controllers
const getInitialData = async (req, res, next) => {

    const customerid = getUserId(req);

    try {
        const result = await getInitialsData(customerid);
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

const getRequestData = async (req, res, next) => {

    const customerid = getUserId(req);

    try {
        const result = await getRequestsData(customerid);
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

const getAllCustomer = async (req, res, next) => {

    //Validate input
    const errors = validationResult(req); 

    if (!errors.isEmpty()) {
        res.status(422).json({ message: errors.errors[0].msg });
        return;
    }

    const companyId = getCompanyId(req);

    try {
        const result = await getAllCustomers(companyId);
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

const getCustomers = async (req, res, next) => {

    //Validate input
    const errors = validationResult(req); 

    if (!errors.isEmpty()) {
        res.status(422).json({ message: errors.errors[0].msg });
        return;
    }

    try {
        const result = await getCustomersByAdmin( );
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


const createNewCustomer = async (req, res, next) => {
  
  //Variables
  const {name, email, companyid} = req.body;

  //Validate input
  const errors = validationResult(req); 

  if (!errors.isEmpty()) {
    //res.status(422).json({ message: errors.errors[0].msg });
    res.status(422).json({ message: errors.array() });
    return;
  }

  //Logic
  const user = {name, email};
  const adminId = getUserId(req);
 
  try {
    const result = await createCustomer(req.body, user, companyid, adminId);
    res.status(result.status).json({message: result.message});      
  }catch(e) {
    res.status(500).json({message:"No es posible realizar el registro en este momento."}); 
  };

};

const createMultipleCustomer = async (req, res, next) => {
    
    //Get the user id
    const adminId = getUserId(req);

    // Create a workbook, like a file.
    var workbook = Excel.readFile(req.file.path, {cellDates: true});

    // Define the sheet of work.
    var company = workbook.Sheets[workbook.SheetNames[0]];

    // Map the xlsx format to json.
    var data = Excel.utils.sheet_to_json(company);
    //console.log("Data", data);

    try {
        const result = await createMultipleCustomers(data, adminId);
        res.status(result.status).json({message: result.message});      
    }catch(e) {
        res.status(500).json({message:"No es posible realizar el registro en este momento."}); 
    };

};

const getAllCustomerWithCompany = async (req, res, next) => {
    
    //Get the user id
    const adminId = getAdminId(req);

    try {
        const result = await getAllCustomerWithCompanies(adminId);
        if(result){
            res.status(result.status).json(result.data);
        }else{
            res.status(500).json({message:"No es posible realizar la consulta de usuarios en este momento."}); 
        }
              
    }catch(e) {
        res.status(500).json({message:"No es posible realizar la consulta de usuarios en este momento."}); 
    };

};

const getTransactionsByUserId = async (req, res, next) => {
    
    //Get the user id
    const userId = getUserId(req);

    try {
        const result = await getTransactionsByUsersId(userId);
        if(result){
            res.status(result.status).json(result.data);
        }else{
            res.status(500).json({message:"No es posible realizar la consulta de transacciones en este momento."}); 
        }
              
    }catch(e) {
        res.status(500).json({message:"No es posible realizar la consulta de transacciones en este momento."}); 
    };

};

module.exports = {
  getInitialData, getRequestData, getAllCustomer, createNewCustomer, createMultipleCustomer,
  getAllCustomerWithCompany, getTransactionsByUserId, getCustomers
};