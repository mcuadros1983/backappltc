const verificarYReemplazarVacios = (obj) => {
    const newObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        // Verificar si el valor es vacío
        newObj[key] = obj[key] === "" ? null : obj[key];
      }
    }
    return newObj;
  };
  
  export default verificarYReemplazarVacios;