
const multer = require('multer')

let parentStorage = multer.diskStorage({
	destination : function(req , file , cb) {
		cb(null , './public/uploads/profile')
	} , 
	filename : function(req , file , cb) { 
	    let fileName =  req.params.parentID + "-" + file.originalname 
		cb(null , fileName) 
	}
})

let parentUpload = multer({storage : parentStorage})
module.exports = parentUpload 