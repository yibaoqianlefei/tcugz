# 构造节点目录模型封面

本版为 93 个可用节点生成真实 GLB 渲染图，替换目录卡片的剖面图封面。保留原有四列桌面、两列手机布局及悬停动画；节点内部图纸对照保持。

- 输出：960 × 540 透明 WebP，共 2.33 MB。
- 使用原模型、原材质、统一摄影棚光照和正交取景，无生成式补造构件。
- 比较动画起止姿态，保证完整可见构件，再选择紧凑构图；构造柱采用完整装配末态。多方案节点使用首个方案作为代表封面。
- 来源、SHA-256、姿态、视角、可见网格及图片留白记录见 [manifest](../../public/images/node-renders/manifest.json)。
- 目录只加载静态图，未新增卡片三维画布。

## 验证

- test:node-previews：93 项覆盖、当前 GLB 哈希、WebP 格式尺寸、完整构件与边界留白通过。
- test:curriculum：课程关系及 99 个原模型文件哈希不变。
- 修改的 TS/TSX ESLint、TypeScript 与根路径生产构建通过。
- 桌面 1280/1440 四列，手机 392 两列，无页面横向溢出。
- 搜索圆弧形楼梯后匹配正确渲染图；卡片进入正确节点，原剖面图仍可查看，返回保留搜索。
- /textbook/ 子路径生产目录：93 个封面地址前缀正确，首屏图片正常，目录无画布及控制台错误。

## 复现

运行 npm run render:node-previews，打开命令输出的本地工作台，生成图片并写入索引；可输入失败节点 ID 单独重试。之后运行 npm run test:node-previews。详见 [渲染说明](../../scripts/node-preview-renderer/README.md)。

![桌面目录](library-desktop.png)

![手机目录](library-mobile.png)

最终全部渲染图核对拼图：[1](contact-sheets/1.png)、[2](contact-sheets/2.png)、[3](contact-sheets/3.png)、[4](contact-sheets/4.png)、[5](contact-sheets/5.png)。
