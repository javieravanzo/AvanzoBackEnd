
//Requires
const pool = require('../config/database.js');
const jwt = require('jsonwebtoken');
const { my_secret_key, base_URL, front_URL, base_URL_test } = require('../config/global');
const sgMail = require('@sendgrid/mail');
const path = require('path');
const fs = require('fs-extra');
const hbs = require('handlebars');




const updateState = async (userId,state) => {


  try {
    const clientQuery = await pool.query('UPDATE User SET status = ? where idUser = ?', [state, userId]);
    console.log(clientQuery)
    return { status: 200, message: { message: "El usuario cambio de estado exitosamente." } };
  } catch (e) {
    console.log(e);
    return { status: 500, message: "Error interno del servidor." };
  }

};


module.exports = {
  updateState
}