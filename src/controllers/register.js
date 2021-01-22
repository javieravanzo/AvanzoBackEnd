//Requires
const { validationResult } = require('express-validator');
const path = require('path');

//Imports
const { registerCustomer, registerAdmins, newPreregister } = require('../services/register');

const registerClient = async (req, res, next) => {

  //Variables
  const { name, lastName, documentType, identificationId, expeditionDate, birthDate, email,
    phoneNumber, password, confirmPassword } = req.body;

  //Validate input
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    //res.status(422).json({ message: errors.errors[0].msg });
    res.status(422).json({ message: errors.array() });
    return;
  }

  //Logic
  const client = { lastName, documentType, phoneNumber };

  //client.birthDate = new Date(birthDate.split('/')[2], birthDate.split('/')[1], birthDate.split('/')[0]);
  //client.expeditionDate = new Date(expeditionDate.split('/')[2], expeditionDate.split('/')[1], expeditionDate.split('/')[0]);

  const user = { name, email };
  const auth = { email, password, confirmPassword };
  if (password === confirmPassword) {
    try {
      const result = await registerCustomer(identificationId, client, user, auth);
      res.status(result.status).json({ message: result.message });
    } catch (e) {
      res.status(500).json({ message: "No es posible realizar el registro en este momento." });
    };
  } else {
    res.status(400).json({ message: "Las contraseñas no coinciden." });
  }
};

const preRegister = async (req, res, next) => {

  //Variables
  const { name, lastName, identificationId, documentType, city, birthDate, salary, email, company, phoneNumber, password, gender,
    vehicle, vehicle_type, license_plate_vehicle, clie_address, clie_from } = req.body;

  //console.log("Body", documentType);

  //Validate input
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    //res.status(422).json({ message: errors.errors[0].msg });
    res.status(422).json({ message: errors.array() });
    return;
  }
  //Logic
  const client = {
    documentType, identificationId, city, birthDate, salary, phoneNumber, Company_idCompany: company, gender,
    vehicle, vehicle_type, license_plate_vehicle, clie_address, clie_from
  };
  const user = { name, email, lastName };
  //console.log("RF", req.files);
  const files = {
    documentId: path.normalize(req.files.documentId[0].path).replace("../files/documents/", ""),
    paymentReport: path.normalize(req.files.paymentReport[0].path).replace("../files/documents/", "")
  };
  //console.log("files", files);
  const auth = { password };

  try {
    const result = await newPreregister(client, user, files, auth);
     console.log(result);
    res.status(result.status).json({ message: result.message });
  } catch (e) {
    console.log("E", e);
    res.status(500).json({ message: "No es posible realizar el registro en este momento." });
  };

};

const registerAdmin = async (req, res, next) => {

  //Variables
  const { email, name, lastName, identificationId, password } = req.body;

  //Validate input
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    //res.status(422).json({ message: errors.errors[0].msg });
    res.status(422).json({ message: errors.array() });
    return;
  }

  //Logic
  const admin = { identificationId, adminType: "superAdmin" };
  const user = { name, email, lastName };
  const auth = { email, password };
  try {
    const result = await registerAdmins(admin, user, auth);
    res.status(result.status).json({ message: result.message });
  } catch (e) {
    console.log("E", e);
    res.status(500).json({ message: "No es posible realizar el registro en este momento." });
  };

};

module.exports = {
  registerClient, registerAdmin, preRegister
};
