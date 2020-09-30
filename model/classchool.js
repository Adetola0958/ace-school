const mongoose = require('mongoose')
const Schema = mongoose.Schema

const ClassSchema = new Schema ({
    school : {type : Schema.Types.ObjectId, ref : 'SchoolAdmin'},
    name : String,
    subjects : []
})

module.exports = mongoose.model("Classchool" , ClassSchema)