const mongoose = require('mongoose')
const Schema = mongoose.Schema

const ExamSchema = new Schema ({
    school : {type : Schema.Types.ObjectId, ref : 'SchoolAdmin'},
    session : {type : Schema.Types.ObjectId, ref : 'SchoolSession'},
    term : {type : Schema.Types.ObjectId, ref : 'Term'},
    name : String,
    startDate : Date,
    endDate : Date,
    examCode : String
})

module.exports = mongoose.model("Exam" , ExamSchema)