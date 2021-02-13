const { Sequelize } = require('sequelize');


'use-strict';
//Libraries

//Import file config
// const config = require('../config/db_config_server.json');
 const config = require('../config/db_config.json');


//Import Controllers
// const LoggerApiController = require('../controllers/loggerApiController.controller');

 const sequelize = new Sequelize(
  
    config.database,
    config.username,
    config.password,
    {
        host: config.host,
        port: config.port,
        dialect: config.dialectBd,
        
        pool: {
            max: config.max,
            min: config.min,
            require: config.require,
            idle: config.idle
        },
        logging: console.log,
        logging: function (str) {
        // do your own logging
        //  console.log("####################################################################11");
          console.log(str);
        //  console.log("####################################################################22");

    }
    }
);
var db={};
try {
   sequelize.authenticate();
  console.log('Connection has been established successfully. sequelize===================');
} catch (error) {
  console.error('Unable to connect to the database:', error);
}
db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.account = require('../../models/account.js')(sequelize, Sequelize);
db.administrator = require('../../models/administrator.js')(sequelize, Sequelize);
db.audit = require('../../models/audit.js')(sequelize, Sequelize);
db.auth = require('../../models/auth.js')(sequelize, Sequelize);
db.bank = require('../../models/bank.js')(sequelize, Sequelize);
db.client = require('../../models/client.js')(sequelize, Sequelize);
db.clientdocuments = require('../../models/clientdocuments.js')(sequelize, Sequelize);
db.codes = require('../../models/codes.js')(sequelize, Sequelize);
db.company_has_companysalaries = require('../../models/company_has_companysalaries.js')(sequelize, Sequelize);
db.company = require('../../models/company.js')(sequelize, Sequelize);
db.companymembers = require('../../models/companymembers.js')(sequelize, Sequelize);
db.companysalaries = require('../../models/companysalaries.js')(sequelize, Sequelize);
db.documents = require('../../models/documents.js')(sequelize, Sequelize);
db.emails = require('../../models/emails.js')(sequelize, Sequelize);
db.indicators = require('../../models/indicators.js')(sequelize, Sequelize);
db.newclient = require('../../models/newclient.js')(sequelize, Sequelize);
db.observations = require('../../models/observations.js')(sequelize, Sequelize);
db.payment = require('../../models/payment.js')(sequelize, Sequelize);
db.prerequestdates = require('../../models/prerequestdates.js')(sequelize, Sequelize);
db.rejectionreasons = require('../../models/rejectionreasons.js')(sequelize, Sequelize);
db.request = require('../../models/request.js')(sequelize, Sequelize);
db.requestoutlay = require('../../models/requestoutlay.js')(sequelize, Sequelize);
db.requeststate = require('../../models/requeststate.js')(sequelize, Sequelize);
db.role = require('../../models/role.js')(sequelize, Sequelize);
db.rolhasservices = require('../../models/rolhasservices.js')(sequelize, Sequelize);
db.services = require('../../models/services.js')(sequelize, Sequelize);
db.sms = require('../../models/sms.js')(sequelize, Sequelize);
db.smscodes = require('../../models/smscodes.js')(sequelize, Sequelize);
db.transaction = require('../../models/transaction.js')(sequelize, Sequelize);
db.user = require('../../models/user.js')(sequelize, Sequelize);
db.generatedbankfiles = require('../../models/generatedbankfiles.js')(sequelize, Sequelize);
db.loginhistory = require('../../models/loginhistory.js')(sequelize, Sequelize);
db.sabana = require('../../models/sabana.js')(sequelize, Sequelize);



//Relations
db.auth.belongsTo(db.user);
db.user.hasMany(db.auth);


db.audit.belongsTo(db.user);
db.user.hasMany(db.audit);

db.role.belongsTo(db.user);
db.user.hasMany(db.role);

db.loginhistory.belongsTo(db.user);
db.user.hasMany(db.loginhistory);


db.user.belongsTo(db.client,{foreignKey:'Client_idClient'});
db.client.hasOne(db.user,{foreignKey:'Client_idClient'});


// db.client.belongsTo(db.user,{foreignKey:'Client_idClient'});
// db.user.hasOne(db.client,{foreignKey:'Client_idClient'});

// db.user.belongsTo(db.client,{as:'client',foreignKey:'Client_idClient'});
// db.client.hasMany(db.user);


db.user.belongsTo(db.company);
db.company.hasOne(db.user);


db.administrator.belongsTo(db.user);
db.user.hasMany(db.administrator);

db.generatedbankfiles.belongsTo(db.bank,{foreignKey:'bank_id'});
db.bank.hasOne(db.generatedbankfiles,{foreignKey:'bank_id'});


db.request.belongsTo(db.account,{foreignKey:'Account_idAccount'});
db.account.hasMany(db.request,{foreignKey:'Account_idAccount'});

module.exports = db;


//=================================================

// Option 1: Passing a connection URI
// const sequelize = new Sequelize('sqlite::memory:') // Example for sqlite
// const sequelize = new Sequelize('postgres://user:pass@example.com:5432/dbname') // Example for postgres

// Option 2: Passing parameters separately (sqlite)
// const sequelize = new Sequelize({
//   dialect: 'sqlite',
//   storage: 'path/to/database.sqlite'
// });

// Option 2: Passing parameters separately (other dialects)
// const sequelize = new Sequelize('avanzo', 'root', 'root', {
//   host: 'localhost',
//   dialect: 'mysql'/* one of 'mysql' | 'mariadb' | 'postgres' | 'mssql' */
// });
