# Kimi Brand Skill

把 [Kimi 品牌手册](https://www.kimi.com/resources/kimi-brand) 变成一个可执行的 Skill：让 AI 在做 Kimi / Moonshot AI 相关的**视觉设计**与**对外文案**时，产出符合官方规范的东西，而不是凭印象配色。

仓库即 Skill 根目录，仓库名、`SKILL.md` 的 `name` 与安装后的目录名三者一致（`kimi-brand-skill-custom`），克隆后可直接放入 skills 目录使用。

## 为什么

官方品牌手册是一份以图片和视频为主的页面：色值能复制，但**"哪个颜色用在哪、白字按钮用什么蓝、图表怎么配色"** 这些真正决定产出的东西散落在图里。这个 Skill 把可执行的部分抽出来，并补上工程落地所需的东西——可访问性实测、语义 token、一键注入脚本。

## 包含什么

```
SKILL.md                              入口：核心原则、硬性红线、交付自检清单
references/
  brand-foundation.md                 设计原点、Visual Infra 五层、De-coding 质感
  color-system.md                     官方 15 色 + 角色分工 + WCAG 实测对比度
  typography-and-grid.md              Inter / Geist Mono / Sentient + 双层栅格
  logo-and-licensing.md               Logo 规范 + 官方资产链接 + 5 条使用条款
  data-visualization.md               图表配色映射、标注规范、反模式
  brand-visual-assets.md              UI 升级、生成式视觉、壁纸与纹理
  messaging-and-tone.md               官方对外定义、语气准则、联系邮箱
assets/
  kimi-brand-tokens.json              机器可读 token（单一事实源）
  kimi-brand-theme.css                CSS 变量（仅变量，不含组件）
  kimi-components.css                 可选组件样式，需在 theme 之后引入
scripts/
  init-brand.mjs                      把 token 注入现有项目
  verify-tokens.mjs                   自检：色板、对比度、CSS 解析、参数行为、品牌资产合规
```

## 快速开始

```bash
# 注入 CSS 变量与组件到你的项目
node scripts/init-brand.mjs ./my-site --format css

# 生成 Tailwind 配置
node scripts/init-brand.mjs ./my-app --format tailwind

# 全部生成（css + tailwind + json），默认不覆盖已有文件
node scripts/init-brand.mjs ./my-project --format all

# 自检（58 项检查）
node scripts/verify-tokens.mjs
```

`--force` 覆盖已有文件。参数经严格解析：未知参数、缺值、多个目标目录都会报错退出，不会静默把参数值当成目录名。

## 核心内容速览

**官方 15 色**

| 轴 | 色值 |
| --- | --- |
| 品牌蓝 | `#002F5B` `#007CFF` `#00A1FF` `#A0DAF7` `#00F6FF` |
| 表现力点缀 | `#DFC8F5` `#FFD1D4` `#B3F4A8` `#F4F9A7` |
| 中性灰阶 | `#8D9390` `#121212` `#707070` `#C3C3C3` `#E1E3E6` `#FFFFFF` |

**品牌色不替换，但搭配要合规。** WCAG 门槛是普通文字 4.5:1、大字 3:1，而大字指 **24px，或 18.66px / 字重 700**。`#007CFF` 与白底互为 3.94:1——**只达大字门槛，不满足普通字号**。所以约束落在搭配上：

| 场景 | 做法 |
| --- | --- |
| 品牌蓝实底 + 文字 | 用 `#121212` 深色文字（4.75:1，**任何字号合规**）——默认方案 |
| 品牌蓝实底 + 白字 | 仅当 ≥24px，或 ≥18.66px/700 |
| 浅底次级文字 | `#707070`（4.95:1） |
| 深底次级文字 / 轴标签 | `#C3C3C3`（10.63:1）；**不要**用 `#707070`（仅 3.78:1） |
| 浅底图表焦点 | `#002F5B`；**不要**用青色（白底仅 1.34:1） |
| 深底图表焦点 | `#00F6FF`（深底 13.94:1） |
| `#C3C3C3` 承载文字 | 浅底禁止（1.76:1），**深底正是正确用法** |

浅底与深底图表是两套配色，画布、网格、轴标签、焦点色必须成套切换。

**字体三元组**：Inter（正文/UI，SIL OFL）· Geist Mono（代码/指标，SIL OFL）· Sentient（引文，**ITF FFL，个人与商业均免费**，可自托管但不可转售字体文件）。

## Logo：不附带文件，只给链接

本仓库**不含任何 Logo 文件**。Logo 是 Moonshot AI 的注册资产，条款保留其随时要求移除的权利；放进公开仓库会让整个仓库都暴露在下架风险下。交付物中的 Logo 一律从[官方素材包](https://kimi-file.kimi.ai/prod-chat-kimi/kfs/4/1/2026-08-12/1d9u74p1l51jas5cp5oq0?response-content-disposition=attachment%3Bfilename%3Dkimi-logo-assets.zip)获取后引用。

使用官方 Logo 即接受 [Logo 使用条款](https://www.kimi.ai/policies/logo-usage-terms)：

- 不得修改、扭曲、改色、拉伸或加任何效果
- 仅授权编辑性、媒体及**非商业**推广用途
- 不得暗示官方背书、赞助或从属关系
- 商业使用需先联系 `hi@moonshot.ai` 取得书面许可

## 数据来源与准确性

**来自官方**（逐字核对 <https://www.kimi.com/resources/kimi-brand> 及 Logo 条款）：15 个色值、三字体名称、栅格理念、生成式视觉与影调描述、对外定义、联系方式、官方资产链接。

**本 Skill 推导**（可用的工作版本，非官方逐字规范）：色名与角色分工、语义 token 命名、间距与圆角阶梯、WCAG 对比度实测值、深浅底搭配建议、Logo 最小尺寸与留白的工程兜底值。

官方更新时以官网为准。详细说明见 `NOTICE.md`。

## 安装为 Skill

```bash
git clone https://github.com/qiyuanhuakai/kimi-brand-skill-custom.git ~/.minimax/skills/kimi-brand-skill-custom
```

Skill 通过 `SKILL.md` 的 `description` 自动触发：当任务涉及 Kimi 品牌配色、Logo、字体、品牌化设计产物或对外文案口径时加载。

## License

Skill 代码与文档以 MIT 发布，见 [LICENSE](LICENSE)。Kimi 商标、Logo 与品牌资产归 Moonshot AI 所有，其使用受官方条款约束，本仓库不授予任何品牌资产权利。
