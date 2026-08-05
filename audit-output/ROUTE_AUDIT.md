# 路由、菜单与可达性审计报告

## 路由表（src/routes.tsx，createHashRouter）

| path | 组件 | 状态 |
|---|---|---|
| `/` | HomePage | ✅ 正常 |
| `/library` | LibraryPage | ✅ 正常 |
| `/curriculum` | CurriculumPage | ✅ 正常 |
| `/curriculum/:moduleId` | SectionSubPage | ✅ 正常 |
| `/textbook/:moduleId/:chapterId`、`/textbook/:sectionId` | TextbookPage | ✅ 结构正常（内容近空，见 P2-6） |
| `/node/:nodeId` | NodeDetail | ✅ 正常；未知 id →"节点不存在" |
| `/games` | GamesPage | ⚠️ 纯占位（"正在建设中"） |
| `/tools` | PlaceholderPage "工具箱" | ⚠️ 占位 |
| `/contribute` | PlaceholderPage "贡献节点" | ⚠️ 占位（被首页顶栏真实挂出） |
| `/curriculum/cases` | CasesPage | ⚠️ 卡片全"模型开发中"，无链接（案例节点 development） |
| `/resources` | ResourcesPage | ✅ 正常 |
| `/ai` | AIPage | ⚠️ 生产不可用（无后端），dev 正常 |
| `/ai-extend` | AIExtendPage | ✅ 正常 |
| `/data` | DataAnalysis | ✅ 正常 |
| `*`（未匹配） | **无 catch-all** | ⚠️ 渲染 React Router 默认错误页 + 2 console error（P2-4） |

## 浏览器实测（1440×900，15 路由）

- 全部路由非白屏；0 console error（除未知路由 2 条）；0 网络 404。
- 未知路由 `#/does-not-exist-route` → "Unexpected Application Error! 404"。
- 未知节点 `#/node/does-not-exist-xyz` → 项目内"节点不存在"页 ✅。
- 未知章节 `#/textbook/wall-construction/1` → 项目内"未找到该章节"页 ✅。

## 部署 / 刷新

- hash 路由 + 生产 base `/tcugz/`：构建产物 dist/index.html 资源前缀均 `/tcugz/` 正确；`#/node/:id` 刷新时 URL 恒为 `/tcugz/#/...`，服务端命中固定路径，hash 内状态 → GH Pages 刷新逻辑成立（未真机复现）。

## 菜单完整性

- 首页主菜单"构造原理"6 子项（保温/防水/隔热/隔声/防火/防潮）无 `to`、无 sections → 点击只展开"暂无子章节"，不可导航（P3-12）。
- 首页主菜单与 `/curriculum`（CurriculumPage 课程目录）**两套并存菜单**。
- `src/data/menu.ts` 死代码（零 import），指向 `/curriculum/thermal` 等失效路径（P3-12）。
- /ai、/resources 无主导航入口（仅 /ai-extend tab 内嵌 ResourcesPage）。
- 已删除旧栏目无残留；占位页 3 处（tools/contribute/games）+ cases 空卡片。

## 外链安全

- ResourcesPage / Markdown 组件外链均 `target="_blank" + rel="noopener noreferrer"`，全 https ✅。
- LibraryPage 页脚 3 个 `href="#"` 死锚点（P3-16）。

## 结论

路由骨架完整、hash 部署正确、3D 节点可达性好。主要问题：无 404 catch-all（P2）、教材内容近空（P2）、占位页与两套菜单（P3）。
