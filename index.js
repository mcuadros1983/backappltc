import app from "./app.js";
// import { db } from "./config/config.js";
import { PORT, LOCAL_HOST } from "./config/config.js";
import { sequelize } from "./config/database.js";
// import "./models/gmedias/clienteModel.js";
// import "./models/gmedias/productoModel.js";
// import "./models/gmedias/productoIdModel.js";
// import "./models/gmedias/ventaModel.js";
// import "./models/gmedias/formaPagoModel.js";
// import "./models/gmedias/cuentaCorrienteModel.js";
// import "./models/gmedias/detalleCuentaCorrienteModel.js";
// import "./models/gmedias/cobranzaModel.js";
// import "./models/gmedias/detalleCobranzaModel.js";
import "./libs/configuracionInicial.js"
 

// import "./models/detalleVentaModel.js";

async function main() {
  try {
    // await sequelize.authenticate();
    console.log("Connection has been established successfully.");
  
    // Sincroniza las tablas después de que el servidor esté escuchando
    app.listen(PORT, async () => {
      // await sequelize.sync({ force: true }); // force: false evita que se borren las tablas para recrearlas
      console.log(`Server is listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
}

main();