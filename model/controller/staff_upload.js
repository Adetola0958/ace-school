
const multer = require('multer')

let staffStorage = multer.diskStorage({
	destination : function(req , file , cb) {
		cb(null , './public/uploads/profile')
	} , 
	filename : function(req , file , cb) { 
	    let fileName =  req.params.staffID + "-" + file.originalname 
		cb(null , fileName) 
	}
})

let staffUpload = multer({storage : staffStorage})
module.exports = staffUpload 