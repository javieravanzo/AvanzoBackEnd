/* Roles */
INSERT INTO Role (priority, roleName, createdDate, registeredBy, registeredDate) values (100, 'Administrator', NOW(), 1, NOW());
INSERT INTO Role (priority, roleName, createdDate, registeredBy, registeredDate) values (80, 'Manager', NOW(), 1, NOW());
INSERT INTO Role (priority, roleName, createdDate, registeredBy, registeredDate) values (50, 'Company', NOW(), 1, NOW());
INSERT INTO Role (priority, roleName, createdDate, registeredBy, registeredDate) values (10, 'User', NOW(), 1, NOW());

/* Main Administrator */
INSERT INTO Administrator (identificationId, adminType) values ("1032488727", "superAdmin");
INSERT INTO User (email, name, lastName, status, isConfirmed, createdDate, registeredBy, registeredDate, Role_idRole, Client_idClient, Company_idCompany, Administrator_idAdministrator) values ( "ccorjuelavela@gmail.com", "Cristian", "Orjuela", false, false, NOW(), 1, NOW(), 1, null, null, 1);

INSERT INTO Client (identificationId, documentType, phoneNumber, Company_idCompany, registeredBy, registeredDate, platformState, createdDate, ClientDocuments_idClientDocuments, CompanySalaries_idCompanySalaries) values (1564576532, 1, "3156453722", "11", "1", "2020-04-08 13:07:42.491", "true", "2020-04-08 13:07:42.491", "6", "13");

/*SELECT * FROM Client;
SELECT * FROM User;
SELECT * FROM NewClient;*/


/* Main Administrator */
INSERT INTO Administrator (identificationId, adminType) values ("1011222333", "admin");
INSERT INTO User (email, name, lastName, status, isConfirmed, createdDate, registeredBy, registeredDate, Role_idRole, Client_idClient, Company_idCompany, Administrator_idAdministrator) values ( "desarrollador@avanzo.co", "Laura", "Sarmiento", false, false, NOW(), 1, NOW(), 2, null, null, 2);

/* Request */
INSERT INTO RequestState (name, createdDate, registeredBy, registeredDate) values ("Solicitada", NOW(), 1, NOW());
INSERT INTO RequestState (name, createdDate, registeredBy, registeredDate) values ("Evaluada", NOW(), 1, NOW());
INSERT INTO RequestState (name, createdDate, registeredBy, registeredDate) values ("Aprobada RR.HH.", NOW(), 1, NOW());
INSERT INTO RequestState (name, createdDate, registeredBy, registeredDate) values ("Aprobada Admon.", NOW(), 1, NOW());
INSERT INTO RequestState (name, createdDate, registeredBy, registeredDate) values ("Desembolsada", NOW(), 1, NOW());
INSERT INTO RequestState (name, createdDate, registeredBy, registeredDate) values ("Rechazada", NOW(), 1, NOW());
INSERT INTO RequestState (name, createdDate, registeredBy, registeredDate) values ("Finalizada", NOW(), 1, NOW());
INSERT INTO RequestState (name, createdDate, registeredBy, registeredDate) values ("Devolución bancaria", NOW(), 1, NOW());

INSERT INTO Indicators (indicatorName, indicatorValue, indicatorRate, registeredBy, registeredDate) values ("Interest", 0, 0.069, NOW(), NOW());

INSERT INTO Indicators (indicatorName, indicatorValue, indicatorRate, registeredBy, registeredDate) values ("Management", 12000, 0, 1, NOW());

INSERT INTO Indicators (indicatorName, indicatorValue, indicatorRate, registeredBy, registeredDate) values ("IVA", 0, 0.19, 1, NOW());

/* Interest 
INSERT INTO InterestRequest (interestValue, registeredBy, registeredDate) values ('0.04', 1, NOW());

INSERT INTO Indicators (indicatorValue, indicatorRate, registeredBy, registeredDate) values (

/* Management Payment 
INSERT INTO ManagementPayment (managementpaymentValue, registeredBy, registeredDate) values ('0.03', 1, NOW());*/

/* Documents Types 
INSERT INTO DocumentTypes (typeName) values ('Cédula'), ('Pasaporte'); */

/* Bank */
INSERT INTO Bank (bankName, bankCode, isForOutlay, isWallet) values ("Banco Caja Social", "A", false, false);
INSERT INTO Bank (bankName, bankCode, isForOutlay, isWallet) values ("Banco Davivienda", "B", false, false);
INSERT INTO Bank (bankName, bankCode, isForOutlay, isWallet) values ("Banco de Bogotá", "C", false, false);
INSERT INTO Bank (bankName, bankCode, isForOutlay, isWallet) values ("Banco AV Villas", "D", false, false);
INSERT INTO Bank (bankName, bankCode, isForOutlay, isWallet) values ("Banco Popular", "E", false, false);

INSERT INTO Bank (bankName, bankCode, isForOutlay, isWallet) values ("Nequi", "F", false, true);
INSERT INTO Bank (bankName, bankCode, isForOutlay, isWallet) values ("Daviplata", "G", false, true);
INSERT INTO Bank (bankName, bankCode, isForOutlay, isWallet) values ("RappiPay", "H", false, true);

/* Bank Account Type 
INSERT INTO AccountTypes (accountTypeName) values ("Cuenta Corriente");
INSERT INTO AccountTypes (accountTypeName) values ("Cuenta de ahorros"); */

/* Wallets
INSERT INTO Wallet (walletName) values ("Nequi");
INSERT INTO Wallet (walletName) values ("DaviPlata");
INSERT INTO Wallet (walletName) values ("RappiPay");  */
