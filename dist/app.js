"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importStar(require("express"));
const usersController_1 = __importDefault(require("./controllers/usersController"));
const barbersController_1 = __importDefault(require("./controllers/barbersController"));
const reviewsController_1 = __importDefault(require("./controllers/reviewsController"));
const servicesController_1 = __importDefault(require("./controllers/servicesController"));
const appointmentController_1 = __importDefault(require("./controllers/appointmentController"));
const barberScheduleController_1 = __importDefault(require("./controllers/barberScheduleController"));
const authController_1 = __importDefault(require("./controllers/authController"));
const authMiddleware_1 = __importDefault(require("./middlewares/authMiddleware"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
const cors = require("cors");
const allowedOrigins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
];
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
            return;
        }
        callback(new Error("Origem nao permitida pelo CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false
};
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
const router = (0, express_1.Router)();
router.get('/', (req, res) => {
    res.send("Hello World (typescript)");
});
//Rota de Autenticação
router.post('/login', authController_1.default.login);
router.get('/users', authMiddleware_1.default, usersController_1.default.list);
router.post('/users', usersController_1.default.create);
router.get('/users/:id', authMiddleware_1.default, usersController_1.default.getById);
router.put('/users/:id', authMiddleware_1.default, usersController_1.default.update);
router.delete('/users/:id', authMiddleware_1.default, usersController_1.default.remove);
router.get('/barbers', authMiddleware_1.default, barbersController_1.default.list);
router.post('/barbers', barbersController_1.default.create);
router.get('/barbers/:id', authMiddleware_1.default, barbersController_1.default.getById);
router.put('/barbers/:id', authMiddleware_1.default, barbersController_1.default.update);
router.delete('/barbers/:id', authMiddleware_1.default, barbersController_1.default.remove);
router.get('/reviews', reviewsController_1.default.list);
router.post('/reviews', authMiddleware_1.default, reviewsController_1.default.create);
router.get('/reviews/:id', authMiddleware_1.default, reviewsController_1.default.getById);
router.put('/reviews/:id', authMiddleware_1.default, reviewsController_1.default.update);
router.delete('/reviews/:id', authMiddleware_1.default, reviewsController_1.default.remove);
router.get('/services', servicesController_1.default.list);
router.post('/services', authMiddleware_1.default, servicesController_1.default.create);
router.get('/services/:id', servicesController_1.default.getById);
router.put('/services/:id', authMiddleware_1.default, servicesController_1.default.update);
router.delete('/services/:id', authMiddleware_1.default, servicesController_1.default.remove);
router.get('/appointments', authMiddleware_1.default, appointmentController_1.default.list);
router.post('/appointments', authMiddleware_1.default, appointmentController_1.default.create);
router.get('/appointments/:id', authMiddleware_1.default, appointmentController_1.default.getById);
router.put('/appointments/:id', authMiddleware_1.default, appointmentController_1.default.update);
router.delete('/appointments/:id', authMiddleware_1.default, appointmentController_1.default.remove);
router.get("/barber-schedules", authMiddleware_1.default, barberScheduleController_1.default.list);
router.post("/barber-schedules", authMiddleware_1.default, barberScheduleController_1.default.create);
router.get("/barber-schedules/:id", authMiddleware_1.default, barberScheduleController_1.default.getById);
router.put("/barber-schedules/:id", authMiddleware_1.default, barberScheduleController_1.default.update);
router.delete("/barber-schedules/:id", authMiddleware_1.default, barberScheduleController_1.default.remove);
app.use(router);
exports.default = app;
