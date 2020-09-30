// File management Module 
const fs        = require("fs")
const multer    = require("multer") 
const path      = require("path") 
const currentPath       = __dirname 
const directoryName     = path.dirname(currentPath) 
// Handling Upload for admin 
const adminStorage = multer.diskStorage({
    destination : function(req , file , cb) {
		cb(null ,  path.join(directoryName, '/public/uploads/profile/'))
	} , 
	filename : function(req , file , cb) {  
	    let fileName =   `${req.session.schoolCode}-${file.originalname}`  
		cb(null , fileName) 
	}
}) 

const staffStorage = multer.diskStorage({
	destination : function(req , file , cb) {
		cb(null ,  path.join(directoryName, '/public/uploads/profile/'))
	} , 
	filename : function(req , file , cb) { 
	    let fileName =  req.params.staffID + "-" + file.originalname 
		cb(null , fileName) 
	}
})

const studentStorage = multer.diskStorage({
    destination : function(req , file , cb) {
		cb(null ,  path.join(directoryName, '/public/uploads/profile/'))
	} , 
	filename : function(req , file , cb) {  
		let date = new Date().getDate() 
	    let fileName =   req.params.studentID + "-" + file.originalname 
		cb(null , fileName) 
	}
}) 

const questionStorage = multer.diskStorage({
    destination : function(req , file , cb) {
		cb(null ,  path.join(directoryName, '/public/uploads/profile/'))
	} , 
	filename : function(req , file , cb) {  
		let date = new Date().getDate() 
	    let fileName =   Date.now() + "-" + file.originalname 
		cb(null , fileName) 
	}
})

exports.adminUpload  = multer({storage : adminStorage}) 
exports.staffUpload  = multer({storage : staffStorage})
exports.studentUpload  = multer({storage : studentStorage})
exports.questionUpload  = multer({storage : questionStorage})