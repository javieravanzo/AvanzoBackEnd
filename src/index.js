//Requires
const express = require('express');
const morgan = require('morgan');
const passport = require('passport');

//Initialize
const app = express();
require('./lib/passport');

//Settings
app.set('port', process.env.PORT || 4000)

//Middlewares
app.use(express.json());
app.use(morgan('dev'));
app.use(passport.initialize());
app.use(passport.session());

//Routes
app.use(require('./routes/authentication/login'));
app.use(require('./routes/authentication/register'));

//Server
app.listen( app.get('port'), () => {
    console.log('Server in port: 4000');
});