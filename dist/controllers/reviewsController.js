"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Review_1 = __importDefault(require("../models/Review"));
const User_1 = __importDefault(require("../models/User"));
const Appointment_1 = __importDefault(require("../models/Appointment"));
class ReviewsController {
    static async list(req, res) {
        const reviews = await Review_1.default.findAll({
            include: [
                { model: User_1.default, as: "user", attributes: { exclude: ["password"] } },
                { model: Appointment_1.default, as: "appointment" },
            ],
        });
        return res.send(reviews);
    }
    static async getById(req, res) {
        const { id } = req.params;
        const review = await Review_1.default.findByPk(Number(id), {
            include: [
                { model: User_1.default, as: "user", attributes: { exclude: ["password"] } },
                { model: Appointment_1.default, as: "appointment" },
            ],
        });
        if (!review) {
            return res.status(404).send({ message: "Avaliação não encontrada!" });
        }
        return res.send(review);
    }
    static async create(req, res) {
        const { user_id, appointment_id, score, comment } = req.body;
        if (user_id === undefined || appointment_id === undefined || score === undefined) {
            return res.status(400).send({
                message: "O usuário, o serviço e a nota são obrigatórios!"
            });
        }
        const parsedScore = Number(score);
        if (Number.isNaN(parsedScore) || parsedScore < 0 || parsedScore > 5) {
            return res.status(400).send({ message: "score deve ser um número entre 0 e 5!" });
        }
        const review = await Review_1.default.create({
            user_id: user_id,
            appointment_id: appointment_id,
            score: parsedScore,
            comment: comment ?? null,
        });
        return res.status(201).send(review);
    }
    static async remove(req, res) {
        const { id } = req.params;
        const review = await Review_1.default.findByPk(Number(id));
        if (!review) {
            return res.status(404).send({ message: "Avaliação não encontrada!" });
        }
        await review.destroy();
        return res.status(204).send();
    }
    static async update(req, res) {
        const { id } = req.params;
        const review = await Review_1.default.findByPk(Number(id));
        const { user_id, appointment_id, score, comment } = req.body;
        if (!review) {
            return res.status(404).send({ message: "Avaliação não encontrada!" });
        }
        if (user_id === undefined &&
            appointment_id === undefined &&
            score === undefined &&
            comment === undefined) {
            return res.status(400).send({
                message: "Informe ao menos um campo para atualização!"
            });
        }
        let newScore = review.score;
        if (score !== undefined) {
            const parsedScore = Number(score);
            if (Number.isNaN(parsedScore) || parsedScore < 0 || parsedScore > 5) {
                return res.status(400).send({ message: "score deve ser um número entre 0 e 5!" });
            }
            newScore = parsedScore;
        }
        await review.update({
            user_id: user_id,
            appointment_id: appointment_id,
            score: newScore,
            comment: comment !== undefined ? comment : review.comment,
        });
        return res.send(review);
    }
}
exports.default = ReviewsController;
