// const { sequelize } = require(".");

module.exports  =   (sequelize,DataTypes) =>{
    const Loan = sequelize.define('loans',{
            loan_id :{
                type : DataTypes.INTEGER,
                primaryKey: true,
                allowNull : false,
                autoIncrement: true,
            },
            customer_id:{
                type: DataTypes.INTEGER,
                references:{
                    model: 'customers', 
                    key: 'customer_id',
                }
            },
            loan_amount : {
                type : DataTypes.FLOAT,
                allowNull : false
            },
            interest_rate :{
                type : DataTypes.FLOAT,
                allowNull : false
            },
            tenure : {
                type : DataTypes.INTEGER,
                allowNull : false
            },
            monthly_repayment : {
                type : DataTypes.FLOAT,
                allowNull : false
            },
            emis_paid_on_time : {
                type : DataTypes.INTEGER,
                // allowNull : false
            },
            start_date : {
                type :  DataTypes.DATEONLY,
                allowNull : false
            },
            end_date : {
                type :  DataTypes.DATEONLY,
                allowNull : false
            }




    },{
        timestamps: false, 
      })

    return Loan;
}
