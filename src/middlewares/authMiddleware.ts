import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";

type TokenPayload = {
    id: number,
    password: string,
    admin: boolean
}

async function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(403).json({ error: 'Acesso não permitido' });
    }

    const parts = token.split(" ");
    if (parts.length != 2) {
        return res.status(403).json({ error: 'Token Inválido' });
    }

    try {
        const decoded = jwt.verify(
            parts[1],
            process.env.JWT_SECRET! as string
        ) as TokenPayload;

        const user = await User.findByPk(Number(decoded.id));
        if (user) {
            return next();
        } else {
            return res.status(404).json({ message: 'Usuário não encontrado! '})
        }
    } catch (err) {
        return res.status(403).json({ error: 'Token Inválido' });
    }


    return next();
}

export default authMiddleware