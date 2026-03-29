"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const Barber_1 = __importDefault(require("./Barber"));
const Appointment_1 = __importDefault(require("./Appointment"));
class BarberSchedule extends sequelize_1.Model {
    id;
    barber_id;
    date;
    start;
    end;
    duration_minutes;
    status;
    appointment_id;
    slot_group;
    notes;
    created_at;
}
BarberSchedule.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    barber_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "barbers",
            key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
    },
    date: {
        type: sequelize_1.DataTypes.DATEONLY,
        allowNull: false,
    },
    start: {
        type: sequelize_1.DataTypes.TIME,
        allowNull: false,
    },
    end: {
        type: sequelize_1.DataTypes.TIME,
        allowNull: false,
    },
    duration_minutes: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    status: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "available",
    },
    appointment_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: "appointments",
            key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
    },
    slot_group: {
        type: sequelize_1.DataTypes.STRING(36),
        allowNull: true,
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
    tableName: "barber_schedule",
    timestamps: false,
});
BarberSchedule.belongsTo(Barber_1.default, { foreignKey: "barber_id", as: "barber" });
Barber_1.default.hasMany(BarberSchedule, { foreignKey: "barber_id", as: "barberSchedules" });
BarberSchedule.belongsTo(Appointment_1.default, { foreignKey: "appointment_id", as: "appointment" });
Appointment_1.default.hasMany(BarberSchedule, { foreignKey: "appointment_id", as: "barberSchedules" });
exports.default = BarberSchedule;
