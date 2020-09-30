const mongoose = require('mongoose')
const Schema = mongoose.Schema

const CourseSchema = new Schema ({
    school : {type : Schema.Types.ObjectId, ref : 'SchoolAdmin'},
    exam : {type : Schema.Types.ObjectId , ref : 'Exam'},
    examiner : {type : Schema.Types.ObjectId, ref : 'Staff'},
    courseName : String,
    className : String,
    instruction : String,
    duration : Number,
    publish : {type : Boolean, default : false},
    release : {type : Boolean, default : false}
})

module.exports = mongoose.model("Course" , CourseSchema)