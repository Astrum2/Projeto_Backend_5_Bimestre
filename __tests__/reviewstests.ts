import { Request, Response } from "express";
import ReviewsController from "../src/controllers/reviewsController";
import Review from "../src/models/Review";

describe("ReviewsController", () => {
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
        it("deve retornar todas as avaliacoes", async () => {
            const mockReviews = [
                { id: 1, user_id: 1, appointment_id: 1, score: 4.5, comment: "Muito bom" },
                { id: 2, user_id: 2, appointment_id: 2, score: 5, comment: null }
            ];

            const findAllSpy = jest.spyOn(Review, "findAll").mockResolvedValue(mockReviews as any);

            await ReviewsController.list(mockRequest as Request, mockResponse as Response);

            expect(findAllSpy).toHaveBeenCalledTimes(1);
            expect(findAllSpy).toHaveBeenCalledWith(
                expect.objectContaining({ include: expect.any(Array) })
            );
            expect(mockResponse.send).toHaveBeenCalledWith(mockReviews);
        });
    });

    describe("getById", () => {
        it("deve retornar uma avaliacao por id", async () => {
            const mockReview = { id: 1, user_id: 1, appointment_id: 1, score: 5, comment: "Excelente" };

            mockRequest.params = { id: "1" } as any;

            const findByPkSpy = jest
                .spyOn(Review, "findByPk")
                .mockResolvedValue(mockReview as any);

            await ReviewsController.getById(mockRequest as Request, mockResponse as Response);

            expect(findByPkSpy).toHaveBeenCalledWith(
                1,
                expect.objectContaining({
                    include: expect.any(Array),
                })
            );
            expect(mockResponse.send).toHaveBeenCalledWith(mockReview);
        });

        it("deve retornar 404 quando a avaliacao nao existir", async () => {
            mockRequest.params = { id: "999" } as any;

            jest.spyOn(Review, "findByPk").mockResolvedValue(null);

            await ReviewsController.getById(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.send).toHaveBeenCalledWith({ message: "Avaliação não encontrada!" });
        });
    });

    describe("create", () => {
        it("deve criar uma avaliacao e retornar 201", async () => {
            const requestBody = { user_id: 1, appointment_id: 2, score: "4.5", comment: "Bom atendimento" };

            const createdReview = { id: 10, user_id: 1, appointment_id: 2, score: 4.5, comment: "Bom atendimento" };

            mockRequest.body = requestBody;

            const createSpy = jest.spyOn(Review, "create").mockResolvedValue(createdReview as any);

            await ReviewsController.create(mockRequest as Request, mockResponse as Response);

            expect(createSpy).toHaveBeenCalledWith({ user_id: 1, appointment_id: 2, score: 4.5, comment: "Bom atendimento" });
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.send).toHaveBeenCalledWith(createdReview);
        });

        it("deve retornar 400 quando campos obrigatorios nao forem enviados", async () => {
            mockRequest.body = { user_id: 1, score: 4 };

            await ReviewsController.create(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.send).toHaveBeenCalledWith({ message: "O usuário, o serviço e a nota são obrigatórios!" });
        });

        it("deve retornar 400 quando score for invalido", async () => {
            mockRequest.body = { user_id: 1, appointment_id: 2, score: 8 };

            await ReviewsController.create(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.send).toHaveBeenCalledWith({ message: "score deve ser um número entre 0 e 5!" });
        });
    });

    describe("remove", () => {
        it("deve remover uma avaliacao existente", async () => {
            const mockReview = { id: 1, destroy: jest.fn().mockResolvedValue(undefined) };

            mockRequest.params = { id: "1" } as any;

            jest.spyOn(Review, "findByPk").mockResolvedValue(mockReview as any);

            await ReviewsController.remove(mockRequest as Request, mockResponse as Response);

            expect(mockReview.destroy).toHaveBeenCalledTimes(1);
            expect(mockResponse.status).toHaveBeenCalledWith(204);
            expect(mockResponse.send).toHaveBeenCalledWith();
        });

        it("deve retornar 404 ao tentar remover avaliacao inexistente", async () => {
            mockRequest.params = { id: "999" } as any;

            jest.spyOn(Review, "findByPk").mockResolvedValue(null);

            await ReviewsController.remove(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.send).toHaveBeenCalledWith({ message: "Avaliação não encontrada!" });
        });
    });

    describe("update", () => {
        it("deve atualizar uma avaliacao existente", async () => {
            const mockReview = { id: 1, user_id: 1, appointment_id: 2, score: 3, comment: "ok", update: jest.fn().mockResolvedValue(undefined) };

            mockRequest.params = { id: "1" } as any;
            mockRequest.body = { user_id: 10, appointment_id: 20, score: "4", comment: "Melhorou" };

            jest.spyOn(Review, "findByPk").mockResolvedValue(mockReview as any);

            await ReviewsController.update(mockRequest as Request, mockResponse as Response);

            expect(mockReview.update).toHaveBeenCalledWith({ user_id: 10, appointment_id: 20, score: 4, comment: "Melhorou" });
            expect(mockResponse.send).toHaveBeenCalledWith(mockReview);
        });

        it("deve retornar 400 quando nenhum campo for enviado", async () => {
            const mockReview = { id: 1, user_id: 1, appointment_id: 2, score: 5, comment: null, update: jest.fn() };

            mockRequest.params = { id: "1" } as any;
            mockRequest.body = {};

            jest.spyOn(Review, "findByPk").mockResolvedValue(mockReview as any);

            await ReviewsController.update(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.send).toHaveBeenCalledWith({ message: "Informe ao menos um campo para atualização!" });
            expect(mockReview.update).not.toHaveBeenCalled();
        });

        it("deve retornar 400 quando score no update for invalido", async () => {
            const mockReview = { id: 1, user_id: 1, appointment_id: 2, score: 4, comment: "bom", update: jest.fn() };

            mockRequest.params = { id: "1" } as any;
            mockRequest.body = { score: -1 };

            jest.spyOn(Review, "findByPk").mockResolvedValue(mockReview as any);

            await ReviewsController.update(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.send).toHaveBeenCalledWith({ message: "score deve ser um número entre 0 e 5!" });
            expect(mockReview.update).not.toHaveBeenCalled();
        });

        it("deve retornar 404 quando tentar atualizar avaliacao inexistente", async () => {
            mockRequest.params = { id: "999" } as any;
            mockRequest.body = { comment: "novo comentario" };

            jest.spyOn(Review, "findByPk").mockResolvedValue(null);

            await ReviewsController.update(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.send).toHaveBeenCalledWith({ message: "Avaliação não encontrada!" });
        });
    });
});