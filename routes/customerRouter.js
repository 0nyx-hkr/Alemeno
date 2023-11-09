const { Model } = require('sequelize')
const customer_controller = require('../apis/customerControllers.js')

const router = require('express').Router()

router.post('/register',customer_controller.create_customer)

module.exports = router