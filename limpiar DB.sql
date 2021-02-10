-- TRUNCATE TABLE `avanzo`.`requestoutlay`;
-- DELETE FROM `avanzo`.`request`;
-- TRUNCATE TABLE `avanzo`.`payment`;
-- DELETE FROM `avanzo`.`transaction`;
-- DELETE FROM `avanzo`.`account`;
-- TRUNCATE TABLE `avanzo`.`codes`;
-- DELETE FROM `avanzo`.`auth` WHERE  User_idUser > 1;
-- DELETE FROM `avanzo`.`user` WHERE idUser > 1;
-- DELETE FROM `avanzo`.`client`;
-- DELETE FROM `avanzo`.`clientdocuments`;
-- TRUNCATE TABLE `avanzo`.`companymembers`;
-- TRUNCATE TABLE `avanzo`.`company_has_companysalaries`;
-- TRUNCATE TABLE `avanzo`.`newclient`;
-- DELETE FROM `avanzo`.`company`;
-- DELETE FROM `avanzo`.`prerequestdates`;

-- TRUNCATE TABLE `avanzo`.`newclient`;

DELETE FROM `avanzo`.`requestoutlay`;
DELETE FROM `avanzo`.`request`;
DELETE FROM `avanzo`.`transaction`;
DELETE FROM `avanzo`.`account`;
DELETE FROM `avanzo`.`auth` WHERE  User_idUser > 3;
DELETE FROM `avanzo`.`user` WHERE idUser > 3;
DELETE FROM `avanzo`.`codes`;
DELETE FROM `avanzo`.`client`;
UPDATE avanzo.newclient SET status=0 WHERE newclient.idNewClient =1;





----------------
-- eliminar login history
DELETE FROM `avanzo`.`LoginHistory`;
DELETE FROM `avanzo`.`Auth` WHERE  User_idUser NOT IN (2);
DELETE FROM `avanzo`.`User` WHERE  idUser NOT IN (2);
DELETE FROM `avanzo`.`Codes`;
DELETE FROM `avanzo`.`Client`;
TRUNCATE TABLE `avanzo`.`NewClient`;

DELETE FROM `avanzo`.`ClientDocuments`;





SET global log_output = 'FILE';
SET global general_log_file='C:\Users\dario\Documents\mysql.log';
SET global general_log = 1;
select * from mysql.general_log order by event_time desc limit 5;
