//Requires
const express = require('express');
const { body, header } = require('express-validator');
const multer = require('multer');
//const BaseURL = require('../../config/')

//Controllers
const { verifyToken } = require('../../controllers/validator');
const { getInitialData, getRequestData, getAllCustomer, createNewCustomer, getCustomers,
        createMultipleCustomer, getAllCustomerWithCompany, getTransactionsByUserId, 
        getAllCustomerToApprove, getCountCustomerToApprove, getDateListToCustomer, approveCustomer,
        updateCustomer, changeCustomerStatus, makePayment, deleteUsers,
        getAccountDetail} = require('../../controllers/customer');
 
//Initialize
const router = express.Router();

//Constants
//- Modify the folder/file storage
const storageAdmin = multer.diskStorage({
  destination: function(req, file, callback){
    
    //Production
    callback(null, '../files/admin/reads');

  },
  filename: function(req, file, callback){
    callback(null, new Date().toLocaleString("es-CO", {timeZone: "America/Bogota"}).toISOString().replace(/:/g, '-') + file.originalname);
  }
});

const storageCustomer = multer.diskStorage({
  destination: function(req, file, callback){
    callback(null, '../files/admin/reads');
  },
  filename: function(req, file, callback){
    callback(null, new Date().toLocaleString("es-CO", {timeZone: "America/Bogota"}).toISOString().replace(/:/g, '-') + file.originalname);
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
  body('lastName', 'Apellidos inválidos').exists().not().isEmpty(),
  body('identificationId', 'Número de documento inválido').exists().isInt().not().isEmpty(),
  body('documentType', 'Tipo de documento inválido').exists().not().isEmpty(),
  body('email', 'Nombre inválido').exists().isEmail().not().isEmpty(),
  body('phoneNumber', 'Teléfono celular inválido').exists().isInt().not().isEmpty(),
  body('idCompany', 'La empresa es inválida').exists().isInt().not().isEmpty(),
  body('vehicle', 'Falta el campo ¿Tiene vehiculo?').exists().isBoolean().not().isEmpty(),
  body('birthDate', 'Fecha de nacimiento es invalida la fecha debe ser YYYY-MM-DD').exists().isDate().not().isEmpty(),
  body('expeditionDate', 'Fecha de expedición es invalida la fecha debe ser YYYY-MM-DD').exists().isDate().not().isEmpty(),
  body('entryDate', 'Fecha de entrada es invalida la fecha debe ser YYYY-MM-DD').exists().isDate().not().isEmpty(),



],
[verifyToken], createNewCustomer);

router.put('/Customer/Update', [
  body('name', 'Nombres inválidos').exists().not().isEmpty(),
  body('lastName', 'Apellidos inválidos').exists().not().isEmpty(),
  body('identificationId', 'Número de documento inválido').exists().isInt().not().isEmpty(),
  body('email', 'Nombre inválido').exists().isEmail().not().isEmpty(),  
  body('phoneNumber', 'Teléfono celular inválido').exists().isInt().not().isEmpty(),
  body('idClient', 'El cliente es inválido').exists().isInt().not().isEmpty(),
], [verifyToken], updateCustomer);

router.get('/Customer/ChangePlatformStatus', [
 header('clientId', 'El cliente no es válido').exists().not().isEmpty(),
 header('status', 'El estado del cliente no es válido').exists().not().isEmpty(),
],
[verifyToken], changeCustomerStatus);

router.get('/Customer/GetAllByCompany', 
[verifyToken], getAllCustomer);

router.get('/Customer/GetAll', 
[verifyToken], getCustomers);

router.post('/Customer/MultipleCreate', 
uploads.single('file'),
[verifyToken], createMultipleCustomer);

router.get('/Customer/GetAllWithCompany',
[verifyToken], getAllCustomerWithCompany);

router.get('/Transactions/GetTransactionsByUserId', 
[verifyToken], getTransactionsByUserId);

router.get('/Customer/GetAllToApprove',
[verifyToken], getAllCustomerToApprove);

router.get('/Customer/GetCountToApprove',
[verifyToken], getCountCustomerToApprove);

router.get('/Customer/GetDateListToCustomer',
[verifyToken], getDateListToCustomer);

router.put('/Customer/ApproveorReject',
[verifyToken], approveCustomer);

router.put('/Customer/Delete', [verifyToken], deleteUsers);

router.post('/Customer/MakePayment', [verifyToken], makePayment);

router.get('/Customer/GetAccountDetail', [verifyToken], getAccountDetail);

//Export
module.exports = router;