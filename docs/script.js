const fileInput = document.getElementById("audioInput");
const audioPlayer = document.getElementById("audioPlayer");
const playBtn = document.getElementById("playBtn");
const pauseBtn = document.getElementById("pauseBtn");

const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");

let audioContext, source, analyser;
let dataArray, bufferLength;

let bgHue = 200;
let musicName = "Unknown Music";

// 畫布大小
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight * 0.7;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// 初始化音訊
function setupAudioNodes() {
  if(audioContext) return;

  audioContext = new AudioContext();
  analyser = audioContext.createAnalyser();

  analyser.fftSize = 1024;
  analyser.smoothingTimeConstant = 0.85;

  bufferLength = analyser.frequencyBinCount;
  dataArray = new Uint8Array(bufferLength);

  source = audioContext.createMediaElementSource(audioPlayer);
  source.connect(analyser);
  analyser.connect(audioContext.destination);
}

// 上傳檔案
fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if(!file) return;

  const url = URL.createObjectURL(file);
  audioPlayer.src = url;

  musicName = file.name.replace(/\.[^/.]+$/, "");
  setupAudioNodes();
});

// 播放 / 暫停
playBtn.addEventListener("click", () => {
  audioPlayer.play();
  audioContext.resume();
});

pauseBtn.addEventListener("click", () => {
  audioPlayer.pause();
});

// 視覺化
function visualize() {
  requestAnimationFrame(visualize);

  if(!analyser) return;

  analyser.getByteFrequencyData(dataArray);

  // 平均能量
  let avg = dataArray.slice(0, 80).reduce((a,b)=>a+b,0)/80;
  avg = Math.sqrt(avg / 255) * 50; // 小聲音不動，大聲音放大

  // 背景全頁變色
  bgHue += avg * 0.05; // 緩慢變化，眼睛舒適
  document.body.style.backgroundColor = `hsl(${bgHue%360},40%,10%)`;

  ctx.clearRect(0,0,canvas.width,canvas.height);

  const centerX = canvas.width/2;
  const centerY = canvas.height/2;
  const baseRadius = Math.min(canvas.width,canvas.height)*0.18;
  const glow = avg * 1.2;

  // 中心圓
  ctx.beginPath();
  ctx.arc(centerX,centerY,baseRadius+glow,0,Math.PI*2);
  ctx.strokeStyle = `rgba(255,180,255,0.9)`;
  ctx.lineWidth = 12;
  ctx.shadowBlur = 20;
  ctx.shadowColor = "rgba(255,180,255,0.7)";
  ctx.stroke();
  ctx.shadowBlur = 0;

  // 外圍頻譜
  const bars = 120;
  for(let i=0;i<bars;i++){
    let angle = (i/bars)*Math.PI*2;
    let barHeight = dataArray[i]*0.5;

    let x1 = centerX+Math.cos(angle)*(baseRadius+20);
    let y1 = centerY+Math.sin(angle)*(baseRadius+20);
    let x2 = centerX+Math.cos(angle)*(baseRadius+barHeight);
    let y2 = centerY+Math.sin(angle)*(baseRadius+barHeight);

    ctx.strokeStyle = `hsl(${(i*3+bgHue)%360},80%,60%)`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x1,y1);
    ctx.lineTo(x2,y2);
    ctx.stroke();
  }

  // 中央音樂名稱，長度過長自動縮短
  let displayName = musicName;
  const maxChars = 20;
  if(displayName.length > maxChars){
    displayName = displayName.slice(0, maxChars-3) + "...";
  }
  ctx.fillStyle = "white";
  ctx.font = "22px Arial";
  ctx.textAlign = "center";
  ctx.fillText(displayName, centerX, centerY+8);
}

visualize();
