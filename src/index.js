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

//Routes
app.use(require('./routes/authentication/login'));
app.use(require('./routes/authentication/register'));
app.use(require('./routes/general/general'));
app.use(require('./routes/customer/customer'));

//Server
app.listen( app.get('port'), () => {
    console.log('Server in port: 4000');
});