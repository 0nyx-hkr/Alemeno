module.exports = (sequelize,DataTypes) =>{
    const Customer = sequelize.define("customer",{
        customer_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            // allowNull : false,
            autoIncrement: true
          },
        first_name: {
             type : DataTypes.STRING,
             allowNull : false
            },

        last_name: {
             type : DataTypes.STRING,
            allowNull : false
        },
        age : {
            type : DataTypes.INTEGER,
            allowNull : true
        },
        phone_number: {
             type : DataTypes.INTEGER,
             allowNull : false
            },

        monthly_salary:{ 
            type :  DataTypes.INTEGER,
            allowNull : false
        },

        approved_limit: { 
            type : DataTypes.INTEGER,
            allowNull : false
        },

        current_debt: { 
            type : DataTypes.FLOAT,
            defaultValue: 0.0 ,
            allowNull : false
        }
    },{
        timestamps: false, 
      })

    return Customer;
}