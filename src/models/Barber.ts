import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class Barber extends Model {
    public id!: number;
    public name!: string;
    public phone!: string;
    public active!: boolean;
    public created_at!: Date;
}

Barber.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        phone: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        tableName: "barbers",
        timestamps: false,
    },
)

export default Barber;