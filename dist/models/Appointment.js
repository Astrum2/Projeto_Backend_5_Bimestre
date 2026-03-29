"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const User_1 = __importDefault(require("./User"));
const Service_1 = __importDefault(require("./Service"));
class Appointment extends sequelize_1.Model {
    id;
    user_id;
    service_id;
    status;
    notes;
    created_at;
}
Appointment.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    user_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "users",
            key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
    },
    service_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "services",
            key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
    },
    status: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "scheduled",
    },
    notes: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    created_at: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
}, {
    sequelize: database_1.default,
    tableName: "appointments",
    timestamps: false,
});
Appointment.belongsTo(User_1.default, { foreignKey: "user_id", as: "user" });
User_1.default.hasMany(Appointment, { foreignKey: "user_id", as: "appointments" });
Appointment.belongsTo(Service_1.default, { foreignKey: "service_id", as: "service" });
Service_1.default.hasMany(Appointment, { foreignKey: "service_id", as: "appointments" });
exports.default = Appointment;
