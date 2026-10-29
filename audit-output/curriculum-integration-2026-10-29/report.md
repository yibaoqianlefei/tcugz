# 全书课程与模型融合升级验收记录

核对日期：2026-10-29。版本：knowledge-2026-10-29。本地完整版本与审计文件，历史审计保留。

## 交付概况

本版覆盖 **54 节课程、88 个稳定知识单元、93 个可用节点、124 条课程—模型关系、66 个按需加载画布**。全部可用节点各有且仅有一个主教学位置；开发中条目不计入覆盖。**99 个不同模型文件的 SHA-256 保持不变。**

统一路径为：**学习问题 → 原理讲解 → 模型或图示观察 → 关系解释 → 自测与应用**。沿用墙体蓝红配色、阅读布局、折叠比较及按需画布。实践课程以任务、提交物和自评标准组织。

[本地交互审计页](http://localhost:5173/audit-output/curriculum-integration-2026-10-29/index.html) · [108 次浏览器检查](browser-checks.json) · [手机知识区测量](mobile-sheet-checks.json) · [知识关系数据](../../src/data/curriculumLearning.json) · [插图依据记录](../../src/data/diagramEvidence.json)

## 已完成的共用机制

- 保留原有教材知识骨架，将模型观察放在其要解释的原理处；比较模型折叠呈现，画布按需加载。
- 知识单元共享稳定 ID。课程、节点页和构造伙伴读取同一关系，节点从比较课程进入时返回实际来源。
- 兼容原有 lesson / figure / model 链接；来源参数仅在课程与节点确有关联时生效。返回教材恢复知识位置、滚动及折叠状态。
- 纯原理或证据不足的主题不强行配置模型；模型可见性、构件名称及观察动作与现有能力相符。
- 实践作业采用任务、提交物、自评标准，要求解释关系、提交图纸证据并识别待补条件。
- 99 个不同模型文件 SHA-256 与本次升级前基线相同。已确认的旋转、缩放和相机平滑过渡行为沿用。

核心类型为 LessonLearningPlan、KnowledgeUnit、NodeLearningContext 与 DiagramEvidence；课程、节点知识区与构造伙伴共用这些关系。先修关系校验无环，旧链接保留兼容。

## 四批生成与范围验收

| 批次 | 章节 | 课程 | 单元 | 节点主归属 | 未选内容一致性检查 |
|---|---|---:|---:|---:|---:|
| 1 | 墙体 | 8 | 13 | 21 | 233 项通过 |
| 2 | 基础、楼地层、楼梯 | 18 | 32 | 45 | 183 项通过 |
| 3 | 屋顶、门窗、变形缝 | 8 | 23 | 27 | 233 项通过 |
| 4 | 建筑绪论、构造原理、实践作业 | 20 | 20 | 0 | 173 项通过 |

第四批建立先修、比较和实践联系，沿用前三批节点主归属，因此没有新增主归属。每批仅更新选定课程与相关索引；未选 Markdown、生成 HTML、媒体项、语料及训练项按实际范围进行一致性校验。

## 内容与图模核对后的修正

- 墙身防潮图重新限定两个场景，分别核对水平层贯穿墙厚、相对地面位置及高侧邻土竖向连接；同步收窄旧图名、正文说明和节点图纸标题。
- 烧结普通砖图明确为局部立面错缝比较。半砖错缝及 240∶53 外形比例属于本图教材实例，不冒充所有块材的通用最小搭砌规定。
- 隔墙图区分立面与从上向下看的水平横剖面；取消填充矩形边线造成的 C 形龙骨闭口假象，检查连续骨架、板边支承与层次，不添加无依据的安装细节。
- 屋面模型、教材与构件知识统一：平屋面按实际 8 个网格层次描述，冷底子油表述为基层处理剂；干铺油毡位置对应原模型，不直接认定为隔汽层。
- 坡屋面构件知识去除未经证据支持的树种、规格、配筋及间距；模型实例值、设计参数与规范要求分别表达。
- 修正楼地层、电梯等课程中偏离本节对象的题目；每个核心单元具备解释或应用题及至少两个判定要点。
- 逐项核对观察任务中的模型对象名称与真实构件键；展开用于观察已有连接，不暗示尚未提供的单构件移动或拆装能力。

- 完成 18 个构件数据文件的图文复核：删除无来源的外保温厚度、锚固与性能数值，以及仅凭泡沫板模型推断 EPS / XPS 材料类别的表述；观察任务保留模型可证的层次和连接关系。
- 瓦屋面卡片删除无依据的 100 mm 搭接规定及完整防水、保温性能保证。排水坡度与管口尺寸仅在原图可证时标为实例值，其余不提供确定数值。
- 楼梯底层入口四张原图的 ≥2200 标注作为图示值保留；通道净高按完成通行面至最低障碍物的竖向距离理解，删除 2000 的泛化要求及从踏步前缘量取通道净高的错误说法，同时删去住宅、公建栏杆高度的无条件泛化。
- 构造柱卡片将 2Φ6@500 识别为墙柱拉结筋，纠正误称箍筋；4Φ12 / 240 等原图可见参数仍保留为该图实例，不提升为通用设计要求。散水、勒脚和台阶等知识卡片同步清理缺少条件与来源的确定性阈值。
- 上述数据修正保持对象键、显示顺序和展开偏移 order / float 一致，18 个文件 ESLint 检查通过；未以修改模型几何或交互参数来实现文字修正。

参数分三类：规范要求给出适用对象与依据；实例值只解释当前模型或图纸；计算假设在题目中明确。色带及显示比例不提供未标明的施工尺寸。

## 三张墙体图的四轮依据闭环

### 砌筑墙体：防潮层的位置与连续性

适用范围：砌筑墙体墙身防潮；两个独立局部剖面分别说明室内外地面与相邻室内地面高差。

几何核对：检查A水平层贯穿墙厚且位于垫层范围并高于室外地面；B竖向层位于高侧邻土面并接续两道水平层。

边界：不表示地面防潮、地下防水、基础、散水、洞口或保温系统。 色带厚度及图形比例不提供施工参数。

复核日期：2026-10-29。四轮记录：

1. 核对官方公告或出版社现行目录，明确效力、适用对象及通用规范优先关系。
2. 阅读记录所列原文页与相关图线条款，确定可绘制范围。
3. 检查A水平层贯穿墙厚且位于垫层范围并高于室外地面；B竖向层位于高侧邻土面并接续两道水平层。
4. SVG渲染、教材图注与网页桌面及手机表现复核；验证记录见本版审计截图。

依据：

- [GB 55031—2022 民用建筑通用规范](https://sjw.nanjing.gov.cn/gdzsj/zcfg/gfxwj/202402/P020240228546256431161.pdf)，6.2.3第1款；正文16页；政府公开PDF20页。室外地面以上、室内地面垫层处连续水平防潮；室内高差范围邻土侧附加防潮。全部条文强制，2023-03-01实施。 [版本与效力来源](https://www.mohurd.gov.cn/gongkai/zc/wjk/art/2024/art_17339_767703.html)。
- [GB/T 50001—2017 房屋建筑制图统一标准](https://www.mohurd.gov.cn/gongkai/zc/wjk/art/2018/art_17339_234638.html)，4.0.1～4.0.2、7.3.1、9.1.2；正文13、22、28页；官方PDF19、28、34页。图线层次、引出线及小范围材料标识的教学表达；本图不按比例

图下注释与 SVG 元数据保存同一证据记录；成图见下方截图。标准使用范围限于所列教学表达，不据此宣称完整工程设计已获合规认证。

### 烧结普通砖砌体：相邻皮竖缝比较

适用范围：烧结普通砖局部立面，上下皮竖缝错开与连续竖缝反例。

几何核对：检查两栏灰缝带、左相邻皮半砖错开、右连续竖缝、两侧截断符号和图外延续；不加入通用最小搭砌数值。

边界：不表示墙厚方向搭砌、转角、墙端或交接。 半砖错缝仅为本图示例，不是所有块材的通用最低搭砌值。 240∶53外形比例来自教材砖面实例；灰缝可读表达不等于施工尺寸。

复核日期：2026-10-29。四轮记录：

1. 核对官方公告或出版社现行目录，明确效力、适用对象及通用规范优先关系。
2. 阅读记录所列原文页与相关图线条款，确定可绘制范围。
3. 检查两栏灰缝带、左相邻皮半砖错开、右连续竖缝、两侧截断符号和图外延续；不加入通用最小搭砌数值。
4. SVG渲染、教材图注与网页桌面及手机表现复核；验证记录见本版审计截图。

依据：

- [GB 55007—2021 砌体结构通用规范](https://www.tpsq.gov.cn/eportal/attachDir/jsj/2024/09/2024091911062927540.pdf)，5.1.3；正文13页；锡林郭勒盟住建局公开PDF16页。砌体交接及上下错缝原则，2022-01-01实施，通用规范优先。 [版本与效力来源](https://www.mohurd.gov.cn/gongkai/zc/wjk/art/2021/art_17339_761188.html)。
- [GB 50203—2011 砌体结构工程施工质量验收规范](https://zjjcmspublic.oss-cn-hangzhou-zwynet-d01-a.internet.cloud.zj.gov.cn/jcms_files/jcms1/web3162/site/attach/0/ce650cb7f5db41ceadf49a8f43375c35.pdf)，5.3.1；正文16页。砖砌体组砌补充核对，不将已被通用规范替代的条文当作独立最高依据。 [版本与效力来源](https://ebook.chinabuilding.com.cn/zbooklib/book/detail/show?SiteID=1&bookID=60862&isEnterprise=Y)。
- [GB/T 50001—2017 房屋建筑制图统一标准](https://www.mohurd.gov.cn/gongkai/zc/wjk/art/2018/art_17339_234638.html)，4.0.1～4.0.2、7.3.1、9.1.2；正文13、22、28页；官方PDF19、28、34页。图线层次、引出线及小范围材料标识的教学表达；本图不按比例

图下注释与 SVG 元数据保存同一证据记录；成图见下方截图。标准使用范围限于所列教学表达，不据此宣称完整工程设计已获合规认证。

### 轻钢龙骨纸面石膏板隔墙：组成与支承

适用范围：近侧面板局部省略的立面与从上向下看的水平横剖面。

几何核对：检查沿顶沿地与立筋连续、板缝落在竖龙骨翼缘、双侧面板及腔内填充层次；删除填充矩形边线造成的C形龙骨闭口假象。

边界：不表示顶部滑移缝、管线穿透、锚固或螺钉间距。 无产品规格、额定隔声量或耐火极限。

复核日期：2026-10-29。四轮记录：

1. 核对官方公告或出版社现行目录，明确效力、适用对象及通用规范优先关系。
2. 阅读记录所列原文页与相关图线条款，确定可绘制范围。
3. 检查沿顶沿地与立筋连续、板缝落在竖龙骨翼缘、双侧面板及腔内填充层次；删除填充矩形边线造成的C形龙骨闭口假象。
4. SVG渲染、教材图注与网页桌面及手机表现复核；验证记录见本版审计截图。

依据：

- [GB 50210—2018 建筑装饰装修工程质量验收标准](https://jncc.jinan.gov.cn/attach/0/9d0c7e1be25747879ba1fe1771616ebc.pdf)，8.3.1～8.3.3、8.3.5～8.3.6、8.3.9；正文42～43页；济南政府PDF53～54页。材料按设计、周边龙骨连接、面板固定、板缝及腔内填充要求。龙骨形状和示意尺度不指定产品。 [版本与效力来源](https://ebook.chinabuilding.com.cn/zbooklib/book/detail/show?SiteID=1&bookID=105532)。
- [GB/T 50001—2017 房屋建筑制图统一标准](https://www.mohurd.gov.cn/gongkai/zc/wjk/art/2018/art_17339_234638.html)，4.0.1～4.0.2、7.3.1、9.1.2；正文13、22、28页；官方PDF19、28、34页。图线层次、引出线及小范围材料标识的教学表达；本图不按比例

图下注释与 SVG 元数据保存同一证据记录；成图见下方截图。标准使用范围限于所列教学表达，不据此宣称完整工程设计已获合规认证。

## 54 节逐课覆盖表

课程链接进入本地版本。主节点与关联节点分别统计；同一模型跨课使用不会增加可用节点总数。

| 序号 | 章节 / 课程 | 学习目标 | 知识单元 ID | 主 / 关联节点 | 先修单元 |
|---:|---|---|---|---:|---|
| 1 | 墙体 / [墙体概述](http://localhost:5173/#/lesson/basics/wall/index.html) | 用一张带窗外墙剖面，串起身份、材料、连接、性能与维护。 | wall.overview | 0 / 0 | 从本节问题开始 |
| 2 | 墙体 / [墙体在建筑中的作用](http://localhost:5173/#/lesson/basics/wall/wall-role.html) | 根据支承关系区分承重、围护与分隔，并解释非承重墙的必要连接。 | wall.roles | 1 / 0 | 从本节问题开始 |
| 3 | 墙体 / [墙体的类型](http://localhost:5173/#/lesson/basics/wall/wall-types.html) | 用位置、受力、材料和组合方式分别描述同一片墙。 | wall.materials | 1 / 0 | 从本节问题开始 |
| 4 | 墙体 / [砌体结构](http://localhost:5173/#/lesson/basics/wall/wall-masonry.html) | 从楼板支承解释四种布置，再用错缝、圈梁、构造柱和芯柱解释整体联系。 | wall.bearing、wall.integrity | 6 / 0 | 从本节问题开始 |
| 5 | 墙体 / [隔墙](http://localhost:5173/#/lesson/basics/wall/wall-partition.html) | 解释隔墙的自重支承、面外连接、顶部变形和声火边界。 | wall.partition | 0 / 0 | 从本节问题开始 |
| 6 | 墙体 / [墙体的设计要求](http://localhost:5173/#/lesson/basics/wall/wall-design-requirements.html) | 在同一墙身与洞口追踪结构、热湿、声火和维护要求，说明各层分工。 | wall.thermal、wall.solar | 3 / 0 | 从本节问题开始 |
| 7 | 墙体 / [墙体细部构造](http://localhost:5173/#/lesson/basics/wall/wall-details.html) | 把墙脚防潮、散水排水、洞口承托与安装缝接成连续路径。 | wall.damp、wall.surface-water、wall.opening-support、wall.window-joint | 7 / 0 | 从本节问题开始 |
| 8 | 墙体 / [墙面装修](http://localhost:5173/#/lesson/basics/wall/wall-finishes.html) | 从基层、连接与面层解释墙面缺陷，并把表面保护与墙身防潮分开。 | wall.finishes | 3 / 0 | 从本节问题开始 |
| 9 | 基础 / [基础与地基概述](http://localhost:5173/#/lesson/basics/foundation/foundation-overview.html) | 区分基础、地基与持力层，画出上部结构到土岩体的连续传力路线。 | foundation.path | 0 / 0 | 从本节问题开始 |
| 10 | 基础 / [基础与地基的设计要求](http://localhost:5173/#/lesson/basics/foundation/foundation-design.html) | 把承载、稳定、变形与耐久拆成可核查的问题，并说明还缺哪些场地资料。 | foundation.checks | 0 / 0 | foundation.path |
| 11 | 基础 / [基础的分类](http://localhost:5173/#/lesson/basics/foundation/foundation-types.html) | 比较独立、条形、筏形与桩基础的支承范围和传力机制，区分构造形式与材料分类。 | foundation.spread、foundation.raft、foundation.piles | 6 / 0 | foundation.checks |
| 12 | 基础 / [基础与地下结构的类型](http://localhost:5173/#/lesson/basics/foundation/foundation-underground.html) | 区分箱形基础与地下室，分别检查结构传力、抗浮和防水闭合。 | foundation.underground | 1 / 0 | foundation.raft、foundation.settlement |
| 13 | 基础 / [基础的埋置深度与影响因素](http://localhost:5173/#/lesson/basics/foundation/foundation-depth.html) | 在剖面中协调基底、地层、水位、地面及邻近基础，说明埋深选择的约束。 | foundation.depth | 0 / 0 | foundation.spread、foundation.piles |
| 14 | 基础 / [不均匀沉降](http://localhost:5173/#/lesson/basics/foundation/foundation-settlement.html) | 区分总沉降与差异沉降，提出调查证据并解释结构分缝与接口如何适应变形。 | foundation.settlement | 0 / 0 | foundation.depth |
| 15 | 楼地层 / [楼地层概述](http://localhost:5173/#/lesson/basics/floor/floor-overview.html) | 区分楼板层与实铺地面，将承重、面层及性能层放到同一剖面中解释。 | floor.system | 0 / 0 | foundation.path |
| 16 | 楼地层 / [钢筋混凝土楼板](http://localhost:5173/#/lesson/basics/floor/floor-rc-slab.html) | 比较肋梁、传统预制板、无梁楼板及钢板组合楼板的支承与连接，说明施工和使用阶段的区别。 | floor.precast、floor.ribbed、floor.flat、floor.composite | 7 / 0 | floor.system |
| 17 | 楼地层 / [地面的构造组成](http://localhost:5173/#/lesson/basics/floor/floor-ground-composition.html) | 按基层、垫层、结合与面层追踪荷载，并协调地面、墙脚和穿管的性能连续线。 | floor.layers | 0 / 0 | floor.system |
| 18 | 楼地层 / [地面层](http://localhost:5173/#/lesson/basics/floor/floor-ground-layer.html) | 依据使用环境选择面层，核查湿区水路、完成面标高与变形缝接口。 | floor.ground | 0 / 0 | floor.layers、floor.finishes |
| 19 | 楼地层 / [阳台及雨棚](http://localhost:5173/#/lesson/basics/floor/floor-balcony.html) | 分别核查悬挑支承、防护锚固和雨水排出，比较阳台与雨篷局部做法的适用边界。 | floor.cantilever、floor.railing、floor.canopy | 6 / 0 | floor.ribbed |
| 20 | 楼地层 / [建筑装修概论](http://localhost:5173/#/lesson/basics/floor/finish-overview.html) | 区分结构支承、连接、性能层和面层，并解释装修交接与施工顺序。 | floor.finishes | 0 / 0 | floor.layers |
| 21 | 楼地层 / [顶棚构造](http://localhost:5173/#/lesson/basics/floor/floor-ceiling.html) | 追踪吊顶面板到主体的承重路线，协调设备、防火、声学和检修。 | floor.ceiling | 0 / 0 | floor.system、floor.finishes |
| 22 | 楼梯 / [楼梯的基本概念及设计要求](http://localhost:5173/#/lesson/basics/stairs/stairs-overview.html) | 把行走路线、踏步计算和净空检查连接起来，能在平剖面中复核首层入口方案。 | stairs.route、stairs.clearance | 5 / 0 | floor.system |
| 23 | 楼梯 / [钢筋混凝土楼梯构造](http://localhost:5173/#/lesson/basics/stairs/stairs-rc-structure.html) | 辨认梯段、平台与主体的支承，比较直跑、弧形、螺旋及平台连接的受力边界。 | stairs.support、stairs.shapes、stairs.landings | 7 / 0 | stairs.route、floor.ribbed |
| 24 | 楼梯 / [楼梯的细部构造](http://localhost:5173/#/lesson/basics/stairs/stairs-details.html) | 协调首末步、防滑、栏杆及靠墙扶手，沿连接追踪到可靠基层。 | stairs.start、stairs.handrail | 6 / 0 | stairs.route、stairs.landings |
| 25 | 楼梯 / [台阶与坡道](http://localhost:5173/#/lesson/basics/stairs/stairs-steps-ramps.html) | 区分实铺与架空台阶，核查坡道层次及连续可达路线，解释入口的水与变形问题。 | stairs.steps、stairs.ramp、stairs.ramp-access | 5 / 0 | foundation.settlement、stairs.route |
| 26 | 楼梯 / [电梯及自动扶梯](http://localhost:5173/#/lesson/basics/stairs/stairs-elevator.html) | 区分电梯与扶梯的设备运动和建筑接口，列出井道、开口、支承、安全及检修的协调信息。 | stairs.elevator、stairs.escalator | 2 / 0 | stairs.route |
| 27 | 屋顶 / [屋顶概述](http://localhost:5173/#/lesson/basics/roof/roof-overview.html) | 把顶部结构、围护层和从坡面到出口的水路读成同一系统。 | roof.systems、roof.drainage | 4 / 0 | 从本节问题开始 |
| 28 | 屋顶 / [平屋面构造](http://localhost:5173/#/lesson/basics/roof/roof-flat.html) | 把层序、排水低点、泛水、落口和贯穿设施组成连续且可维护的平屋面。 | roof.layers、roof.outlets、roof.eaves、roof.flashing、roof.pipe、roof.access、roof.storage | 9 / 1 | roof.systems、roof.drainage |
| 29 | 屋顶 / [坡屋面构造](http://localhost:5173/#/lesson/basics/roof/roof-slope.html) | 分别解释屋架承重、瓦面导水、瓦下防水和边缘固定，并辨别屋脊分格缝的范围。 | roof.trusses、roof.tiles、roof.ridge-seams | 9 / 0 | roof.systems、roof.layers |
| 30 | 门窗 / [门窗的作用与分类](http://localhost:5173/#/lesson/basics/door-window/window-door-overview.html) | 分清洞口结构、门窗部品、开启方式与实际使用条件。 | openings.identity、openings.operation | 0 / 3 | 从本节问题开始 |
| 31 | 门窗 / [门窗的设计要求](http://localhost:5173/#/lesson/basics/door-window/window-door-design.html) | 把框墙连接、安装缝密封、热湿边缘及使用安全共同核验。 | openings.installation、openings.thermal、openings.safety | 0 / 1 | openings.identity、openings.operation |
| 32 | 变形缝 / [建筑变形缝的概念](http://localhost:5173/#/lesson/basics/deformation-joint/roof-deformation-concept.html) | 按预计运动与最终传力状态，区分主体变形缝、构造层分格缝、施工缝与后浇带。 | joints.purposes、joints.identity | 2 / 0 | 从本节问题开始 |
| 33 | 变形缝 / [变形缝的设置](http://localhost:5173/#/lesson/basics/deformation-joint/roof-deformation-location.html) | 由作用、地基、结构单元和预计运动判断设缝范围，区分名义净宽与安装后的可用行程。 | joints.location、joints.clearance | 0 / 0 | joints.purposes、joints.identity |
| 34 | 变形缝 / [变形缝的构造](http://localhost:5173/#/lesson/basics/deformation-joint/roof-deformation-construction.html) | 在允许相对运动的前提下，追踪屋面盖缝、围护、防火封堵和设备的连续性能。 | joints.high-low、joints.boundaries | 3 / 0 | joints.identity、joints.clearance、roof.flashing |
| 35 | 建筑绪论 / [课程导读](http://localhost:5173/#/lesson/introduction/intro-course-guide.html) | 从作用、层次、连接和图纸证据建立全书阅读方法。 | introduction.guide | 0 / 1 | 从本节问题开始 |
| 36 | 建筑绪论 / [建筑物的分类](http://localhost:5173/#/lesson/introduction/intro-classification.html) | 分开描述用途、结构、围护和建造方式，并说明各自依据。 | introduction.classification | 0 / 2 | introduction.guide |
| 37 | 建筑绪论 / [建筑物的分级](http://localhost:5173/#/lesson/introduction/intro-grading.html) | 区分建筑要求、构件性能和材料性能，建立分级证据表。 | introduction.grading | 0 / 0 | introduction.classification |
| 38 | 建筑绪论 / [建筑物的构造组成](http://localhost:5173/#/lesson/introduction/intro-composition.html) | 把构件名称接成支承、围护和交通的共同工作关系。 | introduction.composition | 0 / 2 | introduction.guide |
| 39 | 建筑绪论 / [影响建筑物的因素](http://localhost:5173/#/lesson/introduction/intro-factors.html) | 把气候、使用、技术和维护条件转换为节点检查任务。 | introduction.factors | 0 / 1 | introduction.classification、introduction.composition |
| 40 | 建筑绪论 / [建筑构造的设计原则](http://localhost:5173/#/lesson/introduction/intro-design-principles.html) | 用一个接口说明安全、使用、施工与维护要求怎样相容。 | introduction.design | 0 / 1 | introduction.composition、introduction.factors |
| 41 | 建筑绪论 / [专题：制图标准与规范](http://localhost:5173/#/lesson/introduction/intro-drawing-standards.html) | 在平剖面中核对同一构件的定位、标高、尺寸和索引。 | introduction.drawing | 0 / 1 | introduction.composition |
| 42 | 构造原理 / [建筑保温](http://localhost:5173/#/lesson/principles/thermal.html) | 区分实体传热、空气泄漏和热桥，并追踪连续热工边界。 | principles.thermal | 0 / 2 | introduction.composition |
| 43 | 构造原理 / [建筑防水](http://localhost:5173/#/lesson/principles/waterproof.html) | 按水源、路径、节点转换和保护维护解释连续防水。 | principles.waterproof | 0 / 2 | introduction.composition |
| 44 | 构造原理 / [建筑隔热](http://localhost:5173/#/lesson/principles/insulation.html) | 以热量进入、储存和排出解释夏季措施及运行约束。 | principles.insulation | 0 / 1 | principles.thermal |
| 45 | 构造原理 / [建筑隔声](http://localhost:5173/#/lesson/principles/acoustic.html) | 从声源到接收空间区分传播路径，并选择对应控制措施。 | principles.acoustic | 0 / 0 | introduction.composition |
| 46 | 构造原理 / [建筑防火](http://localhost:5173/#/lesson/principles/fire.html) | 区分材料与构件性能，在平剖面中追踪连续防火分隔。 | principles.fire | 0 / 0 | introduction.grading、introduction.composition |
| 47 | 构造原理 / [建筑防潮](http://localhost:5173/#/lesson/principles/moisture.html) | 区分毛细水、空气携湿与结露，解释防潮及干燥路径。 | principles.moisture | 0 / 1 | principles.thermal、principles.waterproof |
| 48 | 实践作业 / [构造方案说明](http://localhost:5173/#/lesson/practice/construction-brief.html) | 提交有条件、有比较、有节点证据且可追溯的构造方案说明。 | practice.brief | 0 / 1 | introduction.design、introduction.drawing |
| 49 | 实践作业 / [楼面构造布置](http://localhost:5173/#/lesson/practice/floor-layout.html) | 把楼板支承转成轴网布置，并核对洞口与结构、完成面标高。 | practice.floor-layout | 0 / 2 | introduction.composition、introduction.drawing |
| 50 | 实践作业 / [楼梯绘图](http://localhost:5173/#/lesson/practice/stairs-drawing.html) | 用同一层高和平台基准校核级数、平剖面与入口空间。 | practice.stairs-drawing | 0 / 2 | introduction.drawing |
| 51 | 实践作业 / [屋顶排水设计](http://localhost:5173/#/lesson/practice/roof-drainage.html) | 从汇水分区追到局部出口，提交正常与受阻情景的完整水路。 | practice.roof-drainage | 0 / 3 | principles.waterproof、introduction.drawing |
| 52 | 实践作业 / [外檐节点综合](http://localhost:5173/#/lesson/practice/envelope-detail.html) | 以两个实际接口核对固定、水路、热工边界和施工转换。 | practice.envelope-detail | 0 / 2 | principles.thermal、principles.waterproof、introduction.drawing |
| 53 | 实践作业 / [综合课程设计](http://localhost:5173/#/lesson/practice/integrated-design.html) | 在一套成果中统一条件并完成跨图纸修改闭环。 | practice.integrated-design | 0 / 0 | practice.brief、practice.floor-layout、practice.stairs-drawing、practice.roof-drainage、practice.envelope-detail |
| 54 | 实践作业 / [构造调研](http://localhost:5173/#/lesson/practice/construction-survey.html) | 以证据卡比较构造，把现场事实、资料确认和推测分开。 | practice.survey | 0 / 2 | introduction.composition、introduction.drawing |

## 93 个可用节点的唯一主教学位置

| 序号 | 节点 | 主课程 | 知识单元 ID | 其他课程联系 |
|---:|---|---|---|---|
| 1 | [平屋面构造](http://localhost:5173/#/node/flat-roof-01) · flat-roof-01 | [屋顶概述](http://localhost:5173/#/lesson/basics/roof/roof-overview.html?unit=roof.systems) | roof.systems | 课程导读 / introduction.guide；平屋面构造 / roof.layers |
| 2 | [框架结构布置](http://localhost:5173/#/node/frame-structure-layout-01) · frame-structure-layout-01 | [墙体在建筑中的作用](http://localhost:5173/#/lesson/basics/wall/wall-role.html?unit=wall.roles) | wall.roles | 建筑物的分类 / introduction.classification；构造调研 / practice.survey |
| 3 | [墙体承重结构布置方案（横墙承重）](http://localhost:5173/#/node/wall-bearing-transverse-01) · wall-bearing-transverse-01 | [砌体结构](http://localhost:5173/#/lesson/basics/wall/wall-masonry.html?unit=wall.bearing) | wall.bearing | 建筑物的分类 / introduction.classification；构造调研 / practice.survey |
| 4 | [现浇肋梁楼板](http://localhost:5173/#/node/cast-ribbed-floor-01) · cast-ribbed-floor-01 | [钢筋混凝土楼板](http://localhost:5173/#/lesson/basics/floor/floor-rc-slab.html?unit=floor.ribbed) | floor.ribbed | 建筑物的构造组成 / introduction.composition；楼面构造布置 / practice.floor-layout |
| 5 | [桩基组成](http://localhost:5173/#/node/pile-foundation-composition-01) · pile-foundation-composition-01 | [基础的分类](http://localhost:5173/#/lesson/basics/foundation/foundation-types.html?unit=foundation.piles) | foundation.piles | 建筑物的构造组成 / introduction.composition |
| 6 | [被动式太阳房墙体构造](http://localhost:5173/#/node/passive-solar-wall-01) · passive-solar-wall-01 | [墙体的设计要求](http://localhost:5173/#/lesson/basics/wall/wall-design-requirements.html?unit=wall.solar) | wall.solar | 影响建筑物的因素 / introduction.factors |
| 7 | [封堵窗墙间缝隙做法](http://localhost:5173/#/node/window-wall-gap-sealing-01) · window-wall-gap-sealing-01 | [墙体细部构造](http://localhost:5173/#/lesson/basics/wall/wall-details.html?unit=wall.window-joint) | wall.window-joint | 建筑构造的设计原则 / introduction.design；外檐节点综合 / practice.envelope-detail；门窗的设计要求 / openings.installation |
| 8 | [楼梯的组成](http://localhost:5173/#/node/stair-composition-01) · stair-composition-01 | [楼梯的基本概念及设计要求](http://localhost:5173/#/lesson/basics/stairs/stairs-overview.html?unit=stairs.route) | stairs.route | 专题：制图标准与规范 / introduction.drawing；楼梯绘图 / practice.stairs-drawing |
| 9 | [粘贴泡沫塑料保温板外保温](http://localhost:5173/#/node/foam-insulation-01) · foam-insulation-01 | [墙体的设计要求](http://localhost:5173/#/lesson/basics/wall/wall-design-requirements.html?unit=wall.thermal) | wall.thermal | 建筑保温 / principles.thermal；构造方案说明 / practice.brief |
| 10 | [粘贴岩棉防火保温板外保温](http://localhost:5173/#/node/rockwool-insulation-01) · rockwool-insulation-01 | [墙体的设计要求](http://localhost:5173/#/lesson/basics/wall/wall-design-requirements.html?unit=wall.thermal) | wall.thermal | 建筑保温 / principles.thermal |
| 11 | [涂膜防水屋面的女儿墙泛水](http://localhost:5173/#/node/coating-parapet-flashing-01) · coating-parapet-flashing-01 | [平屋面构造](http://localhost:5173/#/lesson/basics/roof/roof-flat.html?unit=roof.flashing) | roof.flashing | 建筑防水 / principles.waterproof；外檐节点综合 / practice.envelope-detail |
| 12 | [透气管出屋面](http://localhost:5173/#/node/vent-pipe-roof-01) · vent-pipe-roof-01 | [平屋面构造](http://localhost:5173/#/lesson/basics/roof/roof-flat.html?unit=roof.pipe) | roof.pipe | 建筑防水 / principles.waterproof |
| 13 | [蓄水屋面（檐沟式排水）](http://localhost:5173/#/node/water-storage-eaves-drainage-01) · water-storage-eaves-drainage-01 | [平屋面构造](http://localhost:5173/#/lesson/basics/roof/roof-flat.html?unit=roof.storage) | roof.storage | 建筑隔热 / principles.insulation |
| 14 | [墙身防潮层的位置](http://localhost:5173/#/node/wall-damp-proof-course) · wall-damp-proof-course | [墙体细部构造](http://localhost:5173/#/lesson/basics/wall/wall-details.html?unit=wall.damp) | wall.damp | 建筑防潮 / principles.moisture |
| 15 | [预制钢筋混凝土板（空心板）](http://localhost:5173/#/node/precast-hollow-slab-01) · precast-hollow-slab-01 | [钢筋混凝土楼板](http://localhost:5173/#/lesson/basics/floor/floor-rc-slab.html?unit=floor.precast) | floor.precast | 楼面构造布置 / practice.floor-layout |
| 16 | [底层中间平台下作出入口（底层长短跑）](http://localhost:5173/#/node/bottom-landing-entrance-01) · bottom-landing-entrance-01 | [楼梯的基本概念及设计要求](http://localhost:5173/#/lesson/basics/stairs/stairs-overview.html?unit=stairs.clearance) | stairs.clearance | 楼梯绘图 / practice.stairs-drawing |
| 17 | [檐沟外排水](http://localhost:5173/#/node/eaves-gutter-01) · eaves-gutter-01 | [屋顶概述](http://localhost:5173/#/lesson/basics/roof/roof-overview.html?unit=roof.drainage) | roof.drainage | 屋顶排水设计 / practice.roof-drainage |
| 18 | [直管式水落口（65 型水落口）](http://localhost:5173/#/node/straight-rainwater-outlet-65-01) · straight-rainwater-outlet-65-01 | [平屋面构造](http://localhost:5173/#/lesson/basics/roof/roof-flat.html?unit=roof.outlets) | roof.outlets | 屋顶排水设计 / practice.roof-drainage |
| 19 | [直管式水落口（铸铁水落口）](http://localhost:5173/#/node/straight-rainwater-outlet-cast-iron-01) · straight-rainwater-outlet-cast-iron-01 | [平屋面构造](http://localhost:5173/#/lesson/basics/roof/roof-flat.html?unit=roof.outlets) | roof.outlets | 屋顶排水设计 / practice.roof-drainage |
| 20 | [独立式基础三种形式](http://localhost:5173/#/node/independent-foundation-01) · independent-foundation-01 | [基础的分类](http://localhost:5173/#/lesson/basics/foundation/foundation-types.html?unit=foundation.spread) | foundation.spread | — |
| 21 | [联合基础（柱下条形基础）](http://localhost:5173/#/node/combined-foundation-column-strip-01) · combined-foundation-column-strip-01 | [基础的分类](http://localhost:5173/#/lesson/basics/foundation/foundation-types.html?unit=foundation.spread) | foundation.spread | — |
| 22 | [联合基础（柱下十字交叉基础）](http://localhost:5173/#/node/combined-foundation-column-cross-01) · combined-foundation-column-cross-01 | [基础的分类](http://localhost:5173/#/lesson/basics/foundation/foundation-types.html?unit=foundation.spread) | foundation.spread | — |
| 23 | [联合基础（板式基础）](http://localhost:5173/#/node/combined-foundation-slab-01) · combined-foundation-slab-01 | [基础的分类](http://localhost:5173/#/lesson/basics/foundation/foundation-types.html?unit=foundation.raft) | foundation.raft | — |
| 24 | [联合基础（梁板式基础）](http://localhost:5173/#/node/combined-foundation-beam-slab-01) · combined-foundation-beam-slab-01 | [基础的分类](http://localhost:5173/#/lesson/basics/foundation/foundation-types.html?unit=foundation.raft) | foundation.raft | — |
| 25 | [联合基础（箱形基础）](http://localhost:5173/#/node/combined-foundation-box-01) · combined-foundation-box-01 | [基础与地下结构的类型](http://localhost:5173/#/lesson/basics/foundation/foundation-underground.html?unit=foundation.underground) | foundation.underground | — |
| 26 | [空心砌块的常见形式](http://localhost:5173/#/node/hollow-block-forms-01) · hollow-block-forms-01 | [墙体的类型](http://localhost:5173/#/lesson/basics/wall/wall-types.html?unit=wall.materials) | wall.materials | — |
| 27 | [墙体承重结构布置方案（纵墙承重）](http://localhost:5173/#/node/wall-bearing-longitudinal-01) · wall-bearing-longitudinal-01 | [砌体结构](http://localhost:5173/#/lesson/basics/wall/wall-masonry.html?unit=wall.bearing) | wall.bearing | — |
| 28 | [墙体承重结构布置方案（纵横墙承重）](http://localhost:5173/#/node/wall-bearing-two-way-01) · wall-bearing-two-way-01 | [砌体结构](http://localhost:5173/#/lesson/basics/wall/wall-masonry.html?unit=wall.bearing) | wall.bearing | — |
| 29 | [墙体承重结构布置方案（半框架承重）](http://localhost:5173/#/node/wall-bearing-semi-frame-01) · wall-bearing-semi-frame-01 | [砌体结构](http://localhost:5173/#/lesson/basics/wall/wall-masonry.html?unit=wall.bearing) | wall.bearing | — |
| 30 | [构造柱](http://localhost:5173/#/node/construction-column-01) · construction-column-01 | [砌体结构](http://localhost:5173/#/lesson/basics/wall/wall-masonry.html?unit=wall.integrity) | wall.integrity | — |
| 31 | [砌块墙墙芯柱构造](http://localhost:5173/#/node/block-wall-core-column-01) · block-wall-core-column-01 | [砌体结构](http://localhost:5173/#/lesson/basics/wall/wall-masonry.html?unit=wall.integrity) | wall.integrity | — |
| 32 | [细石混凝土散水构造](http://localhost:5173/#/node/apron-flashing-01) · apron-flashing-01 | [墙体细部构造](http://localhost:5173/#/lesson/basics/wall/wall-details.html?unit=wall.surface-water) | wall.surface-water | — |
| 33 | [块石散水构造](http://localhost:5173/#/node/stone-apron-01) · stone-apron-01 | [墙体细部构造](http://localhost:5173/#/lesson/basics/wall/wall-details.html?unit=wall.surface-water) | wall.surface-water | — |
| 34 | [钢筋混凝土过梁（平墙过梁）](http://localhost:5173/#/node/rc-lintel-flush-01) · rc-lintel-flush-01 | [墙体细部构造](http://localhost:5173/#/lesson/basics/wall/wall-details.html?unit=wall.opening-support) | wall.opening-support | 门窗的作用与分类 / openings.identity |
| 35 | [钢筋混凝土过梁（带窗套过梁）](http://localhost:5173/#/node/rc-lintel-window-surround-01) · rc-lintel-window-surround-01 | [墙体细部构造](http://localhost:5173/#/lesson/basics/wall/wall-details.html?unit=wall.opening-support) | wall.opening-support | 门窗的作用与分类 / openings.identity |
| 36 | [钢筋混凝土过梁（带窗楣过梁）](http://localhost:5173/#/node/rc-lintel-window-hood-01) · rc-lintel-window-hood-01 | [墙体细部构造](http://localhost:5173/#/lesson/basics/wall/wall-details.html?unit=wall.opening-support) | wall.opening-support | 门窗的作用与分类 / openings.identity |
| 37 | [抹灰勒脚构造做法](http://localhost:5173/#/node/plaster-plinth-01) · plaster-plinth-01 | [墙面装修](http://localhost:5173/#/lesson/basics/wall/wall-finishes.html?unit=wall.finishes) | wall.finishes | — |
| 38 | [贴面勒脚构造做法](http://localhost:5173/#/node/faced-plinth-01) · faced-plinth-01 | [墙面装修](http://localhost:5173/#/lesson/basics/wall/wall-finishes.html?unit=wall.finishes) | wall.finishes | — |
| 39 | [石砌勒脚构造做法](http://localhost:5173/#/node/stone-plinth-01) · stone-plinth-01 | [墙面装修](http://localhost:5173/#/lesson/basics/wall/wall-finishes.html?unit=wall.finishes) | wall.finishes | — |
| 40 | [预制钢筋混凝土板（平板）](http://localhost:5173/#/node/precast-flat-slab-01) · precast-flat-slab-01 | [钢筋混凝土楼板](http://localhost:5173/#/lesson/basics/floor/floor-rc-slab.html?unit=floor.precast) | floor.precast | — |
| 41 | [预制钢筋混凝土板（正放槽形板）](http://localhost:5173/#/node/precast-upright-channel-slab-01) · precast-upright-channel-slab-01 | [钢筋混凝土楼板](http://localhost:5173/#/lesson/basics/floor/floor-rc-slab.html?unit=floor.precast) | floor.precast | — |
| 42 | [预制钢筋混凝土板（倒放槽形板）](http://localhost:5173/#/node/precast-inverted-channel-slab-01) · precast-inverted-channel-slab-01 | [钢筋混凝土楼板](http://localhost:5173/#/lesson/basics/floor/floor-rc-slab.html?unit=floor.precast) | floor.precast | — |
| 43 | [无梁楼板](http://localhost:5173/#/node/flat-slab-01) · flat-slab-01 | [钢筋混凝土楼板](http://localhost:5173/#/lesson/basics/floor/floor-rc-slab.html?unit=floor.flat) | floor.flat | — |
| 44 | [压型钢板组合楼板](http://localhost:5173/#/node/profiled-steel-composite-slab-01) · profiled-steel-composite-slab-01 | [钢筋混凝土楼板](http://localhost:5173/#/lesson/basics/floor/floor-rc-slab.html?unit=floor.composite) | floor.composite | — |
| 45 | [挑梁搭板三种构造](http://localhost:5173/#/node/cantilever-slab-01) · cantilever-slab-01 | [阳台及雨棚](http://localhost:5173/#/lesson/basics/floor/floor-balcony.html?unit=floor.cantilever) | floor.cantilever | — |
| 46 | [栏杆与阳台板的连接（预埋件焊接）](http://localhost:5173/#/node/balcony-railing-weld-01) · balcony-railing-weld-01 | [阳台及雨棚](http://localhost:5173/#/lesson/basics/floor/floor-balcony.html?unit=floor.railing) | floor.railing | — |
| 47 | [栏杆与阳台板的连接（榫接坐浆）](http://localhost:5173/#/node/balcony-railing-mortise-01) · balcony-railing-mortise-01 | [阳台及雨棚](http://localhost:5173/#/lesson/basics/floor/floor-balcony.html?unit=floor.railing) | floor.railing | — |
| 48 | [栏杆与阳台板的连接（插筋连接）](http://localhost:5173/#/node/balcony-railing-dowel-01) · balcony-railing-dowel-01 | [阳台及雨棚](http://localhost:5173/#/lesson/basics/floor/floor-balcony.html?unit=floor.railing) | floor.railing | — |
| 49 | [悬挑雨篷构造（悬挑板式）](http://localhost:5173/#/node/cantilever-canopy-slab-01) · cantilever-canopy-slab-01 | [阳台及雨棚](http://localhost:5173/#/lesson/basics/floor/floor-balcony.html?unit=floor.canopy) | floor.canopy | — |
| 50 | [悬挑雨篷构造（外檐加高）](http://localhost:5173/#/node/cantilever-canopy-raised-eaves-01) · cantilever-canopy-raised-eaves-01 | [阳台及雨棚](http://localhost:5173/#/lesson/basics/floor/floor-balcony.html?unit=floor.canopy) | floor.canopy | — |
| 51 | [底层中间平台下作出入口（局部降低地坪）](http://localhost:5173/#/node/bottom-landing-entrance-02) · bottom-landing-entrance-02 | [楼梯的基本概念及设计要求](http://localhost:5173/#/lesson/basics/stairs/stairs-overview.html?unit=stairs.clearance) | stairs.clearance | — |
| 52 | [底层中间平台下作出入口（底层长短跑并局部降低地坪）](http://localhost:5173/#/node/bottom-landing-entrance-03) · bottom-landing-entrance-03 | [楼梯的基本概念及设计要求](http://localhost:5173/#/lesson/basics/stairs/stairs-overview.html?unit=stairs.clearance) | stairs.clearance | — |
| 53 | [底层中间平台下作出入口（底层直跑）](http://localhost:5173/#/node/bottom-landing-entrance-04) · bottom-landing-entrance-04 | [楼梯的基本概念及设计要求](http://localhost:5173/#/lesson/basics/stairs/stairs-overview.html?unit=stairs.clearance) | stairs.clearance | — |
| 54 | [折行双跑楼梯构造](http://localhost:5173/#/node/dogleg-stair-01) · dogleg-stair-01 | [钢筋混凝土楼梯构造](http://localhost:5173/#/lesson/basics/stairs/stairs-rc-structure.html?unit=stairs.support) | stairs.support | — |
| 55 | [圆弧形楼梯构造](http://localhost:5173/#/node/curved-stair-01) · curved-stair-01 | [钢筋混凝土楼梯构造](http://localhost:5173/#/lesson/basics/stairs/stairs-rc-structure.html?unit=stairs.shapes) | stairs.shapes | — |
| 56 | [螺旋形楼梯构造](http://localhost:5173/#/node/spiral-stair-01) · spiral-stair-01 | [钢筋混凝土楼梯构造](http://localhost:5173/#/lesson/basics/stairs/stairs-rc-structure.html?unit=stairs.shapes) | stairs.shapes | — |
| 57 | [梯段与平台梁节点处理（梯段齐步不埋步）](http://localhost:5173/#/node/stair-flight-flush-unburied-01) · stair-flight-flush-unburied-01 | [钢筋混凝土楼梯构造](http://localhost:5173/#/lesson/basics/stairs/stairs-rc-structure.html?unit=stairs.landings) | stairs.landings | — |
| 58 | [梯段与平台梁节点处理（梯段错一步）](http://localhost:5173/#/node/stair-flight-offset-one-01) · stair-flight-offset-one-01 | [钢筋混凝土楼梯构造](http://localhost:5173/#/lesson/basics/stairs/stairs-rc-structure.html?unit=stairs.landings) | stairs.landings | — |
| 59 | [梯段与平台梁节点处理（梯段错多步）](http://localhost:5173/#/node/stair-flight-offset-multiple-01) · stair-flight-offset-multiple-01 | [钢筋混凝土楼梯构造](http://localhost:5173/#/lesson/basics/stairs/stairs-rc-structure.html?unit=stairs.landings) | stairs.landings | — |
| 60 | [梯段与平台梁节点处理（梯段齐步并埋步）](http://localhost:5173/#/node/stair-flight-flush-buried-01) · stair-flight-flush-buried-01 | [钢筋混凝土楼梯构造](http://localhost:5173/#/lesson/basics/stairs/stairs-rc-structure.html?unit=stairs.landings) | stairs.landings | — |
| 61 | [楼梯起步处理（圆头踏步与连续回弯扶手）](http://localhost:5173/#/node/stair-start-rounded-return-handrail-01) · stair-start-rounded-return-handrail-01 | [楼梯的细部构造](http://localhost:5173/#/lesson/basics/stairs/stairs-details.html?unit=stairs.start) | stairs.start | — |
| 62 | [楼梯起步处理（直边踏步与下折回接扶手）](http://localhost:5173/#/node/stair-start-straight-folded-handrail-01) · stair-start-straight-folded-handrail-01 | [楼梯的细部构造](http://localhost:5173/#/lesson/basics/stairs/stairs-details.html?unit=stairs.start) | stairs.start | — |
| 63 | [扶手与墙面的连接（混凝土预埋板弯管托架）](http://localhost:5173/#/node/handrail-wall-bent-bracket-01) · handrail-wall-bent-bracket-01 | [楼梯的细部构造](http://localhost:5173/#/lesson/basics/stairs/stairs-details.html?unit=stairs.handrail) | stairs.handrail | — |
| 64 | [扶手与墙面的连接（混凝土预埋板端部连接）](http://localhost:5173/#/node/handrail-wall-end-plate-01) · handrail-wall-end-plate-01 | [楼梯的细部构造](http://localhost:5173/#/lesson/basics/stairs/stairs-details.html?unit=stairs.handrail) | stairs.handrail | — |
| 65 | [扶手与墙面的连接（砖墙入墙分叉扁钢）](http://localhost:5173/#/node/handrail-brick-wall-forked-bar-01) · handrail-brick-wall-forked-bar-01 | [楼梯的细部构造](http://localhost:5173/#/lesson/basics/stairs/stairs-details.html?unit=stairs.handrail) | stairs.handrail | — |
| 66 | [扶手与墙面的连接（砖墙弯管托架与木垫块）](http://localhost:5173/#/node/handrail-brick-wall-wood-pad-bracket-01) · handrail-brick-wall-wood-pad-bracket-01 | [楼梯的细部构造](http://localhost:5173/#/lesson/basics/stairs/stairs-details.html?unit=stairs.handrail) | stairs.handrail | — |
| 67 | [混凝土台阶](http://localhost:5173/#/node/concrete-steps-01) · concrete-steps-01 | [台阶与坡道](http://localhost:5173/#/lesson/basics/stairs/stairs-steps-ramps.html?unit=stairs.steps) | stairs.steps | — |
| 68 | [钢筋混凝土架空台阶](http://localhost:5173/#/node/rc-elevated-steps-01) · rc-elevated-steps-01 | [台阶与坡道](http://localhost:5173/#/lesson/basics/stairs/stairs-steps-ramps.html?unit=stairs.steps) | stairs.steps | — |
| 69 | [坡道地面构造做法（一）](http://localhost:5173/#/node/ramp-floor-01) · ramp-floor-01 | [台阶与坡道](http://localhost:5173/#/lesson/basics/stairs/stairs-steps-ramps.html?unit=stairs.ramp) | stairs.ramp | — |
| 70 | [坡道地面构造做法（二）](http://localhost:5173/#/node/ramp-floor-02) · ramp-floor-02 | [台阶与坡道](http://localhost:5173/#/lesson/basics/stairs/stairs-steps-ramps.html?unit=stairs.ramp) | stairs.ramp | — |
| 71 | [坡道扶手](http://localhost:5173/#/node/ramp-handrail-01) · ramp-handrail-01 | [台阶与坡道](http://localhost:5173/#/lesson/basics/stairs/stairs-steps-ramps.html?unit=stairs.ramp-access) | stairs.ramp-access | — |
| 72 | [电梯构造组成](http://localhost:5173/#/node/elevator-composition-01) · elevator-composition-01 | [电梯及自动扶梯](http://localhost:5173/#/lesson/basics/stairs/stairs-elevator.html?unit=stairs.elevator) | stairs.elevator | — |
| 73 | [自动扶梯构造](http://localhost:5173/#/node/escalator-01) · escalator-01 | [电梯及自动扶梯](http://localhost:5173/#/lesson/basics/stairs/stairs-elevator.html?unit=stairs.escalator) | stairs.escalator | — |
| 74 | [无组织排水屋顶](http://localhost:5173/#/node/roof-drainage-01) · roof-drainage-01 | [屋顶概述](http://localhost:5173/#/lesson/basics/roof/roof-overview.html?unit=roof.drainage) | roof.drainage | — |
| 75 | [有组织排水屋顶](http://localhost:5173/#/node/organized-drainage-01) · organized-drainage-01 | [屋顶概述](http://localhost:5173/#/lesson/basics/roof/roof-overview.html?unit=roof.drainage) | roof.drainage | — |
| 76 | [自由落水檐口（圈梁带挑檐板）](http://localhost:5173/#/node/free-fall-ring-beam-eaves-01) · free-fall-ring-beam-eaves-01 | [平屋面构造](http://localhost:5173/#/lesson/basics/roof/roof-flat.html?unit=roof.eaves) | roof.eaves | — |
| 77 | [自由落水檐口（防水层直接悬挑）](http://localhost:5173/#/node/free-fall-waterproof-eaves-01) · free-fall-waterproof-eaves-01 | [平屋面构造](http://localhost:5173/#/lesson/basics/roof/roof-flat.html?unit=roof.eaves) | roof.eaves | — |
| 78 | [屋面检修口](http://localhost:5173/#/node/roof-access-hatch-01) · roof-access-hatch-01 | [平屋面构造](http://localhost:5173/#/lesson/basics/roof/roof-flat.html?unit=roof.access) | roof.access | — |
| 79 | [蓄水屋面（女儿墙外排水）](http://localhost:5173/#/node/water-storage-parapet-drainage-01) · water-storage-parapet-drainage-01 | [平屋面构造](http://localhost:5173/#/lesson/basics/roof/roof-flat.html?unit=roof.storage) | roof.storage | — |
| 80 | [屋架形式（木屋架）](http://localhost:5173/#/node/roof-truss-timber-01) · roof-truss-timber-01 | [坡屋面构造](http://localhost:5173/#/lesson/basics/roof/roof-slope.html?unit=roof.trusses) | roof.trusses | — |
| 81 | [屋架形式（钢筋混凝土屋架）](http://localhost:5173/#/node/roof-truss-reinforced-concrete-01) · roof-truss-reinforced-concrete-01 | [坡屋面构造](http://localhost:5173/#/lesson/basics/roof/roof-slope.html?unit=roof.trusses) | roof.trusses | — |
| 82 | [屋架形式（钢木屋架）](http://localhost:5173/#/node/roof-truss-steel-timber-01) · roof-truss-steel-timber-01 | [坡屋面构造](http://localhost:5173/#/lesson/basics/roof/roof-slope.html?unit=roof.trusses) | roof.trusses | — |
| 83 | [坡屋顶构造](http://localhost:5173/#/node/sloped-roof-01) · sloped-roof-01 | [坡屋面构造](http://localhost:5173/#/lesson/basics/roof/roof-slope.html?unit=roof.tiles) | roof.tiles | — |
| 84 | [钢挂瓦条块瓦屋面构造](http://localhost:5173/#/node/steel-batten-tile-roof-01) · steel-batten-tile-roof-01 | [坡屋面构造](http://localhost:5173/#/lesson/basics/roof/roof-slope.html?unit=roof.tiles) | roof.tiles | — |
| 85 | [木挂瓦条块瓦屋面构造](http://localhost:5173/#/node/wood-batten-tile-roof-01) · wood-batten-tile-roof-01 | [坡屋面构造](http://localhost:5173/#/lesson/basics/roof/roof-slope.html?unit=roof.tiles) | roof.tiles | — |
| 86 | [砂浆卧瓦块瓦屋面构造](http://localhost:5173/#/node/mortar-bed-tile-roof-01) · mortar-bed-tile-roof-01 | [坡屋面构造](http://localhost:5173/#/lesson/basics/roof/roof-slope.html?unit=roof.tiles) | roof.tiles | — |
| 87 | [刚性防水屋面屋脊分格缝（一）](http://localhost:5173/#/node/rigid-roof-ridge-joint-01) · rigid-roof-ridge-joint-01 | [坡屋面构造](http://localhost:5173/#/lesson/basics/roof/roof-slope.html?unit=roof.ridge-seams) | roof.ridge-seams | — |
| 88 | [刚性防水屋面屋脊分格缝（二）](http://localhost:5173/#/node/rigid-roof-ridge-joint-02) · rigid-roof-ridge-joint-02 | [坡屋面构造](http://localhost:5173/#/lesson/basics/roof/roof-slope.html?unit=roof.ridge-seams) | roof.ridge-seams | — |
| 89 | [刚性防水屋面横向分格缝（一）](http://localhost:5173/#/node/rigid-roof-transverse-joint-01) · rigid-roof-transverse-joint-01 | [建筑变形缝的概念](http://localhost:5173/#/lesson/basics/deformation-joint/roof-deformation-concept.html?unit=joints.identity) | joints.identity | — |
| 90 | [刚性防水屋面横向分格缝（二）](http://localhost:5173/#/node/rigid-roof-transverse-joint-02) · rigid-roof-transverse-joint-02 | [建筑变形缝的概念](http://localhost:5173/#/lesson/basics/deformation-joint/roof-deformation-concept.html?unit=joints.identity) | joints.identity | — |
| 91 | [高低屋面变形缝（一）](http://localhost:5173/#/node/high-low-roof-joint-01) · high-low-roof-joint-01 | [变形缝的构造](http://localhost:5173/#/lesson/basics/deformation-joint/roof-deformation-construction.html?unit=joints.high-low) | joints.high-low | — |
| 92 | [高低屋面变形缝（二）](http://localhost:5173/#/node/high-low-roof-joint-02) · high-low-roof-joint-02 | [变形缝的构造](http://localhost:5173/#/lesson/basics/deformation-joint/roof-deformation-construction.html?unit=joints.high-low) | joints.high-low | — |
| 93 | [涂膜防水屋面高低屋面的泛水](http://localhost:5173/#/node/coating-high-low-roof-flashing-01) · coating-high-low-roof-flashing-01 | [变形缝的构造](http://localhost:5173/#/lesson/basics/deformation-joint/roof-deformation-construction.html?unit=joints.high-low) | joints.high-low | — |

## 技术与浏览器验收

验收范围：108 条浏览器记录覆盖 54 节课程在两个视口的页面载入；另选代表性知识单元检查教材返回和手机构件切换。93 个节点的完整覆盖由教学关系、真实构件对象键、资源引用及模型哈希自动校验提供，逐节点全部旋转角度与全部功能的人工视觉检查不在此记录中。

| 检查 | 状态 | 证据与范围 |
|---|---|---|
| npm run build | 通过 | 课程生成、TypeScript 类型检查及根路径生产构建 |
| npm run test:curriculum | 通过 | 54 节、88 单元、93 主归属、124 关系、66 懒画布、99 模型哈希；墙体图文与依据一致 |
| npm run test:textbook | 通过 | 教材完整性、章节对象、资源与链接、实践任务、托管路径检查 |
| npm run test:companion | 通过 | 构造伙伴的知识单元来源、节点语境与证据边界 |
| npm run test:viewport-camera-motion | 通过 | 双向适配、打断、零尺寸、30/60/120 fps × 3 种缩放 × 4 轮过渡 |
| node-definition-contract / node-assets | 通过 | 构件定义契约及 385 项模型/图片资源引用 |
| 修改文件 ESLint 检查 | 通过 | 本次共享组件、导航、生成器及课程数据 |
| 桌面 1440 px / 手机 392 px 浏览器检查 | 通过 | 54 × 2 = 108 次课程加载；未出现加载错误或页面横向溢出 |
| 手机知识区与教材返回 | 通过 | 不同长度构件正文高度均为 220 px，模型画布均为 219 px；知识位置及折叠状态恢复 |
| GitHub Pages 子路径生产浏览器 | 通过 | /textbook/ 生产预览：课程、图示、模型就绪及返回原知识位置 |

- 54 节分别在桌面 1440 px 和手机 392 px 加载，共 108 次，未出现错误页。检查仅声明实际覆盖的视口与操作。
- 手机知识区切换“保温板”和“胶粘剂”，正文均 220 px，模型画布均 219 px；长短文字不改变正文区域固定高度，更多内容内部滚动；该视口下切换未产生页面横向溢出。
- 桌面从楼板比较单元进入节点，再返回同一知识单元，折叠状态及阅读滚动恢复；手机模型知识区显示正确来源课程。
- test:textbook:digital:archive 与 test:textbook:digital:browser:archive 均保留历史 10 节 / 21 节点试点冻结基线，分别用于旧版内容与浏览器追溯。现版本使用 test:curriculum 和本报告的 54 节 / 93 节点检查记录，没有改写旧基线来掩盖全书升级。
- 生产构建仍提示部分 JavaScript 分块较大，构建已通过。当前性能证据覆盖代表性交互回归；全 93 个节点在移动端的首次加载时间、内存占用与连续旋转帧率尚未建立逐项量化基线，不能据本报告推断全部设备上的性能表现。

子路径生产验收已通过：实际构建并运行 `/textbook/` 前缀版本，走通墙体课程 → 防潮节点 → 原知识单元；模型画布与相机就绪，课程 iframe、图示及返回链接均保留前缀，无运行错误或页面横向溢出。完成后本地课程根路径已恢复。记录：[构建](subpath-build.json)、[浏览器](subpath-browser.json)、[生产截图](screenshots/production-subpath-node.png)。

## 验证截图

### 桌面课程：问题、原理、模型观察与自测形成连续路径

![桌面课程：问题、原理、模型观察与自测形成连续路径](screenshots/desktop-learning-unit.png)

### 手机节点：教材来源及知识位置，正文内部滚动

![手机节点：教材来源及知识位置，正文内部滚动](screenshots/mobile-node-context.png)

### 手机实践：任务、提交物与自评标准

![手机实践：任务、提交物与自评标准](screenshots/mobile-practice.png)

### 墙身防潮：外墙地面与室内高差两种独立场景

![墙身防潮：外墙地面与室内高差两种独立场景](screenshots/diagram-wall-paths.png)

### 烧结普通砖局部立面：错缝与连续竖缝反例

![烧结普通砖局部立面：错缝与连续竖缝反例](screenshots/diagram-masonry-bond.png)

### 隔墙：局部立面与水平横剖面的组成及支承

![隔墙：局部立面与水平横剖面的组成及支承](screenshots/diagram-partition.png)

## 记录与复现

- 共享关系：src/data/curriculumLearning.json；规范记录：src/data/diagramEvidence.json；模型哈希基线：tests/fixtures/curriculum-model-baseline-2026-10-29.json。
- 按章生成入口：npm run build:pages:chapters -- --chapters=wall。只处理选中章节并校验未选内容。
- 全量验收：npm run test:curriculum、npm run test:textbook、npm run test:companion、npm run test:viewport-camera-motion、npm run build。
- 四批生成记录在 batches/，浏览器记录在 browser-checks.json，截图在 screenshots/。
- 历史基线：[2026-10-27 教材与模型知识体系审计](../knowledge-model-integration-2026-10-27/index.html)、[2026-10-15 全站 UI 审计](../site-ui-audit-2026-10-15/index.html)。旧报告保持原样。

各节点实例用于教学解释，不替代具体工程的设计、计算与审查。
