const generarCodigoDeBarras = (categoria, newId) => {
    let codigo_de_barra, num_media;
    if (categoria === "bovino") {
      // Para categoría bovino
      codigo_de_barra = newId.toString().padStart(30, "0");
      num_media = codigo_de_barra.slice(-11);
    } else if (categoria === "porcino") {
      // Para categoría porcino
      codigo_de_barra = newId.toString().padStart(7, "0");
      num_media = codigo_de_barra;
    } else {
      // Categoría desconocida, manejar según tus requisitos
      throw new Error("Categoría desconocida");
    }
    return { codigo_de_barra, num_media };
  };
  
  export default generarCodigoDeBarras;