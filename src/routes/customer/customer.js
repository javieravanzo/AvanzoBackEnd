//Requires
const express = require('express');
const { body, header } = require('express-validator');
const multer = require('multer');

//Controllers
const { verifyToken } = require('../../controllers/validator');
const { getInitialData, getRequestData, getAllCustomer, createNewCustomer,
        createMultipleCustomer, getAllCustomerWithCompany, getTransactionsByUserId} = require('../../controllers/customer');
 
//Initialize
const router = express.Router();

//Constants
//- Modify the folder/file storage
const storageAdmin = multer.diskStorage({
  destination: function(req, file, callback){
    callback(null, './files/admin/reads');
  },
  filename: function(req, file, callback){
    callback(null, new Date().toISOString().replace(/:/g, '-') + file.originalname);
  }
});

const storageCustomer = multer.diskStorage({
  destination: function(req, file, callback){
    callback(null, './files/admin/reads');
  },
  filename: function(req, file, callback){
    callback(null, new Date().toISOString().replace(/:/g, '-') + file.originalname);
  }
});

const uploads = multer({
  storage: storageAdmin,
  limits: {
    fileSize: 1024 * 1024 * 5
  }
});

const contracts = multer({
  storage: storageCustomer,
  limits: {
    fileSize: 1024 * 1024 * 5
  }
});

//Routes 
router.get('/Customer/GetInitialData',
[verifyToken], getInitialData);

router.get('/Customer/GetRequestData',
[verifyToken], getRequestData);

router.post('/Customer/Create', [
  body('name', 'Nombres inválidos').exists().not().isEmpty(),
  body('email', 'Nombre inválido').exists().isEmail().not().isEmpty(),
  body('identificationId', 'Número de documento inválido').exists().isInt().not().isEmpty(),
  body('lastName', 'Apellidos inválidos').exists().not().isEmpty(),
  body('documentType', 'Tipo de documento inválido').exists().not().isEmpty(),
  body('phoneNumber', 'Teléfono celular inválido').exists().isInt().not().isEmpty(),
  body('companyid', 'La empresa es inválida').exists().isInt().not().isEmpty(),
],
[verifyToken], createNewCustomer);

router.get('/Customer/GetAll', 
[verifyToken], getAllCustomer);

router.post('/Customer/MultipleCreate', 
uploads.single('file'),
[verifyToken], createMultipleCustomer);

router.get('/Customer/GetAllWithCompany',
[verifyToken], getAllCustomerWithCompany);

router.get('/Transactions/GetTransactionsByUserId', 
[verifyToken], getTransactionsByUserId);


//Export
module.exports = router;