import { Request, Response } from "express";
import { Op } from "sequelize";
import { Transaction } from "sequelize";
import { randomUUID } from "crypto";
import BarberSchedule from "../models/BarberSchedule";
import Appointment from "../models/Appointment";
import Barber from "../models/Barber";
import Service from "../models/Service";

const SLOT_MINUTES = 15;

function toMinutes(time: string): number {
    const [hours, minutes] = time.split(":");
    return Number(hours) * 60 + Number(minutes);
}

function toTime(totalMinutes: number): string {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return String(hours).padStart(2, "0") + ":" + String(minutes).padStart(2, "0") + ":00";
}

type ScheduleCreateInput = {
    barber_id: number;
    date: string;
    start: string;
    appointment_id: number;
    service_id?: number;
    status?: string;
    notes?: string | null;
    transaction?: Transaction;
};

type ScheduleCreateResult = {
    slot_group: string;
    slots_created: number;
    slots: BarberSchedule[];
};

type ScheduleCreateError = {
    status: number;
    message: string;
};

class BarberScheduleController {

    private static createError(status: number, message: string): ScheduleCreateError {
        return { status, message };
    }

    static isScheduleCreateError(error: object | null): error is ScheduleCreateError {
        if (!error) {
            return false;
        }

        if (!("status" in error) || !("message" in error)) {
            return false;
        }

        const candidate = error as { status?: number; message?: string };
        return typeof candidate.status === "number" && typeof candidate.message === "string";
    }

    static async createFromAppointmentData(data: ScheduleCreateInput): Promise<ScheduleCreateResult> {
        const { barber_id, date, start, appointment_id, service_id, status, notes, transaction } = data;

        if (barber_id === undefined || !date || !start || appointment_id === undefined) {
            throw BarberScheduleController.createError(
                400,
                "barber_id, date, start e appointment_id são obrigatórios!"
            );
        }

        const parsedBarberId = Number(barber_id);
        const parsedAppointmentId = Number(appointment_id);

        if (
            !Number.isInteger(parsedBarberId) || parsedBarberId <= 0 ||
            !Number.isInteger(parsedAppointmentId) || parsedAppointmentId <= 0
        ) {
            throw BarberScheduleController.createError(
                400,
                "barber_id e appointment_id devem ser inteiros válidos!"
            );
        }

        const appointment = transaction ? await Appointment.findByPk(parsedAppointmentId, { transaction }) : await Appointment.findByPk(parsedAppointmentId);

        if (!appointment) {
            throw BarberScheduleController.createError(404, "Agendamento não encontrado!");
        }

        const parsedServiceId = service_id !== undefined ? Number(service_id) : Number(appointment.service_id);

        if (!Number.isInteger(parsedServiceId) || parsedServiceId <= 0) {
            throw BarberScheduleController.createError(400, "service_id do agendamento é inválido!");
        }

        const service = transaction ? await Service.findByPk(parsedServiceId, { transaction }) : await Service.findByPk(parsedServiceId);

        if (!service) {
            throw BarberScheduleController.createError(404, "Serviço do agendamento não encontrado!");
        }

        const durationRaw = service.duration_minutes ?? service.get("duration_minutes") ?? service.getDataValue("duration_minutes");

        const normalizedDuration = Number(durationRaw);

        if (!Number.isFinite(normalizedDuration) || normalizedDuration <= 0) {
            throw BarberScheduleController.createError(400, "Duração do serviço inválida!");
        }

        const totalDuration = normalizedDuration;
        if (!Number.isFinite(totalDuration) || totalDuration <= 0) {
            throw BarberScheduleController.createError(400, "Duração do serviço inválida!");
        }

        const slotsCount = Math.ceil(totalDuration / SLOT_MINUTES);
        const groupId = randomUUID();
        const firstMinute = toMinutes(start);

        const slots = Array.from({ length: slotsCount }, (_, index) => {
            const slotStart = firstMinute + index * SLOT_MINUTES;
            const slotEnd = slotStart + SLOT_MINUTES;

            return {
                barber_id: parsedBarberId,
                date,
                start: toTime(slotStart),
                end: toTime(slotEnd),
                duration_minutes: SLOT_MINUTES,
                status: status ?? "booked",
                appointment_id: parsedAppointmentId,
                slot_group: groupId,
                notes: notes ?? null,
            };
        });

        const starts = slots.map((slot) => slot.start);

        const conflict = transaction ? await BarberSchedule.findOne({
            where: { barber_id: parsedBarberId, date, start: { [Op.in]: starts } },
            transaction,
        }) : await BarberSchedule.findOne({
            where: { barber_id: parsedBarberId, date, start: { [Op.in]: starts } },
        });

        if (conflict) {
            throw BarberScheduleController.createError(409, "Já existe slot ocupado nesse horário.");
        }

        const created = transaction ? await BarberSchedule.bulkCreate(slots, { transaction }) : await BarberSchedule.bulkCreate(slots);

        return { slot_group: groupId, slots_created: created.length, slots: created };
    }

    static async list(req: Request, res: Response) {
        const schedule = await BarberSchedule.findAll({
            include: [
                { model: Barber, as: "barber", attributes: { exclude: ["password"] } },
                { model: Appointment, as: "appointment" }
            ],
        });


        res.send(schedule);
    }

    static async getById(req: Request, res: Response) {
        const { id } = req.params;
        const barberSchedule = await BarberSchedule.findByPk(Number(id), {
            include: [
                { model: Barber, as: "barber", attributes: { exclude: ["password"] } },
                { model: Appointment, as: "appointment" }
            ],
        });

        if (!barberSchedule) {
            return res.status(404).send({ message: "Agenda não encontrada" })
        }

        res.send(barberSchedule);
    }

    static async create(req: Request, res: Response) {
        try {
            const result = await BarberScheduleController.createFromAppointmentData(req.body);
            return res.status(201).send(result);
        } catch (error) {
            const normalizedError = typeof error === "object" && error !== null ? error : null;

            if (BarberScheduleController.isScheduleCreateError(normalizedError)) {
                return res.status(normalizedError.status).send({ message: normalizedError.message });
            }

            return res.status(500).send({ message: "Erro ao criar agenda do barbeiro!" });
        }
    }

    static async update(req: Request, res: Response) {
        const { id } = req.params;
        const barberSchedule = await BarberSchedule.findByPk(Number(id));
        const { barber_id, date, start, end, duration_minutes, status, appointment_id, slot_group, notes, } = req.body;
        const nextBarberId = barber_id ?? barberSchedule?.barber_id;
        const nextDurationMinutes = duration_minutes ?? barberSchedule?.duration_minutes;
        const nextAppointmentId = appointment_id ?? barberSchedule?.appointment_id;

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
            barber_id: nextBarberId,
            date: date ?? barberSchedule.date,
            start: start ?? barberSchedule.start,
            end: end ?? barberSchedule.end,
            duration_minutes: nextDurationMinutes,
            status: status ?? barberSchedule.status,
            appointment_id: nextAppointmentId,
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