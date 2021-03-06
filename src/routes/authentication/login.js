//Requires
const express = require('express');
const { body } = require('express-validator');

//Initialize
const router = express.Router();

//Controllers
const { makeLogin, confirmAccount, newLogin } = require('../../controllers/general');

//Route
router.post('/Account/Token', [
  body('email', 'Email inválido').exists().isEmail(),
  body('password', "La contraseña es incorrecta123").exists(),
], makeLogin);

router.post('/Account/NewToken', newLogin);

router.get('/Account/Confirm/:token', 
confirmAccount);

module.exports = router;