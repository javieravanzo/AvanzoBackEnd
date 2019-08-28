//Requires
const bcrypt = require('bcryptjs');

const helpers = {};

//Functions
helpers.encryptPassword = async (password) => {
    const text = await bcrypt.hash(password, 10);
    return text;
};

helpers.matchPassword = async (password, savedPassword) => {
    try{
        return await bcrypt.compare(password, savedPassword);
    }catch(e){
        console.log(e);
    }
};

module.exports = helpers;