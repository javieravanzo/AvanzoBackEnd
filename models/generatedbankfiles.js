module.exports = function(sequelize, DataTypes) {
  return sequelize.define('GeneratedBankFiles', {
    geba_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      defaultValue: null
    },
    bank_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      autoIncrement: false,
      primaryKey: false,
      defaultValue: null
    },
    geba_path: {
      type: DataTypes.STRING,
      allowNull: true,
      autoIncrement: false,
      primaryKey: false,
      defaultValue: null
    },
    geba_description: {
      type: DataTypes.STRING,
      allowNull: true,
      autoIncrement: false,
      primaryKey: false,
      defaultValue: null
    },
    geba_json_requests: {
      type: DataTypes.JSON,
      allowNull: true,
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
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      autoIncrement: false,
      primaryKey: false,
      defaultValue: null
    }
  }, {
    tableName: 'GeneratedBankFiles'
  });
  
};