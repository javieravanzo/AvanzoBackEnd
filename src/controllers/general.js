const { login } = require('../services/general');
 
const makeLogin = async (req, res, next) => {
  try {
    const result = await login(req.body);
    if(result.status === 200){
        res.json(result.message);
    }else{
        res.json(result.message);
    }
    next();
  } catch(e) {
    console.log(e.message);
  };
};
 
module.exports = {
  makeLogin
};