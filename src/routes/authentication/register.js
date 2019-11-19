//Requires
const express = require('express');
const { body, check } = require('express-validator');
const multer = require('multer');

//Initialize
const router = express.Router();

//Controllers
const { registerClient, registerAdmin, preRegister } = require('../../controllers/register');

//Modify the folder/file storage
const storage = multer.diskStorage({
  destination: function(req, file, callback){
    callback(null, './files/documents/');
  },
  filename: function(req, file, callback){
    callback(null, new Date().toISOString().replace(/:/g, '-') + file.originalname);
  }
});

//Functions
const uploads = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5
  }
});

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

router.post('/Account/NewRegister', uploads.fields([
  { name: 'documentId', maxCount: 1 },
  { name: 'photo', maxCount: 1 },
  { name: 'paymentReport', maxCount: 1}
]), preRegister);

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