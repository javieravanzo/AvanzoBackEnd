//Requires
const express = require('express');
const { body, header } = require('express-validator');

//Initialize
const router = express.Router();

//Controllers
const { verifyToken } = require('../../controllers/validator');
const { createCompany, getAllCompanies, getCompaniesForUser, updateCompany,
        getCompanyWithSalary } = require('../../controllers/company');
 
//Routes 
router.post('/Company/Create', 
  [
    body('nit', 'El número nit no es válido.').exists().isInt(),
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
    body('nit', 'El número nit no es válido.').exists().isInt(),
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

//Export
module.exports = router;