//Requires
const express = require('express');
const { body, header } = require('express-validator');
const multer = require('multer');

//Initialize
const router = express.Router();

//Controllers
const { verifyToken } = require('../../controllers/validator');
const { createCompany, getAllCompanies, getCompaniesForUser, updateCompany,
        getCompanyWithSalary, activateCompany, updateSalaries, updateMaximumAmountByCompany
      } = require('../../controllers/company');

//Constants
//- Modify the folder/file storage
const storageAdmin = multer.diskStorage({
  destination: function(req, file, callback){
    
    //Production
    callback(null, '../files/reads');

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


//Routes 
router.post('/Company/Create', 
  [
    body('nit', 'El número nit no es válido.').exists().not().isEmpty(),
    body('address', 'La dirección no es válida.').exists().not().isEmpty(),
    body('socialReason', 'La razón social no es válida.').exists().not().isEmpty(),
    body('economyActivity', 'La actividad económica no es válida.').exists().not().isEmpty(),
    body('maximumSplit', 'La cantidad de cuotas máxima no es válida.').exists().isInt(),
    body('defaultAmount', 'La máxima cantidad a prestar no es válida.').exists().isInt(),
    body('approveHumanResources', 'La aprobación por recursos humano es inválida.').exists().not().isEmpty(),
    body('companySalaries', 'Los ciclos de pago son inválidos').exists().not().isEmpty(),
    body('companyMembers', 'Los miembros de la compañia son inválidos.').exists().not().isEmpty(),
    body('password', 'La contraseña es inválida.').exists().not().isEmpty(),
    body('email', 'El correo electrónico es inválido.').exists().isEmail(),
  ],
[verifyToken], createCompany);

router.put('/Company/Update', 
  [
    body('nit', 'El número nit no es válido.').exists().not().isEmpty(),
    body('address', 'La dirección no es válida.').exists().not().isEmpty(),
    body('socialReason', 'La razón social no es válida.').exists().not().isEmpty(),
    body('economyActivity', 'La actividad económica no es válida.').exists().not().isEmpty(),
    body('maximumSplit', 'La cantidad de cuotas máxima no es válida.').exists().isInt(),
    body('defaultAmount', 'La máxima cantidad a prestar no es válida.').exists().isInt(),
    body('approveHumanResources', 'La aprobación por recursos humano es inválida.').exists().not().isEmpty(),
    //body('email', 'El correo electrónico es inválido.').exists().isEmail(),
  ],
[verifyToken], updateCompany);

//Routes 
router.get('/Company/GetAll', [verifyToken], getAllCompanies);

router.get('/Company/GetWithSalaries', [verifyToken], getCompanyWithSalary);

router.get('/Company/GetAllForUsers', getCompaniesForUser);

router.put('/Company/ChangePlatformStatus', activateCompany);

router.put('/Company/UpdateCompanySalaries', updateSalaries);

router.post('/Company/LoadMaxAmountToOutLayByClient', 
uploads.single('file'),
[verifyToken], updateMaximumAmountByCompany);


//Export
module.exports = router;