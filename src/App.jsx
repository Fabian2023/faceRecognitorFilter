import { useRef, useEffect, useCallback } from 'react';
import './App.css';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import helmetSrc from "../src/images/3D Construction Helmet Model.png";

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const helmetImageRef = useRef(null); // Referencia para la imagen del casco

  // LOAD MODELS FROM face-api.js
  useEffect(() => {
    loadModels();
    // Cargar la imagen del casco
    const helmetImage = new Image();
    helmetImage.src = helmetSrc;
    helmetImage.onload = () => {
      helmetImageRef.current = helmetImage; // Asignar la imagen cargada a la referencia
    };
  }, []);

  const loadModels = () => {
    Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
      faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
      faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
      faceapi.nets.faceExpressionNet.loadFromUri('/models'),
    ]).then(() => {
      faceMyDetect();
    });
  };

  const faceMyDetect = useCallback(() => {
    setInterval(async () => {
      if (videoRef.current && videoRef.current.video) {
        const video = videoRef.current.video;
        const detections = await faceapi
          .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceExpressions();

        // Limpiar el canvas antes de dibujar
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        faceapi.matchDimensions(canvasRef.current, {
          width: 940,
          height: 650,
        });

        const resized = faceapi.resizeResults(detections, {
          width: 940,
          height: 650,
        });

        faceapi.draw.drawDetections(canvasRef.current, resized);
        faceapi.draw.drawFaceLandmarks(canvasRef.current, resized);
        faceapi.draw.drawFaceExpressions(canvasRef.current, resized);

        // Si se detectó una cara, dibuja el casco
        if (resized.length > 0 && helmetImageRef.current) {
          const landmarks = resized[0].landmarks;
          const forehead = landmarks.getNose()[0]; // Usamos la coordenada de la nariz como referencia para el casco
          const jaw = landmarks.getJawOutline(); // Contorno de la mandíbula para ajustar el tamaño del casco

          // Ajustes para aumentar el tamaño del casco
  const helmetWidthFactor = 1; // Aumenta el ancho del casco un 50%
  const helmetHeightFactor = 0.65; // Aumenta la altura del casco un 50%

  // Definir las coordenadas para posicionar el casco
  const helmetWidth = (jaw[16].x - jaw[0].x) * helmetWidthFactor; // Ancho aumentado en un 50%
  const helmetHeight = helmetWidth * helmetHeightFactor; // Altura aumentada en un 50%

          // Dibujar la imagen del casco en las coordenadas deseadas
          ctx.drawImage(
            helmetImageRef.current,
            forehead.x - helmetWidth / 2, // Centrar en la cabeza
            forehead.y - helmetHeight * 1.5, // Posicionarlo un poco arriba de la nariz
            helmetWidth,
            helmetHeight
          );
        }
      }
    }, 1000);
  }, []);

  return (
    <div className="myapp">
      <h1>Face Detection with Helmet</h1>
      <div className="appvideo">
        <Webcam
          audio={false}
          ref={videoRef}
          screenshotFormat="image/jpeg"
          width={940}
          height={650}
        />
      </div>
      <canvas ref={canvasRef} width="940" height="650" className="appcanvas" />
    </div>
  );
}

export default App;
