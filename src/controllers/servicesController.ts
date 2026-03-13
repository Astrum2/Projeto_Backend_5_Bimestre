import { Request, Response } from "express";
import Service from "../models/Service";

class ServicesController {

    static async list(req: Request, res: Response) {
        const services = await Service.findAll();

        res.send(services);
    }

    static async getById(req: Request, res: Response) {
        const { id } = req.params;
        const service = await Service.findByPk(Number(id));

        if (!service) {
            return res.status(404).send({ message: "Serviço não encontrado!" })
        }

        res.send(service);
    }

    static async create(req: Request, res: Response) {
        const { name, description, price, duration_minutes } = req.body;

        if (!name || !description || !price || !duration_minutes) {
            return res.status(400).send({
                message: "Nome, descrição, preço e a duração são obrigatórios!"
            });
        }

        const service = await Service.create({ name: name, description: description, price: price, duration_minutes: duration_minutes });
        res.send(service);
    }

    static async remove(req: Request, res: Response) {
        const { id } = req.params;
        const service = await Service.findByPk(Number(id));

        if (!service) {
            return res.status(404).send({ message: "Serviço não encontrado!" });
        }

        await service.destroy();
        return res.status(204).send();
    }

    static async update(req: Request, res: Response) {
        const { id } = req.params;
        const service = await Service.findByPk(Number(id));
        const { name, description, price, duration_minutes, active } = req.body;

        if (!service) {
            return res.status(404).send({ message: "Serviço não encontrado!" });
        }

        if (
            name === undefined &&
            description === undefined &&
            price === undefined &&
            duration_minutes === undefined &&
            active === undefined
        ) {
            return res.status(400).send({
                message: "Informe ao menos um campo para atualização!"
            });
        }

        await service.update({
            name: name ?? service.name,
            description: description ?? service.description,
            price: price ?? service.price,
            duration_minutes: duration_minutes ?? service.duration_minutes,
            active: active ?? service.active,
        });

        return res.send(service);
    }



}

export default ServicesController;