/* Roles */
INSERT INTO role (priority, roleName, createdDate, registeredBy, registeredDate) values (100, 'Administrator', NOW(), 1, NOW());
INSERT INTO role (priority, roleName, createdDate, registeredBy, registeredDate) values (80, 'Manager', NOW(), 1, NOW());
INSERT INTO role (priority, roleName, createdDate, registeredBy, registeredDate) values (50, 'Company', NOW(), 1, NOW());
INSERT INTO role (priority, roleName, createdDate, registeredBy, registeredDate) values (10, 'User', NOW(), 1, NOW());

/* Main Administrator */
INSERT INTO administrator (lastName, identificationId, adminType) values ("Orjuela", "1032488727", "superAdmin");
INSERT INTO user (email, name, status, isConfirmed, createdDate, registeredBy, registeredDate, Role_idRole, Client_idClient, Company_idCompany, Administrator_idAdministrator) values ( "ccorjuelavela@gmail.com", "Cristian", false, false, NOW(), 1, NOW(), 4, null, null, 1);

/* Request */
INSERT INTO requeststate (name, createdDate, registeredBy, registeredDate) values ("Solicitada", NOW(), 1, NOW());
INSERT INTO requeststate (name, createdDate, registeredBy, registeredDate) values ("En evaluación", NOW(), 1, NOW());
INSERT INTO requeststate (name, createdDate, registeredBy, registeredDate) values ("Aprobando RR.HH.", NOW(), 1, NOW());
INSERT INTO requeststate (name, createdDate, registeredBy, registeredDate) values ("Aprobando Admon.", NOW(), 1, NOW());
INSERT INTO requeststate (name, createdDate, registeredBy, registeredDate) values ("Desembolsada", NOW(), 1, NOW());
INSERT INTO requeststate (name, createdDate, registeredBy, registeredDate) values ("Rechazada", NOW(), 1, NOW());

/* Interest */
INSERT INTO interestrequest (interestValue, registeredBy, registeredDate) values ('0.04', 1, NOW());

/* Management Payment */
INSERT INTO managementpayment (managementpaymentValue, registeredBy, registeredDate) values ('0.03', 1, NOW());

/* Documents Types */
INSERT INTO documenttypes (typeName) values ('Cédula'), ('Pasaporte');

/* Bank */
INSERT INTO bank (bankName) values ("Banco Caja Social");
INSERT INTO bank (bankName) values ("Banco Davivienda");
INSERT INTO bank (bankName) values ("Banco de Bogotá");
INSERT INTO bank (bankName) values ("Banco AV Villas");
INSERT INTO bank (bankName) values ("Banco Popular");

/* Bank Account Type */
INSERT INTO accounttypes (accountTypeName) values ("Cuenta Corriente");
INSERT INTO accounttypes (accountTypeName) values ("Cuenta de ahorros");

/* Wallets */
INSERT INTO wallet (walletName) values ("Nequi");
INSERT INTO wallet (walletName) values ("DaviPlata");
INSERT INTO wallet (walletName) values ("RappiPay");
