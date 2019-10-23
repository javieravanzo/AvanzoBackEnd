//Requires
const bcrypt = require('bcryptjs');

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

module.exports = helpers;