//Requires
const express = require('express');
const { body } = require('express-validator');

//Initialize
const router = express.Router();

//Controllers
const { registerClient, registerAdmin } = require('../../controllers/register');

//Routes
router.post('/Account/Register', [
  body('name', 'Nombres inválidos').exists().not().isEmpty(),
  body('lastName', 'Apellidos inválidos').exists().not().isEmpty(),
  body('documentType', 'Tipo de documento inválido').exists().not().isEmpty(),
  body('identificationId', 'Número de documento inválido').exists().not().isEmpty(),
  body('expeditionDate', 'Fecha de expedición inválida').exists().not().isEmpty(),
  body('birthDate', 'Fecha de nacimiento inválida').exists().not().isEmpty(),
  body('email', 'Nombre inválido').exists().isEmail().not().isEmpty(),
  body('phoneNumber', 'Teléfono inválido').exists().not().isEmpty(),
  body('password', "La contraseña es incorrecta").exists().isLength({ min: 6 }).not().isEmpty(),
  body('confirmPassword', "La contraseña es incorrecta").exists().isLength({ min: 6 }).not().isEmpty(),
], registerClient);

//Routes
router.post('/Account/RegisterAdministrator', [
  body('email', 'Nombre inválido').exists().isEmail().not().isEmpty(),
  body('name', 'Nombres inválidos').exists().not().isEmpty(),
  body('lastName', 'Apellidos inválidos').exists().not().isEmpty(),
  body('identificationId', 'Número de documento inválido').exists().isInt().not().isEmpty(),
  body('password', "La contraseña es incorrecta").exists().isLength({ min: 6 }).not().isEmpty(),
], registerAdmin);

//Export
module.exports = router;