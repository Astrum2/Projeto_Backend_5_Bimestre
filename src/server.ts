import app from "./app";
import sequelize from "./config/database";
import dotenv from "dotenv";
dotenv.config();

const port = 3001;

sequelize.sync({alter: false});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});