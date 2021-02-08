module.exports = function(sequelize, DataTypes) {
  return sequelize.define('LoginHistory', {
    lohi_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      defaultValue: null
    },
    lohi_ip: {
      type: DataTypes.STRING,
      allowNull: false,
      autoIncrement: false,
      primaryKey: false,
      defaultValue: null
    },
    lohi_browser: {
      type: DataTypes.STRING,
      allowNull: false,
      autoIncrement: false,
      primaryKey: false,
      defaultValue: null
    },
    lohi_so: {
      type: DataTypes.STRING,
      allowNull: false,
      autoIncrement: false,
      primaryKey: false,
      defaultValue: null
    },
    idUser: {
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
    tableName: 'LoginHistory'
  });
  
};