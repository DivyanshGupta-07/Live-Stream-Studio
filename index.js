import http from "http";
import express from "express";
import path from "path";
import { Server as SocketIO } from "socket.io";
import { spawn } from "child_process";

const app = express();
const server = http.createServer(app);
const io = new SocketIO(server);

app.use(express.static(path.resolve("./public")));

//options for ffmpeg command
const options = [
  "-i",
  "-",
  "-c:v",
  "libx264",
  "-preset",
  "ultrafast",
  "-tune",
  "zerolatency",
  "-r",
  `${25}`,
  "-g",
  `${25 * 2}`,
  "-keyint_min",
  25,
  "-crf",
  "25",
  "-pix_fmt",
  "yuv420p",
  "-sc_threshold",
  "0",
  "-profile:v",
  "main",
  "-level",
  "3.1",
  "-c:a",
  "aac",
  "-b:a",
  "128k",
  "-ar",
  128000 / 4,
  "-f",
  "flv",
];

//key
let key = "";

//ffmpeg process
let ffmpegProcess;

//function to start ffmpeg
const startffmpeg = () => {
  const opt = [...options, `rtmp://a.rtmp.youtube.com/live2/${key}`];
  //spwan a child process for ffmpeg
  ffmpegProcess = spawn("ffmpeg", opt);

  ffmpegProcess.stdout.on("data", (data) => {
    console.log(`ffmpeg stdout: ${data}`);
  });
  ffmpegProcess.stderr.on("data", (data) => {
    console.error(`ffmpeg stderr: ${data}`);
  });
  ffmpegProcess.on("close", (code) => {
    console.error(`ffmpeg process exited with code : ${code}`);
  });
};

//function to stop ffmpeg
const stopffmpeg = () => {
  if (ffmpegProcess) {
    console.log("FFmpeg Process Exit");
    ffmpegProcess.kill("SIGINT");
    //process.exit(0);
  }
};

io.on("connection", (socket) => {
  console.log("socket connected", socket.id);

  socket.on("key", (inputkey) => {
    key = inputkey;
    if (ffmpegProcess) {
      stopffmpeg();
      startffmpeg();
    } else {
      startffmpeg();
    }
  });

  socket.on("stopstreaming", () => {
    console.log("streaming ended");
    stopffmpeg();
  });

  socket.on("binarystream", (stream) => {
    //if we have any stream then we inject that into ffmpegProcess
    if (
      ffmpegProcess &&
      !ffmpegProcess.killed &&
      ffmpegProcess.stdin &&
      !ffmpegProcess.stdin.destooyed
    ) {
      ffmpegProcess.stdin.write(stream, (err) => {
        if (err) {
          console.log("err - ", err);
        }
      });
    } else {
      console.log("invalid stream");
    }
  });
});

server.listen(3000, () => console.log("Http server is listening at port 3000"));
