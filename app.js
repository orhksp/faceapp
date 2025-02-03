const video = document.getElementById('video');
const startButton = document.getElementById('start-btn');
const detectButton = document.getElementById('detect-btn');
const localHost = "http://127.0.0.1:5500";

Promise.all([
  faceapi.nets.faceRecognitionNet.loadFromUri(`${localHost}/models`),
  faceapi.nets.faceLandmark68Net.loadFromUri(`${localHost}/models`),
  faceapi.nets.ssdMobilenetv1.loadFromUri(`${localHost}/models`)
]).then(start);

async function start() {
  const labelDescriptions = await loadImages();
  const faceMatcher = new faceapi.FaceMatcher(labelDescriptions, 0.6);

  startButton.addEventListener('click', () => {
    startVideo();
  });

  detectButton.addEventListener('click', async () => {
    const detections = await faceapi
      .detectAllFaces(video)
      .withFaceLandmarks()
      .withFaceDescriptors();

    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(video, displaySize);

    const resizedDetections = faceapi.resizeResults(detections, displaySize);

    const canvas = faceapi.createCanvasFromMedia(video);
    document.body.append(canvas);
    faceapi.matchDimensions(canvas, displaySize);

    const results = resizedDetections.map(d =>
      faceMatcher.findBestMatch(d.descriptor)
    );

    results.forEach((result, i) => {
      const box = resizedDetections[i].detection.box;
      const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() });
      drawBox.draw(canvas);
    });
  });

  document.getElementById('upload-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const folderName = document.getElementById('folderName').value;
    const newImage = document.getElementById('newImage').files[0];

    if (!folderName || !newImage) {
      alert('Please provide a folder name and select an image.');
      return;
    }

    await saveImage(folderName, newImage);
    alert('Image uploaded successfully');

    // Reload images after uploading a new one
    const labelDescriptions = await loadImages();
    faceMatcher = new faceapi.FaceMatcher(labelDescriptions, 0.6);
  });
}

async function startVideo() {
  navigator.getUserMedia(
    { video: {} },
    stream => video.srcObject = stream,
    err => console.error(err)
  );
}

async function loadImages() {
  const labels = [
    "Cihan",
    "Gokhan",
    "Guray",
    "Orhan",
    "Ferdi",
    "Yasin",
    "Yesim",
  ];

  return Promise.all(
    labels.map(async label => {
      const descriptions = [];

      for (let i = 1; i <= 3; i++) {
        const image = await faceapi.fetchImage(
          `${localHost}/library/${label}/${i}.jpg`
        );

        const detections = await faceapi
          .detectSingleFace(image)
          .withFaceLandmarks()
          .withFaceDescriptor();
        descriptions.push(detections.descriptor);
      }
      return new faceapi.LabeledFaceDescriptors(label, descriptions);
    })
  );
}

async function saveImage(folderName, imageFile) {
  try {
    const dirHandle = await window.showDirectoryPicker();
    const libraryHandle = await dirHandle.getDirectoryHandle('library', { create: true });
    const folderHandle = await libraryHandle.getDirectoryHandle(folderName, { create: true });
    const fileHandle = await folderHandle.getFileHandle(imageFile.name, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(imageFile);
    await writable.close();
  } catch (error) {
    console.error('Error saving image:', error);
    alert('Error saving image. Please try again.');
  }
}







 
