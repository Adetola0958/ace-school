/** 
  * Design the schema and the model for the course document 
*/
  
const mongoose = require('mongoose') 
const Schema   = mongoose.Schema 
/**
  * Design the schema for the exam 
  
*/

const AdminSchema = new Schema({
	email :{
		type : String  
	} ,   
	password : {
		type : String
	} 
})

module.exports = mongoose.model('Admin' , AdminSchema)
 