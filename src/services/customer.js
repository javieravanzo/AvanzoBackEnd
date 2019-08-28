//Requires
const pool = require('../config/database.js');

//Services
const getInitialsData = async (customerId) => {
  const result = {status: null, data: {}, message: ""};
  try {
      const userRow = await pool.query('SELECT * FROM user WHERE idUser = ?', [customerId]);
      const clientRow = await pool.query('SELECT * FROM client WHERE idClient = ?', [userRow[0].Client_idClient]);
      if(clientRow){
          return {status: 200, message: "", data: clientRow[0]};
      }else{
          return {status: 500, message: "Error interno del servidor."};
      }
  } catch(e) {
      return {status: 500, message: "Error interno del servidor."};
      throw e;
  }
};

module.exports = {
  getInitialsData
}