import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import User from "./User";
import Service from "./Service";

class Appointment extends Model {
    public id!: number;
    public user_id!: number;
    public service_id!: number;
    public status!: string;
    public notes!: string | null;
    public created_at!: Date;
}

Appointment.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "users",
                key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "RESTRICT",
        },
        service_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "services",
                key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "RESTRICT",
        },
        status: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: "scheduled",
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
        tableName: "appointments",
        timestamps: false,
    },
);

Appointment.belongsTo(User, { foreignKey: "user_id", as: "user" });
User.hasMany(Appointment, { foreignKey: "user_id", as: "appointments" });

Appointment.belongsTo(Service, { foreignKey: "service_id", as: "service" });
Service.hasMany(Appointment, { foreignKey: "service_id", as: "appointments" });

export default Appointment;