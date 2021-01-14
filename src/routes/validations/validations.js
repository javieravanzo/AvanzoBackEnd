//Requires
const express = require('express');
const { body, header } = require('express-validator');
const multer = require('multer');
//const BaseURL = require('../../config/')
//Imports
const  validations_controller  = require('../../controllers/validations.js');

//Initialize
const router = express.Router();


//Routes 
router.get('/validations/validate_document_number/:documentNumber',  validations_controller.validateDocumentNumber);
router.get('/validations/validate_phone_number/:phoneNumber',  validations_controller.validatePhoneNumber);
router.get('/validations/validate_email/:email',  validations_controller.validateEmail);

//Export
module.exports = router;