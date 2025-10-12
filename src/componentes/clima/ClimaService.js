export const obtenerClima = async (lat, lon) => {
    const apiKey = "f5b73a20062204806abd00ebe9c39b3c";
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=es`;
  
    try {
      const response = await fetch(url);
      const data = await response.json();
  
      if (data.cod === 200) {
        return {
          temperatura: data.main.temp,
          descripcion: data.weather[0].description,
          icono: `http://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`,
          ciudad: data.name
        };
      } else {
        console.error("Error en la API:", data.message);
        return null;
      }
    } catch (error) {
      console.error("Error de red:", error);
      return null;
    }
  };
  