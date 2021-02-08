module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Services', {
    idService: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      defaultValue: null
    },
    serviceIcon: {
      type: DataTypes.STRING,
      allowNull: true,
      autoIncrement: false,
      primaryKey: false,
      defaultValue: null
    },
    serviceClassName: {
      type: DataTypes.STRING,
      allowNull: true,
      autoIncrement: false,
      primaryKey: false,
      defaultValue: null
    },
    serviceRoute: {
      type: DataTypes.STRING,
      allowNull: true,
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
    serviceName: {
      type: DataTypes.STRING,
      allowNull: true,
      autoIncrement: false,
      primaryKey: false,
      defaultValue: null
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      autoIncrement: false,
      primaryKey: false,
      defaultValue: null
    }
  }, {
    tableName: 'Services'
  });
  
};