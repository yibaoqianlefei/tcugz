# 前半教材审计（绪论、基础、墙体、门窗）

审计日期：2026-10-12。审计范围为 23 篇现行 Markdown（绪论 7、基础 6、墙体 8、门窗 2），逐页通读；对照前四讲归位方案与原讲义关键段落回查，并检查共用防火页、构造方案说明及外檐实践是否已经承担缺失内容。只读正文和代码，未改教材、公共页面或生成脚本。

**结论：首版文字稿已经能提供清楚、谨慎的概念与构造原理概述；本组未发现 P1 严重误导。记录 6 项 P2 重要教学缺口、2 项 P3 完善项。**主要差距是等级查表、材料符号、图纸识读、尺寸排块和完整案例，不能仅凭“全部源段落已分配”判断教材能力完整。

旧稿的错误、过时或无条件阈值不需要原样恢复。本报告只要求对保留的学习目标补上适用条件、例子与练习；原图未补齐已经公开披露，未按每页缺图重复计问题。P 编号为提取段落定位，不是 Word 页码。本文不是条文级工程规范认证。

## 章节能力与教材级补齐重点

| 章节 | 已有能力 | 优先补齐 | 对应问题 |
| --- | --- | --- | --- |
| 绪论（7 页） | 课程导读、分类维度、构成传力、因素与设计原则已能自足解释；耐火/抗震/年限对象没有混用。 | 分级查表示例；制图/模数基础图纸与条件化尺寸练习；有版本的标准入口。 | FH-01、FH-02、FH-07 |
| 基础（6 页） | 地基/基础、作用与受力检查、基础型式、水/冻胀/相邻开挖、沉降与地下防护的因果关系齐备。 | 一个简化勘察—方案比较—基础剖面—地下节点案例，供读图与追踪防水线。 | FH-06 |
| 墙体（8 页，含章导言与饰面） | 墙角色与分类、砌体、节点、隔墙、性能与饰面已经组织成清楚学习顺序；旧高厚比和顶部矛盾已修正，模型链接可补充四类内容。 | 材料符号识读；组砌/转角/排块及洞口尺寸链的图例；目标与实际任务对接。 | FH-03、FH-04、FH-08 |
| 门窗（2 页） | 功能分类、框扇玻璃、整窗性能、净尺寸、四类缝、固定/填缝、遮阳与维护讲解全面。 | 一樘教学窗的平立剖/窗表/开启图例、面积口径、净尺寸和缝隙定位练习。 | FH-05 |

## 已确认问题

### FH-01 [P2] 分级页尚不能带学生完成一次等级查表与选择

定位：[intro-grading.md:13](<D:/vscode project/建筑构造交互教材/src/data/textbook/introduction/intro-grading.md:13>)；相关 [intro-grading.md:25](<D:/vscode project/建筑构造交互教材/src/data/textbook/introduction/intro-grading.md:25>)、[construction-brief.md:16](<D:/vscode project/建筑构造交互教材/src/data/textbook/practice/construction-brief.md:16>)。源段：P0312–P0366。

证据短摘：“建筑耐火等级则是对建筑主要构件耐火性能等要求的综合规定”；“具体数值结合工程采用的标准和设计文件查阅”。

原稿对应：P0313–0343 原稿设置耐火级别及主要构件对照；P0356–0361 设置设计使用年限的分类与表。原表有旧版、缺表和错误，不能直接恢复。

观察：本页准确区分了燃烧性能、耐火极限、耐火等级、年限和抗震术语，但全文没有任何实际耐火级别名称清单、按对象组织的年限类别表，或一段指定用途、引用条文、解释构件要求的查表示例。共用防火页也只讲原理。实践方案说明要求分别列出相关等级，前置教材却主要教“不能混用”。

影响：学生可回答概念辨析，仍无法练习从建筑条件读到等级、再落实到墙板门等构件的过程；原讲义分级教学的核心应用尚未闭合。

建议：选一个条件明确的教学建筑，补“用途与高度口径—所查标准及条款—采用级别—主要构件任务”的完整示例；年限用经复核的类别表或设计说明样本解释主体与部品的不同周期。不要恢复原稿未经核实的旧阈值，也不要以一个材料名称代替等级判断。

状态：确认缺项；具体级别、年限和数值需随后按现行适用标准复核。

### FH-02 [P2] 制图与模数页缺少可照着读、可照着画的最小图纸样例

定位：[intro-drawing-standards.md:21](<D:/vscode project/建筑构造交互教材/src/data/textbook/introduction/intro-drawing-standards.md:21>)；相关 [intro-drawing-standards.md:11](<D:/vscode project/建筑构造交互教材/src/data/textbook/introduction/intro-drawing-standards.md:11>)、[intro-drawing-standards.md:41](<D:/vscode project/建筑构造交互教材/src/data/textbook/introduction/intro-drawing-standards.md:41>)。源段：P0429–P0494。

证据短摘：“定位轴线帮助确定主要构件在空间中的位置”；“根据详图索引找到节点”。

原稿对应：P0440–0449 原稿展开扩大模数、分模数与数列；P0463–0476 展开网络、轴线与三种尺寸；P0486–0492 强调标注。旧数列适用范围需核验，图像未提取。

观察：正文有基本模数、三种尺寸表和 1200−2×10=1180 mm 的有效教学算例，但没有扩大模数/分模数的具体换算例、带轴线和尺寸链的简图、标高符号、详图索引及必要线型图例。现有三道自测全部是文字辨析。门窗设计页也只给读图顺序，未补回这些基础表达。

影响：读者知道需要核对什么，却缺少“符号如何读、尺寸怎样闭合、索引如何找到对应详图”的可复现训练；无法凭本页独立开始节点绘制。

建议：补一张简化平剖面及对应局部详图，明确图例、轴线、尺寸和标高单位、索引关系；在同一实例上加入 3M/分模数等经标准核对的换算及一道尺寸链题。保留当前对安装缝与公差的条件说明。

状态：确认缺项；拟补表达规则和数列范围应核对国家制图及模数标准。

### FH-03 [P2] 砌体材料强度只提“等级符号”，没有教读实际符号

定位：[wall-masonry.md:15](<D:/vscode project/建筑构造交互教材/src/data/textbook/walls/wall-masonry.md:15>)。源段：P0735–P0742、P0746–P0756、P0763–P0781。

证据短摘：“块材的等级符号、砂浆的等级符号和砌体设计强度，属于不同对象”。

原稿对应：原稿 P0739/0740 展示 MU 及块材对象；P0774/0775 展示 M 及砂浆对象；P0781 为损坏的砌体强度对照表。

观察：这句正确指出对象不同，却没有写出任何块材或砂浆等级符号示例。23 页通读及全教材关键词搜索确认，MU 和砌筑砂浆 M 的识读未由其他文字页承担。砌体设计强度不可取算术平均值的纠正已保留。

影响：学生遇到材料做法表、结构说明或排块说明中的强度标注时，仍不能依据本站教材判断标注对象；“提高材料等级”的后文也缺少具体识读基础。

建议：补一个经产品/设计标准复核的短材料表，以两类实际标注说明“符号—对象—单位—按哪个标准检验”，并出一道分辨块材等级、砂浆等级与砌体设计强度的题。不必恢复旧稿所有等级序列或坏表，更不要据例子给出工程配方。

状态：确认缺项；具体示例与等级序列待现行材料标准核验。

### FH-04 [P2] 组砌与排块已解释原则，但缺少识别通缝和做尺寸协调的实例

定位：[wall-masonry.md:21](<D:/vscode project/建筑构造交互教材/src/data/textbook/walls/wall-masonry.md:21>)；相关 [wall-masonry.md:27](<D:/vscode project/建筑构造交互教材/src/data/textbook/walls/wall-masonry.md:27>)、[wall-masonry.md:39](<D:/vscode project/建筑构造交互教材/src/data/textbook/walls/wall-masonry.md:39>)。源段：P0732–P0734、P0753–P0756、P0782–P0823。

证据短摘：“传统砖墙有全顺、一顺一丁、梅花丁和多顺一丁等排列”；“排块图是在平面与立面上预先安排块材”。

原稿对应：P0783–0801 原稿主讲砖组砌及转角；P0802–0808 主讲砌块排布；P0810–0823 主讲墙厚、灰缝及洞口尺度。

观察：页面列出组砌名称和错缝要求，也给出排块流程，但没有两皮平面/立面的正误图、转角或丁字交接示意，以及一组明确为教学假定的块材尺寸、灰缝和洞口尺寸。链接的空心砌块常见形式模型用于孔型比较，正文也明确其用途；它没有在本页承担上述排块实例。

影响：读者能复述避免通缝，仍难以区分表面错缝与墙厚方向搭接，也不能实际完成一段墙的排块与洞口协调。原讲义材料—组砌—尺度的学习链停在说明层。

建议：用一种明确产品或假定块材尺寸，补两皮排块图、一个转角/丁字交接图及一个洞口尺寸链；给出错缝/通缝对照和短答案。不把某一产品尺寸、灰缝或墙厚推广到所有材料体系。

状态：确认缺项；原图尚未补齐已在导读披露，本项只登记组砌排块这一具体教学能力。

### FH-05 [P2] 门窗识图、面积口径和安装缝没有形成一个完整教学窗口案例

定位：[window-door-design.md:62](<D:/vscode project/建筑构造交互教材/src/data/textbook/door-window/window-door-design.md:62>)；相关 [window-door-design.md:7](<D:/vscode project/建筑构造交互教材/src/data/textbook/door-window/window-door-design.md:7>)、[window-door-design.md:11](<D:/vscode project/建筑构造交互教材/src/data/textbook/door-window/window-door-design.md:11>)、[window-door-design.md:35](<D:/vscode project/建筑构造交互教材/src/data/textbook/door-window/window-door-design.md:35>)。源段：P1241–P1247、P1274–P1300、P1445–P1479。

证据短摘：“开启线的含义应结合适用制图约定、图例和内外视方向”；“计算时应明确边界和采用的面积”。

原稿对应：P1278 区分窗地比、玻地比、窗墙比；P1288–1300 安排平立剖和开启线表达；P1445–1479 安排安装及四类缝。原稿开启线一概实虚线规则和面积旧阈值不应照录。

观察：现页把四种尺寸、三种面积比、四类缝和图纸核对串联得较好，但无门窗表行样本、开启立面图例、室内外视方向标记、安装剖面，或给定边界的面积计算。自测只问洞口与净宽、发泡固定、故障区分及功能核查，不能检验图面辨认与尺寸/面积计算。外檐实践任务要求使用自己的方案，没有替代这个初学者可直接练习的窗口案例。

影响：读者仍不能通过本站完成“由编号找到窗表—认开启—算有效口径—定位缝隙—检查窗台排水”的一次完整操作。

建议：补一个带平面位置、窗表、外视立面和安装剖面的教学窗，写清面积与净尺寸口径；给至少一题开启识读、一题面积/尺寸链、一题四类缝定位，附短答案。只对教学窗给已说明的假定，不恢复通用最低宽度和旧窗墙比。

状态：确认缺项；门窗开启符号及工程参数需按采用标准与具体系统核验。

### FH-06 [P2] 基础六页缺少把地层、基础选型与地下防护连起来的可用剖面案例

定位：[foundation-design.md:29](<D:/vscode project/建筑构造交互教材/src/data/textbook/foundation/foundation-design.md:29>)；相关 [foundation-types.md:11](<D:/vscode project/建筑构造交互教材/src/data/textbook/foundation/foundation-types.md:11>)、[foundation-depth.md:37](<D:/vscode project/建筑构造交互教材/src/data/textbook/foundation/foundation-depth.md:37>)、[foundation-underground.md:17](<D:/vscode project/建筑构造交互教材/src/data/textbook/foundation/foundation-underground.md:17>)。源段：P1491–P1513、P1533–P1621、P1622–P1690、P1694–P1743。

证据短摘：“先读地层剖面及钻孔资料，识别持力层和软弱下卧层”；“绘制一条连续的防水线”。

原稿对应：原稿基础示意、岩土条件、型式和放阶多依赖书图；地下室仅 P1687–1690 四段，本版新增防水/抗浮等原理属于必要补写。

观察：六页准确界定地基/基础、不同受力/工艺维度、水位与冻胀、差异沉降、防水与抗浮；概述还给出有效的 p=N/A 教学算例。但没有随页提供任何地层剖面、荷载条件表、基础型式的平剖对照或地下墙底板节点；“读图练习”仍是没有题图的三道概念问答。现有实践任务也未提供基础专项底图，模型库独立存在不等于本文给出了案例。

影响：学生能够识别风险名称，仍无法练习如何从一组勘察条件排除或比较方案，或在底板—墙体节点追踪防水连续线；章节的读报告、读剖面与画节点目标没有相应练习材料。

建议：集中补一个小建筑案例：简化地层与设计水位、墙柱荷载/地下需求假定、独立/条形/筏/桩候选平剖示意、选型条件比较，以及一种明示系统的底板—外墙防水转折。给出“尚需什么信息”的参考答案，不以简例替代真实地基计算或恢复旧经验埋深公式。

状态：确认缺项；这是一组共同案例需求，不把每页缺图分别登记成六个问题。

### FH-07 [P3] 制图规范页缺少其本身要求读者记录的标准名与版本入口

定位：[intro-drawing-standards.md:43](<D:/vscode project/建筑构造交互教材/src/data/textbook/introduction/intro-drawing-standards.md:43>)；相关 [intro-drawing-standards.md:13](<D:/vscode project/建筑构造交互教材/src/data/textbook/introduction/intro-drawing-standards.md:13>)。源段：P0419–P0494。

证据短摘：“制图规则、设计要求与采用图集应记录名称、版本和适用范围”。

原稿对应：P0431 引用旧 GBJ2-86；原稿多个“规范/见表”指向未给完整书目信息。本版删除旧号，已避免误导。

观察：页面提醒查标准，却没有列建筑制图、房屋建筑制图统一标准和建筑模数协调标准的名称/编号/版本。唯一具体依据为地方钢结构住宅指南对基本模数的说明。国家标准院书库已有可直接链接的模数与建筑制图标准记录。

影响：学生难以沿本页找到轴线、图例、索引和尺寸协调的原始依据；这会增加后续自查成本，但不使当前基本模数算例错误。

建议：增设短“本节查阅依据”栏，记录相关国家标准、版次、所用主题/章节和查阅日期；引用地方指南时说明它用于补充示例，不代替国家制图与模数标准。对链接的公告、书库记录与条文全文区分用途。

状态：确认引用入口不完整；国家标准记录已一手核对，未进行条文级全面规范认证。

核对来源：[中国建筑标准设计研究院国标电子书库：GB/T 50002-2013 建筑模数协调标准](https://ebook.chinabuilding.com.cn/zbooklib/book/detail/show?SiteID=1&bookID=59383)（记录已打开；目录包括模数、模数数列、网格、定位及公差配合。）；[中国建筑标准设计研究院国标电子书库：GB/T 50104-2010 建筑制图标准](https://ebook.chinabuilding.com.cn/zbooklib/book/detail/show?SiteID=1&bookID=57783)（检索记录已返回，直接打开超时；本项不据此逐条给制图规则。）。

### FH-08 [P3] 前半章自测主要验证概念辨析，与读图/绘图目标的对接尚不完整

定位：[index.md:7](<D:/vscode project/建筑构造交互教材/src/data/textbook/walls/index.md:7>)；相关 [intro-drawing-standards.md:47](<D:/vscode project/建筑构造交互教材/src/data/textbook/introduction/intro-drawing-standards.md:47>)、[foundation-depth.md:39](<D:/vscode project/建筑构造交互教材/src/data/textbook/foundation/foundation-depth.md:39>)、[window-door-design.md:66](<D:/vscode project/建筑构造交互教材/src/data/textbook/door-window/window-door-design.md:66>)。源段：P0136–P0149、P0494–P0494、P0802–P0823、P1288–P1300。

证据短摘：“并在墙身剖面中追踪荷载、水分、热量与声音的路径”。

原稿对应：原讲义明确以识图、绘图和应用作为学习要求；整理方案建议排块、传力、防排水路径及勘察剖面练习。

观察：23 页均有自测和参考答案，是本版已有能力；墙体概述有明确章目标，多数其他章节直接展开正文。现有答题大多靠本页重述即可完成。部分页面提出观察/绘图，但没有给定图题、产出检查点或指向对应实践任务的链接。本站已有构造方案说明和外檐节点任务，前半正文多数只链接知识页。

影响：教材阅读与练习入口之间存在接续成本；学生可以完成文末问答，却不一定知道下一步用哪项任务验证读图与绘图能力。

建议：以章为单位补“本章目标—需先掌握—完成后可做”的短栏，并把制图/墙细部/门窗等页直接连接到适用实践任务。保留现有概念自测，再在 FH-02/04/05/06 的实例中增加一题具有判据的应用题，避免每页机械添加目标模板。

状态：确认教学组织可完善；可与各实例补齐合并实施，避免重复立项。

## 逐页复核记录

| 页面 | 已有能力 | 下一步重点 |
| --- | --- | --- |
| [intro-course-guide.md](<D:/vscode project/建筑构造交互教材/src/data/textbook/introduction/intro-course-guide.md>)（课程导读） | 能说明构造任务、专业协调、学习路径及观察成果；来源与未补图说明明确。 | 可与实践方案说明连接；教师课程配置不必恢复到学生正文。 |
| [intro-classification.md](<D:/vscode project/建筑构造交互教材/src/data/textbook/introduction/intro-classification.md>)（建筑物的分类） | 功能层级修正到位，区分功能、规模、层高、材料与受力体系，混合用途解释自足。 | 后续补一个指定适用规则的高度计算案例；当前未恢复旧层数/消防阈值属合理审慎。 |
| [intro-grading.md](<D:/vscode project/建筑构造交互教材/src/data/textbook/introduction/intro-grading.md>)（建筑物的分级） | 耐火/燃烧/抗震/年限对象辨析准确，无旧温度或无条件材料判级。 | FH-01；补等级查表和构造落实示例。 |
| [intro-composition.md](<D:/vscode project/建筑构造交互教材/src/data/textbook/introduction/intro-composition.md>)（构造组成） | 修正基础传给地基，承重墙/框架传力明确，六构件与三体系四层分析不混淆。 | 配一幅整体剖面及两种传力箭头，有利于入门；正文未发现重要误导。 |
| [intro-factors.md](<D:/vscode project/建筑构造交互教材/src/data/textbook/introduction/intro-factors.md>)（影响构造的因素） | 条件—风险—措施链清楚，入口例子同时考虑排水和使用者，荷载分类避免错误合并。 | 把入口例转为可标注的短图题即可，无需增加大量条文阈值。 |
| [intro-design-principles.md](<D:/vscode project/建筑构造交互教材/src/data/textbook/introduction/intro-design-principles.md>)（构造设计原则） | 五项原则及施工维护经济取舍齐备，纠正主动/被动调节。 | 可链接构造方案说明，给小型比较模板。 |
| [intro-drawing-standards.md](<D:/vscode project/建筑构造交互教材/src/data/textbook/introduction/intro-drawing-standards.md>)（制图、模数与规范） | 基础模数、三种尺寸、安装缝算例、标高/完成面及图纸协调讲解准确。 | FH-02、FH-07；缺最小图纸样本和标准入口。 |
| [foundation-overview.md](<D:/vscode project/建筑构造交互教材/src/data/textbook/foundation/foundation-overview.md>)（基础与地基概述） | 构件/岩土区别正确，天然处理与桩/复合地基分开，平均压力例有明确边界。 | FH-06 的地层与基础剖面可统一承担。 |
| [foundation-design.md](<D:/vscode project/建筑构造交互教材/src/data/textbook/foundation/foundation-design.md>)（基础设计要求） | 承载、构件受力、变形、稳定、抗浮、耐久和施工阶段条件解释完整。 | FH-06；从勘察条件到方案的练习须给真实题材或教学假定。 |
| [foundation-types.md](<D:/vscode project/建筑构造交互教材/src/data/textbook/foundation/foundation-types.md>)（基础分类） | 浅基础型式、桩承台、材料/受力/工艺维度准确，传统刚柔术语条件化。 | FH-06；型式平剖及无筋/RC扩展受力对照较关键。 |
| [foundation-underground.md](<D:/vscode project/建筑构造交互教材/src/data/textbook/foundation/foundation-underground.md>)（基础与地下结构） | 地下室不等于箱基，防潮防水抗浮不同任务，节点缝和施工状态补写合理。 | FH-06；至少一套明确系统的墙底板节点与防水转折。 |
| [foundation-depth.md](<D:/vscode project/建筑构造交互教材/src/data/textbook/foundation/foundation-depth.md>)（基础埋深） | 持力层/下卧层、水位、冻胀、邻近开挖和地下使用需求因果完整，不套旧固定距离。 | FH-06；读图练习需要剖面输入，不能只留概念问答。 |
| [foundation-settlement.md](<D:/vscode project/建筑构造交互教材/src/data/textbook/foundation/foundation-settlement.md>)（不均匀沉降） | 总量、差异、倾斜和时间过程区分，裂缝诊断不过度确定，后浇带与长期缝不同。 | 宜在统一案例增加两点沉降—时间小表，练空间差异和过程，不需要复杂土力学计算。 |
| [index.md](<D:/vscode project/建筑构造交互教材/src/data/textbook/walls/index.md>)（墙体概述） | 有明确章目标与七节阅读顺序，综合传力/性能线和观察方法有效。 | FH-08；接到实际图例与任务后能检验章目标。 |
| [wall-role.md](<D:/vscode project/建筑构造交互教材/src/data/textbook/walls/wall-role.md>)（墙体作用） | 承重/围护/分隔以及非承重自重侧向作用准确，三墙对照和拆改条件清楚。 | 可配承重与框架填充对照剖面，当前概念无重大问题。 |
| [wall-types.md](<D:/vscode project/建筑构造交互教材/src/data/textbook/walls/wall-types.md>)（墙体类型） | 各维度交叉与空腔墙/空心砌块区别准确，主体/隔墙/幕墙术语有边界。 | 增加一张分类记录卡样本即可；无需恢复旧材料性能排序。 |
| [wall-masonry.md](<D:/vscode project/建筑构造交互教材/src/data/textbook/walls/wall-masonry.md>)（砌体结构） | 承重布置、块材砂浆、错缝与排块原则清楚，强度不能平均及施工条件纠正。 | FH-03、FH-04；材料符号和组砌尺寸案例是本章重要缺口。 |
| [wall-details.md](<D:/vscode project/建筑构造交互教材/src/data/textbook/walls/wall-details.md>)（墙身细部） | 墙脚高差防潮、散水与排水、过梁窗台、圈柱芯柱解释准确；有四个已核对模型链接。 | 既有模型帮助墙脚与整体性；后续最优先补窗台/洞口上口/散水整合剖面，参数只作条件化例子。 |
| [partitions.md](<D:/vscode project/建筑构造交互教材/src/data/textbook/walls/partitions.md>)（隔墙） | 三系统组成、变形连接、周边密封、附挂物和管线说明自足，消除挤紧同时留缝矛盾。 | 配轻钢龙骨门洞与顶部滑移/密封示例；不将所有体系泛化一套连接。 |
| [wall-design-requirements.md](<D:/vscode project/建筑构造交互教材/src/data/textbook/walls/wall-design-requirements.md>)（墙设计要求） | 高厚比方向正确，抗震术语区分，热湿声火接口与评价对象清楚。 | 与 FH-04 的结构图和原理页结合可出路径识别题。 |
| [wall-finishes.md](<D:/vscode project/建筑构造交互教材/src/data/textbook/walls/wall-finishes.md>)（墙体饰面） | 补足基层结合饰面收口体系，避免瓷砖替代防水，机械连接与空腔防火有正确边界。 | 后续配“湿挂/干挂/粘贴”选用对照和一套做法层次标注；未恢复旧107胶/配比合理。 |
| [window-door-overview.md](<D:/vscode project/建筑构造交互教材/src/data/textbook/door-window/window-door-overview.md>)（门窗作用分类） | 框扇五金、开启、材料与玻璃配置清楚；双层窗/中空玻璃及断桥不绝对化。 | FH-05 的开启图例与整窗案例可承担分类识读。 |
| [window-door-design.md](<D:/vscode project/建筑构造交互教材/src/data/textbook/door-window/window-door-design.md>)（门窗设计要求） | 净尺寸、整樘性能、固定/填缝、四类缝、传统木作、遮阳安全和读图全面。 | FH-05；理论已组织好，需图纸—窗口—节点完整练习。 |

## 已修正、无需重复立项的内容

- 基础传荷载至地基；基础与岩土体是不同对象；桩不必全部进入岩层。平均压力和接口尺寸的两个教学算例均有明确假定及边界。
- 民用/工业/农业层级已修正；材料燃烧性能、构件耐火、建筑等级和抗震术语未混成一个指标。
- 高厚比方向正确；隔墙顶部不再同时要求挤紧和留空；圈梁/构造柱也不作为任意削弱墙体的补救。
- 门窗不将断桥/中空玻璃等同于消除结露；永久固定与发泡填充不同；洞口尺寸与净通行空间不同。
- 地下室不等于箱形基础，防水不代替抗浮；后浇带与永久沉降缝不同；不把固定等待天数、固定冻深或相邻距离公式当通用结论。
- 每页都有概念自测与短参考答案；跨页重复多为有意的简短回顾，未见前半正文相互矛盾的重大重复。

## 审计边界与交叉事项

本组评价文字页的知识和教学链。HTML 导航、可访问性、浏览器行为以及模型内部具体数值由整站审计的其他检查承担。作者记录已披露芯柱和防潮模型的旧参数，已向总审计提示；本报告未将同一模型参数再次登记为独立问题。旧 Word 对象内图文尚未全面抽取，本组不声称原 DOC 图表已通过审计。

