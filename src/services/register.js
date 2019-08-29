//Requires
const pool = require('../config/database.js');
const helpers = require('../lib/helpers');

const registerCustomer = async (client, user, auth) => {
    //NewObject
    const newClient = client;
    const newUser = user;
    newClient.registeredDate = new Date();
    newClient.Company_idCompany = 1;
    try{
        clientQuery = await pool.query('INSERT INTO client SET ?', [newClient]);
        console.log(clientQuery);
        //Insert in user
        newUser.registeredBy = 1;
        newUser.registeredDate = new Date();
        newUser.createdDate = new Date();
        newUser.Role_idRole = 3;
        newUser.status = true;
        newUser.Client_idClient = clientQuery.insertId;  
        const result2 = await pool.query('INSERT INTO user SET ?', [user]);
        const newAuth = { User_idUser: result2.insertId, registeredBy: 1, registeredDate: new Date(),
                            createdDate: new Date()};
        //Change saved password
        newAuth.password = await helpers.encryptPassword(auth.password);
        const result3 = await pool.query('INSERT INTO auth SET ?', [newAuth]);
        console.log(result3);
        return {status: 200, message: "Ha sido registrado satisfactoriamente. Puede entrar a la platforma iniciando sesión."};
    }catch(e){
        return {status: 500, message: "Error interno de l servidor."};
    }    
};
 
module.exports = {
    registerCustomer
}