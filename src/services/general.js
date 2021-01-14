//Requires
const pool = require('../config/database.js');
const helpers = require('../lib/helpers');
const jwt = require('jsonwebtoken');
const { my_secret_key, front_URL, front_URL_test } = require('../config/global');
const sgMail = require('@sendgrid/mail');

//Constants
const expirationTime = 5;

//Services
const login = async (email, password) => {

    try {
        const consultEmail = await pool.query('SELECT * FROM User U where U.email = ?', [email]);
        //console.log("CE", consultEmail);
        if (consultEmail[0]) {
            const userRow = await pool.query('SELECT * FROM User U JOIN Auth A ON (A.User_idUser = U.idUser) where U.email = ?', [email]);
            //console.log("userRow", userRow[0]);
            const userQuery = userRow[0];


            if (userRow.length > 0) {
                //console.log("UC", parseInt(userRow[0].isConfirmed, 10) === 1);
                if (parseInt(userRow[0].isConfirmed, 10) === 1) {
                    const userMenu = await pool.query('SELECT   S.* FROM User U  JOIN Auth A ON (A.User_idUser = U.idUser)  JOIN Role R ON U.Role_idRole = R.IdRole   JOIN avanzo.RolHasServices RHS ON R.IdRole = RHS.idRol   JOIN avanzo.Services S ON S.idService = RHS.IdService   where U.email = ?', [email]);
                    const jsonMenu = [];

                    for (let index = 0; index < userMenu.length; index++) {
                        const element = userMenu[index];
                        var data = {
                            serviceIcon: element.serviceIcon,
                            className: element.serviceClassName,
                            serviceRoute: element.serviceRoute,
                            serviceName: element.serviceName
                        };
                        jsonMenu.push(data);
                    }
                    const userAuth = { expiresOn: userQuery.expiresOn, registeredDate: new Date().toLocaleString("es-CO", { timeZone: "America/Bogota" }).replace(/\P.+/, '') };
                    const userData = { idUser: userQuery.idUser, name: userQuery.name, email: userQuery.email, roleId: userQuery.Role_idRole };
                    const validPassword = await helpers.matchPassword(password, userQuery.password);
                    //console.log("VP",validPassword);
                    if (validPassword) {
                        const jwtoken = jwt.sign({ userRow }, my_secret_key, { expiresIn: '8h' });
                        const new_date = new Date();
                        new_date.setHours(new_date.getHours() + expirationTime);
                        userAuth.expiresOn = new_date.toISOString().
                            replace(/T/, ' ').
                            replace(/\..+/, '');
                        const result2 = await pool.query('UPDATE Auth set ? WHERE User_idUser = ?', [userAuth, userRow[0].idUser]);
                        return {
                            status: 200, message: "Ha ingresado satisfactoriamente.",
                            data: { access_token: jwtoken, expires_on: userAuth.expiresOn, user_info: userData, menu: jsonMenu },

                        };
                    } else {
                        return { status: 400, message: "La contraseña es incorrecta." };
                    }
                } else {
                    return { status: 401, message: "Por favor confirme su cuenta antes de iniciar sesión." }
                }
            } else {
                return { status: 400, message: "Tu usuario no se encuentra en nuestro sistema o está inhabilitado, por favor realiza el registro en la plataforma o contáctate con nosotros." };
            }
        } else {
            return { status: 400, message: "El email no existe en nuestros registros." };
        }
    } catch (e) {

        console.log("E", e);

        throw e;
    }
};

const confirmAccounts = async (body, userId) => {

    const result = { status: null, data: {}, message: "" };

    try {

        const checkConfirmed = await pool.query('SELECT isConfirmed FROM User where idUser = ?', [userId]);

        if (parseInt(checkConfirmed[0].isConfirmed, 10) === 0) {

            //const confirmationAccount = await pool.query('SELECT * FROM documenttypes');
            const user = jwt.verify(body.params.token, my_secret_key);
            //Update confirmation
            const update = await pool.query('UPDATE User SET isConfirmed = ? WHERE idUser = ?', [true, user.userRow[0].idUser]);
            //console.log("UP", update);

            return { status: 200 };
        } else {
            return { status: 100, message: "Tu cuenta ya ha sido confirmada. Por favor, inicia sesión." }
        }
    } catch (e) {
        console.log(e);
        return { status: 500, message: "Error interno del servidor." };
        throw e;
    }
};

const getDocumentsTypes = async () => {
    const result = { status: null, data: {}, message: "" };
    try {
        const documentRow = await pool.query('SELECT * FROM DocumentTypes');
        if (documentRow) {
            return { status: 200, message: "", data: documentRow };
        } else {
            return { status: 500, message: "Error interno del servidor." };
        }
    } catch (e) {
        return { status: 500, message: "Error interno del servidor." };
        throw e;
    }
};

const resetPassword = async (email) => {
    const result = { status: null, data: {}, message: "" };
    try {
        const userRow = await pool.query('SELECT C.idClient, C.identificationId, CO.socialReason, U.idUser, U.name FROM Client C JOIN User U JOIN Company CO ON (C.idClient = U.Client_idClient AND CO.idCompany = C.Company_idCompany ) where U.email = ?', [email]);
        if (userRow.length > 0) {

            const jwtoken = await jwt.sign({ userRow }, my_secret_key, { expiresIn: '30m' });

            //Mailer
            sgMail.setApiKey('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');

            let output = `<div>
                    <div class="header-confirmation">
                    <h2 class="confirmation-title">
                        Avanzo
                    </h2>
                    <h4 class="confirmation-subtitle">
                        Créditos al instante
                    </h4>
                    </div>
                
                    <hr/>
                    
                    <div class="greet-confirmation">
                        <h3 class="greet-title">
                        Hola, apreciado/a ${userRow[0].name}.
                        </h3>
                        <br/>

                    </div>
                
                    <div class="body-confirmation">
                        <h3 class="body-title">
                            Para continuar en el proceso, por favor realiza el cambio de tu contraseña.
                        </h3>
                        <h3>
                            Para cambiarla, haz clic <a href="${front_URL + `/confirm_password/${jwtoken}`}">aquí</a>.
                        </h3>
                    </div>
                
                    <div class="footer-confirmation">
                        <h3 class="footer-title">
                        Gracias por confiar en nosotros.
                        </h3>
                    </div>
                                        
                </div>`;

            let info = {
                from: 'operaciones@avanzo.co', // sender address
                to: email, // list of receivers
                subject: 'Avanzo (Créditos al instante) - Restablecer contraseña', // Subject line
                text: 'Hola', // plain text body
                html: output // html body
            };

            await sgMail.send(info);

            return { status: 200, message: "Se ha envíado un correo electrónico a tu email para cambiar la contraseña" };
        } else {
            return { status: 400, message: "El email no existe en nuestros registros." };
        }
    } catch (e) {
        console.log(e);
        return { status: 500, message: "Error interno del servidor." };
        throw e;
    }
};

const confirmedPassword = async (userId, password, confirmPassword) => {
    const result = { status: null, data: {}, message: "" };
    try {
        if (password === confirmPassword) {
            const userRow = await pool.query('SELECT * FROM User where idUser = ?', [userId]);
            if (userRow.length > 0) {
                const newPassword = await helpers.encryptPassword(password);
                const modifiedPassword = await pool.query('UPDATE Auth set password = ? WHERE User_idUser = ?', [newPassword, userRow[0].idUser]);
                return { status: 200, message: "Se ha actualizado exitosamente la contraseña" };
            } else {
                return { status: 500, message: "Error interno del servidor." };
            }
        } else {
            return { status: 400, message: "Las contraseñas no coinciden." };
        }
    } catch (e) {
        console.log(e);
        return { status: 500, message: "Error interno del servidor." };
        throw e;
    }
};

module.exports = {
    login, confirmAccounts, getDocumentsTypes, resetPassword, confirmedPassword
}