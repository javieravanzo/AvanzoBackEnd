//Requires
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const Excel = require('xlsx');

//Imports
const  validations_services  = require('../services/validations');




 const validateDocumentNumber = async (req, res, next) => {

    try {
        const result = await validations_services.validateDocumentNumber(req.params.documentNumber);
        if(result.status === 200){
            res.status(result.status).json(result.data);
        }else{
            res.status(result.status).json(result.message);
        }
        next();
    } catch(e) {
        console.log(e);
        res.status(500).json("No es posible realizar traer la información de la cuenta en este momento.");
    };

};

  const validatePhoneNumber = async (req, res, next) => {

    try {
        const result = await validations_services.validatePhoneNumber(req.params.phoneNumber);
        if(result.status === 200){
            res.status(result.status).json(result.data);
        }else{
            res.status(result.status).json(result.message);
        }
        next();
    } catch(e) {
        console.log(e);
        res.status(500).json("No es posible realizar traer la información de la cuenta en este momento.");
    };

  };
  const validateEmail = async (req, res, next) => {

    try {
        const result = await validations_services.validateEmail(req.params.email);
        if(result.status === 200){
            res.status(result.status).json(result.data);
        }else{
            res.status(result.status).json(result.message);
        }
        next();
    } catch(e) {
        console.log(e);
        res.status(500).json("No es posible realizar traer la información de la cuenta en este momento.");
    };

  };
module.exports = {
  validateDocumentNumber,validatePhoneNumber,validateEmail
};