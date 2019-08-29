//Requires
const express = require('express');
const passport = require('passport');

//Initialize
const router = express.Router();

//Controllers
const { getInitialData, getRequestData } = require('../../controllers/customer');

//Routes 
router.get('/Customer/GetInitialData', getInitialData);
router.get('/Customer/GetRequestData', getRequestData);


//Export
module.exports = router;