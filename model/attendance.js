const mongoose = require('mongoose')
const Schema = mongoose.Schema

const AttendanceSchema = new Schema ({
    school : {type : Schema.Types.ObjectId, ref : 'SchoolAdmin'},
    session : {type : Schema.Types.ObjectId, ref : 'SchoolSession'},
    term : {type : Schema.Types.ObjectId, ref : 'Term'},
    student : {type : Schema.Types.ObjectId, ref : 'Student'},
    className : {type : Schema.Types.ObjectId, ref : 'Classchool'},
    staff : {type : Schema.Types.ObjectId, ref : 'Staff'},
    attendance : [
        {
            date : Date,
            week : Number,
            mark : String
        }
    ]
})

module.exports = mongoose.model("Attendance" , AttendanceSchema)