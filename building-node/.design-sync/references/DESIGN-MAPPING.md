# Design System Mapping: 建筑构造 ←→ Claude (Anthropic)

> 用于对照参考，为建筑构造交互教材的设计系统提供迭代方向。

---

## 色调对照

| Token 角色 | 你的系统 | Claude 参考 | 差异 |
|-----------|---------|------------|------|
| **主色** | `#FF6B5A` 珊瑚 | `#cc785c` 暖棕珊瑚 | 你更红/更亮；Claude 更棕/更哑 |
| **主色按下** | 无定义 | `#a9583e` | 建议增加 `#e55a4a` |
| **画布底色** | `#F6F1E8` 奶油白 | `#faf9f5` 暖奶油 | 你更黄/更暖；Claude 更白/更通透 |
| **卡片表面** | `#fff` (白) | `#efe9de` 浅奶油 | Claude 用奶油层级替代纯白 |
| **深色表面** | 无定义 | `#181715` 深海军蓝 | 你的 Scene 3D 区域可参考 |
| **文字主色** | `#2B2B2B` | `#141413` 暖墨 | 你更灰；Claude 更暖黑 |
| **次要文字** | `#999` | `#6c6a64` muted | Claude 的 muted 更有温度 |
| **分割线** | 无定义 | `#e6dfd8` hairline | — |
| **成功色** | 无定义 | `#5db872` | — |
| **警告/错误** | 无定义 | `#d4a017` / `#c64545` | — |

### 关键差距

你目前只有 **5 个颜色值**，Claude 的完整系统有 **30+ 个语义色**。差距最大的：
- ❌ 缺 **主色禁用态** (`primary-disabled`)
- ❌ 缺 **深色表面** 体系（footer、3D 场景 overlay 用）
- ❌ 缺 **hairline 分割色**（border 用）
- ❌ 缺 `muted` / `on-dark` 等多上下文文字色

---

## 字体对照

| Token 角色 | 你的系统 | Claude 参考 | 差距 |
|-----------|---------|------------|------|
| 展示大字 | `fontFamily: "serif"` 38px | Copernicus 64/48/36/28px | Claude 有 4 级 serif display 层级 |
| 标题层级 | 无系统化 | StyreneB 22/18/16px | Claude 有 title-lg/md/sm 三级 |
| 正文 | 无定义 | StyreneB 16/14px | — |
| 按钮 | 无定义 | StyreneB 14px/500 | — |
| 代码 | 无定义 | JetBrains Mono 14px | 你的 3D 场景可能用不到 |
| 导航链接 | 无定义 | StyreneB 14px/500 | 你的 Sidebar 菜单可对齐 |

### 关键差距

你目前只有 `fontFamily: "serif"` 一个声明。Claude 的 `Copernicus serif 展示 + Inter 正文` 分离是核心品牌资产。

### 对你可用的开源替代
- 展示衬线：`Cormorant Garamond` 或 `Noto Serif SC`（中文）
- 正文无衬线：你的系统已有 `system-ui` fallback，够用

---

## 间距对照

| Token | 你的系统 | Claude 参考 | 差距 |
|-------|---------|------------|------|
| 基础单位 | 无声明 | 4px | 建议引入 |
| Sidebar 内边距 | `24px` | — | 合理 ✅ |
| 卡片内边距 | `20px` | `32px` (xl) | 你可以更宽松 |
| Section 间距 | 无定义 | `96px` | — |

---

## 圆角对照

| 元素 | 你的系统 | Claude 参考 |
|------|---------|------------|
| 按钮 | `8px` | `8px` ✅ |
| 卡片 | `10px` | `12px` |
| Sidebar 菜单项 | `8px` | — |

---

## 组件对照

| 组件 | 你的实现 | Claude 对应 | 状态 |
|------|---------|-----------|------|
| Sidebar | `F6F1E8` 画布 + coral hover | 无直接对应 | ✅ 已落地 |
| Title 动画 | 逐字 spring | 衬线展示字 | ✅ 已落地 |
| 菜单项 | hover lift + scale 0.98 | nav-link | ✅ 已落地 |
| 按钮 (主 CTA) | 无规范 | `button-primary` — coral fill | ⚠ 需标准化 |
| 信息卡片 | 白色底 `220px` 宽 | `feature-card` — cream 底 | 颜色可对齐 |
| 3D 场景 overlay 按钮 | 白色半透明 | `button-secondary-on-dark` | 颜色可对齐 |
| disabled 项 | `opacity: 0.4` + badge | `primary-disabled` + muted | ✅ 方向一致 |
| Footer slogan | `11px #bbb` | 深底 footer | 颜色可对齐 |

---

## 立即可做的 3 步升级

### 第一步：颜色变量化（30 分钟）

把 `menu.ts` / `Sidebar.tsx` 中的硬编码颜色抽到 `data/colors.ts`：

```ts
// data/colors.ts
export const colors = {
  primary: "#FF6B5A",
  "primary-active": "#e55a4a",
  canvas: "#F6F1E8",
  "surface-card": "#efe9de",    // 新增：比 canvas 深一档
  ink: "#2B2B2B",
  muted: "#88847e",              // 新增：比 #999 更暖
  hairline: "#e6dfd8",           // 新增：border 用
  "surface-dark": "#181715",     // 新增：3D 场景 overlay
  "on-primary": "#ffffff",
  "on-dark": "#F6F1E8",
}
```

### 第二步：字体层级化（30 分钟）

`Title.tsx` 保持 serif，Sidebar 导航→Inter/system-ui sans：

```tsx
// 展示字 → serif（已有）
<h1 style={{ fontFamily: "serif", fontSize: 38 }}>

// 导航/正文 → sans
<span style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: 14 }}>
```

### 第三步：间距 Token 化（20 分钟）

引入 4px 基础单位，Sidebar/卡片内边距统一：

```ts
export const spacing = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,   // 卡片内边距
  xl: 32,   // Section 内边距
}
```

---

## 不要照搬的 Claude 特质

| Claude 特有 | 你的系统 | 原因 |
|------------|---------|------|
| 深色代码编辑器卡片 | ❌ 不适用 | 你是建筑 3D 教学，不是开发工具 |
| 定价卡片 / 连接器磁贴 | ❌ 不适用 | 你的"卡片"是 3D 构件信息卡 |
| 英语衬线字体 Copernicus | → 替换为 `Noto Serif SC` | 中文内容需要中文衬线 |
| `96px` section 节奏 | → 改为 `64px` | 教育类内容密度高于营销站 |
| 4 栏 footer | ❌ 不适用 | 你的 Sidebar 底部 slogan 够用 |

---

## 实施状态 (2026-06-21)

| 阶段 | 文件 | 状态 |
|------|------|------|
| Token 系统 | `src/data/tokens.ts` | ✅ 已创建 |
| 全局 CSS Reset | `src/index.css` | ✅ 已创建 (Inter + Noto Serif SC) |
| Title | `src/components/Title.tsx` | ✅ 重构 |
| Sidebar | `src/components/Sidebar.tsx` | ✅ 重构 |
| Scene (overlay) | `src/components/Scene.tsx` | ✅ 重构 |
| InfoCard | `src/components/InfoCard.tsx` | ✅ 重构 (含节点名/描述) |
| ExplodeSlider | `src/components/ExplodeSlider.tsx` | ✅ 重构 (含百分比标签) |
| HomeLayout | `src/components/HomeLayout.tsx` | ✅ 重构 (深色 3D 背景) |
| Learn 页 | `src/pages/Learn.tsx` | ✅ 重构 |
| Node 页 | `src/pages/Node.tsx` | ✅ 重构 |
| Placeholder 页 | `src/pages/Placeholder.tsx` | ✅ 重构 |
| TypeScript 编译 | — | ✅ 零错误 |
| Vite 生产构建 | — | ✅ 零错误 |
| Playwright E2E 验证 | — | ✅ 6/6 通过 |
| Google Fonts (Inter + Noto Serif SC) | — | ✅ CSS @import |

_同步自 [awesome-design-md/claude](D:\vscode project\awesome-design-md\design-md\claude\DESIGN.md)_
_参考文件位置: `.design-sync/references/claude-DESIGN.md`_
