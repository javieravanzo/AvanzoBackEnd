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


SELECT * FROM auth;