# DSH 桌宠陪伴 · Desktop Pet Companion

> 把写代码的每一天，变成有宠物陪伴的日常。🐾

一只住在 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 网页里的养成系桌宠：随你的编码活动升级进化、语音打气，还能用 AI 生成专属的透明动画形象。

## ✨ 功能

- 🐾 **悬浮陪伴** — 常驻 DSH 界面、可拖拽可收起，不打扰工作流
- 📈 **养成系统** — 6 种族 × 5 档稀有度 × 唯一 DNA，XP / 心情 / 饱食 / 亲密度，三阶段进化（进化方向随编码习惯）
- 🔗 **编码联动** — 实时感知任务开始 / 完成 / 报错 / 新会话，涨经验、换动画、冒气泡
- 🔊 **语音打气** — seed-tts 音色自动播报，点它也有回应
- ✨ **AI 生成形象** — 上传照片 → Seedream 写实生成 → Seedance 动画 → 透明抠像，得到会动的专属桌宠
- 🎮 **互动** — 投喂 / 摸摸 / 重孵 / 改名

## 📦 安装

```bash
pnpm add dsh-desktop-companion
```

然后在 profile 的 `cordis.patch.yml` 里加一行：

```yaml
- insert:
    - id: dsh-desktop-pet
      name: dsh-desktop-companion
```

重启 `dsh web`，桌宠就出现在右下角。

## 🔑 配置

AI 生图 / 动画与语音播报依赖火山引擎凭据（可选——不配置时仍可用像素宠物、养成与气泡互动）：

```bash
export DSH_PET_ARK_KEY=你的_Ark_API_Key     # Seedream 生图 / Seedance 动画
export DSH_PET_TTS_KEY=你的_语音_API_Key   # seed-tts-2.0 语音合成
```

## 🛠 技术栈

- **生成**：火山引擎 Seedream（写实形象）+ Seedance（首帧动画）
- **语音**：火山引擎 seed-tts-2.0（双向流式 WebSocket 合成）
- **透明**：绿幕 + 浏览器 canvas 色键（软边 + despill 去溢色）
- **事件**：DSH 原生 Cordis 事件（`agent/status`、`tools/result`、`agent/error` 等）

## 目录结构

```
lib/index.js          # Host 半：事件监听 + connection RPC + AI 生成 + TTS
client/index.js       # Client 半源码：悬浮桌宠 UI + 色键抠像
client/client.js      # esbuild 构建产物
cordis.patch.yml      # 组合补丁（注册插件行）
src/host.js           # 动态插件参考实现（历史版本）
src/client.js         # 动态插件参考实现（历史版本）
```

## License

MIT
