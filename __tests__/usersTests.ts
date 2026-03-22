import { Request, Response } from "express";
import UsersController from "../src/controllers/usersController";
import User from "../src/models/User";
import bcrypt from "bcrypt";

jest.mock("../src/models/User");
jest.mock("bcrypt");

describe("UsersController", () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;

    beforeEach(() => {
        mockRequest = {};
        mockResponse = {
            send: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };

        jest.clearAllMocks();
        jest.restoreAllMocks();
    });

    describe("list", () => {
        it("deve retornar todos os usuários", async () => {
            const mockUsers = [
                { id: 1, name: "Ana", email: "ana@mail.com", admin: false },
                { id: 2, name: "Bruno", email: "bruno@mail.com", admin: true },
            ];

            (User.findAll as jest.Mock).mockResolvedValue(mockUsers);

            await UsersController.list(mockRequest as Request, mockResponse as Response);

            expect(User.findAll).toHaveBeenCalledTimes(1);
            expect(mockResponse.send).toHaveBeenCalledWith(mockUsers);
        });
    });

    describe("getById", () => {
        it("deve retornar usuário quando encontrado", async () => {
            const mockUser = { id: 1, name: "Ana" };
            mockRequest.params = { id: "1" } as any;

            (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

            await UsersController.getById(mockRequest as Request, mockResponse as Response);

            expect(User.findByPk).toHaveBeenCalledWith(1);
            expect(mockResponse.send).toHaveBeenCalledWith(mockUser);
        });

        it("deve retornar 404 quando usuário não existir", async () => {
            mockRequest.params = { id: "999" } as any;
            (User.findByPk as jest.Mock).mockResolvedValue(null);

            await UsersController.getById(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.send).toHaveBeenCalledWith({ message: "Usuário não encontrado!" });
        });
    });

    describe("create", () => {
        it("deve criar usuário com email normalizado e senha hasheada", async () => {
            mockRequest.body = { name: "Ana", email: "  ANA@MAIL.COM  ", password: "Senha1!", cpf: "12345678901" };

            const createdUser = { id: 10, name: "Ana", email: "ana@mail.com", password: "hashed-password", cpf: "12345678901", admin: false };

            (User.findOne as jest.Mock).mockResolvedValue(null);
            (bcrypt.hash as jest.Mock).mockResolvedValue("hashed-password");
            (User.create as jest.Mock).mockResolvedValue(createdUser);

            await UsersController.create(mockRequest as Request, mockResponse as Response);

            expect(User.findOne).toHaveBeenCalledWith({ where: { email: "ANA@MAIL.COM" } });
            expect(bcrypt.hash).toHaveBeenCalledWith("Senha1!", 10);
            expect(User.create).toHaveBeenCalledWith({ name: "Ana", email: "ana@mail.com", password: "hashed-password", cpf: "12345678901" });
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.send).toHaveBeenCalledWith(createdUser);
        });

        it("deve retornar 400 quando já existir usuário com o email", async () => {
            mockRequest.body = { name: "Ana", email: "ana@mail.com", password: "Senha1!", cpf: "12345678901" };

            (User.findOne as jest.Mock).mockResolvedValue({ id: 1, email: "ana@mail.com" });

            await UsersController.create(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: "Usuário já existe com esse Email" });
            expect(User.create).not.toHaveBeenCalled();
        });

        it("deve retornar 400 quando senha for fraca", async () => {
            mockRequest.body = { name: "Ana", email: "ana@mail.com", password: "abc123", cpf: "12345678901" };

            (User.findOne as jest.Mock).mockResolvedValue(null);

            await UsersController.create(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.send).toHaveBeenCalledWith({
                message: "A senha deve conter ao mínimo: 7 letras, um caractere maisculo, um número e um caractere especial",
            });
            expect(User.create).not.toHaveBeenCalled();
        });
    });

    describe("remove", () => {
        it("deve remover usuário existente", async () => {
            const mockUser = { id: 1, destroy: jest.fn().mockResolvedValue(undefined) };
            mockRequest.params = { id: "1" } as any;

            (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

            await UsersController.remove(mockRequest as Request, mockResponse as Response);

            expect(User.findByPk).toHaveBeenCalledWith(1);
            expect(mockUser.destroy).toHaveBeenCalledTimes(1);
            expect(mockResponse.status).toHaveBeenCalledWith(204);
            expect(mockResponse.send).toHaveBeenCalledWith();
        });

        it("deve retornar 404 ao remover usuário inexistente", async () => {
            mockRequest.params = { id: "999" } as any;
            (User.findByPk as jest.Mock).mockResolvedValue(null);

            await UsersController.remove(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.send).toHaveBeenCalledWith({ message: "Usuário não encontrado!" });
        });
    });

    describe("update", () => {
        it("deve atualizar campos enviados e manter os não enviados", async () => {
            const mockUser = { id: 1, name: "Ana", password: "old-hash", cpf: "12345678901", admin: false, update: jest.fn().mockResolvedValue(undefined) };

            mockRequest.params = { id: "1" } as any;
            mockRequest.body = { name: "Ana Maria", admin: true };

            (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

            await UsersController.update(mockRequest as Request, mockResponse as Response);

            expect(mockUser.update).toHaveBeenCalledWith({ name: "Ana Maria", password: "old-hash", cpf: "12345678901", admin: true });
            expect(mockResponse.send).toHaveBeenCalledWith(mockUser);
        });

        it("deve hashear nova senha quando password for enviado", async () => {
            const mockUser = { id: 1, name: "Ana", password: "old-hash", cpf: "12345678901", admin: false, update: jest.fn().mockResolvedValue(undefined) };

            mockRequest.params = { id: "1" } as any;
            mockRequest.body = { password: "NovaSenha1!" };

            (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
            (bcrypt.hash as jest.Mock).mockResolvedValue("new-hash");

            await UsersController.update(mockRequest as Request, mockResponse as Response);

            expect(bcrypt.hash).toHaveBeenCalledWith("NovaSenha1!", 10);
            expect(mockUser.update).toHaveBeenCalledWith({ name: "Ana", password: "new-hash", cpf: "12345678901", admin: false });
        });

        it("deve retornar 400 quando nenhum campo for enviado", async () => {
            const mockUser = { id: 1, name: "Ana", password: "old-hash", cpf: "12345678901", admin: false, update: jest.fn() };

            mockRequest.params = { id: "1" } as any;
            mockRequest.body = {};

            (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

            await UsersController.update(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.send).toHaveBeenCalledWith({ message: "Informe ao menos um campo para atualização!" });
            expect(mockUser.update).not.toHaveBeenCalled();
        });

        it("deve retornar 404 ao atualizar usuário inexistente", async () => {
            mockRequest.params = { id: "999" } as any;
            mockRequest.body = { name: "Novo Nome" };

            (User.findByPk as jest.Mock).mockResolvedValue(null);

            await UsersController.update(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.send).toHaveBeenCalledWith({ message: "Usuário não encontrado!" });
        });
    });

    describe("login", () => {
        it("deve retornar 400 quando email ou senha não forem enviados", async () => {
            mockRequest.body = { email: "ana@mail.com" };

            await UsersController.login(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.send).toHaveBeenCalledWith({ message: "E-mail e senha são obrigatórios!" });
        });

        it("deve retornar 401 para credenciais inválidas", async () => {
            mockRequest.body = { email: "ana@mail.com", password: "Senha1!" };

            (User.findOne as jest.Mock).mockResolvedValue(null);

            await UsersController.login(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.send).toHaveBeenCalledWith({
                message: "E-mail ou senha inválidos!",
            });
            expect(bcrypt.compare).not.toHaveBeenCalled();
        });

        it("deve logar com sucesso e retornar dados sem senha", async () => {
            mockRequest.body = { email: "  ANA@MAIL.COM ", password: "Senha1!" };

            const mockUser = {
                getDataValue: jest.fn().mockReturnValue("hashed-password"),
                get: jest.fn().mockReturnValue({ id: 1, name: "Ana", email: "ana@mail.com", admin: true, password: "hashed-password" }),
            };

            (User.findOne as jest.Mock).mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            await UsersController.login(mockRequest as Request, mockResponse as Response);

            expect(User.findOne).toHaveBeenCalledWith({
                where: { email: "ana@mail.com" },
                attributes: ["id", "name", "email", "admin", "password"],
            });
            expect(bcrypt.compare).toHaveBeenCalledWith("Senha1!", "hashed-password");
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.send).toHaveBeenCalledWith({
                message: "Login realizado com sucesso!",
                user: { id: 1, name: "Ana", email: "ana@mail.com", admin: true },
            });
        });
    });
});