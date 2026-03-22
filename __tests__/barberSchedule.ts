import { Request, Response } from "express";
import { Op } from "sequelize";
import { randomUUID } from "crypto";
import BarberScheduleController from "../src/controllers/barberScheduleController";
import BarberSchedule from "../src/models/BarberSchedule";
import Appointment from "../src/models/Appointment";
import Service from "../src/models/Service";

jest.mock("../src/models/BarberSchedule", () => ({
    __esModule: true,
    default: {
        findAll: jest.fn(),
        findByPk: jest.fn(),
        findOne: jest.fn(),
        bulkCreate: jest.fn(),
    },
}));

jest.mock("../src/models/Appointment", () => ({
    __esModule: true,
    default: {
        findByPk: jest.fn(),
    },
}));

jest.mock("../src/models/Service", () => ({
    __esModule: true,
    default: {
        findByPk: jest.fn(),
    },
}));

jest.mock("crypto", () => ({
    randomUUID: jest.fn(),
}));

describe("BarberScheduleController", () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;

    beforeEach(() => {
        mockRequest = {};
        mockResponse = {
            send: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis(),
        };

        jest.clearAllMocks();
        jest.restoreAllMocks();
    });

    describe("list", () => {
        it("deve retornar todos os slots da agenda", async () => {
            const mockSchedule = [
                { id: 1, barber_id: 1, date: "2026-03-21", start: "09:00:00" },
                { id: 2, barber_id: 1, date: "2026-03-21", start: "09:15:00" },
            ];

            (BarberSchedule.findAll as jest.Mock).mockResolvedValue(mockSchedule);

            await BarberScheduleController.list(mockRequest as Request, mockResponse as Response);

            expect(BarberSchedule.findAll).toHaveBeenCalledWith(
                expect.objectContaining({ include: expect.any(Array) })
            );
            expect(mockResponse.send).toHaveBeenCalledWith(mockSchedule);
        });
    });

    describe("getById", () => {
        it("deve retornar um slot por id", async () => {
            const mockSlot = { id: 1, barber_id: 1, date: "2026-03-21", start: "09:00:00" };
            mockRequest.params = { id: "1" } as any;

            (BarberSchedule.findByPk as jest.Mock).mockResolvedValue(mockSlot);

            await BarberScheduleController.getById(mockRequest as Request, mockResponse as Response);

            expect(BarberSchedule.findByPk).toHaveBeenCalledWith(
                1,
                expect.objectContaining({ include: expect.any(Array) })
            );
            expect(mockResponse.send).toHaveBeenCalledWith(mockSlot);
        });

        it("deve retornar 404 quando agenda não for encontrada", async () => {
            mockRequest.params = { id: "999" } as any;
            (BarberSchedule.findByPk as jest.Mock).mockResolvedValue(null);

            await BarberScheduleController.getById(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.send).toHaveBeenCalledWith({ message: "Agenda não encontrada" });
        });
    });

    describe("create", () => {
        it("deve criar slots a partir da duração do serviço", async () => {
            mockRequest.body = { barber_id: 2, date: "2026-03-21", start: "09:00", appointment_id: 10 };

            (randomUUID as jest.Mock).mockReturnValue("group-123");
            (Appointment.findByPk as jest.Mock).mockResolvedValue({ id: 10, service_id: 7 });
            (Service.findByPk as jest.Mock).mockResolvedValue({ id: 7, duration_minutes: 30 });
            (BarberSchedule.findOne as jest.Mock).mockResolvedValue(null);

            const createdSlots = [
                {
                    id: 101,
                    barber_id: 2,
                    date: "2026-03-21",
                    start: "09:00:00",
                    end: "09:15:00",
                    duration_minutes: 15,
                    status: "booked",
                    appointment_id: 10,
                    slot_group: "group-123",
                    notes: null,
                },
                {
                    id: 102,
                    barber_id: 2,
                    date: "2026-03-21",
                    start: "09:15:00",
                    end: "09:30:00",
                    duration_minutes: 15,
                    status: "booked",
                    appointment_id: 10,
                    slot_group: "group-123",
                    notes: null,
                },
            ];

            (BarberSchedule.bulkCreate as jest.Mock).mockResolvedValue(createdSlots);

            await BarberScheduleController.create(mockRequest as Request, mockResponse as Response);

            expect(Appointment.findByPk).toHaveBeenCalledWith(10);
            expect(Service.findByPk).toHaveBeenCalledWith(7);
            expect(BarberSchedule.findOne).toHaveBeenCalledWith({
                where: {
                    barber_id: 2,
                    date: "2026-03-21",
                    start: { [Op.in]: ["09:00:00", "09:15:00"] },
                },
            });
            expect(BarberSchedule.bulkCreate).toHaveBeenCalledWith([
                {
                    barber_id: 2,
                    date: "2026-03-21",
                    start: "09:00:00",
                    end: "09:15:00",
                    duration_minutes: 15,
                    status: "booked",
                    appointment_id: 10,
                    slot_group: "group-123",
                    notes: null,
                },
                {
                    barber_id: 2,
                    date: "2026-03-21",
                    start: "09:15:00",
                    end: "09:30:00",
                    duration_minutes: 15,
                    status: "booked",
                    appointment_id: 10,
                    slot_group: "group-123",
                    notes: null,
                },
            ]);
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.send).toHaveBeenCalledWith({
                slot_group: "group-123",
                slots_created: 2,
                slots: createdSlots,
            });
        });

        it("deve retornar 400 quando campos obrigatórios não forem enviados", async () => {
            mockRequest.body = { barber_id: 2, date: "2026-03-21", start: "09:00" };

            await BarberScheduleController.create(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.send).toHaveBeenCalledWith({
                message: "barber_id, date, start e appointment_id são obrigatórios!",
            });
            expect(Appointment.findByPk).not.toHaveBeenCalled();
        });

        it("deve retornar 400 quando ids forem inválidos", async () => {
            mockRequest.body = { barber_id: "abc", date: "2026-03-21", start: "09:00", appointment_id: -1 };

            await BarberScheduleController.create(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.send).toHaveBeenCalledWith({
                message: "barber_id e appointment_id devem ser inteiros válidos!",
            });
        });

        it("deve retornar 404 quando agendamento não existir", async () => {
            mockRequest.body = { barber_id: 2, date: "2026-03-21", start: "09:00", appointment_id: 10 };

            (Appointment.findByPk as jest.Mock).mockResolvedValue(null);

            await BarberScheduleController.create(mockRequest as Request, mockResponse as Response);

            expect(Appointment.findByPk).toHaveBeenCalledWith(10);
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.send).toHaveBeenCalledWith({ message: "Agendamento não encontrado!" });
            expect(Service.findByPk).not.toHaveBeenCalled();
        });

        it("deve retornar 404 quando serviço do agendamento não existir", async () => {
            mockRequest.body = { barber_id: 2, date: "2026-03-21", start: "09:00", appointment_id: 10 };

            (Appointment.findByPk as jest.Mock).mockResolvedValue({ id: 10, service_id: 7 });
            (Service.findByPk as jest.Mock).mockResolvedValue(null);

            await BarberScheduleController.create(mockRequest as Request, mockResponse as Response);

            expect(Service.findByPk).toHaveBeenCalledWith(7);
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.send).toHaveBeenCalledWith({ message: "Serviço do agendamento não encontrado!" });
        });

        it("deve retornar 400 quando duração do serviço for inválida", async () => {
            mockRequest.body = { barber_id: 2, date: "2026-03-21", start: "09:00", appointment_id: 10 };

            (Appointment.findByPk as jest.Mock).mockResolvedValue({ id: 10, service_id: 7 });
            (Service.findByPk as jest.Mock).mockResolvedValue({ id: 7, duration_minutes: 0 });

            await BarberScheduleController.create(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.send).toHaveBeenCalledWith({ message: "Duração do serviço inválida!" });
            expect(BarberSchedule.findOne).not.toHaveBeenCalled();
        });

        it("deve retornar 409 quando houver conflito de horário", async () => {
            mockRequest.body = { barber_id: 2, date: "2026-03-21", start: "09:00", appointment_id: 10 };

            (randomUUID as jest.Mock).mockReturnValue("group-123");
            (Appointment.findByPk as jest.Mock).mockResolvedValue({ id: 10, service_id: 7 });
            (Service.findByPk as jest.Mock).mockResolvedValue({ id: 7, duration_minutes: 30 });
            (BarberSchedule.findOne as jest.Mock).mockResolvedValue({ id: 999 });

            await BarberScheduleController.create(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(409);
            expect(mockResponse.send).toHaveBeenCalledWith({ message: "Já existe slot ocupado nesse horário." });
            expect(BarberSchedule.bulkCreate).not.toHaveBeenCalled();
        });
    });

    describe("update", () => {
        it("deve atualizar agenda existente", async () => {
            const mockSchedule = {
                id: 1,
                barber_id: 2,
                date: "2026-03-21",
                start: "09:00:00",
                end: "09:15:00",
                duration_minutes: 15,
                status: "booked",
                appointment_id: 10,
                slot_group: "group-123",
                notes: null,
                update: jest.fn().mockResolvedValue(undefined),
            };

            mockRequest.params = { id: "1" } as any;
            mockRequest.body = { status: "done", notes: "Concluído" };

            (BarberSchedule.findByPk as jest.Mock).mockResolvedValue(mockSchedule);

            await BarberScheduleController.update(mockRequest as Request, mockResponse as Response);

            expect(mockSchedule.update).toHaveBeenCalledWith({
                barber_id: undefined,
                date: "2026-03-21",
                start: "09:00:00",
                end: "09:15:00",
                duration_minutes: undefined,
                status: "done",
                appointment_id: undefined,
                slot_group: "group-123",
                notes: "Concluído",
            });
            expect(mockResponse.send).toHaveBeenCalledWith(mockSchedule);
        });

        it("deve retornar 400 quando nenhum campo for enviado", async () => {
            const mockSchedule = {
                id: 1,
                date: "2026-03-21",
                start: "09:00:00",
                end: "09:15:00",
                status: "booked",
                slot_group: "group-123",
                notes: null,
                update: jest.fn(),
            };

            mockRequest.params = { id: "1" } as any;
            mockRequest.body = {};

            (BarberSchedule.findByPk as jest.Mock).mockResolvedValue(mockSchedule);

            await BarberScheduleController.update(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.send).toHaveBeenCalledWith({
                message: "Informe ao menos um campo para atualização!",
            });
            expect(mockSchedule.update).not.toHaveBeenCalled();
        });

        it("deve retornar 404 quando agenda não existir", async () => {
            mockRequest.params = { id: "999" } as any;
            mockRequest.body = { status: "done" };

            (BarberSchedule.findByPk as jest.Mock).mockResolvedValue(null);

            await BarberScheduleController.update(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.send).toHaveBeenCalledWith({ message: "Agendamento não encontrado!" });
        });
    });

    describe("remove", () => {
        it("deve remover agenda existente", async () => {
            const mockSchedule = { id: 1, destroy: jest.fn().mockResolvedValue(undefined) };
            mockRequest.params = { id: "1" } as any;

            (BarberSchedule.findByPk as jest.Mock).mockResolvedValue(mockSchedule);

            await BarberScheduleController.remove(mockRequest as Request, mockResponse as Response);

            expect(BarberSchedule.findByPk).toHaveBeenCalledWith(1);
            expect(mockSchedule.destroy).toHaveBeenCalledTimes(1);
            expect(mockResponse.status).toHaveBeenCalledWith(204);
            expect(mockResponse.send).toHaveBeenCalledWith();
        });

        it("deve retornar 404 ao remover agenda inexistente", async () => {
            mockRequest.params = { id: "999" } as any;
            (BarberSchedule.findByPk as jest.Mock).mockResolvedValue(null);

            await BarberScheduleController.remove(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.send).toHaveBeenCalledWith({ message: "Agenda não encontrada!" });
        });
    });
});