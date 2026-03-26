import express, { Request, Response, Router } from 'express';
import UsersController from './controllers/usersController';
import BarbersController from './controllers/barbersController';
import ReviewsController from './controllers/reviewsController';
import ServicesController from './controllers/servicesController';
import AppointmentsController from './controllers/appointmentController';
import BarberScheduleController from "./controllers/barberScheduleController";
import AuthController from './controllers/authController';

const app = express();
app.use(express.json());

const router: Router = Router();

router.get('/', (req: Request, res: Response) => {
    res.send("Hello World (typescript)");
});

//Rota de Autenticação
router.post('/login', AuthController.login);

router.get('/users', UsersController.list);
router.post('/users', UsersController.create);
router.get('/users/:id', UsersController.getById);
router.put('/users/:id', UsersController.update);
router.delete('/users/:id', UsersController.remove);


router.get('/barbers', BarbersController.list);
router.post('/barbers', BarbersController.create);
router.get('/barbers/:id', BarbersController.getById);
router.put('/barbers/:id', BarbersController.update);
router.delete('/barbers/:id', BarbersController.remove);

router.get('/reviews', ReviewsController.list);
router.post('/reviews', ReviewsController.create);
router.get('/reviews/:id', ReviewsController.getById);
router.put('/reviews/:id', ReviewsController.update);
router.delete('/reviews/:id', ReviewsController.remove);

router.get('/services', ServicesController.list);
router.post('/services', ServicesController.create);
router.get('/services/:id', ServicesController.getById);
router.put('/services/:id', ServicesController.update);
router.delete('/services/:id', ServicesController.remove);

router.get('/appointments', AppointmentsController.list);
router.post('/appointments', AppointmentsController.create);
router.get('/appointments/:id', AppointmentsController.getById);
router.put('/appointments/:id', AppointmentsController.update);
router.delete('/appointments/:id', AppointmentsController.remove);

router.get("/barber-schedules", BarberScheduleController.list);
router.post("/barber-schedules", BarberScheduleController.create);
router.get("/barber-schedules/:id", BarberScheduleController.getById);
router.put("/barber-schedules/:id", BarberScheduleController.update);
router.delete("/barber-schedules/:id", BarberScheduleController.remove);



app.use(router);

export default app;