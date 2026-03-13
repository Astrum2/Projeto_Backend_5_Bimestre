import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import Barber from "./Barber";
import Appointment from "./Appointment";

class BarberSchedule extends Model {
    public id!: number;
    public barber_id!: number;
    public date!: string;
    public start!: string;
    public end!: string;
    public duration_minutes!: number;
    public status!: string;
    public appointment_id!: number | null;
    public slot_group!: string | null;
    public notes!: string | null;
    public created_at!: Date;
}

BarberSchedule.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        barber_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "barbers",
                key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "RESTRICT",
        },
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        start: {
            type: DataTypes.TIME,
            allowNull: false,
        },
        end: {
            type: DataTypes.TIME,
            allowNull: false,
        },
        duration_minutes: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        status: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: "available",
        },
        appointment_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: "appointments",
                key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "SET NULL",
        },
        slot_group: {
            type: DataTypes.STRING(36),
            allowNull: true,
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        tableName: "barber_schedule",
        timestamps: false,
    },
);

BarberSchedule.belongsTo(Barber, { foreignKey: "barber_id", as: "barber" });
Barber.hasMany(BarberSchedule, { foreignKey: "barber_id", as: "barberSchedules" });

BarberSchedule.belongsTo(Appointment, { foreignKey: "appointment_id", as: "appointment" });
Appointment.hasMany(BarberSchedule, { foreignKey: "appointment_id", as: "barberSchedules" });

export default BarberSchedule;