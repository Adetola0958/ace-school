const mongoose = require('mongoose')
const Schema = mongoose.Schema

const SubjectSchema = new Schema ({
    school : {type : Schema.Types.ObjectId, ref : 'SchoolAdmin'},
    subjects : []
})

module.exports = mongoose.model("Subject" , SubjectSchema)