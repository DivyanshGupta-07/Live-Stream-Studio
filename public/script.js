const userVideo = document.getElementById("user-video");
const startBtn = document.getElementById("start-btn");
const stopBtn = document.getElementById("stop-btn");
const keyBtn = document.getElementById("key");

const state = { media: null };
const socket = io();

window.addEventListener("load", async (e) => {
  //geting media stream
  const media = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true,
  });
  userVideo.srcObject = media;
  state.media = media;
});

startBtn.addEventListener("click", async () => {
  const key = keyBtn.value.trim();
  if (key) {
    socket.emit("key", key);
    //changing media stream into binarhy stream bcs tcp dosent transmit media stream
    const mediaRecorder = new MediaRecorder(state.media, {
      audioBitsPerSecond: 128000,
      videoBitsPerSecond: 250000,
      framerate: 25,
    });

    mediaRecorder.ondataavailable = (e) => {
      //sending binary stream to backend server through socketio
      socket.emit("binarystream", e.data);
    };

    mediaRecorder.start(25);
  } else {
    alert("Invalid key");
  }
});

stopBtn.addEventListener("click", () => {
  socket.emit("stopstreaming");
});
