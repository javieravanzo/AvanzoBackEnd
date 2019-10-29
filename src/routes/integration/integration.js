//Requires
const express = require('express');
const { header, body } = require('express-validator');

//Controllers
const { makeRegistration, checkPhone } = require('../../controllers/integration');
 
//Initialize
const router = express.Router();

//Routes 
router.post('/Integration/Register', 
[
  body('name', 'Nombres inválidos').exists().not().isEmpty(),
  body('lastName', 'Apellidos inválidos').exists().not().isEmpty(),
  body('identificationId', 'Número de documento inválido').exists().not().isEmpty(),
  body('expeditionDate', 'Fecha de expedición inválida').exists().not().isEmpty(),
  body('birthDate', 'Fecha de nacimiento inválida').exists().not().isEmpty(),
  body('email', 'Nombre inválido').exists().isEmail().not().isEmpty(),
  body('phoneNumber', 'Teléfono inválido').exists().not().isEmpty(),
], makeRegistration);

//Routes 
router.get('/Integration/CheckPhone', 
[
  header('phoneNumber', 'Teléfono inválido').exists().not().isEmpty().isLength({ min: 10, max: 10 })
], checkPhone);

//Export
module.exports = router;