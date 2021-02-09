//Requires
const express = require('express');
const multer = require('multer');
const mkdirp = require('mkdirp');
const { header, body } = require('express-validator');

//Controllers
const { verifyToken } = require('../../controllers/validator');
const { generateBankReport, receiveBankReport, generatePendingRequestReport, 
        generatePendingByRRHH, generateParticularPendingRequestByRRHH,downloadFile,uploadSabana } = require('../../controllers/reports');

//Initialize
const router = express.Router();

// Modify the folder/file storage
const storageAdmin = multer.diskStorage({
  destination: function(req, file, callback){
    
    //Production
    var dest = '../files/reads';
  
    mkdirp.sync(dest);
    callback(null, dest);

  },
  filename: function(req, file, callback){
    callback(null, new Date().toISOString().replace(/:/g, '-').split("T")[0] + "-" + file.originalname );
  }
});

//Constants
const uploads = multer({
  storage: storageAdmin,
  limits: {
    fileSize: 1024 * 1024 * 5
  }
});

//Routes 
router.get('/Reports/GenerateBankReport/:bank_id', [verifyToken], generateBankReport);

router.get('/Reports/PendingToFinalizeByBank', [verifyToken], generatePendingRequestReport);

router.get('/Reports/PendingGeneralByRRHH', [verifyToken], generatePendingByRRHH);

router.get('/Reports/PendingParticularByRRHH', [verifyToken], generateParticularPendingRequestByRRHH);

// router.get('/Reports/DownloadFile/:fileName', [verifyToken], downloadFile);

router.get('/Reports/DownloadFile/:fileName', downloadFile);


router.post('/Reports/ReceiveBankReport', uploads.fields([
  { name: 'read', maxCount: 1 }
]), [verifyToken], receiveBankReport);


router.post('/Reports/Sabana', uploads.fields([
  { name: 'read', maxCount: 1 }
]), uploadSabana);
//Export
module.exports = router;