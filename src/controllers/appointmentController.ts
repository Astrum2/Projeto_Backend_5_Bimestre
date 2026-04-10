import { Request, Response } from "express";
import { Op } from "sequelize";
import Appointment from "../models/Appointment";
import User from "../models/User";
import Service from "../models/Service";
import Barber from "../models/Barber";
import BarberSchedule from "../models/BarberSchedule";
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
            const normalizedError = typeof error === "object" && error !== null ? error : null;

            if (BarberScheduleController.isScheduleCreateError(normalizedError)) {
                return res.status(normalizedError.status).send({ message: normalizedError.message });
            }

            return res.status(500).send({ message: "Erro ao criar agendamento!" });
        }
    }

    static async update(req: Request, res: Response) {
        const { id } = req.params;
        const appointment = await Appointment.findByPk(Number(id));
        const { user_id, service_id, barber_id, date, time, status, notes } = req.body;
        const appointmentId = Number(appointment?.getDataValue?.("id") ?? appointment?.id ?? Number(id));
        const nextUserId = user_id ?? appointment?.user_id;
        const nextServiceId = service_id ?? appointment?.service_id;
        const nextBarberId = barber_id ?? appointment?.barber_id;
        const nextDate = date ?? appointment?.date;
        const nextTime = time ?? appointment?.time;

        if (!appointment) {
            return res.status(404).send({ message: "Agendamento não encontrado!" });
        }

        if (!Number.isInteger(appointmentId) || appointmentId <= 0) {
            return res.status(500).send({ message: "Id do agendamento inválido!" });
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

        const shouldSyncSchedule =
            barber_id !== undefined ||
            service_id !== undefined ||
            date !== undefined ||
            time !== undefined ||
            notes !== undefined;

        try {
            const updatedAppointment = await sequelize.transaction(async (transaction) => {
                const updated = await appointment.update(
                    {
                        user_id: nextUserId,
                        service_id: nextServiceId,
                        barber_id: nextBarberId,
                        date: nextDate,
                        time: nextTime,
                        status: status ?? appointment.status,
                        notes: notes !== undefined ? notes : appointment.notes,
                    },
                    { transaction }
                );

                if (shouldSyncSchedule) {
                    await BarberSchedule.destroy({
                        where: { appointment_id: appointmentId },
                        transaction,
                    });

                    await BarberScheduleController.createFromAppointmentData({
                        barber_id: Number(nextBarberId),
                        date: String(nextDate),
                        start: String(nextTime),
                        appointment_id: appointmentId,
                        service_id: Number(nextServiceId),
                        status: "booked",
                        notes: updated.notes ?? null,
                        transaction,
                    });
                }

                return updated;
            });

            return res.send(updatedAppointment);
        } catch (error) {
            const normalizedError = typeof error === "object" && error !== null ? error : null;

            if (BarberScheduleController.isScheduleCreateError(normalizedError)) {
                return res.status(normalizedError.status).send({ message: normalizedError.message });
            }

            return res.status(500).send({ message: "Erro ao atualizar agendamento! Erro: " + error });
        }
    }

    static async remove(req: Request, res: Response) {
        const { id } = req.params;
        const appointment = await Appointment.findByPk(Number(id));

        if (!appointment) {
            return res.status(404).send({ message: "Agendamento não encontrado!" });
        }

        const appointmentId = Number(
            appointment.getDataValue?.("id") ?? appointment.id ?? Number(id)
        );

        if (!Number.isInteger(appointmentId) || appointmentId <= 0) {
            return res.status(500).send({ message: "Id do agendamento inválido!" });
        }

        try {
            await sequelize.transaction(async (transaction) => {
                const linkedSlots = await BarberSchedule.findAll({
                    where: { appointment_id: appointmentId },
                    attributes: ["slot_group"],
                    transaction,
                });

                const slotGroups = Array.from(
                    new Set(
                        linkedSlots
                            .map((slot) => slot.slot_group)
                            .filter((group): group is string => typeof group === "string" && group.length > 0)
                    )
                );

                const scheduleWhere = slotGroups.length > 0
                    ? {
                        [Op.or]: [
                            { appointment_id: appointmentId },
                            { slot_group: { [Op.in]: slotGroups } },
                        ],
                    }
                    : { appointment_id: appointmentId };

                await BarberSchedule.destroy({
                    where: scheduleWhere,
                    transaction,
                });

                await appointment.destroy({ transaction });
            });

            return res.status(204).send();
        } catch (error) {
            return res.status(500).send({ message: "Erro ao remover agendamento! Erro: " + error });
        }
    }
}

export default AppointmentsController;