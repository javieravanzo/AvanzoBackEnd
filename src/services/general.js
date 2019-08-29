//Requires
const pool = require('../config/database.js');
const helpers = require('../lib/helpers');
const jwt = require('jsonwebtoken');

//Constants
const expirationTime = 5;

//Services
const login = async (email, password) => {

    try {
        const userRow = await pool.query('SELECT * FROM auth AUTH JOIN user USER ON AUTH.User_idUser = USER.idUser where user.email = ?', [email]);
        const userQuery = userRow[0];  
        if(userRow.length > 0){
            const userAuth = { idAuth: userQuery.idAuth, expiresOn: userQuery.expiresOn, registeredDate: new Date() };
            const userData = { idUser: userQuery.idUser, name: userQuery.name, email: userQuery.email, roleId: userQuery.Role_idRole };      
            const validPassword = await helpers.matchPassword(password, userQuery.password);
            if (validPassword){
                const jwtoken = jwt.sign({userRow}, 'my_secret_key', { expiresIn: '8h' });
                const new_date = new Date();
                new_date.setHours(new_date.getHours()+expirationTime);
                userAuth.expiresOn = new_date;     
                const result2 = await pool.query('UPDATE auth set ? WHERE User_idUser = ?', [userAuth, userRow[0].idUser]);
                return { status: 200, message: "Ha ingresado satisfactoriamente.",
                         data: { access_token: jwtoken, expires_on: userAuth.expiresOn, user_info: userData}
                       };
            }else{
                return {status: 400, message: "La contraseña es incorrecta."};
            }
        }else{
            return {status: 400, message: "El email no existe en nuestros registros."};
        }
  } catch(e) {
    throw e;
  }
};

const getDocumentsTypes = async () => {
    const result = {status: null, data: {}, message: ""};
    try {
        const documentRow = await pool.query('SELECT * FROM documenttypes');
        if(documentRow){
            return {status: 200, message: "", data: documentRow};
        }else{
            return {status: 500, message: "Error interno del servidor."};
        }
    } catch(e) {
        return {status: 500, message: "Error interno del servidor."};
        throw e;
    }
};

const resetPassword = async (email) => {
    const result = {status: null, data: {}, message: ""};
    try {
        const userRow = await pool.query('SELECT * FROM user where email = ?', [email]);
        if(userRow.length > 0){
            return {status: 200, message: "Se ha envíado un correo electrónico a tu email para cambiar la contraseña"};
        }else{
            return {status: 400, message: "El email no existe en nuestros registros."};
        }
    } catch(e) {
        return {status: 500, message: "Error interno del servidor."};
        throw e;
    }
};

const confirmedPassword = async (email, password) => {
    const result = {status: null, data: {}, message: ""};
    try {
        const userRow = await pool.query('SELECT * FROM user where email = ?', [email]);
        if(userRow.length > 0){
            const newPassword = await helpers.encryptPassword(password);
            const modifiedPassword = await pool.query('UPDATE auth set password = ? WHERE User_idUser = ?', [newPassword, userRow[0].idUser]);
            return {status: 200, message: "Se ha actualizado exitosamente la contraseña"};
        }else{
            return {status: 500, message: "Error interno del servidor."};
        }
    } catch(e) {
        return {status: 500, message: "Error interno del servidor."};
        throw e;
    }
};
 
module.exports = {
    login, getDocumentsTypes, resetPassword, confirmedPassword
}