const fileInput = document.getElementById("audioInput");
const audioPlayer = document.getElementById("audioPlayer");
const urlInput = document.getElementById("urlInput");
const loadUrlBtn = document.getElementById("loadUrlBtn");
const playBtn = document.getElementById("playBtn");
const pauseBtn = document.getElementById("pauseBtn");

const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");

let audioContext, source, analyser;
let dataArray, bufferLength;

let bgHue = 200; // 背景顏色初始值
let musicName = "Unknown Music";

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight * 0.7;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);


// ----------------------------
// 初始化 Web Audio
// ----------------------------
function setupAudioNodes() {
  if(audioContext) return;

  audioContext = new AudioContext();
  analyser = audioContext.createAnalyser();

  analyser.fftSize = 1024;
  analyser.smoothingTimeConstant = 0.85; // 平滑處理（降低敏感度）

  bufferLength = analyser.frequencyBinCount;
  dataArray = new Uint8Array(bufferLength);

  source = audioContext.createMediaElementSource(audioPlayer);
  source.connect(analyser);
  analyser.connect(audioContext.destination);
}


// ----------------------------
// 讀取本機音檔
// ----------------------------
fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if(!file) return;

  const url = URL.createObjectURL(file);
  audioPlayer.src = url;

  musicName = file.name.replace(/\.[^/.]+$/, "");

  setupAudioNodes();
});


// ----------------------------
// 讀取 MP3 URL
// ----------------------------
loadUrlBtn.addEventListener("click", () => {
  const url = urlInput.value.trim();
  if(url === "") return alert("請輸入可播放的 MP3 連結");

  audioPlayer.src = url;

  // 依網址取名稱
  musicName = url.split("/").pop();

  setupAudioNodes();
});


// ----------------------------
// 播放 / 暫停
// ----------------------------
playBtn.addEventListener("click", () => {
  audioPlayer.play();
  audioContext.resume();
});

pauseBtn.addEventListener("click", () => {
  audioPlayer.pause();
});


// ----------------------------
// 視覺化渲染（環形 + 能量光環 + 背景變色）
// ----------------------------
function visualize() {
  requestAnimationFrame(visualize);

  if(!analyser) return;

  analyser.getByteFrequencyData(dataArray);

  // 平均能量（控制背景跟圓圈）
  let avg = dataArray.slice(0, 80).reduce((a, b) => a + b, 0) / 80;
  avg = avg * 0.5; // 再降低敏感度

  // 背景顏色緩慢變化
  bgHue += avg * 0.005;
  ctx.fillStyle = `hsl(${bgHue % 360}, 40%, 10%)`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  const baseRadius = Math.min(canvas.width, canvas.height) * 0.18;
  const glow = avg * 0.7;

  // ====== 中心發光圓 ======
  ctx.beginPath();
  ctx.arc(centerX, centerY, baseRadius + glow, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(255, 180, 255, 0.9)`;
  ctx.lineWidth = 12;
  ctx.stroke();

  // ====== 外圍環形頻譜 ======
  const bars = 120;
  for(let i = 0; i < bars; i++) {
    let angle = (i / bars) * Math.PI * 2;

    let barHeight = dataArray[i] * 0.6; // 減少敏感度

    let x1 = centerX + Math.cos(angle) * (baseRadius + 20);
    let y1 = centerY + Math.sin(angle) * (baseRadius + 20);

    let x2 = centerX + Math.cos(angle) * (baseRadius + barHeight);
    let y2 = centerY + Math.sin(angle) * (baseRadius + barHeight);

    ctx.strokeStyle = `hsl(${(i * 3 + bgHue) % 360}, 80%, 60%)`;
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // ====== 中央顯示音樂名稱 ======
  ctx.fillStyle = "white";
  ctx.font = "22px Arial";
  ctx.textAlign = "center";
  ctx.fillText(musicName, centerX, centerY + 8);
}

visualize();
