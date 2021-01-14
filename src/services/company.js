//Requires
const pool = require('../config/database.js');
const helpers = require('../lib/helpers');

//Services
const createCompanies = async (req, userId) => {
  
  //NewObject
  const {nit, address, socialReason, economyActivity, maximumSplit, defaultAmount,
         approveHumanResources, paymentSupport, workingSupport, companySalaries, companyMembers,
         email, password, databaseExchange, fixedFee} = req.body;

  try{   
    
    //Company
    const company = {
      nit, address, socialReason, economyActivity, maximumSplit, defaultAmount,
      approveHumanResources, paymentSupport, workingSupport, databaseExchange, fixedFee};
    company.registeredDate = new Date().toLocaleString("es-CO", {timeZone: "America/Bogota"});
    company.registeredBy = userId;
    const consultEmail = await pool.query('SELECT C.idCompany, U.email FROM Company C JOIN User U ON (U.Company_idCompany = C.idCompany) where C.nit = ? OR U.email = ?', [nit, email]);
    ////console.log("CE", consultEmail.length > 0);
    if(consultEmail.length === 0){

      const companyRow = await pool.query('INSERT INTO Company SET ?', [company]);
      //console.log("0", companyRow);
      
      //CompanySalaries
      for (let i in companySalaries){

        let cycle = companySalaries[i];
        let newCycle = {};
        let paymentArray = "";

        if( cycle.companyRate === "Quincenal"){       
          if(parseInt(cycle.companySecondDate,10) >= parseInt(cycle.companyFirstDate, 10)){
            paymentArray = cycle.companyFirstDate + ',' + cycle.companySecondDate;
          }else{
            paymentArray = cycle.companySecondDate + ',' + cycle.companyFirstDate;
          }
        }else{
          paymentArray = cycle.companyFirstDate;
        }

        //console.log("CRD", cycle);

        let reports =  cycle.companyReportDates;
        let reportArray = reports.split(',');
        
        reportArray.sort();

        //console.log("ReportArray", reportArray);

        let newArray = reportArray.toString();

        //console.log("ReportArray", newArray);

        newCycle.companyRateName = cycle.companyRate;
        newCycle.companyPaymentNumber = cycle.companyRate === "Mensual" ? 1 : 2;
        newCycle.companyRate = cycle.companyRate === "Mensual" ? 30 : 15;
        newCycle.companyPaymentDates = paymentArray;
        newCycle.companyReportDates = newArray;

        //console.log("Cycle", newCycle);

        const companySalaryRow = await pool.query('INSERT INTO CompanySalaries SET ?', [newCycle]);
        ////console.log("1", companySalaryRow);

        const newLinks = {
          Company_idCompany: companyRow.insertId,
          CompanySalaries_idCompanySalaries: companySalaryRow.insertId
        };

        const companyLink = await pool.query('INSERT INTO Company_has_CompanySalaries SET ?', [newLinks]);
        //console.log("2", companyLink);
      }

      //CompanyMembers
      for (let i in companyMembers){
        const member = companyMembers[i];
        member.Company_idCompany = companyRow.insertId; 
        const memberRow = await pool.query('INSERT INTO CompanyMembers SET ?', [member]);
      }

      //User
      const user = {email, name: socialReason, isConfirmed: true, status: true, createdDate: new Date().toLocaleString("es-CO", {timeZone: "America/Bogota"}), registeredBy: userId, registeredDate: new Date().toLocaleString("es-CO", {timeZone: "America/Bogota"}), Role_idRole: 3, Company_idCompany: companyRow.insertId};
      const userRow = await pool.query('INSERT INTO User SET ?', [user]);

      //Auth
      const newAuth = { User_idUser: userRow.insertId, registeredBy: userId, registeredDate: new Date().toLocaleString("es-CO", {timeZone: "America/Bogota"}), createdDate: new Date().toLocaleString("es-CO", {timeZone: "America/Bogota"})};
      newAuth.password = await helpers.encryptPassword(password);
      const authQuery = await pool.query('INSERT INTO Auth SET ?', [newAuth]); 

      return {status: 200, message: {message: "La empresa ha sido creada de manera exitosa."}};

    }else{
      
      return {status: 500, message: {message: "El NIT o el correo electrónico que suministraste ya ha sido registrado en la plataforma."}};
    }
  }catch(e){
    console.log("Stack", e);
    throw e;
    //return {status: 500, message: "Error interno de l servidor."};
  }    
};

const updateCompanies = async (req, userId) => {
  
  //NewObject
  const {nit, address, socialReason, economyActivity, maximumSplit, defaultAmount, approveHumanResources, 
         email, idCompany, idUser, changeSplit, changeAmount, fixedFee} = req.body;

  //console.log("Split", maximumSplit);

  try{
    
    //CompanySalaries
    //const companyRates = {companyRateName: companyRate, companyRate: companyRate === "Mensual" ? 30 : 15, companyFirstDate, companySecondDate: companySecondDate !== undefined ? companySecondDate : null}
    //const companySalaryRow = await pool.query('INSERT INTO CompanySalaries SET ?', [companyRates]);
    
    //Company
    const company = {
      nit, address, socialReason, economyActivity, maximumSplit,
      defaultAmount, approveHumanResources, fixedFee};
    company.registeredDate = new Date().toLocaleString("es-CO", {timeZone: "America/Bogota"});
    company.registeredBy = userId;
    //company.CompanySalaries_idCompanySalaries = companySalaryRow.insertId;
    const companyRow = await pool.query('UPDATE Company SET ? where idCompany = ?', [company, idCompany]);

    //Update - Company Users - Fee
    const companyUsersSplit = null;
    
    if(changeSplit){
    
     const companyUsersSplit = await pool.query('UPDATE Account INNER JOIN Client ON (Account.Client_idClient = Client.idCLient) SET montlyFee = ? where Client.Company_idCompany = ?', [ maximumSplit, idCompany])
    
    }

    //Update - CompanyUsers - Amount
    const companyUsersAmount = null;

    if(changeAmount){

      const companyUsersAmount = await pool.query('UPDATE Account INNER JOIN Client ON (Account.Client_idClient = Client.idCLient) SET maximumAmount = ? where Client.Company_idCompany = ?', [ defaultAmount, idCompany])
  
    }

     /*for (let i in companyMembers){
      const member = companyMembers[i];
      member.Company_idCompany = companyRow.insertId; 
      const memberRow = await pool.query('INSERT INTO CompanyMembers SET ?', [member]);
    }*/

    //User
    const user = {email, name: socialReason, status: true, registeredBy: userId, registeredDate: new Date().toLocaleString("es-CO", {timeZone: "America/Bogota"})};
    const userRow = await pool.query('UPDATE User SET ? where idUser = ?', [user, idUser]);

    //Auth
    /*const newAuth = { User_idUser: userRow.insertId, registeredBy: userId, registeredDate: new Date().toLocaleString("es-CO", {timeZone: "America/Bogota"}), createdDate: new Date().toLocaleString("es-CO", {timeZone: "America/Bogota"})};
    newAuth.password = await helpers.encryptPassword(password);
    const authQuery = await pool.query('INSERT INTO Auth SET ?', [newAuth]);*/

    return {status: 200, message: {message: "La empresa ha sido actualizada de manera exitosa."}};
  }catch(e){
    console.log(e);
    throw e;
    //return {status: 500, message: "Error interno de l servidor."};
  }    
};

const getCompanies = async (req, userId) => {
  
  try{
    //const companyRow = await pool.query('SELECT C.*, U.email FROM Company C JOIN User U ON (C.idCompany = U.Company_idCompany)');
    const companyRow = await pool.query('SELECT C.*, U.email, U.status FROM Company C JOIN User U ON (C.idCompany = U.Company_idCompany)');
    return {status: 200, data: companyRow};
  }catch(e){
    console.log(e);
    //throw e;
    return {status: 500, data: [], message: "Error interno del servidor."};
  }  

};

const getAllCompaniesForUser = async ( ) => {
  
  try{
    const companyRow = await pool.query('SELECT C.idCompany, C.socialReason FROM Company C ORDER BY C.socialReason ASC');
    
    return {status: 200, data: {
                          companyRow: companyRow,
                         }
    };
  }catch(e){
    console.log(e);
    //throw e;
    return {status: 500, data: [], message: "Error interno del servidor."};
  }  

};

const getCyclesByCompanyId = async (companyId) => {
  
  try{
    const cycles = await pool.query('SELECT CS.idCompanySalaries, CS.companyRateName, CS.companyReportDates, CS.companyPaymentDates FROM CompanySalaries CS JOIN avanzo.Company_has_CompanySalaries CHS ON (CHS.CompanySalaries_idCompanySalaries = CS.idCompanySalaries AND CHS.Company_idCompany=?)',[companyId]);
    
    return {status: 200, data: {
                          cycles: cycles
                         }
    };
  }catch(e){
    console.log(e);
    //throw e;
    return {status: 500, data: [], message: "Error interno del servidor."};
  }  

};

const getCompanyWithSalaries = async (companyId) => {

  try{
    const companyRow = await pool.query('SELECT CS.idCompanySalaries, CS.companyRateName, CS.companyPaymentNumber, CS.companyRate, CS.companyReportDates, CS.companyPaymentDates FROM CompanySalaries CS JOIN Company_has_CompanySalaries CHS ON (CS.idCompanySalaries = CHS.CompanySalaries_idCompanySalaries) WHERE (CHS.Company_idCompany = ?)', [companyId]);
    return {status: 200, data: companyRow};
  }catch(e){
    console.log(e);
    //throw e;
    return {status: 500, message: "Error interno del servidor."};
  }  

};

const updateCompanySalary = async (companyRow) => {

  try{
    const companySalary = await pool.query('UPDATE CompanySalaries SET ? where idCompanySalaries = ?', [companyRow, companyRow.idCompanySalaries]);
    return {status: 200, message: "El ciclo de pago ha sido modificado."};
  }catch(e){
    console.log(e);
    return {status: 500, message: "Error interno del servidor."};
  }

};

const activateCompanies = async (companyId, active) => {

  try{   
    if(active === "true"){
      const companyQuery = await pool.query('UPDATE User SET status = ? where Company_idCompany = ?', [true, companyId]);
      return {status: 200, message: {message:"La empresa ha sido activada exitosamente."}};
    }else{
      const companyQuery = await pool.query('UPDATE User SET status = ? where Company_idCompany = ?', [false, companyId]);
      return {status: 200, message: {message: "La empresa ha sido desactivada  exitosamente."}};
    }
  }catch(e){
    console.log(e);
    return {status: 500, message: "Error interno del servidor."};
  }

};

const modifymaximumAmountByCompany = async (customersData, adminId, idCompany) => {

  try{
  
    const companyNitQuery = await pool.query('SELECT C.idCompany FROM Company C where C.idCompany = ?', idCompany);

    if (companyNitQuery !== '[]'){

      for (let i in customersData){       
        
        //Create the client
        let new_account = {
          maximumAmount: customersData[i]['MONTO A PRESTAR'],
          registeredBy: adminId,
          registeredDate: new Date().toLocaleString("es-CO", {timeZone: "America/Bogota"}),
        };

        //console.log("NA", new_account);

        //Insert the client
        const clientQuery = await pool.query('UPDATE Account A JOIN Client C ON (A.Client_idClient = C.idClient) SET A.maximumAmount = ?, A.registeredBy = ?, A.registeredDate = ?  where C.identificationId = ?', [customersData[i]['MONTO A PRESTAR'], adminId, new Date().toLocaleString("es-CO", {timeZone: "America/Bogota"}), customersData[i]['CEDULA DEL EMPLEADO']]);
      
      };
  
      return {status: 200, message: "Los nuevos valores han sido cambiados exitosamente."};

    }else{

      return {status: 400, message: "La empresa asociada no se encuentra dentro de nuestros registros."};
    
    } 
      
  }catch(e){
    console.log(e);
    return {status: 500, message: "Error interno del servidor"};
  }

};

module.exports = {
  createCompanies, getCompanies, getAllCompaniesForUser, updateCompanies, getCompanyWithSalaries,
  activateCompanies, updateCompanySalary, modifymaximumAmountByCompany,getCyclesByCompanyId
};