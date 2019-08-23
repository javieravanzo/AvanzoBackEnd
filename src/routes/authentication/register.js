//Requires
const express = require('express');
const passport = require('passport');

//Initialize
const router = express.Router();

//Controllers
const { registerClient } = require('../../controllers/register');

router.post('/Account/Register', registerClient);

module.exports = router;