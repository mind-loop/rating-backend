/* jshint indent: 1 */
module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    "email",
    {
      id: {
        type: DataTypes.INTEGER(10).UNSIGNED,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      is_active: { 
        type: DataTypes.BOOLEAN,
        defaultValue:false
      },
      username:{
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      password:{
        type: DataTypes.STRING(100),
        allowNull: false,
      },
    },
    {
      tableName: "email",
      timestamps: true,
    }
  );
};
