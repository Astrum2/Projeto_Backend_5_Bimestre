import { Request, Response } from "express";
import BarberSchedule from "../models/BarberSchedule";
import Appointment from "../models/Appointment";
import User from "../models/User";
import Service from "../models/Service";

class BarberScheduleController {

    static async list(req: Request, res: Response) {
        const schedule = await BarberSchedule.findAll({
            include: [
                { model: User, as: "user", attributes: { exclude: ["password"] } },
                { model: Service, as: "service" },
                { model: Appointment, as: "appointment" }
            ],
        });


        res.send(schedule);
    }

    static async getById(req: Request, res: Response) {
        const { id } = req.params;
        const barberSchedule = await BarberSchedule.findByPk(Number(id), {
            include: [
                { model: User, as: "user", attributes: { exclude: ["password"] } },
                { model: Service, as: "service" },
                { model: Appointment, as: "appointment" }
            ],
        });

        if (!barberSchedule) {
            return res.status(404).send({ message: "Agenda não encontrada" })
        }

        res.send(barberSchedule);
    }

    static async create(req: Request, res: Response) {
        const {
            barber_id,
            date,
            start,
            end,
            duration_minutes,
            status,
            appointment_id,
            slot_group,
            notes,
        } = req.body;

        if (barber_id === undefined || !date || !start || !end || duration_minutes === undefined) {
            return res.status(400).send({
                message: "barber_id, date, start, end e duration_minutes são obrigatórios!",
            });
        }


        const barberSchedule = await BarberSchedule.create({
            barber_id: barber_id,
            date,
            start,
            end,
            duration_minutes: duration_minutes,
            status: status ?? "available",
            appointment_id: appointment_id,
            slot_group: slot_group ?? null,
            notes: notes ?? null,
        });

        return res.status(201).send(barberSchedule);
    }

    static async update(req: Request, res: Response) {
        const { id } = req.params;
        const barberSchedule = await BarberSchedule.findByPk(Number(id));
        const {
            barber_id,
            date,
            start,
            end,
            duration_minutes,
            status,
            appointment_id,
            slot_group,
            notes,
        } = req.body;

        if (!barberSchedule) {
            return res.status(404).send({ message: "Agendamento não encontrado!" });
        }

        if (
            barber_id === undefined &&
            date === undefined &&
            start === undefined &&
            end === undefined &&
            duration_minutes === undefined &&
            status === undefined &&
            appointment_id === undefined &&
            slot_group === undefined &&
            notes === undefined
        ) {
            return res.status(400).send({
                message: "Informe ao menos um campo para atualização!",
            });
        }


        await barberSchedule.update({
            barber_id: barber_id,
            date: date ?? barberSchedule.date,
            start: start ?? barberSchedule.start,
            end: end ?? barberSchedule.end,
            duration_minutes: duration_minutes,
            status: status ?? barberSchedule.status,
            appointment_id: appointment_id,
            slot_group: slot_group !== undefined ? slot_group : barberSchedule.slot_group,
            notes: notes !== undefined ? notes : barberSchedule.notes,
        });

        return res.send(barberSchedule);
    }

    static async remove(req: Request, res: Response) {
        const { id } = req.params;
        const barberSchedule = await BarberSchedule.findByPk(Number(id));

        if (!barberSchedule) {
            return res.status(404).send({ message: "Agenda não encontrada!" });
        }

        await barberSchedule.destroy();
        return res.status(204).send();
    }
}

export default BarberScheduleController