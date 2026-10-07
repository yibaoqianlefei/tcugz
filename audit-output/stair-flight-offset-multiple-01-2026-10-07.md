# 梯段与平台梁节点处理（梯段错多步）接入审计

日期：2026-10-07

## 资源与内容

- 节点 ID：`stair-flight-offset-multiple-01`，分类：楼梯。
- 模型源：`D:\大三下作业\glb构造\梯段与平台梁节点处理-梯段错多步.glb`。
- 部署模型：`public/models/stairs/stair-flight-platform/stair-flight-offset-multiple-01.glb`，177240 字节。
- 模型源与部署文件 SHA256 一致：`954B0EAF367F9E45C1DFEFD492DCE38ACE6F237FEE951CBED218C67DA425ED5D`。
- 剖面源：`D:\剖面图\梯段与平台梁节点处理\屏幕截图 2026-10-06 212614.png`。
- 部署剖面：`public/images/stairs/stair-flight-offset-multiple-01-diagram.png`。
- 剖面源与部署文件 SHA256 一致：`B188AE4F3391276D8133A9496D4AEBA47D9EC0A3AD2962E0D86BC51058FB9564`。
- 保留模型原始几何、材质与变换。剖面标有“折形构件”，未给出数值尺寸及配筋，知识说明未补写这些参数。

## 静态与交互

- 4 个源网格对象，无动画。设置 `noAnimation: true`。
- 默认及 R 重置后进度为 1；展开、复原及滑块禁用。
- 3 个教学构件：梯段、下平台梁-水平挑边L形梁、平台板。名称与源模型一致。
- “无需标注”组合体仅展示，无知识卡片；通过 `nonInteractive` 排除点选与高亮。
- 浏览器实际分块 `无需标注_1`、`无需标注_2` 均可见，射线命中为 0，交互代理为 0。
- 未修改共享查看器或首页状态保持逻辑。

## 验证

- TypeScript 编译、相关文件 ESLint 通过。
- 节点配置合同测试 7 组通过。
- 静态资源测试 3 组通过，208 个文件引用均存在。
- 浏览器测试通过：真实模型渲染、默认完成、禁用动画控制、3 张教学卡片、直接 3D 点选、组合体排除、R 重置、剖面解码、390px 移动端无横向溢出、节点列表入口、无页面异常及失败请求。
- 已查看桌面截图：`tmp/stair-flight-offset-multiple-01/assembled.png`；移动端截图：`tmp/stair-flight-offset-multiple-01/mobile.png`。

本轮仅本地更改，未提交或部署。
