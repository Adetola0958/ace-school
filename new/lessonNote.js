const mongoose = require('mongoose')
const Schema = mongoose.Schema

const LessonNoteSchema = new Schema({
    school : {type : Schema.Types.ObjectId, ref : 'schoolAdmin'},
    staff : {type : Schema.Types.ObjectId, ref : 'staff'},
    section : {type : Schema.Types.ObjectId, ref : 'section'},
    subject : { type : String},
    week : { type : String},
    className : { type : String},
    date : {type : Date},
    topic : {type : String},
    materials : {type : String},
    content :{
        contentTopic: String,
        contentDetail: String
    },
    
    presentation : {type : String},
    evaluation : {type : String},
    conclusion : {type : String},
    status: {type : String, default: "Pending"}
})

module.exports = mongoose.model("LessonNote" , LessonNoteSchema)
