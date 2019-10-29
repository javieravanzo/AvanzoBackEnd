//Requires
const jwt = require('jsonwebtoken');
var fs = require("fs");
const {my_secret_key} = require('../config/global');

//Verify token
const verifyToken = async (req, res, next) => {
  
  try{
    //Get header value
    const bearerHeader = req.headers['authorization'];

    if(typeof bearerHeader !== 'undefined'){ 
      //Get the real token
      const bearer = bearerHeader.split(" ")[1];
      //Set the token
    
        jwt.verify(bearer, my_secret_key, (err) => {
          if(err){
            res.sendStatus(403).json({message: "El token es inválido o la sesión ha expirado. Por favor, vuelva a ingresar."});
          }else{
            next();
          }
        });
    }else{
      res.sendStatus(401).json({message: "El usuario no tiene permisos para acceder a este recurso."});
    }
  }catch(e){
    return false;
  }
};

const checkFile = async (req, res, next) => {
  //console.log("REQ!!", req);
  fs.writeFile("/files/images/arghhhh.jpg", new Buffer.from(req.body.file, "base64"), function(err) {});
}

module.exports = {
  verifyToken, checkFile
};
