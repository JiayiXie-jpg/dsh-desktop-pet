// DSH 桌宠陪伴 · Client 半（动态插件 closure 体）
//
// 依赖：inject ['timer']；ctx.get('slots') 注册到 shell.overlay。
// 与 Host 的 RPC：host.call('load'|'save'|'activity'|'gen-image'|'gen-video'|'speak')。
return {
  inject: ['timer'],
  apply(ctx) {
    const slots = ctx.get('slots')
    if (slots === undefined) return
    const h = React.createElement

    const SPECIES = {
      bitcat:      { name: '位猫', en: 'Bitcat', emoji: ['🐱', '🐈', '🐅'], passive: '读文件时特别开心', color: '#FFB400' },
      shelldragon: { name: '壳龙', en: 'Shelldragon', emoji: ['🦎', '🐉', '🐲'], passive: 'Bash 命令双倍经验', color: '#00A699' },
      codeslime:   { name: '码史莱姆', en: 'Codeslime', emoji: ['🟢', '🦠', '👾'], passive: '升级经验需求 -20%', color: '#7ED321' },
      gitfox:      { name: '吉狐', en: 'Gitfox', emoji: ['🦊', '🐺', '🦝'], passive: 'Git 操作额外经验', color: '#FF5A5F' },
      bugowl:      { name: '虫枭', en: 'Bugowl', emoji: ['🐣', '🦉', '🦅'], passive: '测试/调试双倍经验', color: '#3D5AFE' },
      pixiebot:    { name: '像素精灵', en: 'Pixiebot', emoji: ['🤖', '👾', '🛸'], passive: '心情衰减减半', color: '#6C5CE7' },
    }

    const RARITIES = [
      { name: '普通', weight: 60, stars: '★', color: '#9aa0a6' },
      { name: '优秀', weight: 25, stars: '★★', color: '#34c759' },
      { name: '稀有', weight: 10, stars: '★★★', color: '#3d7bff' },
      { name: '传说', weight: 4, stars: '★★★★', color: '#f5a623' },
      { name: '异色', weight: 1, stars: '★★★★★', color: '#ff2e88' },
    ]

    const STAGES = ['幼年体', '成长体', '完全体']
    const CLICK_LINES = [
      '代码也像人生一样，坚持就会有收获~',
      '今天也要加油鸭，我陪着你！',
      '相信自己，你也可以成为自己的冠军！',
      '摸摸头~心情变好啦',
      '主人最棒了！',
    ]

    function rand(n) { return Math.floor(Math.random() * n) }
    function pick(arr) { return arr[rand(arr.length)] }
    function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)) }
    function hexByte() { return ('0' + rand(256).toString(16).toUpperCase()).slice(-2) }
    function makeDna() { const p = []; for (let i = 0; i < 8; i += 1) p.push(hexByte()); return p.join('-') }
    function hexA(hex, a) {
      try {
        const n = parseInt(hex.replace('#', ''), 16)
        return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'
      } catch (e) { return 'rgba(255,56,92,' + a + ')' }
    }
    function rollRarity() {
      const r = Math.random() * 100; let acc = 0
      for (let i = 0; i < RARITIES.length; i += 1) { acc += RARITIES[i].weight; if (r <= acc) return RARITIES[i] }
      return RARITIES[0]
    }
    function xpNextFor(level, speciesKey) {
      const base = Math.round(60 * Math.pow(level, 1.2))
      return speciesKey === 'codeslime' ? Math.round(base * 0.8) : base
    }
    function stageOf(level) { return level < 5 ? 0 : level < 10 ? 1 : 2 }
    function classify(label) {
      if (label === 'bash' || label === 'terminal') return 'bash'
      if (label === 'edit' || label === 'write') return 'write'
      if (label === 'read' || label === 'glob' || label === 'grep') return 'read'
      return 'other'
    }
    function xpFor(label, speciesKey) {
      let base = 4; const c = classify(label)
      if (c === 'bash') base = 5
      else if (c === 'write') base = 8
      else if (c === 'read') base = 2
      if (speciesKey === 'shelldragon' && c === 'bash') base *= 2
      if (speciesKey === 'bitcat' && c === 'read') base += 2
      return base
    }
    function branchOf(c) {
      if ((c.read || 0) + (c.write || 0) >= 6) return '代码系'
      if ((c.bash || 0) >= 6) return '命令系'
      if ((c.message || 0) >= 6) return '沟通系'
      return '均衡系'
    }
    function hatch() {
      const speciesKey = pick(Object.keys(SPECIES)); const rarity = rollRarity()
      return {
        species: speciesKey, rarity: rarity.name, dna: makeDna(), name: SPECIES[speciesKey].name,
        level: 1, xp: 0, xpNext: xpNextFor(1, speciesKey),
        mood: 80, hunger: 80, intimacy: 0, stage: 0, branch: null,
        counters: { message: 0, bash: 0, write: 0, read: 0, other: 0 },
        customImage: null, hatchedAt: Date.now(),
      }
    }
    function mealLine(hh, mm) {
      if (hh === 8 && mm === 0) return '早上好呀~该吃早饭啦！'
      if (hh === 12 && mm === 0) return '中午啦！放下键盘去吃饭吧~'
      if (hh === 18 && mm === 0) return '晚饭时间到~今天辛苦了！'
      return null
    }

    ctx.effect(() => styles.insert(`
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
`))

    let petData = null
    let lastActivitySeq = 0
    let bubbleToken = 0
    let lastAutoSpeakAt = 0
    const videoEls = {}

    function TransparentVideo(props) {
      React.useEffect(function () {
        const video = videoEls.video
        const canvas = videoEls.canvas
        if (!video || !canvas) return
        const c = canvas.getContext('2d')
        let raf = 0
        function ensurePlay() {
          if (video.paused) { const p = video.play(); if (p && p.catch) p.catch(function () {}) }
        }
        function tick() {
          ensurePlay()
          if (video.readyState >= 2 && video.videoWidth > 0) {
            const W = props.size
            const H = Math.max(1, Math.round(props.size * video.videoHeight / video.videoWidth))
            if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H }
            c.drawImage(video, 0, 0, W, H)
            const img = c.getImageData(0, 0, W, H)
            const d = img.data
            const T_LO = 18, T_HI = 52
            for (let i = 0; i < d.length; i += 4) {
              const r = d[i], g = d[i + 1], b = d[i + 2]
              const mx = Math.max(r, b)
              const spill = g - mx
              let a = 255
              if (spill >= T_HI) a = 0
              else if (spill > T_LO) a = Math.round((T_HI - spill) / (T_HI - T_LO) * 255)
              d[i + 3] = a
              if (spill > 0 && a < 255) d[i + 1] = Math.round(g - spill * 0.85)
            }
            c.putImageData(img, 0, 0)
          }
          raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
        return function () { cancelAnimationFrame(raf) }
      }, [props.src, props.size])

      return h('div', { style: { width: props.size + 'px', height: props.size + 'px', position: 'relative' } },
        h('video', {
          ref: function (el) { videoEls.video = el },
          src: props.src, autoPlay: true, loop: true, muted: true, playsInline: true,
          style: { position: 'absolute', top: 0, left: 0, width: 1, height: 1, opacity: 0.01, pointerEvents: 'none' },
        }),
        h('canvas', {
          ref: function (el) { videoEls.canvas = el },
          style: { width: props.size + 'px', height: props.size + 'px' },
        }),
      )
    }

    function PetView() {
      const [pet, setPet] = React.useState(null)
      const [bubble, setBubble] = React.useState(null)
      const [action, setAction] = React.useState('idle')
      const [pos, setPos] = React.useState(null)
      const [drag, setDrag] = React.useState(null)
      const [panelOpen, setPanelOpen] = React.useState(false)
      const [hidden, setHidden] = React.useState(false)
      const [muted, setMuted] = React.useState(false)
      const [genText, setGenText] = React.useState('')
      const [genFileDataUrl, setGenFileDataUrl] = React.useState(null)
      const [genBusy, setGenBusy] = React.useState(false)
      const [videoBusy, setVideoBusy] = React.useState(false)
      const [genError, setGenError] = React.useState(null)
      const [customVideo, setCustomVideo] = React.useState(null)
      const [audioSrc, setAudioSrc] = React.useState(null)

      function refresh() { if (petData) setPet(Object.assign({}, petData)) }
      function showBubble(text) {
        bubbleToken += 1; const tok = bubbleToken
        setBubble(text)
        ctx.timeout(function () { if (tok === bubbleToken) setBubble(null) }, 6000)
      }
      function save() { try { host.call('save', { state: petData }) } catch (err) {} }
      function setActionTmp(a) { setAction(a); ctx.timeout(function () { setAction('idle') }, 2600) }
      function speakLine(text) {
        try {
          host.call('speak', { text: text }).then(function (r) {
            if (r && r.audio) setAudioSrc('data:audio/mpeg;base64,' + r.audio)
          }).catch(function () {})
        } catch (err) {}
      }
      function autoSpeak(text) {
        if (muted) return
        const now = Date.now()
        if (now - lastAutoSpeakAt < 10000) return
        lastAutoSpeakAt = now
        speakLine(text)
      }

      function gainXp(amount, counterKey) {
        if (!petData || amount <= 0) return
        petData.counters[counterKey] = (petData.counters[counterKey] || 0) + 1
        petData.xp += amount
        while (petData.xp >= petData.xpNext) {
          petData.xp -= petData.xpNext
          petData.level += 1
          petData.xpNext = xpNextFor(petData.level, petData.species)
          const s = stageOf(petData.level)
          if (s > petData.stage) {
            petData.stage = s; petData.branch = branchOf(petData.counters)
            showBubble('进化啦！' + STAGES[s] + ' · ' + petData.branch); setActionTmp('happy'); autoSpeak('进化啦！' + STAGES[s] + '！')
          } else { showBubble('升级啦！Lv.' + petData.level); setActionTmp('happy'); autoSpeak('升级啦！' + petData.level + '级！') }
        }
      }

      function applyEntry(e) {
        if (!petData) return
        lastActivitySeq = e.seq
        if (e.type === 'working') { setBubble('疯狂 Coding 中...'); setActionTmp('working'); autoSpeak('开始干活啦，陪你一起~') }
        else if (e.type === 'done') { setBubble('任务完成了！你真棒~'); setActionTmp('happy'); gainXp(2, 'other'); autoSpeak('任务完成啦，你真棒！') }
        else if (e.type === 'error') { setBubble('又炸了...宠物捂脸'); setActionTmp('error'); petData.mood = clamp(petData.mood - 5, 0, 100); autoSpeak('又炸了，别灰心，再来一次') }
        else if (e.type === 'session') { setBubble('嗨~又见面啦，今天也一起加油吧！'); setActionTmp('happy'); autoSpeak('嗨，又见面啦，一起加油吧') }
        else if (e.type === 'message') { gainXp(3, 'message') }
        else if (e.type === 'tool') { gainXp(xpFor(e.label, petData.species), classify(e.label)) }
      }

      React.useEffect(function () {
        let alive = true
        ;(async function () {
          let initial = null
          try { const r = await host.call('load'); if (r && r.state) initial = r.state } catch (err) {}
          if (!alive) return
          if (initial) { petData = initial; refresh(); showBubble('主人回来啦！宠物想你了~') }
          else { petData = hatch(); refresh(); save(); showBubble('一只新的宠物诞生了！' + SPECIES[petData.species].name + ' · ' + petData.rarity) }
        })()
        const stopPoll = ctx.interval(async function () {
          try {
            const r = await host.call('activity', { after: lastActivitySeq })
            if (r && r.entries && r.entries.length) {
              for (let i = 0; i < r.entries.length; i += 1) applyEntry(r.entries[i])
              refresh(); save()
            }
          } catch (err) {}
        }, 2000)
        return function () { alive = false; stopPoll() }
      }, [])

      React.useEffect(function () {
        return ctx.interval(function () {
          if (!petData) return
          petData.hunger = clamp(petData.hunger - 4, 0, 100)
          petData.mood = clamp(petData.mood - (petData.species === 'pixiebot' ? 1 : 2), 0, 100)
          if (petData.hunger <= 15) { setBubble('好饿呀...投喂我一下吧 🍖'); setActionTmp('eating') }
          else if (petData.mood <= 15) { setBubble('有点低落...摸摸我好不好 🥺'); setActionTmp('idle') }
          refresh(); save()
        }, 60000)
      }, [])

      React.useEffect(function () {
        let lastRest = Date.now()
        return ctx.interval(function () {
          const now = new Date()
          const line = mealLine(now.getHours(), now.getMinutes())
          if (line) { setBubble(line); setActionTmp('happy'); autoSpeak(line) }
          else if (Date.now() - lastRest > 3600000) { lastRest = Date.now(); setBubble('已经忙活好久了，起来活动一下~ 🧘') }
        }, 30000)
      }, [])

      function onPointerDown(e) {
        const rect = e.currentTarget.getBoundingClientRect()
        setDrag({ dx: e.clientX - rect.left, dy: e.clientY - rect.top, sx: e.clientX, sy: e.clientY, moved: false })
        try { e.currentTarget.setPointerCapture(e.pointerId) } catch (err) {}
      }
      function onPointerMove(e) {
        if (!drag) return
        const moved = drag.moved || Math.abs(e.clientX - drag.sx) > 4 || Math.abs(e.clientY - drag.sy) > 4
        setDrag({ dx: drag.dx, dy: drag.dy, sx: drag.sx, sy: drag.sy, moved: moved })
        setPos({ x: e.clientX - drag.dx, y: e.clientY - drag.dy })
      }
      function onPointerUp(e) {
        if (!drag) return
        const wasMoved = drag.moved
        setDrag(null)
        if (!wasMoved) doPat()
      }

      function doFeed() {
        if (!petData) return
        petData.hunger = clamp(petData.hunger + 30, 0, 100)
        setBubble('吃得好饱~ 谢谢主人 🍖'); setActionTmp('eating'); refresh(); save()
      }
      function doPat() {
        if (!petData) return
        petData.mood = clamp(petData.mood + 10, 0, 100)
        petData.intimacy = clamp(petData.intimacy + 2, 0, 999)
        const line = pick(CLICK_LINES)
        setBubble(line); setActionTmp('happy'); refresh(); save(); speakLine(line)
      }
      function doHatch() { petData = hatch(); refresh(); save(); setBubble('新的宠物诞生了！' + SPECIES[petData.species].name + ' · ' + petData.rarity) }
      function doRename(v) { if (!petData) return; petData.name = (v || '').slice(0, 12); refresh(); save() }
      function onFileChange(e) {
        const file = e.target.files && e.target.files[0]
        if (!file) return
        if (file.size > 5 * 1024 * 1024) { setGenError('图片太大（>5MB），请压缩后再传'); e.target.value = ''; return }
        let reader
        try { reader = new FileReader() } catch (err) { setGenError('当前环境不支持读取文件'); return }
        reader.onload = function () { setGenFileDataUrl(reader.result); setGenError(null) }
        reader.onerror = function () { setGenError('读取图片失败') }
        reader.readAsDataURL(file)
        e.target.value = ''
      }
      async function doGenerate() {
        if (genBusy || videoBusy) return
        const text = genText.trim()
        const image = genFileDataUrl
        if (!text && !image) { setGenError('请先输入描述或上传图片'); return }
        const prompt = text || '参考这张图，生成一只可爱的卡通桌宠形象，保留主体特征，白色背景'
        setGenBusy(true); setGenError(null)
        try {
          const r = await host.call('gen-image', { prompt: prompt, image: image })
          if (r && r.url) {
            if (!petData) petData = hatch()
            petData.customImage = r.url
            refresh(); save(); showBubble('新形象生成好啦！')
          } else { setGenError((r && r.error) || '生成失败') }
        } catch (err) { setGenError('生成失败') }
        setGenBusy(false)
      }
      async function doGenVideo() {
        if (genBusy || videoBusy) return
        const text = genText.trim()
        const image = genFileDataUrl
        if (!text && !image) { setGenError('请先上传图片或输入描述'); return }
        setVideoBusy(true); setGenError(null); setBubble('生成动画中，约 2~3 分钟，请稍候…')
        try {
          const r = await host.call('gen-video', { text: text, image: image })
          if (r && r.video) {
            setCustomVideo('data:video/mp4;base64,' + r.video)
            showBubble('动画形象生成好啦！')
          } else { setGenError((r && r.error) || '生成失败') }
        } catch (err) { setGenError('生成失败') }
        setVideoBusy(false)
      }
      function doClearImage() { if (!petData) return; petData.customImage = null; refresh(); save() }
      function doClearVideo() { setCustomVideo(null) }

      if (!pet) return h('div', { className: 'dsh-pet-mini' }, '…')
      if (hidden) return h('div', { className: 'dsh-pet-mini', title: '展开桌宠', onClick: function () { setHidden(false) } }, '🐾')

      const sp = SPECIES[pet.species] || SPECIES.bitcat
      const rar = RARITIES.filter(function (r) { return r.name === pet.rarity })[0] || RARITIES[0]
      const emoji = sp.emoji[pet.stage] || sp.emoji[0]
      function animClass(a) {
        if (a === 'happy') return ' dsh-anim-jump'
        if (a === 'working') return ' dsh-anim-wiggle'
        if (a === 'error') return ' dsh-anim-shake'
        if (a === 'eating') return ' dsh-anim-nod'
        return ''
      }
      const containerStyle = pos ? { left: pos.x, top: pos.y, '--pet-accent': sp.color } : { right: 24, bottom: 24, '--pet-accent': sp.color }

      function bar(label, value, color) {
        return h('div', { className: 'dsh-pet-stat' },
          h('span', { className: 'dsh-pet-stat-label' }, label),
          h('div', { className: 'dsh-pet-stat-track' }, h('div', { className: 'dsh-pet-stat-fill', style: { width: clamp(value, 0, 100) + '%', background: color } })),
          h('span', { className: 'dsh-pet-stat-val' }, String(Math.round(value))),
        )
      }

      let face
      if (customVideo) face = h('div', { className: 'dsh-pet-video' + animClass(action) }, h(TransparentVideo, { src: customVideo, size: 120 }))
      else if (pet.customImage) face = h('img', { className: 'dsh-pet-img' + animClass(action), src: pet.customImage, alt: pet.name, draggable: false })
      else face = h('div', { className: 'dsh-pet-emoji' + animClass(action) }, emoji)

      return h('div', {
        className: 'dsh-pet-root' + (drag ? ' is-dragging' : '') + (audioSrc ? ' is-speaking' : ''),
        style: containerStyle,
        onPointerDown: onPointerDown,
        onPointerMove: onPointerMove,
        onPointerUp: onPointerUp,
        onPointerCancel: onPointerUp,
      },
        audioSrc ? h('audio', { src: audioSrc, autoPlay: true, onEnded: function () { setAudioSrc(null) } }) : null,
        h('div', { className: 'dsh-pet-body' },
          bubble ? h('div', { className: 'dsh-pet-bubble' }, bubble) : null,
          h('div', { className: 'dsh-pet-figure' },
            h('div', { className: 'dsh-pet-aura', style: { background: 'radial-gradient(circle, ' + hexA(sp.color, 0.18) + ' 0%, rgba(255,255,255,0) 70%)' } }),
            face,
            h('div', { className: 'dsh-pet-shadow' }),
          ),
          h('div', { className: 'dsh-pet-lv' }, 'Lv.' + pet.level),
          h('div', { className: 'dsh-pet-name', style: { borderColor: hexA(sp.color, 0.35) } },
            h('span', { style: { color: rar.color } }, rar.stars + ' '),
            pet.name,
          ),
          h('div', { className: 'dsh-pet-controls', onPointerDown: function (e) { e.stopPropagation() } },
            h('button', { className: 'dsh-pet-btn', title: muted ? '取消静音' : '静音语音', onClick: function () { setMuted(!muted) } }, muted ? '🔇' : '🔊'),
            h('button', { className: 'dsh-pet-btn', title: '自定义', onClick: function () { setPanelOpen(!panelOpen) } }, '⚙'),
            h('button', { className: 'dsh-pet-btn', title: '收起', onClick: function () { setHidden(true) } }, '—'),
          ),
          panelOpen ? h('div', { className: 'dsh-pet-panel', onPointerDown: function (e) { e.stopPropagation() } },
            h('div', { className: 'dsh-pet-panel-head' },
              h('div', { className: 'dsh-pet-panel-avatar', style: { background: hexA(sp.color, 0.14) } },
                pet.customImage ? h('img', { src: pet.customImage, style: { width: 28, height: 28, objectFit: 'contain', borderRadius: 8 } }) : emoji,
              ),
              h('div', null,
                h('div', { className: 'dsh-pet-panel-title' }, sp.name + ' ' + sp.en),
                h('div', { className: 'dsh-pet-panel-rarity', style: { color: rar.color, background: hexA(rar.color, 0.1), borderColor: hexA(rar.color, 0.3) } }, rar.stars + ' ' + rar.name),
                h('div', { className: 'dsh-pet-panel-sub' }, 'Lv.' + pet.level + ' · ' + STAGES[pet.stage] + (pet.branch ? ' · ' + pet.branch : '')),
              ),
            ),
            bar('🍖 饱食', pet.hunger, '#FF385C'),
            bar('😊 心情', pet.mood, '#FFB400'),
            bar('💗 亲密度', pet.intimacy / 10, '#FF5A5F'),
            h('div', { className: 'dsh-pet-xprow' },
              h('span', { className: 'dsh-pet-stat-label' }, '经验'),
              h('div', { className: 'dsh-pet-stat-track' }, h('div', { className: 'dsh-pet-stat-fill', style: { width: Math.min(100, pet.xp / pet.xpNext * 100) + '%', background: 'linear-gradient(90deg,' + sp.color + ',#FFB400)' } })),
              h('span', { className: 'dsh-pet-stat-val' }, pet.xp + '/' + pet.xpNext),
            ),
            h('div', { className: 'dsh-pet-field' },
              h('span', null, '名字'),
              h('input', { className: 'dsh-pet-input', value: pet.name, maxLength: 12, onChange: function (e) { doRename(e.target.value) } }),
            ),
            h('div', { className: 'dsh-pet-actions' },
              h('button', { className: 'dsh-pet-act dsh-pet-act-primary', onClick: doFeed }, '🍖 投喂'),
              h('button', { className: 'dsh-pet-act', onClick: doPat }, '🤚 摸摸'),
              h('button', { className: 'dsh-pet-act dsh-pet-act-warn', onClick: doHatch }, '🥚 重孵'),
            ),
            h('div', { className: 'dsh-pet-gen' },
              h('div', { className: 'dsh-pet-gen-title' }, '✨ 生成形象'),
              h('input', { className: 'dsh-pet-gen-input', placeholder: '描述（可选，写实风）', value: genText, onChange: function (e) { setGenText(e.target.value) } }),
              h('label', { className: 'dsh-pet-file' },
                h('input', { type: 'file', accept: 'image/*', style: { display: 'none' }, onChange: onFileChange }),
                genFileDataUrl
                  ? h('img', { src: genFileDataUrl, className: 'dsh-pet-file-preview', alt: '已选图片' })
                  : h('span', null, '📁 上传图片'),
              ),
              h('div', { className: 'dsh-pet-actions' },
                h('button', { className: 'dsh-pet-act', disabled: genBusy || videoBusy, onClick: doGenerate }, genBusy ? '生成中…' : '🖼 图片'),
                h('button', { className: 'dsh-pet-act dsh-pet-act-primary', disabled: genBusy || videoBusy, onClick: doGenVideo }, videoBusy ? '动画生成中…' : '🎬 动画'),
              ),
              genError ? h('div', { className: 'dsh-pet-gen-err' }, genError) : null,
              (pet.customImage || customVideo) ? h('button', { className: 'dsh-pet-gen-clear', onClick: function () { doClearImage(); doClearVideo() } }, '还原像素宠物') : null,
            ),
          ) : null,
        ),
      )
    }

    slots.inject('shell.overlay', function () {
      return slots.register(
        { name: 'shell.overlay', id: 'dsh-minipet', order: 10, label: '桌宠' },
        function () { return h(PetView) },
      )
    })
  },
}
