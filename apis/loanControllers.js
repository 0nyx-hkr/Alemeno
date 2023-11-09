const db = require('../models')

const Customer = db.customers
const Loan = db.loans

const check_loan_eligibility = async(req,res) =>{
    try{
        const loanDetails = await check_eligibility(Loan, Customer, req.body);
        res.status(200).json(loanDetails);
    }
    catch (err) {
        res.status(500).send(err.message);
    }
    }
function calculateCreditScore(customer, loans) {
  let score = 80;
  if (customer){

  // i. Past Loans paid on time
  const timelyLoans = loans.filter(loan => loan.EMIs_paid_on_time === loan.tenure);
  if (timelyLoans.length < loans.length / 2) {
    score -= 20;
  }

  // ii. No of loans taken in past
  if (loans.length > 5) {
    score -= 10; 
  }

  // iii. Loan activity in current year
  const currentYearLoans = loans.filter(loan => new Date(loan.start_date).getFullYear() === new Date().getFullYear());
  if (currentYearLoans.length > 2) {
    score -= 10; 
  }

  // iv. Loan approved volume
  const totalLoanAmount = loans.reduce((sum, loan) => sum + loan.loan_amount, 0);
  if (totalLoanAmount > customer.approved_limit) {
    score -= 20; 
  }

  // v. If sum of current loans of customer > approved limit of customer, credit score = 0
  const currentDebt = loans.reduce((sum, loan) => sum + (loan.tenure - loan.EMIs_paid_on_time) * loan.monthly_repayment, 0);
  if (currentDebt > customer.approved_limit) {
    score = 0; 
  }
}

  return score;
}
      

// ./create-loan

const create_loan  =  async(req,res) =>{
    try{
        const eligibility =  await check_eligibility(Loan,Customer,req.body);
        let loan_id = null;
        let message = "Loan Not approved"
        if (eligibility['approval']){
            message = "Congrats Loan Approved!"
            const start_date = new Date();
            const end_date = new Date();
            end_date.setMonth(end_date.getMonth() + eligibility['tenure']);

            // For No customer 
            const customer = await Customer.findOne({ where: { customer_id:eligibility['customer_id']} });
             if (customer){
                const newLoan = await Loan.create({
                    customer_id: eligibility['customer_id'],
                    loan_amount: req.body['loan_amount'],
                    interest_rate: eligibility['corrected_interest_rate'],
                    tenure: eligibility['tenure'],
                    monthly_repayment: eligibility['monthly_installment'],
                    start_date: start_date,
                    end_date: end_date,
                    emis_paid_on_time: 0
                  });
                  loan_id = newLoan.loan_id;
                  customer.current_debt += req.body['loan_amount'];
                 await customer.save();
             }else{
                eligibility['approval'] = false
                message = "Please create id to get loan"
             }            
        }
        res.status(200).json({
            loan_id: loan_id,
            customer_id: eligibility['customer_id'],
            loan_approved: eligibility['approval'],
            message: message,
            monthly_installment: eligibility['monthly_installment']
          });
        } catch (err) {
          res.status(500).send(err.message);
        }


    }

// ./view-loan/loan_id


const get_loan_details = async(req,res) =>{
    try {
        const { loan_id } = req.params;
        const loan = await Loan.findOne({ where: { loan_id: loan_id } });
    
        if (!loan) {
          return res.status(404).json({ message: "Loan not found" });
        }
    
        const customer = await Customer.findOne({ where: { customer_id: loan.customer_id } });
    
        if (!customer) {
          return res.status(404).json({ message: "Customer not found" });
        }
        res.status(200).json({
            loan_id: loan.loan_id,
            customer: {
              id: customer.customer_id,
              first_name: customer.first_name,
              last_name: customer.last_name,
              phone_number: customer.phone_number,
              age: customer.age
            },
            loan_amount: loan.loan_amount,
            interest_rate: loan.interest_rate,
            monthly_installment: loan.monthly_repayment,
            tenure: loan.tenure
          });
        } catch (err) {
            res.status(500).send(err.message);
          }
        
} 

// ./make-payment/customer_id/loan_id

const emi_change =async(req,res) =>{
    try{
        const { customer_id, loan_id } = req.params;
        const  payment_amount  = req.body['payment'];
        const loan = await Loan.findOne({ where: { loan_id: loan_id, customer_id: customer_id } });

        if (!loan) {
        return res.status(404).json({ message: "Loan not found" });
        }
        loan.emis_paid_on_time += 1;
        let diff = payment_amount - loan.monthly_repayment
        if ( diff != 0 ){
                total_amount = loan.loan_amount *(1+(((loan.interest_rate)/100)*(loan.tenure /12) ))
                balance = total_amount - (loan.monthly_repayment*(loan.emis_paid_on_time -1)) - payment_amount
                if (balance < 0){
                    return res.status(400).json({ message: "Paying More than needed" })
                } 
                loan.monthly_repayment = balance/(loan.tenure - loan.emis_paid_on_time)/12            
        }
        await loan.save();

         res.status(200).json({
           message: "Payment successful",
           new_installment_amount: loan.monthly_repayment
         });
         } catch (err) {
           res.status(500).send(err.message);
         }
    }


// ./view-statement/customer_id/load-id

const  get_statement = async(req,res) =>{
    try{
        const { customer_id, loan_id } = req.params;
        const loan = await Loan.findOne({ where: { loan_id: loan_id, customer_id: customer_id } });
    
        if (!loan) {
          return res.status(404).json({ message: "Loan not found" });
        }
    
        const customer = await Customer.findOne({ where: { customer_id: customer_id } });
    
        if (!customer) {
          return res.status(404).json({ message: "Customer not found" });
        }
        const principal = loan.loan_amount;
    const interest_rate = loan.interest_rate;
    const amount_paid = loan.emis_paid_on_time * loan.monthly_repayment;
    const monthly_installment = loan.monthly_repayment;
    const repayments_left = loan.tenure - loan.emis_paid_on_time;

    res.status(200).json({
      customer_id: customer_id,
      loan_id: loan_id,
      principal: principal,
      interest_rate: interest_rate,
      amount_paid: amount_paid,
      monthly_installment: monthly_installment,
      repayments_left: repayments_left
    });
    }catch (err) {
        res.status(500).send(err.message);
      }
}

const check_eligibility  = async (loanTable, customerTable, requestBody) =>{
    const { customer_id, loan_amount, interest_rate, tenure } = requestBody;
    const customer = await Customer.findOne({ where: { customer_id: customer_id } });
    const loans =  await Loan.findAll({ where: { customer_id: customer_id } });
    let creditScore = calculateCreditScore(customer,loans)
    let approval = false;
    let corrected_interest_rate = interest_rate;
    if (creditScore > 50) {
        approval = true;
    } else if (creditScore > 30) {
        approval = true;
        corrected_interest_rate = Math.max(interest_rate, 12);
    } else if (creditScore > 10) {
        approval = true;
        corrected_interest_rate = Math.max(interest_rate, 16);
    }
    // const intrest_amount = loan_amount*(corrected_interest_rate / 100)*(tenure/12)
    // const monthly_installment = (loan_amount+intrest_amount)/tenure/12;
    let monthlyInterestRate = corrected_interest_rate / (12 * 100);
    let onePlusRPowerN = Math.pow(1 + monthlyInterestRate, tenure);
    let monthly_installment = (loan_amount * monthlyInterestRate * onePlusRPowerN) / (onePlusRPowerN - 1);
    return {
        customer_id,
        approval,
        interest_rate,
        corrected_interest_rate,
        tenure,
        monthly_installment
    };

}

module.exports = {
    check_loan_eligibility,
    create_loan,
    get_loan_details,
    emi_change,
    get_statement
}