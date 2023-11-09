const db = require('../models')

const Customer = db.customers



const create_customer = async (req, res) => {
  try {
    const { first_name, last_name, age, monthly_income, phone_number } = req.body;
    const approved_limit = Math.round(monthly_income * 36 / 100000) * 100000;

    // Check if a customer with the given details already exists
    let customer = await Customer.findOne({
      where: {
        first_name: first_name,
        last_name: last_name,
        phone_number: phone_number,
        monthly_salary: monthly_income,
        approved_limit: approved_limit,
        age: age
      }
    });

    // If the customer does not exist, create a new customer
    if (!customer) {
      customer = await Customer.create({
        first_name: first_name,
        last_name: last_name,
        phone_number: phone_number,
        monthly_salary: monthly_income,
        approved_limit: approved_limit,
        age: age
      });
    }

    res.status(200).json({
      customer_id: customer.id,
      name: `${customer.first_name} ${customer.last_name}`,
      age: age,
      monthly_income: monthly_income,
      approved_limit: approved_limit,
      phone_number: phone_number
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
};


module.exports = {
    create_customer
}



