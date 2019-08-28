const { getInitialsData } = require('../services/customer');
 
const getInitialData = async (req, res, next) => {
    const {customerid} = req.headers;
    try {
        const result = await getInitialsData(customerid);
        if(result.status === 200){
            res.status(result.status).json(result.data);
        }else{
            res.status(result.status).json(result.message);
        }
        next();
    } catch(e) {
        res.status(500).json("No es posible obtener la información en este momento.");
    };
};

module.exports = {
  getInitialData
};