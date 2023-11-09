const { Client } = require('pg');
const express = require('express');
require("dotenv").config();
const app = express();

const customer_router = require('./routes/customerRouter.js')
const loan_router = require('./routes/loanRouter.js')
const migration = require('./apis/dataingest.js')

//Uncomment the migration to crate tables and entries
// migration()   

app.use(express.json())
app.use(express.urlencoded({extended:true}))

app.use('/api/customers',customer_router)
app.use('/api/loans',loan_router)



// app.use((req, res, next) => {
//   console.log('Time: ', Date.now());
//   console.log(res)
//   next();

// });
 
const PORT = process.env.NODE_DOCKER_PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
