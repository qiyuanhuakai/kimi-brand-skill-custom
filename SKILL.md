---
name: kimi-brand-skill-custom
description: Kimi 品牌视觉与文案规范。当需要为 Kimi / Moonshot AI 产出任何品牌化产物时使用——网站与落地页、UI 设计、PPT / 文档 / 表格模板、图表与数据可视化、壁纸与生成式视觉物料、海报与社交媒体配图、品牌色与字体选型、Logo 使用、以及对外新闻稿、博文、联合公告的口径与语气。提供官方品牌蓝与完整色板、Inter / Geist Mono / Sentient 字体三元组、Logo 资产官方下载与使用条款、机器可读 design token（JSON / CSS）以及一键注入脚本。关键词：Kimi 品牌、品牌手册、brand guideline、brand kit、品牌色、Kimi 配色、Kimi logo、Kimi 字体、Moonshot AI 品牌、文案口径。
---

# Kimi 品牌规范

Kimi（Moonshot AI 旗下 AI 助手）的品牌执行手册。目标是在任何媒介上产出**一致、清晰、专业**的 Kimi 品牌表达：科技的严谨精密 × 人文的微妙温度。

## 何时使用

命中以下任一情况即加载本 Skill：Kimi / Moonshot AI 相关的**视觉设计**（网页、UI、PPT、文档、图表、壁纸、海报、社交素材）、**品牌规范问答**（品牌色、字体、Logo 规则）、**对外文案**（新闻稿、公告、博文、产品介绍、发布说明）。

## 核心原则（先读这三条）

1. **先读 `assets/kimi-brand-tokens.json`**。所有色值、字体、栅格都是机器可读的单一事实源，不要凭记忆写色值。
2. **品牌蓝为轴**。视觉层级由 `#007CFF` 承担，功能逻辑与情感张力靠"蓝 + 中性灰 + 克制点缀色"分工，不是靠堆色。
3. **品牌色不替换**。官方色值按发布值直接使用，不因对比度数值改色。约束落在**搭配与字号**上：蓝底配深色文字（4.75:1，任何字号合规）；白字仅限 ≥24px 或 ≥18.66px/700。
4. **克制的表现力**。基础栅格保证跨端一致，表现力栅格只在文字少、视觉主导的场景放宽。极简优先于装饰。

## 快速取用

| 需求 | 做法 |
| --- | --- |
| 品牌色 / 配色调色 | `references/color-system.md` → 15 个官方色值 + 角色分工 + 对比度实测 |
| 字体 / 排版 / 栅格 | `references/typography-and-grid.md` → Inter + Geist Mono + Sentient 三元组与网格法则 |
| Logo 放置、变形、下载 | `references/logo-and-licensing.md` → **含 5 条禁止条款，先读再动手**；本 Skill 不附带 Logo 文件，只给官方链接 |
| 网页 / UI / 组件配色 | `assets/kimi-brand-theme.css` → CSS 变量；组件样式在 `assets/kimi-components.css`（需显式引入） |
| 图表 / 数据看板 | `references/data-visualization.md` → 中性灰底 + 电光蓝高亮，绝不误导数据 |
| 壁纸 / 生成式视觉 | `references/brand-visual-assets.md` → 官方壁纸生成器 + 有机数字纹理规范 |
| 新闻稿 / 对外口径 / 语气 | `references/messaging-and-tone.md` → 官方定义、语气准则、联系邮箱 |
| 一键注入到现有项目 | `node scripts/init-brand.mjs <dir> --format css\|tailwind\|json` |

## 工作流程

1. **确认产物类型**——静态页、动态应用、文档/PPT、图表、还是文案。不同类型规范侧重不同。
2. **读取 token**——从 `assets/kimi-brand-tokens.json` 取值，不硬编码。
3. **套用对应 reference**——按上表定位，读完该 reference 再产出。
4. **自检**——对照下方检查清单。

## 硬性红线

- ❌ **不得修改 Logo**：不得变形、拉伸、改色、加描边、加阴影、加效果。只能整体缩放。**本 Skill 不附带 Logo 文件，一律引用官方来源**。
- ❌ **不得暗示背书**：未获 Moonshot AI 书面许可，不得让 Logo 看起来代表官方合作、赞助或从属关系。
- ❌ **不得商用**：Logo 资产仅授权编辑性、媒体及非商业推广用途。商业使用需先联系 `hi@moonshot.ai`。
- ❌ **不得改品牌色**：官方色值按发布值使用，不因对比度替换成近似色。
- ❌ **浅底不得用 `#C3C3C3` 承载文字**（白底 1.76:1）。它在深底是 10.63:1，是深色主题的正确次级文字色——按底色判断，不要一刀切禁用。
- ❌ **不得误导数据**：任何图表必须准确传达数据，绝不歪曲或截断误导。浅底与深底图表须成套切换配色（轴标签、焦点色都不能沿用另一套）。
- ⚠️ 商业合作、品牌许可、联合公告一律转 `hi@moonshot.ai`；法务转 `legal@moonshot.ai`；媒体转 `globalpr@moonshot.ai`。

## 交付自检清单

- [ ] 色值全部来自 token 文件，无凭记忆的十六进制值
- [ ] 未因对比度改动任何官方品牌色
- [ ] Logo 未被改形/改色/加效果，来源为官方资产并在交付说明中标注
- [ ] 品牌蓝承担主视觉层级，灰阶承担结构，点缀色克制
- [ ] 三字体分工正确：Inter 正文、Geist Mono 代码与数据、Sentient 引文与标题性表达
- [ ] 图表未误导数据，浅底/深底配色成套切换
- [ ] 浅底未用 `#C3C3C3` 承载文字；深底未用 `#707070` 承载文字
- [ ] 蓝底小字未用白色（已改深色文字或放大字号）
- [ ] 对外文案使用了官方 Kimi 定义，未杜撰能力与数据
- [ ] 品牌资产来源已在交付说明中标注（官方下载链接或壁纸生成器）

## 资产来源

本 Skill 中的色值、字体名、Logo 下载地址与使用条款均摘自 Kimi 官方品牌手册（<https://www.kimi.com/resources/kimi-brand>，英文 <https://www.kimi.com/en/resources/kimi-brand>）与官方 Logo 使用条款（<https://www.kimi.ai/policies/logo-usage-terms>）。**色板角色的命名与分工建议、以及栅格与配色的可执行细则，是由本 Skill 基于官方色值推导的工作版本**，用于快速落地，不代表官方逐字规范。发现官方更新时以官网为准。
