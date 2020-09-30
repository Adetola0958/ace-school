const bcrypt = require('bcryptjs')

const SchoolAdmin = require('../model/schoolAdmin')
const Staff = require("../model/staff")
const Exam = require('../model/exam')
const Course = require('../model/course')
const Question = require('../model/question')
const Result = require('../model/result')
const Student = require('../model/student')
const Parent = require("../model/parent")
const Attendance = require('../model/attendance')
const ClassSchool = require('../model/classchool')
const Session = require('../model/session')
const Term = require('../model/term')
const LessonNote = require('../model/lessonNote')
const Subject = require("../model/subject")

const FileHandler = require('./file')

class App{

    postParentLogin = async (req , res , next) => {
        try { 
            const {code, email, password} = req.body
            let parent = await Parent.findOne({parentID : code, email : email})
            if(parent){
                const validParent = await bcrypt.compare(password , parent.password)
                if(validParent){
                    req.session.parentCode = parent.parentID
                    res.redirect(303 , '/parent/dashboard')
                }else{
                    res.render('parent-page' , { error : 'Invalid Login details'})
                }
            }else{
                res.render('parent-page' , { error : 'Invalid Login details'})
            }
        }catch(errors) {
            res.render('parent-page' , {error : errors})
        }
    }

    getDashboard = async (req , res , next) => {
        try{ 
            if(req.session.parentCode){
                let parent = await Parent.findOne({parentID : req.session.parentCode})
                // let checkStudent = await Student.findOne({child: parent.ward})
                let school = await SchoolAdmin.findOne({_id : parent.school})
                const student = await Student.find({school : school._id})

                let oneStudent = {}
                student.map(one => oneStudent[one._id] = one.firstName)
                if(parent) {
                    res.render('parent-dashboard' , { title  : "Dashboard", parent : parent,  
                    code : school.schoolCode, dash_active : "active", student: student})
                }else{
                    throw{
                        message : "No Parent"
                    }
                }
            }else{
                res.redirect(303, '/Parent')
            }
        }catch(err){
            res.render("error-page", {error: err})
        }
    }

    getChildren = async(req, res, next) => {
        try{
            if(req.session.parentCode){
                let parent = await Parent.findOne({parentID : req.session.parentCode})
                let school = await SchoolAdmin.findOne({_id : parent.school})
                const student = await Student.findOne({school : school._id})
                let checkClass = await ClassSchool.findOne({_id : student.className})

                // let oneStudent = {}
                // student.map(one => oneStudent[one._id] = one.firstName)
                if(parent) {
                    res.render('parent-ward' , { title  : "Child(ren)", parent : parent, studentClass: checkClass,
                    code : school.schoolCode, student_active : "active", student: student})
                }else{
                    throw{
                        message : "No Parent"
                    }
                }
            }else{
                res.redirect(303, '/Parent')
            } 
        }catch(err){
            res.render("error-page", {error: err})
        }
    }

    getSingleChild = async(req, res, next) => {
        try{
            if(req.session.parentCode){
                const parent = await Parent.findOne({parentID : req.session.parentCode})
                let validStudent = await Student.findOne({_id : req.params.studentID})
                let checkClass = await ClassSchool.findOne({_id : validStudent.className})
                if(validStudent){
                    res.render('child-profile' , { title  : "Student", studentDB: validStudent, 
                    parent : parent, studentClass : checkClass, 
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
    
    getChildClass = async (req, res, next) => {
        try{ 
            if(req.session.parentCode){
                const parent = await Parent.findOne({parentID : req.session.parentCode})
                const schoolAdmin = await SchoolAdmin.findOne({_id : parent.school})
                const className = await ClassSchool.find({school : schoolAdmin._id})
                const subjects = await Subject.findOne({school : parent._id})
                if(className.length != 0){
                    res.render('child-class', {title : "Classes", parent : parent, className : className,
                    error : req.flash('error'), success : req.flash('success'), 
                    class_active : "active", subjects : subjects})
                }else{
                    res.render('child-class', {title : "Classes", parent : parent, noClassName : "No class has been created.",
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

    getChildSubjects = async (req , res , next) => {
        try{ 
            if(req.session.parentCode){
                let title = `Subjects offered in ${req.params.classname}`
                const parent = await Parent.findOne({parentID : req.session.parentCode})
                const schoolAdmin = await SchoolAdmin.findOne({_id : parent.school})
                let staff = await Staff.findOne({school: staff.classHead})
                let classchool = await ClassSchool.findOne({name : req.params.classname, school : schoolAdmin._id})
                res.render("child-subjects", {title : title, parent : parent,
                    classchools : classchool, success : req.flash('success'), staff: staff, 
                    mainClass : req.params.classname, class_active : "active"}) 
            }else{
                res.redirect(303, '/school')
            }
        }catch(err){
            res.render("error-page", {error: err})
        }
    }

    getClassTeacher = async(req, res, next) => {
        try{
            if(req.session.parentCode){
                const parent = await Parent.findOne({parentID : req.session.parentCode})
                let validStaff = await Staff.findOne({staffID : req.params.staffID})
                let checkClass = await ClassSchool.findOne({_id : validStaff.className})
                if(validStaff){
                    console.log(validStaff)
                    res.render('staff-profile' , { title  : "Student", staffDB: validStaff, 
                    parent : parent, studentClass : checkClass, 
                    success : req.flash('success'), student_active : "active"})
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

    attendancePage = async (req, res, next) => {
        try{
            if(req.session.staffCode){
                let redirectUrl = '/parent/attendance/' + req.params.term + '/1'
                res.redirect(303, redirectUrl)
            }else{
                res.redirect(303, '/staff')
            }
        }catch(err){
            res.render("error-page", {error: err})
        }
    }

    getChildAttendance = async(req, res, next) => {
        try{ 
            if(req.session.parentCode){
                const parent = await Parent.findOne({parentID : req.session.parentCode})
                const school = await SchoolAdmin.findOne({_id : parent.school})
                const session = await Session.findOne({school : school._id, current : true})
                const term = await Term.findOne({session : session._id, name : req.params.term})
                const students = await Student.find({school: school._id})
                const attendance = await Attendance.find({parent : parent._id, session : session._id, term : term._id})
                const classSchool = await ClassSchool.findOne({name : req.params.classname, school : school._id})

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

                    res.render('child-attendance', {staff: staff, code : school.schoolCode,
                        attendance_active : "active", attendance : week1Attendance, studentName : studentName,
                        classSchool : classSchool, attendanceWeek : attendanceWeek, week : req.params.week,
                        session : session, term : term})   
                }else{
                    res.render('child-attendance', {staff: staff, code : school.schoolCode,
                        attendance_active : "active", classSchool : classSchool, 
                        noAttendance : "No attendance has been recorded.", week : req.params.week,
                        session : session, term : term})
                }
            }else{
                res.redirect(303, '/staff')
            }
        }catch(err){
            res.render("error-page", {error: err})
        }
    }

    settingsPage = async(req, res, next) => {
        try{
            if(req.session.parentCode){
                const parent = await Parent.findOne({parentID : req.session.parentCode})
                res.render('parent-settings', {title : "Settings",
                    parent : parent, success : req.flash('success')})
            }else{
                res.redirect(303, '/parent-page')
            }
        }catch(err){
            res.render("error-page", {error: err})
        }
    }

    postSettings = async(req, res, next) => {
        try{
            if(req.session.parentCode){
                const {oldPassword, newPassword} = req.body
                const parent = await Parent.findOne({parentID : req.session.parentCode})
                let validPassword = await bcrypt.compare(oldPassword , parent.password)
                if(validPassword){
                    let harshedPassword = await bcrypt.hash(newPassword , 10)
                    Parent.findByIdAndUpdate(parent._id, {
                        password : harshedPassword
                    }, {new : true, useFindAndModify : false}, (err, item) => {
                        if(err) {
                            console.log(err)
                        }else {
                            req.flash('success', 'Password changed successfully.')
                            res.redirect(303, "/parent/settings")
                            return
                        }
                    })
                }else{
                    res.render("staff-settings", {error : "Old Password is wrong!", title : "Settings",
                    parent : parent, success : req.flash('success')})
                }
            }else{
                res.redirect(303, '/parent-page')
            }
        }catch(err) {
            res.render("error-page", {error: err})
        }
    }

    getLogout = (req , res , next ) => {
        try {
            if (req.session.parentCode) {
                delete req.session.parentCode
                res.redirect(303 , '/parent')
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