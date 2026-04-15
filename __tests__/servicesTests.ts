import { Request, Response } from "express";
import ServicesController from "../src/controllers/servicesController";
import Service from "../src/models/Service";

jest.mock("../src/models/Service");

describe("ServicesController", () => {
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
    it("Deve retornar todos os serviços", async () => {
      const mockServices = [
        { id: 1, name: "Corte", price: 50 },
        { id: 2, name: "Barba", price: 30 },
      ];

      (Service.findAll as jest.Mock).mockResolvedValue(mockServices);

      await ServicesController.list(mockRequest as Request, mockResponse as Response);

      expect(Service.findAll).toHaveBeenCalled();
      expect(mockResponse.send).toHaveBeenCalledWith(mockServices);
    });
  });

  describe("getById", () => {
    it("Deve retornar um serviço por ID", async () => {
      const mockService = { id: 1, name: "Corte", price: 50 };
      mockRequest.params = { id: "1" };

      (Service.findByPk as jest.Mock).mockResolvedValue(mockService);

      await ServicesController.getById(mockRequest as Request, mockResponse as Response);

      expect(Service.findByPk).toHaveBeenCalledWith(1);
      expect(mockResponse.send).toHaveBeenCalledWith(mockService);
    });

    it("Deve retornar erro 404 quando o serviço não foi encontrado", async () => {
      mockRequest.params = { id: "999" };

      (Service.findByPk as jest.Mock).mockResolvedValue(null);

      await ServicesController.getById(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });
  });

  describe("create", () => {
    it("Deve criar um novo serviço", async () => {
      const newService = { name: "Corte", description: "Corte simples", price: 50, duration_minutes: 30 };
      mockRequest.body = newService;

      (Service.create as jest.Mock).mockResolvedValue({ id: 1, ...newService });

      await ServicesController.create(mockRequest as Request, mockResponse as Response);

      expect(Service.create).toHaveBeenCalledWith(newService);
      expect(mockResponse.send).toHaveBeenCalled();
    });

    it("Deve retornar erro 400 quando arquivos necessários não estão presentes", async () => {
      mockRequest.body = { name: "Corte" };

      await ServicesController.create(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });

  describe("update", () => {
    it("Deve atualizar um serviço", async () => {
      const mockService = { name: "Corte", price: 50, update: jest.fn() };
      mockRequest.params = { id: "1" };
      mockRequest.body = { price: 60 };

      (Service.findByPk as jest.Mock).mockResolvedValue(mockService);
      mockService.update.mockResolvedValue({ ...mockService, price: 60 });

      await ServicesController.update(mockRequest as Request, mockResponse as Response);

      expect(mockService.update).toHaveBeenCalled();
    });
  });

  describe("remove", () => {
    it("Deve deletar um serviço", async () => {
      const mockService = { id: 1, destroy: jest.fn() };
      mockRequest.params = { id: "1" };

      (Service.findByPk as jest.Mock).mockResolvedValue(mockService);

      await ServicesController.remove(mockRequest as Request, mockResponse as Response);

      expect(mockService.destroy).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(204);
    });
  });
});