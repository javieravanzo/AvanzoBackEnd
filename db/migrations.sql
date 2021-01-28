/* Roles */
INSERT INTO Role (priority, roleName, createdAt, registeredBy, registeredDate) values (100, 'Administrator', NOW(), 1, NOW());
INSERT INTO Role (priority, roleName, createdAt, registeredBy, registeredDate) values (80, 'Manager', NOW(), 1, NOW());
INSERT INTO Role (priority, roleName, createdAt, registeredBy, registeredDate) values (50, 'Company', NOW(), 1, NOW());
INSERT INTO Role (priority, roleName, createdAt, registeredBy, registeredDate) values (10, 'User', NOW(), 1, NOW());
INSERT INTO Role (priority, roleName, createdAt, registeredBy, registeredDate) values (60, 'CallCenter', NOW(), 1, NOW());

/* Super Administrator */
INSERT INTO Administrator (identificationId, adminType) values ("1032488727", "superAdmin");
INSERT INTO User (email, name, lastName, status, isConfirmed, createdAt, registeredBy, registeredDate, Role_idRole, Client_idClient, Company_idCompany, Administrator_idAdministrator) values ("ccorjuelavela@gmail.com", "Cristian", "Orjuela", false, false, NOW(), 1, NOW(), 1, null, null, 1);

/* Administrator */
INSERT INTO Administrator (identificationId, adminType) values ("1011222333", "admin");
INSERT INTO User (email, name, lastName, status, isConfirmed, createdAt, registeredBy, registeredDate, Role_idRole, Client_idClient, Company_idCompany, Administrator_idAdministrator) values ( "desarrollador@avanzo.co", "Administrador", "General", false, false, NOW(), 1, NOW(), 2, null, null, 2);

SELECT * FROM Administrator;

/* CallCenter */
INSERT INTO Administrator (identificationId, adminType) values ("1000000000", "callCenter");
INSERT INTO User (email, name, lastName, status, isConfirmed, createdAt, registeredBy, registeredDate, Role_idRole, Client_idClient, Company_idCompany, Administrator_idAdministrator) values ("gambetalatower@gmail.com", "Prueba", "CallCenter", true, false, NOW(), 1, NOW(), 5, null, null, 3);

/* Request */
INSERT INTO RequestState (name, createdAt, registeredBy, registeredDate) values ("Solicitada", NOW(), 1, NOW());
INSERT INTO RequestState (name, createdAt, registeredBy, registeredDate) values ("Aprobada Recursos Humanos", NOW(), 1, NOW());
INSERT INTO RequestState (name, createdAt, registeredBy, registeredDate) values ("Aprobada Administración", NOW(), 1, NOW());
INSERT INTO RequestState (name, createdAt, registeredBy, registeredDate) values ("En desembolso", NOW(), 1, NOW());
INSERT INTO RequestState (name, createdAt, registeredBy, registeredDate) values ("Finalizada", NOW(), 1, NOW());
INSERT INTO RequestState (name, createdAt, registeredBy, registeredDate) values ("Documentos errados", NOW(), 1, NOW());
INSERT INTO RequestState (name, createdAt, registeredBy, registeredDate) values ("Rechazada", NOW(), 1, NOW());
INSERT INTO RequestState (name, createdAt, registeredBy, registeredDate) values ("Devolución bancaria", NOW(), 1, NOW());
INSERT INTO RequestState (name, createdAt, registeredBy, registeredDate) values ("Procesadas sin cambio", NOW(), 1, NOW());
INSERT INTO RequestState (name, createdAt, registeredBy, registeredDate) values ("Procesada documentos con cambio", NOW(), 1, NOW());
INSERT INTO RequestState (name, createdAt, registeredBy, registeredDate) values ("Rechazadas por el banco procesadas", NOW(), 1, NOW());
INSERT INTO RequestState (name, createdAt, registeredBy, registeredDate) values ("Pendiente desembolsar por banco", NOW(), 1, NOW());

/*Indicators */
INSERT INTO Indicators (indicatorName, indicatorValue, indicatorRate, registeredBy, registeredDate) values ("Interest", 0, 0.00069, 1, NOW());
INSERT INTO Indicators (indicatorName, indicatorValue, indicatorRate, registeredBy, registeredDate) values ("Management", 12000, 0, 1, NOW());
INSERT INTO Indicators (indicatorName, indicatorValue, indicatorRate, registeredBy, registeredDate) values ("IVA", 0, 0.19, 1, NOW());

/* Bank */
INSERT INTO Bank (bankName, bankCode, isForOutlay, isWallet) values ("BANCO DE BOGOTÁ", "1", false, false);
INSERT INTO Bank (bankName, bankCode, isForOutlay, isWallet) values ("BANCO POPULAR", "2", false, false);
INSERT INTO Bank (bankName, bankCode, isForOutlay, isWallet) values ("BANCO CORPBANCA", "6", false, false);
INSERT INTO Bank (bankName, bankCode, isForOutlay, isWallet) values ("BANCOLOMBIA", "7", false, false);
INSERT INTO Bank (bankName, bankCode, isForOutlay, isWallet) values ("CITIBANK", "9", false, false);
INSERT INTO Bank (bankName, bankCode, isForOutlay, isWallet) values ("BANCO GNB SUDAMERIS", "12", false, false);
INSERT INTO Bank (bankName, bankCode, isForOutlay, isWallet) values ("BBVA COLOMBIA", "13", false, false);
INSERT INTO Bank (bankName, bankCode, isForOutlay, isWallet) values ("ITAÚ", "14", false, false);
INSERT INTO Bank (bankName, bankCode, isForOutlay, isWallet) values ("BANCO COLPATRIA", "19", false, false);
INSERT INTO Bank (bankName, bankCode, isForOutlay, isWallet) values ("BANCO DE OCCIDENTE", "23", false, false);
INSERT INTO Bank (bankName, bankCode, isForOutlay, isWallet) values ("BANCO CAJA SOCIAL", "32", false, false);
INSERT INTO Bank (bankName, bankCode, isForOutlay, isWallet) values ("BANCO AGRARIO", "40", false, false);
INSERT INTO Bank (bankName, bankCode, isForOutlay, isWallet) values ("BNP PARIBAS", "42", false, false);
INSERT INTO Bank (bankName, bankCode, isForOutlay, isWallet) values ("BANCO DAVIVIENDA S.A.", "51", false, false);
INSERT INTO Bank (bankName, bankCode, isForOutlay, isWallet) values ("BANCO AV VILLAS", "52", false, false);
INSERT INTO Bank (bankName, bankCode, isForOutlay, isWallet) values ("BANCO PROCREDIT", "58", false, false);
INSERT INTO Bank (bankName, bankCode, isForOutlay, isWallet) values ("BANCO PICHINCHA S.A.", "60", false, false);
INSERT INTO Bank (bankName, bankCode, isForOutlay, isWallet) values ("BANCOOMEVA", "61", false, false);
INSERT INTO Bank (bankName, bankCode, isForOutlay, isWallet) values ("BANCO FALABELLA S.A.", "62", false, false);
INSERT INTO Bank (bankName, bankCode, isForOutlay, isWallet) values ("BANCO FINANDINA S.A.", "63", false, false);
INSERT INTO Bank (bankName, bankCode, isForOutlay, isWallet) values ("BANCO MULTIBANK", "64", false, false);
INSERT INTO Bank (bankName, bankCode, isForOutlay, isWallet) values ("BANCO SANTANDER DE NEGOCIOS COLOMBIA S.A.", "65", false, false);
INSERT INTO Bank (bankName, bankCode, isForOutlay, isWallet) values ("COOPCENTRAL", "66", false, false);
INSERT INTO Bank (bankName, bankCode, isForOutlay, isWallet) values ("BANCO COMPARTIR", "67", false, false);
INSERT INTO Bank (bankName, bankCode, isForOutlay, isWallet) values ("CORFICOLOMBIANA", "90", false, false);
INSERT INTO Bank (bankName, bankCode, isForOutlay, isWallet) values ("FINANCIERA JURIDISCOOP", "121", false, false);
INSERT INTO Bank (bankName, bankCode, isForOutlay, isWallet) values ("COOPERATIVA FINANCIERA DE ANTIOQUIA", "283", false, false);
INSERT INTO Bank (bankName, bankCode, isForOutlay, isWallet) values ("COTRAFA COOPERATIVA FINANCIERA", "289", false, false);
INSERT INTO Bank (bankName, bankCode, isForOutlay, isWallet) values ("CONFIAR S.A.", "292", false, false);
INSERT INTO Bank (bankName, bankCode, isForOutlay, isWallet) values ("COLTEFINANCIERA", "370", false, false);
INSERT INTO Bank (bankName, bankCode, isForOutlay, isWallet) values ("DAVIPLATA", "51", false, true);
INSERT INTO Bank (bankName, bankCode, isForOutlay, isWallet) values ("NEQUI", "507", false, true);
INSERT INTO Bank (bankName, bankCode, isForOutlay, isWallet) values ("EFECTY", "999", false, true);