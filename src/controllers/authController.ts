import { Request, Response } from "express";
import User from "../models/User";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

class AuthController {
     static async login(req: Request, res: Response) {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).send({ message: "E-mail e senha são obrigatórios!" });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const user = await User.findOne({
            where: { email: normalizedEmail },
            attributes: ["id", "name", "email", "admin", "password"],
        });

        const hash = user?.getDataValue("password");
        const passwordMatches = hash ? await bcrypt.compare(password.trim(), hash) : false;

        if (!user || !passwordMatches) {
            return res.status(401).send({ message: "E-mail ou senha inválidos!" });
        }

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                admin: user.admin
            },
            process.env.JWT_SECRET as string,
            {
                expiresIn: "1d"
            }
        )
        return res.status(200).send({
            message: "Login realizado com sucesso!",
            token
        });
    }
}


export default AuthController