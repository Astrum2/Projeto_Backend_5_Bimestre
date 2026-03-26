import { Request, Response } from "express";
import User from "../models/User";
import bcrypt from "bcrypt";
import jwt, { Secret, SignOptions } from "jsonwebtoken";

class UsersController {

    static async isStrongPassword(value: string, res: Response) {
        const hasUpperCase = /[A-Z]/.test(value);
        const hasNumber = /\d/.test(value);
        const hasSpecial = /[^A-Za-z0-9]/.test(value);

        if (value.length < 7 || !hasUpperCase || !hasNumber || !hasSpecial) {
            return res.status(400).send({ message: "A senha deve conter ao mínimo: 7 letras, um caractere maisculo, um número e um caractere especial" });
        }
    }

    static async isValidEmail(value: string, res: Response) {
        const email = value?.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

        if (!email || !emailRegex.test(email)) {
            return res.status(400).send({
                message: "E-mail inválido!"
            });
        }
    }

    static async isValidCpf(value: string, res: Response) {

        if (value.length !== 11 || !!value.match(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/)) {
            return res.status(400).send({
                message: "CPF inválido!"
            });
        }
    }

    static async list(req: Request, res: Response) {
        const users = await User.findAll();

        res.send(users);
    }

    static async getById(req: Request, res: Response) {
        const { id } = req.params;
        const user = await User.findByPk(Number(id));

        if (!user) {
            return res.status(404).send({ message: "Usuário não encontrado!" })
        }

        res.send(user);
    }

    static async create(req: Request, res: Response) {
        const { name, email, password, cpf } = req.body;
        const passwordValidation = await UsersController.isStrongPassword(password, res);
        const emailValidation = await UsersController.isValidEmail(email, res);
        const cpfValidation = await UsersController.isValidCpf(cpf, res);

        if (!name || !email || !password || !cpf) {
            return res.status(400).send({
                message: "Nome, E-mail, CPF e a Senha são obrigatórios!"
            });
        } else {
            const savedUser = await User.findOne({ where: { email: email.trim() } });
            if (savedUser) {
                return res.status(400).json({ message: "Usuário já existe com esse Email" });
            }
        }


        if (passwordValidation) {
            return passwordValidation;
        }


        if (emailValidation) {
            return emailValidation;
        }


        if (cpfValidation) {
            return cpfValidation;
        }

        const hashedPassword = await bcrypt.hash(password.trim(), 10);

        const user = await User.create({
            name: name,
            email: email.trim().toLowerCase(),
            password: hashedPassword,
            cpf: cpf
        });

        return res.status(201).send(user);
    }

    static async remove(req: Request, res: Response) {
        const { id } = req.params;
        const user = await User.findByPk(Number(id));

        if (!user) {
            return res.status(404).send({ message: "Usuário não encontrado!" });
        }

        await user.destroy();
        return res.status(204).send();
    }

    static async update(req: Request, res: Response) {
        const { id } = req.params;
        const user = await User.findByPk(Number(id));
        const { name, password, cpf, admin } = req.body;

        if (!user) {
            return res.status(404).send({ message: "Usuário não encontrado!" });
        }

        if (!name && !password && !cpf && admin === undefined) {
            return res.status(400).send({
                message: "Informe ao menos um campo para atualização!"
            });
        }

        let nextPassword = user.password;

        if (password !== undefined) {
            const passwordValidation = await UsersController.isStrongPassword(password, res);
            if (passwordValidation) {
                return passwordValidation;
            }

            nextPassword = await bcrypt.hash(password.trim(), 10);
        }

        await user.update({
            name: name ?? user.name,
            password: nextPassword,
            cpf: cpf ?? user.cpf,
            admin: admin ?? user.admin,
        });

        return res.send(user);
    }
}

export default UsersController;