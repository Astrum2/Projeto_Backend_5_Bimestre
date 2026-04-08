import { Request, Response } from "express";
import { Op } from "sequelize";
import AppointmentsController from "../src/controllers/appointmentController";
import Appointment from "../src/models/Appointment";
import User from "../src/models/User";
import Service from "../src/models/Service";
import Barber from "../src/models/Barber";
import BarberSchedule from "../src/models/BarberSchedule";
import BarberScheduleController from "../src/controllers/barberScheduleController";
import sequelize from "../src/config/database";

describe("AppointmentsController", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = { send: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };
    jest.restoreAllMocks();
    jest.clearAllMocks();
    jest.spyOn(sequelize, "transaction").mockImplementation(async (callback: any) => callback({}));
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
      mockRequest.body = { user_id: "1", service_id: "2", barber_id: "3", date: "2026-04-05", time: "14:30" };

      const createdAppointment = { id: 10, user_id: 1, service_id: 2, barber_id: 3, date: "2026-04-05", time: "14:30", status: "scheduled", notes: null };

      const userFindByPkSpy = jest.spyOn(User, "findByPk").mockResolvedValue({ id: 1 } as any);
      const serviceFindByPkSpy = jest.spyOn(Service, "findByPk").mockResolvedValue({ id: 2 } as any);
      const barberFindByPkSpy = jest.spyOn(Barber, "findByPk").mockResolvedValue({ id: 3 } as any);
      const createSpy = jest.spyOn(Appointment, "create").mockResolvedValue(createdAppointment as any);
      const createScheduleSpy = jest
        .spyOn(BarberScheduleController, "createFromAppointmentData")
        .mockResolvedValue({ slot_group: "group-1", slots_created: 2, slots: [] as any });

      await AppointmentsController.create(mockRequest as Request, mockResponse as Response);

      expect(userFindByPkSpy).toHaveBeenCalledWith(1);
      expect(serviceFindByPkSpy).toHaveBeenCalledWith(2);
      expect(barberFindByPkSpy).toHaveBeenCalledWith(3);
      expect(createSpy).toHaveBeenCalledWith(
        { user_id: 1, service_id: 2, barber_id: 3, date: "2026-04-05", time: "14:30", status: "scheduled", notes: null },
        { transaction: {} }
      );
      expect(createScheduleSpy).toHaveBeenCalledWith({
        barber_id: 3,
        date: "2026-04-05",
        start: "14:30",
        appointment_id: 10,
        service_id: 2,
        status: "booked",
        notes: null,
        transaction: {},
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.send).toHaveBeenCalledWith(createdAppointment);
    });

    it("deve retornar 400 quando user_id, service_id, barber_id, date ou time nao forem enviados", async () => {
      mockRequest.body = { user_id: 1, service_id: 2, date: "2026-04-05", time: "14:30" };

      const userFindByPkSpy = jest.spyOn(User, "findByPk");
      const serviceFindByPkSpy = jest.spyOn(Service, "findByPk");
      const barberFindByPkSpy = jest.spyOn(Barber, "findByPk");
      const createSpy = jest.spyOn(Appointment, "create");

      await AppointmentsController.create(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.send).toHaveBeenCalledWith({ message: "user_id, service_id, barber_id, date e time são obrigatórios!" });
      expect(userFindByPkSpy).not.toHaveBeenCalled();
      expect(serviceFindByPkSpy).not.toHaveBeenCalled();
      expect(barberFindByPkSpy).not.toHaveBeenCalled();
      expect(createSpy).not.toHaveBeenCalled();
    });

    it("deve retornar 400 quando os ids forem invalidos", async () => {
      mockRequest.body = { user_id: "abc", service_id: -1, barber_id: "x", date: "2026-04-05", time: "14:30" };

      const userFindByPkSpy = jest.spyOn(User, "findByPk");
      const serviceFindByPkSpy = jest.spyOn(Service, "findByPk");
      const barberFindByPkSpy = jest.spyOn(Barber, "findByPk");
      const createSpy = jest.spyOn(Appointment, "create");

      await AppointmentsController.create(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.send).toHaveBeenCalledWith({ message: "user_id, service_id e barber_id devem ser números inteiros válidos!" });
      expect(userFindByPkSpy).not.toHaveBeenCalled();
      expect(serviceFindByPkSpy).not.toHaveBeenCalled();
      expect(barberFindByPkSpy).not.toHaveBeenCalled();
      expect(createSpy).not.toHaveBeenCalled();
    });

    it("deve retornar 400 quando date for invalida", async () => {
      mockRequest.body = { user_id: 1, service_id: 2, barber_id: 3, date: "05-04-2026", time: "14:30" };

      const userFindByPkSpy = jest.spyOn(User, "findByPk");
      const serviceFindByPkSpy = jest.spyOn(Service, "findByPk");
      const barberFindByPkSpy = jest.spyOn(Barber, "findByPk");
      const createSpy = jest.spyOn(Appointment, "create");

      await AppointmentsController.create(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.send).toHaveBeenCalledWith({ message: "date deve estar no formato YYYY-MM-DD!" });
      expect(userFindByPkSpy).not.toHaveBeenCalled();
      expect(serviceFindByPkSpy).not.toHaveBeenCalled();
      expect(barberFindByPkSpy).not.toHaveBeenCalled();
      expect(createSpy).not.toHaveBeenCalled();
    });

    it("deve retornar 400 quando time for invalido", async () => {
      mockRequest.body = { user_id: 1, service_id: 2, barber_id: 3, date: "2026-04-05", time: "25:99" };

      const userFindByPkSpy = jest.spyOn(User, "findByPk");
      const serviceFindByPkSpy = jest.spyOn(Service, "findByPk");
      const barberFindByPkSpy = jest.spyOn(Barber, "findByPk");
      const createSpy = jest.spyOn(Appointment, "create");

      await AppointmentsController.create(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.send).toHaveBeenCalledWith({ message: "time deve estar no formato HH:mm ou HH:mm:ss!" });
      expect(userFindByPkSpy).not.toHaveBeenCalled();
      expect(serviceFindByPkSpy).not.toHaveBeenCalled();
      expect(barberFindByPkSpy).not.toHaveBeenCalled();
      expect(createSpy).not.toHaveBeenCalled();
    });

    it("deve retornar 404 quando o usuario nao existir", async () => {
      mockRequest.body = { user_id: 1, service_id: 2, barber_id: 3, date: "2026-04-05", time: "14:30" };

      const userFindByPkSpy = jest.spyOn(User, "findByPk").mockResolvedValue(null as any);
      const serviceFindByPkSpy = jest.spyOn(Service, "findByPk");
      const barberFindByPkSpy = jest.spyOn(Barber, "findByPk");
      const createSpy = jest.spyOn(Appointment, "create");

      await AppointmentsController.create(mockRequest as Request, mockResponse as Response);

      expect(userFindByPkSpy).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.send).toHaveBeenCalledWith({ message: "Usuário não encontrado!" });
      expect(serviceFindByPkSpy).not.toHaveBeenCalled();
      expect(barberFindByPkSpy).not.toHaveBeenCalled();
      expect(createSpy).not.toHaveBeenCalled();
    });

    it("deve retornar 404 quando o servico nao existir", async () => {
      mockRequest.body = { user_id: 1, service_id: 2, barber_id: 3, date: "2026-04-05", time: "14:30" };

      const userFindByPkSpy = jest.spyOn(User, "findByPk").mockResolvedValue({ id: 1 } as any);
      const serviceFindByPkSpy = jest.spyOn(Service, "findByPk").mockResolvedValue(null as any);
      const barberFindByPkSpy = jest.spyOn(Barber, "findByPk");
      const createSpy = jest.spyOn(Appointment, "create");

      await AppointmentsController.create(mockRequest as Request, mockResponse as Response);

      expect(userFindByPkSpy).toHaveBeenCalledWith(1);
      expect(serviceFindByPkSpy).toHaveBeenCalledWith(2);
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.send).toHaveBeenCalledWith({ message: "Serviço não encontrado!" });
      expect(barberFindByPkSpy).not.toHaveBeenCalled();
      expect(createSpy).not.toHaveBeenCalled();
    });

    it("deve retornar 404 quando o barbeiro nao existir", async () => {
      mockRequest.body = { user_id: 1, service_id: 2, barber_id: 3, date: "2026-04-05", time: "14:30" };

      const userFindByPkSpy = jest.spyOn(User, "findByPk").mockResolvedValue({ id: 1 } as any);
      const serviceFindByPkSpy = jest.spyOn(Service, "findByPk").mockResolvedValue({ id: 2 } as any);
      const barberFindByPkSpy = jest.spyOn(Barber, "findByPk").mockResolvedValue(null as any);
      const createSpy = jest.spyOn(Appointment, "create");

      await AppointmentsController.create(mockRequest as Request, mockResponse as Response);

      expect(userFindByPkSpy).toHaveBeenCalledWith(1);
      expect(serviceFindByPkSpy).toHaveBeenCalledWith(2);
      expect(barberFindByPkSpy).toHaveBeenCalledWith(3);
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.send).toHaveBeenCalledWith({ message: "Barbeiro não encontrado!" });
      expect(createSpy).not.toHaveBeenCalled();
    });
  });

  describe("update", () => {
    it("deve atualizar um agendamento existente", async () => {
      const mockAppointment = {
        id: 1,
        user_id: 2,
        service_id: 3,
        date: "2026-04-05",
        time: "14:30",
        barber_id: 4,
        status: "scheduled",
        notes: null,
        update: jest.fn().mockResolvedValue({
          id: 1,
          user_id: 2,
          service_id: 3,
          date: "2026-04-06",
          time: "15:00",
          barber_id: 4,
          status: "done",
          notes: "Cliente atendido",
        }),
      };

      mockRequest.params = { id: "1" } as any;
      mockRequest.body = { status: "done", notes: "Cliente atendido", date: "2026-04-06", time: "15:00" };

      const findByPkSpy = jest.spyOn(Appointment, "findByPk").mockResolvedValue(mockAppointment as any);
      const destroySpy = jest.spyOn(BarberSchedule, "destroy").mockResolvedValue(2 as any);
      const createScheduleSpy = jest
        .spyOn(BarberScheduleController, "createFromAppointmentData")
        .mockResolvedValue({ slot_group: "group-1", slots_created: 2, slots: [] as any });

      await AppointmentsController.update(mockRequest as Request, mockResponse as Response);

      expect(findByPkSpy).toHaveBeenCalledWith(1);
      expect(mockAppointment.update).toHaveBeenCalledWith(
        { user_id: 2, service_id: 3, barber_id: 4, date: "2026-04-06", time: "15:00", status: "done", notes: "Cliente atendido" },
        { transaction: {} }
      );
      expect(destroySpy).toHaveBeenCalledWith({ where: { appointment_id: 1 }, transaction: {} });
      expect(createScheduleSpy).toHaveBeenCalledWith({
        barber_id: 4,
        date: "2026-04-06",
        start: "15:00",
        appointment_id: 1,
        service_id: 3,
        status: "booked",
        notes: "Cliente atendido",
        transaction: {},
      });
      expect(mockResponse.send).toHaveBeenCalledWith({
        id: 1,
        user_id: 2,
        service_id: 3,
        date: "2026-04-06",
        time: "15:00",
        barber_id: 4,
        status: "done",
        notes: "Cliente atendido",
      });
    });

    it("deve atualizar sem recriar agenda quando apenas status for alterado", async () => {
      const updatedAppointment = {
        id: 1,
        user_id: 2,
        service_id: 3,
        date: "2026-04-05",
        time: "14:30",
        barber_id: 4,
        status: "done",
        notes: null,
      };

      const mockAppointment = {
        id: 1,
        user_id: 2,
        service_id: 3,
        date: "2026-04-05",
        time: "14:30",
        barber_id: 4,
        status: "scheduled",
        notes: null,
        update: jest.fn().mockResolvedValue(updatedAppointment),
      };

      mockRequest.params = { id: "1" } as any;
      mockRequest.body = { status: "done" };

      jest.spyOn(Appointment, "findByPk").mockResolvedValue(mockAppointment as any);
      const destroySpy = jest.spyOn(BarberSchedule, "destroy").mockResolvedValue(0 as any);
      const createScheduleSpy = jest
        .spyOn(BarberScheduleController, "createFromAppointmentData")
        .mockResolvedValue({ slot_group: "group-1", slots_created: 2, slots: [] as any });

      await AppointmentsController.update(mockRequest as Request, mockResponse as Response);

      expect(mockAppointment.update).toHaveBeenCalledWith(
        { user_id: 2, service_id: 3, barber_id: 4, date: "2026-04-05", time: "14:30", status: "done", notes: null },
        { transaction: {} }
      );
      expect(destroySpy).not.toHaveBeenCalled();
      expect(createScheduleSpy).not.toHaveBeenCalled();
      expect(mockResponse.send).toHaveBeenCalledWith(updatedAppointment);
    });

    it("deve retornar 400 quando date for invalida no update", async () => {
      const mockAppointment = { id: 1, date: "2026-04-05", time: "14:30", status: "scheduled", notes: null, update: jest.fn() };

      mockRequest.params = { id: "1" } as any;
      mockRequest.body = { date: "06/04/2026" };

      jest.spyOn(Appointment, "findByPk").mockResolvedValue(mockAppointment as any);

      await AppointmentsController.update(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.send).toHaveBeenCalledWith({ message: "date deve estar no formato YYYY-MM-DD!" });
      expect(mockAppointment.update).not.toHaveBeenCalled();
    });

    it("deve retornar 400 quando time for invalido no update", async () => {
      const mockAppointment = { id: 1, date: "2026-04-05", time: "14:30", status: "scheduled", notes: null, update: jest.fn() };

      mockRequest.params = { id: "1" } as any;
      mockRequest.body = { time: "99:00" };

      jest.spyOn(Appointment, "findByPk").mockResolvedValue(mockAppointment as any);

      await AppointmentsController.update(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.send).toHaveBeenCalledWith({ message: "time deve estar no formato HH:mm ou HH:mm:ss!" });
      expect(mockAppointment.update).not.toHaveBeenCalled();
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
      const mockAppointment = { id: 1, destroy: jest.fn().mockResolvedValue(undefined), getDataValue: jest.fn().mockReturnValue(1) };

      mockRequest.params = { id: "1" } as any;

      const findByPkSpy = jest.spyOn(Appointment, "findByPk").mockResolvedValue(mockAppointment as any);
      const findScheduleSpy = jest.spyOn(BarberSchedule, "findAll").mockResolvedValue([
        { slot_group: "group-a" },
        { slot_group: "group-a" },
        { slot_group: "group-b" },
      ] as any);
      const destroyScheduleSpy = jest.spyOn(BarberSchedule, "destroy").mockResolvedValue(3 as any);

      await AppointmentsController.remove(mockRequest as Request, mockResponse as Response);

      expect(findByPkSpy).toHaveBeenCalledWith(1);
      expect(findScheduleSpy).toHaveBeenCalledWith({
        where: { appointment_id: 1 },
        attributes: ["slot_group"],
        transaction: {},
      });
      expect(destroyScheduleSpy).toHaveBeenCalledWith({
        where: {
          [Op.or]: [
            { appointment_id: 1 },
            { slot_group: { [Op.in]: ["group-a", "group-b"] } },
          ],
        },
        transaction: {},
      });
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