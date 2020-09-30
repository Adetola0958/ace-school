const mongoose = require('mongoose') 
const Schema   = mongoose.Schema 

const StudentSchema = new Schema ({
    school : {type : Schema.Types.ObjectId, ref : 'SchoolAdmin'},
    studentID : {type : String},
    firstName : {type : String},
    lastName : {type : String},
    otherName : {type : String},
    password : {type : String},
    gender : {type : String},
    className : { type : Schema.Types.ObjectId, ref : 'Classchool'},
    profilePhoto : {type : String},
    dateOfBirth : Date,
    religion : String,
    bloodGroup : String,
    parentsNumber : String
})

StudentSchema.virtual('student').get(function() {
	return `${this._id}`
})

module.exports = mongoose.model("Student" , StudentSchema)