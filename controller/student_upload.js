
const multer = require('multer')

let studentStorage = multer.diskStorage({
	destination : function(req , file , cb) {
		cb(null , './public/uploads/profile')
	} , 
	filename : function(req , file , cb) { 
	    let fileName =  req.params.studentID + "-" + file.originalname 
		cb(null , fileName) 
	}
})

let studentUpload = multer({storage : studentStorage})
module.exports = studentUpload 