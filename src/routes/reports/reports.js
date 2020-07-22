//Requires
const express = require('express');
const { header, body } = require('express-validator');

//Controllers
const { verifyToken } = require('../../controllers/validator');
const { generateBankReport } = require('../../controllers/reports');

//Initialize
const router = express.Router();

//Routes 
router.get('/Reports/GenerateBankReport', [verifyToken], generateBankReport);

//Export
module.exports = router;