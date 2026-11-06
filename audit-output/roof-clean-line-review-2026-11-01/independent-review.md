# 04～08 原生清晰线稿 r4 独立审查

审查日期：2026-11-01。版本：`roof-batch1-r4-clean-lines-2026-11-01`。版本绑定时间（UTC）：2026-11-01T06:56:27.995Z。

结论：在本报告限定的原图对照、构造拓扑、材料界面、引线落点及静态预览清晰度范围内，当前五张双版未发现尚未纠正的确定性阻断项。06 的基层与金属重叠、07 的内侧斜带遗漏、08 的 60 测界材料身份误指均已修正并复查。此结论不构成人工采用批准；五图仍为 `draft`，`formalReplacement=false`，技术状态为 `native-clean-line-awaiting-human-review`。

## 审查方法与范围

逐张实际查看 `public/images/roof` 中五份原图及本目录教材版、节点版共十份 PNG，并读对应 SVG 的构件路径、共用界线、尺寸对象和引线。06、07 修正后重新查看两版预览并核对实际路径；08 最终调整仅涉及尺寸对象名称与未核定说明，绘图未改，最终 PNG 与已看版本的 SHA 相同。04、05 的实际构件路径及矩形几何还与上轮正交稿逐项比较，材料图例和填充减淡后未发现构造几何变化。本轮没有以作者的计数、自动测试或自述作为构造正确性的依据。

核查包括原图视图和剖切关系、层界连续性、孔洞/空腔/钢丝尾、少线或多线、尺寸所投影的对象、引线与实际构件接触及文字/尺寸遮挡。教材版宽 1400、节点版宽 620 的静态预览均已检查；未执行真实网页、交互热区或移动设备浏览器验收。07 另有独立交叉核图，低分辨率原图的材料身份仍按未知处理。

本轮仅清理、核图和记录版本；规范适用边界沿用本版 `evidence.json` 已记录的依据及限制，没有新增规范合规断言，也没有将原图实例参数改称统一规范值。SVG 坐标只用于图形定位，不换算为施工尺寸。本报告排除已批准的 01、02、03、09，未对其作重新验收。审查代理只写本报告，未编辑生成器或 SVG。

## 逐图结果

### 04 女儿墙泛水

已核对：墙体、抹灰的主边竖直，板面和板底水平；砂浆与涂膜共界 `x=140 / Q140 194 155 194 / y=194`，涂膜与外侧局部附加卷材共界 `x=142 / Q142 192 155 192 / y=192`。外侧附加卷材止于局部范围，连续涂膜继续到屋面截断端；没有把两层合成粗黑带。槽口、压条、斜钉和墙板端局部油膏分别表达。

钉 `M125 106→119 125` 穿过压条并进入墙体；05 引线终点 `[122,115.5]` 在钉身，其他材料引线落在对应可见面。两版没有发现旧引线残梗、层界断裂或标注遮挡构造。稀疏浅色图例保留材料区分，主轮廓和薄层边线可辨。

未核定：≥250、60 仍为原图相邻尺寸段的投影，精确工程材料起算点未由完整原出处证实；涂膜与附加卷材实厚/性能、钉的品种和间距、原图未示层次均不补造。图示绘图长度不代表这些毫米数的比例。

### 05 高低屋面泛水

已核对：高墙、矮墙、结构板主边已正交；钢板的真实斜段、盖缝回折和下部卷材转折保留。钢板固定竖边 `x=136` 与上部抹灰边共界，上部钉穿到固定边；钢板单线示意没有冒造厚度。下部卷材可从槽内沿 U 折空腔追到矮墙顶、下翻与屋面曲线，空腔未涂黑填死，基层邻接不相交。

实际落点包括压条 03 `[126,117.4]`、钢板 04 `[177,146.75]`、卷材 05 `[221,212.5]`、油膏 06 `[119.2,119.5]` 和槽内钉 07 `[123,123.1429]`。钉 `M126 118→119 130` 穿压条并进入墙。两版 05 引线采用 row=168 的空白路径，与 ≥250 文字和尺寸线分离；未发现原图引线残梗被当构造或厚黑块。未知横线 `M152 180H194` 仍以独立细实线保留。

未核定：≥250 只保留原图竖向投影，不宣称已核定材料工程起算点；钢板厚度、上端截断外的真实工程终点、缝宽、卷材性能及未知横线的材料/功能均未定。矮墙图例不能单凭纹理确定材料品种，卷材图示分离程度不代表实厚。

### 06 直式水落口（65 型文件名）

已核对：原图的上部定型铸铁构件、承口与下管分别表达，通水腔未封闭；薄层在凹槽和金属口边转折，砂浆与金属的邻接可分辨。最终 `roof-local-substrate` 左侧为 `M34 152H80L117 164V171L80 158H34Z`，右侧为 `M397 152H350L315 164V171L350 158H397Z`，止于金属法兰范围，不再在金属内部重复占面。两版图中该修正未损失应见轮廓。

管口下端四壁线仍为 `x=187、196、235、243`；6／100／6 分别对应左壁厚、两内壁间净宽、右壁厚，100 没有误量外壁总宽。后部横线和底端内边保留为细线，未封死孔腔。定型铸铁构件、开口砂浆与右侧卷材引线终点位于对应实际可见区域，两版未见遮挡。

未核定：文件名“65 型”的产品出处未取得，不解释为 DN65。6、100、6 及 1∶2.5 是原图实例标注；产品型号、承插/连接、埋深、材料实厚、排水能力和现代系统选型不从像素或此局部图确定。

### 07 直式铸铁水落口

已核对：球形网由独立曲线和五条分开的开口钢丝尾表示，未围成封闭梨形壳或堵住喉部。杯体、板口、砂浆、外侧卷材和局部油膏分别可追踪，杯管通腔保持开放。球网、油膏与砂浆引线落在各自可见线/面。

原图左侧约 `(128,141)～(157,167)` 及右侧镜像处可见的独立内斜带已补回。当前 SVG 的 `source-unidentified-inner-band` 左轮廓为 `M123 141H128L157 167H150Z`，右侧镜像；闭合斜带及短横返回端与外侧卷材分开，邻近钢丝喉部留有空隙。两版重新查看后未发现短带、钢丝尾、孔腔被盖住或误连。此项原遗漏在本轮已关闭。

未核定：内斜带的材料身份不明，仅保留原图轮廓和邻接，不命名为额外防水层；球径、丝径、网距、丝条设计数量、管壁厚度、配套产品和排水性能无数值证据。五条可辨尾线只说明本图可见线，不是工程配筋/网丝数量。1∶2.5 同样是来源实例。

### 08 自由落水圈梁带挑檐板

已核对：上部层内横线、九处可辨截点和左端短折独立于材料图例；未把其改到 L 形结构内新造配筋。防水层、隔离层、未命名细边带和结构层分别共用 `y=87、91、96` 的相邻层界，圈梁与下部墙身共界 `y=189`；左右构件/剖切关系与原图一致。右侧空心板保留三个完整孔及右端截取折线，没有第四个半孔。原图板左侧斜边邻近白缝有来源依据，未擅自补实。

滴水引线落在上唇口下侧，隔离层、上部防水层和圈梁引线分别落在实际构件。60 保留唇口 `x=21` 至图示细边带外缘 `x=40` 的水平投影；数字在尺寸线上方，两版无尺寸或材料文字遮住构造。最终元数据已将 `structuralEdge` 改为 `sourceEavesEdge`，两测量对象写为“原图防水层挑出唇口外缘”“图示檐端细边带外缘”，状态为 `source-projection-material-interface-unconfirmed`，不再冒称第二端是已核定混凝土结构测面。

未核定：细边带的材料及实厚、短折的精确弯钩构造、钢筋规格和间距、孔径和孔距均未提供；九处截点不是设计数量。60 不是板厚或总悬挑长。传统刚性防水实例与自由落水的现代工程适用性、完整屋面设防及排水系统均不能由该局部图证明。

## 剩余边界

上述未核定项均已作为来源限制保留，不能据“线条更清楚”转为已确认材料或规范要求。当前可继续人工审图/教学采用评审；正式替换和工程采用仍未批准。后续如改变构造、引线、尺寸对象或输出文件，须重新绑定版本并复查受影响部位。

## 最终文件身份

以下 SHA-256 来自本报告写入前的磁盘文件；十份 SVG 的哈希均与 `evidence.json` 的 `rendered` 对应记录一致。PNG 哈希与实际已检查的最终图像相同。哈希只证明文件身份，不是正确性测试。

`evidence.json` SHA-256：`1903e2cb758ec20350ab4b6fdd07ba4ff0adbb1df6eab0bc8c26eb2edcedccf5`。

本表路径均相对 `audit-output/roof-clean-line-review-2026-11-01/`；每格先 SVG、后 PNG。

| 图号/版本 | 文件 | SHA-256 |
|---|---|---|
| 04 textbook | `textbook/coating-parapet-flashing-01.svg`<br>`previews/textbook-coating-parapet-flashing-01.png` | `b133ba04526212331f0419f89e9f114452e9712172ac91684d8b7ca9b97c3626`<br>`f01f291549918a7b73ddfd6d2dc38d12eb8f0e676b9b8993828e882a715e487c` |
| 04 node | `node/coating-parapet-flashing-01.svg`<br>`previews/node-coating-parapet-flashing-01.png` | `85071a555bc790c758a6c8e174cdcf807d44cb50700d2c794899d422f15c610e`<br>`dd0aa1e30a2679bbd62c0a5ef3c7a047971b5ecd2572466c3a700d325d628fff` |
| 05 textbook | `textbook/coating-high-low-roof-flashing-01.svg`<br>`previews/textbook-coating-high-low-roof-flashing-01.png` | `68dd5e14725577add517958e47e64ea8d5c4f6e4fad218ac766662fc82090fba`<br>`ba8cda5478f22ec1f924ce5763798bbc8cef726099fcad89da2e93c19a98d575` |
| 05 node | `node/coating-high-low-roof-flashing-01.svg`<br>`previews/node-coating-high-low-roof-flashing-01.png` | `3113e114c71a62460fddb18f2acbf82d6fbf89b470a31d42b9bc7d879188f5db`<br>`82992829e274d7b86f7e7903542d2b257e6618f3ad30b764c982d410a829813e` |
| 06 textbook | `textbook/straight-rainwater-outlet-65-01.svg`<br>`previews/textbook-straight-rainwater-outlet-65-01.png` | `e04c125a577508a8cf821f340fdc63571968b8e59cff1d3e8bd1b0a936141163`<br>`e8a899eb3a3495c2887a856d047ad9d4a3c559c9101891418d82b33b9433e9a7` |
| 06 node | `node/straight-rainwater-outlet-65-01.svg`<br>`previews/node-straight-rainwater-outlet-65-01.png` | `3c973796c34d2d87a6c369a9edd23325bb42487288b3ac8e744f004e1a8f5bfa`<br>`568655d45bf92c2bea228d34a3cf8785300e42b4dbe12206328c3ae7fdd58a29` |
| 07 textbook | `textbook/straight-rainwater-outlet-cast-iron-01.svg`<br>`previews/textbook-straight-rainwater-outlet-cast-iron-01.png` | `bd1b717cb948889267e5180d9377e6cc988dcb4eb4adc6c12e4bca9692f16ac1`<br>`2a5756a60f6b2179c004cf4ffc7c0ff287ad58263bedefb030d68cb4f0972d32` |
| 07 node | `node/straight-rainwater-outlet-cast-iron-01.svg`<br>`previews/node-straight-rainwater-outlet-cast-iron-01.png` | `65058153764a3b85f258cfea53232d7e139137dc171496aefa3e81d45b00b2db`<br>`00514083fb4079aa26a7ac361947bb6939f0db03a3ef8c61c07358e9f76b8f1d` |
| 08 textbook | `textbook/free-fall-ring-beam-eaves-01.svg`<br>`previews/textbook-free-fall-ring-beam-eaves-01.png` | `23f27377eda93c467dcf502abb6d7e9de0b39a24a4564ee921ffedcbd5a3f3e6`<br>`99adbf5db5862a0dce3bbfb73f66e884f45ff253556ba5f655d0b9a3de69d8a0` |
| 08 node | `node/free-fall-ring-beam-eaves-01.svg`<br>`previews/node-free-fall-ring-beam-eaves-01.png` | `88852f511266fd7e11bf4c210cb2197e3d24c870d607a4fd68e866aaaecfe34b`<br>`3401e2f7c83626fc408983c07b1ae19d9bb1edd06c947e300a35d4835ed12278` |

原图身份（工作区相对路径）：

| 图号 | 原图 | SHA-256 |
|---|---|---|
| 04 | `public/images/roof/coating-parapet-flashing-diagram.png` | `7caaf6ac52f2cafda171470b44c70427893b95f09eb38fbd63bd037aab3f4cb2` |
| 05 | `public/images/roof/coating-high-low-roof-flashing-diagram.png` | `13a761f49eb5e6376f4465122d92a6f3379695700ab57d803426e5bf07a509e2` |
| 06 | `public/images/roof/straight-rainwater-outlet-65-diagram.png` | `e7b4828d87f99a36aef87f7a6a029b0118053b4bf6e65aa080a612f13ab88bfb` |
| 07 | `public/images/roof/straight-rainwater-outlet-cast-iron-diagram.png` | `dd0f471290856a79d879d1ccb00534fe70b4cc20009db1223b38f7f59dd2c298` |
| 08 | `public/images/roof/free-fall-ring-beam-eaves-01-diagram.png` | `12ff3b9a59ebf89a3cfa13178e33e0ad017eb8b8e7994fdb56822e6bc9a822b8` |
