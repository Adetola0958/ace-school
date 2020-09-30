'use strict' 

class App {
    getIndex = (req, res, next) => {
        res.render('index', {title : "Home Page"})
    }

    getDashboard = (req, res, next) => {
        res.render('dashboard', {title : "Dashboard"})
    }
    
    getStudentPage = (req, res, next) => {
        res.render('student-page', {title : "Students Page"})
    }
    
    getStaffPage = (req, res, next) => {
        res.render('staff-page', {title : "Staff Page"})
    }

    getParentPage = (req, res, next) => {
        res.render('parent-page', {title : "Parent Page"})
    }
}


const returnApp = new App()

module.exports = returnApp 