//Requires
const express = require('express');
const { body, header } = require('express-validator');
const multer = require('multer');
//const BaseURL = require('../../config/')
//Imports
const { validateDocumentNumbers,validatePhoneNumber } = require('../../controllers/validations');

//Initialize
const router = express.Router();


//Routes 
router.get('/validations/validateDocumentNumber/:documentNumber',  validateDocumentNumbers);
// router.get('/validations/validatePhoneNumber/:phoneNumber',  validatePhoneNumber);

//Export
module.exports = router;