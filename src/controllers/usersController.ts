import { Request, Response } from "express";
import User from "../models/User";

class UsersController {

    static async isStrongPassword(value: string, res: Response) {
        const letterCount = (value.match(/[A-Za-z]/g) || []).length;
        const hasUpperCase = /[A-Z]/.test(value);
        const hasNumber = /\d/.test(value);
        const hasSpecial = /[^A-Za-z0-9]/.test(value);

        if (letterCount < 7 || !hasUpperCase || !hasNumber || !hasSpecial) {
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
        const cleanCpf = value.replace(/[^\d]+/g, '');

        if (cleanCpf.length !== 11 || !!cleanCpf.match(/(\d)\1{10}/)) {
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

        if (!name || !email || !password || !cpf) {
            return res.status(400).send({
                message: "Nome, E-mail, CPF e a Senha são obrigatórios!"
            });
        } else {
            const savedUser = await User.findOne({ where: { email: email } })
            if (savedUser) {
                return res.status(400).json({ message: "Usuário já existe com esse Email" })
            }
        }

        const passwordValidation = await this.isStrongPassword(password, res);
        if (passwordValidation) {
            return passwordValidation;
        }

        const emailValidation = await this.isValidEmail(email, res);
        if (emailValidation) {
            return emailValidation;
        }

        const cpfValidation = await this.isValidCpf(cpf, res);
        if (cpfValidation) {
            return cpfValidation;
        }

        const user = await User.create({ name: name, email: email, password: password, cpf: cpf });
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

        if (password !== undefined) {
            const passwordValidation = await this.isStrongPassword(password, res);
            if (passwordValidation) {
                return passwordValidation;
            }
        }

        await user.update({
            name: name ?? user.name,
            password: password ?? user.password,
            cpf: cpf ?? user.cpf,
            admin: admin ?? user.admin,
        });

        return res.send(user);
    }



}

export default UsersController;