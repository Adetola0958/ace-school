const mongoose = require('mongoose') 
const Schema   = mongoose.Schema 

const QuestionSchema = new Schema({
    school : {type : Schema.Types.ObjectId, ref : 'SchoolAdmin'},
    course : { type : Schema.Types.ObjectId, ref : 'Course'},
    question : [
        {
            section : {type : String},
            mainQuestion : {type : String},
            options : {
                optionA : { type : String},
                optionB : { type : String},
                optionC : { type : String},
                optionD : { type : String}
            }, 
            image : {type : String},
            correctOption : {type : String},
            mark : {type : Number},
            questionNumber :{type : Number}
        }
    ]
	
})

module.exports = mongoose.model('Question' , QuestionSchema)