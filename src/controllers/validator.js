const { body } = require('express-validator')

function validate(){
  return [ 
    body('userName', "userName doesn't exists").exists(),
    body('email', 'Invalid email').exists().isEmail(),
    body('phone').optional().isInt(),
    body('status').optional().isIn(['enabled', 'disabled'])
    ]   
};

module.exports = {
  validate
};
