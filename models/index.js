const dbConfig = require('../config/dbconfig.js');
// const { Worker } = require('worker_threads')
const {Sequelize,DataTypes} = require('sequelize')


const sequelize = new Sequelize(
    dbConfig.DB,
    dbConfig.USER,
    dbConfig.PASSWORD,
    {
        host:dbConfig.HOST,
        port: dbConfig.port,
        dialect:dbConfig.dialect,
        operatorsAliases: false,
        pool:{
            max:dbConfig.pool.max,
            min:dbConfig.pool.min,
            acquire:dbConfig.pool.acquire,
            idle:dbConfig.pool.idle,
            
        }

    }
)

sequelize.authenticate()
.then(()=>{
    console.log('connected...')
})
.catch(e =>{
    console.log('Authentication Error'+e)
})

const db = {};

db.Sequelize= Sequelize;
db.sequelize = sequelize;
// console.log(db)
db.customers = require('./customerdata.js')(sequelize,DataTypes)
db.loans = require('./loandata.js')(sequelize,DataTypes)

// db.sequelize.sync({force:true})
// .then(() => {
//     console.log('re-sync done!')
// })




module.exports = db
