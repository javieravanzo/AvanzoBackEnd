//Requires
const pool = require('../config/database.js');
const helpers = require('../lib/helpers');

//Services
const createCompanies = async (req, userId) => {
  
  //NewObject
  const {nit, address, socialReason, economyActivity, maximumSplit, defaultAmount, approveHumanResources, companyRate,
         companyFirstDate, companySecondDate, companyMembers, email, password} = req.body;

  try{
    
    //CompanySalaries
    const companyRates = {companyRateName: companyRate, companyRate: companyRate === "Mensual" ? 30 : 15, companyFirstDate, companySecondDate}
    const companySalaryRow = await pool.query('INSERT INTO companysalaries SET ?', [companyRates]);
    
    //Company
    const company = {nit, address, socialReason, economyActivity, maximumSplit, defaultAmount, approveHumanResources};
    company.registeredDate = new Date();
    company.registeredBy = userId;
    company.CompanySalaries_idCompanySalaries = companySalaryRow.insertId;
    const companyRow = await pool.query('INSERT INTO company SET ?', [company]);

    //CompanyMembers
    for (let i in companyMembers){
      const member = companyMembers[i];
      member.Company_idCompany = companyRow.insertId; 
      const memberRow = await pool.query('INSERT INTO companymembers SET ?', [member]);
    }

    //User
    const user = {email, name: socialReason, status: true, createdDate: new Date(), registeredBy: userId, registeredDate: new Date(), Role_idRole: 3, Company_idCompany: companyRow.insertId};
    const userRow = await pool.query('INSERT INTO user SET ?', [user]);

    //Auth
    const newAuth = { User_idUser: userRow.insertId, registeredBy: userId, registeredDate: new Date(), createdDate: new Date()};
    newAuth.password = await helpers.encryptPassword(password);
    const authQuery = await pool.query('INSERT INTO auth SET ?', [newAuth]);

    return {status: 200, message: {message: "La empresa ha sido creada de manera exitosa."}};
  }catch(e){
    throw e;
    //return {status: 500, message: "Error interno de l servidor."};
  }    
};

module.exports = {
  createCompanies
};