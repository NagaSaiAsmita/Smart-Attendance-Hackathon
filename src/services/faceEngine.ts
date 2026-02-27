import * as faceapi from 'face-api.js';

export const loadModels = async () => {
  const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
  ]);
};

export const getFaceDescriptor = async (video: HTMLVideoElement) => {
  const detection = await faceapi
    .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor();
  return detection?.descriptor;
};

export const calculateEngagement = (expressions: faceapi.FaceExpressions) => {
  // Simple heuristic: happiness + surprise + neutral - (sadness + anger + fear)
  const positive = expressions.happy + expressions.surprised + expressions.neutral;
  const negative = expressions.sad + expressions.angry + expressions.fearful + expressions.disgusted;
  const score = Math.round(Math.max(0, Math.min(100, (positive - negative + 1) * 50)));
  return score;
};
