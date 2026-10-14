# 当前教材网站章节与承载机制审计

审计日期：2026-10-11。范围：只读检查源码、生成脚本和当前静态课程文件，供旧讲义内容归位使用；未修改 `src` 或 `public`。本报告依据当前实际路由和文件，不依据 `project_overview.md` 推断网站状态。这里的“已有正文”只表示当前文件包含正文，不表示专业内容已经审核通过。

## 1. 关键结论

1. 数据中有 **8 个课程模块、35 个子板块**。实际首页将绪论单独展示，构造基础只展示基础与地基、墙体、门窗、楼地层、楼梯、屋顶 **6 类构件**；变形缝已建模块、目录和 3 个子页，但当前首页没有入口。
2. 35 个子板块中，**隔墙、墙体设计要求、屋顶概述** 3 个有简短正文；其余 **32 个是“暂无内容”占位**。另有不在 `wallSections` 数组中的“墙体概述”正文页，所以全部基础与绪论正文页共 36 个，其中 4 个可读、32 个占位。
3. 构造原理另有 6 个专题，全部占位。`curriculumDocuments.json` 当前共允许 49 个 HTML：36 个基础/绪论正文页、6 个原理专题页、7 个目录页。
4. 实际课程渲染链是 `/#/lesson/...` → `CurriculumFramePage` → `public/lesson/...html` 的 iframe。旧 `TextbookPage.tsx` 仍在仓库，但现有路由不渲染它；`/textbook/*` 和 `/curriculum/:moduleId` 都转向当前 lesson 页面。
5. 旧 `sections/*.js` 的 `available` 字段不能用于判断当前网站是否已有正文：隔墙和屋顶概述的 `available` 为 `false`，但实际 HTML 有正文。所有模块的 `nodeIds` 都为空，35 个子板块只有墙体设计要求配置了 `construction-column-01`。
6. **饰面装修没有独立模块或子板块**。主归位方案保持现有 8 个配置模块：地面饰面落到楼地层“地面层”，楼梯饰面落到“楼梯细部构造”；墙面饰面规划 `proposed:wall-finishes`、顶棚规划 `proposed:floor-ceiling`，装修总论用 `proposed:finish-overview` 阅读入口保留（可设于楼地层概述专题）。这些是规划标识，尚不存在实际页面；独立第九个“饰面装修”模块仅为备选。
7. **作业训练已独立运行于 `/games`**，以三维交互题库为主。旧讲义的复习题、思考题、计算题、作图任务，应先梳理成各章练习清单，再决定哪些转为当前训练题型；当前题库没有通用章后文字题/绘图提交机制。

## 2. 实际渲染与数据职责

| 层 | 当前职责 | 对此次内容入库的影响 |
|---|---|---|
| `src/routes.tsx` | `/lesson/*` 使用 `CurriculumFramePage`；`/textbook/*` 使用 `LegacyCurriculumRedirect` | 当前可用章节地址应以 lesson 地址为准 |
| `src/components/AppLayout.tsx` | 首页渲染 `LearningHomePage` | 当前首页不使用旧 `HomePage.tsx` |
| `src/pages/LearningHomePage.tsx` | 读取 `previews/homepage-v1.html?raw`，把课程链接替换成 `#/lesson/`，注入正文标记 | 当前首页模块和状态文案实际由这个 HTML 决定 |
| `previews/homepage-v1.html` | 绪论 6 张卡、构造基础 6 张卡、构造原理 6 张卡、节点/案例/训练入口 | 与 `courseModules.ts` 并非统一自动同步；缺少变形缝入口 |
| `src/data/courseModules.ts` | 旧课程元数据：8 模块、图标、描述、顺序 | 可以作为分类参考，但不是当前首页生成来源 |
| `src/data/sections/*.js` | 各模块子板块元数据；生成脚本读取标题、描述、顺序 | 35 个现有子板块的 ID 应保留以维持映射，但 `available` 不能代表实际正文状态 |
| `src/data/curriculumDocuments.json` | lesson 文件白名单和旧地址到 lesson 的映射 | 新增页需入白名单，否则当前框架显示“未找到该课程章节” |
| `public/lesson/*.html` | **当前正式课程实际读取的内容** | 只新增 Markdown 或只修改旧 TextbookPage，不会让当前正文出现 |
| `src/data/textbook/**/*.md` | 当前 4 份简短正文源 | 现有生成器只读取明确列入 `articleSources` 的文件 |
| `scripts/build-curriculum-preview.mjs` | 从 sections 与 `articleSources` 生成 `public/previews/curriculum/` | 正文映射须显式增加；绪论和原理循环目前固定生成空正文 |
| `scripts/promote-homepage.mjs` | 将预览课程转为 `public/curriculum/`，生成白名单；另生成墙体目录 | 当前脚本**未把全部课程正文同步到 `public/lesson/`**，仅显式写入 lesson 的墙体目录；需在真正导入时修正同步链 |
| `scripts/build-companion-corpus.ts` | 从 `public/lesson/` 构建构造伙伴知识库 | 内容归位后要以实际 lesson 内容更新语料，避免网站与 AI 引用内容不同 |

`CurriculumFramePage` 以 `curriculum.documents` 检查文件路径，iframe 源地址为 `${BASE_URL}lesson/${documentPath}`，并以 `.page-head h1` 或 `.wall-intro h1` 判断页面是否为有效课程文件。站内页面使用 HashRouter，所以应用地址形式是 `/#/lesson/...`；表中 route 字段采用路由内部形式 `/lesson/...`。

## 3. 8 个模块与全部 35 个子板块

**本节列出的 8 模块是源码的数据目录，不是当前首页的 8 个入口。** 模块元数据的 `available` 均为 `true`，模块 `nodeIds` 均为 `[]`。下表的“旧标记”来自 `sections/*.js`；“实际正文”来自当前 `public/lesson` 文件，二者分列。变形缝当前首页入口缺失，归位到它的文字即使将来已有正文，也需要补入口才能从首页正常进入。

### 绪论（introduction）

当前首页名称：建筑绪论。入口 `/#/?section=introduction`，不是独立绪论概述文章。正文路径前缀：`/lesson/introduction/`。

| id | title（sections 原始标题） | nodeIds | 旧 available | 实际正文 | 文件名 |
|---|---|---|---|---|---|
| intro-classification | 建筑物的分类 | [] | false | 占位 | intro-classification.html |
| intro-grading | 建筑物的分级 | [] | false | 占位 | intro-grading.html |
| intro-composition | 建筑物的构造组成 | [] | false | 占位 | intro-composition.html |
| intro-factors | 影响建筑物的因素 | [] | false | 占位 | intro-factors.html |
| intro-design-principles | 建筑构造的设计原则 | [] | false | 占位 | intro-design-principles.html |
| intro-drawing-standards | 专题：制图标准与规范 | [] | false | 占位；页面实际显示“制图标准与规范” | intro-drawing-standards.html |

### 墙体（wall）

当前正式目录 `/lesson/wall/index.html`；正文路径前缀 `/lesson/basics/wall/`。注意 `/lesson/basics/wall/index.html` 是“墙体概述”正文，和 `/lesson/wall/index.html` 目录不同。

| id | title | nodeIds | 旧 available | 实际正文 | 文件名 |
|---|---|---|---|---|---|
| wall-role | 墙体在建筑中的作用 | [] | false | 占位 | wall-role.html |
| wall-types | 墙体的类型 | [] | false | 占位 | wall-types.html |
| wall-masonry | 砌体结构 | [] | false | 占位 | wall-masonry.html |
| wall-partition | 隔墙 | [] | false | **已有简短正文** | wall-partition.html |
| wall-design-requirements | 墙体的设计要求 | [construction-column-01] | true | **已有简短正文** | wall-design-requirements.html |

额外实际子页：`index` / 墙体概述，**已有简短正文**，由生成脚本插入，不在 `wallSections` 数组。目录上的模型示例直接链接 `/node/construction-column-01`；当前 lesson 正文不会根据 section 的 `nodeIds` 自动生成旧 TextbookPage 的“相关模型”侧栏。

### 门窗（door-window）

目录 `/lesson/basics/door-window/index.html`；正文前缀 `/lesson/basics/door-window/`。

| id | title | nodeIds | 旧 available | 实际正文 | 文件名 |
|---|---|---|---|---|---|
| window-door-overview | 门窗的作用与分类 | [] | false | 占位 | window-door-overview.html |
| window-door-design | 门窗的设计要求 | [] | false | 占位 | window-door-design.html |

### 基础与地基（foundation）

目录 `/lesson/basics/foundation/index.html`；正文前缀 `/lesson/basics/foundation/`。

| id | title | nodeIds | 旧 available | 实际正文 | 文件名 |
|---|---|---|---|---|---|
| foundation-overview | 概述 | [] | false | 占位 | foundation-overview.html |
| foundation-design | 基础与地基的设计要求 | [] | false | 占位 | foundation-design.html |
| foundation-types | 基础的分类 | [] | false | 占位 | foundation-types.html |
| foundation-underground | 基础与地下结构的类型 | [] | false | 占位 | foundation-underground.html |
| foundation-depth | 基础的埋置深度与影响因素 | [] | false | 占位 | foundation-depth.html |
| foundation-settlement | 不均匀沉降 | [] | false | 占位 | foundation-settlement.html |

### 楼地层（floor）

目录 `/lesson/basics/floor/index.html`；正文前缀 `/lesson/basics/floor/`。

| id | title | nodeIds | 旧 available | 实际正文 | 文件名 |
|---|---|---|---|---|---|
| floor-overview | 概述 | [] | false | 占位 | floor-overview.html |
| floor-rc-slab | 钢筋混凝土楼板 | [] | false | 占位 | floor-rc-slab.html |
| floor-ground-composition | 地面的构造组成 | [] | false | 占位 | floor-ground-composition.html |
| floor-ground-layer | 地面层 | [] | false | 占位 | floor-ground-layer.html |
| floor-balcony | 阳台及雨棚 | [] | false | 占位 | floor-balcony.html |

### 楼梯（stairs）

目录 `/lesson/basics/stairs/index.html`；正文前缀 `/lesson/basics/stairs/`。

| id | title | nodeIds | 旧 available | 实际正文 | 文件名 |
|---|---|---|---|---|---|
| stairs-overview | 楼梯的基本概念及设计要求 | [] | false | 占位 | stairs-overview.html |
| stairs-rc-structure | 钢筋混凝土楼梯构造 | [] | false | 占位 | stairs-rc-structure.html |
| stairs-details | 楼梯的细部构造 | [] | false | 占位 | stairs-details.html |
| stairs-steps-ramps | 台阶与坡道 | [] | false | 占位 | stairs-steps-ramps.html |
| stairs-elevator | 电梯及自动扶梯 | [] | false | 占位 | stairs-elevator.html |

### 屋顶（roof）

目录 `/lesson/basics/roof/index.html`；正文前缀 `/lesson/basics/roof/`。

| id | title | nodeIds | 旧 available | 实际正文 | 文件名 |
|---|---|---|---|---|---|
| roof-overview | 概述 | [] | false | **已有简短正文** | roof-overview.html |
| roof-flat | 平屋面构造 | [] | false | 占位 | roof-flat.html |
| roof-slope | 坡屋面构造 | [] | false | 占位 | roof-slope.html |

### 变形缝（deformation-joint）

目录 `/lesson/basics/deformation-joint/index.html`；正文前缀 `/lesson/basics/deformation-joint/`。已有真实文件和白名单，但当前首页卡片未展示此模块。子板块 ID 仍带 `roof-` 前缀，是历史命名，实际模块归属是独立变形缝。

| id | title | nodeIds | 旧 available | 实际正文 | 文件名 |
|---|---|---|---|---|---|
| roof-deformation-concept | 建筑变形缝的概念 | [] | false | 占位 | roof-deformation-concept.html |
| roof-deformation-location | 变形缝的设置 | [] | false | 占位 | roof-deformation-location.html |
| roof-deformation-construction | 变形缝的构造 | [] | false | 占位 | roof-deformation-construction.html |

数据模块顺序：绪论 → 墙体 → 门窗 → 基础与地基 → 楼地层 → 楼梯 → 屋顶 → 变形缝。当前首页基础卡片顺序：基础与地基 → 墙体 → 门窗 → 楼地层 → 楼梯 → 屋顶。梳理文件应同时记录旧讲义原章节顺序和网站目标顺序。

## 4. 当前已有 4 篇正文及处理原则

| 实际页面 | Markdown 正文源 | 当前包含的内容 | 内容合并时的处理 |
|---|---|---|---|
| basics/wall/index.html（墙体概述） | `src/data/textbook/walls/index.md` | 三大作用、承重/非承重分类、设计要求概览 | 与旧讲义墙体概论合并，避免与作用/类型子页全文重复 |
| basics/wall/wall-partition.html（隔墙） | `src/data/textbook/walls/partitions.md` | 轻钢龙骨、条板、砖隔墙简表及设计要求 | 保留为现有参考段，按旧讲义扩充类型与节点；已有通用参数应核验 |
| basics/wall/wall-design-requirements.html | `src/data/textbook/walls/wall-design-requirements.md` | 结构、热工、防水防潮、隔声、防火 | 不直接认定这些数值规范正确；需与讲义内容一并列为规范核验项 |
| basics/roof/roof-overview.html（概述） | `src/data/textbook/roof/index.md` | 屋顶作用、平坡屋面分类、构造层次概览 | 与讲义屋顶概述整合，不能把单一屋面层次当所有屋面通用构造 |

已有正文含耐火极限、隔声指标、气候区传热系数、屋面坡度等具体值。这里只完成网站结构审计，没有展开现行规范核验，不能作为数值已通过专业审查的依据。

## 5. 构造原理专题与文字拆分

| id | 当前名称 | 实际 route | 正文状态 | 可汇聚的讲义内容方向 |
|---|---|---|---|---|
| thermal | 建筑保温 | /lesson/principles/thermal.html | 占位 | 墙、楼板、屋面保温的一般原理；部位做法仍保留在构件章 |
| waterproof | 建筑防水 | /lesson/principles/waterproof.html | 占位 | 屋面、地下室、湿区防水的一般原理与分类 |
| insulation | 建筑隔热 | /lesson/principles/insulation.html | 占位 | 通风、遮阳、屋面隔热等一般原理 |
| acoustic | 建筑隔声 | /lesson/principles/acoustic.html | 占位 | 空气声与撞击声控制，墙体和楼地层构造的关联 |
| fire | 建筑防火 | /lesson/principles/fire.html | 占位 | 耐火与防火分隔；保留对具体建筑条件的限定 |
| moisture | 建筑防潮 | /lesson/principles/moisture.html | 占位 | 墙脚、地面、地下空间防潮一般原理 |

建议原理专题提炼跨章共通机制，并链接各构件章的完整构造做法；同一讲义段落设一个主归属，其他位置以摘要和引用关联。构造原理不应成为整章重复存放区。

## 6. 饰面装修与练习的准确承载位置

### 饰面装修

| 内容类型 | 现有准确位置 | 尚缺的结构 |
|---|---|---|
| 地面面层种类、整体/块材地面、构造层次 | `floor-ground-layer`，层次总论交叉关联 `floor-ground-composition` | 可在现有子页增设正文小节 |
| 楼梯踏步面层、防滑、栏杆扶手等 | `stairs-details` | 可在现有子页增设正文小节 |
| 墙面抹灰、贴面、涂料、裱糊、板材饰面 | 当前墙体 5 子板块没有对应专节 | 规划新增 `proposed:wall-finishes`，归于墙体 |
| 顶棚、吊顶构造 | 当前楼地层 5 子板块没有对应专节 | 规划新增 `proposed:floor-ceiling`，归于楼地层 |
| 装修总论、功能与设计要求、分类 | 没有统一准确位置 | 用 `proposed:finish-overview` 阅读入口保留，可设于楼地层概述专题；跨链地面、墙面和楼梯细部 |

“砌体结构”承载砌筑及构造连接，不宜兼作所有墙面饰面的收纳页；“墙体设计要求”主要解释性能要求，无法替代饰面施工构造章节。独立“饰面装修”第九章可作为后续备选结构，本轮没有把它作为既定网站变更。

### 作业训练

现有路径：`/games` 为训练中心，`/games/:modeId` 为具体训练方式。实现：`src/pages/GamesPage.tsx`，数据：`src/data/training.ts`，记录：`src/store/trainingStore.ts`。当前定义 8 种模式、17 道题，主要绑定檐沟、构造柱、楼梯组成、钢挂瓦条屋面、肋梁楼板、独立基础等现有节点。

| modeId | 名称 | 对旧讲义任务的适用方向 |
|---|---|---|
| identify | 模型构件辨识 | 术语、构件识别 |
| match | 构件功能配对 | 构件功能问答 |
| order | 构造层次排序 | 构造层次理解；需区分空间层次与施工工序 |
| diagram | 图纸与模型对应 | 节点读图和构件定位 |
| path | 排水与传力路径 | 原理理解与路径分析 |
| scenario | 情境方案判断 | 方案比较；不替代结构设计计算 |
| diagnose | 构造错误诊断 | 错误节点分析 |
| assemble | 三维装配补全 | 构件位置装配 |

讲义里的名词解释、简答、尺寸计算、绘图作业目前不能仅靠复制文字进入这些模式。梳理阶段应保留题干、章节归属、所需图、预期答案/评分要点（原稿若没有就标缺失），并注明“章后文字练习”或“可转交互训练”。新的通用问答/计算/作图承载形式是后续实现工作，不属于此次只读梳理。

## 7. 重复页面与生成同步风险

- 同一批课程 HTML 存在于 `public/previews/curriculum/`、`public/curriculum/`、`public/lesson/` 三个目录层。正式 SPA 当前使用 lesson 层；curriculum 层仍可作为静态路径直接打开，预览层供旧版式预览。
- 仓库另保留旧 React 页面 `HomePage.tsx`、`TextbookPage.tsx` 和 `homeMenu.ts`。它们不在当前课程首页/正文路由中；不能仅看这些文件判断用户实际会看到什么。
- `scripts/build-curriculum-preview.mjs` 只有 4 条 `articleSources`；不是扫描所有 Markdown 自动入库。新增 Markdown 未登记会继续生成空页。
- 绪论与原理当前生成循环始终输出 `<section class="empty">`，即使单独新增正文文件也没有消费机制。
- 当前 `promote-homepage.mjs` 更新预览→curriculum，**只生成 lesson/wall/index.html**，没有遍历同步 lesson 其余页面。正式 lesson 正文及对应样式已有文件，但其来源没有完整编码进此生成脚本。因此只改变课程 Markdown 再运行现有 build，会出现 curriculum 更新、lesson 仍旧的风险。
- 墙体目录用 `scripts/templates/wall-directory.html`，正文可阅读标签和 6 张卡手工写定；当前首页绪论、原理的“暂无内容”标签也手工写定。内容入库后需同步这些状态，不能只改 sections 的 `available`。
- `nodeIds` 在旧 React 正文页面中用于相关模型，但当前 iframe 正文不读取它；为每节配置模型关联，还需要实际 lesson 模板承载链接/组件。

## 8. 验证路径与方法

1. 从 `src/routes.tsx` 读取当前使用的页面组件，再追踪 `AppLayout.tsx`、`LearningHomePage.tsx`、`CurriculumFramePage.tsx`，确认首页和正文实际来源。
2. 对 8 个 `sections/*.js` 文件逐项核对 ID、标题、nodeIds、available，合计 35 个子板块。
3. 对 `src/data/curriculumDocuments.json` 的 49 个白名单文件逐项读 `public/lesson` HTML：包含 `<article class="article">` 的 4 个，包含 `<section class="empty">` 的 38 个，其余 7 个为目录。38 个占位由 32 个基础/绪论子页与 6 个原理专题组成。
4. 阅读 `scripts/build-curriculum-preview.mjs` 的 `articleSources`、绪论/原理循环、模块循环，以及 `scripts/promote-homepage.mjs` 的写入路径，确认生成链与 lesson 同步缺口。
5. 读取 `previews/homepage-v1.html` 的绪论/基础/原理区及 `src/previews/homepageBehavior.ts`，确认当前实际卡片为绪论 6、基础 6、原理 6，页面与行为文件均无变形缝入口。
6. 读取 `src/data/training.ts` 与 `GamesPage.tsx`，确认 8 模式、17 题及其题目结构；阅读 `build-companion-corpus.ts`，确认伙伴语料来自 lesson 层。

主要证据文件：

- `src/data/courseModules.ts`
- `src/data/sections/introSections.js`
- `src/data/sections/wallSections.js`
- `src/data/sections/windowSections.js`
- `src/data/sections/foundationSections.js`
- `src/data/sections/floorSections.js`
- `src/data/sections/stairsSections.js`
- `src/data/sections/roofSections.js`
- `src/data/sections/deformationJointSections.js`
- `src/data/curriculumDocuments.json`
- `src/routes.tsx`
- `src/components/LegacyCurriculumRedirect.tsx`
- `src/components/AppLayout.tsx`
- `src/pages/LearningHomePage.tsx`
- `src/pages/CurriculumFramePage.tsx`
- `src/pages/TextbookPage.tsx`
- `previews/homepage-v1.html`
- `scripts/build-curriculum-preview.mjs`
- `scripts/promote-homepage.mjs`
- `scripts/templates/wall-directory.html`
- `scripts/build-companion-corpus.ts`
- `public/lesson/` 下 49 个课程 HTML
- `src/data/training.ts`
- `src/pages/GamesPage.tsx`

本轮为结构与内容承载审计，没有启动或改动网站，也没有执行会重生成课程文件的 build。所有路径归属由当前源码和静态文件验证。

配套 `site-inventory.json` 是可机器校验的数组：35 个配置子板块、额外墙体概述 1 个、原理专题 6 个，共 42 个正文候选页。`public_path` 是项目相对文件路径；`source` 是本轮实际读取的 HTML 绝对路径；`body_source` 是已有正文的 Markdown 源（没有则 null）。7 个纯目录不在该数组中，避免将目录误当待归位正文。
