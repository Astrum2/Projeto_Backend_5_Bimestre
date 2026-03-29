"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
async function authMiddleware(req, res, next) {
    const token = req.headers.authorization;
    if (!token) {
        return res.status(403).json({ error: 'Acesso não permitido' });
    }
    const parts = token.split(" ");
    if (parts.length != 2) {
        return res.status(403).json({ error: 'Token Inválido' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(parts[1], process.env.JWT_SECRET);
        const user = await User_1.default.findByPk(Number(decoded.id));
        if (user) {
            return next();
        }
        else {
            return res.status(404).json({ message: 'Usuário não encontrado! ' });
        }
    }
    catch (err) {
        return res.status(403).json({ error: 'Token Inválido' });
    }
    return next();
}
exports.default = authMiddleware;
