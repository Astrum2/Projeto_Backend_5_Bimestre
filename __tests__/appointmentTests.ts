import { Request, Response } from "express";
import AppointmentsController from "../src/controllers/appointmentController";
import Appointment from "../src/models/Appointment";
import User from "../src/models/User";
import Service from "../src/models/Service";

describe("AppointmentsController", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = { send: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe("list", () => {
    it("deve retornar todos os agendamentos", async () => {
      const mockAppointments = [
        { id: 1, user_id: 1, service_id: 1, status: "scheduled", notes: null }, 
        { id: 2, user_id: 2, service_id: 2, status: "done", notes: "Concluido" }
    ];

      const findAllSpy = jest.spyOn(Appointment, "findAll").mockResolvedValue(mockAppointments as any);

      await AppointmentsController.list(mockRequest as Request, mockResponse as Response);

      expect(findAllSpy).toHaveBeenCalledWith(expect.objectContaining({ include: expect.any(Array) }));
      expect(mockResponse.send).toHaveBeenCalledWith(mockAppointments);
    });
  });

  describe("getById", () => {
    it("deve retornar um agendamento por id", async () => {
      const mockAppointment = { id: 1, user_id: 1, service_id: 1, status: "scheduled", notes: null };

      mockRequest.params = { id: "1" } as any;
      const findByPkSpy = jest.spyOn(Appointment, "findByPk").mockResolvedValue(mockAppointment as any);

      await AppointmentsController.getById(mockRequest as Request, mockResponse as Response);

      expect(findByPkSpy).toHaveBeenCalledWith(1, expect.objectContaining({ include: expect.any(Array) }));
      expect(mockResponse.send).toHaveBeenCalledWith(mockAppointment);
    });

    it("deve retornar 404 quando o agendamento nao existir", async () => {
      mockRequest.params = { id: "999" } as any;
      jest.spyOn(Appointment, "findByPk").mockResolvedValue(null as any);

      await AppointmentsController.getById(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.send).toHaveBeenCalledWith({ message: "Agendamento não encontrado!" });
    });
  });

  describe("create", () => {
    it("deve criar um agendamento com status e notes padrao", async () => {
      mockRequest.body = { user_id: "1", service_id: "2" };

      const createdAppointment = { id: 10, user_id: 1, service_id: 2, status: "scheduled", notes: null };

      const userFindByPkSpy = jest.spyOn(User, "findByPk").mockResolvedValue({ id: 1 } as any);
      const serviceFindByPkSpy = jest.spyOn(Service, "findByPk").mockResolvedValue({ id: 2 } as any);
      const createSpy = jest.spyOn(Appointment, "create").mockResolvedValue(createdAppointment as any);

      await AppointmentsController.create(mockRequest as Request, mockResponse as Response);

      expect(userFindByPkSpy).toHaveBeenCalledWith(1);
      expect(serviceFindByPkSpy).toHaveBeenCalledWith(2);
      expect(createSpy).toHaveBeenCalledWith({ user_id: 1, service_id: 2, status: "scheduled", notes: null });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.send).toHaveBeenCalledWith(createdAppointment);
    });

    it("deve retornar 400 quando user_id ou service_id nao forem enviados", async () => {
      mockRequest.body = { user_id: 1 };

      const userFindByPkSpy = jest.spyOn(User, "findByPk");
      const serviceFindByPkSpy = jest.spyOn(Service, "findByPk");
      const createSpy = jest.spyOn(Appointment, "create");

      await AppointmentsController.create(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.send).toHaveBeenCalledWith({ message: "user_id e service_id são obrigatórios!" });
      expect(userFindByPkSpy).not.toHaveBeenCalled();
      expect(serviceFindByPkSpy).not.toHaveBeenCalled();
      expect(createSpy).not.toHaveBeenCalled();
    });

    it("deve retornar 400 quando os ids forem invalidos", async () => {
      mockRequest.body = { user_id: "abc", service_id: -1 };

      const userFindByPkSpy = jest.spyOn(User, "findByPk");
      const serviceFindByPkSpy = jest.spyOn(Service, "findByPk");
      const createSpy = jest.spyOn(Appointment, "create");

      await AppointmentsController.create(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.send).toHaveBeenCalledWith({ message: "user_id e service_id devem ser números inteiros válidos!" });
      expect(userFindByPkSpy).not.toHaveBeenCalled();
      expect(serviceFindByPkSpy).not.toHaveBeenCalled();
      expect(createSpy).not.toHaveBeenCalled();
    });

    it("deve retornar 404 quando o usuario nao existir", async () => {
      mockRequest.body = { user_id: 1, service_id: 2 };

      const userFindByPkSpy = jest.spyOn(User, "findByPk").mockResolvedValue(null as any);
      const serviceFindByPkSpy = jest.spyOn(Service, "findByPk");
      const createSpy = jest.spyOn(Appointment, "create");

      await AppointmentsController.create(mockRequest as Request, mockResponse as Response);

      expect(userFindByPkSpy).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.send).toHaveBeenCalledWith({ message: "Usuário não encontrado!" });
      expect(serviceFindByPkSpy).not.toHaveBeenCalled();
      expect(createSpy).not.toHaveBeenCalled();
    });

    it("deve retornar 404 quando o servico nao existir", async () => {
      mockRequest.body = { user_id: 1, service_id: 2 };

      const userFindByPkSpy = jest.spyOn(User, "findByPk").mockResolvedValue({ id: 1 } as any);
      const serviceFindByPkSpy = jest.spyOn(Service, "findByPk").mockResolvedValue(null as any);
      const createSpy = jest.spyOn(Appointment, "create");

      await AppointmentsController.create(mockRequest as Request, mockResponse as Response);

      expect(userFindByPkSpy).toHaveBeenCalledWith(1);
      expect(serviceFindByPkSpy).toHaveBeenCalledWith(2);
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.send).toHaveBeenCalledWith({ message: "Serviço não encontrado!" });
      expect(createSpy).not.toHaveBeenCalled();
    });
  });

  describe("update", () => {
    it("deve atualizar um agendamento existente", async () => {
      const mockAppointment = { id: 1, status: "scheduled", notes: null, update: jest.fn().mockResolvedValue(undefined) };

      mockRequest.params = { id: "1" } as any;
      mockRequest.body = { status: "done", notes: "Cliente atendido" };

      const findByPkSpy = jest.spyOn(Appointment, "findByPk").mockResolvedValue(mockAppointment as any);

      await AppointmentsController.update(mockRequest as Request, mockResponse as Response);

      expect(findByPkSpy).toHaveBeenCalledWith(1);
      expect(mockAppointment.update).toHaveBeenCalledWith({ user_id: undefined, service_id: undefined, status: "done", notes: "Cliente atendido" });
      expect(mockResponse.send).toHaveBeenCalledWith(mockAppointment);
    });

    it("deve retornar 400 quando nenhum campo for enviado", async () => {
      const mockAppointment = { id: 1, status: "scheduled", notes: null, update: jest.fn() };

      mockRequest.params = { id: "1" } as any;
      mockRequest.body = {};

      jest.spyOn(Appointment, "findByPk").mockResolvedValue(mockAppointment as any);

      await AppointmentsController.update(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.send).toHaveBeenCalledWith({ message: "Informe ao menos um campo para atualização!" });
      expect(mockAppointment.update).not.toHaveBeenCalled();
    });

    it("deve retornar 400 quando status nao for texto", async () => {
      const mockAppointment = { id: 1, status: "scheduled", notes: null, update: jest.fn() };

      mockRequest.params = { id: "1" } as any;
      mockRequest.body = { status: 123 };

      jest.spyOn(Appointment, "findByPk").mockResolvedValue(mockAppointment as any);

      await AppointmentsController.update(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.send).toHaveBeenCalledWith({ message: "status deve ser texto!" });
      expect(mockAppointment.update).not.toHaveBeenCalled();
    });

    it("deve retornar 404 quando o agendamento nao existir", async () => {
      mockRequest.params = { id: "999" } as any;
      mockRequest.body = { status: "done" };

      jest.spyOn(Appointment, "findByPk").mockResolvedValue(null as any);

      await AppointmentsController.update(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.send).toHaveBeenCalledWith({ message: "Agendamento não encontrado!" });
    });
  });

  describe("remove", () => {
    it("deve remover um agendamento existente", async () => {
      const mockAppointment = { id: 1, destroy: jest.fn().mockResolvedValue(undefined) };

      mockRequest.params = { id: "1" } as any;

      const findByPkSpy = jest.spyOn(Appointment, "findByPk").mockResolvedValue(mockAppointment as any);

      await AppointmentsController.remove(mockRequest as Request, mockResponse as Response);

      expect(findByPkSpy).toHaveBeenCalledWith(1);
      expect(mockAppointment.destroy).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.send).toHaveBeenCalledWith();
    });

    it("deve retornar 404 ao tentar remover agendamento inexistente", async () => {
      mockRequest.params = { id: "999" } as any;
      jest.spyOn(Appointment, "findByPk").mockResolvedValue(null as any);

      await AppointmentsController.remove(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.send).toHaveBeenCalledWith({ message: "Agendamento não encontrado!" });
    });
  });
});