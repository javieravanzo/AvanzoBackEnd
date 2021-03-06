
//Requires
const pool = require('../config/database.js');
// const {my_secret_key, base_URL, front_URL, base_URL_test} = require('../config/global');
// const sgMail = require('@sendgrid/mail');
// const path = require('path');
// const fs = require('fs-extra');
// const hbs = require('handlebars');
const { PRE_CLIENT_STATES } = require('../utils/constants.js');


const validateDocumentNumber = async (documentNumber) =>{
  
  try {

    const exist = await pool.query('SELECT C.identificationId FROM Client C  where (C.identificationId = ?)', documentNumber);
    const userPre = await pool.query(`SELECT * FROM avanzo.NewClient nc WHERE nc.status <> ${PRE_CLIENT_STATES.REJECTED} AND  nc.identificationId = ? `, [documentNumber]);

    if(JSON.stringify(exist) !== '[]' || JSON.stringify(userPre) !== '[]' ){
      return {status: 200, data: true};
    }else{
      return {status: 200, data: false};
    }
  }catch(e) {
    console.log(e);
    return {status: 500, message: "Error interno del servidor."};
  }

};


const validatePhoneNumber = async (phoneNumber) =>{
  
  try {

    const exist = await pool.query('SELECT C.phoneNumber FROM Client C  where (C.phoneNumber = ?)', phoneNumber);
    const userPre = await pool.query(`SELECT * FROM avanzo.NewClient nc WHERE nc.status <> ${PRE_CLIENT_STATES.REJECTED} AND  nc.phoneNumber = ?`, [phoneNumber]);

    if(JSON.stringify(exist) !== '[]' || JSON.stringify(userPre) !== '[]' ){
      return {status: 200, data: true};
    }else{
      return {status: 200, data: false};
    }
  }catch(e) {
    console.log(e);
    return {status: 500, message: "Error interno del servidor."};
  }

};

const validateEmail = async (email) =>{
  
  try {

    const exist = await pool.query('SELECT U.email FROM User U  where (U.email = ?)', email);
    const userPre = await pool.query(`SELECT * FROM avanzo.NewClient nc WHERE nc.status <> ${PRE_CLIENT_STATES.REJECTED} AND  nc.email = ?`, [email]);

    if(JSON.stringify(exist) !== '[]' || JSON.stringify(userPre) !== '[]'  ){
      return {status: 200, data: true};
    }else{
      return {status: 200, data: false};
    }
  }catch(e) {
    console.log(e);
    return {status: 500, message: "Error interno del servidor."};
  }

};


module.exports = {validateDocumentNumber,validatePhoneNumber,validateEmail}