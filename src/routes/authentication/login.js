//Requires
const express = require('express');
const passport = require('passport');

//Initialize
const router = express.Router();

//Controllers
const { makeLogin } = require('../../controllers/general');

router.post('/Account/Token', makeLogin);

module.exports = router;