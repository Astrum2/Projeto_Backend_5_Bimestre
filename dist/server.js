"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const database_1 = __importDefault(require("./config/database"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const port = 3001;
database_1.default.sync({ alter: false });
app_1.default.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
