//Requires
const math = require('math');
const pool = require('../config/database.js');
const fs = require('fs-extra');
const hbs = require('handlebars');
const moment = require('moment');
const path = require('path');
const sgMail = require('@sendgrid/mail');
const mkdirp = require('mkdirp');
const pdf = require('html-pdf');


const checkDateList = (customerId, split, quantity) => {

  try {
    //Dates

    const userRow =  await pool.query('SELECT COMSAL.* FROM User USR JOIN Client CLI JOIN Company COM JOIN Company_has_CompanySalaries CHC JOIN CompanySalaries COMSAL ON (USR.Client_idClient = CLI.idClient AND CLI.Company_idCompany = COM.idCompany AND CHC.Company_idCompany = COM.idCompany AND CHC.CompanySalaries_idCompanySalaries = COMSAL.idCompanySalaries ) where USR.idUser = ?', [customerId]);
    //console.log("UR", userRow[0]);
    //let today = new Date().toLocaleString("en-US", {timeZone: "America/Bogota"});
    let today = new Date();
    console.log("Today", today.getHours());
    console.log("TodayHours", today.getUTCHours());

    //ntoday
    let new_today = Date.now();
    console.log("New_Today", new_today);

    let numberToday = today.getDay();
    console.log("NumberToday", numberToday);

    //ReportDays
    let reportDays = userRow[0].companyReportDate.split(',');
    console.log("Report Days", reportDays);

    console.log("Report1", reportDays[0]);
    console.log("Report2", reportDays[1]);

    //NumberPayments
    let reportQuantity = userRow[0].companyPaymentNumber;

    let datesList = [];

    for (let i=0; i<split; i++){

      let new_date = {
        id: i,
        name: "Descuento No. " + (i+1),
        //quantity: partialQuantity,
        date: today
      };
      
      datesList.push(new_date);
      //firstDate.setDate((firstDate.getDate()+dateRate));

    };

    return datesList;

  }catch(e){

    console.log(e);
    return {status: 500, message: "Error interno del servidor."};

  }

};


module.exports = {
  checkDateList
};
