//Requires
const express = require('express');
const { body, header } = require('express-validator');

//Controllers
const { makeRegistration } = require('../../controllers/integration');
 
//Initialize
const router = express.Router();

//Routes 
router.get('/Register/IntegrationRegister', 
[
  body('name', 'Nombres inválidos').exists().not().isEmpty(),
  body('lastName', 'Apellidos inválidos').exists().not().isEmpty(),
  body('identificationId', 'Número de documento inválido').exists().not().isEmpty(),
  body('expeditionDate', 'Fecha de expedición inválida').exists().not().isEmpty(),
  body('birthDate', 'Fecha de nacimiento inválida').exists().not().isEmpty(),
  body('email', 'Nombre inválido').exists().isEmail().not().isEmpty(),
  body('phoneNumber', 'Teléfono inválido').exists().not().isEmpty(),
], makeRegistration);

//Export
module.exports = router;