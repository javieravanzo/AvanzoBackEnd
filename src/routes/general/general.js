//Requires
const express = require('express');
const jwt = require('jsonwebtoken');

//Initialize
const router = express.Router();

//Controllers
const { getDocumentTypes, modifyPassword, confirmPassword } = require('../../controllers/general');

//Verify token
function verifyToken (req, res, next) {
  //Get header value
  const bearerHeader = req.headers['authorization'];
  if(typeof bearerHeader !== 'undefined'){ 
    //Get the real token
    const bearer = bearerHeader.split(" ")[1];
    //Set the token
    jwt.verify(bearer, "my_secret_key", (err, authData) => {
      if(err){
        res.status(403).json({message: "La sesión ha expirado. Por favor, vuelva a ingresar."});
      }else{
        next();
      }
    });
  }else{
    res.sendStatus(401).json({message: "El usuario no tiene permisos para acceder a este recurso."});
  }
};

//Routes --- Documents
router.get('/DocumentTypes/GetAll', getDocumentTypes);
//Routes --- Account
router.get('/Account/ResetPassword', verifyToken, modifyPassword);
router.put('/Account/ConfirmPassword', verifyToken, confirmPassword);

//Export
module.exports = router;