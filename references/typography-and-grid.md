# 排版与版式 · Typography & Layout

> 三者结合构建起灵活的视觉底层：集 Inter 的高效清晰、Geist Mono 的硬核科技感与 Sentient 的人文思考于一体。

## 字体三元组（官方指定）

| 字体 | 定位 | 承担内容 | 授权 |
| --- | --- | --- | --- |
| **Inter** | 高效清晰 | 正文、UI 文本、表格、导航、按钮、表单 | SIL OFL 1.1，开源可商用 |
| **Geist Mono** | 硬核科技感 | 代码、命令行、终端、指标数值、技术标识 | SIL OFL 1.1，开源可商用 |
| **Sentient** | 人文思考 | 引文、标语、大字标题性表达、观点性文字 | **ITF Free Font License (FFL)：个人与商业均免费** |

### Sentient 的授权（常见误解澄清）

Sentient 由 Indian Type Foundry 设计、通过 [Fontshare](https://www.fontshare.com/fonts/sentient) 免费发布，适用 **ITF FFL** 而非付费商业授权：

- ✅ 个人与**商业**使用均可，无需购买授权
- ✅ 允许自托管 webfont（@font-face）、嵌入应用、印刷、影视等任意媒介与规模
- ❌ **不可转售字体文件本身**
- ❌ **不可把字体文件重新分发到其他字体平台**
- 使用时应随字体文件保留许可文件

许可全文：<https://www.fontshare.com/licenses/itf-ffl> ｜ 下载：<https://www.fontshare.com/fonts/sentient>

因此**不需要**替换 Sentient。若因离线环境或体积原因无法加载，再用下列开源回退：

- 需要"人文/文学温度" → `Noto Serif SC`（中文衬线，开源）或 `Lora`（拉丁衬线，开源）
- 只需"非等宽的柔和感" → 直接用 Inter 调大字号与字重承担

> 观察记录：kimi.com 营销站实际加载了 `Lora`、`Noto Serif SC` 与 `Google Sans Code`。这属于站点实现细节，**品牌规范以官方三元组为准**。

## 中文落地要点

官方三元组面向拉丁字母设计，中文产物需显式指定中文字族，否则会回落到系统默认字体，破坏版式一致性：

```css
:root {
  --kimi-font-sans: Inter, "PingFang SC", "Microsoft YaHei", "Noto Sans SC", system-ui, sans-serif;
  --kimi-font-mono: "Geist Mono", "SF Mono", "Cascadia Code", Consolas, monospace;
  --kimi-font-serif: Sentient, "Noto Serif SC", "Source Han Serif SC", Lora, Georgia, serif;
}
```

## 字体加载

```html
<!-- Inter：Google Fonts 可直接取 -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

Inter 与 Geist Mono 可自托管（`woff2`），生产环境优先自托管以避免第三方请求阻塞。中文衬线（Noto Serif SC）体积大，建议按需子集化或仅在引文区按需加载。

## 双层栅格系统

> Kimi 网格系统建立在"标准化基础网格"与"多元表现力网格"的统一架构之上。

### 1. 标准化基础网格（默认层）

以精准的算术逻辑规范空间与间距，确保全端一致。

- 间距步进：**4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 / 128**（8 为基数，4 用于紧凑微调）
- 圆角：小控件 `8px`，卡片 `12–20px`，容器 `20px`
- 边框：结构线统一 `0.5–1px`，颜色 `#C3C3C3`（浅底）或 `#2F2F2E`（深底）
- 文字行高：正文 `1.6`，标题 `1.2–1.3`，表格 `1.4–1.5`
- 字重档位：`400`（正文）/ `500`（强调）/ `600`（小标题）/ `700`（大标题），避免出现 500–600 之间的任意值

### 2. 多元表现力网格（例外层）

突破单一布局限制，为**文字较少、侧重视觉展示**的场景提供更具弹性的排版空间。

适用：大图海报、壁纸、品牌影片帧、封面、Hero 视觉。
不适用：表格、密集正文、表单、后台界面——这些一律回到基础网格。

### 落地判据

1. 这块区域文字多还是视觉主导？→ 文字多走基础网格，视觉主导才启用表现力网格。
2. 间距是否落在 4 的倍数上？不在则修正。
3. 跨端（移动 / 桌面 / 打印）间距比例是否保持同一套逻辑？基础网格必须跨端一致。

## 版式层级建议

以基础网格为骨架的字号阶梯（可按需缩放，比例关系比绝对值重要）：

| 层级 | 相对字号 | 字重 | 字体 | 建议行高 |
| --- | --- | --- | --- | --- |
| Display | 3.2–4× | 700 | Inter / Sentient | 1.1 |
| H1 | 2.2× | 700 | Inter | 1.2 |
| H2 | 1.6× | 600 | Inter | 1.3 |
| H3 | 1.25× | 600 | Inter | 1.4 |
| Body | 1× | 400 | Inter | 1.6 |
| Caption | 0.82× | 400 | Inter | 1.5 |
| Mono / Metric | 0.95× | 500 | Geist Mono | 1.4 |

字间距（letter-spacing）：大字标题 `-0.02em` 收紧，中文正文保持 `0`，小号全大写标签 `+0.06em` 拉开。
