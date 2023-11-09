const { Model } = require('sequelize')
const loan_controller = require('../apis/loanControllers.js')

const router = require('express').Router()

router.post('/check-eligibility',loan_controller.check_loan_eligibility)

router.post('/create-loan',loan_controller.create_loan)

router.get('/view-loan/:loan_id',loan_controller.get_loan_details)

router.post('/make-payment/:customer_id/:loan_id',loan_controller.emi_change)

router.get('/view-statement/:customer_id/:loan_id',loan_controller.get_statement)



module.exports = router