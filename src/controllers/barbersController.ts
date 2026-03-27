import { Request, Response } from "express";
import Barber from "../models/Barber";
import User from "../models/User";

class BarbersController {

    static async createFromData(data: { name: string; user_id: number; phone?: string | null }) {
        const { name, user_id, phone } = data;

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
        const { name, user_id, phone } = req.body;

        if (!name) {
            return res.status(400).send({
                message: "Nome é obrigatórios!"
            });
        }

        const barber = await Barber.create({ name: name, user_id: user_id, phone: phone ?? null });
        res.send(barber);
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
        const barber = await Barber.findByPk(Number(id));
        const { name, phone, active } = req.body;

        if (!barber) {
            return res.status(404).send({ message: "Barbeiro não encontrado!" });
        }

        if (name === undefined && phone === undefined && active === undefined) {
            return res.status(400).send({
                message: "Informe ao menos um campo para atualização!"
            });
        }

        await barber.update({
            name: name ?? barber.name,
            phone: phone ?? barber.phone,
            active: active ?? barber.active,
        });

        return res.send(barber);
    }
}

export default BarbersController;