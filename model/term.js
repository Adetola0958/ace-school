const mongoose = require('mongoose')
const Schema = mongoose.Schema

const TermSchema = new Schema ({
    school : {type : Schema.Types.ObjectId, ref : 'SchoolAdmin'},
    session : {type : Schema.Types.ObjectId, ref : 'SchoolSession'},
    name : String,
    startDate : Date,
    endDate : Date,
})

module.exports = mongoose.model("Term" , TermSchema)