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
let particles = [];

// 調整畫布
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
  analyser.smoothingTimeConstant = 0.85; // 保持一定平滑

  bufferLength = analyser.frequencyBinCount;
  dataArray = new Uint8Array(bufferLength);

  source = audioContext.createMediaElementSource(audioPlayer);
  source.connect(analyser);
  analyser.connect(audioContext.destination);
}

// ----------------------------
// 本地檔案上傳
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
// 粒子特效
// ----------------------------
class Particle {
  constructor(x, y, angle, speed, color) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.speed = speed;
    this.color = color;
    this.life = 1;
  }
  update() {
    this.x += Math.cos(this.angle) * this.speed;
    this.y += Math.sin(this.angle) * this.speed;
    this.life -= 0.01;
  }
  draw() {
    ctx.fillStyle = `rgba(${this.color},${this.life})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ----------------------------
// 視覺化
// ----------------------------
function visualize() {
  requestAnimationFrame(visualize);

  if(!analyser) return;

  analyser.getByteFrequencyData(dataArray);

  // 平均能量
  let avg = dataArray.slice(0, 80).reduce((a,b)=>a+b,0)/80;
  avg = avg * 0.5; // 調整敏感度

  // 背景顏色全頁變化
  bgHue += avg * 0.002;
  document.body.style.backgroundColor = `hsl(${bgHue%360}, 40%, 10%)`;

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
  ctx.stroke();

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

    // 產生粒子
    if(Math.random()<0.02){
      let color = `${(i*2+bgHue)%360},80%,60%`;
      particles.push(new Particle(x2,y2,angle,Math.random()*3,color));
    }
  }

  // 更新粒子
  particles.forEach((p,i)=>{
    p.update();
    p.draw();
    if(p.life<=0) particles.splice(i,1);
  });

  // 中央顯示音樂名稱
  ctx.fillStyle = "white";
  ctx.font = "22px Arial";
  ctx.textAlign = "center";
  ctx.fillText(musicName, centerX, centerY+8);
}

visualize();
