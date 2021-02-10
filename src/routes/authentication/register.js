//Requires
const express = require('express');
const multer = require('multer');
const mkdirp = require('mkdirp');
const { body, check } = require('express-validator');

//Initialize
const router = express.Router();

//Modify the folder/file storage
const storage = multer.diskStorage({
  destination: function (req, file, callback) {

    //Production
    var dest = '../files/documents/' + req.body.identificationId + '-' + req.body.company + '/';
    mkdirp.sync(dest);
    callback(null, dest);

    //Development
    //var dest = './files/documents/'+req.body.identificationId+'-'+req.body.company+'/';
    //mkdirp.sync(dest);
    //callback(null, dest);

  },
  filename: function (req, file, callback) {
    callback(null, file.fieldname + "."+file.originalname.split(".")[1]);
  }
});

//Functions
const uploads = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5
  }
});

//Controllers
const { registerClient, registerAdmin, preRegister } = require('../../controllers/register');


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
  { name: 'paymentReport', maxCount: 1 }]),
  body('birthDate', 'Fecha de nacimiento es invalida la fecha debe ser YYYY-MM-DD').exists().isDate().not().isEmpty()
  , preRegister);

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