export function detectarProvinciaTopClientes(mensaje: string) {
  // Puedes mejorar la lista con todas las provincias si quieres
  const provincias = [
    "buenos aires", "catamarca", "chaco", "chubut", "cordoba", "corrientes", "entre rios", "formosa",
    "jujuy", "la pampa", "la rioja", "mendoza", "misiones", "neuquen", "rio negro", "salta", "san juan",
    "san luis", "santa cruz", "santa fe", "santiago del estero", "tierra del fuego", "tucuman"
  ];
  const texto = mensaje.toLowerCase().trim();
  for (const provincia of provincias) {
    if (texto === provincia) {
      return {
        intent: 'provincia_top_clientes',
        entities: { provincia }
      }
    }
  }
  return { intent: 'desconocido', entities: {} }
}