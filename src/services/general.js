//Requires
const pool = require('../config/database.js');
 const helpers = require('../lib/helpers');

const login = async (user) => {
    const {email, password} = user;
    console.log("Pass", password);
    const result = {};
    try {
        const userRow = await pool.query('SELECT * FROM user where email = ?', [email]);
        if(userRow.length > 0){
            const authRow = await pool.query('SELECT * FROM auth where User_idUser = ?', [userRow[0].idUser]);
            if(authRow.length > 0){
                const user = authRow[0];               
                const validPassword = await helpers.matchPassword(password, user.password);
                console.log("DBPassword", user.password);
                console.log("ValidP", validPassword);
                if (validPassword){
                    return {status: 200, message: "Ha ingresado satisfactoriamente"};
                }else{
                    return {status: 200, message: "La contraseña es incorrecta"};
                }
            }else{
                return {status: 200, message: "La contraseña es incorrecta"};
            }
        }else{
            return {status: 400, message: "El email no existe en nuestros registros"};
        }

  } catch(e) {
    throw e;
  }
}
 
module.exports = {
    login
}