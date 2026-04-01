import { Request, Response } from "express";
import Barber from "../models/Barber";
import User from "../models/User";

class BarbersController {

    static async createFromData(data: { name: string; user_id: number; phone?: string | null; photo?: string | null }) {
        const { name, user_id, phone, photo } = data;

        if (!name) {
            throw new Error("Nome é obrigatório!");
        }

        if (!user_id) {
            throw new Error("user_id é obrigatório!");
        }

        return Barber.create({
            name,
            user_id,
            phone: phone ?? null,
            photo: photo ?? null,
        });
    }

    static async updateFromData(
        barberId: number,
        data: { name?: string; phone?: string | null; active?: boolean; photo?: string | null }
    ) {
        const barber = await Barber.findByPk(barberId);

        if (!barber) {
            throw new Error("Barbeiro não encontrado!");
        }

        return barber.update({
            name: data.name !== undefined ? String(data.name).trim() : barber.name,
            phone: data.phone !== undefined ? data.phone : barber.phone,
            active: data.active !== undefined ? data.active : barber.active,
            photo: data.photo !== undefined ? data.photo : barber.photo,
        });
    }

    static async list(req: Request, res: Response) {
        const barbers = await Barber.findAll({
            include: [
                { model: User, as: "user", attributes: { exclude: ["password"] } },
            ],
        });

        res.send(barbers);
    }

    static async getById(req: Request, res: Response) {
        const { id } = req.params;
        const barber = await Barber.findByPk(Number(id));

        if (!barber) {
            return res.status(404).send({ message: "Barberiro não encontrado!" })
        }

        res.send(barber);
    }

    static async create(req: Request, res: Response) {
        const { name, user_id, phone, photo } = req.body ?? {};

        if (!name || String(name).trim().length === 0) {
            return res.status(400).send({ message: "Nome é obrigatório!" });
        }

        const existingBarber = await Barber.findOne({
            where: { user_id: Number(user_id) },
        });

        if (existingBarber) {
            return res.status(409).send({ message: "Já existe barbeiro para este usuário!" });
        }

        const barber = await Barber.create({
            name: String(name).trim(),
            user_id: Number(user_id),
            phone: phone ?? null,
            photo: photo ?? null,
        });

        return res.status(201).send(barber);
    }

    static async remove(req: Request, res: Response) {
        const { id } = req.params;
        const barber = await Barber.findByPk(Number(id));

        if (!barber) {
            return res.status(404).send({ message: "Barbeiro não encontrado!" });
        }

        await barber.destroy();
        return res.status(204).send();
    }

    static async update(req: Request, res: Response) {
        const { id } = req.params;
        const barberId = Number(id);
        const { name, phone, active, photo } = req.body ?? {};

        if (!req.body || typeof req.body !== "object") {
            return res.status(400).send({ message: "Corpo da requisição inválido!" });
        }

        const hasName = Object.prototype.hasOwnProperty.call(req.body, "name");
        const hasPhone = Object.prototype.hasOwnProperty.call(req.body, "phone");
        const hasActive = Object.prototype.hasOwnProperty.call(req.body, "active");
        const hasPhoto = Object.prototype.hasOwnProperty.call(req.body, "photo");

        if (!hasName && !hasPhone && !hasActive && !hasPhoto) {
            return res.status(400).send({
                message: "Informe ao menos um campo para atualização!"
            });
        }

        if (hasName && (!name || String(name).trim().length === 0)) {
            return res.status(400).send({ message: "Nome inválido!" });
        }

        let updatedBarber;

        try {
            updatedBarber = await BarbersController.updateFromData(barberId, {
                name: hasName ? String(name).trim() : undefined,
                phone: hasPhone ? phone : undefined,
                active: hasActive ? active : undefined,
                photo: hasPhoto ? photo : undefined,
            });
        } catch {
            return res.status(404).send({ message: "Barbeiro não encontrado!" });
        }

        return res.send(updatedBarber);
    }
}

export default BarbersController;