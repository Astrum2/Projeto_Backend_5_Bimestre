import { Request, Response } from "express";
import Appointment from "../models/Appointment";
import User from "../models/User";
import Service from "../models/Service";
import Barber from "../models/Barber";
import BarberScheduleController from "./barberScheduleController";
import sequelize from "../config/database";

class AppointmentsController {
    private static isValidDate(value: string): boolean {
        return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
    }

    private static isValidTime(value: string): boolean {
        return /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(value);
    }

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
                { model: Barber, as: "barber" },
            ],
        });

        if (!appointment) {
            return res.status(404).send({ message: "Agendamento não encontrado!" });
        }

        return res.send(appointment);
    }

    static async create(req: Request, res: Response) {
        const { user_id, service_id, barber_id, date, time, status, notes } = req.body;

        if (
            user_id === undefined ||
            service_id === undefined ||
            barber_id === undefined ||
            !date ||
            !time
        ) {
            return res.status(400).send({
                message: "user_id, service_id, barber_id, date e time são obrigatórios!"
            });
        }

        const parsedUserId = Number(user_id);
        const parsedServiceId = Number(service_id);
        const parsedBarberId = Number(barber_id);

        if (
            !Number.isInteger(parsedUserId) || parsedUserId <= 0 ||
            !Number.isInteger(parsedServiceId) || parsedServiceId <= 0 ||
            !Number.isInteger(parsedBarberId) || parsedBarberId <= 0
        ) {
            return res.status(400).send({
                message: "user_id, service_id e barber_id devem ser números inteiros válidos!"
            });
        }

        if (typeof date !== "string" || !AppointmentsController.isValidDate(date)) {
            return res.status(400).send({ message: "date deve estar no formato YYYY-MM-DD!" });
        }

        if (typeof time !== "string" || !AppointmentsController.isValidTime(time)) {
            return res.status(400).send({ message: "time deve estar no formato HH:mm ou HH:mm:ss!" });
        }

        const user = await User.findByPk(parsedUserId);
        if (!user) {
            return res.status(404).send({ message: "Usuário não encontrado!" });
        }

        const service = await Service.findByPk(parsedServiceId);
        if (!service) {
            return res.status(404).send({ message: "Serviço não encontrado!" });
        }

        const barber = await Barber.findByPk(parsedBarberId);
        if (!barber) {
            return res.status(404).send({ message: "Barbeiro não encontrado!" });
        }

        try {
            const appointment = await sequelize.transaction(async (transaction) => {
                const createdAppointment = await Appointment.create(
                    {
                        user_id: parsedUserId,
                        service_id: parsedServiceId,
                        barber_id: parsedBarberId,
                        date,
                        time,
                        status: status ?? "scheduled",
                        notes: notes ?? null,
                    },
                    { transaction }
                );

                await BarberScheduleController.createFromAppointmentData({
                    barber_id: parsedBarberId,
                    date,
                    start: time,
                    appointment_id: createdAppointment.id,
                    service_id: parsedServiceId,
                    status: "booked",
                    notes: notes ?? null,
                    transaction,
                });

                return createdAppointment;
            });

            return res.status(201).send(appointment);
        } catch (error) {
            if (BarberScheduleController.isScheduleCreateError(error)) {
                return res.status(error.status).send({ message: error.message });
            }

            return res.status(500).send({ message: "Erro ao criar agendamento!" });
        }
    }

    static async update(req: Request, res: Response) {
        const { id } = req.params;
        const appointment = await Appointment.findByPk(Number(id));
        const { user_id, service_id, barber_id, date, time, status, notes } = req.body;

        if (!appointment) {
            return res.status(404).send({ message: "Agendamento não encontrado!" });
        }

        if (
            user_id === undefined &&
            service_id === undefined &&
            barber_id === undefined &&
            date === undefined &&
            time === undefined &&
            status === undefined &&
            notes === undefined
        ) {
            return res.status(400).send({
                message: "Informe ao menos um campo para atualização!"
            });
        }

        if (
            date !== undefined &&
            (typeof date !== "string" || !AppointmentsController.isValidDate(date))
        ) {
            return res.status(400).send({ message: "date deve estar no formato YYYY-MM-DD!" });
        }

        if (
            time !== undefined &&
            (typeof time !== "string" || !AppointmentsController.isValidTime(time))
        ) {
            return res.status(400).send({ message: "time deve estar no formato HH:mm ou HH:mm:ss!" });
        }

        if (status !== undefined && typeof status !== "string") {
            return res.status(400).send({ message: "status deve ser texto!" });
        }

        await appointment.update({
            user_id: user_id,
            service_id: service_id,
            barber_id: barber_id,
            date: date ?? appointment.date,
            time: time ?? appointment.time,
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