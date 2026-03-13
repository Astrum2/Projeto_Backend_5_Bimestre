import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import User from "./User";
import Appointment from "./Appointment";

class Review extends Model {
    public id!: number;
    public user_id!: number;
    public appointment_id!: number;
    public score!: number;
    public comment!: string | null;
    public created_at!: Date;
}

Review.init(
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
        appointment_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "appointments",
                key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "RESTRICT",
        },
        score: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        comment: {
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
        tableName: "reviews",
        timestamps: false,
    },
);

Review.belongsTo(User, { foreignKey: "user_id", as: "user" });
User.hasMany(Review, { foreignKey: "user_id", as: "reviews" });

Review.belongsTo(Appointment, { foreignKey: "appointment_id", as: "appointment" });
Appointment.hasMany(Review, { foreignKey: "appointment_id", as: "reviews" });

export default Review;