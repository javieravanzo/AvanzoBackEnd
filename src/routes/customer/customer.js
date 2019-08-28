//Requires
const express = require('express');
const passport = require('passport');

//Initialize
const router = express.Router();

//Controllers
const { getInitialData } = require('../../controllers/customer');

//Routes 
router.get('/Customer/GetInitialData', getInitialData);
//router.get('/Customer/GetInitialData', getInitialData);


//Export
module.exports = router;