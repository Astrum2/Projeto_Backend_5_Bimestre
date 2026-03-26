import { Request, Response } from "express";
import AuthController from "../src/controllers/authController";
import User from "../src/models/User";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

jest.mock("../src/models/User");
jest.mock("bcrypt");
jest.mock("jsonwebtoken");

describe("AuthController", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      send: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    process.env.JWT_SECRET = "test-secret";
    jest.clearAllMocks();
  });

  describe("login", () => {
    it("deve retornar 400 quando email ou senha não forem enviados", async () => {
      mockRequest.body = { email: "", password: "" };

      await AuthController.login(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.send).toHaveBeenCalledWith({
        message: "E-mail e senha são obrigatórios!",
      });
    });

    it("deve autenticar com sucesso e retornar token", async () => {
      mockRequest.body = {
        email: "  USER@MAIL.COM ",
        password: "  Senha1! ",
      };

      const mockUser = {
        id: 1,
        email: "user@mail.com",
        admin: false,
        getDataValue: jest.fn().mockReturnValue("hashed-password"),
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue("token-fake");

      await AuthController.login(mockRequest as Request, mockResponse as Response);

      expect(User.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email: "user@mail.com" },
        })
      );

      expect(bcrypt.compare).toHaveBeenCalledWith("Senha1!", "hashed-password");
      expect(jwt.sign).toHaveBeenCalledWith(
        {
          id: 1,
          email: "user@mail.com",
          admin: false,
        },
        "test-secret",
        { expiresIn: "1d" }
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.send).toHaveBeenCalledWith({
        message: "Login realizado com sucesso!",
        token: "token-fake",
      });
    });

    it("deve retornar 401 quando usuário não existir", async () => {
      mockRequest.body = { email: "naoexiste@mail.com", password: "Senha1!" };
      (User.findOne as jest.Mock).mockResolvedValue(null);

      await AuthController.login(mockRequest as Request, mockResponse as Response);

      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.send).toHaveBeenCalledWith({
        message: "E-mail ou senha inválidos!",
      });
    });

    it("deve retornar 401 quando senha estiver incorreta", async () => {
      mockRequest.body = { email: "user@mail.com", password: "SenhaErrada" };

      const mockUser = {
        id: 1,
        email: "user@mail.com",
        admin: false,
        getDataValue: jest.fn().mockReturnValue("hashed-password"),
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await AuthController.login(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.send).toHaveBeenCalledWith({
        message: "E-mail ou senha inválidos!",
      });
    });
  });
});