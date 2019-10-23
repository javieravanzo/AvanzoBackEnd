//Requires
const jwt = require('jsonwebtoken');
const {my_secret_key} = require('../config/global');

//Verify token
const verifyToken = async (req, res, next) => {
  //Get header value
  const bearerHeader = req.headers['authorization'];

  if(typeof bearerHeader !== 'undefined'){ 
    //Get the real token
    const bearer = bearerHeader.split(" ")[1];
    //Set the token
    try{
      jwt.verify(bearer, my_secret_key, (err) => {
        if(err){
          res.sendStatus(403).json({message: "El token es inválido o la sesión ha expirado. Por favor, vuelva a ingresar."});
        }else{
          next();
        }
      });
    }catch(e){
      res.sendStatus(500).json({message: "Error interno del servidor."});
    }
  }else{
    res.sendStatus(401).json({message: "El usuario no tiene permisos para acceder a este recurso."});
  }
};

module.exports = {
  verifyToken
};
