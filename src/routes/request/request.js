//Requires
const express = require('express');
const { body, header,  } = require('express-validator');
const multer = require('multer');

//Modify the folder/file storage
const storage = multer.diskStorage({
  destination: function(req, file, callback){
    callback(null, './files/');
  },
  filename: function(req, file, callback){
    callback(null, new Date().toISOString().replace(/:/g, '-') + file.originalname);
  }
});

//Apply the files filter
const fileFilter = (req, file, callback) => {
  if(file.mimetype === 'application/pdf' ){
    callback(null, true);
  }else{
    callback(null, false);
  }
};

const uploads = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5
  }
  //fileFilter: fileFilter
});


//Initialize
const router = express.Router();

//Controllers
const { verifyToken } = require('../../controllers/validator');
const { getOutLayData, getOultayDatesList, createNewRequest, getAllRequest, getRequestsToApprove,
        getAllRequestByCompany, approveOrReject, getRequestStateList, getRequestToOutLay,
        generateContract } = require('../../controllers/request');
 
//Routes 
router.get('/Request/GetOutlayData', [verifyToken], getOutLayData);

router.get('/Request/GetOultayDatesList',[
    header('split', 'La cantidad de cuotas es inválida.').exists().isInt().not().isEmpty(),
    header('quantity', 'El monto es inválido.').exists().isInt().not().isEmpty()
],
[verifyToken], getOultayDatesList);

router.post('/Request/Create', uploads.single('file'), [verifyToken], createNewRequest);

router.get('/Request/GetAll', [verifyToken], getAllRequest);

router.get('/Request/GetAllRequestByCompany', [verifyToken], getAllRequestByCompany);

router.put('/Request/ApproveorReject', [verifyToken], approveOrReject);

router.get('/Request/GetStateList', [verifyToken], getRequestStateList);

router.get('/Request/GetToApproveByAdmin', [verifyToken], getRequestsToApprove);

router.get('/Request/GetAllToOutLayByAdmin', [verifyToken], getRequestToOutLay);

router.get('/Documents/GenerateContract',
[
  header('split', 'La cantidad de cuotas es inválida.').exists().isInt().not().isEmpty(),
  header('quantity', 'El monto es inválido.').exists().isInt().not().isEmpty()
],
[verifyToken], generateContract);

//Export
module.exports = router;
