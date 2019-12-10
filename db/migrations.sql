/* Roles */
INSERT INTO Role (priority, roleName, createdDate, registeredBy, registeredDate) values (100, 'Administrator', NOW(), 1, NOW());
INSERT INTO Role (priority, roleName, createdDate, registeredBy, registeredDate) values (80, 'Manager', NOW(), 1, NOW());
INSERT INTO Role (priority, roleName, createdDate, registeredBy, registeredDate) values (50, 'Company', NOW(), 1, NOW());
INSERT INTO Role (priority, roleName, createdDate, registeredBy, registeredDate) values (10, 'User', NOW(), 1, NOW());

/* Main Administrator */
INSERT INTO Administrator (lastName, identificationId, adminType) values ("Orjuela", "1032488727", "superAdmin");
INSERT INTO User (email, name, status, isConfirmed, createdDate, registeredBy, registeredDate, Role_idRole, Client_idClient, Company_idCompany, Administrator_idAdministrator) values ( "ccorjuelavela@gmail.com", "Cristian", false, false, NOW(), 1, NOW(), 1, null, null, 1);
/* Main Administrator */
INSERT INTO Administrator (lastName, identificationId, adminType) values ("Sarmiento", "1011222333", "admin");
INSERT INTO User (email, name, status, isConfirmed, createdDate, registeredBy, registeredDate, Role_idRole, Client_idClient, Company_idCompany, Administrator_idAdministrator) values ( "desarrollador@avanzo.co", "Laura", false, false, NOW(), 1, NOW(), 2, null, null, 2);

/* Request */
INSERT INTO RequestState (name, createdDate, registeredBy, registeredDate) values ("Solicitada", NOW(), 1, NOW());
INSERT INTO RequestState (name, createdDate, registeredBy, registeredDate) values ("Evaluada", NOW(), 1, NOW());
INSERT INTO RequestState (name, createdDate, registeredBy, registeredDate) values ("Aprobada RR.HH.", NOW(), 1, NOW());
INSERT INTO RequestState (name, createdDate, registeredBy, registeredDate) values ("Aprobada Admon.", NOW(), 1, NOW());
INSERT INTO RequestState (name, createdDate, registeredBy, registeredDate) values ("Desembolsada", NOW(), 1, NOW());
INSERT INTO RequestState (name, createdDate, registeredBy, registeredDate) values ("Rechazada", NOW(), 1, NOW());
INSERT INTO RequestState (name, createdDate, registeredBy, registeredDate) values ("Finalizada", NOW(), 1, NOW());
INSERT INTO RequestState (name, createdDate, registeredBy, registeredDate) values ("Devolución bancaria", NOW(), 1, NOW());

/* Interest */
INSERT INTO InterestRequest (interestValue, registeredBy, registeredDate) values ('0.04', 1, NOW());

/* Management Payment */
INSERT INTO ManagementPayment (managementpaymentValue, registeredBy, registeredDate) values ('0.03', 1, NOW());

/* Documents Types */
INSERT INTO DocumentTypes (typeName) values ('Cédula'), ('Pasaporte');

/* Bank */
INSERT INTO Bank (bankName) values ("Banco Caja Social");
INSERT INTO Bank (bankName) values ("Banco Davivienda");
INSERT INTO Bank (bankName) values ("Banco de Bogotá");
INSERT INTO Bank (bankName) values ("Banco AV Villas");
INSERT INTO Bank (bankName) values ("Banco Popular");

/* Bank Account Type */
INSERT INTO AccountTypes (accountTypeName) values ("Cuenta Corriente");
INSERT INTO AccountTypes (accountTypeName) values ("Cuenta de ahorros");

/* Wallets */
INSERT INTO Wallet (walletName) values ("Nequi");
INSERT INTO Wallet (walletName) values ("DaviPlata");
INSERT INTO Wallet (walletName) values ("RappiPay");
