//const ENVIRONMENT = "development";
const ENVIRONMENT = "production";

/* ----------------- Bancos ------------------- */
const banks = {

  BANCO_DE_BOGOTÁ: 1,
  BANCO_POPULAR: 2,
  BANCO_CORPBANCA: 3,
  BANCOLOMBIA: 4,
  CITIBANK: 5,
  BANCO_GNB_SUDAMERIS: 6,
  BBVA_COLOMBIA: 7,
  ITAÚ: 8,
  BANCO_COLPATRIA: 9,
  BANCO_DE_OCCIDENTE: 10,
  BANCO_CAJA_SOCIAL: 11,
  BANCO_AGRARIO: 12,
  BNP_PARIBAS: 13,
  BANCO_DAVIVIENDA: 14,
  BANCO_AV_VILLAS: 15,
  BANCO_PROCREDIT: 16,
  BANCO_PICHINCHA: 17,
  BANCOOMEVA: 18,
  BANCO_FALABELLA: 19,
  BANCO_FINANDINA: 20,
  BANCO_MULTIBANK: 21,
  BANCO_SANTANDER_DE_NEGOCIOS_COLOMBIA: 22,
  COOPCENTRAL: 23,
  BANCO_COMPARTIR: 24,
  CORFICOLOMBIANA: 25,
  FINANCIERA_JURIDISCOOP: 26,
  COOPERATIVA_FINANCIERA_DE_ANTIOQUIA: 27,
  COTRAFA_COOPERATIVA_FINANCIERA: 28,
  CONFIAR: 29,
  COLTEFINANCIERA: 30,
  DAVIPLATA: 31,
  NEQUI: 32,
  EFECTY: 33,
  AVANZOAPP: 34,
};

SMS_CODES = {
  APPROVED_CLIENT: 1,
  CLIENT_REJECTED: 2,
  APPROVED_CREDIT: 3,
  CREDIT_REJECTED: 4,
  VERIFICATION_CODE: 5,
  CUSTOMER_PENDING_APPROVAL: 6
};

PRE_CLIENT_STATES = {
  PREREGISTER: 0,
  REJECTED: 2
}


ROLES = {
  ADMINISTRATOR: 1,
  MANAGER: 2,
  COMPANY: 3,
  USER: 4,
  CALLCENTER: 5
}

STATE = { TRUE: true, FALSE: false };


const ATTACHMENT_TYPES = { PDF: 'application/pdf' };

const URL_SEND_SMS = "http://4q158.api.infobip.com/sms/2/text/single";
const AUTH_SEND_SMS = "App 5df3a3d337b412b17bac8abeb85a3f68-1bf38df9-7d01-4b15-aacf-8f8c74df3f49";
const FROM_SEND_SMS = "AVANZO";
const SG_MAIL_API_KEY = "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";
const FROM_SEND_EMAIL = "operaciones@avanzo.co"
//FILES
const PATH_FILE_CONTRACT = "../files/contracts/contratoAvanzo.pdf";
const NAME_FILE_CONTRACT = "contratoAvanzo.pdf";
//TEMPLATES
const PENDING_APPROVAL = "pendingApproval";
const ACCOUNT_CONFIRMATION = "accountConfirmation";
const ACCOUNT_REJECTED = "accountRejected";


module.exports = {
  ENVIRONMENT, banks, URL_SEND_SMS, AUTH_SEND_SMS, SG_MAIL_API_KEY, ATTACHMENT_TYPES, FROM_SEND_EMAIL, FROM_SEND_SMS, SMS_CODES, PATH_FILE_CONTRACT,
  NAME_FILE_CONTRACT, PENDING_APPROVAL, ACCOUNT_CONFIRMATION, ACCOUNT_REJECTED, STATE, PRE_CLIENT_STATES,ROLES
}