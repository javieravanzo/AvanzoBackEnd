//Requires
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const Excel = require('xlsx');

//Imports
const { validateDocumentNumber } = require('../services/validations');




const validateDocumentNumbers = async (req, res, next) => {

    try {
        const result = await validateDocumentNumber(req.params.documentNumber);
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

  // const validatePhoneNumber = async (req, res, next) => {

  //   try {
  //       const result = await validatePhoneNumber(req.params.phoneNumber);
  //       if(result.status === 200){
  //           res.status(result.status).json(result.data);
  //       }else{
  //           res.status(result.status).json(result.message);
  //       }
  //       next();
  //   } catch(e) {
  //       console.log(e);
  //       res.status(500).json("No es posible realizar traer la información de la cuenta en este momento.");
  //   };

  // };
module.exports = {
  validateDocumentNumbers
};