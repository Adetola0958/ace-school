const mongoose = require('mongoose')
const Schema = mongoose.Schema

const SessionSchema = new Schema ({
    school : {type : Schema.Types.ObjectId, ref : 'SchoolAdmin'},
    name : String,
    current : {type : Boolean, default : false}
})

module.exports = mongoose.model("SchoolSession" , SessionSchema)