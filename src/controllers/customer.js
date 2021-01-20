//Requires
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const Excel = require('xlsx');
const pool = require('../config/database.js');
const select = require('../config/database.js');

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



        if (approve === "true") {

             pool.beginTransaction().then((success,beginTransactionError)=>{
                console.log("1", new Date());
                if(beginTransactionError === null){
                     console.log("No hay errores");
                }
                console.log("success",success)

                let newClient =  getNewClientByIdNewClient(select, clientid).then(newClient => {
    
    
                    if (newClient.data) {
    
                        const filesPath = {
                            documentId: newClient.data.file1,
                            paymentReport: newClient.data.file3
                        };
                        console.log("2", new Date());
    
                        let newClientDocuments = insertClientDocuments(pool, filesPath).then(newClientDocuments => {
                            if (newClientDocuments.data) {
    
                                console.log("newClientDocuments", newClientDocuments.data.insertId);
                                const clientNew = {
                                    identificationId: newClient.data.identificationId,
                                    documentType: newClient.data.documentType,
                                    birthDate: newClient.data.birthDate.toISOString().split("T")[0],
                                    city: newClient.data.city,
                                    phoneNumber: newClient.data.phoneNumber,
                                    Company_idCompany: newClient.data.Company_idCompany,
                                    registeredBy: 1,
                                    entryDate: todayDate.split(" ")[0],
                                    rejectState: false,
                                    isDeleted: false,
                                    platformState: true,
                                    ClientDocuments_idClientDocuments: newClientDocuments.data.insertId,
                                    CompanySalaries_idCompanySalaries: cycleid,
                                };
                                console.log("Cliente", clientNew)
                                console.log("3", new Date());
                                let client = insertClient(pool, clientNew).then(client => {
                                    if (client.data) {
                                        console.log("client", client.data.insertId);
    
                                        const newUser = {
                                            name: newClient.data.name,
                                            lastName: newClient.data.lastName,
                                            email: newClient.data.email,
                                            status: true,
                                            registeredBy: 1,
                                            registeredDate: todayDate,
                                            createdDate: todayDate,
                                            Role_idRole: 4,
                                            Client_idClient: client.data.insertId,
                                            isConfirmed: true,
                                            Company_idCompany: newClient.data.Company_idCompany
                                        };
                                        console.log("4", new Date());
    
                                        let user = insertUser(pool, newUser).then(user => {
                                            if (user.data) {
                                                //get companybyid
                                                console.log("user", user.data.insertId);
    
                                                console.log("5", new Date());
    
                                                let company = getCompanyById(select, newClient.data.Company_idCompany).then(company => {
    
    
    
                                                    if (company.data) {
                                                        const newAccount = {
                                                            maximumAmount: company.data.defaultAmount,
                                                            accumulatedQuantity: 0,
                                                            documentsUploaded: true,
                                                            montlyFee: company.data.maximumSplit,
                                                            totalInterest: 0, totalFeeAdministration: 0,
                                                            totalOtherCollection: 0, totalRemainder: 0,
                                                            approveHumanResources: company.data.approveHumanResources === 1 ? true : false,
                                                            registeredBy: 1,
                                                            registeredDate: todayDate,
                                                            Client_idClient: client.data.insertId,
                                                            lastAdministrationDate: todayDate
                                                        };
                                                        console.log("6", new Date());
                                                        let account = insertAccount(pool, newAccount).then(account => {
    
                                                            if (account.data) {
                                                                console.log("account", account.data.insertId);
    
                                                                const new_date = new Date();
                                                                new_date.setHours(new_date.getHours() + expirationTime);
    
                                                                const newAuth = {
                                                                    User_idUser: user.data.insertId,
                                                                    registeredBy: 1,
                                                                    registeredDate: todayDate,
                                                                    createdDate: todayDate,
                                                                    password: newClient.data.password,
                                                                    expiresOn: new_date.toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                                                                };
                                                                console.log("7", new Date());
                                                                let auth = insertAuth(pool, newAuth).then(auth => {
    
                                                                    if (auth.data) {
                                                                        // get clientbyclienid and
                                                                        console.log("auth", auth.data.insertId);
    
                                                                        console.log("8", new Date());
                                                                        let getClient = getClientByClientId(select, client.data.insertId).then(getClient => {
    
    
                                                                            if (getClient) {
                                                                                console.log("9", new Date());
    
                                                                                const jwtoken = jwt.sign({ getClient }, my_secret_key, { expiresIn: '30m' });
                                                                                const url = base_URL + `/Account/Confirm/${jwtoken}`;
    
                                                                                //Mailer
                                                                                let userData = {
                                                                                    email: newClient.data.email,
                                                                                    name: newClient.data.name,
                                                                                    url: front_URL,
                                                                                    base_URL_test: base_URL + "/confirmation.png",
                                                                                    footer: base_URL + "/footer.png",
                                                                                    link: url,
                                                                                };
                                                                                console.log("10", new Date());
    
                                                                                var subject = 'Avanzo (Créditos al instante) - Confirmación de cuenta';
                                                                                var text = 'Avanzo';
                                                                                var template = ACCOUNT_CONFIRMATION;
                                                                                console.log("11", new Date());
    
                                                                                sendEmail(template, userData, NAME_FILE_CONTRACT, ATTACHMENT_TYPES.PDF, subject, text, PATH_FILE_CONTRACT)
                                                                                console.log("12", new Date());
    
                                                                                //Send SMS 
                                                                                if (ENVIRONMENT === 'production') {
                                                                                    const smsCodesQuery = select.query('SELECT sms_co_id,sms_co_body FROM avanzo.sms_codes WHERE sms_co_id = ? ', [SMS_CODES.APPROVED_CLIENT]);
                                                                                    sendSMS(newClient.data.phoneNumber, smsCodesQuery[0].sms_co_body);
                                                                                }
                                                                                console.log("13", new Date());
    
                                                                                let changeStateNewClient = updateStateNewClient(pool, clientid, 1).then(changeStateNewClient => {
    
                                                                                    if (changeStateNewClient.data) {
                                                                                        console.log("1changeStateNewClient", changeStateNewClient.data.affectedRows);
    
                                                                                        console.log("15", new Date());
    
                                                                                        // pool.query(' COMMIT ');
                                                                                        pool.commit();
                                                                                         pool.end();
                                                                                         select.end();
    
                                                                                        console.log("16", new Date());
                                                                                        console.log("El usuario ha sido aprobado exitosamente.");
                                                                                        res.status(200).json("El usuario ha sido aprobado exitosamente.");
    
                                                                                    } else {
                                                                                        res.status(404).json("Error cambiando estado newClient");
                                                                                        throw new Error("Error cambiando estado newClient");
                                                                                    }
    
                                                                                });
                                                                                console.log("14", new Date());
    
                                                                            } else {
                                                                                res.status(404).json("Error obteniedno Auth");
                                                                                throw new Error("Error obteniedno Auth");
                                                                            }
                                                                        });
    
                                                                    } else {
                                                                        res.status(404).json("Error registrando Auth");
                                                                        throw new Error("Error registrando Auth");
                                                                    }
                                                                });
                                                            } else {
                                                                res.status(404).json("Error registrando Account");
                                                                throw new Error("Error registrando Account");
                                                            }
                                                        });
    
                                                    } else {
                                                        res.status(404).json("Error obteniendo company");
                                                        throw new Error("Error obteniendo company");
                                                    }
                                                });
                                            } else {
                                                res.status(404).json("Error registrando User");
                                                throw new Error("Error registrando User");
                                            }
                                        });
                                    } else {
                                        res.status(404).json("Error registrando Client");
                                        throw new Error("Error registrando Client");
                                    }
                                });
                            } else {
                                res.status(404).json("Error registrando ClientDocuments");
                                throw new Error("Error registrando ClientDocuments");
                            }
                        });
                    } else {
                        res.status(404).json("No se encontró NewClient");
                        throw new Error("No se encontró NewClient");
                    }
                });
             });
         

        }
        next();

    } catch (e) {
        console.log(e);
        //pool.rollback();
         console.log("############################");
          console.log(  pool.rollback());
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

module.exports = {
    getInitialData, getRequestData, getAllCustomer, createNewCustomer, createMultipleCustomer,
    getAllCustomerWithCompany, getTransactionsByUserId, getCustomers, getAllCustomerToApprove,
    getCountCustomerToApprove, approveCustomer, changeCustomerStatus, updateCustomer, makePayment,
    getDateListToCustomer, deleteUsers, getAccountDetail, updateState
};