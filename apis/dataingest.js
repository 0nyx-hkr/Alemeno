const dbConfig = require('../config/dbconfig.js');
const XLSX = require('xlsx');
const { Client } = require('pg');
const client = new Client({
  host: dbConfig.HOST,
  user: dbConfig.USER,
  password: dbConfig.PASSWORD,
  database: dbConfig.DB,
});
async function importCustomersData(file, table) {
    const workbook = XLSX.readFile(file);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet,{raw:false});

  
    data.forEach(row => {
      const mappedRow = {
        customer_id : Number(row['customer_id']),
        first_name : row['first_name'],
        last_name : row['last_name'],
        age : Number(row['age']),
        monthly_salary : parseFloat(row['monthly_salary']),
        phone_number : row['phone_number'],
        approved_limit : parseFloat(row['approved_limit'])
      };
      const columns = Object.keys(mappedRow).join(',');
      const values = Object.values(mappedRow);
      const placeholders = values.map((_, i) => `$${i + 1}`).join(',');
      const query = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;
       client.query(query, values, (error, response) => {
        console.log(error || response);
      });
    });
}


function importLoanData(file, table) {
  const workbook = XLSX.readFile(file);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet,{raw:true});


  data.forEach(row => {
    start_date = serialToDate(row['start_date'])
    end_date = serialToDate(row['end_date'])
    const mappedRow = {
      customer_id : Number(row['customer_id']),
      loan_id : Number(row['loan_id']),
      loan_amount : parseFloat(row['loan_amount']),
      tenure : Number(row['tenure']),
      interest_rate : parseFloat(row['interest_rate']),
      monthly_repayment : parseFloat(row['monthly_payment']),
      emis_paid_on_time : Number(row['EMIs paid on Time']),
      start_date : start_date,
      end_date : end_date 
    };
    const columns = Object.keys(mappedRow).join(',');
    const values = Object.values(mappedRow);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(',');
    const query = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;
    client.query(query, values, (error, response) => {
      console.log(error || response);
    });
  });
}

function serialToDate(serial) {
  const days = serial - (25567 + 2); // Excel's epoch is 1900-01-01, JavaScript's epoch is 1970-01-01
  const milliseconds = days * 24 * 60 * 60 * 1000;
  date = new Date(milliseconds);
  let isoString = date.toISOString();
  return isoString
}

// Call the function to insert data
const  data_migration = async() =>{ try{  client.connect(error => {
  if (error) {
    console.error(error);
  } else {
    createTable('customers', `
    customer_id SERIAL PRIMARY KEY,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    age INTEGER,
    monthly_salary FLOAT,
    phone_number VARCHAR(255),
    approved_limit FLOAT,
    current_debt FLOAT DEFAULT 0
  `);
    importCustomersData('../customer_data.xlsx', 'customers');
  createTable('loans', `
    customer_id INTEGER,
    loan_id SERIAL PRIMARY KEY,
    loan_amount FLOAT NOT NULL,
    tenure INTEGER NOT NULL,
    interest_rate FLOAT NOT NULL,
    monthly_repayment FLOAT NOT NULL,
    emis_paid_on_time INTEGER,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
  `);
importLoanData('../loan_data.xlsx', 'loans')
updateCustomerDebt();
}
})}catch(err){
  console.log(err)
}
}


function createTable(table, columns) {
  const query = `CREATE TABLE IF NOT EXISTS ${table} (${columns})`;
  client.query(query, (error, response) => {
    console.log(error || `${table} table created`);
  });
}

async function updateCustomerDebt() {
  try {
    await client.query('BEGIN');

    // Get the sum of loan_amount for each customer_id from the loans table
    const res = await client.query('SELECT customer_id, SUM(loan_amount) as total_loan_amount FROM loans GROUP BY customer_id');
    const loanSums = res.rows;

    // For each customer, update their current_debt in the customers table
    for (const { customer_id, total_loan_amount } of loanSums) {
      await client.query('UPDATE customers SET current_debt = current_debt + $1 WHERE customer_id = $2', [total_loan_amount, customer_id]);
    }

    // Commit the transaction
    await client.query('COMMIT');

    console.log('Updated customer debts successfully');
  } catch (error) {
    // If an error occurs, rollback the transaction
    await client.query('ROLLBACK');
    console.error('Failed to update customer debts:', error);
  } finally {
  }
}

module.exports = data_migration
