//Requires
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const Excel = require('xlsx');
// const pool = require('../config/database.js');
// const select = require('../config/database.js');
const dbSequelize = require('../config/database_sequelize.js');
sequelize = dbSequelize.sequelize,
    Sequelize = dbSequelize.Sequelize;
// var DataTypes = require('sequelize/lib/data-types');

// const User = require('../../models/user')(sequelize, DataTypes);;
// const NewClient = require('../../models/newclient')(sequelize, DataTypes);;
// const ClientDocuments = require('../../models/clientdocuments')(sequelize, DataTypes);;
// const Client = require('../../models/client')(sequelize, DataTypes);;
// const Company = require('../../models/company')(sequelize, DataTypes);;
// const Account = require('../../models/account')(sequelize, DataTypes);;
// const Auth = require('../../models/auth')(sequelize, DataTypes);;

//Imports
const { my_secret_key, base_URL, front_URL, base_URL_test } = require('../config/global');
const { ENVIRONMENT, SMS_CODES, ATTACHMENT_TYPES, PATH_FILE_CONTRACT, NAME_FILE_CONTRACT, PENDING_APPROVAL,
    ACCOUNT_CONFIRMATION, ACCOUNT_REJECTED, PRE_CLIENT_STATES, ROLES } = require('../utils/constants.js');
const { getInitialsData, getRequestsData, getAllCustomers, createCustomer, createMultipleCustomers,
    getAllCustomerWithCompanies, getTransactionsByUsersId, getCustomersByAdmin,
    getCustomerToApprove, getCustomerCountToApprove, approveCustomers, changeCustomersStatus,
    updateCustomers, makePayments, getDatesListToCustomer, deleteUser,
    getCustomerAccountDetail, updateStateCustomer, getNewClientByIdNewClient,
    insertClientDocuments, insertClient, insertAccount, getClientByClientId, updateStateNewClient } = require('../services/customer');
const { getCompanyById } = require('../services/company');
const { insertUser, insertAuth } = require('../services/user');
const { sendEmail, sendSMS } = require('../utils/utils.js');
const todayDate = new Date().toLocaleString("es-CO", { timeZone: "America/Bogota" }).replace(/\P.+/, '').replace(/\A.+/, '');
const expirationTime = 5;


//Get the company with token
function getCompanyId(req) {

    //Get the clientId
    const bearerHeader = req.headers['authorization'];
    //Get the real token
    const bearer = bearerHeader.split(" ")[1];
    //Set the token
    const decoded = jwt.decode(bearer);
    return (decoded.userRow[0].Company_idCompany);

};

//Get the user with token
function getUserId(req) {

    //Get the clientId
    const bearerHeader = req.headers['authorization'];
    //Get the real token
    const bearer = bearerHeader.split(" ")[1];
    //Set the token
    const decoded = jwt.decode(bearer);

    return (decoded.userRow[0].idUser);

};

//Get the admin with token
function getAdminId(req) {

    //Get the clientId
    const bearerHeader = req.headers['authorization'];
    //Get the real token
    const bearer = bearerHeader.split(" ")[1];
    //Set the token
    const decoded = jwt.decode(bearer);

    return (decoded.userRow[0].Administrator_idAdministrator);

};

//Get the client with token
function getClientId(req) {

    //Get the clientId
    const bearerHeader = req.headers['authorization'];
    //Get the real token
    const bearer = bearerHeader.split(" ")[1];
    //Set the token
    const decoded = jwt.decode(bearer);

    return (decoded.userRow[0].Client_idClient);

};

//Controllers
const getInitialData = async (req, res, next) => {

    const customerid = getUserId(req);

    try {
        const result = await getInitialsData(customerid);
        if (result.status === 200) {
            res.status(result.status).json(result.data);
        } else {
            res.status(result.status).json(result.message);
        }
        next();
    } catch (e) {
        res.status(500).json("No es posible obtener la información en este momento.");
    };
};

const getRequestData = async (req, res, next) => {

    const customerid = getUserId(req);

    try {
        const result = await getRequestsData(customerid);
        if (result.status === 200) {
            res.status(result.status).json(result.data);
        } else {
            res.status(result.status).json(result.message);
        }
        next();
    } catch (e) {
        res.status(500).json("No es posible obtener la información en este momento.");
    };
};

const getAllCustomer = async (req, res, next) => {

    //Validate input
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        res.status(422).json({ message: errors.errors[0].msg });
        return;
    }

    const companyId = getCompanyId(req);

    try {
        const result = await getAllCustomers(companyId);
        if (result.status === 200) {
            res.status(result.status).json(result.data);
        } else {
            res.status(result.status).json(result.message);
        }
        next();
    } catch (e) {
        res.status(500).json("No es posible obtener la información en este momento.");
    };
};

const getCustomers = async (req, res, next) => {

    //Validate input
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        res.status(422).json({ message: errors.errors[0].msg });
        return;
    }

    try {
        const result = await getCustomersByAdmin();
        if (result.status === 200) {
            res.status(result.status).json(result.data);
        } else {
            res.status(result.status).json(result.message);
        }
        next();
    } catch (e) {
        res.status(500).json("No es posible obtener la información en este momento.");
    };
};

const createNewCustomer = async (req, res, next) => {

    //Variables
    const { name, email, idCompany } = req.body;

    //Validate input
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        //res.status(422).json({ message: errors.errors[0].msg });
        res.status(422).json({ message: errors.errors[0].msg });
        return;
    }

    //Logic
    const user = { name, email };
    const adminId = getAdminId(req);

    try {

        const result = await createCustomer(req.body, user, idCompany, adminId);
        res.status(result.status).json({ message: result.message });
    } catch (e) {
        res.status(500).json({ message: "No es posible realizar el registro en este momento." });
    };

};

const updateCustomer = async (req, res, next) => {

    //Variables
    const { name, email } = req.body;

    //Validate input
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        //res.status(422).json({ message: errors.errors[0].msg });
        res.status(422).json({ message: errors.errors[0].msg });
        return;
    }

    //Logic
    const user = { name, email };
    const adminId = getUserId(req);

    try {
        const result = await updateCustomers(req.body, user, adminId);
        res.status(result.status).json({ message: result.message });
    } catch (e) {
        res.status(500).json({ message: "No es posible realizar el registro en este momento." });
    };

};

const createMultipleCustomer = async (req, res, next) => {

    //Get the user id
    const adminId = getUserId(req);

    // Create a workbook, like a file.
    var workbook = Excel.readFile(req.file.path, { cellDates: true });

    // Define the sheet of work.
    var company = workbook.Sheets[workbook.SheetNames[0]];

    // Map the xlsx format to json.
    var data = Excel.utils.sheet_to_json(company);

    try {
        const result = await createMultipleCustomers(data, adminId);
        res.status(result.status).json({ message: result.message });
    } catch (e) {
        res.status(500).json({ message: "No es posible realizar el registro en este momento." });
    };

};

const getAllCustomerWithCompany = async (req, res, next) => {

    //Get the user id
    const adminId = getAdminId(req);

    try {
        const result = await getAllCustomerWithCompanies(adminId);
        if (result) {
            res.status(result.status).json(result.data);
        } else {
            res.status(500).json({ message: "No es posible realizar la consulta de usuarios en este momento." });
        }

    } catch (e) {
        res.status(500).json({ message: "No es posible realizar la consulta de usuarios en este momento." });
    };

};

const getAllCustomerToApprove = async (req, res, next) => {

    //Get the user id
    const adminId = getAdminId(req);

    try {
        const result = await getCustomerToApprove(adminId);
        if (result) {
            res.status(result.status).json(result.data);
        } else {
            res.status(500).json({ message: "No es posible realizar la consulta de usuarios en este momento." });
        }

    } catch (e) {
        res.status(500).json({ message: "No es posible realizar la consulta de usuarios en este momento." });
    };

};

const getCountCustomerToApprove = async (req, res, next) => {

    //Get the user id
    const adminId = getAdminId(req);

    try {
        const result = await getCustomerCountToApprove(adminId);
        if (result) {
            res.status(result.status).json(result.data);
        } else {
            res.status(500).json({ message: "No es posible realizar la consulta de usuarios en este momento." });
        }

    } catch (e) {
        res.status(500).json({ message: "No es posible realizar la consulta de usuarios en este momento." });
    };

};



const getDateListToCustomer = async (req, res, next) => {

    //Get the user id
    const { companyid } = req.headers;

    try {
        const result = await getDatesListToCustomer(companyid);
        if (result) {
            res.status(result.status).json(result.data);
        } else {
            res.status(500).json({ message: "No es posible realizar la consulta de usuarios en este momento." });
        }

    } catch (e) {
        res.status(500).json({ message: "No es posible realizar la consulta de usuarios en este momento." });
    };

};

const getTransactionsByUserId = async (req, res, next) => {

    //Get the user id
    const userId = getUserId(req);

    try {
        const result = await getTransactionsByUsersId(userId);
        if (result) {
            res.status(result.status).json(result.data);
        } else {
            res.status(500).json({ message: "No es posible realizar la consulta de transacciones en este momento." });
        }


    } catch (e) {
        res.status(500).json({ message: "No es posible realizar la consulta de transacciones en este momento." });
    };

};

const approveCustomer = async (req, res, next) => {

    try {

        //Get the user id
        const adminId = getAdminId(req);
        const { clientid, approve, cycleid, rere_id } = req.headers;
        const t=await sequelize.transaction();
        try {
            let newClient = await dbSequelize.newclient.findByPk(clientid);

            if (approve === "true") {
                try {
                    

                    if (newClient !== null) {
                        const filesPath = {
                            documentId: newClient.file1,
                            paymentReport: newClient.file3
                        };
                        //  let newClientDocuments = insertClientDocuments(pool, filesPath).then(newClientDocuments => {
                        const clientDocuments = await dbSequelize.clientdocuments.create(filesPath, { transaction: t });
                        if (clientDocuments !== null) {
                            const clientNew = {
                                identificationId: newClient.identificationId,
                                documentType: newClient.documentType,
                                birthDate: newClient.birthDate,
                                city: newClient.city,
                                phoneNumber: newClient.phoneNumber,
                                Company_idCompany: newClient.Company_idCompany,
                                registeredBy: 1,
                                entryDate: todayDate.split(" ")[0],
                                rejectState: false,
                                isDeleted: false,
                                platformState: true,
                                ClientDocuments_idClientDocuments: clientDocuments.idClientDocuments,
                                CompanySalaries_idCompanySalaries: cycleid,
                            };
                            const client = await dbSequelize.client.create(clientNew, { transaction: t });
                            // let client = insertClient(pool, clientNew).then(client => {
                            if (client !== null) {
                                const newUser = {
                                    name: newClient.name,
                                    lastName: newClient.lastName,
                                    email: newClient.email,
                                    status: true,
                                    registeredBy: 1,
                                    registeredDate: todayDate,
                                    createdAt: todayDate,
                                    Role_idRole: 4,
                                    Client_idClient: client.idClient,
                                    isConfirmed: true,
                                    Company_idCompany: newClient.Company_idCompany
                                };
                                // let user = insertUser(pool, newUser).then(user => {
                                const user = await dbSequelize.user.create(newUser, { transaction: t });

                                if (user !== null) {
                                    //get companybyid
                                    let company = await dbSequelize.company.findByPk(newClient.Company_idCompany);
                                    if (company !== null) {
                                        const newAccount = {
                                            maximumAmount: company.defaultAmount,
                                            accumulatedQuantity: 0,
                                            documentsUploaded: true,
                                            montlyFee: company.maximumSplit,
                                            totalInterest: 0, totalFeeAdministration: 0,
                                            totalOtherCollection: 0, totalRemainder: 0,
                                            approveHumanResources: company.approveHumanResources === 1 ? true : false,
                                            registeredBy: 1,
                                            registeredDate: todayDate,
                                            Client_idClient: client.idClient,
                                            lastAdministrationDate: todayDate
                                        };
                                        const account = await dbSequelize.account.create(newAccount, { transaction: t });
                                        if (account !== null) {
                                            const new_date = new Date();
                                            new_date.setHours(new_date.getHours() + expirationTime);
                                            const newAuth = {
                                                User_idUser: user.idUser,
                                                registeredBy: 1,
                                                registeredDate: todayDate,
                                                createdAt: todayDate,
                                                password: newClient.password,
                                                expiresOn: new_date.toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                                            };
                                            console.log("7", new Date());
                                            const auth = await dbSequelize.auth.create(newAuth, { transaction: t });
                                            if (auth !== null) {

                                                const jwtoken = jwt.sign({ client }, my_secret_key, { expiresIn: '30m' });
                                                const url = base_URL + `/Account/Confirm/${jwtoken}`;
                                                //Mailer
                                                let userData = {
                                                    email: newClient.email,
                                                    name: newClient.name,
                                                    url: front_URL,
                                                    base_URL_test: base_URL + "/confirmation.png",
                                                    footer: base_URL + "/footer.png",
                                                    link: url,
                                                    documentNumber: newClient.identificationId
                                                };
                                                var subject = 'Avanzo (Créditos al instante) - Confirmación de cuenta';
                                                var text = 'Avanzo';
                                                var template = ACCOUNT_CONFIRMATION;
                                                 sendEmail(template, userData, NAME_FILE_CONTRACT, ATTACHMENT_TYPES.PDF, subject, text, true)
                                                //Send SMS 
                                                if (ENVIRONMENT === 'production') {
                                                    const smsCodes = await dbSequelize.smscodes.findOne({
                                                        attributes: ['sms_co_id', 'sms_co_body'],
                                                        where: {
                                                            sms_co_id: SMS_CODES.APPROVED_CLIENT
                                                        }
                                                    });
                                                    sendSMS(newClient.phoneNumber, smsCodes.sms_co_body);
                                                }
                                                let changeStateNewClient = await newClient.update({ status: 1 }, {
                                                    where: {
                                                        idNewClient: clientid
                                                    }
                                                });

                                                if (changeStateNewClient[0] !== 0) {
                                                    await t.commit();
                                                    res.status(200).json({ message: "El usuario ha sido aprobado exitosamente." });
                                                } else {
                                                    res.status(404).json({ message: "Error cambiando estado newClient" });
                                                    throw new Error("Error cambiando estado newClient");
                                                }
                                            } else {
                                                res.status(404).json({ message: "Error registrando Auth" });
                                                throw new Error("Error registrando Auth");
                                            }

                                        } else {
                                            res.status(404).json({ message: "Error registrando Account" });
                                            throw new Error("Error registrando Account");
                                        }


                                    } else {
                                        res.status(404).json({ message: "Error obteniendo company" });
                                        throw new Error("Error obteniendo company");
                                    }

                                } else {
                                    res.status(404).json({ message: "Error registrando User" });
                                    throw new Error("Error registrando User");
                                }

                            } else {
                                res.status(404).json({ message: "Error registrando Client" });
                                throw new Error("Error registrando Client");
                            }

                        } else {
                            res.status(404).json({ message: "Error registrando ClientDocuments" });
                            throw new Error("Error registrando ClientDocuments");
                        }

                    } else {
                        res.status(404).json({ message: "No se encontró NewClient" });
                        throw new Error("No se encontró NewClient");
                    }

                } catch (error) {
                    console.log(error);
                    await t.rollback();
                    console.log("Se ejecuta rollback de la transaccion");

                }

            } else {
                console.log(new Date());
                //Se debe actualizar el estado de newclient a recazado estado 20
                // const clientQuery = await pool.query('UPDATE NewClient SET status = ?,rere_id = ? where idNewClient = ?', [PRE_CLIENT_STATES.REJECTED, rere_id, clientid]);
                let changeStateNewClient = await dbSequelize.newclient.update({ status: PRE_CLIENT_STATES.REJECTED, rere_id: rere_id }, {
                    where: {
                        idNewClient: clientid
                    }
                });

                if (changeStateNewClient[0] !== 0) {
                    console.log("Cliente rechazado");
                    //Mailer
                    let userData = {
                        email: newClient.email,
                        name: newClient.name,
                        url: front_URL,
                        base_URL_test: base_URL + "/confirmation.png",
                        footer: base_URL + "/footer.png",
                        documentNumber: newClient.identificationId
                    };
                    var subject = 'Avanzo (Créditos al instante) - Rechazo de cuenta';
                    var text = 'Avanzo';
                    var template = ACCOUNT_REJECTED;
                    await sendEmail(template, userData, '', '', subject, text, false);
                    //Send SMS 
                    if (ENVIRONMENT === 'production') {


                        const smsCodes = await dbSequelize.smscodes.findOne({
                            attributes: ['sms_co_id', 'sms_co_body'],
                            where: {
                                sms_co_id: SMS_CODES.CLIENT_REJECTED
                            }
                        });
                        sendSMS(newClient.phoneNumber, smsCodes.sms_co_body);
                    }
                    res.status(200).json({ message: "El usuario ha sido rechazado exitosamente." });
                } else {
                    res.status(404).json({ message: "Error cambiando estado newClient" });
                    throw new Error("Error cambiando estado newClient");
                }
            }
        } catch (error) {
            console.log("E-562: ", error);
            res.status(404).json({ message: "No es posible terminar la operación" });
        }
        next();
    } catch (e) {
        console.log(e);
        res.status(500).json("No es posible obtener la información en este momento.");
    };

};

const changeCustomerStatus = async (req, res, next) => {

    try {

        //Get the user id
        const adminId = getAdminId(req);
        const { clientid, status } = req.headers;

        //console.log("CI", clientid, "S", status);
        const result = await changeCustomersStatus(clientid, status);
        if (result.status === 200) {
            res.status(result.status).json(result.message);
        } else {
            res.status(result.status).json(result.message);
        }
        next();
    } catch (e) {
        console.log(e);
        res.status(500).json("No es posible realizar el cambio de estado en este momento.");
    };

};

const deleteUsers = async (req, res, next) => {

    try {

        //Get the user id
        const adminId = getAdminId(req);
        const { clientid } = req.headers;

        //console.log("CI", clientid, "S", status);
        const result = await deleteUser(clientid);
        if (result.status === 200) {
            res.status(result.status).json(result.message);
        } else {
            res.status(result.status).json(result.message);
        }
        next();

    } catch (e) {
        console.log(e);
        res.status(500).json("No es posible eliminar el usuario en este momento.");
    };

};

const makePayment = async (req, res, next) => {

    try {

        //Get the user id
        //const adminId = getAdminId(req);
        const { clientid, quantity } = req.headers;

        //console.log("CI", clientid, "S", quantity);
        const result = await makePayments(clientid, quantity);
        if (result.status === 200) {
            res.status(result.status).json(result.message);
        } else {
            res.status(result.status).json(result.message);
        }
        next();
    } catch (e) {
        console.log(e);
        res.status(500).json("No es posible realizar el pago de la cuenta en este momento.");
    };

};

const getAccountDetail = async (req, res, next) => {

    try {

        //Get the user id
        const clientid = getClientId(req);

        const result = await getCustomerAccountDetail(clientid);
        if (result.status === 200) {
            res.status(result.status).json(result.data);
        } else {
            res.status(result.status).json(result.message);
        }
        next();
    } catch (e) {
        console.log(e);
        res.status(500).json("No es posible realizar traer la información de la cuenta en este momento.");
    };

};

const updateState = async (req, res, next) => {

    try {

        //Get the user id
        const { idClient, clie_state } = req.body;

        //console.log("CI", clientid, "S", status);
        const result = await updateStateCustomer(idClient, clie_state);
        if (result.status === 200) {
            res.status(result.status).json(result.message);
        } else {
            res.status(result.status).json(result.message);
        }
        next();

    } catch (e) {
        console.log(e);
        res.status(500).json("No es posible eliminar el usuario en este momento.");
    };

};
const downloadFile = async (req, res, next) => {

    try {
  
      //utils.downloadFile(req.params.fileName);
    //    console.log(req.params.fileName.split("#")[1]);

      res.download('./files/documents/'+req.params.cc +"/" + req.params.fileName);
      res.status(200)
    } catch (e) {
      //console.log("Error", e);
      res.status(500).json({ message: "El archivo no puede ser generado en este momento." });
    };
  
  };

module.exports = {
    getInitialData, getRequestData, getAllCustomer, createNewCustomer, createMultipleCustomer,
    getAllCustomerWithCompany, getTransactionsByUserId, getCustomers, getAllCustomerToApprove,
    getCountCustomerToApprove, approveCustomer, changeCustomerStatus, updateCustomer, makePayment,
    getDateListToCustomer, deleteUsers, getAccountDetail, updateState,downloadFile
};