// respuesta.js

const respuesta = {
    ok: (res, data, mensaje = 'Operación exitosa') => {
      res.status(200).json({ success: true, message: mensaje, data });
    },
  
    error: (res, mensaje = 'Error en la operación', status = 500) => {
      res.status(status).json({ success: false, message: mensaje });
    },
  };
  
  export default respuesta;