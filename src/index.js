//Requires
const express = require('express');
const morgan = require('morgan');

//Initialize
const app = express();

//Settings
app.set('port', process.env.PORT || 4000);

//Middlewares
app.use(express.static('../files/terms'));
app.use(express.static('../files/images'));
app.use(express.static('../files/writes'));
app.use(express.static('../files/contracts'));
app.use(express.static('../files/documents'));
//app.use(express.static(__dirname + '../files')); 
app.use(express.json());
app.use(morgan('dev'));
var cors = require('cors');
app.use(cors());
app.options('*', cors())
app.all('*', function(req, res, next) {
   res.header("Access-Control-Allow-Origin", "*");
   res.header("Access-Control-Allow-Headers", "Origin, Content-Type, X-Auth-Token,  X-Requested-With, Accept, Authorization");
   res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS'); 
   
   next();
});

//Routes
app.use(require('./routes/authentication/login'));
app.use(require('./routes/authentication/register'));
app.use(require('./routes/general/general'));
app.use(require('./routes/customer/customer'));
app.use(require('./routes/request/request'));
app.use(require('./routes/company/company'));
app.use(require('./routes/integration/integration'));
app.use(require('./routes/reports/reports'));
app.use(require('./routes/validations/validations'));
app.use(require('./routes/user/User'));

//Server
app.listen( app.get('port'), () => {
    console.log('Server in port: 4000');
});

