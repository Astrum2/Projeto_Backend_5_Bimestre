"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const User_1 = __importDefault(require("./User"));
const Appointment_1 = __importDefault(require("./Appointment"));
class Review extends sequelize_1.Model {
    id;
    user_id;
    appointment_id;
    score;
    comment;
    created_at;
}
Review.init({
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
    appointment_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "appointments",
            key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
    },
    score: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false,
    },
    comment: {
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
    tableName: "reviews",
    timestamps: false,
});
Review.belongsTo(User_1.default, { foreignKey: "user_id", as: "user" });
User_1.default.hasMany(Review, { foreignKey: "user_id", as: "reviews" });
Review.belongsTo(Appointment_1.default, { foreignKey: "appointment_id", as: "appointment" });
Appointment_1.default.hasMany(Review, { foreignKey: "appointment_id", as: "reviews" });
exports.default = Review;
