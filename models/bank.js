module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Bank', {
    idBank: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      defaultValue: null
    },
    bankName: {
      type: DataTypes.STRING,
      allowNull: false,
      autoIncrement: false,
      primaryKey: false,
      defaultValue: null
    },
    bankCode: {
      type: DataTypes.STRING,
      allowNull: false,
      autoIncrement: false,
      primaryKey: false,
      defaultValue: null
    },
    isForOutlay: {
      type: DataTypes.INTEGER(4),
      allowNull: false,
      autoIncrement: false,
      primaryKey: false,
      defaultValue: null
    },
    isWallet: {
      type: DataTypes.INTEGER(4),
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
    tableName: 'Bank'
  });
  
};