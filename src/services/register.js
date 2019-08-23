//Requires
const pool = require('../config/database.js');
const helpers = require('../lib/helpers');

const registerCustomer = async (user) => {
    const { name, password, email, identificationId, lastName, documentType, phoneNumber, birthDate, expeditionDate} = user;
    //NewObject
    const newClient = { identificationId, lastName, documentType, phoneNumber, birthDate, expeditionDate, Company_idCompany: 2};
    let result1 = {};
    try{
        result1 = await pool.query('INSERT INTO client SET ?', [newClient]);
    }catch(e){
        console.log("Error", e);
    }
    const newUser = { email, name, status: true, Role_idRole: 3, Client_idClient: result1.insertId};
    if(result1){
        //Insert in user      
        const result2 = await pool.query('INSERT INTO user SET ?', [newUser]);
        newUser.id = result2.insertId;
        const newAuth = { password, token: "asd987a9sd698as7d", User_idUser: result2.insertId};
        console.log("NewPas", newAuth.password);
        //Change saved password
        newAuth.password = await helpers.encryptPassword(password, password);
        console.log(newAuth.password);
        const result3 = await pool.query('INSERT INTO auth SET ?', [newAuth]);
        return {status: 200, message: "Ha sido registrado satisfactoriamente"};
    }
}
 
module.exports = {
    registerCustomer
}