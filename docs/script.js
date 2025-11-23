const fileInput = document.getElementById("audioInput");
const audioPlayer = document.getElementById("audioPlayer");
const urlInput = document.getElementById("urlInput");
const loadUrlBtn = document.getElementById("loadUrlBtn");
const playBtn = document.getElementById("playBtn");
const pauseBtn = document.getElementById("pauseBtn");

const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight * 0.7;

let audioContext, source, analyser;
let dataArray, bufferLength;

// ----------------------------
// 初始化 Web Audio
// ----------------------------
function setupAudioNodes() {
  if(audioContext) return;

  audioContext = new AudioContext();
  analyser = audioContext.createAnalyser();

  analyser.fftSize = 1024;
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
  setupAudioNodes();
});

// ----------------------------
// 讀取網址音樂
// ----------------------------
loadUrlBtn.addEventListener("click", () => {
  const url = urlInput.value.trim();
  if(url === "") return alert("請輸入音樂檔案 URL");

  audioPlayer.src = url;
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
// 視覺化渲染（環形 + 能量光環）
// ----------------------------
function visualize() {
  requestAnimationFrame(visualize);

  if(!analyser) return;

  analyser.getByteFrequencyData(dataArray);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = 140;

  // ====== 中心能量圓環 ======
  let avg = dataArray.slice(0, 60).reduce((a, b) => a + b, 0) / 60;
  let glow = avg / 1.5;

  ctx.beginPath();
  ctx.arc(centerX, centerY, radius + glow, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(200, ${80 + glow}, 255, 0.8)`;
  ctx.lineWidth = 12;
  ctx.stroke();

  // ====== 外圍頻譜（環形） ======
  const bars = 120;  // 外圈分段
  for(let i = 0; i < bars; i++) {
    let angle = (i / bars) * Math.PI * 2;

    // 對應資料
    let barHeight = dataArray[i] * 0.9;

    let x1 = centerX + Math.cos(angle) * (radius + 20);
    let y1 = centerY + Math.sin(angle) * (radius + 20);

    let x2 = centerX + Math.cos(angle) * (radius + barHeight);
    let y2 = centerY + Math.sin(angle) * (radius + barHeight);

    ctx.strokeStyle = `hsl(${i * 3}, 80%, 60%)`;
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
}

visualize();
