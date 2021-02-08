module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Transaction', {
    idTransaction: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      defaultValue: null
    },
    quantity: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      autoIncrement: false,
      primaryKey: false,
      defaultValue: null
    },
    transactionType: {
      type: DataTypes.STRING,
      allowNull: false,
      autoIncrement: false,
      primaryKey: false,
      defaultValue: null
    },
    createdAt: {
      type: 'TIMESTAMP',
      allowNull: false,
      autoIncrement: false,
      primaryKey: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    },
    registeredBy: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      autoIncrement: false,
      primaryKey: false,
      defaultValue: null
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      autoIncrement: false,
      primaryKey: false,
      defaultValue: null
    },
    Account_idAccount: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      autoIncrement: false,
      primaryKey: false,
      defaultValue: null
    }
  }, {
    tableName: 'Transaction'
  });
  
};