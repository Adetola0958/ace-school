const bcrypt = require("bcryptjs")

const Student = require('../model/student')
const Exam = require('../model/exam')
const Course = require('../model/course')
const Question = require('../model/question')
const Result = require('../model/result')
const ClassSchool = require('../model/classchool')
const SchoolAdmin = require('../model/schoolAdmin')

class App {

    postStudentLogin = async (req , res , next) => {
        try { 
            const {regNumber, password} = req.body
            let student = await Student.findOne({studentID : regNumber})
            console.log(student)
            if (student){
                console.log(student)
                let validUser = await bcrypt.compare(password , student.password) 
                console.log(validUser) 
                if (validUser) {
                    req.session.regNumber = student.studentID
                    res.redirect(303 , '/student/dashboard')
                }else {
                    res.render('student-page' , { error : 'Invalid Login details'})
                }
            }else {
                res.render('student-page' , { error : 'Invalid Login details'})
            }
        }catch(errors) {
            res.render('student-page' , {error : errors})
        }
    }

    getDashboard = async (req , res , next) => {
        try{ 
            if(req.session.regNumber){
                const student = await Student.findOne({studentID : req.session.regNumber})
                const school = await SchoolAdmin.findOne({_id : student.school})
                const className = await ClassSchool.findOne({_id : student.className})
                if(student){
                    res.render('student-dashboard' , { title  : "Dashboard", 
                    student : student, code : school.schoolCode, className : className,
                    dash_active : "active" })
                }else{
                    throw{
                        message : "No Student"
                    }
                }
            }else{
                res.redirect(303, '/student')
            }
        }catch(err){
            res.render("error-page", {error: err})
        }
    }

    getExams = async (req, res, next) => {
        try{ 
            if(req.session.regNumber){
                const student = await Student.findOne({studentID : req.session.regNumber})
                const school = await SchoolAdmin.findOne({_id : student.school})
                const className = await ClassSchool.findOne({_id : student.className})
                const exam = await Exam.find({school : student.school})
                if(exam.length != 0){
                    res.render('student-exam', {exams : exam, student : student,
                        code : school.schoolCode, className : className, exam_active : "active"})
                }else{
                    res.render('student-exam', {noExam : "No Active Exam yet.", 
                    student : student, code : school.schoolCode, className : className,
                    exam_active : "active"})
                }
            }else{
                res.redirect(303, '/student')
            }
        }catch(err){
            res.render("error-page", {error: err})
        }
    }

    getCourses = async(req, res, next) => {
        try{ 
            if(req.session.regNumber){
                const student = await Student.findOne({studentID : req.session.regNumber})
                const school = await SchoolAdmin.findOne({_id : student.school})
                const exam = await Exam.findOne({examCode : req.params.examname, school : student.school})
                if(exam){
                    
                    let studentCourses = student.className
                    const classchool = await ClassSchool.findOne({_id : studentCourses})
                    const courses = await Course.find({school : student.school, className : classchool.name, release : true})
                    if(courses.length != 0){
                        res.render('student-courses', {courses : courses, exam : exam, 
                            student : student, code : school.schoolCode, 
                            className : classchool, exam_active : "active"})
                    }else{
                        res.render('student-courses', {noCourse : "No exam for you yet.", 
                        exam : exam, student : student, code : school.schoolCode, 
                        className : classchool, exam_active : "active"})
                    } 
                }else{
                    throw{
                        message : "No Exam found"
                    }
                }
            }else{
                res.redirect(303, '/student')
            }
        }catch(err){
            res.render("error-page", {error: err})
        }
    }

    startExam = async(req, res, next) => {
        try{ 
            if(req.session.regNumber){
                const student = await Student.findOne({studentID : req.session.regNumber})
                const school = await SchoolAdmin.findOne({_id : student.school})
                const exam = await Exam.findOne({name : req.params.examname, school : student.school})
                if(exam){
                    let studentClass = await ClassSchool.findOne({_id : student.className})
                    let course = req.params.coursename
                    const courseDB = await Course.findOne({className : studentClass.name, 
                        courseName : course, school : student.school})
                    if(courseDB){
                        let result = await Result.findOne({student : student._id})
                        if(result){
                            let mainResult = result.result.find(item => item.courseName === course)
                            if(mainResult){
                                res.render('start-exam', {cantWrite : "You have already written this exam.", 
                                student : student, exam : exam, code : school.schoolCode, 
                                className : studentClass, exam_active : "active"})
                                return
                            }else{
                                let timeStarted = new Date()  
                                timeStarted.setMinutes(timeStarted.getMinutes() + courseDB.duration)
                                req.session.endTime   =  timeStarted.toLocaleString().split(",")[1].trim()
                                res.render('start-exam', {student : student, exam : exam, 
                                    examQuestions : courseDB, code : school.schoolCode, 
                                    className : studentClass, exam_active : "active" })
                            }
                        }
                        else{
                            let timeStarted = new Date()  
                            timeStarted.setMinutes(timeStarted.getMinutes() + courseDB.duration)
                            req.session.endTime   =  timeStarted.toLocaleString().split(",")[1].trim()
                            res.render('start-exam', {student : student, exam : exam, 
                                examQuestions : courseDB, code : school.schoolCode, 
                                className : studentClass, exam_active : "active" })
                        }
                    }else{
                        res.render('start-exam', {cantWrite : "No Exam for this subject yet.", student : student, 
                        exam : exam, code : school.schoolCode, className : studentClass, exam_active : "active"})
                    }
                }else{
                    throw{
                        message : "No Exam found"
                    }
                }
            }else{
                res.redirect(303, '/student')
            }
        }catch(err){
            res.render("error-page", {error: err})
        }
    }

    examRunning =  async (req , res , next ) => {
        try{ 
		    if(req.session.regNumber){
                const student = await Student.findOne({studentID : req.session.regNumber})
                const school = await SchoolAdmin.findOne({_id : student.school})
                const exam = await Exam.findOne({name : req.params.examname, school : student.school})
                
                let studentClass = await ClassSchool.findOne({_id : student.className})
				let course = req.params.coursename
                const courseDB = await Course.findOne({className : studentClass.name, 
                    courseName : course, school : student.school})
				if ( courseDB ) { 
					let currentQuestion 
					if (req.query.question){
						currentQuestion = Number(req.query.question)
					}else {
						currentQuestion = 1
					}
                    let question = await Question.findOne({course : courseDB._id })
                    console.log(question.question[0])
					if(question){
                        let currentTime = new Date()
                        res.render("exam-mode" , { 
                            student : student,
                            exam : exam , 
                            questions : question,
                            course : courseDB ,  
                            currentQuestion : question.question[currentQuestion - 1] ,
                            currentTime :currentTime.toLocaleString().split(",")[1].trim(),
                            endTime : req.session.endTime,
                            code : school.schoolCode,
                            className : studentClass
                        })
                    }else{
                        res.render("exam-mode", {student : student, 
                            noQuestion : "No questions has been set for this exam yet.",
                            code : school.schoolCode, className : studentClass})
                    }
					
				}else {
					throw {
						message : "This course is not found"
					}
				}
            }else{
                res.redirect(303, '/student')
            }
        }catch(err){
            res.render("error-page", {error: err})
        }
	}

    markExam = async(req , res , next) => { 
        try{ 
            if(req.session.regNumber){
                const {response , courseName, className} = req.body 
                const validStudent = await Student.findOne({studentID: req.session.regNumber})
                
                let writtenCourse = await Course.findOne({className : className, courseName : courseName,
                                school : validStudent.school})  
                let questions = await Question.findOne({course : writtenCourse._id }) 
                let mainQuestion = questions.question
                
                function markExam(question , response) {
                    try {
                        if (!(Array.isArray(question) && Array.isArray(response))) {
                            throw {
                                message : "Your exam is having issues submitting to the server"
                            }
                        } 
                        let score = 0 
                        let current
                        question.map((q , index)=> {
                            current = response.find(option => option.id === String(q._id) ) 
                            if (current){
                                let markOption = q.correctOption === current.value ? q.mark : 0
                                score += markOption
                            }	
                        })
                        return score 
                    }catch(error) {
                        let msg = error.message
                        return msg
                    }
                } 
                let studentScore = markExam(mainQuestion , response)
                let studentResult = await Result.findOne({student : validStudent._id})
                if(studentResult){
                    let fromBody = {
                        courseName : courseName,
                        score : studentScore,
                        option : response
                    }
                    Result.findOneAndUpdate({studentNo : validStudent.regNumber}, {
                        $addToSet : {
                            result : [fromBody] }
                    }, {new : true, useAndModify : false}, (err , item) => {
                        if(err){
                            res.status(500)
                            return
                        }else {
                            res.json({message : "Redirecting..."})
                        }
                    })	
                }else{
                    const result = await new Result({
                        student : validStudent._id,
                        school : validStudent.school,
                        className : className,
                        result : [{
                            courseName : courseName,
                            score : studentScore,
                            option : response
                        }]
                    })
                    let saveExamination = await result.save()
                    if (saveExamination){
                        res.json({message : "Redirecting..."})
                    }else {
                        throw new Error("Problem with database query")
                    }
                }
            }
        }catch(err){
            res.render("error-page", {error: err})
        }	
    }

    getCompletePage = async (req, res, next) => {
        try{ 
            if(req.session.regNumber){
                let student = await Student.findOne({studentID : req.session.regNumber})
                delete req.session.regNumber
                res.render('complete-exam', {student : student})
            }else{
                res.redirect(303, '/student')
            }
        }catch(err){
            res.render("error-page", {error: err})
        }
    }

    getResults = async(req, res, next) => {
        try{ 
            if(req.session.regNumber){
                let student = await Student.findOne({studentID: req.session.regNumber})
                const school = await SchoolAdmin.findOne({_id : student.school})
                const className = await ClassSchool.findOne({_id : student.className})
                let result = await Result.findOne({student : student._id, released : true})
                if(result){
                    res.render('student-result', {student : student, results : result,
                        code : school.schoolCode, className : className})
                }else{
                    res.render('student-result', {student : student, noResult : "None of your results has been released yet.",
                        code : school.schoolCode, className : className})
                }
            }else{
                res.redirect(303, '/student')
            }
        }catch(err){
            res.render("error-page", {error: err})
        }
    }

    settingsPage = async(req, res, next) => {
        try{
            if(req.session.regNumber){
                const student = await Student.findOne({studentID : req.session.regNumber})
                res.render('student-settings', {title : "Settings",
                    student : student, success : req.flash('success')})
            }else{
                res.redirect(303, '/student-page')
            }
        }catch(err){
            res.render("error-page", {error: err})
        }
    }

    postSettings = async(req, res, next) => {
        try{
            if(req.session.regNumber){
                const {oldPassword, newPassword} = req.body
                const student = await Student.findOne({studentID : req.session.regNumber})
                let validPassword = await bcrypt.compare(oldPassword , student.password)
                if(validPassword){
                    let harshedPassword = await bcrypt.hash(newPassword , 10)
                    Student.findByIdAndUpdate(student._id, {
                        password : harshedPassword
                    }, {new : true, useFindAndModify : false}, (err, item) => {
                        if(err) {
                            console.log(err)
                        }else {
                            req.flash('success', 'Password changed successfully.')
                            res.redirect(303, "/student/settings")
                            return
                        }
                    })
                }else{
                    res.render("student-settings", {error : "Old Password is wrong!", title : "Settings",
                    student : student, success : req.flash('success')})
                }
            }else{
                res.redirect(303, '/student-page')
            }
        }catch(err) {
            res.render("error", {error: err})
        }
    }

    getLogout = (req , res , next ) => {
        try {
            if (req.session.regNumber) {
                delete req.session.regNumber
                res.redirect(303 , '/student')
            }else {
                throw new Error("Problem signing out. We will handle this shortly")
            }
        }catch(error) {
            res.render("error-page", {error: err})
        }
    }
}

const returnApp = new App()

module.exports = returnApp 