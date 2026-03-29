"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Appointment_1 = __importDefault(require("../models/Appointment"));
const User_1 = __importDefault(require("../models/User"));
const Service_1 = __importDefault(require("../models/Service"));
class AppointmentsController {
    static async list(req, res) {
        const appointments = await Appointment_1.default.findAll({
            include: [
                { model: User_1.default, as: "user", attributes: { exclude: ["password"] } },
                { model: Service_1.default, as: "service" },
            ],
        });
        return res.send(appointments);
    }
    static async getById(req, res) {
        const { id } = req.params;
        const appointment = await Appointment_1.default.findByPk(Number(id), {
            include: [
                { model: User_1.default, as: "user", attributes: { exclude: ["password"] } },
                { model: Service_1.default, as: "service" },
            ],
        });
        if (!appointment) {
            return res.status(404).send({ message: "Agendamento não encontrado!" });
        }
        return res.send(appointment);
    }
    static async create(req, res) {
        const { user_id, service_id, status, notes } = req.body;
        if (user_id === undefined || service_id === undefined) {
            return res.status(400).send({
                message: "user_id e service_id são obrigatórios!"
            });
        }
        const parsedUserId = Number(user_id);
        const parsedServiceId = Number(service_id);
        if (!Number.isInteger(parsedUserId) || parsedUserId <= 0 ||
            !Number.isInteger(parsedServiceId) || parsedServiceId <= 0) {
            return res.status(400).send({
                message: "user_id e service_id devem ser números inteiros válidos!"
            });
        }
        const user = await User_1.default.findByPk(parsedUserId);
        if (!user) {
            return res.status(404).send({ message: "Usuário não encontrado!" });
        }
        const service = await Service_1.default.findByPk(parsedServiceId);
        if (!service) {
            return res.status(404).send({ message: "Serviço não encontrado!" });
        }
        const appointment = await Appointment_1.default.create({
            user_id: parsedUserId,
            service_id: parsedServiceId,
            status: status ?? "scheduled",
            notes: notes ?? null,
        });
        return res.status(201).send(appointment);
    }
    static async update(req, res) {
        const { id } = req.params;
        const appointment = await Appointment_1.default.findByPk(Number(id));
        const { user_id, service_id, status, notes } = req.body;
        if (!appointment) {
            return res.status(404).send({ message: "Agendamento não encontrado!" });
        }
        if (user_id === undefined &&
            service_id === undefined &&
            status === undefined &&
            notes === undefined) {
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
    static async remove(req, res) {
        const { id } = req.params;
        const appointment = await Appointment_1.default.findByPk(Number(id));
        if (!appointment) {
            return res.status(404).send({ message: "Agendamento não encontrado!" });
        }
        await appointment.destroy();
        return res.status(204).send();
    }
}
exports.default = AppointmentsController;
