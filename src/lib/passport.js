//Requires
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const pool = require('../config/database.js');
const helpers = require('./helpers');

///Functions
passport.use('local.signin', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true,
}, async (req, email, password, done) => {
   // console.log(req.body);
    const userRow = await pool.query('SELECT * FROM user where email = ?', [email]);
    const authRow = await pool.query('SELECT * FROM auth where User_idUser = ?', [userRow.insertId]);
    if(authRow > 0){
        const user = rows[0];
        const validPassword = await helpers.matchPassword(password, user.password);
        if (validPassword){
            done(null, user, result2.json('Welcome ' + user.name));
        }else{
            done(null, false, res.json('La contraseña es incorrecta'));
        }
    }else{
        return done(null, false, res.json('El usuario no existe'));
    }
}));

passport.use('local.signup', new LocalStrategy({
    usernameField: 'name',
    passwordField: 'password',
    confirmPasswordField: 'confirmPassword',
    passReqToCallback: true,
}, async (req, name, password, done) => {
    const { email, identificationId, lastName, documentType, phoneNumber, birthDate, expeditionDate} = req.body;
    //NewObject
    const newClient = { identificationId, lastName, documentType, phoneNumber, birthDate, expeditionDate, Company_idCompany: 2};
    let result1 = {};
    try{
        result1 = await pool.query('INSERT INTO client SET ?', [newClient]);
        //console.log("Resultado1", result1);
    }catch(e){
        //console.log("Error", e);
    }
    const newUser = { email, name, status: true, Role_idRole: 3, Client_idClient: result1.insertId};
    if(result1){
        //Insert in user
        
        const result2 = await pool.query('INSERT INTO user SET ?', [newUser]);
        newUser.id = result2.insertId;
        const newAuth = { password, token: "asd987a9sd698as7d", User_idUser: result2.insertId};
        //console.log("NewPas", newAuth.password);
        //Change saved password
        newAuth.password = await helpers.encryptPassword(password, password);
        const result3 = await pool.query('INSERT INTO auth SET ?', [newAuth]);
        //console.log("Resultado2", result3);
    }
    return done(null, newUser);
}));

passport.serializeUser((user, done) =>{
    done(null, user.id);
});

passport.deserializeUser(async (id, done)=>{
    pool.query('SELECT * FROM user where id = ?', [id]);
    done(null, rows[0]);
});
