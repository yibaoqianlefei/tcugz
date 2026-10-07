# 梯段与平台梁节点处理（梯段齐步不埋步）接入审计

日期：2026-10-07

## 资源与内容

- 节点 ID：`stair-flight-flush-unburied-01`，分类：楼梯。
- GLB 源：`D:\大三下作业\glb构造\梯段与平台梁节点处理-梯段齐步不埋步.glb`。
- 部署模型：`public/models/stairs/stair-flight-platform/stair-flight-flush-unburied-01.glb`，221048 字节。
- 模型源与部署文件 SHA256 一致：`E0DD9FE0FACCE1C568C0AFDC36C4D3D5398E3CD2AA47B4641A8CD6E8D0B996D3`。
- 剖面源：`D:\剖面图\梯段与平台梁节点处理\屏幕截图 2026-10-06 212609.png`。
- 部署剖面：`public/images/stairs/stair-flight-flush-unburied-01-diagram.png`。
- 剖面源与部署文件 SHA256 一致：`2DE2866088FFF4CBEF9C616BB0C3912AC3FC6ECA170B57D98BF04F0399AE07B6`。
- 原始模型几何、变换与材质保留。剖面展示梯段构件跨度及局部接合轮廓，未提供数值尺寸或配筋；知识说明未补写这些参数。

## 静态与交互设置

- 模型有 6 个网格对象，无动画轨道。设置 `noAnimation: true`。
- 加载及 R 重置后进度均为 1；展开、复原与滑块禁用。
- 5 个教学构件：梯段、下平台梁-平肩凹口、下平台板、上平台梁-梁腹对齐、上平台板。名称与源对象一致。
- “无需标注”组合体无知识卡片，并通过 `nonInteractive` 排除高亮与点选。
- 浏览器实际网格名为 `无需标注_1`、`无需标注_2`，现有名称标准化可正确识别。
- 两个分块均可见，射线命中为 0，交互代理数为 0。
- 未修改共享模型查看器或首页状态保持逻辑。

## 验证

- TypeScript 编译及相关文件 ESLint 通过。
- 节点配置合同测试 7 组通过。
- 静态资源测试 3 组通过，204 个引用文件均存在。
- 浏览器测试通过：实际模型渲染、默认完成状态、禁用动画控制、5 张教学卡片、直接 3D 点选、组合体交互排除、R 重置、剖面图加载、390px 移动端无横向溢出、节点列表入口、无页面异常或失败请求。
- 已查看桌面截图：`tmp/stair-flight-flush-unburied-01/assembled.png`；移动端截图：`tmp/stair-flight-flush-unburied-01/mobile.png`。

本轮仅本地更改，未提交或部署。
