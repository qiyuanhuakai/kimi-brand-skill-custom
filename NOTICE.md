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

- 色板各色的**名称与角色分工**（如 `kimi-deep-blue` = "白底正文级链接"）
- **WCAG 2.1 对比度实测值**及由此得出的用色硬规则
- **语义 token 命名**（`--kimi-surface`、`--kimi-text-link` 等）与深浅底搭配建议
- **间距 / 圆角 / 字重 / 字号阶梯**的具体数值
- Logo **最小尺寸与留白**的工程兜底值（官方以图片形式发布，未给出可复制数值）
- 图表系列配色映射、连续与发散色阶
- Sentient 缺失时的字体替换方案
- 深色底派生值 `#2F2F2E`（kimi.com 深色界面实际使用的分隔线/描边值，不属于官方 15 色色板）

## 三、品牌资产权利

- `assets/kimi-wordmark.svg` 是从 kimi.com 页面内联字标**原样复制**的 96×32 "KIMI" 字标，路径数据未作任何修改（已用脚本与官方源码逐字符比对验证）。
- Kimi 名称、Logo、商标及全部品牌资产为 **Moonshot AI 的专有财产**。
- Logo 资产仅授权**编辑性、媒体及非商业推广**用途；**不得**修改、扭曲、改色、拉伸或加任何效果；**不得**用于暗示官方背书或从属关系。
- 商业使用、品牌许可、跨界合作请联系 `hi@moonshot.ai`；法务 `legal@moonshot.ai`；媒体与传播 `globalpr@moonshot.ai`。
- Moonshot AI 保留随时撤销许可或要求移除资产的权利。本仓库中的字标可被要求下架。
- 需要正式 Logo 资产（PNG / 多色版 / 反白版 / 应用图标）请使用[官方素材包](https://kimi-file.kimi.ai/prod-chat-kimi/kfs/4/1/2026-08-12/1d9u74p1l51jas5cp5oq0?response-content-disposition=attachment%3Bfilename%3Dkimi-logo-assets.zip)。

## 四、字体授权

- **Inter** 与 **Geist Mono**：开源字体（SIL OFL 1.1），可自由使用。
- **Sentient**：商业字体，**需单独授权**。本仓库不含该字体文件，Skill 中给出了开源替代方案。使用者须自行确认授权状态。
- **Noto Serif SC / Lora** 等替代字体：开源，仅作为 Sentient 的回退建议出现。

## 五、时效性

品牌规范会更新。本 Skill 记录的数据提取自官网页面，其 `frontmatter` 标注的最后修改日期为 **2026-09-02**。发现官网与本仓库不一致时，**以官网为准**，并欢迎提交 issue 指出。
