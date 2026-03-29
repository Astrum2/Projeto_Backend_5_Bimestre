"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const User_1 = __importDefault(require("../models/User"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class AuthController {
    static async login(req, res) {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).send({ message: "E-mail e senha são obrigatórios!" });
        }
        const normalizedEmail = email.trim().toLowerCase();
        const user = await User_1.default.findOne({
            where: { email: normalizedEmail },
            attributes: ["id", "name", "email", "admin", "password"],
        });
        const hash = user?.getDataValue("password");
        const passwordMatches = hash ? await bcrypt_1.default.compare(password.trim(), hash) : false;
        if (!user || !passwordMatches) {
            return res.status(401).send({ message: "E-mail ou senha inválidos!" });
        }
        const token = jsonwebtoken_1.default.sign({
            id: user.id,
            email: user.email,
            admin: user.admin
        }, process.env.JWT_SECRET, {
            expiresIn: "1d"
        });
        return res.status(200).send({
            message: "Login realizado com sucesso!",
            token
        });
    }
}
exports.default = AuthController;
