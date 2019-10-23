//Requires
const { validationResult } = require('express-validator');

//Imports
const { integrationRegister } = require('../services/integration');

//Controllers
const makeRegistration = async (req, res, next) => {

  //Variables
  const {name, lastName, identificationId, expeditionDate, birthDate, email,
         phoneNumber} = req.body;

  //Validate input
  const errors = validationResult(req); 

  if (!errors.isEmpty()) {
    res.status(422).json({ message: errors.array() });
    return;
  }

  //Logic
  const client = {lastName, phoneNumber, expeditionDate, birthDate};
  const user = {name, email};
  const auth = {email};
  //client.birthDate = new Date(birthDate.split('/')[2], birthDate.split('/')[1], birthDate.split('/')[0]);
  //client.expeditionDate = new Date(expeditionDate.split('/')[2], expeditionDate.split('/')[1], expeditionDate.split('/')[0]);
  
  try {
    const result = await integrationRegister(identificationId, client, user, auth);
    res.status(result.status).json({message: result.message});      
  }catch(e) {
    res.status(500).json({message:"No es posible realizar el registro en este momento."});
  };

};


module.exports = {
  makeRegistration
};