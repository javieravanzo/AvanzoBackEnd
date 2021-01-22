//Requires
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const Excel = require('xlsx');

//Imports
const USER = require('../services/user.js');
var DataTypes = require('sequelize/lib/data-types');
const dbSequelize = require('../config/database_sequelize.js');
sequelize = dbSequelize.sequelize,
    Sequelize = dbSequelize.Sequelize;
const User = require('../../models/user')(sequelize, DataTypes);;



const updateState = async (req, res, next) => {
    
    try {

        //Get the user id
        const {userId,state} = req.body;

        //console.log("CI", clientid, "S", status);
        // const result = await USER.updateState(userId,state);
        let  newClienteUpdated =await User.update({ status: state }, {
            where: {idUser: userId}
          })
          
           console.log(newClienteUpdated[0]);
        if(newClienteUpdated[0] === 1){
            res.status(200).json({ message:"El usuario cambio de estado exitosamente."});

        }else{
            res.status(200).json({ message:"No se logro cambio de estado."});
        }
        next();

    } catch(e) {
        console.log(e);
        res.status(500).json("No es posible eliminar el usuario en este momento.");
    };

};

module.exports = {
    updateState
};