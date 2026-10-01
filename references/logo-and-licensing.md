# Logo 系统与使用条款 · Logo & Licensing

> Kimi 品牌的视觉基石——象征着理性的秩序与创造的张力。

## ⚠️ 先读条款，再动手

使用官方 Logo 即表示同意以下条款（官方原文要点，来源 <https://www.kimi.ai/policies/logo-usage-terms>）：

1. **Ownership（归属）**：所有 Logo、商标与品牌资产均为 **Moonshot AI 的专有财产**。
2. **Permitted Use（许可用途）**：仅授权用于**编辑性、媒体及非商业推广**用途。
3. **No Alterations（禁止改动）**：**不得**以任何方式修改、扭曲、改色、拉伸或改动 Logo。
4. **No Endorsement（禁止暗示背书）**：未经事先书面许可，Logo **不得**用于暗示官方背书、赞助或从属关系。
5. **Rights Reserved（权利保留）**：Moonshot AI 保留**随时撤销许可或要求移除资产**的权利。

### 直接后果

- 做**商业项目**、付费广告、商品化包装、付费课程封面 → 需先联系 `hi@moonshot.ai` 取得书面许可，**不要直接用**。
- 交付物中要注明 Logo 来自官方渠道，不要重绘、不要"顺手优化"路径。
- 不可将 Logo 放入商标性使用场景（如与自有 Logo 并列宣称联合品牌），除非有书面授权。

## 官方资产下载

| 资产 | 地址 |
| --- | --- |
| Logo 素材包（官方 zip，含多格式多场景） | `https://kimi-file.kimi.ai/prod-chat-kimi/kfs/4/1/2026-08-12/1d9u74p1l51jas5cp5oq0?response-content-disposition=attachment%3Bfilename%3Dkimi-logo-assets.zip` |
| 使用条款（中） | <https://www.kimi.com/zh-cn/policies/logo-usage-terms> |
| 使用条款（英） | <https://www.kimi.ai/policies/logo-usage-terms> |

需要 Logo 时**只用官方 zip**：从官网下载后再使用，不要从本 Skill 或其他站点取二手副本——官方包会随品牌更新，且是条款授权的来源渠道。

## 本 Skill 不附带 Logo 文件

本仓库**不包含任何 Logo 文件**（SVG / PNG 均无）。这是刻意的：Logo 是 Moonshot AI 的注册资产，条款保留其随时要求移除的权利，把文件放进公开仓库会让整个仓库都暴露在下架风险下。

因此交付物中的 Logo 一律**引用官方来源**：

```html
<!-- 方式一：先从官方 zip 下载到自己的静态目录，再引用（推荐） -->
<img src="/assets/kimi-logo.png" alt="Kimi" height="20" />

<!-- 方式二：直接链接官网，不落盘 -->
<a href="https://www.kimi.com" aria-label="Kimi">
  <img src="https://www.kimi.com/…官方 logo 资源…" alt="Kimi" height="20" />
</a>
```

```md
<!-- 文档 / PPT / 报告里：直接写官方来源，不重绘 -->
![Kimi Logo](官方 zip 下载后的文件路径)（来源：https://www.kimi.com/resources/kimi-brand）
```

若确实需要矢量图，从官方 zip 取原始 SVG 用，不要从官网页面里抠路径重绘。

## 使用规范

### ✅ 允许

- 整体等比缩放，保持长宽比
- 使用官方提供的原始文件（SVG / PNG 各场景版本）
- 按官方规定的最小尺寸与留白放置
- 放置在官方 Logo 使用规范图示范围内（该规范以图片形式发布于品牌手册 Logo 章节，共 17 张规范图）

### ❌ 禁止

| 禁止行为 | 原因 |
| --- | --- |
| 拉伸、压扁、非等比缩放 | 违反 No Alterations |
| 改色（除使用官方对应色版本外） | 违反 No Alterations |
| 加描边、加阴影、加渐变、加发光 | 违反 No Alterations |
| 旋转、翻转、裁切、拼贴 | 违反 No Alterations |
| 加描边文字、投影做"浮雕"效果 | 违反 No Alterations |
| 放在杂乱背景上导致辨识度下降 | 违反标识清晰性 |
| 用 Logo 作为界面主按钮、favicon 替代品自行绘制 | 违反 No Alterations |
| 与其他品牌 Logo 并列暗示合作 | 违反 No Endorsement |

### 留白与尺寸

> ⚠️ **未验证**：官方最小尺寸与净空数值只以**图片形式**发布在品牌手册 Logo 章节（共 17 张规范图），本 Skill **未逐张核验**这些图。下列数值是工程兜底值，**不是官方规范**，不要当作合规依据对外承诺。

官方数值以品牌手册 Logo 章节的规范图为准（<https://www.kimi.com/resources/kimi-brand>）。需要精确数值时，请自行查阅规范图或联系 `hi@moonshot.ai`。

在无规范图细节时可用的**兜底规则**：

- 净空 ≥ Logo 高度（K 的高度）
- 最小宽度：数字场景 ≥ 64px，印刷场景 ≥ 20mm
- 背景保持单一、纯净，与 Logo 明度差 ≥ 3:1

## 常见场景速查

| 场景 | 做法 |
| --- | --- |
| 网页页脚 | 等比缩放 + 充足留白 + 灰阶文字，链接到 kimi.com |
| 媒体报道配图 | 官方 zip 取 PNG，允许编辑性使用，保留原始比例 |
| 内部文档封面 | 可用于内部材料；对外发布前确认是否需授权 |
| 商业联名 / 商品化 | **停止使用**，先联系 `hi@moonshot.ai` |
| 产品内"由 Kimi 驱动"标注 | 需谨慎，暗示从属关系，按 No Endorsement 处理并先取得确认 |
