# NOTICE — 数据来源、推导内容与品牌资产

本仓库是一个**非官方**的第三方 Skill，整理自 Kimi 官方公开品牌手册。它与 Moonshot AI 无隶属关系。

## 一、来自官方的内容（已逐字核对）

来源：<https://www.kimi.com/resources/kimi-brand>（中文）、<https://www.kimi.com/en/resources/kimi-brand>（英文）、<https://www.kimi.ai/policies/logo-usage-terms>

| 内容 | 位置 |
| --- | --- |
| 15 个官方色值（`#002F5B` … `#FFFFFF`） | 品牌手册"色彩系统"章节的色板组件 |
| 三字体名称：Inter、Geist Mono、Sentient | 品牌手册"排版与版式"章节 |
| 双层栅格理念（标准化基础网格 + 多元表现力网格） | 同上 |
| Logo 系统说明、官方素材下载链接 | 品牌手册"标志系统"章节 |
| Logo 使用条款 5 条 | 官方 Logo 使用条款页 |
| 生成式视觉系统、有机数字纹理、壁纸生成器入口 | 品牌手册"品牌视觉资产"章节 |
| 数据可视化原则（极简克制、绝不误导数据） | 品牌手册"数据可视化"章节 |
| 对外定义与三个联系邮箱 | 品牌手册"项目团队与致谢"章节 |
| 品牌影片与影调描述 | 品牌手册"品牌影调"章节 |

## 二、本 Skill 推导的内容（工作版本，非官方规范）

以下为便于工程落地而推导，**不冒充官方规范**：

- 色板各色的**名称与角色分工**（如 `kimi-deep-blue` = "品牌蓝轴的高对比端"）
- **WCAG 2.1 对比度实测值**（作为可读性边界记录，**不作为替换品牌色的理由**）
- **语义 token 命名**（`--kimi-surface`、`--kimi-text-link` 等）与深浅底搭配建议
- **间距 / 圆角 / 字重 / 字号阶梯**的具体数值
- Logo **最小尺寸与净空**的工程兜底值——**未核验**：官方仅以图片形式发布在品牌手册 Logo 章节，本 Skill 未逐张核验这些规范图，**不得当作合规依据**
- 图表系列配色映射、连续与发散色阶，以及**深浅两套图表的具体色值**（官方仅给出"中性灰底 + 电光蓝高亮"的方向，未给出轴标签/焦点色的取值）
- Sentient 不可加载时的字体回退方案
- Sentient 的许可信息来自 [Fontshare 官方许可页](https://www.fontshare.com/licenses/itf-ffl)，不来自 Kimi 品牌手册
- 深色底派生值 `#2F2F2E`（kimi.com 深色界面实际使用的分隔线/描边值，不属于官方 15 色色板）

## 三、品牌资产权利

- **本仓库不附带任何 Logo 或品牌资产文件**（无 SVG / PNG / zip）。这是刻意设计：Logo 是 Moonshot AI 的注册资产，其条款保留随时要求移除的权利，把文件放进公开仓库会让整个仓库都暴露在下架风险下。`scripts/verify-tokens.mjs` 会检查并阻止品牌资产文件被误加入。
- 交付物中的 Logo 一律从[官方素材包](https://kimi-file.kimi.ai/prod-chat-kimi/kfs/4/1/2026-08-12/1d9u74p1l51jas5cp5oq0?response-content-disposition=attachment%3Bfilename%3Dkimi-logo-assets.zip)获取后引用，或直接链接官网资源。
- Kimi 名称、Logo、商标及全部品牌资产为 **Moonshot AI 的专有财产**。
- Logo 资产仅授权**编辑性、媒体及非商业推广**用途；**不得**修改、扭曲、改色、拉伸或加任何效果；**不得**用于暗示官方背书或从属关系。
- 商业使用、品牌许可、跨界合作请联系 `hi@moonshot.ai`；法务 `legal@moonshot.ai`；媒体与传播 `globalpr@moonshot.ai`。
- 需要正式 Logo 资产（PNG / 多色版 / 反白版 / 应用图标）请使用上述官方素材包。**不要**从官网页面抠取路径自行重绘。

## 四、字体授权

- **Inter** 与 **Geist Mono**：SIL Open Font License 1.1，可自由使用，含商用。
- **Sentient**：Indian Type Foundry 设计，经 [Fontshare](https://www.fontshare.com/fonts/sentient) 免费发布，适用 **ITF Free Font License (FFL)**。个人与**商业**使用均免费，允许自托管 webfont 与嵌入；**不可转售字体文件本身**，**不可重新分发到其他字体平台**。许可全文：<https://www.fontshare.com/licenses/itf-ffl>。
  （注：早期版本的本仓库曾把 Sentient 描述为"需单独商业授权"，该描述有误，已更正。）
- **Noto Serif SC / Lora** 等仅作为 Sentient 不可加载时的回退建议出现，自身为开源。

本仓库**不包含任何字体文件**。

## 五、时效性

品牌规范会更新。本 Skill 记录的数据提取自官网页面，其 `frontmatter` 标注的最后修改日期为 **2026-09-02**。发现官网与本仓库不一致时，**以官网为准**，并欢迎提交 issue 指出。
