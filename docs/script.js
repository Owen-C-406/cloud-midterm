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

// 調整畫布大小
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
  analyser.smoothingTimeConstant = 0.85; // 保持平滑

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
  constructor(x, y, angle, speed, color, size) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.speed = speed;
    this.color = color;
    this.life = 1;
    this.size = size;
  }
  update() {
    this.x += Math.cos(this.angle) * this.speed;
    this.y += Math.sin(this.angle) * this.speed;
    this.life -= 0.01;
  }
  draw() {
    ctx.fillStyle = `rgba(${this.color},${this.life})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
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

  // 平均能量 (對數縮放)
  let avg = dataArray.slice(0, 80).reduce((a,b)=>a+b,0)/80;
  avg = Math.sqrt(avg / 255) * 50; // 小聲音不動，大聲音放大

  // 背景全頁變色
  bgHue += avg * 0.3;
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

  // 外圍頻譜 + 粒子
  const bars = 120;
  for(let i=0;i<bars;i++){
    let angle = (i/bars)*Math.PI*2;
    let barHeight = dataArray[i]*0.6;

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

    // 粒子生成
    if(Math.random()<0.04){
      let color = `${(i*2+bgHue)%360},80%,60%`;
      let size = Math.random()*3 + 1;
      let speed = Math.random()*2 + 1;
      particles.push(new Particle(x2,y2,angle,speed,color,size));
    }
  }

  // 更新粒子
  for(let i=particles.length-1;i>=0;i--){
    let p = particles[i];
    p.update();
    p.draw();
    if(p.life<=0) particles.splice(i,1);
  }

  // 中央音樂名稱
  ctx.fillStyle = "white";
  ctx.font = "22px Arial";
  ctx.textAlign = "center";
  ctx.fillText(musicName, centerX, centerY+8);
}

visualize();
