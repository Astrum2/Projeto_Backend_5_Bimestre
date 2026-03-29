"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const crypto_1 = require("crypto");
const BarberSchedule_1 = __importDefault(require("../models/BarberSchedule"));
const Appointment_1 = __importDefault(require("../models/Appointment"));
const User_1 = __importDefault(require("../models/User"));
const Service_1 = __importDefault(require("../models/Service"));
const SLOT_MINUTES = 15;
function toMinutes(time) {
    const [hours, minutes] = time.split(":");
    return Number(hours) * 60 + Number(minutes);
}
function toTime(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return String(hours).padStart(2, "0") + ":" + String(minutes).padStart(2, "0") + ":00";
}
class BarberScheduleController {
    static async list(req, res) {
        const schedule = await BarberSchedule_1.default.findAll({
            include: [
                { model: User_1.default, as: "user", attributes: { exclude: ["password"] } },
                { model: Service_1.default, as: "service" },
                { model: Appointment_1.default, as: "appointment" }
            ],
        });
        res.send(schedule);
    }
    static async getById(req, res) {
        const { id } = req.params;
        const barberSchedule = await BarberSchedule_1.default.findByPk(Number(id), {
            include: [
                { model: User_1.default, as: "user", attributes: { exclude: ["password"] } },
                { model: Service_1.default, as: "service" },
                { model: Appointment_1.default, as: "appointment" }
            ],
        });
        if (!barberSchedule) {
            return res.status(404).send({ message: "Agenda não encontrada" });
        }
        res.send(barberSchedule);
    }
    static async create(req, res) {
        const { barber_id, date, start, appointment_id, status, notes } = req.body;
        if (barber_id === undefined || !date || !start || appointment_id === undefined) {
            return res.status(400).send({
                message: "barber_id, date, start e appointment_id são obrigatórios!",
            });
        }
        const parsedBarberId = Number(barber_id);
        const parsedAppointmentId = Number(appointment_id);
        if (!Number.isInteger(parsedBarberId) || parsedBarberId <= 0 ||
            !Number.isInteger(parsedAppointmentId) || parsedAppointmentId <= 0) {
            return res.status(400).send({
                message: "barber_id e appointment_id devem ser inteiros válidos!",
            });
        }
        const appointment = await Appointment_1.default.findByPk(parsedAppointmentId);
        if (!appointment) {
            return res.status(404).send({ message: "Agendamento não encontrado!" });
        }
        const service = await Service_1.default.findByPk(appointment.service_id);
        if (!service) {
            return res.status(404).send({ message: "Serviço do agendamento não encontrado!" });
        }
        const totalDuration = Number(service.duration_minutes);
        if (!Number.isFinite(totalDuration) || totalDuration <= 0) {
            return res.status(400).send({ message: "Duração do serviço inválida!" });
        }
        const slotsCount = Math.ceil(totalDuration / SLOT_MINUTES);
        const groupId = (0, crypto_1.randomUUID)();
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
        const conflict = await BarberSchedule_1.default.findOne({
            where: {
                barber_id: parsedBarberId,
                date,
                start: { [sequelize_1.Op.in]: starts },
            },
        });
        if (conflict) {
            return res.status(409).send({ message: "Já existe slot ocupado nesse horário." });
        }
        const created = await BarberSchedule_1.default.bulkCreate(slots);
        return res.status(201).send({
            slot_group: groupId,
            slots_created: created.length,
            slots: created,
        });
    }
    static async update(req, res) {
        const { id } = req.params;
        const barberSchedule = await BarberSchedule_1.default.findByPk(Number(id));
        const { barber_id, date, start, end, duration_minutes, status, appointment_id, slot_group, notes, } = req.body;
        if (!barberSchedule) {
            return res.status(404).send({ message: "Agendamento não encontrado!" });
        }
        if (barber_id === undefined &&
            date === undefined &&
            start === undefined &&
            end === undefined &&
            duration_minutes === undefined &&
            status === undefined &&
            appointment_id === undefined &&
            slot_group === undefined &&
            notes === undefined) {
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
    static async remove(req, res) {
        const { id } = req.params;
        const barberSchedule = await BarberSchedule_1.default.findByPk(Number(id));
        if (!barberSchedule) {
            return res.status(404).send({ message: "Agenda não encontrada!" });
        }
        await barberSchedule.destroy();
        return res.status(204).send();
    }
}
exports.default = BarberScheduleController;
