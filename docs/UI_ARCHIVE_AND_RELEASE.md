# UI 封存与发布

2026-10-02 UI 升级发布。

## 旧线上版封存

- 源码标签：`archive/original-ui-2026-10-02`，对应 `6d4f4631ece740650faa460256930da5c75de7a3`。
- GitHub Pages 发布产物标签：`archive/original-pages-2026-10-02`，对应 `757911a8678d397d1bed551f152d1196d969d090`。
- 本地源码 ZIP：`project-backups/original-website-ui-20261002.zip`。

两份 Git 标签均保留完整文件和历史，可在独立目录通过 `git archive` 提取。ZIP 为 Git 中的源码快照，不含依赖目录或本地环境配置；恢复后按仓库依赖锁文件安装。

## 新版发布

- 源码提交到 `ui-improvements` 和 `main`。
- 使用 `VITE_BASE_URL=/tcugz/` 构建静态文件。
- 发布到原有 `gh-pages` 分支，保留发布历史，采用非强制推送。
- 网站入口：<https://yibaoqianlefei.github.io/tcugz/>。
- 发布版本通过网站根目录的 `release.json` 标识对应源码提交。

本地开发仍使用根路径 `/`。发布构建生成的子路径课程文档，在发布暂存后重新生成为本地根路径版本。

## 已完成的本地验证

参见 `audit-output/ui-fixes-2026-10-02/fix-report.md`。首页侧栏、内容位置和模型画布保持逻辑作为浏览器回归检查保留。
