# 项目运行与旧 UI 状态审计

审计日期：2026-10-04（Asia/Shanghai）。当前源码分支 `ui-improvements`，提交 `6ebbe02a3deb34ff4e03ac3b72969c2a6fe9d0d6`。

## 运行状态

- 已启动本地 Vite 服务：<http://127.0.0.1:5173/#/>。
- 正式首页由 `src/components/AppLayout.tsx` 中的 `LearningHomePage` 渲染，模板来自 `previews/homepage-v1.html`。这个 v1 文件是当前新版首页使用的模板，不能按文件名将其当作旧版删除。
- 本次只启动服务、运行审计和保存报告，未修改业务代码、切换分支或部署网站。
- 线上 `release.json` 读取到的源码版本也是 `6ebbe02`，与当前本地源码一致。

## 旧 UI 封存状态

| 项目 | 验证结果 |
| --- | --- |
| 旧源码标签 | `archive/original-ui-2026-10-02`，实际提交 `6d4f4631ece740650faa460256930da5c75de7a3`；本地和 GitHub 均存在 |
| 旧 Pages 产物标签 | `archive/original-pages-2026-10-02`，实际提交 `757911a8678d397d1bed551f152d1196d969d090`；本地和 GitHub 均存在 |
| 本地 ZIP | `project-backups/original-website-ui-20261002.zip`，34,489,950 字节，可正常读取 |
| ZIP 完整性 | 333 个文件逐一计算 Git blob 哈希，与封存源码提交中的 333 个文件完全一致，无遗漏、差异或额外文件 |
| ZIP 是否随网站发布 | 不进入 Vite 静态构建；`project-backups/.gitignore` 排除该目录中的本地备份 |
| 旧首页是否仍在使用 | `src/pages/HomePage.tsx` 保留在源码中，无当前入口引用；构建未生成旧首页组件 chunk |
| 旧课程书签 | `/curriculum/wall`、`/textbook/wall/wall-design-requirements`、`/textbook/roof/index`、`/textbook/deformation-joint` 均实际验证跳转到新版课程页面 |

封存标签是 annotated tag，标签对象哈希与上述实际提交哈希不同，属于正常情况。

## 发现的问题

### P2：默认分支与实际发布源码不同

GitHub 默认分支仍为 `main`，远程提交 `5f09066ad40903ba998310693d2793494fbcbdfd`；当前 `ui-improvements` 为 `6ebbe02`，包含 `main` 尚未接收的 4 个提交。远程 `main` 已有新版 UI，但没有最近的案例、训练、模型和屋面节点更新。本地 `main` 还停留在封存旧 UI 的 `6d4f463`。

这会使默认克隆仓库或切换本地 main 的开发者运行不同版本。建议后续将已验证的源码整合到默认分支，并同步本地主分支。本次未执行合并或推送。

### P2：旧教材组件没有路由入口，但仍被打包

`src/components/RouteSuspense.tsx:20` 仍声明旧 `TextbookPage` 的 lazy import。当前课程路由已由 `LegacyCurriculumRedirect` 和 `CurriculumFramePage` 处理，未使用此组件。

本次生产构建仍输出 `TextbookPage-DMqg9IqH.js`：178,582 字节，gzip 约 54.25 kB；主 bundle 仍引用该 chunk。实际路由测试没有发现它被用于渲染旧页面，也不能将其全部字节认定为首页下载量，但它仍增加发布包体积和维护歧义。

建议移除无用途的 lazy 导出后重新构建，确认旧教材 chunk 消失。旧源码已由标签和 ZIP 保存，后续清理应保留仍被现有功能使用的 Markdown、节点数据和共享组件。

### P3：旧首页背景资源仍复制到发布包

`public/models/background/Exhibition model.glb` 为 4,806,080 字节。目前源码中对应的引用链为 `backgroundScenes.ts → HomePage.tsx`，旧首页不再使用，但 Vite 仍把 public 目录中的此文件复制进静态构建。

这增加发布资产体积，不表示当前首页会加载它。建议核查需要保留的外部资源链接后，将该旧专用资产移出 public，保留在封存资料中。

### P3：项目运行说明仍为框架模板

README.md 主要是 React/Vite 模板说明。建议补充当前开发分支、本地运行、旧 UI 恢复、GitHub Pages 构建路径和发布流程，减少误运行旧版本的可能。

## 已完成验证

| 检查 | 结果 |
| --- | --- |
| `npm test` | 全部通过，包含模型布局、状态、节点契约、148 个资源引用，以及 8 种训练模式和 17 个题目契约 |
| `npm run lint` | 通过，无 ESLint 错误或警告 |
| TypeScript + Vite 生产构建 | 通过；产物独立写入 `tmp/audit-build-20261004`，未替换现有 dist |
| 主要 UI 页面 | 11 个代表性路由 × 1440/390/320px，共 33 次检查，无空白页面、请求失败、页面异常或横向溢出 |
| 课程静态链接 | 49 份课程文档，未发现缺失的内部课程文件 |
| 首页模型 | 正式首页、独立预览及手机页面真实渲染通过；4 个模型可切换，128px 箭头间距、视角保持、拖动结束恢复旋转通过 |
| 首页返回 | 内容位置 477px → 477px；折叠侧栏状态和同一模型 Canvas 保留 |
| 节点库返回 | 位置 165px → 165px；显式返回和浏览器返回均通过 |
| 课程高度 | 长正文 2358px → 短正文 921px，恢复长正文也通过 |
| 节点工作台高度 | 1440/768/760/390px 均适配到视口底部 |
| 课程错误页面 | 缺失课程提示正确；模拟 HTTP 200 返回非课程 HTML 后能识别错误，重试可恢复 |
| 新版次级页面 | 案例、作业训练、学习资源、AI 拓展、数据页在 1440/390/320px 下的统一返回入口和宽度检查通过 |

构建仍有大于 500kB 的 chunk 提示，主要是 R3F/Three 相关运行时。它不是编译失败；本次未做网络限速、帧率基准或全面性能量化，不据此承诺所有设备都流畅。

## 审计证据

- `results.json`：33 次页面尺寸、资源和关键返回流程记录。
- `archive-verification.json`：ZIP 与 Git 封存源码逐文件比对结果。
- 本目录中的 PNG：桌面和手机页面截图（被项目忽略规则排除）。
- `tmp/audit-20261004-tests.log`、`tmp/audit-20261004-lint.log`、`tmp/audit-20261004-build.log`：完整命令日志。

## 建议处理顺序

1. 统一默认源码分支与当前发布版本，避免运行不同版本。
2. 清理旧教材 lazy 导出，复测旧书签仍进入新版课程。
3. 整理不再使用的旧首页组件和背景模型，保留封存资料及必要的共享代码。
4. 更新 README 的运行与恢复说明。

未发现需要立即回滚当前新版 UI 的运行问题。旧版本可恢复，现有新版主要流程检查通过；待整理项主要集中在分支一致性和旧代码、资产的残留。
