/* Roles */
INSERT INTO role (idRole, priority, roleName, createdDate, registeredBy, registeredDate) values (1, 100, 'Administrator', NOW(), 1, NOW());
INSERT INTO role (idRole, priority, roleName, createdDate, registeredBy, registeredDate) values (2, 50, 'Company', NOW(), 1, NOW());
INSERT INTO role (idRole, priority, roleName, createdDate, registeredBy, registeredDate) values (3, 10, 'User', NOW(), 1, NOW());

/* Administrador */
INSERT INTO administrator (adminType, nickName, lastName) values ("superAdmin", "Cristian", "Orjuela");
INSERT INTO user (email, name, createdDate, registeredBy, registeredDate, status, Role_idRole, Client_idClient, Company_idCompany, Administrator_idAdministrator) values ( "ccorjuelavela@gmail.com", "Cristian", NOW(), 1, NOW(), 1, 1, null, null, 1);
INSERT INTO auth (password, expiresOn, createdDate, registeredBy, registeredDate, User_idUser) values ( "IQJASD18923719287jhsdash1231871i99sd", NOW(), NOW(), 1, NOW(), 1);

/* Company */
INSERT INTO companysalaries (companyRate, companyFirstDate) values ("Mensual", "16");
INSERT INTO company (nit, address, maximumSplit, defaultAmount, registeredBy, registeredDate, socialReason, economyActivity, CompanySalaries_idCompanySalaries) values (98723472, "Calle 127B No.12", 3, 300000, 1, NOW(), "SAS", "Construcción", 1);

/* Client */
INSERT INTO account (maximumAmount, partialCapacity, documentsUploaded, montlyFee, totalInterest, totalFeeAdministration, lastAdministrationDate, totalOtherCollection, totalRemainder, registeredBy, registeredDate, Client_idClient) values (300000, 180000, true, 15600, 30000, 20000, NOW(), totalOtherCollection, 70000, 1, NOW(), 1);

/* Request */
INSERT INTO requeststate (name, createdDate, registeredBy, registeredDate) values ("Solicitada", NOW(), 1, NOW());
INSERT INTO requeststate (name, createdDate, registeredBy, registeredDate) values ("En evaluación", NOW(), 1, NOW());
INSERT INTO requeststate (name, createdDate, registeredBy, registeredDate) values ("Aprobando RR.HH.", NOW(), 1, NOW());
INSERT INTO requeststate (name, createdDate, registeredBy, registeredDate) values ("Aprobando Admon.", NOW(), 1, NOW());
INSERT INTO requeststate (name, createdDate, registeredBy, registeredDate) values ("Desembolsada", NOW(), 1, NOW());
INSERT INTO requeststate (name, createdDate, registeredBy, registeredDate) values ("Rechazada", NOW(), 1, NOW());

/* Interest */
INSERT INTO interestrequest (interestValue, registeredBy, registeredDate) values (0.2, 1, NOW());

/* Management Payment */
INSERT INTO managementpayment (managementpaymentValue, registeredBy, registeredDate) values (0.1, 1, NOW());

SELECT * FROM interestrequest;
SELECT * FROM user;
SELECT * FROM account;
SELECT * FROM client;
SELECT * FROM requeststate;