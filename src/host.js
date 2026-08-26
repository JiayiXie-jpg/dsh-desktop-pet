// DSH 桌宠陪伴 · Host 半（动态插件 closure 体）
//
// 依赖：inject ['timer']；ctx.get('shell') 用于出网调用 curl / node。
// 凭据（环境变量，勿硬编码）：
//   DSH_PET_ARK_KEY  → 火山引擎 Ark API Key（Seedream 生图 / Seedance 动画）
//   DSH_PET_TTS_KEY  → 火山引擎语音合成 X-Api-Key（seed-tts-2.0）
return {
  inject: ['timer'],
  apply(ctx) {
    const ARK_KEY = process.env.DSH_PET_ARK_KEY || ''
    const TTS_KEY = process.env.DSH_PET_TTS_KEY || ''
    let state = null
    let seq = 0
    const entries = []

    function push(type, label) {
      seq += 1
      entries.push({ seq: seq, type: type, label: label || '', t: Date.now() })
      if (entries.length > 200) entries.splice(0, entries.length - 200)
    }

    ctx.on('agent/status', function (payload) {
      const status = payload && payload.status
      if (status === 'running') push('working', 'coding')
      else if (status === 'idle') push('done', 'done')
    })
    ctx.on('agent/error', function () { push('error', 'error') })
    ctx.on('agent/session-start', function () { push('session', 'session') })
    ctx.on('agent/inbox/inserted', function () { push('message', 'message') })
    ctx.on('tools/result', function (exec) {
      let name = 'tool'
      try { name = (exec && exec.name) || 'tool' } catch (err) {}
      push('tool', name)
    })

    harness.handle('load', async function () { return { state: state, seq: seq } })
    harness.handle('save', async function (args) {
      if (args && typeof args.state === 'object' && args.state !== null) state = args.state
      return { ok: true }
    })
    harness.handle('activity', async function (args) {
      const after = args && typeof args.after === 'number' ? args.after : 0
      const fresh = []
      for (let i = 0; i < entries.length; i += 1) { if (entries[i].seq > after) fresh.push(entries[i]) }
      return { entries: fresh, seq: seq }
    })

    async function runCmd(shell, command, stdin, timeoutMs, env) {
      let spec
      try { spec = shell.resolve({ command: command, stdin: stdin || undefined, timeoutMs: timeoutMs, stdoutMaxBytes: 9000000, env: env || undefined }) } catch (e) { return { error: 'resolve failed' } }
      try { return await shell.run(spec) } catch (e) { return { error: 'run failed' } }
    }
    function outText(res) { return res && res.stdout && typeof res.stdout.text === 'string' ? res.stdout.text : '' }
    function tryJson(s) { try { return JSON.parse(s) } catch (e) { return null } }

    function buildPrompt(text) {
      const t = (text || '').toLowerCase()
      function has(arr) { for (let i = 0; i < arr.length; i += 1) if (t.indexOf(arr[i]) >= 0) return true; return false }
      let base
      if (has(['fish', 'fins', 'piranha', 'whale', '鱼'])) base = 'Cute version of animal, the animal is swimming perfectly still on a flat solid pure green background (#00FF00), evenly lit, no shadows, no vignette, bright and translucent, photorealistic, 8K HDR detail'
      else if (has(['dog', 'bichon', 'retriever', 'schnauzer', '狗', '犬', '柯基'])) base = 'Cute version of animal, the animal is sitting perfectly still on a flat solid pure green background (#00FF00), evenly lit, no shadows, no vignette, happy expression, photorealistic, 8K HDR detail'
      else if (has(['cat', '猫'])) base = 'Cute version of animal, the animal is sitting on a flat solid pure green background (#00FF00), evenly lit, no shadows, no vignette, big expressive eyes, joyful happy expression, photorealistic, 8K HDR detail'
      else if (has(['bird', '鸟'])) base = 'Cute version of animal, the animal is standing on a flat solid pure green background (#00FF00), evenly lit, no shadows, no vignette, looking at camera with big eyes, full body, photorealistic'
      else base = 'Cute version of animal, the animal is standing perfectly still on a flat solid pure green background (#00FF00), evenly lit, no shadows, no vignette, looking at camera, full body, photorealistic, 8K HDR detail'
      return base + ', gentle breathing, subtle blink, slow idle motion' + (text ? '. 描述：' + text : '')
    }

    async function seedreamImage(shell, prompt, image) {
      const body = { model: 'doubao-seedream-4-0-250828', prompt: prompt, size: '1024x1024', response_format: 'url', watermark: false }
      if (image) body.image = image
      const res = await runCmd(shell, "curl -sS --max-time 90 https://ark.cn-beijing.volces.com/api/v3/images/generations -H 'Content-Type: application/json' -H 'Authorization: Bearer " + ARK_KEY + "' --data-binary @-", JSON.stringify(body), 90000)
      if (res.error) return res
      const t = outText(res)
      const parsed = tryJson(t)
      if (parsed && parsed.error) return { error: parsed.error.message || JSON.stringify(parsed.error) }
      const url = parsed && parsed.data && parsed.data[0] && parsed.data[0].url
      return url ? { url: url } : { error: '未返回图片 URL: ' + t.slice(0, 200) }
    }

    async function seedanceVideo(shell, prompt, imageUrl) {
      const content = [{ type: 'text', text: prompt }]
      if (imageUrl) content.push({ type: 'image_url', image_url: { url: imageUrl } })
      const res = await runCmd(shell, "curl -sS --max-time 30 https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks -H 'Content-Type: application/json' -H 'Authorization: Bearer " + ARK_KEY + "' --data-binary @-", JSON.stringify({ model: 'doubao-seedance-1-0-pro-250528', content: content }), 30000)
      if (res.error) return res
      const t = outText(res)
      const parsed = tryJson(t)
      if (!parsed || !parsed.id) return { error: 'Seedance 创建失败: ' + t.slice(0, 200) }
      const taskId = parsed.id
      for (let i = 0; i < 30; i += 1) {
        await ctx.timeout(10000)
        const pr = await runCmd(shell, "curl -sS --max-time 20 https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks/" + taskId + " -H 'Authorization: Bearer " + ARK_KEY + "'", '', 20000)
        const st = tryJson(outText(pr))
        if (st && st.status === 'succeeded') {
          const v = st.content && st.content.video_url
          return v ? { url: v } : { error: '无视频 URL' }
        }
        if (st && (st.status === 'failed' || st.status === 'cancelled')) return { error: 'Seedance ' + st.status }
      }
      return { error: 'Seedance 超时（>5分钟）' }
    }

    harness.handle('gen-image', async function (args) {
      const prompt = args && typeof args.prompt === 'string' ? args.prompt.trim().slice(0, 500) : ''
      if (!prompt) return { error: '请输入形象描述' }
      const image = args && typeof args.image === 'string' ? args.image.trim().slice(0, 9000000) : ''
      const shell = ctx.get('shell')
      if (!shell) return { error: 'shell 服务不可用' }
      return await seedreamImage(shell, prompt, image)
    })

    harness.handle('gen-video', async function (args) {
      const text = args && typeof args.text === 'string' ? args.text.trim().slice(0, 500) : ''
      const image = args && typeof args.image === 'string' ? args.image.trim().slice(0, 9000000) : ''
      if (!image && !text) return { error: '请先上传图片或输入描述' }
      const shell = ctx.get('shell')
      if (!shell) return { error: 'shell 服务不可用' }
      const img = await seedreamImage(shell, buildPrompt(text), image)
      if (img.error) return { error: '生图失败: ' + img.error }
      const vid = await seedanceVideo(shell, 'walking in place, wagging tail, turning head side to side, bouncing body, lively and energetic, keep the flat solid pure green background, evenly lit, no shadows, photorealistic, high detail', img.url)
      if (vid.error) return { error: '生成动画失败: ' + vid.error }
      const dl = await runCmd(shell, "curl -sSL --max-time 120 \"$PET_URL\" -o /tmp/dshpet_raw.mp4 && ffmpeg -y -v error -i /tmp/dshpet_raw.mp4 -vf \"scale='min(480,iw)':-2\" -c:v libx264 -preset veryfast -crf 26 -pix_fmt yuv420p -an /tmp/dshpet_small.mp4 && cat /tmp/dshpet_small.mp4 | base64 | tr -d '\\n'", '', 180000, { PET_URL: vid.url })
      if (dl.error) return { error: '处理失败' }
      const b64 = outText(dl).trim()
      if (!b64) return { error: '无视频数据' }
      return { video: b64, format: 'mp4' }
    })

    const TTS_SCRIPT = `import { randomUUID } from 'node:crypto'
const KEY = process.env.PET_KEY || ''
const TEXT = process.env.PET_TEXT || ''
const SPEAKER = process.env.PET_SPEAKER || 'zh_female_vv_uranus_bigtts'
if (!TEXT) process.exit(1)
function frame(eventId, sessionId, payloadJson) {
  const parts = [Buffer.from([0x11, 0x14, 0x10, 0x00])]
  const ev = Buffer.alloc(4); ev.writeUInt32BE(eventId, 0); parts.push(ev)
  if (sessionId != null) { const sid = Buffer.from(sessionId, 'utf8'); const sl = Buffer.alloc(4); sl.writeUInt32BE(sid.length, 0); parts.push(sl, sid) }
  const payload = Buffer.from(payloadJson, 'utf8'); const pl = Buffer.alloc(4); pl.writeUInt32BE(payload.length, 0); parts.push(pl, payload)
  return Buffer.concat(parts)
}
function parse(buf) {
  if (buf.length < 4) return null
  const msgType = buf[1] >> 4, flags = buf[1] & 0x0f; let off = 4, event = null
  if (flags & 0x04) { if (buf.length < off + 4) return null; event = buf.readUInt32BE(off); off += 4 }
  if (buf.length < off + 4) return null; const idLen = buf.readUInt32BE(off); off += 4
  if (buf.length < off + idLen) return null; off += idLen
  if (buf.length < off + 4) return null; const pl = buf.readUInt32BE(off); off += 4
  if (buf.length < off + pl) return null
  return { type: msgType, event, payload: buf.slice(off, off + pl), consumed: off + pl }
}
async function main() {
  const ws = new WebSocket('wss://openspeech.bytedance.com/api/v3/tts/bidirection', { headers: { 'X-Api-Key': KEY, 'X-Api-Resource-Id': 'seed-tts-2.0', 'X-Api-Connect-Id': randomUUID() } })
  const sessionId = randomUUID()
  let buf = Buffer.alloc(0); const audio = []
  ws.binaryType = 'arraybuffer'
  const total = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('tts timeout')), 20000)
    ws.addEventListener('open', () => ws.send(frame(1, null, '{}')))
    ws.addEventListener('error', () => reject(new Error('ws error')))
    ws.addEventListener('close', () => reject(new Error('ws closed early')))
    ws.addEventListener('message', (ev) => {
      buf = Buffer.concat([buf, Buffer.from(ev.data)])
      let m
      while ((m = parse(buf)) !== null) {
        buf = buf.slice(m.consumed)
        if (m.event === 50) { ws.send(frame(100, sessionId, JSON.stringify({ req_params: { speaker: SPEAKER, audio_params: { format: 'mp3', sample_rate: 24000 } } }))) }
        else if (m.event === 150) { ws.send(frame(200, sessionId, JSON.stringify({ req_params: { speaker: SPEAKER, audio_params: { format: 'mp3', sample_rate: 24000 }, text: TEXT } }))); ws.send(frame(102, sessionId, '{}')) }
        else if (m.type === 11) { audio.push(m.payload) }
        else if (m.event === 152) { ws.send(frame(2, null, '{}')) }
        else if (m.event === 52) { clearTimeout(timer); ws.close(); resolve(Buffer.concat(audio)) }
        else if (m.type === 15) { reject(new Error('server error frame')) }
      }
    })
  })
  if (total.length === 0) throw new Error('no audio')
  process.stdout.write(total.toString('base64'))
}
main().then(() => process.exit(0)).catch((e) => { console.error('TTSErr:' + e.message); process.exit(1) })`

    harness.handle('speak', async function (args) {
      const text = args && typeof args.text === 'string' ? args.text.trim().slice(0, 200) : ''
      if (!text) return { error: 'empty text' }
      const speaker = args && typeof args.speaker === 'string' && args.speaker ? args.speaker : 'zh_female_vv_uranus_bigtts'
      const shell = ctx.get('shell')
      if (!shell) return { error: 'shell unavailable' }
      const command = "node --input-type=module <<'PETEOF'\n" + TTS_SCRIPT + "\nPETEOF"
      let spec
      try {
        spec = shell.resolve({ command: command, env: { PET_KEY: TTS_KEY, PET_TEXT: text, PET_SPEAKER: speaker }, timeoutMs: 30000, stdoutMaxBytes: 400000 })
      } catch (err) { return { error: 'resolve failed' } }
      let res
      try { res = await shell.run(spec) } catch (err) { return { error: 'run failed' } }
      const b64 = res && res.stdout && typeof res.stdout.text === 'string' ? res.stdout.text.trim() : ''
      if (!b64) {
        const errText = res && res.stderr && res.stderr.text ? res.stderr.text : ''
        return { error: errText.slice(0, 300) || 'no audio' }
      }
      return { audio: b64, format: 'mp3' }
    })
  },
}
