//Requires
const express = require('express');
const { body } = require('express-validator');
//const BaseURL = require('../../config/')

//Controllers
const { verifyToken } = require('../../controllers/validator');
const USER = require('../../controllers/user.js');
 
//Initialize
const router = express.Router();


//Routes 


router.put('/user/updatestate', [
   body('state', 'Estado nuevo no puede ser vacio').exists().not().isEmpty(),
   body('userId', 'Id usuario no puede ser vacio').exists().not().isEmpty(),
]
, [verifyToken], USER.updateState);



//Export
module.exports = router;