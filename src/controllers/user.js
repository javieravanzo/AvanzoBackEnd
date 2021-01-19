//Requires
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const Excel = require('xlsx');

//Imports
const USER = require('../services/user.js');



const updateState = async (req, res, next) => {
    
    try {

        //Get the user id
        const {userId,state} = req.body;

        //console.log("CI", clientid, "S", status);
        const result = await USER.updateState(userId,state);
        if(result.status === 200){
            res.status(result.status).json(result.message);
        }else{
            res.status(result.status).json(result.message);
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