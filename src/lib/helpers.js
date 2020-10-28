//Requires
const bcrypt = require('bcryptjs');
const http = require("http");

const helpers = {};

//Functions
helpers.encryptPassword = async (password) => {
    
    let text = "";
    try{
        text = await bcrypt.hash(password, 10);
    }catch(e){
        throw(e);
    }
    
    return text;
};

helpers.matchPassword = async (password, savedPassword) => {
    try{
        return await bcrypt.compare(password, savedPassword);
    }catch(e){
        throw(e);
    }
};

helpers.generateSMS = async (data) => {

    let options = {
        hostname: "postman-echo.com",
        path: "/post",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "App"
        }
    };

    try{
        /*http.request({

        });*/
    } catch (e) {

    }

};

helpers.convertLocalDate = async (date) => {

    try{
        date = date.getUTCFullYear() + '-' +
            ('00' + (date.getUTCMonth()+1)).slice(-2) + '-' +
            ('00' + date.getUTCDate()).slice(-2) + 'T' + 
            ('00' + date.getUTCHours()).slice(-2) + ':' + 
            ('00' + date.getUTCMinutes()).slice(-2) + ':' + 
            ('00' + date.getUTCSeconds()).slice(-2);
    }catch(e){
        console.log("Error", e);
    };
    
    return date;
};


module.exports = helpers;