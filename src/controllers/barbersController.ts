import { Request, Response } from "express";
import Barber from "../models/Barber";

class BarbersController {

    static async list(req: Request, res: Response) {
        const barbers = await Barber.findAll();

        res.send(barbers);
    }

    static async getById(req: Request, res: Response) {
        const { id } = req.params;
        const barber = await Barber.findByPk(Number(id));

        if (!barber) {
            return res.status(404).send({ message: "Barberiro não encontrado!"})
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

        const barber = await Barber.create({name: name, user_id: user_id, phone:phone});
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