//Requires
const { validationResult } = require('express-validator');

//Imports
const { registerCustomer } = require('../services/register');
 
const registerClient = async (req, res, next) => {

  //Validate input
  const errors = validationResult(req); 

  if (!errors.isEmpty()) {
    //res.status(422).json({ message: errors.errors[0].msg });
    res.status(422).json({ message: errors.array() });
    return;
  }

  //Logic
  const {name, lastName, documentType, identificationId, expeditionDate, birthDate, email, phoneNumber, password, confirmPassword} = req.body;
  const client = {lastName, documentType, identificationId, expeditionDate, birthDate, phoneNumber };
  const user = {name, email };
  const auth = {email, password, confirmPassword};
  if(password === confirmPassword){
    try {
      const result = await registerCustomer(client, user, auth);
      res.status(result.status).json(result.message);      
    }catch(e) {
      res.status(500).json({message:"No es posible realizar el registro en este momento."});
    };
  }else{
    res.status(400).json({message: "Las contraseñas no coinciden."});
  }
  
};
 
module.exports = {
    registerClient
};
