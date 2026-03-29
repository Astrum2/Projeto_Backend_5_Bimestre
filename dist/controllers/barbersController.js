"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Barber_1 = __importDefault(require("../models/Barber"));
const User_1 = __importDefault(require("../models/User"));
class BarbersController {
    static async createFromData(data) {
        const { name, user_id, phone } = data;
        if (!name) {
            throw new Error("Nome é obrigatório!");
        }
        if (!user_id) {
            throw new Error("user_id é obrigatório!");
        }
        return Barber_1.default.create({
            name,
            user_id,
            phone: phone ?? null,
        });
    }
    static async list(req, res) {
        const barbers = await Barber_1.default.findAll({
            include: [
                { model: User_1.default, as: "user", attributes: { exclude: ["password"] } },
            ],
        });
        res.send(barbers);
    }
    static async getById(req, res) {
        const { id } = req.params;
        const barber = await Barber_1.default.findByPk(Number(id));
        if (!barber) {
            return res.status(404).send({ message: "Barberiro não encontrado!" });
        }
        res.send(barber);
    }
    static async create(req, res) {
        const { name, user_id, phone } = req.body;
        if (!name) {
            return res.status(400).send({
                message: "Nome é obrigatórios!"
            });
        }
        const barber = await Barber_1.default.create({ name: name, user_id: user_id, phone: phone ?? null });
        res.send(barber);
    }
    static async remove(req, res) {
        const { id } = req.params;
        const barber = await Barber_1.default.findByPk(Number(id));
        if (!barber) {
            return res.status(404).send({ message: "Barbeiro não encontrado!" });
        }
        await barber.destroy();
        return res.status(204).send();
    }
    static async update(req, res) {
        const { id } = req.params;
        const barber = await Barber_1.default.findByPk(Number(id));
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
exports.default = BarbersController;
