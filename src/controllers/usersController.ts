import { Request, Response } from "express";
import bcrypt from "bcrypt";
import User from "../models/User";
import BarbersController from "./barbersController";

class UsersController {
    static normalizeCpf(value: string) {
        return value?.replace(/\D/g, "") ?? "";
    }

    static isCpfValid(cpf: string) {
        const normalizedCpf = UsersController.normalizeCpf(cpf);

        if (!normalizedCpf || normalizedCpf.length !== 11) {
            return false;
        }

        if (/^(\d)\1{10}$/.test(normalizedCpf)) {
            return false;
        }

        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(normalizedCpf[i], 10) * (10 - i);
        }

        let remainder = (sum * 10) % 11;
        if (remainder === 10) remainder = 0;
        if (remainder !== parseInt(normalizedCpf[9], 10)) {
            return false;
        }

        sum = 0;
        for (let i = 0; i < 10; i++) {
            sum += parseInt(normalizedCpf[i], 10) * (11 - i);
        }

        remainder = (sum * 10) % 11;
        if (remainder === 10) remainder = 0;
        if (remainder !== parseInt(normalizedCpf[10], 10)) {
            return false;
        }

        return true;
    }

    static async isStrongPassword(value: string, res: Response) {
        const password = value?.trim();

        const hasUpperCase = /[A-Z]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasSpecial = /[^A-Za-z0-9]/.test(password);

        if (!password || password.length < 7 || !hasUpperCase || !hasNumber || !hasSpecial) {
            return res.status(400).send({
                message: "A senha deve conter no mínimo 7 caracteres, uma letra maiúscula, um número e um caractere especial"
            });
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
        if (!UsersController.isCpfValid(value)) {
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
            return res.status(404).send({ message: "Usuário não encontrado!" });
        }

        res.send(user);
    }

    static async create(req: Request, res: Response) {
        const { name, email, password, cpf, admin } = req.body ?? {};

        if (!name || !email || !password || !cpf) {
            return res.status(400).send({
                message: "Nome, E-mail, CPF e a Senha são obrigatórios!"
            });
        }

        const passwordValidation = await UsersController.isStrongPassword(password, res);
        if (passwordValidation) {
            return passwordValidation;
        }

        const emailValidation = await UsersController.isValidEmail(email, res);
        if (emailValidation) {
            return emailValidation;
        }

        const cpfValidation = await UsersController.isValidCpf(cpf, res);
        if (cpfValidation) {
            return cpfValidation;
        }

        const savedUser = await User.findOne({
            where: { email: email.trim().toLowerCase() }
        });

        if (savedUser) {
            return res.status(400).json({ message: "Usuário já existe com esse Email" });
        }

        const hashedPassword = await bcrypt.hash(password.trim(), 10);

        const user = await User.create({
            name: name,
            email: email.trim().toLowerCase(),
            password: hashedPassword,
            cpf: UsersController.normalizeCpf(cpf),
            admin: admin ?? 0
        });

        const isAdmin = admin === 1 || admin === true || admin === "1";

        if (isAdmin) {
            await BarbersController.createFromData({
                name: user.name,
                user_id: user.id,
                phone: req.body.phone ?? null,
            });
        }

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
        const { name, email, password, cpf, admin } = req.body ?? {};

        if (!req.body || typeof req.body !== "object") {
            return res.status(400).send({ message: "Corpo da requisição inválido!" });
        }

        if (!user) {
            return res.status(404).send({ message: "Usuário não encontrado!" });
        }

        if (!name && !email && !password && !cpf && admin === undefined) {
            return res.status(400).send({
                message: "Informe ao menos um campo para atualização!"
            });
        }

        let nextPassword = user.password;
        let nextEmail = user.email;

        if (email !== undefined) {
            const emailValidation = await UsersController.isValidEmail(email, res);
            if (emailValidation) {
                return emailValidation;
            }

            const normalizedEmail = email.trim().toLowerCase();
            const existingUser = await User.findOne({
                where: { email: normalizedEmail }
            });

            if (existingUser && existingUser.id !== Number(id)) {
                return res.status(400).send({ message: "Usuário já existe com esse Email" });
            }

            nextEmail = normalizedEmail;
        }

        if (password !== undefined) {
            const passwordValidation = await UsersController.isStrongPassword(password, res);
            if (passwordValidation) {
                return passwordValidation;
            }

            nextPassword = await bcrypt.hash(password.trim(), 10);
        }

        if (cpf !== undefined) {
            const cpfValidation = await UsersController.isValidCpf(cpf, res);
            if (cpfValidation) {
                return cpfValidation;
            }
        }

        await user.update({
            name: name ?? user.name,
            email: nextEmail,
            password: nextPassword,
            cpf: cpf !== undefined ? UsersController.normalizeCpf(cpf) : user.cpf,
            admin: admin ?? user.admin,
        });

        return res.send(user);
    }
}

export default UsersController;