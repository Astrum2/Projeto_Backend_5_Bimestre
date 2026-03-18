import app from "./app";
import sequelize from "./config/database";

const port = 3000;

sequelize.sync({alter: false});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});