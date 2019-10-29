//Requires
const { validationResult } = require('express-validator');
const { front_URL } = require('../config/global');
const jwt = require('jsonwebtoken');

//Imports
const { login, confirmAccounts, getDocumentsTypes, resetPassword, confirmedPassword } = require('../services/general');

//Functions
//Get the user with token
function getUserIdFromToken(req){

  //Get the real token
  const bearer = req.params.token;

  //Set the token
  const decoded = jwt.decode(bearer);

  return (parseInt(decoded.userRow[0].idUser, 10));  

}; 

//Controllers
const makeLogin = async (req, res, next) => {
  
  //Validate input
  const errors = validationResult(req); 

  if (!errors.isEmpty()) {
    res.status(422).json({ message: errors.errors[0].msg });
    return;
  }

  const {email, password} = req.body;

  if(email !== "" && password !== ""){
    try {
      const result = await login(email, password);
      if(result.status === 200){
        res.status(result.status).json(result.data);
      }else{
        res.status(result.status).json({message: result.message});
      }
      next();
    } catch(e) {
        res.status(500).json({message:"No es posible realizar el login en este momento."});
    };
  }else{
    res.status(404).json({message:"Ingrese correctamente los datos, por favor."});
  }
};

const confirmAccount = async (req, res, next) => {

  //Get the userid
  const userId = getUserIdFromToken(req);

  try{
    const result = await confirmAccounts(req, userId);
    if(result.status === 200){
      res.redirect(front_URL+'login');
    }else{
      res.status(result.status).json({message: result.message});
    }
    next();
  } catch(e) {
      res.status(500).json({message:"No es posible realizar la confirmación de la cuenta en este momento."});
  };
};

const getDocumentTypes = async (req, res) => {
  try {
    const result = await getDocumentsTypes();
    if(result.status === 200){
      res.status(result.status).json(result.data);
    }else{
      res.status(result.status).json(result.message);
    }
  }catch(e) {
      res.status(500).json({message: "No es posible traer la información en este momento."});
  }
};
 
const modifyPassword = async (req, res, next) => {
    const {email} = req.headers;
    try {
      const result = await resetPassword(email);
      if(result.status === 200){
        res.status(result.status).json(result.message);
      }else{
        res.status(result.status).json(result.message);
      }
      next();
    }catch(e) {
        res.status(500).json({message: "No es posible realizar el cambio de contraseña en este momento."});
    };
};

const confirmPassword = async (req, res, next) => {
    const {password, confirmPassword} = req.body;
    const email = "capisi@gmail.com";
    try {
        if (password === confirmPassword){
            const result = await confirmedPassword(email, password);
            if(result.status === 200){
                res.status(result.status).json(result.message);
            }else{
                res.status(result.status).json(result.message);
            }
        }else{
            res.status(400).json({message: "Las contraseñas no coinciden."});
        }
        next();
    }catch(e) {
      throw(e);
    };
};

module.exports = {
  makeLogin, confirmAccount, getDocumentTypes, modifyPassword, confirmPassword
};