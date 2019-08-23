const { registerCustomer } = require('../services/register');
 
const registerClient = async (req, res, next) => {
  try {
    const result = await registerCustomer(req.body);
    if(result.status === 200){
        res.json(result.message);
    }else{
        res.json(result.message);
    }
    next();
  }catch(e) {
    console.log(e.message);
  };
};
 
module.exports = {
    registerClient
};