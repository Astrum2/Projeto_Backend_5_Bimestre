import { Request, Response } from "express";
const barberModelMock = {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
};

jest.mock("../src/models/Barber", () => ({
    __esModule: true,
    default: barberModelMock,
}));

jest.mock("../src/models/User", () => ({
    __esModule: true,
    default: {},
}));

const BarbersController = require("../src/controllers/barbersController").default;
const Barber = require("../src/models/Barber").default;

describe("BarbersController", () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;

    beforeEach(() => {
        mockRequest = {};
        mockResponse = {
            send: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis(),
        };
        jest.clearAllMocks();
    });

    describe("list", () => {
        it("deve retornar todos os barbeiros", async () => {
            const mockBarbers = [
                { id: 1, name: "Arthur", phone: "11999999999", active: true },
                { id: 2, name: "Joao", phone: "11888888888", active: true },
            ];

            (Barber.findAll as jest.Mock).mockResolvedValue(mockBarbers);

            await BarbersController.list(mockRequest as Request, mockResponse as Response);

            expect(Barber.findAll).toHaveBeenCalledTimes(1);
            expect(mockResponse.send).toHaveBeenCalledWith(mockBarbers);
        });
    });

    describe("getById", () => {
        it("deve retornar um barbeiro pelo id", async () => {
            const mockBarber = { id: 1, name: "Arthur", phone: "11999999999", active: true };

            mockRequest.params = { id: "1" } as any;
            (Barber.findByPk as jest.Mock).mockResolvedValue(mockBarber);

            await BarbersController.getById(mockRequest as Request, mockResponse as Response);

            expect(Barber.findByPk).toHaveBeenCalledWith(1);
            expect(mockResponse.send).toHaveBeenCalledWith(mockBarber);
        });

        it("deve retornar 404 quando nao encontrar o barbeiro", async () => {
            mockRequest.params = { id: "999" } as any;
            (Barber.findByPk as jest.Mock).mockResolvedValue(null);

            await BarbersController.getById(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.send).toHaveBeenCalledWith({ message: "Barberiro não encontrado!" });
        });
    });

    describe("create", () => {
        it("deve criar um barbeiro", async () => {
            const body = { name: "Arthur", user_id: 1, phone: "11999999999", photo: "https://cdn.exemplo.com/arthur.jpg" };
            const createdBarber = { id: 1, ...body, active: true };

            mockRequest.body = body;
            (Barber.findOne as jest.Mock).mockResolvedValue(null);
            (Barber.create as jest.Mock).mockResolvedValue(createdBarber);

            await BarbersController.create(mockRequest as Request, mockResponse as Response);

            expect(Barber.findOne).toHaveBeenCalledWith({ where: { user_id: 1 } });
            expect(Barber.create).toHaveBeenCalledWith(body);
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.send).toHaveBeenCalledWith(createdBarber);
        });

        it("deve retornar 400 quando name nao for enviado", async () => {
            mockRequest.body = { user_id: 1, phone: "11999999999" };

            await BarbersController.create(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.send).toHaveBeenCalledWith({ message: "Nome é obrigatório!" });
        });
    });

    describe("remove", () => {
        it("deve remover um barbeiro existente", async () => {
            const mockBarber = { id: 1, destroy: jest.fn().mockResolvedValue(undefined) };

            mockRequest.params = { id: "1" } as any;
            (Barber.findByPk as jest.Mock).mockResolvedValue(mockBarber);

            await BarbersController.remove(mockRequest as Request, mockResponse as Response);

            expect(Barber.findByPk).toHaveBeenCalledWith(1);
            expect(mockBarber.destroy).toHaveBeenCalledTimes(1);
            expect(mockResponse.status).toHaveBeenCalledWith(204);
            expect(mockResponse.send).toHaveBeenCalledWith();
        });

        it("deve retornar 404 ao tentar remover barbeiro inexistente", async () => {
            mockRequest.params = { id: "999" } as any;
            (Barber.findByPk as jest.Mock).mockResolvedValue(null);

            await BarbersController.remove(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.send).toHaveBeenCalledWith({ message: "Barbeiro não encontrado!" });
        });
    });

    describe("update", () => {
        it("deve atualizar apenas os campos enviados", async () => {
            const mockBarber = { id: 1, name: "Arthur", phone: "11999999999", active: true, photo: "https://cdn.exemplo.com/old.jpg", update: jest.fn().mockResolvedValue(undefined) };

            mockRequest.params = { id: "1" } as any;
            mockRequest.body = { phone: "11888887777", active: false };
            (Barber.findByPk as jest.Mock).mockResolvedValue(mockBarber);

            await BarbersController.update(mockRequest as Request, mockResponse as Response);

            expect(mockBarber.update).toHaveBeenCalledWith({ name: "Arthur", phone: "11888887777", active: false, photo: "https://cdn.exemplo.com/old.jpg" });
            expect(mockResponse.send).toHaveBeenCalledWith(mockBarber);
        });

        it("deve atualizar a foto quando enviada", async () => {
            const mockBarber = { id: 1, name: "Arthur", phone: "11999999999", active: true, photo: "https://cdn.exemplo.com/old.jpg", update: jest.fn().mockResolvedValue(undefined) };

            mockRequest.params = { id: "1" } as any;
            mockRequest.body = { photo: "https://cdn.exemplo.com/new.jpg" };
            (Barber.findByPk as jest.Mock).mockResolvedValue(mockBarber);

            await BarbersController.update(mockRequest as Request, mockResponse as Response);

            expect(mockBarber.update).toHaveBeenCalledWith({ name: "Arthur", phone: "11999999999", active: true, photo: "https://cdn.exemplo.com/new.jpg" });
            expect(mockResponse.send).toHaveBeenCalledWith(mockBarber);
        });

        it("deve retornar 400 quando nenhum campo for enviado", async () => {
            const mockBarber = { id: 1, name: "Arthur", phone: "11999999999", active: true, update: jest.fn() };

            mockRequest.params = { id: "1" } as any;
            mockRequest.body = {};
            (Barber.findByPk as jest.Mock).mockResolvedValue(mockBarber);

            await BarbersController.update(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.send).toHaveBeenCalledWith({ message: "Informe ao menos um campo para atualização!" });
            expect(mockBarber.update).not.toHaveBeenCalled();
        });

        it("deve retornar 404 quando tentar atualizar barbeiro inexistente", async () => {
            mockRequest.params = { id: "999" } as any;
            mockRequest.body = { name: "Novo Nome" };
            (Barber.findByPk as jest.Mock).mockResolvedValue(null);

            await BarbersController.update(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.send).toHaveBeenCalledWith({ message: "Barbeiro não encontrado!" });
        });
    });
});