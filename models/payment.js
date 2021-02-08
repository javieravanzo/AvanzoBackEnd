module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Payment', {
    idPayment: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      defaultValue: null
    },
    Transaction_idTransaction: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      autoIncrement: false,
      primaryKey: false,
      defaultValue: null
    },
    createdAt: {
      type: 'TIMESTAMP',
      allowNull: true,
      autoIncrement: false,
      primaryKey: false,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      autoIncrement: false,
      primaryKey: false,
      defaultValue: null
    }
  }, {
    tableName: 'Payment'
  });
  
};