const SchoolAdmin = require('../model/schoolAdmin')
const Staff = require("../model/staff")
const Exam = require('../model/exam')
const Course = require('../model/course')
const Question = require('../model/question')
const Result = require('../model/result')
const Student = require('../model/student')
const Attendance = require('../model/attendance')
const LessonNote = require('../model/lessonNote')

const FileHandler = require('./file')

class App {

    postStaffLogin = async (req , res , next) => {
        try { 
            
            let validStaff = await Staff.findOne({staffID : req.body.code, email : req.body.email , password : req.body.password})
            if(validStaff){
                req.session.staffCode = validStaff.staffID
                res.redirect(303 , '/staff/dashboard')
            }else{
                res.render('staff-page' , { error : 'Invalid Login details'})
            } 
            
        }catch(errors) {
            res.render('staff-page' , {error : errors})
        }
    }

    getDashboard = async (req , res , next) => {
        if(req.session.staffCode){
            try{
                let staff = await Staff.findOne({staffID : req.session.staffCode})
                let school = await SchoolAdmin.findOne({_id : staff.school})
                if(staff){
                    res.render('staff-dashboard' , { title  : "Dashboard", staff : staff, 
                    code : school.schoolCode, dash_active : "active" })
                }else{
                    throw{
                        message : "No Staff"
                    }
                }
            }catch(err){
                res.json(err.message)
            }
        }else{
            res.redirect(303, '/staff')
        }
    }

    getExams = async (req, res, next) => {
        if(req.session.staffCode){
            try{
                const staff = await Staff.findOne({staffID : req.session.staffCode})
                const school = await SchoolAdmin.findOne({_id : staff.school})
                const exam = await Exam.find({school : school._id})
                if(exam.length != 0){
                    res.render('staff-exam', {exams : exam, staff : staff, 
                        code : school.schoolCode, exam_active : "active"})
                }else{
                    res.render('staff-exam', {noExam : "No Exam has been created yet.", 
                    code : school.schoolCode, staff : staff, exam_active : "active"})
                }
            }catch(err){
                res.json(err)
            }
        }else{
            res.redirect(303, '/staff')
        }
    }

    getCourses = async(req, res, next) => {
        if(req.session.staffCode){
            try{
                const staff = await Staff.findOne({staffID : req.session.staffCode})
                const school = await SchoolAdmin.findOne({_id : staff.school})
                const exam = await Exam.findOne({name : req.params.examname, school : school._id})
                if(exam){
                    let staffCourses = staff.class.subject
                    res.render('check-courses', {courses : staffCourses, exam : exam, 
                        staff: staff, exam_active : "active",
                        code : school.schoolCode})
                }else{
                    throw{
                        message : "No Exam found"
                    }
                }
            }catch(err){
                res.json({message : err.message, status : err.status})
            }
        }else{
            res.redirect(303, '/staff')
        }
    }

    getCourseClass = async(req, res, next) => {
        if(req.session.staffCode){
            try{
                const staff = await Staff.findOne({staffID : req.session.staffCode})
                const school = await SchoolAdmin.findOne({_id : staff.school})
                const exam = await Exam.findOne({name : req.params.examname, school : school._id})
                if(exam){
                    let staffClasses = staff.class.className
                    let course = req.params.coursename
                    res.render('check-classes', {classes : staffClasses, exam : exam, 
                        course : course, staff : staff, code : school.schoolCode, exam_active : "active"})
                }else{
                    throw{
                        message : "No Exam found"
                    }
                }
            }catch(err){
                res.json({message : err.message, status : err.status})
            }
        }else{
            res.redirect(303, '/staff')
        }
    }

    startCourseQuestions = async(req, res, next) => {
        if(req.session.staffCode){
            try{
                const staff = await Staff.findOne({staffID : req.session.staffCode})
                const school = await SchoolAdmin.findOne({_id : staff.school})
                const exam = await Exam.findOne({name : req.params.examname, school : school._id})
                if(exam){
    
                    let course = req.params.coursename
                    let className = req.params.classname
                    const courseDB = await Course.findOne({examiner : staff._id, 
                        courseName : course, className : className, school : school._id})
                    res.render('start-question', {staff : staff, exam : exam, 
                        examQuestions : courseDB, code : school.schoolCode, 
                        exam_active : "active", courseName : course, className : className })
                }else{
                    throw{
                        message : "No Exam found"
                    }
                }
            }catch(err){
                res.json({message : err.message, status : err.status})
            }
        }else{
            res.redirect(303, '/staff')
        }
    }

    postCourseQuestion = async(req, res, next) => {
        if(req.session.staffCode){
			try {
                const examiner = await Staff.findOne({staffID : req.session.staffCode})
                const school = await SchoolAdmin.findOne({_id : examiner.school})
                const exam = await Exam.findOne({name : req.params.examname, school : school._id})
                const className = req.params.classname
                const courseName = req.params.coursename
                const {instructions, duration} = req.body
                const course = await new Course({
                    exam : exam._id,  
                    examiner : examiner._id , 
                    instruction : instructions,
                    duration : duration, 
                    className : className, 
                    courseName : courseName,
                    school : school._id
                })
                const saveCourse = await course.save()
                if ( saveCourse ) { 
                    let redirectUrl = '/staff/exam/' + req.params.examname + '/courses/' + courseName + '/' + className
                    res.redirect(redirectUrl)
                    return 
                }else {
                    throw {
                        message : "Unable to save this Course"
                    }
                    return 
                }
				
			}catch(error) {
				res.status(500).send(error.message)
				return
			}
		}else {
			res.redirect(303, '/staff')
		}
    }

    setQuestions = async (req, res, next) => {
        if(req.session.staffCode){
            try{
                const staff = await Staff.findOne({staffID : req.session.staffCode})
                const school = await SchoolAdmin.findOne({_id : staff.school})
                const exam = await Exam.findOne({name : req.params.examname, school : school._id})
                
                const course = await Course.findOne({courseName : req.params.coursename, 
                    className : req.params.classname, examiner : staff._id})
                res.render('set-questions', {course : course, exam : exam, staff : staff,
                code : school.schoolCode, exam_active : "active"})
            }catch(err){
                res.send(err)
            }
            
        }else{
            res.redirect(303, '/staff')
        }
    }

    postSetQuestions =  async ( req , res , next ) => {
		if(req.session.staffCode){
            try {
                const staff = await Staff.findOne({staffID : req.session.staffCode})
                const school = await SchoolAdmin.findOne({_id : staff.school})
                const exam = await Exam.findOne({name : req.params.examname, school : staff.school})
                const course = await Course.findOne({courseName : req.params.coursename, 
                    className : req.params.classname, examiner : staff._id})
                const availableQuestion = await Question.findOne({course : course._id, school : staff.school})
                const {question, optionA , optionB , optionC , optionD , correctOption , mark, questionNumber} = req.body 
                
                FileHandler.createDirectory("./public/uploads/schools/" + school.schoolCode + "/exam-" + exam.examCode + "/" + req.params.coursename + "-" + req.params.classname)
                
                if(availableQuestion){
                    if(req.file){
                        let originalName = req.file.filename
                        let bodywithImage = {
                            mainQuestion : question,
                            options : {
                                optionA : optionA , 
                                optionB : optionB , 
                                optionC : optionC , 
                                optionD : optionD 
                            } , 
                            image : originalName,
                            correctOption : correctOption , 
                            mark : mark ,
                            questionNumber : questionNumber
                        }
                        Question.findByIdAndUpdate(availableQuestion._id, {
                            $addToSet : {
                                question : [bodywithImage] }
                        }, {new : true, useAndModify : false}, (err , item) => {
                            if(err){
                                res.status(500)
                                return
                            }else {
                                FileHandler.moveFile(originalName , "./public/uploads/profile" , "./public/uploads/schools/" + school.schoolCode + "/exam-" + exam.examCode + "/" + req.params.coursename + "-" + req.params.classname + "/") 
                                req.flash('success', `Question ${questionNumber} has been saved successfully`)
                                let redirectUrl = '/staff/exam/' + req.params.examname + '/courses/' + req.params.coursename + '/' + req.params.classname + '/questions'
                                res.redirect(redirectUrl)
                            }
                        })
                    }else {
                        let bodywithoutImage = {
                            mainQuestion : question,
                            options : {
                                optionA : optionA , 
                                optionB : optionB , 
                                optionC : optionC , 
                                optionD : optionD 
                            } , 
                            correctOption : correctOption , 
                            mark : mark ,
                            questionNumber : questionNumber
                        }
                        Question.findByIdAndUpdate(availableQuestion._id, {
                            $addToSet : {
                                question : [bodywithoutImage] }
                        }, {new : true, useAndModify : false}, (err , item) => {
                            if(err){
                                res.status(500)
                                return
                            }else {
                                req.flash('success', `Question ${questionNumber} has been saved successfully`)
                                let redirectUrl = '/staff/exam/' + req.params.examname + '/courses/' + req.params.coursename + '/' + req.params.classname + '/questions'
                                res.redirect(redirectUrl)
                            }
                        })
                    }
                }else{
                    if(req.file){
                        let originalName = req.file.filename 
                        const que = await new Question({
                            school : school._id,
                            course : course._id, 
                            question : [{
                                mainQuestion : question,
                                options : {
                                    optionA : optionA , 
                                    optionB : optionB , 
                                    optionC : optionC , 
                                    optionD : optionD 
                                },
                                image : originalName,
                                correctOption : correctOption , 
                                mark : mark ,
                                questionNumber : questionNumber
                            }] 
                        })
                        const saveQuestion = await que.save() 
                        if (saveQuestion) {
                            FileHandler.moveFile(originalName , "./public/uploads/profile" , "./public/uploads/schools/" + school.schoolCode + "/exam-" + exam.examCode + "/" + req.params.coursename + "-" + req.params.classname + "/") 
                            req.flash('success', `Question ${questionNumber} has been saved successfully`)
                            let redirectUrl = '/staff/exam/' + req.params.examname + '/courses/' + req.params.coursename + '/' + req.params.classname + '/questions'
                                res.redirect(redirectUrl)
                        }else {
                            throw {
                                message : "Unable to save the student"
                            }
                        }
                    }else {
                        const que = await new Question({
                            school : school._id,
                            course : course._id, 
                            question : [{
                                mainQuestion : question,
                                options : {
                                    optionA : optionA , 
                                    optionB : optionB , 
                                    optionC : optionC , 
                                    optionD : optionD 
                                },
                                correctOption : correctOption , 
                                mark : mark ,
                                questionNumber : questionNumber
                            }] 
                        })
                        const saveQuestion = await que.save() 
                        if (saveQuestion) {
                            req.flash('success', `Question ${questionNumber} has been saved successfully`)
                            let redirectUrl = '/staff/exam/' + req.params.examname + '/courses/' + req.params.coursename + '/' + req.params.classname + '/questions'
                            res.redirect(redirectUrl)
                        }else {
                            throw {
                                message : "Unable to save the student"
                            }
                        }
                    }
                }
            }catch(error) {
                res.status(500).send(error.message)
            }
		}else{
			res.redirect(303, '/staff')
		}
    }
    
    checkQuestions = async (req, res, next) => {
        if(req.session.staffCode){
            try{
                const staff = await Staff.findOne({staffID : req.session.staffCode})
                const school = await SchoolAdmin.findOne({_id : staff.school})
                const exam = await Exam.findOne({name : req.params.examname, school : school._id})
                
                const course = await Course.findOne({courseName : req.params.coursename, 
                    className : req.params.classname, examiner : staff._id})
                if(course){
                    const question = await Question.findOne({course : course._id, school : school._id})
                    if(question){
                        res.render('questions', {questions : question, staff : staff, exam : exam,
                            course : course, success : req.flash('success'), 
                            code : school.schoolCode, exam_active : "active"})
                    }else{
                        res.render('questions', {noQue : `You haven't set your questions`, staff : staff,
                        exam : exam, course : course, success : req.flash('success'), 
                        code : school.schoolCode, exam_active : "active"})
                    }
                }else{
                    throw {
                        message : "No Course found"
                    }
                }
            }catch(err){
                res.send(err.message)
            }
        }else{
            res.redirect(303, '/staff')
        } 
    }

    deleteQuestion = async (req, res, next) => {
        if(req.session.staffCode){
            try{
                const staff = await Staff.findOne({staffID : req.session.staffCode})
                const course = await Course.findOne({courseName : req.params.coursename, 
                    className : req.params.classname, examiner : staff._id})
                const mainQuestion = await Question.findOne({course : course._id})
				if(mainQuestion){
                    let question = mainQuestion.question
                    let mapIt = question.find( elem => elem._id == req.params.questionID)
                    Question.findByIdAndUpdate(mainQuestion._id, {
                        $pull : {
                            question : mapIt }
                    }, {new : true, useAndModify : false}, (err , item) => {
                        if(err){
                            res.status(500)
                            return
                        }else {
                            req.flash('success', `Question deleted successfully`)
                            let redirectUrl = '/staff/exam/' + req.params.examname + '/courses/' + req.params.coursename + '/' + req.params.classname + '/questions'
                            res.redirect(303, redirectUrl)
                        }
                    })
                }else{
                    throw{
                        message : "Error in deleting."
                    }
                }	
			}catch(err){
				res.json(err.message)
			}
        }else{
            res.redirect(303, '/staff')
        }
    }

    publishQuestions = async (req, res, next) => {
        if(req.session.staffCode){
            let staff = await Staff.findOne({staffID : req.session.staffCode})
            let course = await Course.findOne({examiner : staff._id, 
                courseName : req.params.coursename, className : req.params.classname})
            if(course){
                let courseID = course._id
                Course.findByIdAndUpdate(courseID, {
                    publish : true,
                }, {new : true, useAndModify : false}, (err , item) => {
                    if(err){
                        res.status(500)
                        return
                    }else {
                        let redirectUrl = '/staff/exam/' + req.params.examname + '/courses/' + req.params.coursename + '/' + req.params.classname
                        res.redirect(redirectUrl)
                    }
                })	
            }
        }else{
            res.redirect(303, '/staff')
        }
    }

    checkStudentsResults = async (req, res, next) => {
        if(req.session.staffCode){
            try{
                const staff = await Staff.findOne({staffID : req.session.staffCode})
                const school = await SchoolAdmin.findOne({_id : staff.school})
                let courseName = req.params.coursename
                let className = req.params.classname
                let result = await Result.find({className : className, school : staff.school})
                const students = await Student.find()

                let studentName = {}
                let studentID = {}
                students.map(student => {
                    studentName[student._id] = student.firstName + " " + student.lastName
                    studentID[student._id] = student.studentID
                })
                
                if(result.length != 0){
                    res.render("check-results", {staff : staff, results : result, 
                        courseName : courseName, code : school.schoolCode, 
                        studentName : studentName, studentID : studentID, exam_active : "active"})
                }else{
                    res.render("check-results", {staff : staff, code : school.schoolCode,
                        noResult : "No student have written the exam yet.", exam_active : "active"})
                }
            }catch(err){
                res.send(err)
            }
        }else{
            res.redirect(303, '/staff')
        }
    }

    getAttendance = async(req, res, next) => {
        if(req.session.staffCode){
            try{
                const staff = await Staff.findOne({staffID : req.session.staffCode})
                const school = await SchoolAdmin.findOne({_id : staff.school})
                if(staff){
                    res.render('attendance', {staff: staff, code : school.schoolCode})
                }else{
                    throw{
                        message : "Attendance page not found"
                    }
                }
            }catch(err){
                res.json({message : err.message, status : err.status})
            }
        }else{
            res.redirect(303, '/staff')
        }
    }

    getMarkAttendance = async(req, res, next) => {
        if(req.session.staffCode){
            try{
                const staff = await Staff.findOne({staffID : req.session.staffCode})
                const school = await SchoolAdmin.findOne({_id : staff.school})
                const student = await Student.find({})
                if(student.length != 0){
                    res.render('mark-attendance', {staff: staff, students : student, code : school.schoolCode})
                }else {
                    res.render('mark-attendance', {noStudent : 'No Student Found'})
                }
            }catch(err){
                res.json({message : err.message, status : err.status})
            }
        }else{
            res.redirect(303, '/staff/attendance')
        }
    }

    postMarkAttendance = async(req, res, next) => {
        if(req.session.staffCode) {
            try{
                const{studentID, date, mark} = req.body
                const staff = await Staff.findOne({staffID : req.session.staffCode})
                const student = await Student.findOne({_id : studentID})
                const school = await SchoolAdmin.findOne({_id : staff.school})
                const attendance = await Attendance.findOne({student : studentID})
                
                if(!attendance){
                    const markedAttendance = new Attendance({
                        student : studentID,
                        attendant : [
                            {
                                date : date,
                                mark : mark
                            }
                        ]
                    })
                    const newAttendance = await markedAttendance.save()
                    if(newAttendance){
                        res.json({message : "teghdhjde"})
                        return
                    }else{
                        let redirectUrl = "/staff/attendance"
                        res.redirect(303, redirectUrl, {staff : staff, student : student})
                    }
                }else{
                    let formBody = [
                        {
                            date : date,
                            mark : mark
                        }
                    ]
                    Attendance.findByIdAndUpdate(attendance._id, {
                        $addToSet : {attendant : formBody}
                    }, {new : true, useAndModify : false}, (err, item) => {
                        if(err) {
                            console.log(err)
                        }else {
                            res.json({message : ''})
                            return
                        }
                    })
                }
            }catch(err){
                res.json({message : err.message, status : err.status})
            }
        }else{
            res.redirect(303, '/attendance')
        }
    }
    getCheckAttendance = async(req, res, next) => {
        if(req.session.staffCode){
            try{
                const staff = await Staff.findOne({staffID : req.session.staffCode})
                const student = await SchoolAdmin.find({})
                const attendance = await Attendance.findById({_id : req.params.attendanceId})
                if(attendance) {
                    res.render('check-attendance', {staff: staff, student : student, attendance : attendance})
                }else {
                    throw{
                        message: "Check attendance page could not be found"
                    }
                }
            }catch(err){
                res.json({message : err.message, status : err.status})
            }
        }else{
            res.redirect(303, '/attendance')
        }
    }

    getLessonNotePage = async(req, res, next) => {
        if(req.session.staffCode){
            try{
                const staff = await Staff.findOne({staffID : req.session.staffCode})
                const school = await SchoolAdmin.findOne({_id : staff.school})
                if(staff){
                    res.render('lessonNote', {staff: staff, code : school.schoolCode})
                }else{
                    throw{
                        message : "Lesson Note page not found"
                    }
                }
            }catch(err){
                res.json({message : err.message, status : err.status})
            }
        }else{
            res.redirect(303, '/staff')
        }
    }
    MakeLessonNote = async (req, res, next) => {
        if(req.session.staffCode){
            try{
                const staff = await Staff.findOne({staffID : req.session.staffCode})
                const school = await SchoolAdmin.findOne({_id : staff.school})
                if(staff){
                    res.render('make-lesson-note', {staff: staff, code : school.schoolCode})
                }else{
                    throw{
                        message : "Lesson Note page not found"
                    }
                }

            }catch(err){
                res.json(err.message)
            }
        }
    }
    PostLessonNote = async(req, res, next) =>{
        if(req.session.staffCode){
            try{
                const staff = await Staff.findOne({staffID : req.session.staffCode})
                const school = await SchoolAdmin.findOne({_id : staff.school})
                if(staff){
                    const{subject,week, className, date, topic, materials, contentTopic, contentDetail, presentation,evaluation,conclusion} = req.body
                        let lessonNote =await new LessonNote({
                            school: school._id,
                            staff: staff._id,
                            subject: subject,
                            className: className,
                            date: date,
                            week: week,
                            topic: topic,
                            materials: materials,
                            content : {
                                contentTopic: contentTopic,
                                contentDetail: contentDetail
                            },
                            presentation : presentation,
                            evaluation : evaluation,
                            conclusion : conclusion
                        })
                        let ret = await lessonNote.save()
                        if(ret){
                            res.render('make-lesson-note', { staff: staff, code : school.schoolCode, message: "Lesson Note has been Successfully Added"})
                        }else{
                            res.render('make-lesson-note', {staff: staff, code : school.schoolCode, message: "There was a problem adding Lesson Note"})
                        }
                }else{
                    throw{
                        message : "Cannot add Lesson Note"
                    }
                }
            }catch(err){
                    res.json(err.message)
            }
        }
    }
    getAllLessonNote = async (req, res, next) => {
        if(req.session.staffCode){
            try{
                const staff = await Staff.findOne({staffID : req.session.staffCode})
                const school = await SchoolAdmin.findOne({_id : staff.school})
                const lessonNote = await LessonNote.find({school : staff.school, staff: staff._id})
                if(lessonNote.length > 0){
                    res.render("view-lesson-note", {staff: staff, code : school.schoolCode, lessonNotes : lessonNote})
                }else{
                    throw{
                        message : "Params not found."
                    }
                }
            }catch(err){
                res.send(err)
            }
        }else{
            res.redirect(303, '/staff')
        }
    }

    getSingleLessonNote = async (req, res, next) => {
        if(req.session.staffCode){
            try{
                const staff = await Staff.findOne({staffID : req.session.staffCode})
                const school = await SchoolAdmin.findOne({_id : staff.school})
                const singleLessonNote = await LessonNote.findOne({_id : req.params.lessonNote})
                if(singleLessonNote){
                    res.render("view-single-lesson-note", {staff: staff, code : school, singleLessonNote : singleLessonNote })
                }else{
                    throw{
                        message : "Session not found."
                    }
                }
            }catch(err){
                res.send(err)
            }
        }else{
            res.redirect(303, '/staff')
        }
    }


    getLogout = (req , res , next ) => {
        try {
            if (req.session.staffCode) {
                delete req.session.staffCode
                res.redirect(303 , '/staff')
            }else {
                throw new Error("Problem signing out. We will handle this shortly")
            }
        }catch(error) {
            res.status(400).send(error)
        }
    }
}

const returnApp = new App()

module.exports = returnApp 