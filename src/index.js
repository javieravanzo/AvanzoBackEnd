//Requires
const express = require('express');
const morgan = require('morgan');

//Initialize
const app = express();

//Settings
app.set('port', process.env.PORT || 4000)

//Middlewares
app.use(express.json());
app.use(morgan('dev'));
app.all('*', function(req, res, next) {
   res.header("Access-Control-Allow-Origin", "*");
   res.header("Access-Control-Allow-Headers", "*");
   res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
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

//Server
app.listen( app.get('port'), () => {
    console.log('Server in port: 4000');
});