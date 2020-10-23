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




module.exports = helpers;