
const PHASES = {
  dawn:{ s1:"#1d2547",s2:"#3b3a63",s3:"#6d5473",s4:"#c88b78",hz:"rgba(255,190,160,.42)",
    sea1:"#8a7f92",sea2:"#3f4a68",sea3:"#222b41", sand1:"#c7ae8e",sand2:"#9c8770",sand3:"#6b5b4b",
    amb:"#2a2230",wood:"#2b2028",leaf:"#3c4a3a",bloom:"#e0a0ac",
    ink:"rgba(74,52,36,.92)",inkGlow:"rgba(255,214,180,.7)",
    sink:"rgba(88,64,44,.5)",sinkEdge:"rgba(255,246,226,.55)",
    star:.25,sunO:.55,sunY:"50%",lamp:.5,warm:.2, label:"清晨" },
  day:{ s1:"#3b78b8",s2:"#5f9fd0",s3:"#93c4e2",s4:"#cfe6f0",hz:"rgba(255,255,255,.5)",
    sea1:"#7fbcd8",sea2:"#3d84ad",sea3:"#255f83", sand1:"#efdcb8",sand2:"#d9be95",sand3:"#b39a76",
    amb:"#5b4c40",wood:"#6b543f",leaf:"#4e7a4a",bloom:"#f0868f",
    ink:"rgba(58,40,26,.95)",inkGlow:"rgba(255,252,240,.85)",
    sink:"rgba(122,94,62,.55)",sinkEdge:"rgba(255,250,232,.75)",
    star:0,sunO:.9,sunY:"12%",lamp:.12,warm:0, label:"白天" },
  dusk:{ s1:"#241335",s2:"#4c2246",s3:"#93404a",s4:"#e08a52",hz:"rgba(255,180,120,.55)",
    sea1:"#c98a63",sea2:"#5c4256",sea3:"#2b2338", sand1:"#c9a173",sand2:"#96754f",sand3:"#5d4835",
    amb:"#2a1720",wood:"#2e1a1c",leaf:"#3a3327",bloom:"#d98a7e",
    ink:"rgba(255,238,208,.96)",inkGlow:"rgba(255,150,70,.65)",
    sink:"rgba(255,240,214,.5)",sinkEdge:"rgba(58,36,20,.5)",
    star:.15,sunO:.85,sunY:"46%",lamp:.7,warm:.5, label:"黄昏" },
  night:{ s1:"#040814",s2:"#0a1128",s3:"#141c3c",s4:"#252b4d",hz:"rgba(110,140,180,.28)",
    sea1:"#33415e",sea2:"#161f36",sea3:"#080d1a", sand1:"#7d7263",sand2:"#5b5247",sand3:"#332e28",
    amb:"#080a12",wood:"#100e16",leaf:"#101d1a",bloom:"#7a5a68",
    ink:"rgba(255,228,186,.96)",inkGlow:"rgba(255,168,86,.6)",
    sink:"rgba(246,236,216,.6)",sinkEdge:"rgba(24,20,16,.6)",
    star:1,sunO:0,sunY:"58%",lamp:1,warm:0, label:"夜晚" }
};

function phaseByHour(h){
  if (h >= 5 && h < 8)  return "dawn";
  if (h >= 8 && h < 16) return "day";
  if (h >= 16 && h < 19) return "dusk";
  return "night";
}
const stage = document.getElementById("stage");
function apply(name){
  const p = PHASES[name];
  for (const k of ["s1","s2","s3","s4","hz","sea1","sea2","sea3","sand1","sand2","sand3","amb","wood","leaf","bloom","ink","inkGlow","sink","sinkEdge"])
    stage.style.setProperty("--"+k, p[k]);
  stage.style.setProperty("--star", p.star);
  stage.style.setProperty("--sunO", p.sunO);
  stage.style.setProperty("--sunY", p.sunY);
  stage.style.setProperty("--lamp", p.lamp);
  return p.label;
}
function tick(){ apply(phaseByHour(new Date().getHours())); }
tick(); setInterval(tick, 60000);

// 绿植：草丛 + 灌木
const G = document.getElementById("greens");
function grassTuft(leftPct, bottomPct, scale){
  const g = document.createElement("div");
  g.className = "grass";
  g.style.left = leftPct + "%"; g.style.bottom = bottomPct + "%";
  g.style.width = (70 * scale) + "px"; g.style.height = (60 * scale) + "px";
  g.style.animation = `leafsway ${(7 + Math.random()*5).toFixed(1)}s ease-in-out infinite`;
  g.style.animationDelay = (-Math.random()*6).toFixed(1) + "s";
  const n = 7 + Math.floor(Math.random()*5);
  for (let i = 0; i < n; i++){
    const b = document.createElement("i");
    const a = -46 + (i / (n - 1)) * 92 + (Math.random()*10 - 5);
    b.style.width = (3.5 + Math.random()*2) * scale + "px";
    b.style.height = (26 + Math.random()*32) * scale + "px";
    b.style.transform = `translateX(-50%) rotate(${a.toFixed(1)}deg)`;
    g.appendChild(b);
  }
  G.appendChild(g);
}
function bush(leftPct, bottomPct, scale, flowers){
  const g = document.createElement("div");
  g.className = "bush";
  g.style.left = leftPct + "%"; g.style.bottom = bottomPct + "%";
  g.style.width = (110 * scale) + "px"; g.style.height = (70 * scale) + "px";
  g.style.animation = `leafsway ${(9 + Math.random()*5).toFixed(1)}s ease-in-out infinite`;
  g.style.animationDelay = (-Math.random()*6).toFixed(1) + "s";
  [[-30,34,30],[0,48,42],[26,36,32],[-12,30,26],[14,28,24]].forEach(([dx,w,h]) => {
    const i = document.createElement("i");
    i.style.width = w*scale + "px"; i.style.height = h*scale + "px";
    i.style.transform = `translateX(calc(-50% + ${dx*scale}px))`;
    g.appendChild(i);
  });
  for (let f = 0; f < flowers; f++){
    const b = document.createElement("b");
    b.style.left = `calc(50% + ${(Math.random()*70 - 35)*scale}px)`;
    b.style.bottom = (14 + Math.random()*30)*scale + "px";
    b.style.width = b.style.height = (4 + Math.random()*3)*scale + "px";
    g.appendChild(b);
  }
  G.appendChild(g);
}
bush(16, 30, .95, 4); bush(30, 26, .7, 2); bush(88, 27, 1.1, 5); bush(72, 23, .8, 3);
grassTuft(9, 22, 1); grassTuft(23, 18, .8); grassTuft(38, 30, .55);
grassTuft(63, 29, .6); grassTuft(80, 19, 1.05); grassTuft(95, 14, 1.25);
grassTuft(4, 10, 1.5); grassTuft(52, 33, .45);

// 星星
const S = document.getElementById("stars");
for (let i = 0; i < 100; i++){
  const s = document.createElement("span"); s.className = "star";
  s.style.left = Math.random()*100 + "%"; s.style.top = Math.random()*80 + "%";
  s.style.animationDelay = (Math.random()*4).toFixed(2) + "s";
  s.style.opacity = (.2 + Math.random()*.6).toFixed(2); S.appendChild(s);
}
// 屋檐灯串
const L = document.getElementById("lights");
for (let i = 0; i < 11; i++){
  const b = document.createElement("b");
  b.style.animationDelay = (-Math.random()*4).toFixed(1) + "s";
  b.style.transform = "translateY(" + (Math.sin(i/10*Math.PI)*7).toFixed(1) + "px)";
  L.appendChild(b);
}
// 火塘石头
const ST = document.getElementById("stones");
for (let i = 0; i < 9; i++){
  const a = (i/9)*Math.PI*2, st = document.createElement("i");
  st.style.left = (85 + Math.cos(a)*76 - 13) + "px";
  st.style.top  = (26 + Math.sin(a)*22 - 8) + "px";
  st.style.transform = "rotate(" + (Math.cos(a)*16).toFixed(1) + "deg)";
  ST.appendChild(st);
}
// 火星
const E = document.getElementById("embers");
setInterval(() => {
  const e = document.createElement("span"); e.className = "ember";
  e.style.left = (95 + Math.random()*22) + "px"; e.style.top = "50px";
  e.style.setProperty("--dx", (Math.random()*70 - 35) + "px");
  e.style.animationDuration = (2.2 + Math.random()*1.6).toFixed(1) + "s";
  E.appendChild(e); setTimeout(() => e.remove(), 4200);
}, 340);
