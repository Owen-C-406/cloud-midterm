const fileInput = document.getElementById("audioInput");
const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight * 0.6;

// Web Audio API 元件
let audioContext, audioSource, analyser;

fileInput.addEventListener("change", function() {
  const file = this.files[0];
  if(!file) return;

  const reader = new FileReader();
  reader.readAsArrayBuffer(file);

  reader.onload = function(e) {
    startAudio(e.target.result);
  }
});

function startAudio(arrayBuffer) {
  if(audioContext) audioContext.close();

  audioContext = new (window.AudioContext || window.webkitAudioContext)();

  audioContext.decodeAudioData(arrayBuffer, function(buffer) {
    const audio = audioContext.createBufferSource();
    audio.buffer = buffer;

    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;

    audio.connect(analyser);
    analyser.connect(audioContext.destination);

    audio.start();
    visualize();
  });
}

function visualize() {
  requestAnimationFrame(visualize);

  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  analyser.getByteFrequencyData(dataArray);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const barWidth = canvas.width / bufferLength;

  for(let i = 0; i < bufferLength; i++) {
    const barHeight = dataArray[i] * 1.2;

    const x = i * barWidth;
    const y = canvas.height - barHeight;

    ctx.fillStyle = `rgb(${barHeight + 80}, 40, 200)`;
    ctx.fillRect(x, y, barWidth - 2, barHeight);
  }
}
