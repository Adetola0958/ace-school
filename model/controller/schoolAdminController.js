const fs = require('fs')
const path = require('path')
const fileName = __filename
const dirName = path.dirname(fileName)

const FileHandler = require('./file')
const GenerateAccount = require('./accountGenerator')
const bcrypt = require('bcryptjs')

const SchoolAdmin = require('../model/schoolAdmin')
const Session = require('../model/session')
const Term = require('../model/term')
const Subject = require('../model/subject')
const Staff = require('../model/staff')
const Student = require('../model/student')
const Exam = require('../model/exam')
const Course = require('../model/course')
const ClassSchool = require('../model/classchool')
const Result = require('../model/result')
const Question = require('../model/question')
const Attendance = require('../model/attendance')
const LessonNotes = require('../model/lessonNote')

class App {

    getSchoolLogin = (req, res, next) => {
        res.render('school-login', {title : "School Login"})
    }

    postSchoolAdminLogin = async (req , res , next) => {
        try { 
            const {schoolCode, email, password} = req.body
            let school = await SchoolAdmin.findOne({schoolCode : schoolCode, schoolEmail : email})  
            if(school){
                let validSchool = await bcrypt.compare(password , school.password)
                if (validSchool) {
                    req.session.schoolCode = school.schoolCode
                    res.redirect(303, '/school/dashboard')
                }else {
                    res.render('school-login' , { error : 'Invalid Credentials'})
                }
            }else {
                res.render('school-login' , { error : 'Invalid Credentials'})
            }  
        }catch(errors) {
            res.render('school-login' , {error : 'Invalid Credentials'})
        }
    }

    getSchoolSignup = (req, res, next) => {
        res.render('school-signup', {title : "Create an account"})
    }
    
    getForgotPassword = (req, res, next) => {
        res.render('forgot_password', {title : "Password Reset"})
    }

    postSchoolAdminSignUp = async (req, res, next) => {
        try{
            const {schoolName, schoolNumber, password, schoolEmail, 
                schoolAdminName, address, state, country} = req.body

            const schoolPass = await bcrypt.hash(password , 10)
            
            const schoolAdmin = await new SchoolAdmin({
                schoolName : schoolName ,  
                schoolEmail : schoolEmail , 
                schoolNumber : schoolNumber,
                schoolAdmin : schoolAdminName, 
                password : schoolPass, 
                address  : address,
                state : state,
                country : country
            })
            const saveAdmin = await schoolAdmin.save()
            if ( saveAdmin ) { 
                let redirectUrl = "/school/verify/" + saveAdmin._id
                res.redirect(redirectUrl)
                return 
            }else{
                throw{
                    message : "Unable to save the school admin"
                }
            }
        }catch(err){
            res.render("school-sign-up", {error: "Invalid Credentials"})
        }
    }

    verifyEmail = async (req, res, next) => {
        try{
            if(req.params.schoolID){
                const schoolAdmin = await SchoolAdmin.findOne({_id : req.params.schoolID})
                if(schoolAdmin){
                    res.render('verify-page', {schoolAdmin : schoolAdmin, title : "Verify Email"})
                }else{
                    throw{
                        message : "You can't access this page."
                    }
                }
            }
        }catch(err){
            res.render("error-page", {error: Error})
        }
    }

    getDashboard = async (req , res , next) => {
        try{ 
            if(req.session.schoolCode){
                const schoolAdmin = await SchoolAdmin.findOne({schoolCode : req.session.schoolCode})
                const student = await Student.find({school : schoolAdmin._id})
                const classchool = await ClassSchool.find({school : schoolAdmin._id})
                const staff = await Staff.find({school : schoolAdmin._id})
                const exams = await Exam.find({school : schoolAdmin._id})
                const progress = await Course.find({school : schoolAdmin._id, release : true})
                res.render('school-admin-dashboard' , { title  : "Admin", schoolAdmin : schoolAdmin, students : student.length,
                        classes : classchool.length, exams : exams.length, 
                        progress : progress.length, staffs : staff.length, dash_active : "active"})
            }else{
                res.redirect(303, '/school')
            }
        }catch(err){
            res.render("error-page", {error: err})
        }
    }

    getSchoolProfile = async (req, res, next) => {
        try{ 
            if(req.session.schoolCode){
                const schoolAdmin = await SchoolAdmin.findOne({schoolCode : req.session.schoolCode})
                res.render('school-profile', {title : 'Profile', schoolAdmin : schoolAdmin, 
                    error : req.flash('error'), success : req.flash('success')})
            }else{
                res.redirect(303, '/school')
            }
        }catch(err){
            res.render("error-page") 
        }
    }

    updateLogo = async (req, res, next) => {
        try{
            if(req.session.schoolCode){
                const schoolAdmin = await SchoolAdmin.findOne({schoolCode : req.session.schoolCode})
                if(req.file){
                    FileHandler.createDirectory("./public/uploads/schools/" + req.session.schoolCode + "/logo/")
                    SchoolAdmin.findByIdAndUpdate(schoolAdmin._id, {
                        logo : req.file.filename
                    }, {new : true, useFindAndModify : false}, (err , item) => {
                        if(err){
                            console.log(err)
                        }else{

                            FileHandler.moveFile(req.file.filename , "./public/uploads/profile" , "./public/uploads/schools/" + req.session.schoolCode + "/logo/") 

                            req.flash('success', 'Logo changed successfully')
                            res.redirect('/school/profile')
                        }
                    })
                }else{
                    req.flash('error', 'You need to upload an Image.')
                    res.redirect('/school/profile')
                }
            }else{
                res.redirect(303, '/school')
            }
        }catch(err){
            res.render("error-page", {error: err})
        }
    }

    settingsPage = async(req, res, next) => {
        try{
            if(req.session.schoolCode){
                const schoolAdmin = await SchoolAdmin.findOne({schoolCode : req.session.schoolCode})
                res.render('admin-settings', {title : "Settings",
                    schoolAdmin : schoolAdmin, success : req.flash('success')})
            }else{
                res.redirect(303, '/school')
            }
        }catch(err){
            res.render("error-page", {error: err})
        }
    }

    postSettings = async(req, res, next) => {
        try{
            if(req.session.schoolCode){
                const {oldPassword, newPassword} = req.body
                const schoolAdmin = await SchoolAdmin.findOne({schoolCode : req.session.schoolCode})
                let validPassword = await bcrypt.compare(oldPassword , schoolAdmin.password)
                if(validPassword){
                    let harshedPassword = await bcrypt.hash(newPassword , 10)
                    SchoolAdmin.findByIdAndUpdate(schoolAdmin._id, {
                        password : harshedPassword
                    }, {new : true, useFindAndModify : false}, (err, item) => {
                        if(err) {
                            console.log(err)
                        }else {
                            req.flash('success', 'Password changed successfully.')
                            res.redirect(303, "/school/settings")
                            return
                        }
                    })
                }else{
                    res.render("admin-settings", {error : "Old Password is wrong!", title : "Settings",
                    schoolAdmin : schoolAdmin, success : req.flash('success')})
                }
            }else{
                res.redirect(303, '/student')
            }
        }catch(err) {
            res.render("error-page", {error: err})
        }
    }

    getSessionPage = async(req, res, next) => {
        try{ 
            if(req.session.schoolCode){
                const schoolAdmin = await SchoolAdmin.findOne({schoolCode : req.session.schoolCode})
                const session = await Session.find({school : schoolAdmin._id})
                res.render('school-sessions', {title : "Sessions", session_active : "active",
                schoolAdmin : schoolAdmin, session : session, success : req.flash('success')})
            }else{
                res.redirect(303, '/school')
            }
        }catch(err){
            res.render("error-page", {error: err})
        }
    }

    postSession = async(req, res, next) => {
        try{
            if(req.session.schoolCode){
                const schoolAdmin = await SchoolAdmin.findOne({schoolCode : req.session.schoolCode})
    
                const {name} = req.body
                
                const session = await new Session({
                    name : name,
                    school : schoolAdmin._id,
                })
                const saveSession = await session.save()
                if ( saveSession ) { 
                    res.redirect('/school/session')
                    return 
                }else {
                    throw {
                        message : "Unable to save the exam"
                    }
                    return 
                }
            }else{
                res.redirect(303, '/school')
            }
        }catch(err){
            res.render("error-page", {error: err})
        }
    }

    makeCurrent = async (req, res, next) => {
        try{
            if(req.session.schoolCode){
                const schoolAdmin = await SchoolAdmin.findOne({schoolCode : req.session.schoolCode})
                Session.updateMany({school : schoolAdmin._id}, {
                        current : false
                }, {new : true, useAndModify : false}, (err , item) => {
                    if(err){
                        res.status(500)
                        return
                    }else {
                        Session.findByIdAndUpdate(req.params.sessionID, {
                            current : true
                        }, {new : true, useFindAndModify : false}, (err, item) => {
                            if(err){
                                console.log(err)
                            }
                            else{
                                let redirectUrl = '/school/session'
                                res.redirect(303, redirectUrl)
                            }
                        })
                    }
                })	
            }else{
                res.redirect(303, '/school')
            }
        }catch(err){
            res.render("error-page", {error: err})
        }
    }

    getTermPage = async(req, res, next) => {
        try{ 
            if(req.session.schoolCode){
                const schoolAdmin = await SchoolAdmin.findOne({schoolCode : req.session.schoolCode})
                const session = await Session.findOne({school : schoolAdmin._id, _id : req.params.sessionID})
                console.log(session)
                const term = await Term.find({session : session._id})
                res.render('school-term', {title : "Sessions", session_active : "active",
                schoolAdmin : schoolAdmin, term : term, session : session, success : req.flash('success')})
            }else{
                res.redirect(303, '/school')
            }
        }catch(err){
            res.render("error-page", {error: err})
        }
    }

    postTerm = async(req, res, next) => {
        try{
            if(req.session.schoolCode){
                const schoolAdmin = await SchoolAdmin.findOne({schoolCode : req.session.schoolCode})
    
                const {name, startDate, endDate} = req.body
                
                const term = await new Term({
                    name : name,
                    school : schoolAdmin._id,
                    startDate : startDate,
                    endDate : endDate,
                    session : req.params.sessionID
                })
                const saveTerm = await term.save()
                if ( saveTerm ) { 
                    let redirectUrl = "/school/session/" + req.params.sessionID
                    res.redirect(303, redirectUrl)
                    return 
                }else {
                    throw {
                        message : "Unable to save the Term."
                    }
                    return 
                }
            }else{
                res.redirect(303, '/school')
            }
        }catch(err){
            res.render("error-page", {error: err})
        }
    }

    getSubjects = async(req, res, next) => {
        try{ 
            if(req.session.schoolCode){
                const schoolAdmin = await SchoolAdmin.findOne({schoolCode : req.session.schoolCode})
                const subjects = await Subject.findOne({school : schoolAdmin._id})
                res.render('school-subjects', {title : "Subjects", subject_active : "active",
                schoolAdmin : schoolAdmin, subjects : subjects, success : req.flash('success')})
            }else{
                res.redirect(303, '/school')
            }
        }catch(err){
            res.render("error-page", {error: err})
        }
    }

    addASubject = async (req, res, next) => {
        try{ 
            if(req.session.schoolCode){
                const schoolAdmin = await SchoolAdmin.findOne({schoolCode : req.session.schoolCode})
                const subjects = await Subject.findOne({school : schoolAdmin._id}) 
                Subject.findByIdAndUpdate(subjects._id, {
                    $addToSet : {
                        subjects : [req.body.subject] }
                }, {new : true, useAndModify : false}, (err , item) => {
                    if(err){
                        res.status(500)
                        return
                    }else {
                        req.flash('success', "Added successfully.")
                        res.redirect(303, '/school/subjects/')
                    }
                })	
            }else{
                res.redirect(303, '/school')
            }
        }catch(err){
            res.render("error-page", {error: err})
        }
    }

    removeSubject = async (req, res, next) => {
        try{ 
            if(req.session.schoolCode){
                const schoolAdmin = await SchoolAdmin.findOne({schoolCode : req.session.schoolCode})
                const subjects = await Subject.findOne({school : schoolAdmin._id}) 
                const allSubjects = subjects.subjects
                let mapIt = allSubjects.find( elem => elem == req.params.subjectname)
                Subject.findByIdAndUpdate(subjects._id, {
                    $pullAll : {
                        subjects : [mapIt] }
                }, {new : true, useAndModify : false}, (err , item) => {
                    if(err){
                        res.status(500)
                        return
                    }else {
                        req.flash('success', "Your deletion was successful.") 
                        res.redirect(303, '/school/subjects')
                    }
                })
            }else{
                res.redirect(303, '/school')
            }
        }catch(err){
            res.render("error-page", {error: err})
        }
    }

    getClasses = async (req, res, next) => {
        try{ 
            if(req.session.schoolCode){
                const schoolAdmin = await SchoolAdmin.findOne({schoolCode : req.session.schoolCode})
                const className = await ClassSchool.find({school : schoolAdmin._id})
                const subjects = await Subject.findOne({school : schoolAdmin._id})
                if(className.length != 0){
                    res.render('admin-class', {title : "Classes", schoolAdmin : schoolAdmin, className : className,
                    error : req.flash('error'), success : req.flash('success'), 
                    class_active : "active", subjects : subjects})
                }else{
                    res.render('admin-class', {title : "Classes", schoolAdmin : schoolAdmin, noClassName : "No class has been created.",
                    error : req.flash('error'), success : req.flash('success'), 
                    class_active : "active", subjects : subjects})
                }
            }else{
                res.redirect(303, '/school')
            }
        }catch(err){
            res.render("error-page", {error: err})
        }
    }

    postClasses = async (req , res , next) => { 
        try{ 
		    if(req.session.schoolCode){
                const school = await SchoolAdmin.findOne({schoolCode : req.session.schoolCode})
                const classchool = await ClassSchool.findOne({name : req.body.name, school : school._id})
                if(classchool){
                    req.flash('error', "You have this class saved already.")
                    res.redirect('/school/class')
                    return 
                }else{	 
                    const className = await new ClassSchool({
                        name : req.body.name,
                        subjects : req.body.subjects,
                        school : school._id
                    })
                    const saveClass = await className.save()
                    if ( saveClass ) { 
                         
                        FileHandler.createDirectory("./public/uploads/schools/" + req.session.schoolCode + "/staffs/")
                        FileHandler.createDirectory("./public/uploads/schools/" + req.session.schoolCode + "/" + saveClass.name) 

                        req.flash('success', "Your record has been saved successfully.")
                        res.redirect('/school/class')
                        return 
                    }else {
                        throw {
                            message : "Unable to save this Class"
                        }
                        return 
                    }
                }
            }else {
                res.redirect(303, '/school')
            }
        }catch(err){
            res.render("error-page", {error: err})
        }
	} 

    getStudentClass = async (req, res, next) => {
        try{ 
            if(req.session.schoolCode){
                const schoolAdmin = await SchoolAdmin.findOne({schoolCode : req.session.schoolCode})
                let title = `Students in ${req.params.classname}`
                let singleClass = await ClassSchool.findOne({name : req.params.classname, school : schoolAdmin._id})
                let totalStudent = await Student.find({className : singleClass._id, school : schoolAdmin._id}) 
                
                if ( totalStudent.length == 0 ) {
                    let userMessage = {
                        name : "No Students found" 
                    }
                    res.render("class-students", {title : title, noStudent : userMessage.name, 
                        schoolAdmin : schoolAdmin, class_active : "active"}) 
                    return
                }else if ( totalStudent.length > 0){   
                    res.render("class-students" , {
                        students : totalStudent,
                        title : title,
                        schoolAdmin : schoolAdmin,
                        mainClass : req.params.classname,
                        class_active : "active"})
                    return 
                }
            }else{
                res.redirect(303, '/school')
            }
        }catch(err){
            res.render("error-page", {error: err})
        }
    }

    deleteClass = async (req, res, next) => {
        try{ 
            if(req.session.schoolCode){
                const schoolAdmin = await SchoolAdmin.findOne({schoolCode : req.session.schoolCode})
                const classchool = await ClassSchool.findOne({name : req.params.classname, school : schoolAdmin._id})
                let theID = classchool._id
                let students = await Student.find({className : theID, school : schoolAdmin._id})
                if(students.length == 0){
                    ClassSchool.findByIdAndDelete(theID, err => {
                        if(err){
                            res.send(err)
                        }
                        req.flash('success' , 'Class has been deleted successfully.')
                        res.redirect('/school/class')
                    })	
                }else {
                    req.flash('success' , 'You have registered students here already. Unable to delete.')
                    res.redirect('/school/class')
                }
            }else{
                res.redirect(303, '/school')
            }
        }catch(err){
            res.render("error-page", {error: err})
        }
    }

    subjectsClass = async (req , res , next) => {
        try{ 
            if(req.session.schoolCode){
                let title = `Subjects offered in ${req.params.classname}`
                const schoolAdmin = await SchoolAdmin.findOne({schoolCode : req.session.schoolCode})
                let classchool = await ClassSchool.findOne({name : req.params.classname, school : schoolAdmin._id})
                res.render("subject-class", {title : title, schoolAdmin : schoolAdmin, 
                    classchools : classchool, success : req.flash('success'), 
                    mainClass : req.params.classname, class_active : "active"}) 
            }else{
                res.redirect(303, '/school')
            }
        }catch(err){
            res.render("error-page", {error: err})
        }
    }

    addSubject = async (req, res, next) => {
        try{ 
            if(req.session.schoolCode){
                const schoolAdmin = await SchoolAdmin.findOne({schoolCode : req.session.schoolCode})
                const classchool = await ClassSchool.findOne({name : req.params.classname, school : schoolAdmin._id}) 
                ClassSchool.findByIdAndUpdate(classchool._id, {
                    $addToSet : {
                        subjects : [req.body.subject] }
                }, {new : true, useAndModify : false}, (err , item) => {
                    if(err){
                        res.status(500)
                        return
                    }else {
                        req.flash('success', "Added successfully.")
                        let redirectUrl = '/school/class/' + req.params.classname+ '/subjects' 
                        res.redirect(303, redirectUrl)
                    }
                })	
            }else{
                res.redirect(303, '/school')
            }
        }catch(err){
            res.render("error-page", {error: err})
        }
    }

    deleteSubject = async (req, res, next) => {
        try{ 
            if(req.session.schoolCode){
                const schoolAdmin = await SchoolAdmin.findOne({schoolCode : req.session.schoolCode})
                const classchool = await ClassSchool.findOne({name : req.params.classname, school : schoolAdmin._id})
                const allSubjects = classchool.subjects
                let mapIt = allSubjects.find( elem => elem == req.params.subjectname)
                ClassSchool.findByIdAndUpdate(classchool._id, {
                    $pullAll : {
                        subjects : [mapIt] }
                }, {new : true, useAndModify : false}, (err , item) => {
                    if(err){
                        res.status(500)
                        return
                    }else {
                        req.flash('success', "Your deletion was successful.")
                        let redirectUrl = '/school/class/' + req.params.classname+ '/subjects' 
                        res.redirect(303, redirectUrl)
                    }
                })
            }else{
                res.redirect(303, '/school')
            }
        }catch(err){
            res.render("error-page", {error: err})
        }
    }

    getNewStudent = async (req , res , next) => {
        try{ 
            if(req.session.schoolCode){
                const schoolAdmin = await SchoolAdmin.findOne({schoolCode : req.session.schoolCode})
                const classchool = await ClassSchool.find({school : schoolAdmin._id})
                res.render("new-student", {title : "New Student", schoolAdmin : schoolAdmin, classchool : classchool,
                    error : req.flash('error'), success : req.flash('success'), student_active : "active"}) 
            }else{
                res.redirect(303, '/school')
            }
        }catch(err){
            res.render("error-page", {error: err})
        }
    }

    postStudents = async (req , res , next) => { 
        try{ 
		    if(req.session.schoolCode){	 
                const schoolAdmin = await SchoolAdmin.findOne({schoolCode : req.session.schoolCode})
                const {firstName , lastName, otherName, gender, className, pNumber,
                        blood, religion, dob} = req.body
                const totalStudent = await Student.find({school : schoolAdmin._id})
                
                let start = req.session.schoolCode + "001"
                let code = `S${GenerateAccount(totalStudent, start, "studentID", 1, 6)}`
                const studentPass = await bcrypt.hash(lastName.toUpperCase() , 10)
                
                const student = await new Student({
                    firstName : firstName ,  
                    lastName : lastName , 
                    otherName : otherName, 
                    password : studentPass, 
                    gender  : gender,
                    studentID : code,
                    className : className,
                    school : schoolAdmin._id,
                    bloodGroup : blood,
                    religion : religion,
                    dateOfBirth : dob,
                    parentsNumber : pNumber
                })
                const saveStudent = await student.save()
                if ( saveStudent ) { 
                    let redirectUrl = "/school/new-student/" + saveStudent._id + "/complete"
                    res.redirect(redirectUrl)
                    return 
                }else {
                    throw {
                        message : "Unable to save the exam"
                    }
                    return 
                }
            }else {
                res.redirect(303, '/school')
            }
        }catch(err){
            res.render("error-page", {error: err})
        }
    }

    getComplete = async (req, res, next) => {
        try{ 
            if(req.session.schoolCode){
                const schoolAdmin = await SchoolAdmin.findOne({schoolCode : req.session.schoolCode})
                const student = await Student.findOne({_id : req.params.studentID})
                if(student){
                    res.render("complete-reg", {title : "Upload Image", mainStudent : student, 
                    schoolAdmin : schoolAdmin, student_active : "active"})
                }else{
                    throw {
                        message : "You can't access this page. No Registration Number to access it."
                    }
                }
            }else{
                res.redirect('303', '/school')
            }
        }catch(err){
            res.render("error-page", {error: err})
        }
    }

    completeStudentReg = async(req, res, next) => {
        try{ 
            if(req.session.schoolCode){
                const confirmStudent = await Student.findOne({_id : req.params.studentID})
                let checkClass = await ClassSchool.findOne({_id : confirmStudent.className})
                if (req.file) { 
                    const ID = req.params.studentID
                    const originalName = ID + "-" + req.file.originalname 
                    Student.findByIdAndUpdate(ID , {
                        profilePhoto : originalName
                    } ,{new : true, useAndModify : false}, (err , item) => {
                        if(err){
                            res.status(500)
                            return
                        }else{
                            FileHandler.moveFile(originalName , "./public/uploads/profile" , "./public/uploads/schools/" + req.session.schoolCode + "/" + checkClass.name + "/") 
                            
                            req.flash('success', "Successfully created. You can also see this student in the classes page.")
                            let redirectUrl = '/school/new-student/' + req.params.studentID  
                            res.redirect(303, redirectUrl)

                        }
                    })
                }else {
                    throw{
                        name : "File Error",
                        message : "File not found."
                    }
                }
            }else {
                res.redirect(303, '/school')
            }
        }catch(err){
            res.render("error-page", {error: err})
        }    
    }

    getSingleStudent = async (req , res , next) => {
        try{ 
            if(req.session.schoolCode){
                const schoolAdmin = await SchoolAdmin.findOne({schoolCode : req.session.schoolCode})
                let validStudent = await Student.findOne({_id : req.params.studentID})
                let checkClass = await ClassSchool.findOne({_id : validStudent.className})
                if(validStudent){
                    res.render('singlestudent' , { title  : "Student", studentDB: validStudent, 
                    schoolAdmin : schoolAdmin, studentClass : checkClass, 
                    success : req.flash('success'), student_active : "active"})
                }else{
                    throw{
                        message : "Student not found"
                    }
                }   
            }else{
                res.redirect(303, '/school')
            }
        }catch(err){
            res.render("error-page", {error: err})
        }
    }

    updateSingleStudent = async(req, res, next) => {
        try{ 
            if(req.session.schoolCode){
                let student = await Student.findOne({_id : req.params.studentID})
                const schoolAdmin = await SchoolAdmin.findOne({schoolCode : req.session.schoolCode})
                let checkClass = await ClassSchool.findOne({_id : student.className})
                if(student){	
                    if(req.file){
                        FileHandler.deleteFile("./public/uploads/schools/"+ req.session.schoolCode + "/" + checkClass.name + "/" + student.profilePhoto) 
                        let originalName = req.params.studentID + "-" + req.file.originalname
                        Student.findByIdAndUpdate(req.params.studentID, {
                            profilePhoto : originalName,
                            firstName : req.body.firstName,
                            lastName : req.body.lastName,
                            gender : req.body.gender,
                            otherName : req.body.otherName
                        }, {new : true, useAndModify : false}, (err , item) => {
                            if(err){
                                res.status(500)
                                return
                            }else {
                                req.flash('success', "Update was successful.")
                                let redirectUrl = "/school/new-student/" + req.params.studentID
                                res.redirect(303, redirectUrl)

                                FileHandler.moveFile(originalName , "./public/uploads/profile" , "./public/uploads/schools/" + req.session.schoolCode + "/" + checkClass.name + "/") 
                            }
                        })	
                    }else{
                        Student.findByIdAndUpdate(req.params.studentID, {
                            firstName : req.body.firstName,
                            lastName : req.body.lastName,
                            gender : req.body.gender,
                            otherName : req.body.otherName
                        }, {new : true, useAndModify : false}, (err , item) => {
                            if(err){
                                res.status(500)
                                return
                            }else {
                                req.flash('success', "Update was successful.")
                                let redirectUrl = "/school/new-student/" + req.params.studentID
                                res.redirect(303, redirectUrl)
                            }
                        })	
                    }				   
                }else {
                    throw {
                        message : 'Student not found'
                    }
                    return
                }
            }else{
                res.redirect(303, '/school')
            }
        }catch(err){
            res.render("error-page", {error: err})
        }
    }
    
    getStaffs = async (req , res , next) => {
        try{ 
            if(req.session.schoolCode){
                const schoolAdmin = await SchoolAdmin.findOne({schoolCode : req.session.schoolCode})
                const staff= await Staff.find({school : schoolAdmin._id})
                if(staff.length != 0){
                    res.render("admin-staff" , {
                        staffs : staff ,
                        title : "Staffs",
                        schoolAdmin : schoolAdmin,
                        success : req.flash('success'),
                        staff_active : "active"
                    })
                    return 
                }
                else{
                    res.render("admin-staff", {
                        noStaff : "No Staff has been created." ,
                        title : "Staffs",
                        schoolAdmin : schoolAdmin,
                        success : req.flash('success'),
                        staff_active : "active"
                    })
                }
            }else{
                res.redirect(303, '/school')
            }
        }catch(err){
            res.render("error-page", {error: err})
        }
    }

    getNewStaff = async (req, res, next) => {
        try{ 
            if(req.session.schoolCode){
                const schoolAdmin = await SchoolAdmin.findOne({schoolCode : req.session.schoolCode})
                const classchool = await ClassSchool.find({school : schoolAdmin._id})
                const subjects = await Subject.findOne({school : schoolAdmin._id})
                res.render('new-staff', {title : 'New Staff', schoolAdmin : schoolAdmin, className : classchool,
                        error : req.flash('error'), staff_active : "active", subjects : subjects})
            }else{
                res.redirect(303, '/school')
            }
        }catch(err){
            res.render("error-page", {error: err})
        }
    }

    confirmHeadClass = async (req, res, next) => {
        try{ 
            if(req.session.schoolCode){
                const schoolAdmin = await SchoolAdmin.findOne({schoolCode : req.session.schoolCode})
                const staff = await Staff.findOne({school : schoolAdmin._id, classHead : req.body.classHead})
                if(staff){
                    res.json({message : "A teacher is already head of the class you chose.", button : true})
                }else{
                    res.json({message : "Good!", button : false})
                }
            }else{
                res.redirect(303, '/school')
            }
        }catch(err){
            res.render("error-page", {error: err})
        }
    }

    postStaffs = async (req , res , next) => { 
        try{ 
		    if(req.session.schoolCode){
                const schoolAdmin = await SchoolAdmin.findOne({schoolCode : req.session.schoolCode})
                const {firstName , lastName, otherName, email, number, gender, role, classes, subjects, classHead} = req.body
                const totalStaff = await Staff.find({school : schoolAdmin._id})
                let checkStaffEmail = await Staff.findOne({email : email, school : schoolAdmin._id})
                let checkStaffNumber = await Staff.findOne({number : number, school : schoolAdmin._id})
                if(checkStaffEmail || checkStaffNumber){
                    req.flash('error', "Staff already exists.")
                    res.redirect('/school/staff/new')
                }else{
                    let start = req.session.schoolCode + "01"
                    let code = GenerateAccount(totalStaff, start, "staffID", 1, 5)
                    const staffPass = await bcrypt.hash(lastName.toUpperCase() , 10)
                    const staff = await new Staff({
                        firstName : firstName ,  
                        lastName : lastName , 
                        otherName : otherName,
                        email : email, 
                        mobile : number, 
                        password : staffPass, 
                        gender  : gender,
                        role : role,
                        classHead : classHead,
                        class : {
                            className : classes,
                            subject : subjects
                        },
                        school : schoolAdmin._id,
                        staffID : code
                    })
                    const saveStaff = await staff.save()
                    if ( saveStaff ) { 
                        let redirectUrl = "/school/staff/" + saveStaff._id + "/complete"
                        res.redirect(redirectUrl)
                        return 
                    }else {
                        throw {
                            message : "Unable to save this Staff"
                        }
                        return 
                    }
                }
            }else {
                res.redirect(303, '/school')
            }
        }catch(err){
            res.render("error-page", {error: err})
        }
    } 
    
    getStaffComplete = async (req, res, next) => {
        try{ 
            if(req.session.schoolCode){
                const schoolAdmin = await SchoolAdmin.findOne({schoolCode : req.session.schoolCode})
                const getStaff = await Staff.findOne({_id : req.params.staffID})
                if(getStaff){
                    res.render("complete-staffreg", {title : "Upload Image", 
                    getStaff : getStaff, schoolAdmin : schoolAdmin, staff_active : "active"})
                }else{
                    throw {
                        message : "You can't access this page. No ID to access it."
                    }
                }
            }else{
                res.redirect('303', '/admin')
            }
        }catch(err){
            res.render("error-page", {error: err})
        }
    }

    completeStaffReg = async(req, res, next) => {
        try{ 
            if(req.session.schoolCode){
                const confirmStaff= await Staff.findOne({_id : req.params.staffID})
                if (req.file) {  
                    const ID = req.params.staffID
                    const originalName = ID + "-" + req.file.originalname 
                    Staff.findByIdAndUpdate(ID , {
                        profilePhoto : originalName
                    } ,{new : true, useAndModify : false}, (err , item) => {
                        if(err){
                            res.status(500)
                            return
                        }else{
                            FileHandler.moveFile(originalName , "./public/uploads/profile" , "./public/uploads/schools/" + req.session.schoolCode + "/staffs/") 
                            
                            req.flash('success', "The Staff has been added successfully.")
                            let redirectUrl = '/school/staff/' + req.params.staffID  
                            res.redirect(303, redirectUrl)
                        }
                    })
                }else {
                    throw{
                        name : "File Error",
                        message : "File not found."
                    }
                }
            }else {
                res.redirect(303, '/school')
            }
        }catch(err){
            res.render("error-page", {error: err})
        }    
    }

    getSingleStaff = async (req , res , next) => {
        try{ 
            if(req.session.schoolCode){
                let validStaff = await Staff.findOne({_id : req.params.staffID})
                const schoolAdmin = await SchoolAdmin.findOne({schoolCode : req.session.schoolCode})
                if(validStaff){
                    res.render('singlestaff' , { title  : "Staff", staffDB: validStaff, 
                        schoolAdmin : schoolAdmin, success : req.flash('success'), staff_active : "active"})
                }else{
                    throw{
                        message : "Staff not found"
                    }
                }
            }else{
                res.redirect(303, '/school')
            }
        }catch(err){
            res.render("error-page", {error: err})
        }
    }

    updateSingleStaff = async(req, res, next) => {
        try{ 
            if(req.session.schoolCode){
                const schoolAdmin = await SchoolAdmin.findOne({schoolCode : req.session.schoolCode})
                const staff = await Staff.findOne({_id : req.params.staffID})
                if(staff){	
                    if(req.file){
                        
                        FileHandler.deleteFile("./public/uploads/schools/"+ req.session.schoolCode + "/staffs/" + staff.profilePhoto) 
                        
                        let originalName = req.params.staffID + "-" + req.file.originalname
                        Staff.findByIdAndUpdate(req.params.staffID, {
                            profilePhoto : originalName,
                            firstName : req.body.firstName,
                            lastName : req.body.lastName,
                            gender : req.body.gender
                        }, {new : true, useAndModify : false}, (err , item) => {
                            if(err){
                                res.status(500)
                                return
                            }else {
                                req.flash('success', "Update was successful.")
                                let redirectUrl = "/school/staff/" + req.params.staffID
                                res.redirect(303, redirectUrl)

                                const source = "../public/uploads/profile/" + originalName
                                const destination = "../public/uploads/schools/" + req.session.schoolCode + '/staffs/' + originalName
                                fs.rename((path.join(dirName , source)) , (path.join(dirName , destination)), err => {
                                    if(err){
                                        console.error(err)
                                    }else{
                                        console.log("File Moved")
                                    }
                                })
                            }
                        })	
                    }else{
                        Staff.findByIdAndUpdate(req.params.staffID, {
                            firstName : req.body.firstName,
                            lastName : req.body.lastName,
                            gender : req.body.gender
                        }, {new : true, useAndModify : false}, (err , item) => {
                            if(err){
                                res.status(500)
                                return
                            }else {
                                req.flash('success', "Update was successful.")
                                let redirectUrl = "/school/staff/" + req.params.staffID
                                res.redirect(303, redirectUrl)
                            }
                        })	
                    }				   
                }else {
                    throw {
                        message : 'Staff not found'
                    }
                    return
                }
            }else{
                res.redirect(303, '/school')
            }
        }catch(err){
            res.render("error-page", {error: err})
        }
    }

    getExams = async (req , res , next) => {
        try{ 
            if(req.session.schoolCode){
                const schoolAdmin = await SchoolAdmin.findOne({schoolCode : req.session.schoolCode})
                const exam = await Exam.find({school : schoolAdmin._id})
                const session = await Session.find({school : schoolAdmin._id})
                const currentSession = await Session.findOne({school : schoolAdmin._id, current : true})
                const term = await Term.find({school : schoolAdmin._id})

                let sessionName = {}
                session.map(sess => sessionName[sess._id] = sess.name)

                let termName = {}
                term.map(sess => termName[sess._id] = sess.name)

                if(exam.length != 0){       
                    res.render('admin-exam' , { title  : "Exams", exams : exam, 
                    schoolAdmin : schoolAdmin, exam_active : "active", session : currentSession,
                    sessionName : sessionName, termName : termName})
                }else{
                    res.render('admin-exam', {title : "Exams", exam_active : "active", 
                    noExam : "No Exam has been created.", schoolAdmin : schoolAdmin,
                    session : currentSession, termName : termName})
                }
            }else{
                res.redirect(303, '/school')
            }
        }catch(err){
            res.render("error-page", {error: err})
        }
    }

    populateTerm = async (req, res, next) => {
        const term = await Term.find({session : req.body.session})
        res.json(term)
    }

    postExams = async (req , res , next) => {
        try{ 
            if(req.session.schoolCode){
                const schoolAdmin = await SchoolAdmin.findOne({schoolCode : req.session.schoolCode})
                let allExam = await Exam.find({school : schoolAdmin._id})
                let code = GenerateAccount(allExam, "01", "examCode", 1, 2)

                const {name, startDate, endDate, session, term} = req.body
            
                const exam = await new Exam({
                    name : name,
                    session : session,
                    term : term,
                    startDate : startDate,
                    endDate : endDate,
                    school : schoolAdmin._id,
                    examCode : code
                })
                const saveExam = await exam.save()
                if ( saveExam ) { 
                    
                    FileHandler.createDirectory("./public/uploads/schools/" + req.session.schoolCode + "/exam-" + saveExam.examCode)
                    res.redirect('/school/exam')
                    return 
                }else {
                    throw {
                        message : "Unable to save the exam"
                    }
                    return 
                }
            }else {
                res.redirect(303, '/school')
            }
        }catch(err){
            res.render("error-page", {error: err})
        }
    }

    getExamQuestions = async (req, res, next) => {
        try{ 
            if(req.session.schoolCode){
                const schoolAdmin = await SchoolAdmin.findOne({schoolCode : req.session.schoolCode})
                const exam = await Exam.findOne({examCode : req.params.examcode, school : schoolAdmin._id})
                const courses = await Course.find({school : schoolAdmin._id, exam : exam._id, publish : true})
                if(courses.length != 0){
                    res.render('admin-questions', {schoolAdmin : schoolAdmin, 
                        courses : courses, exam : exam, exam_active : "active"})
                }else {
                    res.render('admin-questions', {schoolAdmin : schoolAdmin, exam_active : "active", 
                        noCourse : "Looks like no exam question has been submitted."})
                }
            }else{
                res.redirect(303, '/school')
            }
        }catch(err){
            res.render("error-page", {error: err})
        }
    }

    viewQuestions = async (req, res, next) => {
        try{ 
            if(req.session.schoolCode){
                const schoolAdmin = await SchoolAdmin.findOne({schoolCode : req.session.schoolCode})
                const questions = await Question.findOne({course : req.params.courseID, school : schoolAdmin._id})
                const course = await Course.findOne({_id : questions.course})
                const exam = await Exam.findOne({_id : course.exam})
                if(questions){
                    res.render('released-questions', {schoolAdmin : schoolAdmin, 
                        questions : questions, exam : exam, course : course, exam_active : "active"})
                }else{
                    res.render('released-questions', {schoolAdmin : schoolAdmin, exam_active : "active", 
                        noQuestion : `No question was found.`, course : course,})
                }
            }else {
                res.redirect(303, '/school')
            }
        }catch(err){
            res.render("error-page", {error: err})
        }
    }

    releaseQuestion = async (req, res, next) => {
        try{ 
            if(req.session.schoolCode){
                let schoolAdmin = await SchoolAdmin.findOne({schoolCode : req.session.schoolCode})
                let course = await Course.findOne({_id : req.params.courseID})
            
                Course.findByIdAndUpdate(req.params.courseID, {
                        release : true,
                }, {new : true, useAndModify : false}, (err , item) => {
                    if(err){
                        res.status(500)
                        return
                    }else {
                        let redirectUrl = '/school/exam/' + req.params.examcode + '/questions'
                        res.redirect(redirectUrl)
                    }
                })	
            }else{
                res.redirect(303, '/school')
            }
        }catch(err){
            res.render("error-page", {error: err})
        }
    }

    getReports = async (req, res, next) => {
        try{ 
            if(req.session.schoolCode){
                const schoolAdmin = await SchoolAdmin.findOne({schoolCode : req.session.schoolCode})
                const exam = await Exam.find({school : schoolAdmin._id})
                if(exam.length != 0){
                    res.render('admin-examreports', {schoolAdmin : schoolAdmin, report_active : "active", 
                        exams : exam, title : "Reports"})
                }else{
                    res.render('admin-examreports', {schoolAdmin : schoolAdmin, report_active : "active",
                        noExam : "You can't have a report yet. No exam has been created.", title : "Reports"})
                }
            }else{
                res.redirect(303, '/admin')
            }
        }catch(err){
            res.render("error-page", {error: err})
        }
    }

    getAllExams = async (req, res, next) => {
        try{ 
            if(req.session.schoolCode){
                const schoolAdmin = await SchoolAdmin.findOne({schoolCode : req.session.schoolCode})
                const course = await ClassSchool.find({school : schoolAdmin._id})
                const exam = await Exam.findOne({school : schoolAdmin._id, examCode : req.params.examcode})
                res.render('all-exams', {schoolAdmin : schoolAdmin, courses : course, 
                    exam : exam, report_active : "active"})
            }else{
                res.redirect(303, '/school')
            }
        }catch(err){
            res.render("error-page", {error: err})
        }
    }

    getFullReport = async (req, res, next) => {
        try{ 
            if(req.session.schoolCode){
                const schoolAdmin = await SchoolAdmin.findOne({schoolCode : req.session.schoolCode})
                const exam = await Exam.findOne({school : schoolAdmin._id, examCode : req.params.examcode})
                let className = req.params.classname
                const result = await Result.find({className : req.params.classname, school : schoolAdmin._id})
                const students = await Student.find()

                let studentName = {}
                let studentID = {}
                students.map(student => {
                    studentName[student._id] = student.firstName + " " + student.lastName
                    studentID[student._id] = student.studentID
                })

                const resultArray = result.map(item => {
                    item.results = item.result.sort((a,b) => (a.courseName > b.courseName) ? 1 : -1)
                    return item
                })

                const firstResult = resultArray[0]

                if(result.length != 0){
                    res.render('class-report', {firstResult : firstResult, schoolAdmin : schoolAdmin, className : className, 
                        results : resultArray, exam : exam, studentName : studentName, studentID : studentID,
                        report_active : "active"})
                }else{
                    res.render('class-report', {schoolAdmin : schoolAdmin, className : className, report_active : "active",
                        noResult : "Looks like no student in this class have written any exam. It will appear here if they have."})
                }
            }else{
                res.redirect(303, '/school')
            }
        }catch(err){
            res.render("error-page", {error: err})
        }
    }

    releaseResults = async (req, res, next) => {
        try{ 
            if(req.session.schoolCode){
                const schoolAdmin = await SchoolAdmin.findOne({schoolCode : req.session.schoolCode})
                Result.updateMany({className : req.params.classname, school : schoolAdmin._id}, {
                        $set : {released : true}
                }, {new : true, useAndModify : false}, (err , item) => {
                    if(err){
                        res.status(500)
                        return
                    }else {
                        let redirectUrl = '/school/report/' + req.params.examcode + '/' + req.params.classname
                        res.redirect(redirectUrl)
                    }
                })	
            }else{
                res.redirect(303, '/school')
            }
        }catch(err){
            res.render("error-page", {error: err})
        }
    }

    unReleaseResults = async (req, res, next) => {
        try{ 
            if(req.session.email){
                const schoolAdmin = await SchoolAdmin.findOne({schoolCode : req.session.schoolCode})
                Result.updateMany({className : req.params.classname, school : schoolAdmin._id}, {
                        $set : {released : false}
                }, {new : true, useAndModify : false}, (err , item) => {
                    if(err){
                        res.status(500)
                        return
                    }else {
                        let redirectUrl = '/school/report/' + req.params.examcode + '/' + req.params.classname
                        res.redirect(redirectUrl)
                    }
                })	
            }else{
                res.redirect(303, '/admin')
            }
        }catch(err){
            res.render("error-page", {error: err})
        }
    }

    getAttendanceSession = async (req, res, next) => {
        try{
            if(req.session.schoolCode){
                const schoolAdmin = await SchoolAdmin.findOne({schoolCode : req.session.schoolCode})
                const classchool = await ClassSchool.find({school : schoolAdmin._id})
                const session = await Session.find({school : schoolAdmin._id})
                res.render('admin-attendance-session', {title : 'School Attendance', schoolAdmin : schoolAdmin,
                    classchool : classchool, attendance_active: "active", session : session})
            }else{
                res.redirect(303, '/school')
            }
        }catch(err){
            res.render("error-page", {error: err})
        }
    }

    getAttendanceTerm = async (req, res, next) => {
        try{
            if(req.session.schoolCode){
                const schoolAdmin = await SchoolAdmin.findOne({schoolCode : req.session.schoolCode})
                const classchool = await ClassSchool.find({school : schoolAdmin._id})
                const session = await Session.findOne({_id : req.params.sessionID})
                const term = await Term.find({session : req.params.sessionID})
                res.render('admin-attendance-term', {title : 'School Attendance', schoolAdmin : schoolAdmin,
                    classchool : classchool, attendance_active: "active", session : session, term : term})
            }else{
                res.redirect(303, '/school')
            }
        }catch(err){
            res.render("error-page", {error: err})
        }
    }

    getAttendanceClasses = async (req, res, next) => {
        try{
            if(req.session.schoolCode){
                const schoolAdmin = await SchoolAdmin.findOne({schoolCode : req.session.schoolCode})
                const classchool = await ClassSchool.find({school : schoolAdmin._id})
                const session = await Session.findOne({_id : req.params.sessionID})
                const term = await Term.findOne({session : req.params.sessionID, name : req.params.term})
                res.render('admin-attendance', {title : 'School Attendance', schoolAdmin : schoolAdmin,
                    classchool : classchool, attendance_active: "active", session: session, term: term})
            }else{
                res.redirect(303, '/school')
            }
        }catch(err){
            res.render("error-page", {error: err})
        }
    }

    firstAttendance = async (req, res, next) => {
        try{
            if(req.session.schoolCode){
                let redirectUrl = '/school/attendance/' + req.params.sessionID + '/' + req.params.term + '/' + req.params.classID + '/1'
                res.redirect(303, redirectUrl)
            }else{
                res.redirect(303, '/school')
            }
        }catch(err){
            res.render("error-page", {error: err})
        }
    }

    getEachAttendance = async (req, res, next) => {
        try{
            if(req.session.schoolCode){
                const schoolAdmin = await SchoolAdmin.findOne({schoolCode : req.session.schoolCode})
                const classchool = await ClassSchool.findOne({_id : req.params.classID})
                const students = await Student.find({school : schoolAdmin._id, className : req.params.classID})
                const session = await Session.findOne({_id : req.params.sessionID})
                const term = await Term.findOne({session : req.params.sessionID, name : req.params.term})
                const attendance = await Attendance.find({school : schoolAdmin._id, 
                                                          className : req.params.classID,
                                                          session : session._id,
                                                          term: term._id
                                                        })

                let studentName = {}
                students.map(student => 
                    studentName[student._id] = student.lastName + " " + student.firstName + " " + student.otherName
                )

                if(attendance.length > 0){

                    let week1Attendance = attendance.map(week => {
                        week.attendance = week.attendance.filter(w => {
                            return w.week == req.params.week
                        })
                        return week
                    })
                    const attendanceWeek = week1Attendance[0].attendance

                    res.render('class-attendance', {title : "Class Attendance", schoolAdmin : schoolAdmin,
                        className : classchool, attendance_active : "active", attendance : week1Attendance,
                        week : req.params.week, attendanceWeek : attendanceWeek, studentName : studentName,
                        session: session, term: term
                    })   
                }else{
                    res.render('class-attendance', {title : "Class Attendance", schoolAdmin : schoolAdmin,
                        className : classchool.name, attendance_active : "active",
                        week : req.params.week, noAttendance : "No attendance has been recorded.",
                        session: session, term: term
                    })  
                }
                
            }else{
                res.redirect(303, '/school')
            }
        }catch(err){
            res.render("error-page", {error: err})
        }
    }

    getNotesSession = async (req, res, next) => {
        try{
            if(req.session.schoolCode){
                const schoolAdmin = await SchoolAdmin.findOne({schoolCode : req.session.schoolCode})
                const classchool = await ClassSchool.find({school : schoolAdmin._id})
                const session = await Session.find({school : schoolAdmin._id})
                res.render('admin-notes-session', {title : 'Lesson Notes', schoolAdmin : schoolAdmin,
                    classchool : classchool, note_active: "active", session : session})
            }else{
                res.redirect(303, '/school')
            }
        }catch(err){
            res.render("error-page", {error: err})
        }
    }

    getNotesTerm = async (req, res, next) => {
        try{
            if(req.session.schoolCode){
                const schoolAdmin = await SchoolAdmin.findOne({schoolCode : req.session.schoolCode})
                const classchool = await ClassSchool.find({school : schoolAdmin._id})
                const session = await Session.findOne({_id : req.params.sessionID})
                const term = await Term.find({session : req.params.sessionID})
                res.render('admin-notes-term', {title : 'Lesson Notes', schoolAdmin : schoolAdmin,
                    classchool : classchool, note_active: "active", session : session, term : term})
            }else{
                res.redirect(303, '/school')
            }
        }catch(err){
            res.render("error-page", {error: err})
        }
    }

    getLessonNotes = async (req, res, next) => {
        try{
            if(req.session.schoolCode){
                const schoolAdmin = await SchoolAdmin.findOne({schoolCode : req.session.schoolCode})
                const session = await Session.findOne({_id : req.params.sessionID})
                const term = await Term.findOne({name : req.params.term, session: session._id})
                const lessonNotes = await LessonNotes.find({session : session._id, term : term._id, status : "Pending"})
                const staffs = await Staff.find({school : schoolAdmin._id})

                let staffName = {}
                staffs.map(elem => staffName[elem._id] = elem.firstName + " " + elem.lastName)

                if(lessonNotes.length > 0){
                    res.render('admin-notes', {title : "Lesson Notes", schoolAdmin : schoolAdmin, 
                    note_active : "active", lessonNotes : lessonNotes, session : session, term: term,
                    staffName: staffName})
                }else{
                    res.render('admin-notes', {title : "Lesson Notes", schoolAdmin : schoolAdmin, 
                    note_active : "active", noNote : "No lesson notes found.", session : session, term: term})
                }
            }else{
                res.redirect(303, '/school')
            }
        }catch(err){
            res.render("error-page", {error: err})
        }
    }

    getSingleNote = async (req, res, next) => {
        try{
            if(req.session.schoolCode){
                const schoolAdmin = await SchoolAdmin.findOne({schoolCode : req.session.schoolCode})
                const session = await Session.findOne({_id : req.params.sessionID})
                const term = await Term.findOne({name : req.params.term, session: session._id})
                const singleNote = await LessonNotes.findOne({_id : req.params.noteID})
                res.render('admin-single-note', {title : "Lesson Note", schoolAdmin : schoolAdmin, 
                    note_active : "active", singleLessonNote : singleNote, session: session, term: term})
            }else{
                res.redirect(303, '/school')
            }
        }catch(err){
            res.render("error-page", {error: err})
        }
    }

    getApprovedNotes = async (req, res, next) => {
        try{
            if(req.session.schoolCode){
                const schoolAdmin = await SchoolAdmin.findOne({schoolCode : req.session.schoolCode})
                const session = await Session.findOne({_id : req.params.sessionID})
                const term = await Term.findOne({name : req.params.term, session: session._id})
                const lessonNotes = await LessonNotes.find({session : session._id, term : term._id, status : "Approved"})
                const staffs = await Staff.find({school : schoolAdmin._id})

                let staffName = {}
                staffs.map(elem => staffName[elem._id] = elem.firstName + " " + elem.lastName)

                if(lessonNotes.length > 0){
                    res.render('approved-notes', {title : "Lesson Notes", schoolAdmin : schoolAdmin, 
                    note_active : "active", lessonNotes : lessonNotes, session : session, term: term,
                    staffName: staffName})
                }else{
                    res.render('approved-notes', {title : "Lesson Notes", schoolAdmin : schoolAdmin, 
                    note_active : "active", noNote : "No lesson notes found.", session : session, term: term})
                }
            }else{
                res.redirect(303, '/school')
            }
        }catch(err){
            res.render("error-page", {error: err})
        }
    }

    approveNote = async (req, res, next) => {
        try{
            if(req.session.schoolCode){
                const schoolAdmin = await SchoolAdmin.findOne({schoolCode : req.session.schoolCode})
                const singleNote = await LessonNotes.findOne({_id : req.params.noteID})
                LessonNotes.findByIdAndUpdate(req.params.noteID, {
                    status : "Approved"
                }, {new : true, useFindAndModify : false}, (err, item) => {
                    if(err){
                        console.log(err)
                    }else{
                        let redirectUrl = "/school/lesson-notes/" + req.params.sessionID + "/" + req.params.term + "/all"
                        res.redirect(303, redirectUrl)
                    }
                })
            }else{
                res.redirect(303, '/school')
            }
        }catch(err){
            res.render("error-page", {error: err})
        }
    }

    getMailPage = async (req, res, next) => {
        try{
            if(req.session.schoolCode){
                const schoolAdmin = await SchoolAdmin.findOne({schoolCode : req.session.schoolCode})
                
                res.render('admin-mail', {title : "Lesson Note", schoolAdmin : schoolAdmin, 
                    mail_active : "active"})
            }else{
                res.redirect(303, '/school')
            }
        }catch(err){
            res.render("error-page", {error: err})
        }
    }

    getHelp = async (req, res, next) => {
        try{
            if(req.session.schoolCode){
                const schoolAdmin = await SchoolAdmin.findOne({schoolCode : req.session.schoolCode})
                
                res.render('admin-help', {title : "Lesson Note", schoolAdmin : schoolAdmin, 
                    help_active : "active"})
            }else{
                res.redirect(303, '/school')
            }
        }catch(err){
            res.render("error-page", {error: err})
        }
    }

    getLogout = (req , res , next ) => {
        try {
            if (req.session.schoolCode) {
                delete req.session.schoolCode
                res.redirect(303 , '/school')
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