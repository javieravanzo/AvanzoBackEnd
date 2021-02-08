module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Sms', {
    sms_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      defaultValue: null
    },
    sms_to: {
      type: DataTypes.STRING,
      allowNull: true,
      autoIncrement: false,
      primaryKey: false,
      defaultValue: null
    },
    sms_body: {
      type: DataTypes.STRING,
      allowNull: true,
      autoIncrement: false,
      primaryKey: false,
      defaultValue: null
    },
    sms_forwarded: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      autoIncrement: false,
      primaryKey: false,
      defaultValue: 0
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
    tableName: 'Sms'
  });
  
};