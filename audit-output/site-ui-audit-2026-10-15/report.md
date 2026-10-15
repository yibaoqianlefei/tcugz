# 当前版本全站 UI 审计

审计日期：2026-10-15。基线提交：`f5689e3`，分支 `ui-improvements`。

**共同的视觉基础已经建立。下一轮应优先解决手机工具栏裁切、异常地址恢复、长目录定位与任务到达效率，再补齐图文阅读和入口动效。**

[可视化报告](index.html) · [页面清单](inventory.json) · [测量数据](measurements.json) · [交互数据](detail-checks.json)

## 已完成与保留

- **品牌与配色：**暖白、深蓝、红色强调已通过共享令牌贯穿课程、资源、案例、训练和伙伴。
- **课程目录：**七个基础封面与绪论、原理、实践目录已采用同一课程卡片，标题、摘要、标签与操作顺序统一。
- **阅读骨架：**54 篇正文桌面阅读栏均为 760px，正文 16px、行高约 30.4px；手机主栏为 335px，基础边距 20px。
- **页面对齐：**1440px 下 React 目录与支持页标题左缘约 67.7px，课程正文约 67.0px；容器对齐的大幅差异已消除。
- **主菜单与手机停靠：**主菜单已有统一蓝色选中、简短说明与键盘反馈；手机伙伴入口预留 64px 停靠区，浮动遮字问题明显改善。
- **任务状态：**训练错误 / 正确反馈、案例主题切换与自测、节点图纸 / 知识页签、资源展开均已检查。

首页正方形、圆形、虚线椭圆、模型初始视角与锁定尺寸，以及各章节已确定的几何构图继续作为设计基线。

## 覆盖范围

- **课程：**64 个文档 × 1440 / 390px。7 个封面、3 个目录、54 篇正文；逐页测量。18 个代表页每端另存截图。
- **节点：**53 个注册入口；3 种代表页面。节点库及蓄水屋面、构造柱、独立基础；补查手机图纸和知识页签。未逐个验收 53 个三维资产。
- **训练：**8 种模式 × 桌面 / 手机。首题界面全覆盖；辨识训练实际完成一次错误和一次正确提交。记录仅在 5174 本地审计来源。
- **案例：**目录 + 两个建筑案例 × 双端。法恩斯沃斯与萨伏伊；桌面补查主题切换及理解自测。
- **辅助与状态：**资源、伙伴、数据、工具、贡献、异常地址。展开、浮层、空记录 / 访问后记录、无效课程、无效节点和普通 404。
- **边界与导航：**320px 关键页、768px 节点、菜单状态。折叠、手机展开与焦点恢复、滚动选中；动效与减少动画规则另作源码检查。

共 198 个页面／状态 × 视口组合、106 张截图。课程 128 次测量覆盖全部 64 个文档；节点采用三种代表页面抽查，没有把 53 个入口数当作 53 个模型全部通过。文档级横向溢出为 0，局部工具栏裁切另外记录。

正式审计使用当前提交的本地生产构建（5174 端口）；开发服务预检中的断连、旧缓存未纳入统计。训练提交发生在独立审计端口，不改变原 5173 网站的作答记录。本轮没有修改教学内容或正式 UI。

## 问题、证据与建议

### P1-01 手机模型工具栏被左侧边界裁切

范围：节点工作台 · 320 / 390px。

**实测／源码事实：**390px 视口下工具栏宽 272px，实际位于 x=-77～195px；320px 下位于 x=-112～160px。收起爆炸按钮完全在屏幕外，暂停旋转按钮部分被截断。最终计算样式仍为 translate: -50%，虽然移动布局已改为相对定位。页面 scrollWidth 没有超标，因此整页溢出检查未覆盖这个问题。

**影响：**关键模型操作无法直接触达，是本轮最优先的界面缺陷。

**建议：**移动布局统一由正常文档流居中，消除桌面居中位移的残留；将工具栏与模型视口、底部伙伴停靠区一起校核。

**验收：**在 320、390、760px 下检查每个按钮和滑块的实际矩形均在可见区域内；触控与键盘都能完成展开、收起和旋转操作。

证据：[截图 1](evidence/node-water-390.jpg)、[截图 2](evidence/node-water-320.jpg)。

源码：[src/components/viewer/ControlBar.tsx:176](<D:/vscode project/建筑构造交互教材/src/components/viewer/ControlBar.tsx:176>)、[src/index.css:344](<D:/vscode project/建筑构造交互教材/src/index.css:344>)。

### P1-02 未注册地址显示默认英文错误页

范围：全站异常状态。

**实测／源码事实：**访问 /#/audit-missing-page，出现 Unexpected Application Error / 404 Not Found 和开发提示，没有品牌页头、中文解释或返回入口。无效课程地址已有统一状态页，二者体验明显断开。

**影响：**输入错误或旧链接失效时，用户无法从页面内恢复学习路径。

**建议：**补齐路由未找到页及路由错误入口，共用现有页头、状态说明和返回学习首页 / 课程目录的操作层级。

**验收：**无效普通地址、无效课程和无效节点都显示可理解的中文状态，并提供有效下一步；不向用户展示开发提示。

证据：[截图 1](evidence/missing-route-390.jpg)、[截图 2](evidence/missing-route-1440.jpg)、[截图 3](evidence/missing-course-390.jpg)。

源码：[src/routes.tsx:20](<D:/vscode project/建筑构造交互教材/src/routes.tsx:20>)、[src/pages/CurriculumFramePage.tsx:13](<D:/vscode project/建筑构造交互教材/src/pages/CurriculumFramePage.tsx:13>)、[src/pages/PlaceholderPage.tsx:4](<D:/vscode project/建筑构造交互教材/src/pages/PlaceholderPage.tsx:4>)。

### P1-03 53 个节点缺少快速定位入口

范围：构造节点目录。

**实测／源码事实：**390px 下目录总高约 22137px，屋顶 20 个节点排在最前；基础分类从 y≈21540px 才开始。页面有五个部位分组，但没有分类跳转或搜索。

**影响：**想查找非屋顶节点时，需要连续滚动多屏；统一的大页头和卡片样式尚未转化为高效导航。

**建议：**在说明下设置简洁的部位快捷入口：屋顶、楼地层、墙体、楼梯、基础。长列表保留当前位置反馈；关键词检索可作为第二步。

**验收：**手机首屏能够直接选择五个部位，切换后目标标题可见；返回节点库时仍保留原分类与滚动位置。

证据：[截图 1](evidence/library-390.jpg)、[截图 2](evidence/library-1440.jpg)。

源码：[src/pages/LibraryPage.tsx:23](<D:/vscode project/建筑构造交互教材/src/pages/LibraryPage.tsx:23>)、[src/styles/site-components.css:53](<D:/vscode project/建筑构造交互教材/src/styles/site-components.css:53>)。

### P1-04 练习入口和观察任务到达过晚

范围：训练目录、手机训练与案例。

**实测／源码事实：**390×844 下，训练目录第一张练习卡从 y≈861px 开始，卡片标题在 y≈1046px；首屏被介绍、教材作业入口和统计占满。诊断训练的任务区从 y≈691px 开始，提交按钮在 y≈1409px，模型与主要作答区分处不同滚动位置。案例页也先重复项目名称和元数据，主题与阅读提示位于模型之后。

**影响：**用户先看到模型，却较晚知道具体观察目标；来回滚动增加图模对照和作答负担。

**建议：**训练目录优先呈现训练方式，将统计与教材作业入口收为紧凑区。手机工作台把一句任务摘要与主题入口放在模型前，并用固定任务入口或观察 / 作答切换保持上下文。案例合并重复项目标题。

**验收：**手机首屏能看到至少一个完整练习入口；进入训练后先知道本题任务，作答时能方便回到同一模型视角。

证据：[截图 1](evidence/training-catalog-390.jpg)、[截图 2](evidence/training-diagnose-390.jpg)、[截图 3](evidence/training-assemble-390.jpg)、[截图 4](evidence/case-farnsworth-390.jpg)。

源码：[src/pages/GamesPage.tsx:14](<D:/vscode project/建筑构造交互教材/src/pages/GamesPage.tsx:14>)、[src/pages/training.css:1](<D:/vscode project/建筑构造交互教材/src/pages/training.css:1>)、[src/pages/CaseStudyPage.tsx:20](<D:/vscode project/建筑构造交互教材/src/pages/CaseStudyPage.tsx:20>)、[src/components/cases/cases.css:44](<D:/vscode project/建筑构造交互教材/src/components/cases/cases.css:44>)。

### P2-01 页面名称与导航位置反馈不完整

范围：React 子页面的浏览器标题与页头。

**实测／源码事实：**从墙体课程进入节点库、资源、训练等页面，标签页标题继续显示“墙体 · 章节目录”；重新加载首页后进入子页则继续显示“建筑构造 · 交互式教材”。多数子页页头左侧固定写“建筑构造 / 学习首页”，右侧返回目标正确，但当前位置不明确。

**影响：**多标签页浏览、回看历史以及确认当前学习位置时容易混淆。

**建议：**建立路由名称与页面标题的统一映射；页头显示当前栏目或节点名称，保留现有明确的返回目标。

**验收：**直接进入、站内跳转和浏览器返回时，标签页标题、页内标题与栏目名称一致。

证据：[截图 1](evidence/library-1440.jpg)、[截图 2](evidence/node-water-1440.jpg)。

源码：[src/components/SiteHeader.tsx:12](<D:/vscode project/建筑构造交互教材/src/components/SiteHeader.tsx:12>)、[src/components/AppLayout.tsx:120](<D:/vscode project/建筑构造交互教材/src/components/AppLayout.tsx:120>)、[src/pages/LearningHomePage.tsx:42](<D:/vscode project/建筑构造交互教材/src/pages/LearningHomePage.tsx:42>)。

### P2-02 阅读模板已统一，构造知识仍缺少就地看图

范围：54 篇课程正文。

**实测／源码事实：**正文统一为桌面 760px 阅读栏和 16px / 1.9 行高；54 篇正文合计有 19 张表格、16 个节点链接，但未内嵌教学图片、SVG 或 Canvas。这里不计页头 Logo 和章节封面图。

**影响：**材料层次、传力、排水与连接关系主要靠连续文字描述，阅读页与三维节点之间的视觉联系仍偏弱。

**建议：**优先为典型构造关系增加有图题的剖面、路径小图和关联节点预览，形成“图示—解释—继续观察”的稳定顺序。沿用现有阅读栏，图表按需要设置宽区。

**验收：**选取墙体设计、平屋面与楼板三篇试点，关键知识旁有可对照的图示或明确节点入口；手机图例文字可读。

证据：[截图 1](evidence/course-34-1440.jpg)、[截图 2](evidence/course-24-390.jpg)、[截图 3](evidence/course-57-1440.jpg)。

源码：[public/lesson/curriculum.css:60](<D:/vscode project/建筑构造交互教材/public/lesson/curriculum.css:60>)、[scripts/build-curriculum-preview.mjs](<D:/vscode project/建筑构造交互教材/scripts/build-curriculum-preview.mjs>)、[audit-output/site-ui-audit-2026-10-15/inventory.json](<D:/vscode project/建筑构造交互教材/audit-output/site-ui-audit-2026-10-15/inventory.json>)。

### P2-03 桌面伙伴入口仍覆盖知识列表

范围：桌面节点工作台。

**实测／源码事实：**1440×1000 下，伙伴入口矩形约为 x=1340～1416、y=818～918，落在右侧知识栏内部，截图中覆盖了列表文字。手机已采用 64px 停靠区，明显改善了上一版的覆盖问题；桌面默认位置仍依赖用户拖动避让。

**影响：**学习者浏览构件知识时，部分信息与浮动入口竞争同一空间。

**建议：**为桌面工作台定义稳定的停靠安全区，或将伙伴收为工具区的小入口；打开后的浮层保持明确关闭和恢复路径。

**验收：**默认位置、展开面板和缩放窗口三种状态下，入口不覆盖知识卡正文或关键操作。

证据：[截图 1](evidence/node-water-1440.jpg)、[截图 2](evidence/companion-panel-1440.jpg)。

源码：[src/components/companion/CompanionWidget.tsx:66](<D:/vscode project/建筑构造交互教材/src/components/companion/CompanionWidget.tsx:66>)、[src/components/companion/companion.css:1](<D:/vscode project/建筑构造交互教材/src/components/companion/companion.css:1>)。

### P2-04 入口组件尚未共享同一套动效层级

范围：课程目录、节点库、训练目录、主菜单。

**实测／源码事实：**课程卡片与新版主菜单采用 360ms 蓝色展开与文字轻移；节点卡片主要为 180ms 边框 / 底色变化，训练卡片约 180ms。信息角色相近的入口在交互时仍有明显风格差异。减少动画偏好已有源码支持。

**影响：**静态配色接近，但从首页进入节点与训练目录后，交互质感明显变弱。

**建议：**把已接受的缓动、填充方向、文字位移和焦点反馈提炼为入口组件规则，再给图片型卡片设置适合自身结构的操作区。以共同反馈连接页面。

**验收：**课程、节点、训练和导航四类入口使用共同的时长与缓动；键盘焦点清楚，减少动画模式保留反馈。

证据：[截图 1](evidence/home-navigation-390.jpg)、[截图 2](evidence/course-41-1440.jpg)、[截图 3](evidence/library-1440.jpg)、[截图 4](evidence/training-catalog-1440.jpg)。

源码：[public/styles/directory-cards.css:9](<D:/vscode project/建筑构造交互教材/public/styles/directory-cards.css:9>)、[public/homepage.css:35](<D:/vscode project/建筑构造交互教材/public/homepage.css:35>)、[src/styles/site-components.css:54](<D:/vscode project/建筑构造交互教材/src/styles/site-components.css:54>)、[src/pages/training.css:14](<D:/vscode project/建筑构造交互教材/src/pages/training.css:14>)。

### P3-01 轻量支持页可采用更紧凑的页头与状态说明

范围：学习资源、工具箱、贡献节点。

**实测／源码事实：**资源、工具箱与主要目录共用约 78px 的桌面大标题和较高页头。资源共四条记录，其中“建筑盒子”没有链接；空间设计仍显示“2 个链接”。资源展开、缺失内容与节点不存在状态的表达细节尚不一致。

**影响：**少量内容占用较多首屏空间，链接数量与实际可用操作存在小幅偏差。

**建议：**增加支持页的紧凑页头变体；少量资源可直接展开，数量按可用链接计算。空状态共用标题、说明与一个主要下一步。

**验收：**资源可用数量与实际链接一致；支持页首次进入即可看到主要操作，空状态文案和按钮层级统一。

证据：[截图 1](evidence/resources-1440.jpg)、[截图 2](evidence/resources-open-390.jpg)、[截图 3](evidence/tools-1440.jpg)、[截图 4](evidence/missing-node-390.jpg)。

源码：[src/pages/ResourcesPage.tsx:5](<D:/vscode project/建筑构造交互教材/src/pages/ResourcesPage.tsx:5>)、[src/pages/PlaceholderPage.tsx:4](<D:/vscode project/建筑构造交互教材/src/pages/PlaceholderPage.tsx:4>)、[src/styles/site-components.css:7](<D:/vscode project/建筑构造交互教材/src/styles/site-components.css:7>)。

## 共同设计逻辑

1. **品牌层**保留暖白、深蓝与少量红色，几何构图集中在首页和章节封面。
2. **目录层**使用统一的标题、摘要与操作顺序；照片或构造图入口按内容保留各自比例。
3. **阅读层**保持 760px 主栏和 16px 正文，图示与表格形成独立的对照层级。
4. **操作层**先保证模型、图纸与任务能互相对照，控件边界和有效点击范围统一。
5. **状态层**统一当前页名称、选中、加载、反馈、空状态、异常与返回入口。
6. **动效层**延续已接受的 360ms 入口展开；工具反馈采用较短过渡，并保留减少动画偏好。

## 下一轮建议顺序

1. 手机工具栏 + 路由 404，先修影响操作的缺陷。
2. 节点部位快捷入口 + 训练目录减高 + 手机观察任务前置。
3. 正文图文对照试点 + 节点／训练入口动效统一 + 辅助状态细节。

未逐项测试全部三维资产内部细节、外部站点内容或真实 AI 接口；本轮以页面结构、视觉关系、导航和代表性交互为依据。
