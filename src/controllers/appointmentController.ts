import { Request, Response } from "express";
import Appointment from "../models/Appointment";
import User from "../models/User";
import Service from "../models/Service";

class AppointmentsController {
    static async list(req: Request, res: Response) {
        const appointments = await Appointment.findAll({
            include: [
                { model: User, as: "user", attributes: { exclude: ["password"] } },
                { model: Service, as: "service" },
            ],
        });

        return res.send(appointments);
    }

    static async getById(req: Request, res: Response) {
        const { id } = req.params;
        const appointment = await Appointment.findByPk(Number(id), {
            include: [
                { model: User, as: "user", attributes: { exclude: ["password"] } },
                { model: Service, as: "service" },
            ],
        });

        if (!appointment) {
            return res.status(404).send({ message: "Agendamento não encontrado!" });
        }

        return res.send(appointment);
    }

    static async create(req: Request, res: Response) {
        const { user_id, service_id, status, notes } = req.body;

        if (user_id === undefined || service_id === undefined) {
            return res.status(400).send({
                message: "user_id e service_id são obrigatórios!"
            });
        }

        const parsedUserId = Number(user_id);
        const parsedServiceId = Number(service_id);

        if (
            !Number.isInteger(parsedUserId) || parsedUserId <= 0 ||
            !Number.isInteger(parsedServiceId) || parsedServiceId <= 0
        ) {
            return res.status(400).send({
                message: "user_id e service_id devem ser números inteiros válidos!"
            });
        }

        const user = await User.findByPk(parsedUserId);
        if (!user) {
            return res.status(404).send({ message: "Usuário não encontrado!" });
        }

        const service = await Service.findByPk(parsedServiceId);
        if (!service) {
            return res.status(404).send({ message: "Serviço não encontrado!" });
        }

        const appointment = await Appointment.create({
            user_id: parsedUserId,
            service_id: parsedServiceId,
            status: status ?? "scheduled",
            notes: notes ?? null,
        });

        return res.status(201).send(appointment);
    }

    static async update(req: Request, res: Response) {
        const { id } = req.params;
        const appointment = await Appointment.findByPk(Number(id));
        const { user_id, service_id, status, notes } = req.body;

        if (!appointment) {
            return res.status(404).send({ message: "Agendamento não encontrado!" });
        }

        if (
            user_id === undefined &&
            service_id === undefined &&
            status === undefined &&
            notes === undefined
        ) {
            return res.status(400).send({
                message: "Informe ao menos um campo para atualização!"
            });
        }

        if (status !== undefined && typeof status !== "string") {
            return res.status(400).send({ message: "status deve ser texto!" });
        }

        await appointment.update({
            user_id: user_id,
            service_id: service_id,
            status: status ?? appointment.status,
            notes: notes !== undefined ? notes : appointment.notes,
        });

        return res.send(appointment);
    }

    static async remove(req: Request, res: Response) {
        const { id } = req.params;
        const appointment = await Appointment.findByPk(Number(id));

        if (!appointment) {
            return res.status(404).send({ message: "Agendamento não encontrado!" });
        }

        await appointment.destroy();
        return res.status(204).send();
    }
}

export default AppointmentsController;