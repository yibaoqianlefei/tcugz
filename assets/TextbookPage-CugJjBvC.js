import{v as e}from"./r3f-BL5w8r43.js";import{_ as t,a as n,c as r,d as i,f as a,i as o,l as s,n as c,o as l,r as u,s as d,u as f,v as p}from"./index-A4vLb33D.js";var m=e(),h=`# 墙体

墙体是建筑竖向围护与承重构件，具有承重、围护、分隔三大基本功能。

## 墙体的分类

墙体按受力状态分为**承重墙**和**非承重墙**两类。

| 类别 | 受力特点 | 典型位置 |
|------|----------|----------|
| 承重墙 | 承受楼板、屋盖传来的竖向荷载 | 纵横墙、外墙 |
| 非承重墙 | 仅承受自身重量 | 隔墙、填充墙、幕墙 |

## 墙体的设计要求

- 结构安全：足够的强度和稳定性
- 保温隔热：满足热工规范要求
- 防水防潮：墙脚设防潮层
- 隔声防火：满足建筑功能需求

## 本章子章节

- 隔墙 — 非承重内隔墙的构造做法
- 砌体结构 — 砖砌体与砌块墙的构造要求
`,g=`# 隔墙

隔墙是非承重内隔墙，用于分隔建筑内部空间，不承受上部结构荷载。

## 常见隔墙类型

| 类型 | 厚度 | 特点 |
|------|------|------|
| 轻钢龙骨隔墙 | 75-150mm | 轻质、施工快、灵活布置 |
| 轻质条板隔墙 | 90-120mm | 工业化生产、现场装配 |
| 砖砌隔墙 | 120mm | 隔声好、湿作业多 |

## 隔墙的设计要求

- 自重轻，减轻楼板荷载
- 与主体结构柔性连接，允许变形
- 满足隔声要求（≥45dB）
- 卫生间等潮湿区域应做防水处理
`,_=`# 墙体的设计要求

墙体的设计需同时满足结构安全、保温隔热、防水防潮、隔声防火等多项技术要求。

## 结构安全

承重墙应具有足够的强度和稳定性：

- 墙体高厚比应符合《砌体结构设计规范》GB 50003 的要求
- 纵横墙交接处应有可靠的拉结
- 墙体布置应尽量均匀、对称

## 保温隔热

根据《民用建筑热工设计规范》GB 50176，外墙热工性能应满足：

| 气候区 | 传热系数 K [W/(m²·K)] |
|--------|----------------------|
| 严寒 A/B 区 | ≤ 0.25–0.35 |
| 寒冷 A/B 区 | ≤ 0.45–0.60 |
| 夏热冬冷区 | ≤ 0.80–1.20 |
| 夏热冬暖区 | ≤ 1.20–1.80 |

### 常见保温形式

- **外墙外保温**：保温层置于外墙外侧，阻断热桥
- **外墙内保温**：保温层置于内侧，施工简便
- **夹心保温**：保温层夹在内外墙之间

## 防水防潮

墙脚处必须设置防潮层，防止土壤中水分沿毛细孔上升。

| 防潮层类型 | 位置 | 做法 |
|----------|------|------|
| 水平防潮层 | 室内地面垫层处 | 防水砂浆或卷材 |
| 垂直防潮层 | 外墙外侧勒脚 | 防水涂料或卷材 |

## 隔声要求

- 分户墙空气声隔声量 ≥ 45dB
- 楼板撞击声隔声量 ≤ 75dB

## 防火要求

根据《建筑设计防火规范》GB 50016：

- 防火墙耐火极限 ≥ 3.0h
- 疏散走道两侧隔墙耐火极限 ≥ 1.0h
- 房间隔墙耐火极限 ≥ 0.75h
`,v=`# 屋顶

屋顶是建筑最上层的围护结构，兼具承重、防水、保温、隔热功能。

## 屋顶的分类

按排水坡度可分为**平屋面**和**坡屋面**两大类。

| 类型 | 坡度 | 排水方式 |
|------|------|----------|
| 平屋面 | 2%-5% | 有组织排水/无组织排水 |
| 坡屋面 | ≥10% | 檐沟外排水/天沟内排水 |

## 平屋面构造层次

由上至下：保护层 → 防水层 → 找平层 → 保温层 → 隔气层 → 找坡层 → 结构层

## 本章子章节

- 平屋面构造 — 上人/不上人平屋面的标准做法
- 坡屋面构造 — 瓦屋面与金属屋面的构造节点
`,y={introduction:s,wall:r,"door-window":d,foundation:l,floor:n,stairs:o,roof:u,"deformation-joint":c},b={wall:`墙体`,roof:`屋顶`},x={"wall/index":h,"wall/wall-partition":g,"wall/wall-design-requirements":_,"roof/index":v};function S(){let{sectionId:e,moduleId:n,chapterId:r}=p(),o=(()=>{if(n&&r){let e=f.find(e=>e.id===n);if(!e)return null;let t=y[n]||[];return{module:e,section:t.find(e=>e.id===r)??null,sections:t,isModule:!1,category:b[n]||``,chapterId:r}}let t=e||n;if(!t)return null;let i=f.find(e=>e.id===t);if(i)return{module:i,sections:y[i.id]||[],isModule:!0,category:b[i.id]||``,chapterId:null};for(let[e,n]of Object.entries(y)){let r=n.find(e=>e.id===t);if(r)return{module:f.find(t=>t.id===e),section:r,sections:n,isModule:!1,category:b[e]||``,chapterId:t}}return null})(),s=o?.isModule?`${o.module.id}/index`:`${o?.module.id}/${o?.chapterId}`,c=o&&s?x[s]??``:``;if(!o)return(0,m.jsx)(`div`,{className:`min-h-screen bg-canvas flex items-center justify-center`,children:(0,m.jsxs)(`div`,{className:`text-center`,children:[(0,m.jsx)(`p`,{className:`text-muted text-lg`,children:`未找到该章节`}),(0,m.jsx)(t,{to:`/textbook/introduction`,className:`text-primary text-sm mt-3 inline-block hover:underline`,children:`返回教材首页`})]})});let{module:l,section:u,sections:d,isModule:h,category:g}=o,_=h?l.title:u?.title??l.title,v=h?l.description:u?.description??``,S=g?i.filter(e=>e.category===g):[];return(0,m.jsx)(`div`,{className:`min-h-screen bg-canvas flex flex-col`,children:(0,m.jsxs)(`main`,{className:`flex-1 max-w-7xl mx-auto w-full p-8`,children:[(0,m.jsxs)(`nav`,{className:`mb-8 text-sm text-muted-soft`,children:[(0,m.jsx)(t,{to:`/`,className:`hover:text-primary transition-colors`,children:`首页`}),(0,m.jsx)(`span`,{className:`mx-1.5`,children:`›`}),(0,m.jsx)(`span`,{className:`text-muted`,children:`构造基础`}),(0,m.jsx)(`span`,{className:`mx-1.5`,children:`›`}),(0,m.jsx)(t,{to:`/textbook/${l.id}`,className:`hover:text-primary transition-colors`,children:l.title}),!h&&(0,m.jsxs)(m.Fragment,{children:[(0,m.jsx)(`span`,{className:`mx-1.5`,children:`›`}),(0,m.jsx)(`span`,{className:`text-muted`,children:_})]})]}),(0,m.jsxs)(`div`,{className:`flex gap-10`,children:[(0,m.jsxs)(`div`,{className:`flex-1 min-w-0`,children:[(0,m.jsxs)(a.div,{initial:{opacity:0,y:10},animate:{opacity:1,y:0},transition:{duration:.4,ease:`easeOut`},children:[(0,m.jsx)(`h1`,{className:`text-3xl font-normal font-serif text-ink tracking-tight`,children:_}),v&&(0,m.jsx)(`p`,{className:`mt-2 text-muted text-base leading-relaxed`,children:v})]}),(0,m.jsxs)(a.div,{className:`mt-10`,initial:{opacity:0,y:10},animate:{opacity:1,y:0},transition:{duration:.4,delay:.1,ease:`easeOut`},children:[c?(0,m.jsx)(`div`,{className:`prose prose-stone max-w-none
                    prose-headings:font-serif prose-headings:text-ink prose-headings:font-normal
                    prose-h1:text-2xl prose-h1:mt-8 prose-h1:mb-4
                    prose-h2:text-xl prose-h2:mt-6 prose-h2:mb-3
                    prose-p:text-body prose-p:leading-relaxed
                    prose-strong:text-body-strong
                    prose-table:border-collapse prose-table:w-full prose-table:my-4
                    prose-th:border prose-th:border-hairline prose-th:p-3 prose-th:text-left prose-th:text-sm prose-th:font-medium prose-th:bg-surface-soft
                    prose-td:border prose-td:border-hairline prose-td:p-3 prose-td:text-sm prose-td:text-body
                    prose-li:text-body prose-li:leading-relaxed
                    prose-a:text-primary
                  `,dangerouslySetInnerHTML:{__html:c.replace(/^### (.*$)/gim,`<h3 class="text-lg font-medium text-body-strong mt-6 mb-2">$1</h3>`).replace(/^## (.*$)/gim,`<h2 class="text-xl font-serif text-ink font-normal mt-8 mb-3">$1</h2>`).replace(/^# (.*$)/gim,`<h1 class="text-2xl font-serif text-ink font-normal mt-8 mb-4">$1</h1>`).replace(/\*\*(.*?)\*\*/g,`<strong class="text-body-strong">$1</strong>`).replace(/\n\n/g,`</p><p class="text-body leading-relaxed mb-4">`).replace(/^- (.*$)/gim,`<li class="text-body ml-4 mb-1">$1</li>`)}}):(0,m.jsx)(`div`,{className:`border-2 border-dashed border-hairline rounded-2xl p-12 text-center`,children:(0,m.jsx)(`p`,{className:`text-muted-soft text-sm`,children:`章节内容正在建设中`})}),h&&d.length>0&&(0,m.jsxs)(`div`,{className:`mt-12 pt-8 border-t border-hairline`,children:[(0,m.jsx)(`h2`,{className:`text-xl font-normal font-serif text-ink mb-4`,children:`章节列表`}),(0,m.jsx)(`div`,{className:`grid gap-3`,children:d.map(e=>(0,m.jsxs)(t,{to:`/textbook/${l.id}/${e.id}`,className:`block p-4 rounded-xl border transition-all duration-200
                          ${e.available?`bg-surface-card border-hairline hover:border-primary/30 hover:shadow-sm cursor-pointer`:`bg-surface-soft/50 border-hairline/50 cursor-not-allowed opacity-60`}`,onClick:t=>{e.available||t.preventDefault()},children:[(0,m.jsxs)(`div`,{className:`flex items-center justify-between`,children:[(0,m.jsx)(`span`,{className:`text-sm font-medium text-body`,children:e.title}),(0,m.jsx)(`span`,{className:`text-[10px] text-muted-soft`,children:e.available?`点击阅读 →`:`即将上线`})]}),(0,m.jsx)(`p`,{className:`text-xs text-muted-soft mt-1`,children:e.description})]},e.id))})]})]})]}),(0,m.jsx)(`aside`,{className:`hidden lg:block w-80 flex-shrink-0`,children:(0,m.jsxs)(`div`,{className:`sticky top-8`,children:[(0,m.jsx)(`h3`,{className:`text-sm font-medium text-muted uppercase tracking-wider mb-4`,children:`本章相关构造模型`}),S.length>0?(0,m.jsx)(`div`,{className:`space-y-3`,children:S.map(e=>(0,m.jsxs)(t,{to:`/node/${e.id}`,className:`block bg-surface-card border border-hairline rounded-xl p-4
                        hover:border-primary/30 hover:shadow-sm hover:-translate-y-0.5
                        transition-all duration-200 cursor-pointer group`,children:[(0,m.jsx)(`h4`,{className:`text-sm font-normal font-serif text-ink group-hover:text-primary transition-colors`,children:e.title}),(0,m.jsx)(`p`,{className:`text-xs text-muted mt-1 line-clamp-2`,children:e.description}),(0,m.jsx)(`span`,{className:`inline-block mt-2 text-[10px] font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity`,children:`打开 3D 模型 →`})]},e.id))}):(0,m.jsx)(`p`,{className:`text-xs text-muted-soft leading-relaxed`,children:`暂无关联的 3D 构造模型`})]})})]})]})})}export{S as default};