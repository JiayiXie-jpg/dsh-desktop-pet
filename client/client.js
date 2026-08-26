// client/index.js
import { createElement as h, useState, useEffect } from "react";
var name = "dsh-desktop-companion";
var inject = ["slots", "connection"];
var RPC_CHANNEL = "/dsh-desktop-pet";
var CSS = `
.dsh-pet-root{position:fixed;z-index:1000;user-select:none;-webkit-user-select:none;touch-action:none;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"PingFang SC","Microsoft YaHei",sans-serif;}
.dsh-pet-body{position:relative;cursor:grab;display:flex;flex-direction:column;align-items:center;}
.dsh-pet-root.is-dragging .dsh-pet-body{cursor:grabbing;}
.dsh-pet-figure{position:relative;display:flex;flex-direction:column;align-items:center;transition:transform .2s ease;}
.dsh-pet-root:hover .dsh-pet-figure{transform:scale(1.05);}
.dsh-pet-root.is-dragging .dsh-pet-figure{transform:scale(1.08) rotate(-3deg);}
.dsh-pet-aura{position:absolute;top:6px;left:50%;transform:translateX(-50%);width:112px;height:112px;border-radius:50%;pointer-events:none;}
.dsh-pet-emoji{position:relative;font-size:56px;line-height:1;filter:drop-shadow(0 8px 14px rgba(0,0,0,.16));animation:dsh-pet-bob 3.2s ease-in-out infinite;}
.dsh-pet-img{position:relative;width:64px;height:64px;object-fit:contain;border-radius:18px;background:#fff;box-shadow:0 6px 16px rgba(0,0,0,.16);animation:dsh-pet-bob 3.2s ease-in-out infinite;}
.dsh-pet-video{width:120px;height:120px;animation:dsh-pet-bob 3.2s ease-in-out infinite;filter:drop-shadow(0 8px 14px rgba(0,0,0,.18));}
.dsh-pet-shadow{width:32px;height:7px;border-radius:50%;background:rgba(0,0,0,.16);margin-top:1px;filter:blur(1.5px);animation:dsh-pet-shadow 3.2s ease-in-out infinite;}
.dsh-pet-root.is-dragging .dsh-pet-emoji,.dsh-pet-root.is-dragging .dsh-pet-img,.dsh-pet-root.is-dragging .dsh-pet-video{animation:none;}
@keyframes dsh-pet-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes dsh-pet-shadow{0%,100%{transform:scaleX(1);opacity:.16}50%{transform:scaleX(.68);opacity:.07}}
.dsh-pet-root.is-speaking .dsh-pet-emoji,.dsh-pet-root.is-speaking .dsh-pet-img,.dsh-pet-root.is-speaking .dsh-pet-video{animation:dsh-pet-talk .35s ease-in-out infinite !important;}
@keyframes dsh-pet-talk{0%,100%{transform:scale(1)}50%{transform:scale(1.08) rotate(-2deg)}}
.dsh-anim-jump{animation:dsh-pet-jump .5s ease !important;}
@keyframes dsh-pet-jump{0%,100%{transform:translateY(0)}30%{transform:translateY(-18px) scale(1.1)}60%{transform:translateY(0) scale(1.04)}}
.dsh-anim-wiggle{animation:dsh-pet-wiggle .4s ease-in-out infinite !important;}
@keyframes dsh-pet-wiggle{0%,100%{transform:rotate(0)}25%{transform:rotate(-9deg)}75%{transform:rotate(9deg)}}
.dsh-anim-shake{animation:dsh-pet-shake .4s ease !important;}
@keyframes dsh-pet-shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}
.dsh-anim-nod{animation:dsh-pet-nod .6s ease-in-out infinite !important;}
@keyframes dsh-pet-nod{0%,100%{transform:translateY(0)}50%{transform:translateY(5px)}}
.dsh-pet-lv{position:absolute;top:-12px;left:-8px;background:linear-gradient(135deg,var(--pet-accent,#FF385C),#ff8a99);color:#fff;font-size:10px;font-weight:800;padding:2px 9px;border-radius:999px;box-shadow:0 3px 8px rgba(0,0,0,.22);letter-spacing:.3px;}
.dsh-pet-name{margin-top:4px;padding:3px 12px;border-radius:999px;font-size:11px;font-weight:600;color:#333;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.14);border:1px solid;}
.dsh-pet-bubble{position:absolute;bottom:calc(100% + 14px);left:50%;transform:translateX(-50%);background:#fff;color:#333;font-size:12px;line-height:1.5;padding:9px 13px;border-radius:14px;box-shadow:0 6px 18px rgba(0,0,0,.16);white-space:normal;max-width:200px;text-align:center;animation:dsh-pet-pop .25s ease;word-break:break-word;}
.dsh-pet-bubble::after{content:'';position:absolute;top:100%;left:50%;margin-left:-6px;border:6px solid transparent;border-top-color:#fff;}
@keyframes dsh-pet-pop{from{opacity:0;transform:translateX(-50%) translateY(6px) scale(.92)}to{opacity:1;transform:translateX(-50%) translateY(0) scale(1)}}
.dsh-pet-controls{position:absolute;top:-4px;right:-4px;display:flex;gap:5px;opacity:0;transition:opacity .15s,transform .15s;transform:translateY(2px);}
.dsh-pet-root:hover .dsh-pet-controls{opacity:1;transform:translateY(0);}
.dsh-pet-btn{width:24px;height:24px;border:1px solid #e5e5e5;background:#fff;border-radius:999px;font-size:12px;line-height:1;color:#666;cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,.14);display:flex;align-items:center;justify-content:center;padding:0;transition:transform .12s,color .12s;}
.dsh-pet-btn:hover{transform:scale(1.1);color:#222;}
.dsh-pet-panel{position:absolute;left:50%;bottom:calc(100% + 14px);transform:translateX(-50%);width:244px;max-height:72vh;overflow-y:auto;background:#fff;border-radius:18px;padding:14px;box-shadow:0 12px 34px rgba(0,0,0,.18);animation:dsh-pet-pop .2s ease;border:1px solid #f0f0f0;}
.dsh-pet-panel-head{display:flex;gap:10px;align-items:center;margin-bottom:10px;}
.dsh-pet-panel-avatar{width:44px;height:44px;border-radius:13px;display:flex;align-items:center;justify-content:center;font-size:24px;line-height:1;flex-shrink:0;}
.dsh-pet-panel-title{font-size:13px;font-weight:800;color:#222;}
.dsh-pet-panel-rarity{display:inline-block;padding:1px 8px;border-radius:999px;font-size:10px;font-weight:700;border:1px solid;margin-top:3px;}
.dsh-pet-panel-sub{font-size:10px;color:#888;margin-top:3px;font-weight:600;}
.dsh-pet-stat{display:flex;align-items:center;gap:7px;margin-bottom:7px;font-size:11px;color:#555;}
.dsh-pet-stat-label{width:58px;flex-shrink:0;}
.dsh-pet-stat-track{flex:1;height:8px;background:#f1f3f5;border-radius:5px;overflow:hidden;box-shadow:inset 0 1px 2px rgba(0,0,0,.05);}
.dsh-pet-stat-fill{height:100%;border-radius:5px;transition:width .5s cubic-bezier(.22,1,.36,1);}
.dsh-pet-stat-val{width:30px;text-align:right;flex-shrink:0;color:#888;}
.dsh-pet-xprow{display:flex;align-items:center;gap:7px;margin:9px 0 11px;font-size:11px;color:#555;}
.dsh-pet-field{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px;font-size:12px;color:#555;}
.dsh-pet-input{flex:1;border:1.5px solid #ebebeb;border-radius:9px;padding:6px 9px;font-size:12px;outline:none;width:0;transition:border-color .15s;}
.dsh-pet-input:focus{border-color:var(--pet-accent,#FF385C);}
.dsh-pet-actions{display:flex;gap:6px;}
.dsh-pet-act{flex:1;padding:8px 0;border-radius:11px;border:1.5px solid #ebebeb;background:#fff;color:#333;font-size:12px;font-weight:600;cursor:pointer;transition:all .15s;}
.dsh-pet-act:hover{background:#f7f7f7;}
.dsh-pet-act:disabled{opacity:.5;cursor:default;}
.dsh-pet-act-primary{border:none;background:var(--pet-accent,#FF385C);color:#fff;}
.dsh-pet-act-primary:hover{filter:brightness(1.06);background:var(--pet-accent,#FF385C);}
.dsh-pet-act-warn{color:#c13515;border-color:#ffd8d8;}
.dsh-pet-act-warn:hover{background:#fff4f4;}
.dsh-pet-gen{margin-top:12px;padding-top:11px;border-top:1px solid #f0f0f0;}
.dsh-pet-gen-title{font-size:12px;font-weight:700;color:#333;margin-bottom:7px;}
.dsh-pet-gen-input{width:100%;box-sizing:border-box;border:1.5px solid #ebebeb;border-radius:9px;padding:7px 9px;font-size:12px;outline:none;margin-bottom:7px;transition:border-color .15s;}
.dsh-pet-gen-input:focus{border-color:var(--pet-accent,#FF385C);}
.dsh-pet-file{display:flex;align-items:center;justify-content:center;gap:7px;border:1.5px dashed #d5d5d5;border-radius:11px;padding:9px;margin-bottom:7px;cursor:pointer;font-size:12px;color:#777;background:#fafafa;transition:all .15s;}
.dsh-pet-file:hover{border-color:var(--pet-accent,#FF385C);color:var(--pet-accent,#FF385C);}
.dsh-pet-file-preview{width:46px;height:46px;object-fit:cover;border-radius:9px;box-shadow:0 1px 4px rgba(0,0,0,.12);}
.dsh-pet-gen-btn{width:100%;padding:8px 0;border-radius:11px;border:none;background:var(--pet-accent,#FF385C);color:#fff;font-size:12px;font-weight:700;cursor:pointer;transition:filter .15s;}
.dsh-pet-gen-btn:hover{filter:brightness(1.06);}
.dsh-pet-gen-btn:disabled{opacity:.6;cursor:default;}
.dsh-pet-gen-err{font-size:10px;color:#c13515;margin-top:7px;word-break:break-all;}
.dsh-pet-gen-clear{width:100%;margin-top:7px;padding:7px 0;border-radius:11px;border:1.5px solid #ffd8d8;background:#fff;color:#c13515;font-size:12px;font-weight:600;cursor:pointer;}
.dsh-pet-gen-clear:hover{background:#fff4f4;}
.dsh-pet-mini{position:fixed;right:24px;bottom:24px;z-index:1000;width:44px;height:44px;border-radius:50%;background:#fff;box-shadow:0 6px 18px rgba(0,0,0,.18);display:flex;align-items:center;justify-content:center;font-size:20px;cursor:pointer;user-select:none;border:1px solid #f0f0f0;transition:transform .15s;}
.dsh-pet-mini:hover{transform:scale(1.08);}
`;
var SPECIES = {
  bitcat: { name: "\u4F4D\u732B", en: "Bitcat", emoji: ["\u{1F431}", "\u{1F408}", "\u{1F405}"], passive: "\u8BFB\u6587\u4EF6\u65F6\u7279\u522B\u5F00\u5FC3", color: "#FFB400" },
  shelldragon: { name: "\u58F3\u9F99", en: "Shelldragon", emoji: ["\u{1F98E}", "\u{1F409}", "\u{1F432}"], passive: "Bash \u547D\u4EE4\u53CC\u500D\u7ECF\u9A8C", color: "#00A699" },
  codeslime: { name: "\u7801\u53F2\u83B1\u59C6", en: "Codeslime", emoji: ["\u{1F7E2}", "\u{1F9A0}", "\u{1F47E}"], passive: "\u5347\u7EA7\u7ECF\u9A8C\u9700\u6C42 -20%", color: "#7ED321" },
  gitfox: { name: "\u5409\u72D0", en: "Gitfox", emoji: ["\u{1F98A}", "\u{1F43A}", "\u{1F99D}"], passive: "Git \u64CD\u4F5C\u989D\u5916\u7ECF\u9A8C", color: "#FF5A5F" },
  bugowl: { name: "\u866B\u67AD", en: "Bugowl", emoji: ["\u{1F423}", "\u{1F989}", "\u{1F985}"], passive: "\u6D4B\u8BD5/\u8C03\u8BD5\u53CC\u500D\u7ECF\u9A8C", color: "#3D5AFE" },
  pixiebot: { name: "\u50CF\u7D20\u7CBE\u7075", en: "Pixiebot", emoji: ["\u{1F916}", "\u{1F47E}", "\u{1F6F8}"], passive: "\u5FC3\u60C5\u8870\u51CF\u51CF\u534A", color: "#6C5CE7" }
};
var RARITIES = [
  { name: "\u666E\u901A", weight: 60, stars: "\u2605", color: "#9aa0a6" },
  { name: "\u4F18\u79C0", weight: 25, stars: "\u2605\u2605", color: "#34c759" },
  { name: "\u7A00\u6709", weight: 10, stars: "\u2605\u2605\u2605", color: "#3d7bff" },
  { name: "\u4F20\u8BF4", weight: 4, stars: "\u2605\u2605\u2605\u2605", color: "#f5a623" },
  { name: "\u5F02\u8272", weight: 1, stars: "\u2605\u2605\u2605\u2605\u2605", color: "#ff2e88" }
];
var STAGES = ["\u5E7C\u5E74\u4F53", "\u6210\u957F\u4F53", "\u5B8C\u5168\u4F53"];
var CLICK_LINES = [
  "\u4EE3\u7801\u4E5F\u50CF\u4EBA\u751F\u4E00\u6837\uFF0C\u575A\u6301\u5C31\u4F1A\u6709\u6536\u83B7~",
  "\u4ECA\u5929\u4E5F\u8981\u52A0\u6CB9\u9E2D\uFF0C\u6211\u966A\u7740\u4F60\uFF01",
  "\u76F8\u4FE1\u81EA\u5DF1\uFF0C\u4F60\u4E5F\u53EF\u4EE5\u6210\u4E3A\u81EA\u5DF1\u7684\u51A0\u519B\uFF01",
  "\u6478\u6478\u5934~\u5FC3\u60C5\u53D8\u597D\u5566",
  "\u4E3B\u4EBA\u6700\u68D2\u4E86\uFF01"
];
function rand(n) {
  return Math.floor(Math.random() * n);
}
function pick(arr) {
  return arr[rand(arr.length)];
}
function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}
function hexByte() {
  return ("0" + rand(256).toString(16).toUpperCase()).slice(-2);
}
function makeDna() {
  const p = [];
  for (let i = 0; i < 8; i += 1) p.push(hexByte());
  return p.join("-");
}
function hexA(hex, a) {
  try {
    const n = parseInt(hex.replace("#", ""), 16);
    return "rgba(" + (n >> 16 & 255) + "," + (n >> 8 & 255) + "," + (n & 255) + "," + a + ")";
  } catch (e) {
    return "rgba(255,56,92," + a + ")";
  }
}
function rollRarity() {
  const r = Math.random() * 100;
  let acc = 0;
  for (let i = 0; i < RARITIES.length; i += 1) {
    acc += RARITIES[i].weight;
    if (r <= acc) return RARITIES[i];
  }
  return RARITIES[0];
}
function xpNextFor(level, speciesKey) {
  const base = Math.round(60 * Math.pow(level, 1.2));
  return speciesKey === "codeslime" ? Math.round(base * 0.8) : base;
}
function stageOf(level) {
  return level < 5 ? 0 : level < 10 ? 1 : 2;
}
function classify(label) {
  if (label === "bash" || label === "terminal") return "bash";
  if (label === "edit" || label === "write") return "write";
  if (label === "read" || label === "glob" || label === "grep") return "read";
  return "other";
}
function xpFor(label, speciesKey) {
  let base = 4;
  const c = classify(label);
  if (c === "bash") base = 5;
  else if (c === "write") base = 8;
  else if (c === "read") base = 2;
  if (speciesKey === "shelldragon" && c === "bash") base *= 2;
  if (speciesKey === "bitcat" && c === "read") base += 2;
  return base;
}
function branchOf(c) {
  if ((c.read || 0) + (c.write || 0) >= 6) return "\u4EE3\u7801\u7CFB";
  if ((c.bash || 0) >= 6) return "\u547D\u4EE4\u7CFB";
  if ((c.message || 0) >= 6) return "\u6C9F\u901A\u7CFB";
  return "\u5747\u8861\u7CFB";
}
function hatch() {
  const speciesKey = pick(Object.keys(SPECIES));
  const rarity = rollRarity();
  return {
    species: speciesKey,
    rarity: rarity.name,
    dna: makeDna(),
    name: SPECIES[speciesKey].name,
    level: 1,
    xp: 0,
    xpNext: xpNextFor(1, speciesKey),
    mood: 80,
    hunger: 80,
    intimacy: 0,
    stage: 0,
    branch: null,
    counters: { message: 0, bash: 0, write: 0, read: 0, other: 0 },
    customImage: null,
    hatchedAt: Date.now()
  };
}
function mealLine(hh, mm) {
  if (hh === 8 && mm === 0) return "\u65E9\u4E0A\u597D\u5440~\u8BE5\u5403\u65E9\u996D\u5566\uFF01";
  if (hh === 12 && mm === 0) return "\u4E2D\u5348\u5566\uFF01\u653E\u4E0B\u952E\u76D8\u53BB\u5403\u996D\u5427~";
  if (hh === 18 && mm === 0) return "\u665A\u996D\u65F6\u95F4\u5230~\u4ECA\u5929\u8F9B\u82E6\u4E86\uFF01";
  return null;
}
var petData = null;
var lastActivitySeq = 0;
var bubbleToken = 0;
var lastAutoSpeakAt = 0;
var videoEls = {};
function TransparentVideo(props) {
  useEffect(function() {
    const video = videoEls.video;
    const canvas = videoEls.canvas;
    if (!video || !canvas) return;
    const c = canvas.getContext("2d");
    let raf = 0;
    function ensurePlay() {
      if (video.paused) {
        const p = video.play();
        if (p && p.catch) p.catch(function() {
        });
      }
    }
    function tick() {
      ensurePlay();
      if (video.readyState >= 2 && video.videoWidth > 0) {
        const W = props.size;
        const H = Math.max(1, Math.round(props.size * video.videoHeight / video.videoWidth));
        if (canvas.width !== W || canvas.height !== H) {
          canvas.width = W;
          canvas.height = H;
        }
        c.drawImage(video, 0, 0, W, H);
        const img = c.getImageData(0, 0, W, H);
        const d = img.data;
        const T_LO = 18, T_HI = 52;
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i], g = d[i + 1], b = d[i + 2];
          const mx = Math.max(r, b);
          const spill = g - mx;
          let a = 255;
          if (spill >= T_HI) a = 0;
          else if (spill > T_LO) a = Math.round((T_HI - spill) / (T_HI - T_LO) * 255);
          d[i + 3] = a;
          if (spill > 0 && a < 255) d[i + 1] = Math.round(g - spill * 0.85);
        }
        c.putImageData(img, 0, 0);
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return function() {
      cancelAnimationFrame(raf);
    };
  }, [props.src, props.size]);
  return h(
    "div",
    { style: { width: props.size + "px", height: props.size + "px", position: "relative" } },
    h("video", {
      ref: function(el) {
        videoEls.video = el;
      },
      src: props.src,
      autoPlay: true,
      loop: true,
      muted: true,
      playsInline: true,
      style: { position: "absolute", top: 0, left: 0, width: 1, height: 1, opacity: 0.01, pointerEvents: "none" }
    }),
    h("canvas", {
      ref: function(el) {
        videoEls.canvas = el;
      },
      style: { width: props.size + "px", height: props.size + "px" }
    })
  );
}
function PetView({ call, onToast }) {
  const [pet, setPet] = useState(null);
  const [bubble, setBubble] = useState(null);
  const [action, setAction] = useState("idle");
  const [pos, setPos] = useState(null);
  const [drag, setDrag] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [muted, setMuted] = useState(false);
  const [genText, setGenText] = useState("");
  const [genFileDataUrl, setGenFileDataUrl] = useState(null);
  const [genBusy, setGenBusy] = useState(false);
  const [videoBusy, setVideoBusy] = useState(false);
  const [genError, setGenError] = useState(null);
  const [customVideo, setCustomVideo] = useState(null);
  const [audioSrc, setAudioSrc] = useState(null);
  function refresh() {
    if (petData) setPet(Object.assign({}, petData));
  }
  function showBubble(text) {
    bubbleToken += 1;
    const tok = bubbleToken;
    setBubble(text);
    setTimeout(function() {
      if (tok === bubbleToken) setBubble(null);
    }, 6e3);
  }
  function save() {
    try {
      call("save", { state: petData }).catch(function() {
      });
    } catch (err) {
    }
  }
  function setActionTmp(a) {
    setAction(a);
    setTimeout(function() {
      setAction("idle");
    }, 2600);
  }
  function speakLine(text) {
    try {
      call("speak", { text }).then(function(r) {
        if (r && r.audio) setAudioSrc("data:audio/mpeg;base64," + r.audio);
      }).catch(function() {
      });
    } catch (err) {
    }
  }
  function autoSpeak(text) {
    if (muted) return;
    const now = Date.now();
    if (now - lastAutoSpeakAt < 1e4) return;
    lastAutoSpeakAt = now;
    speakLine(text);
  }
  function gainXp(amount, counterKey) {
    if (!petData || amount <= 0) return;
    petData.counters[counterKey] = (petData.counters[counterKey] || 0) + 1;
    petData.xp += amount;
    while (petData.xp >= petData.xpNext) {
      petData.xp -= petData.xpNext;
      petData.level += 1;
      petData.xpNext = xpNextFor(petData.level, petData.species);
      const s = stageOf(petData.level);
      if (s > petData.stage) {
        petData.stage = s;
        petData.branch = branchOf(petData.counters);
        showBubble("\u8FDB\u5316\u5566\uFF01" + STAGES[s] + " \xB7 " + petData.branch);
        setActionTmp("happy");
        autoSpeak("\u8FDB\u5316\u5566\uFF01" + STAGES[s] + "\uFF01");
      } else {
        showBubble("\u5347\u7EA7\u5566\uFF01Lv." + petData.level);
        setActionTmp("happy");
        autoSpeak("\u5347\u7EA7\u5566\uFF01" + petData.level + "\u7EA7\uFF01");
      }
    }
  }
  function applyEntry(e) {
    if (!petData) return;
    lastActivitySeq = e.seq;
    if (e.type === "working") {
      setBubble("\u75AF\u72C2 Coding \u4E2D...");
      setActionTmp("working");
      autoSpeak("\u5F00\u59CB\u5E72\u6D3B\u5566\uFF0C\u966A\u4F60\u4E00\u8D77~");
    } else if (e.type === "done") {
      setBubble("\u4EFB\u52A1\u5B8C\u6210\u4E86\uFF01\u4F60\u771F\u68D2~");
      setActionTmp("happy");
      gainXp(2, "other");
      autoSpeak("\u4EFB\u52A1\u5B8C\u6210\u5566\uFF0C\u4F60\u771F\u68D2\uFF01");
    } else if (e.type === "error") {
      setBubble("\u53C8\u70B8\u4E86...\u5BA0\u7269\u6342\u8138");
      setActionTmp("error");
      petData.mood = clamp(petData.mood - 5, 0, 100);
      autoSpeak("\u53C8\u70B8\u4E86\uFF0C\u522B\u7070\u5FC3\uFF0C\u518D\u6765\u4E00\u6B21");
    } else if (e.type === "session") {
      setBubble("\u55E8~\u53C8\u89C1\u9762\u5566\uFF0C\u4ECA\u5929\u4E5F\u4E00\u8D77\u52A0\u6CB9\u5427\uFF01");
      setActionTmp("happy");
      autoSpeak("\u55E8\uFF0C\u53C8\u89C1\u9762\u5566\uFF0C\u4E00\u8D77\u52A0\u6CB9\u5427");
    } else if (e.type === "message") {
      gainXp(3, "message");
    } else if (e.type === "tool") {
      gainXp(xpFor(e.label, petData.species), classify(e.label));
    }
  }
  useEffect(function() {
    let alive = true;
    (async function() {
      let initial = null;
      try {
        const r = await call("load");
        if (r && r.state) initial = r.state;
      } catch (err) {
      }
      if (!alive) return;
      if (initial) {
        petData = initial;
        refresh();
        showBubble("\u4E3B\u4EBA\u56DE\u6765\u5566\uFF01\u5BA0\u7269\u60F3\u4F60\u4E86~");
      } else {
        petData = hatch();
        refresh();
        save();
        showBubble("\u4E00\u53EA\u65B0\u7684\u5BA0\u7269\u8BDE\u751F\u4E86\uFF01" + SPECIES[petData.species].name + " \xB7 " + petData.rarity);
      }
    })();
    const stopPoll = setInterval(async function() {
      try {
        const r = await call("activity", { after: lastActivitySeq });
        if (r && r.entries && r.entries.length) {
          for (let i = 0; i < r.entries.length; i += 1) applyEntry(r.entries[i]);
          refresh();
          save();
        }
      } catch (err) {
      }
    }, 2e3);
    return function() {
      alive = false;
      clearInterval(stopPoll);
    };
  }, []);
  useEffect(function() {
    const id = setInterval(function() {
      if (!petData) return;
      petData.hunger = clamp(petData.hunger - 4, 0, 100);
      petData.mood = clamp(petData.mood - (petData.species === "pixiebot" ? 1 : 2), 0, 100);
      if (petData.hunger <= 15) {
        setBubble("\u597D\u997F\u5440...\u6295\u5582\u6211\u4E00\u4E0B\u5427 \u{1F356}");
        setActionTmp("eating");
      } else if (petData.mood <= 15) {
        setBubble("\u6709\u70B9\u4F4E\u843D...\u6478\u6478\u6211\u597D\u4E0D\u597D \u{1F97A}");
        setActionTmp("idle");
      }
      refresh();
      save();
    }, 6e4);
    return function() {
      clearInterval(id);
    };
  }, []);
  useEffect(function() {
    let lastRest = Date.now();
    const id = setInterval(function() {
      const now = /* @__PURE__ */ new Date();
      const line = mealLine(now.getHours(), now.getMinutes());
      if (line) {
        setBubble(line);
        setActionTmp("happy");
        autoSpeak(line);
      } else if (Date.now() - lastRest > 36e5) {
        lastRest = Date.now();
        setBubble("\u5DF2\u7ECF\u5FD9\u6D3B\u597D\u4E45\u4E86\uFF0C\u8D77\u6765\u6D3B\u52A8\u4E00\u4E0B~ \u{1F9D8}");
      }
    }, 3e4);
    return function() {
      clearInterval(id);
    };
  }, []);
  function onPointerDown(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    setDrag({ dx: e.clientX - rect.left, dy: e.clientY - rect.top, sx: e.clientX, sy: e.clientY, moved: false });
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {
    }
  }
  function onPointerMove(e) {
    if (!drag) return;
    const moved = drag.moved || Math.abs(e.clientX - drag.sx) > 4 || Math.abs(e.clientY - drag.sy) > 4;
    setDrag({ dx: drag.dx, dy: drag.dy, sx: drag.sx, sy: drag.sy, moved });
    setPos({ x: e.clientX - drag.dx, y: e.clientY - drag.dy });
  }
  function onPointerUp(e) {
    if (!drag) return;
    const wasMoved = drag.moved;
    setDrag(null);
    if (!wasMoved) doPat();
  }
  function doFeed() {
    if (!petData) return;
    petData.hunger = clamp(petData.hunger + 30, 0, 100);
    setBubble("\u5403\u5F97\u597D\u9971~ \u8C22\u8C22\u4E3B\u4EBA \u{1F356}");
    setActionTmp("eating");
    refresh();
    save();
  }
  function doPat() {
    if (!petData) return;
    petData.mood = clamp(petData.mood + 10, 0, 100);
    petData.intimacy = clamp(petData.intimacy + 2, 0, 999);
    const line = pick(CLICK_LINES);
    setBubble(line);
    setActionTmp("happy");
    refresh();
    save();
    speakLine(line);
  }
  function doHatch() {
    petData = hatch();
    refresh();
    save();
    setBubble("\u65B0\u7684\u5BA0\u7269\u8BDE\u751F\u4E86\uFF01" + SPECIES[petData.species].name + " \xB7 " + petData.rarity);
  }
  function doRename(v) {
    if (!petData) return;
    petData.name = (v || "").slice(0, 12);
    refresh();
    save();
  }
  function onFileChange(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setGenError("\u56FE\u7247\u592A\u5927\uFF08>5MB\uFF09\uFF0C\u8BF7\u538B\u7F29\u540E\u518D\u4F20");
      e.target.value = "";
      return;
    }
    let reader;
    try {
      reader = new FileReader();
    } catch (err) {
      setGenError("\u5F53\u524D\u73AF\u5883\u4E0D\u652F\u6301\u8BFB\u53D6\u6587\u4EF6");
      return;
    }
    reader.onload = function() {
      setGenFileDataUrl(reader.result);
      setGenError(null);
    };
    reader.onerror = function() {
      setGenError("\u8BFB\u53D6\u56FE\u7247\u5931\u8D25");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }
  async function doGenerate() {
    if (genBusy || videoBusy) return;
    const text = genText.trim();
    const image = genFileDataUrl;
    if (!text && !image) {
      setGenError("\u8BF7\u5148\u8F93\u5165\u63CF\u8FF0\u6216\u4E0A\u4F20\u56FE\u7247");
      return;
    }
    const prompt = text || "\u53C2\u8003\u8FD9\u5F20\u56FE\uFF0C\u751F\u6210\u4E00\u53EA\u53EF\u7231\u7684\u5361\u901A\u684C\u5BA0\u5F62\u8C61\uFF0C\u4FDD\u7559\u4E3B\u4F53\u7279\u5F81\uFF0C\u767D\u8272\u80CC\u666F";
    setGenBusy(true);
    setGenError(null);
    try {
      const r = await call("gen-image", { prompt, image });
      if (r && r.url) {
        if (!petData) petData = hatch();
        petData.customImage = r.url;
        refresh();
        save();
        showBubble("\u65B0\u5F62\u8C61\u751F\u6210\u597D\u5566\uFF01");
      } else {
        setGenError(r && r.error || "\u751F\u6210\u5931\u8D25");
      }
    } catch (err) {
      setGenError("\u751F\u6210\u5931\u8D25");
    }
    setGenBusy(false);
  }
  async function doGenVideo() {
    if (genBusy || videoBusy) return;
    const text = genText.trim();
    const image = genFileDataUrl;
    if (!text && !image) {
      setGenError("\u8BF7\u5148\u4E0A\u4F20\u56FE\u7247\u6216\u8F93\u5165\u63CF\u8FF0");
      return;
    }
    setVideoBusy(true);
    setGenError(null);
    setBubble("\u751F\u6210\u52A8\u753B\u4E2D\uFF0C\u7EA6 2~3 \u5206\u949F\uFF0C\u8BF7\u7A0D\u5019\u2026");
    try {
      const r = await call("gen-video", { text, image });
      if (r && r.video) {
        setCustomVideo("data:video/mp4;base64," + r.video);
        showBubble("\u52A8\u753B\u5F62\u8C61\u751F\u6210\u597D\u5566\uFF01");
      } else {
        setGenError(r && r.error || "\u751F\u6210\u5931\u8D25");
      }
    } catch (err) {
      setGenError("\u751F\u6210\u5931\u8D25");
    }
    setVideoBusy(false);
  }
  function doClearImage() {
    if (!petData) return;
    petData.customImage = null;
    refresh();
    save();
  }
  function doClearVideo() {
    setCustomVideo(null);
  }
  if (!pet) return h("div", { className: "dsh-pet-mini" }, "\u2026");
  if (hidden) return h("div", { className: "dsh-pet-mini", title: "\u5C55\u5F00\u684C\u5BA0", onClick: function() {
    setHidden(false);
  } }, "\u{1F43E}");
  const sp = SPECIES[pet.species] || SPECIES.bitcat;
  const rar = RARITIES.filter(function(r) {
    return r.name === pet.rarity;
  })[0] || RARITIES[0];
  const emoji = sp.emoji[pet.stage] || sp.emoji[0];
  function animClass(a) {
    if (a === "happy") return " dsh-anim-jump";
    if (a === "working") return " dsh-anim-wiggle";
    if (a === "error") return " dsh-anim-shake";
    if (a === "eating") return " dsh-anim-nod";
    return "";
  }
  const containerStyle = pos ? { left: pos.x, top: pos.y, "--pet-accent": sp.color } : { right: 24, bottom: 24, "--pet-accent": sp.color };
  function bar(label, value, color) {
    return h(
      "div",
      { className: "dsh-pet-stat" },
      h("span", { className: "dsh-pet-stat-label" }, label),
      h("div", { className: "dsh-pet-stat-track" }, h("div", { className: "dsh-pet-stat-fill", style: { width: clamp(value, 0, 100) + "%", background: color } })),
      h("span", { className: "dsh-pet-stat-val" }, String(Math.round(value)))
    );
  }
  let face;
  if (customVideo) face = h("div", { className: "dsh-pet-video" + animClass(action) }, h(TransparentVideo, { src: customVideo, size: 120 }));
  else if (pet.customImage) face = h("img", { className: "dsh-pet-img" + animClass(action), src: pet.customImage, alt: pet.name, draggable: false });
  else face = h("div", { className: "dsh-pet-emoji" + animClass(action) }, emoji);
  return h(
    "div",
    {
      className: "dsh-pet-root" + (drag ? " is-dragging" : "") + (audioSrc ? " is-speaking" : ""),
      style: containerStyle,
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp
    },
    audioSrc ? h("audio", { src: audioSrc, autoPlay: true, onEnded: function() {
      setAudioSrc(null);
    } }) : null,
    h(
      "div",
      { className: "dsh-pet-body" },
      bubble ? h("div", { className: "dsh-pet-bubble" }, bubble) : null,
      h(
        "div",
        { className: "dsh-pet-figure" },
        h("div", { className: "dsh-pet-aura", style: { background: "radial-gradient(circle, " + hexA(sp.color, 0.18) + " 0%, rgba(255,255,255,0) 70%)" } }),
        face,
        h("div", { className: "dsh-pet-shadow" })
      ),
      h("div", { className: "dsh-pet-lv" }, "Lv." + pet.level),
      h(
        "div",
        { className: "dsh-pet-name", style: { borderColor: hexA(sp.color, 0.35) } },
        h("span", { style: { color: rar.color } }, rar.stars + " "),
        pet.name
      ),
      h(
        "div",
        { className: "dsh-pet-controls", onPointerDown: function(e) {
          e.stopPropagation();
        } },
        h("button", { className: "dsh-pet-btn", title: muted ? "\u53D6\u6D88\u9759\u97F3" : "\u9759\u97F3\u8BED\u97F3", onClick: function() {
          setMuted(!muted);
        } }, muted ? "\u{1F507}" : "\u{1F50A}"),
        h("button", { className: "dsh-pet-btn", title: "\u81EA\u5B9A\u4E49", onClick: function() {
          setPanelOpen(!panelOpen);
        } }, "\u2699"),
        h("button", { className: "dsh-pet-btn", title: "\u6536\u8D77", onClick: function() {
          setHidden(true);
        } }, "\u2014")
      ),
      panelOpen ? h(
        "div",
        { className: "dsh-pet-panel", onPointerDown: function(e) {
          e.stopPropagation();
        } },
        h(
          "div",
          { className: "dsh-pet-panel-head" },
          h(
            "div",
            { className: "dsh-pet-panel-avatar", style: { background: hexA(sp.color, 0.14) } },
            pet.customImage ? h("img", { src: pet.customImage, style: { width: 28, height: 28, objectFit: "contain", borderRadius: 8 } }) : emoji
          ),
          h(
            "div",
            null,
            h("div", { className: "dsh-pet-panel-title" }, sp.name + " " + sp.en),
            h("div", { className: "dsh-pet-panel-rarity", style: { color: rar.color, background: hexA(rar.color, 0.1), borderColor: hexA(rar.color, 0.3) } }, rar.stars + " " + rar.name),
            h("div", { className: "dsh-pet-panel-sub" }, "Lv." + pet.level + " \xB7 " + STAGES[pet.stage] + (pet.branch ? " \xB7 " + pet.branch : ""))
          )
        ),
        bar("\u{1F356} \u9971\u98DF", pet.hunger, "#FF385C"),
        bar("\u{1F60A} \u5FC3\u60C5", pet.mood, "#FFB400"),
        bar("\u{1F497} \u4EB2\u5BC6\u5EA6", pet.intimacy / 10, "#FF5A5F"),
        h(
          "div",
          { className: "dsh-pet-xprow" },
          h("span", { className: "dsh-pet-stat-label" }, "\u7ECF\u9A8C"),
          h("div", { className: "dsh-pet-stat-track" }, h("div", { className: "dsh-pet-stat-fill", style: { width: Math.min(100, pet.xp / pet.xpNext * 100) + "%", background: "linear-gradient(90deg," + sp.color + ",#FFB400)" } })),
          h("span", { className: "dsh-pet-stat-val" }, pet.xp + "/" + pet.xpNext)
        ),
        h(
          "div",
          { className: "dsh-pet-field" },
          h("span", null, "\u540D\u5B57"),
          h("input", { className: "dsh-pet-input", value: pet.name, maxLength: 12, onChange: function(e) {
            doRename(e.target.value);
          } })
        ),
        h(
          "div",
          { className: "dsh-pet-actions" },
          h("button", { className: "dsh-pet-act dsh-pet-act-primary", onClick: doFeed }, "\u{1F356} \u6295\u5582"),
          h("button", { className: "dsh-pet-act", onClick: doPat }, "\u{1F91A} \u6478\u6478"),
          h("button", { className: "dsh-pet-act dsh-pet-act-warn", onClick: doHatch }, "\u{1F95A} \u91CD\u5B75")
        ),
        h(
          "div",
          { className: "dsh-pet-gen" },
          h("div", { className: "dsh-pet-gen-title" }, "\u2728 \u751F\u6210\u5F62\u8C61"),
          h("input", { className: "dsh-pet-gen-input", placeholder: "\u63CF\u8FF0\uFF08\u53EF\u9009\uFF0C\u5199\u5B9E\u98CE\uFF09", value: genText, onChange: function(e) {
            setGenText(e.target.value);
          } }),
          h(
            "label",
            { className: "dsh-pet-file" },
            h("input", { type: "file", accept: "image/*", style: { display: "none" }, onChange: onFileChange }),
            genFileDataUrl ? h("img", { src: genFileDataUrl, className: "dsh-pet-file-preview", alt: "\u5DF2\u9009\u56FE\u7247" }) : h("span", null, "\u{1F4C1} \u4E0A\u4F20\u56FE\u7247")
          ),
          h(
            "div",
            { className: "dsh-pet-actions" },
            h("button", { className: "dsh-pet-act", disabled: genBusy || videoBusy, onClick: doGenerate }, genBusy ? "\u751F\u6210\u4E2D\u2026" : "\u{1F5BC} \u56FE\u7247"),
            h("button", { className: "dsh-pet-act dsh-pet-act-primary", disabled: genBusy || videoBusy, onClick: doGenVideo }, videoBusy ? "\u52A8\u753B\u751F\u6210\u4E2D\u2026" : "\u{1F3AC} \u52A8\u753B")
          ),
          genError ? h("div", { className: "dsh-pet-gen-err" }, genError) : null,
          pet.customImage || customVideo ? h("button", { className: "dsh-pet-gen-clear", onClick: function() {
            doClearImage();
            doClearVideo();
          } }, "\u8FD8\u539F\u50CF\u7D20\u5BA0\u7269") : null
        )
      ) : null
    )
  );
}
function apply(ctx) {
  const slots = ctx.get("slots");
  if (slots === void 0) return;
  const styleTag = document.createElement("style");
  styleTag.dataset.dsh = name;
  styleTag.textContent = CSS;
  document.head.append(styleTag);
  ctx.effect(() => () => styleTag.remove(), "dsh-desktop-pet: styles");
  function call(endpoint, payload) {
    return ctx.connection.rpc.call(RPC_CHANNEL, endpoint, payload).then(function(res) {
      if (res && res.ok) return res.value;
      throw new Error(res && res.error && res.error.message ? res.error.message : "rpc error");
    });
  }
  slots.inject("shell.overlay", function() {
    return slots.register(
      { name: "shell.overlay", id: "dsh-minipet", order: 10, label: "\u684C\u5BA0" },
      function() {
        return h(PetView, { call });
      }
    );
  });
}
export {
  apply,
  inject,
  name
};
