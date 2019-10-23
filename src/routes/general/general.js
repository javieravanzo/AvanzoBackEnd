//Requires
const express = require('express');

//Initialize
const router = express.Router();

//Controllers
const { getDocumentTypes, modifyPassword, confirmPassword } = require('../../controllers/general');

//Routes --- Documents
router.get('/DocumentTypes/GetAll', getDocumentTypes);
//Routes --- Account
router.get('/Account/ResetPassword', modifyPassword);
router.put('/Account/ConfirmPassword', confirmPassword);

//Export
module.exports = router;