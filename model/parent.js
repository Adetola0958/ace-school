const mongoose = require('mongoose') 
const Schema   = mongoose.Schema

const ParentSchema = new Schema ({
    school : {type : Schema.Types.ObjectId, ref : 'SchoolAdmin'},
    parentID : {type : String},
    name : {type : String},
    password : {type : String},
    email : {type : String},
    number : {type: String},
    gender : {type : String},
    role : {type : String},
    ward :[
        {
            child:{type : Schema.Types.ObjectId, ref : 'Student'}
        }
    ],
    profilePhoto : {type : String},
})

ParentSchema.virtual('parent').get(function() {
	return `${this._id}`
})

module.exports = mongoose.model("Parent" , ParentSchema)