//Requires
const express = require('express');
const multer = require('multer');
const mkdirp = require('mkdirp');
var path = require('path');
const { body, header,  } = require('express-validator');

//Initialize
const router = express.Router();

//Modify the folder/file storage
const storage = multer.diskStorage({
  destination: function(req, file, callback){
  
    //Production
    var dest = '../files/documents/'+req.body.identificationId+'-'+req.body.idCompany+'/';
    
    //Development
    //var dest = './files/documents/'+req.body.identificationId+'-'+req.body.idCompany+'/';

    mkdirp.sync(dest);
    callback(null, dest);
    
  },
  filename: function(req, file, callback){
    //console.log("File", file);
    let name = file.fieldname;
    callback(null, name + path.extname(file.originalname));
  }
});

//const uploads;

const avatarUpload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5
  }
  }).fields([
    { name: 'paymentSupport', maxCount: 1},
    { name: 'workingSupport', maxCount: 1},
  ]);


//Controllers
const { verifyToken, validateFileSize } = require('../../controllers/validator');
const { getOutLayData, getOultayDatesList, createNewRequest, getAllRequest, getRequestsToApprove,
        getAllRequestByCompany, approveOrReject, getRequestStateList, getRequestToOutLay,
        generateContract, getAllRequestWasOutlayedC, getAllRequestWasRejectedC,
        getRejectedRequest, getPendingRRHHRequest, generateCodes, checkCodes,
        getPendingBankRefundedRequest, changeToProcessWithoutChange, changeToOutlay,
        changeToProcessWithDocuments, getAllReviewWithoutChangeRequest, updateDocumentsRequests,
        updateRequestsInformation, getDefinitelyRejectedRequest, getAllRequestWithDocumentsChange,
        getAllProcessInBank, getAllFinalizedRequest
       } = require('../../controllers/request');
  
//Routes 
router.get('/Request/GetOutlayData', [verifyToken], getOutLayData);

router.get('/Request/GetOultayDatesList',[
    header('split', 'La cantidad de cuotas es inválida.').exists().isInt().not().isEmpty(),
    header('quantity', 'El monto es inválido.').exists().isInt().not().isEmpty()
],
[verifyToken], getOultayDatesList);

router.post('/Request/Create', function(req, res, next) { 

  try{
    avatarUpload( req, res, ( err ) => {
      console.log("Error", err);
      console.log("File", req.file);
      if ( err ){
        return res.status(400).json({message: "Uno o varios de los archivo/s cargado/s es/son muy pesado/s. Modifícalo/s e intenta de nuevo, por favor."});
      }
      next();
    });
  }catch (err){
    console.log("Error", err);
  }
}, [verifyToken], createNewRequest);

router.post('/Request/UpdateDocuments', function(req, res, next) { 

  try{
    avatarUpload( req, res, ( err ) => {
      if ( err || !req.file ){
        return res.status(400).json({message: "Uno o varios de los archivo/s cargado/s es/son muy pesado/s. Modifícalo e intenta de nuevo, por favor."});
      }
      next();
    });
  }catch (err){
    console.log("Error", err);
  }
}, [verifyToken], updateDocumentsRequests);

router.put('/Request/UpdateInformation', [verifyToken], updateRequestsInformation);

router.get('/Request/GetAll', [verifyToken], getAllRequest);

router.get('/Request/GetAllWasOutlayed', [verifyToken], getAllRequestWasOutlayedC);

router.get('/Request/GetAllWasRejected', [verifyToken], getAllRequestWasRejectedC);

router.get('/Request/GetAllRequestByCompany', [verifyToken], getAllRequestByCompany);

router.put('/Request/ApproveorReject', [verifyToken], approveOrReject);

router.put('/Request/PassWithoutChanges', [verifyToken], changeToProcessWithoutChange);

router.put('/Request/PassWithDocuments', [verifyToken], changeToProcessWithDocuments);

router.put('/Request/PassToOutLay', [verifyToken], changeToOutlay);

router.get('/Request/GetStateList', [verifyToken], getRequestStateList);

router.get('/Request/GetToApproveByAdmin', [verifyToken], getRequestsToApprove);

router.get('/Request/GetAllToOutLayByAdmin', [verifyToken], getRequestToOutLay);

router.get('/Request/GetAllRejected', [verifyToken], getRejectedRequest);

router.get('/Request/GetAllDefinitelyRejected', [verifyToken], getDefinitelyRejectedRequest);

router.get('/Request/GetAllPendingRRHH', [verifyToken], getPendingRRHHRequest);

router.get('/Request/GetAllBankRefunded', [verifyToken], getPendingBankRefundedRequest);

router.get('/Request/GetAllProcessWithoutChanges', [verifyToken], getAllReviewWithoutChangeRequest);

router.get('/Request/GetAllRequestWithDocumentChanges', [verifyToken], getAllRequestWithDocumentsChange);

router.get('/Request/GetAllProcessInBank', [verifyToken], getAllProcessInBank);

router.get('/Request/GetAllFinalizedRequest', [verifyToken], getAllFinalizedRequest);

router.get('/Documents/GenerateContract', [
  header('split', 'La cantidad de cuotas es inválida.').exists().isInt().not().isEmpty(),
  header('quantity', 'El monto es inválido.').exists().isInt().not().isEmpty()
],
[verifyToken], generateContract);

router.get('/Request/GenerateCodes', [verifyToken], generateCodes);

router.get('/Request/ValidateCodes', [verifyToken], checkCodes);

//Export
module.exports = router;
