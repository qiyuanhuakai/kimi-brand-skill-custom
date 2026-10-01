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

需要 Logo 时**优先从官方 zip 下载**，而不是从本 Skill 或其他站点取二手副本——官方包会随品牌更新，且是条款授权的来源渠道。

## 本仓库内的字标

`assets/kimi-wordmark.svg` 是从 kimi.com 官方页面内联字标**原样复制**的 96×32 "KIMI" 字标（未作任何修改），用于在网页/文档中做非商业、编辑性引用。**它不替代官方 zip**：需要 PNG、多色版、反白版、应用图标等一律走官方下载。

```html
<!-- 用法：仅整体缩放，不改色不变形 -->
<img src="./kimi-wordmark.svg" alt="Kimi" height="20" />
```

```css
/* 深色底反白用法：只改 fill，不改形状 —— 注意：改色属于"改动"，仅在反白场景使用官方反白资产优先 */
.kimi-logo--dark { filter: invert(1); } /* 兜底方案，优先改用官方反白版资产 */
```

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

官方最小尺寸与净空值以品牌手册 Logo 章节的规范图为准（<https://www.kimi.com/resources/kimi-brand>）。**工程兜底规则**（在无规范图细节时使用）：

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
