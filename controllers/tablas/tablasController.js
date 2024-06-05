// controllers.js
import { sequelize } from "../../config/database.js";
import CategoriaTabla from "../../models/tablas/categoriaModel.js";
import Sucursal from "../../models/gmedias/sucursalModel.js";
import PrecioTabla from "../../models/tablas/precioModel.js";
import ArticuloTabla from "../../models/tablas/articuloModel.js";
import ClienteTabla from "../../models/tablas/clienteModel.js";
import EmpleadoTabla from "../../models/tablas/empleadoModel.js";
import PlanTarjetaTabla from "../../models/tablas/plantarjetaModel.js";
import TipoGastoTabla from "../../models/tablas/tipogastoModel.js";
import TipoIngresoTabla from "../../models/tablas/tipoingresoModel.js";
import ArticuloPrecioTabla from "../../models/tablas/articuloPrecioModel.js";
import xlsx from "xlsx"; // Importa la librería para leer archivos Excel
import fs from "fs"; // Importa el módulo fs para manipulación de archivos
import ArticuloPorcentajetabla from "../../models/tablas/articuloPorcentajeModel.js"; // Asegúrate de que la ruta del modelo sea correcta
import ClientePersonaTabla from "../../models/tablas/clientePersonaModel.js";
import SubcategoriaTabla from "../../models/tablas/subcategoriaTablaModel.js";
import UnidadMedidaTabla from "../../models/tablas/unidadMedidaModel.js";
import TarjetaDeCreditoTabla from "../../models/tablas/tarjetaDeCreditoModel.js";
import UsuarioTabla from "../../models/tablas/usuarioModel.js";
import GrupoTabla from "../../models/tablas/grupoModel.js";
import DomicilioTabla from "../../models/tablas/domicilioModel.js";

const obtenerCategorias = async (req, res, next) => {
  try {
    const categorias = await CategoriaTabla.findAll();
    res.json(categorias);
  } catch (error) {
    console.error("Error al obtener las categorías:", error);
    next(error);
  }
};
const obtenerSubcategorias = async (req, res, next) => {
  try {
    const subcategorias = await SubcategoriaTabla.findAll();
    res.json(subcategorias);
  } catch (error) {
    console.error("Error al obtener las subcategorias:", error);
    next(error);
  }
};

const obtenerUnidadMedida = async (req, res, next) => {
  try {
    const unidadmedida = await UnidadMedidaTabla.findAll();
    res.json(unidadmedida);
  } catch (error) {
    console.error("Error al obtener las unidades de medida:", error);
    next(error);
  }
};

const obtenerDomicilio = async (req, res, next) => {
  try {
    const domicilio = await DomicilioTabla.findAll();
    res.json(domicilio);
  } catch (error) {
    console.error("Error al obtener los domicilios:", error);
    next(error);
  }
};

const obtenerUsuario = async (req, res, next) => {
  try {
    // Obtener todas las unidades de media
    const usuarios = await UsuarioTabla.findAll();
    res.json(usuarios);
  } catch (error) {
    console.error("Error al obtener los usuarios:", error);
    next(error);
  }
};

const obtenerGrupo = async (req, res, next) => {
  try {
    // Obtener todas las unidades de media
    const grupos = await GrupoTabla.findAll();
    res.json(grupos);
  } catch (error) {
    console.error("Error al obtener los grupos:", error);
    next(error);
  }
};

const obtenerTarjetaDeCredito = async (req, res, next) => {
  try {
    const tarjetasdecredito = await TarjetaDeCreditoTabla.findAll();
    res.json(tarjetasdecredito);
  } catch (error) {
    console.error("Error al obtener las tarjetas de credito:", error);
    next(error);
  }
};

const obtenerSucursales = async (req, res, next) => {
  try {
    const sucursales = await Sucursal.findAll();
    res.json(sucursales);
  } catch (error) {
    console.error("Error al obtener las sucursales:", error);
    next(error);
  }
};

const obtenerPrecios = async (req, res, next) => {
  try {
    const precios = await PrecioTabla.findAll();
    res.json(precios);
  } catch (error) {
    console.error("Error al obtener los precios:", error);
    next(error);
  }
};

const obtenerArticulos = async (req, res, next) => {
  try {
    const articulos = await ArticuloTabla.findAll({
      include: [
        {
          model: ArticuloPrecioTabla,
          attributes: ["precio", "id", "listaprecio_id", "sucursal_id"],
        },
      ],
    });
    res.json(articulos);
  } catch (error) {
    console.error("Error al obtener los artículos:", error);
    next(error);
  }
};

const obtenerArticuloPorCodigoBarra = async (req, res, next) => {
  const { codigoBarra } = req.params;
  try {
    // Buscar el artículo en la base de datos por el código de barras
    const articulo = await ArticuloTabla.findOne({
      where: { codigobarra: codigoBarra },
    });

    // Si se encontró el artículo, retornarlo
    res.json(articulo);
  } catch (error) {
    console.error("Error al obtener los clientes:", error);
    next(error);
  }
};

const obtenerArticulosPrecios = async (req, res, next) => {
  try {
    // Obtenemos todos los registros de ArticuloPrecioTabla con los atributos especificados
    const articulosPrecios = await ArticuloPrecioTabla.findAll({
      attributes: [
        "precio",
        "id",
        "articulo_id",
        "listaprecio_id",
        "sucursal_id",
      ],
      include: [
        {
          model: ArticuloTabla,
          attributes: ["id", "codigobarra", "descripcion"],
        },
      ],
    });

    res.json(articulosPrecios);
  } catch (error) {
    console.error("Error al obtener los clientes:", error);
    next(error);
  }
};

const obtenerClientesTabla = async (req, res, next) => {
  try {
    const clientes = await ClientePersonaTabla.findAll({
      include: {
        model: ClienteTabla,
      },
    });
    res.json(clientes);
  } catch (error) {
    console.error("Error al obtener los clientes:", error);
    next(error);
  }
};

const obtenerClientesPersonaTabla = async (req, res, next) => {
  try {
    const clientesPersona = await ClientePersonaTabla.findAll();
    res.json(clientesPersona);
  } catch (error) {
    console.error("Error al obtener los clientes persona:", error);
    next(error);
  }
};

const obtenerEmpleados = async (req, res, next) => {
  try {
    // Obtener todos los empleados
    const empleados = await EmpleadoTabla.findAll();

    // Verificar si la lista de empleados no está vacía
    if (empleados.length > 0) {
      // Array para almacenar los datos modificados
      const empleadosConClientes = [];

      // Iterar sobre cada empleado
      for (const empleado of empleados) {
        // Obtener todos los ClientePersona del empleado actual
        const clientePersona = await ClientePersonaTabla.findOne({
          where: { numero: empleado.numero },
          include: {
            model: ClienteTabla,
          },
        });

        // Agregar los datos del empleado actual al array de salida
        empleadosConClientes.push({
          empleado,
          clientePersona,
        });
      }

      // Enviar la respuesta con los empleados y sus clientes
      res.json(empleadosConClientes);
    } else {
      // Enviar una respuesta indicando que no se encontraron empleados
      res.json({ message: "No se encontraron empleados" });
    }
  } catch (error) {
    console.error("Error al obtener los empleados:", error);
    next(error);
  }
};

const obtenerPlanTarjeta = async (req, res, next) => {
  try {
    const planTarjeta = await PlanTarjetaTabla.findAll();
    res.json(planTarjeta);
  } catch (error) {
    console.error("Error al obtener los planes de tarjeta:", error);
    next(error);
  }
};

const obtenerTipoGasto = async (req, res, next) => {
  try {
    const tipoGasto = await TipoGastoTabla.findAll();
    res.json(tipoGasto);
  } catch (error) {
    console.error("Error al obtener los tipos de gasto:", error);
    next(error);
  }
};

const obtenerTipoIngreso = async (req, res, next) => {
  try {
    const tipoIngreso = await TipoIngresoTabla.findAll();
    res.json(tipoIngreso);
  } catch (error) {
    console.error("Error al obtener los tipos de ingreso:", error);
    next(error);
  }
};

const crearCategorias = async (req, res, next) => {
  try {
    const datos = req.body;

    // Verificar si los datos están en formato de matriz
    if (!Array.isArray(datos)) {
      return res
        .status(400)
        .json({ error: "Los datos deben estar en formato de matriz." });
    }

    // Iterar sobre los datos
    const resultados = [];
    for (const dato of datos) {
      // Verificar si la categoría ya existe en la base de datos
      const categoriaExistente = await CategoriaTabla.findOne({
        where: { id: dato.id },
      });

      if (categoriaExistente) {
        // Si existe, actualizar el dato existente
        await CategoriaTabla.update(dato, {
          where: { id: dato.id },
        });
        resultados.push({
          mensaje: `La categoría con ID ${dato.id} se actualizó.`,
        });
      } else {
        // Si no existe, crear una nueva categoría
        await CategoriaTabla.create(dato);
        resultados.push({
          mensaje: `Se creó una nueva categoría con ID ${dato.id}.`,
        });
      }
    }

    res.json(resultados);
  } catch (error) {
    console.error("Error al crear las categorías:", error);
    next(error);
  }
};
const crearSubcategorias = async (req, res, next) => {
  try {
    const datos = req.body;

    // Verificar si los datos están en formato de matriz
    if (!Array.isArray(datos)) {
      return res
        .status(400)
        .json({ error: "Los datos deben estar en formato de matriz." });
    }

    // Iterar sobre los datos
    const resultados = [];
    for (const dato of datos) {
      // Verificar si la categoría ya existe en la base de datos
      const subcategoriaExistente = await SubcategoriaTabla.findOne({
        where: { id: dato.id },
      });

      if (subcategoriaExistente) {
        // Si existe, actualizar el dato existente
        await SubcategoriaTabla.update(dato, {
          where: { id: dato.id },
        });
        resultados.push({
          mensaje: `La Subcategoria con ID ${dato.id} se actualizó.`,
        });
      } else {
        // Si no existe, crear una nueva categoría
        await SubcategoriaTabla.create(dato);
        resultados.push({
          mensaje: `Se creó una nueva Subcategoria con ID ${dato.id}.`,
        });
      }
    }

    res.json(resultados);
  } catch (error) {
    console.error("Error al crear las Subcategorias:", error);
    next(error);
  }
};

const crearUnidadMedida = async (req, res, next) => {
  try {
    const datos = req.body;

    // Verificar si los datos están en formato de matriz
    if (!Array.isArray(datos)) {
      return res
        .status(400)
        .json({ error: "Los datos deben estar en formato de matriz." });
    }

    // Iterar sobre los datos
    const resultados = [];
    for (const dato of datos) {
      // Verificar si la categoría ya existe en la base de datos
      const unidadMedidaExistente = await UnidadMedidaTabla.findOne({
        where: { id: dato.id },
      });

      if (unidadMedidaExistente) {
        // Si existe, actualizar el dato existente
        await UnidadMedidaTabla.update(dato, {
          where: { id: dato.id },
        });
        resultados.push({
          mensaje: `La Unidad de Medida con ID ${dato.id} se actualizó.`,
        });
      } else {
        // Si no existe, crear una nueva categoría
        await UnidadMedidaTabla.create(dato);
        resultados.push({
          mensaje: `Se creó una nueva Unidad de Media con ID ${dato.id}.`,
        });
      }
    }

    res.json(resultados);
  } catch (error) {
    console.error("Error al crear las Unidades de Medida:", error);
    next(error);
  }
};

const crearDomicilio = async (req, res, next) => {
  try {
    const datos = req.body;

    // Verificar si los datos están en formato de matriz
    if (!Array.isArray(datos)) {
      return res
        .status(400)
        .json({ error: "Los datos deben estar en formato de matriz." });
    }

    // Iterar sobre los datos
    const resultados = [];
    for (const dato of datos) {
      // Verificar si la categoría ya existe en la base de datos
      const domicilioExistente = await DomicilioTabla.findOne({
        where: { id: dato.id },
      });

      if (domicilioExistente) {
        // Si existe, actualizar el dato existente
        await DomicilioTabla.update(dato, {
          where: { id: dato.id },
        });
        resultados.push({
          mensaje: `El domicilio con ID ${dato.id} se actualizó.`,
        });
      } else {
        // Si no existe, crear un nuevo domicilio
        await DomicilioTabla.create(dato);
        resultados.push({
          mensaje: `Se creó un nuevo domicilio con ID ${dato.id}.`,
        });
      }
    }

    res.json(resultados);
  } catch (error) {
    console.error("Error al crear los domicilios:", error);
    next(error);
  }
};

const crearUsuario = async (req, res, next) => {
  try {
    const datos = req.body;

    // Verificar si los datos están en formato de matriz
    if (!Array.isArray(datos)) {
      return res
        .status(400)
        .json({ error: "Los datos deben estar en formato de matriz." });
    }

    // Iterar sobre los datos
    const resultados = [];
    for (const dato of datos) {
      // Verificar si la categoría ya existe en la base de datos
      const usuarioExistente = await UsuarioTabla.findOne({
        where: { id: dato.id },
      });

      if (usuarioExistente) {
        // Si existe, actualizar el dato existente
        await UsuarioTabla.update(dato, {
          where: { id: dato.id },
        });
        resultados.push({
          mensaje: `El usuario con ID ${dato.id} se actualizó.`,
        });
      } else {
        // Si no existe, crear una nueva categoría
        await UsuarioTabla.create(dato);
        resultados.push({
          mensaje: `Se creó un nuevo usuario con ID ${dato.id}.`,
        });
      }
    }

    res.json(resultados);
  } catch (error) {
    console.error("Error al crear los usuarios:", error);
    next(error);
  }
};

const crearGrupo = async (req, res, next) => {
  try {
    const datos = req.body;

    // Verificar si los datos están en formato de matriz
    if (!Array.isArray(datos)) {
      return res
        .status(400)
        .json({ error: "Los datos deben estar en formato de matriz." });
    }

    // Iterar sobre los datos
    const resultados = [];
    for (const dato of datos) {
      // Verificar si la categoría ya existe en la base de datos
      const grupoExistente = await GrupoTabla.findOne({
        where: { id: dato.id },
      });

      if (grupoExistente) {
        // Si existe, actualizar el dato existente
        await GrupoTabla.update(dato, {
          where: { id: dato.id },
        });
        resultados.push({
          mensaje: `El grupo con ID ${dato.id} se actualizó.`,
        });
      } else {
        // Si no existe, crear una nueva categoría
        await GrupoTabla.create(dato);
        resultados.push({
          mensaje: `Se creó un nuevo grupo con ID ${dato.id}.`,
        });
      }
    }

    res.json(resultados);
  } catch (error) {
    console.error("Error al crear los grupos:", error);
    next(error);
  }
};

const crearTarjetaDeCredito = async (req, res, next) => {
  try {
    const datos = req.body;

    // Verificar si los datos están en formato de matriz
    if (!Array.isArray(datos)) {
      return res
        .status(400)
        .json({ error: "Los datos deben estar en formato de matriz." });
    }

    // Iterar sobre los datos
    const resultados = [];
    for (const dato of datos) {
      // Verificar si la categoría ya existe en la base de datos
      const tarjetaDeCreditoExistente = await TarjetaDeCreditoTabla.findOne({
        where: { id: dato.id },
      });

      if (tarjetaDeCreditoExistente) {
        // Si existe, actualizar el dato existente
        await TarjetaDeCreditoTabla.update(dato, {
          where: { id: dato.id },
        });
        resultados.push({
          mensaje: `La tarjeta de credito con ID ${dato.id} se actualizó.`,
        });
      } else {
        // Si no existe, crear una nueva categoría
        await TarjetaDeCreditoTabla.create(dato);
        resultados.push({
          mensaje: `Se creó una nueva tarjeta de credito con ID ${dato.id}.`,
        });
      }
    }

    res.json(resultados);
  } catch (error) {
    console.error("Error al crear las tarjetas de credito:", error);
    next(error);
  }
};

const crearSucursales = async (req, res, next) => {
  try {
    const datos = req.body;

    // Verificar si los datos están en formato de matriz
    if (!Array.isArray(datos)) {
      return res
        .status(400)
        .json({ error: "Los datos deben estar en formato de matriz." });
    }

    // Iterar sobre los datos
    const resultados = [];
    for (const dato of datos) {
      // Verificar si la sucursal ya existe en la base de datos
      const sucursalExistente = await Sucursal.findOne({
        where: { id: dato.id },
      });

      if (sucursalExistente) {
        // Si existe, actualizar el dato existente
        await Sucursal.update(dato, {
          where: { id: dato.id },
        });
        resultados.push({
          mensaje: `La sucursal con ID ${dato.id} se actualizó.`,
        });
      } else {
        // Si no existe, crear una nueva sucursal
        await Sucursal.create(dato);
        resultados.push({
          mensaje: `Se creó una nueva sucursal con ID ${dato.id}.`,
        });
      }
    }

    res.json(resultados);
  } catch (error) {
    console.error("Error al crear las sucursales:", error);
    next(error);
  }
};

const crearPrecios = async (req, res, next) => {
  try {
    const datos = req.body;

    // Verificar si los datos están en formato de matriz
    if (!Array.isArray(datos)) {
      return res
        .status(400)
        .json({ error: "Los datos deben estar en formato de matriz." });
    }

    // Iterar sobre los datos
    const resultados = [];
    for (const dato of datos) {
      // Verificar si el precio ya existe en la base de datos
      const precioExistente = await PrecioTabla.findOne({
        where: { id: dato.id },
      });

      if (precioExistente) {
        // Si existe, actualizar el precio existente
        await PrecioTabla.update(dato, {
          where: { id: dato.id },
        });
        resultados.push({
          mensaje: `El precio con ID ${dato.id} se actualizó.`,
        });
      } else {
        // Si no existe, crear un nuevo precio
        await PrecioTabla.create(dato);
        resultados.push({
          mensaje: `Se creó un nuevo precio con ID ${dato.id}.`,
        });
      }
    }

    res.json(resultados);
  } catch (error) {
    console.error("Error al crear los precios:", error);
    next(error);
  }
};

const crearArticulos = async (req, res, next) => {
  try {
    const datos = req.body;

    // Verificar si los datos están en formato de matriz
    if (!Array.isArray(datos)) {
      return res
        .status(400)
        .json({ error: "Los datos deben estar en formato de matriz." });
    }

    // Iterar sobre los datos
    const resultados = [];
    for (const dato of datos) {
      // Verificar si el artículo ya existe en la base de datos
      const articuloExistente = await ArticuloTabla.findOne({
        where: { id: dato.id },
      });

      if (articuloExistente) {
        // Si existe, actualizar el artículo existente
        await ArticuloTabla.update(dato, {
          where: { id: dato.id },
        });
        resultados.push({
          mensaje: `El artículo con ID ${dato.id} se actualizó.`,
        });
      } else {
        // Si no existe, crear un nuevo artículo
        await ArticuloTabla.create(dato);
        resultados.push({
          mensaje: `Se creó un nuevo artículo con ID ${dato.id}.`,
        });
      }
    }

    res.json(resultados);
  } catch (error) {
    console.error("Error al crear los artículos:", error);
    next(error);
  }
};

const crearArticulosPrecios = async (req, res, next) => {
  try {
    const datos = req.body;
    const resultado = await ArticuloPrecioTabla.bulkCreate(datos);
    res.json(resultado);
  } catch (error) {
    console.error("Error al crear los precios de los articulos:", error);
    next(error);
  }
};

const actualizarPreciosDesdeExcel = async (req, res, next) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ mensaje: "No se ha subido ningún archivo." });
    }

    // Lee el archivo Excel
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    // Itera sobre los datos del archivo Excel
    for (const row of data) {
      const { codigo, precio } = row;
      console.log("datos", codigo, precio);

      // Busca el artículo en la base de datos por el código de barras
      const articulo = await ArticuloPrecioTabla.findOne({
        include: {
          model: ArticuloTabla,
          where: { codigobarra: codigo.toString() },
        },
      });
      if (articulo && articulo.Articulotabla) {
        // Actualiza el precio del artículo
        articulo.precio = precio;
        // Guarda los cambios en la base de datos
        await articulo.save();
      }
    }

    // Elimina el archivo cargado después de procesarlo
    fs.unlinkSync(req.file.path);

    // Devuelve una respuesta exitosa
    return res.status(200).json({
      mensaje:
        "Los precios han sido actualizados correctamente desde el archivo Excel.",
    });
  } catch (error) {
    console.error("Error al actualizar precios desde Excel:", error);
    return res.status(500).json({
      mensaje: "Error al actualizar precios desde el archivo Excel.",
    });
  }
};

const crearClientesTabla = async (req, res, next) => {
  try {
    const datos = req.body;

    // Verificar si los datos están en formato de matriz
    if (!Array.isArray(datos)) {
      return res
        .status(400)
        .json({ error: "Los datos deben estar en formato de matriz." });
    }

    // Separar datos de cliente y cliente persona
    const datosClientesPersona = datos.map((dato) => dato.cliente_persona);
    const datosClientes = datos;

    // Utilizar bulkCreate con la opción updateOnDuplicate para cliente
    await ClienteTabla.bulkCreate(datosClientes, {
      updateOnDuplicate: ["listaprecio_id", "fidelizado"],
    });

    // Utilizar bulkCreate con la opción updateOnDuplicate para cliente persona
    await ClientePersonaTabla.bulkCreate(datosClientesPersona, {
      updateOnDuplicate: ["apellido", "nombre", "numero"],
    });

    res.json({ mensaje: "Datos guardados correctamente." });
  } catch (error) {
    console.error("Error al crear los clientes:", error);
    next(error);
  }
};

const crearClientesPersonaTabla = async (req, res, next) => {
  try {
    const datos = req.body;

    // Verificar si los datos están en formato de matriz
    if (!Array.isArray(datos)) {
      return res
        .status(400)
        .json({ error: "Los datos deben estar en formato de matriz." });
    }

    // Iterar sobre los datos
    const resultados = [];
    for (const dato of datos) {
      // Verificar si el cliente ya existe en la base de datos
      const clienteExistente = await ClienteTabla.findOne({
        where: { id: dato.id },
      });

      if (clienteExistente) {
        // Si existe, actualizar el cliente existente
        await ClientePersonaTabla.update(dato, {
          where: { id: dato.id },
        });
        resultados.push({
          mensaje: `El cliente con ID ${dato.id} se actualizó.`,
        });
      } else {
        // Si no existe, crear un nuevo cliente
        await ClientePersonaTabla.create(dato);
        resultados.push({
          mensaje: `Se creó un nuevo cliente con ID ${dato.id}.`,
        });
      }
    }

    res.json(resultados);
  } catch (error) {
    console.error("Error al crear los clientes:", error);
    next(error);
  }
};

const crearEmpleados = async (req, res, next) => {
  try {
    const datos = req.body;

    // Verificar si los datos están en formato de matriz
    if (!Array.isArray(datos)) {
      return res
        .status(400)
        .json({ error: "Los datos deben estar en formato de matriz." });
    }

    // Objeto para almacenar los resultados de la operación
    const resultados = [];

    for (const dato of datos) {
      let mensaje = "";

      try {
        // console.log("empelado.id", dato.empleado.id);
        // Verificar si el empleado ya existe en la base de datos
        const empleadoExistente = await EmpleadoTabla.findOne({
          where: { id: dato.empleado.id },
        });

        // console.log("exiset", empleadoExistente);

        if (empleadoExistente) {
          // Si existe, actualizar el empleado existente
          await EmpleadoTabla.update(dato.empleado, {
            where: { id: dato.empleado.id },
          });
          mensaje = `El empleado con ID ${dato.empleado.id} se actualizó.`;
        } else {
          // Verificar si existe un ClientePersona asociado
          // console.log("numero", dato.clientePersona.numero);
          const clienteExistente = await ClientePersonaTabla.findOne({
            where: { numero: dato.clientePersona.numero },
          });

          if (clienteExistente) {
            await EmpleadoTabla.create(dato.empleado);
            mensaje = `El cliente con número ${dato.clientePersona.numero} ya existe`;
          } else {
            // Crear ClientePersona
            await ClientePersonaTabla.create({
              apellido: dato.clientePersona.apellido,
              cuil: dato.clientePersona.cuil,
              fechanacimiento: dato.clientePersona.fechanacimiento,
              nombre: dato.clientePersona.nombre,
              sexo: dato.clientePersona.sexo,
              numero: dato.clientePersona.numero,
              tipodocumento_id: dato.clientePersona.tipodocumento_id,
            });

            // Crear Cliente
            await ClienteTabla.create({
              dtype: "Persona",
              listaprecio_id: dato.clientePersona.cliente.listaprecio_id,
              fechaalta: dato.clientePersona.cliente.fechaalta,
              fidelizado: dato.clientePersona.cliente.fidelizado,
            });
            await EmpleadoTabla.create(dato.empleado);

            mensaje = `Se creó un nuevo empleado con ID ${dato.empleado.id}.`;
          }
        }

        resultados.push({ mensaje });
      } catch (error) {
        // Capturar errores de cada operación individual y agregarlos a los resultados
        mensaje = `Error al procesar el dato ${JSON.stringify(
          dato.empleado
        )}: ${error.message}`;
        resultados.push({ mensaje });
      }
    }

    // Enviar respuesta con los resultados
    res.json(resultados);
  } catch (error) {
    console.error("Error al crear los empleados:", error);
    next(error);
  }
};

const crearPlanTarjeta = async (req, res, next) => {
  try {
    const datos = req.body;

    // Verificar si los datos están en formato de matriz
    if (!Array.isArray(datos)) {
      return res
        .status(400)
        .json({ error: "Los datos deben estar en formato de matriz." });
    }

    // Iterar sobre los datos
    const resultados = [];
    for (const dato of datos) {
      // Verificar si el plan de tarjeta ya existe en la base de datos
      const planTarjetaExistente = await PlanTarjetaTabla.findOne({
        where: { id: dato.id },
      });

      if (planTarjetaExistente) {
        // Si existe, actualizar el plan de tarjeta existente
        await PlanTarjetaTabla.update(dato, {
          where: { id: dato.id },
        });
        resultados.push({
          mensaje: `El plan de tarjeta con ID ${dato.id} se actualizó.`,
        });
      } else {
        // Si no existe, crear un nuevo plan de tarjeta
        await PlanTarjetaTabla.create(dato);
        resultados.push({
          mensaje: `Se creó un nuevo plan de tarjeta con ID ${dato.id}.`,
        });
      }
    }

    res.json(resultados);
  } catch (error) {
    console.error("Error al crear los planes de tarjeta:", error);
    next(error);
  }
};

const crearTipoGasto = async (req, res, next) => {
  try {
    const datos = req.body;

    // Verificar si los datos están en formato de matriz
    if (!Array.isArray(datos)) {
      return res
        .status(400)
        .json({ error: "Los datos deben estar en formato de matriz." });
    }

    // Iterar sobre los datos
    const resultados = [];
    for (const dato of datos) {
      // Verificar si el tipo de gasto ya existe en la base de datos
      const tipoGastoExistente = await TipoGastoTabla.findOne({
        where: { id: dato.id },
      });

      if (tipoGastoExistente) {
        // Si existe, actualizar el tipo de gasto existente
        await TipoGastoTabla.update(dato, {
          where: { id: dato.id },
        });
        resultados.push({
          mensaje: `El tipo de gasto con ID ${dato.id} se actualizó.`,
        });
      } else {
        // Si no existe, crear un nuevo tipo de gasto
        await TipoGastoTabla.create(dato);
        resultados.push({
          mensaje: `Se creó un nuevo tipo de gasto con ID ${dato.id}.`,
        });
      }
    }

    res.json(resultados);
  } catch (error) {
    console.error("Error al crear los tipos de gasto:", error);
    next(error);
  }
};

const crearTipoIngreso = async (req, res, next) => {
  try {
    const datos = req.body;

    // Verificar si los datos están en formato de matriz
    if (!Array.isArray(datos)) {
      return res
        .status(400)
        .json({ error: "Los datos deben estar en formato de matriz." });
    }

    // Iterar sobre los datos
    const resultados = [];
    for (const dato of datos) {
      // Verificar si el tipo de ingreso ya existe en la base de datos
      const tipoIngresoExistente = await TipoIngresoTabla.findOne({
        where: { id: dato.id },
      });

      if (tipoIngresoExistente) {
        // Si existe, actualizar el tipo de ingreso existente
        await TipoIngresoTabla.update(dato, {
          where: { id: dato.id },
        });
        resultados.push({
          mensaje: `El tipo de ingreso con ID ${dato.id} se actualizó.`,
        });
      } else {
        // Si no existe, crear un nuevo tipo de ingreso
        await TipoIngresoTabla.create(dato);
        resultados.push({
          mensaje: `Se creó un nuevo tipo de ingreso con ID ${dato.id}.`,
        });
      }
    }

    res.json(resultados);
  } catch (error) {
    console.error("Error al crear los tipos de ingreso:", error);
    next(error);
  }
};

const crearArticulosPorcentaje = async (req, res, next) => {
  const datosArticulos = req.body; // Suponemos que los datos se pasan en el cuerpo de la solicitud como un array

  try {
    // Crear los registros en la tabla ArticuloPorcentajetabla
    const articulosCreados = await ArticuloPorcentajetabla.bulkCreate(
      datosArticulos
    );

    // Si se crearon correctamente, envía una respuesta con los registros creados
    res.status(201).json(articulosCreados);
  } catch (error) {
    // Si ocurre un error, pasa el control al middleware de manejo de errores
    next(error);
  }
};
const obtenerArticulosPorcentaje = async (req, res, next) => {
  try {
    // Obtener todos los registros de la tabla ArticuloPorcentajetabla
    const articulosPorcentaje = await ArticuloPorcentajetabla.findAll({
      include: [{ model: ArticuloTabla }], // Incluye la relación con ArticuloTabla
    });

    res.json(articulosPorcentaje);
  } catch (error) {
    console.error("Error al obtener los porcentajes de los ariculos:", error);
    next(error);
  }
};

const eliminarArticuloPorcentaje = async (req, res, next) => {
  const idArticuloPorcentaje = req.params.id; // Suponiendo que el ID se pasa como parámetro en la URL

  try {
    // Buscar el registro a eliminar por su ID
    const articuloPorcentaje = await ArticuloPorcentajetabla.findByPk(
      idArticuloPorcentaje
    );

    // Si se encontró el registro, eliminarlo
    if (articuloPorcentaje) {
      await articuloPorcentaje.destroy();
      res.json({ mensaje: "ArticuloPorcentaje eliminado correctamente." });
    } else {
      // Si no se encontró el registro, enviar una respuesta con un código de estado 404 (no encontrado)
      res.status(404).json({ mensaje: "ArticuloPorcentaje no encontrado." });
    }
  } catch (error) {
    // Si ocurre un error, pasar el control al middleware de manejo de errores
    next(error);
  }
};

const editarArticuloPorcentaje = async (req, res, next) => {
  const idArticuloPorcentaje = req.params.id; // Suponiendo que el ID se pasa como parámetro en la URL
  const nuevosDatos = req.body; // Suponiendo que los nuevos datos se pasan en el cuerpo de la solicitud

  try {
    // Buscar el registro a editar por su ID
    const articuloPorcentaje = await ArticuloPorcentajetabla.findByPk(
      idArticuloPorcentaje
    );

    // Si se encontró el registro, actualizarlo con los nuevos datos
    if (articuloPorcentaje) {
      await articuloPorcentaje.update(nuevosDatos);
      res.json({ mensaje: "ArticuloPorcentaje actualizado correctamente." });
    } else {
      // Si no se encontró el registro, enviar una respuesta con un código de estado 404 (no encontrado)
      res.status(404).json({ mensaje: "ArticuloPorcentaje no encontrado." });
    }
  } catch (error) {
    // Si ocurre un error, pasar el control al middleware de manejo de errores
    next(error);
  }
};

const actualizarArticulosPorcentajeDesdeExcel = async (req, res, next) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ mensaje: "No se ha subido ningún archivo." });
    }

    // Verificar si existen registros en la tabla ArticuloPorcentajetabla
    const existenRegistros = (await ArticuloPorcentajetabla.count()) > 0;

    if (!existenRegistros) {
      // Lee el archivo Excel
      const workbook = xlsx.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(sheet);

      // Itera sobre los datos del archivo Excel
      for (const row of data) {
        const { codigo, porcentaje, subcategoria } = row;

        const articulo = await ArticuloTabla.findOne({
          where: { codigobarra: codigo.toString() },
        });

        if (articulo) {
          // Si el artículo existe, crea un nuevo registro en ArticuloPorcentajetabla
          await ArticuloPorcentajetabla.create({
            porcentaje,
            articulo_id: articulo.id,
            subcategoria,
          });
        } else {
          // Si no se encontró el artículo, continúa con el siguiente artículo
          console.warn(
            `No se encontró ningún artículo con el código de barras: ${codigo}`
          );
        }
      }

      // Elimina el archivo cargado después de procesarlo
      fs.unlinkSync(req.file.path);

      // Devuelve una respuesta exitosa
      return res.status(200).json({
        mensaje:
          "Los porcentajes han sido actualizados correctamente desde el archivo Excel.",
      });
    }

    // Si existen registros en la tabla, continuar con el proceso de búsqueda y actualización
    // Lee el archivo Excel
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    // Itera sobre los datos del archivo Excel
    for (const row of data) {
      const { codigo, porcentaje, subcategoria } = row;

      const articuloPorcentaje = await ArticuloPorcentajetabla.findOne({
        include: {
          model: ArticuloTabla,
          where: { codigobarra: codigo.toString() },
        },
      });

      if (articuloPorcentaje && articuloPorcentaje.Articulotabla) {
        // Si el artículo existe, actualiza su porcentaje
        articuloPorcentaje.porcentaje = porcentaje;
        articuloPorcentaje.subcategoria = subcategoria;
        await articuloPorcentaje.save();
      } else {
        // Si el artículo no existe, busca el artículo por el código de barras
        const articulo = await ArticuloTabla.findOne({
          where: { codigobarra: codigo.toString() },
        });

        if (articulo) {
          // Si el artículo existe, crea un nuevo registro en ArticuloPorcentajetabla
          await ArticuloPorcentajetabla.create({
            porcentaje,
            articulo_id: articulo.id,
            subcategoria,
          });
        } else {
          // Si no se encontró el artículo, continúa con el siguiente artículo
          console.warn(
            `No se encontró ningún artículo con el código de barras: ${codigo}`
          );
          continue;
        }
      }
    }

    // Elimina el archivo cargado después de procesarlo
    fs.unlinkSync(req.file.path);

    // Devuelve una respuesta exitosa
    return res.status(200).json({
      mensaje:
        "Los porcentajes han sido actualizados correctamente desde el archivo Excel.",
    });
  } catch (error) {
    console.error("Error al actualizar los porcentajes desde Excel:", error);
    return res.status(500).json({
      mensaje: "Error al actualizar porcentajes desde el archivo Excel.",
    });
  }
};

export {
  obtenerCategorias,
  obtenerSubcategorias,
  obtenerUnidadMedida,
  obtenerDomicilio,
  obtenerUsuario,
  obtenerGrupo,
  obtenerTarjetaDeCredito,
  obtenerSucursales,
  obtenerPrecios,
  obtenerArticulos,
  obtenerArticuloPorCodigoBarra,
  obtenerArticulosPrecios,
  obtenerClientesTabla,
  obtenerClientesPersonaTabla,
  obtenerEmpleados,
  obtenerPlanTarjeta,
  obtenerTipoGasto,
  obtenerTipoIngreso,
  crearCategorias,
  crearSubcategorias,
  crearUnidadMedida,
  crearDomicilio,
  crearUsuario,
  crearGrupo,
  crearTarjetaDeCredito,
  crearSucursales,
  crearPrecios,
  crearArticulos,
  crearArticulosPrecios,
  actualizarPreciosDesdeExcel,
  actualizarArticulosPorcentajeDesdeExcel,
  crearClientesTabla,
  crearClientesPersonaTabla,
  crearEmpleados,
  crearPlanTarjeta,
  crearTipoGasto,
  crearTipoIngreso,
  crearArticulosPorcentaje,
  obtenerArticulosPorcentaje,
  eliminarArticuloPorcentaje,
  editarArticuloPorcentaje,
};
