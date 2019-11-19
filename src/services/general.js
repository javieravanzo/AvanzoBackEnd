//Requires
const pool = require('../config/database.js');
const helpers = require('../lib/helpers');
const jwt = require('jsonwebtoken');
const {my_secret_key} = require('../config/global');

//Constants
const expirationTime = 5;

//Services
const login = async (email, password) => {

    try {
        const consultEmail = await pool.query('SELECT * FROM User U where U.email = ?', [email]);
        console.log("CE", consultEmail);
        if (consultEmail[0]){
            const userRow = await pool.query('SELECT * FROM User U JOIN Auth A ON (A.User_idUser = U.idUser) where U.email = ?', [email]);
            //console.log("userRow", userRow[0]);
            const userQuery = userRow[0];  
            if(userRow.length > 0){
                //console.log("UC", parseInt(userRow[0].isConfirmed, 10) === 1);
                if(parseInt(userRow[0].isConfirmed, 10) === 1){
                    const userAuth = { idAuth: userQuery.idAuth, expiresOn: userQuery.expiresOn, registeredDate: new Date() };
                    const userData = { idUser: userQuery.idUser, name: userQuery.name, email: userQuery.email, roleId: userQuery.Role_idRole };      
                    const validPassword = await helpers.matchPassword(password, userQuery.password);
                    //console.log("VP",validPassword);
                    if (validPassword){
                        const jwtoken = jwt.sign({userRow}, my_secret_key, { expiresIn: '8h' });
                        const new_date = new Date();
                        new_date.setHours(new_date.getHours()+expirationTime);
                        userAuth.expiresOn = new_date;     
                        const result2 = await pool.query('UPDATE Auth set ? WHERE User_idUser = ?', [userAuth, userRow[0].idUser]);
                        return { status: 200, message: "Ha ingresado satisfactoriamente.",
                                data: { access_token: jwtoken, expires_on: userAuth.expiresOn, user_info: userData}
                            };
                    }else{
                        return {status: 400, message: "La contraseña es incorrecta."};
                    }
                }else{
                    return {status: 401, message: "Por favor confirme su cuenta antes de iniciar sesión."}
                }
            }else{
                return {status: 400, message: "Tu usuario no se encuentra en nuestro sistema, por favor realiza el registro en la plataforma."};
            }
        }else{
            return {status: 400, message: "El email no existe en nuestros registros."};
        }
  } catch(e) {
    throw e;
  }
};

const confirmAccounts  = async (body, userId) => {
    
    const result = {status: null, data: {}, message: ""};
    try {
        //const confirmationAccount = await pool.query('SELECT * FROM documenttypes');
        const user = jwt.verify(body.params.token, my_secret_key);

        //console.log("US", user.userRow[0]);

        //Update confirmation
        const update = await pool.query('UPDATE User SET isConfirmed = ? WHERE idUser = ?', [true, user.userRow[0].idUser]);
        //console.log("UP", update);

        return {status: 200};
    } catch(e) {
        return {status: 500, message: "Error interno del servidor."};
        throw e;
    }
};

const getDocumentsTypes = async () => {
    const result = {status: null, data: {}, message: ""};
    try {
        const documentRow = await pool.query('SELECT * FROM DocumentTypes');
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
        const userRow = await pool.query('SELECT * FROM User where email = ?', [email]);
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
        const userRow = await pool.query('SELECT * FROM User where email = ?', [email]);
        if(userRow.length > 0){
            const newPassword = await helpers.encryptPassword(password);
            const modifiedPassword = await pool.query('UPDATE Auth set password = ? WHERE User_idUser = ?', [newPassword, userRow[0].idUser]);
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
    login, confirmAccounts, getDocumentsTypes, resetPassword, confirmedPassword
}