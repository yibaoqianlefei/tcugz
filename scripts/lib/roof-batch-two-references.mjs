const checkedOn='2026-11-01';
const announcement='https://www.mohurd.gov.cn/gongkai/zc/wjk/art/2024/art_17339_768499.html';
const roofStatus='https://ebook.chinabuilding.com.cn/zbooklib/book/detail/show?SiteID=1&bookID=60869';
export const drawingReference={
 kind:'drawing-expression',standard:'GB/T 50001—2017 房屋建筑制图统一标准',
 officialSource:'https://www.mohurd.gov.cn/gongkai/zc/wjk/art/2018/art_17339_234638.html',
 clause:'11.1.1～11.1.4、11.2.1～11.2.4、11.3.1～11.3.2',page:'印刷页43～45；PDF第49～51页',checkedOn,
 localSource:'standards/GBT50001-2017-official.pdf',
 verification:'本轮重新渲染并阅读尺寸组成、数字优先于图量及排列要求；线宽按实际阅读尺寸分级，SVG像素不冒充纸面毫米。',
};
function general(clause,verification){return {
 kind:'standard-corroboration',standard:'GB 55030—2022 建筑与市政工程防水通用规范',officialSource:announcement,
 publisherSource:'https://ebook.chinabuilding.com.cn/zbooklib/book/detail/show?SiteID=1&bookID=154718',
 clause,page:'印刷页15～17；PDF第19～21页',checkedOn,localSource:'standards/GB55030-2022-official.pdf',
 verification:verification+' 本轮实际阅读官方PDF相关页。2023-04-01实施，全部条文强制；不一致时以本规范为准，不能以旧图单层表达替代完整设防。',
};}
function roof(clause,page,pages,url,verification){return {
 kind:'standard-corroboration',standard:'GB 50345—2012 屋面工程技术规范',officialSource:roofStatus,
 documentSource:'https://jncc.jinan.gov.cn/attach/0/cbe8bbd564d441da855045b991be1fac.pdf',readingSource:url,
 statusSource:announcement,clause,page:`印刷页${page}；归档PDF第${pages}页`,checkedOn,localSource:'standards/GB50345-jinan.pdf',
 verification:verification+' 本轮实际渲染并阅读既有政府域名公开副本；该下载链接本次返回403，原图页按归档哈希保留。国标电子书库本次仍列现行；公告废止的是列明的原强制条文，未将整本作废。',
};}
const sharedWater=()=>general('4.4.1、4.4.3～4.4.7','分别核对按等级设防、有效坡向、独立雨水系统、细部增强及瓦屋面防风落要求。这里只给原图适用背景，不补未示材料、厚度或固定件。');
const storage=()=>roof('4.4.10第1～8款','13','22','https://gf.cabr-fire.com/article-49203.htm','核对蓄水区、池体、溢水/排水/给水及使用条件。图示空心板和墙根仅是历史局部，不能据其推定现代池体、水荷载、分仓、供水与维护全部成立。原标≥100不改写为水深。');
const drainage=()=>roof('4.2.5、4.2.11～4.2.13','9','18','https://gf.cabr-fire.com/article-49194.htm','核对汇水、沟断面和沟中分水线的不同任务；雨水流量和出口需设计，不能由局部剖面确定管径或纵向间距。原图局部尺寸与现行条文分开记录。');
const tiles=()=>roof('4.8.2、4.8.7、4.8.10～4.8.12','20～21','29～30','https://gf.cabr-fire.com/article-49232.htm','核对按瓦材与基层选型、条材保护、可靠固定及持钉层的范围。若为烧结或混凝土瓦，4.8.11要求干法挂瓦；原图砂浆卧瓦仅保留其历史实例身份，不宣传为当前通用推荐。3厚卷材、≥2涂膜、C15及网筋参数均来自原图，不能从本规范倒推其适用。');
const atlasCatalogue={
 kind:'catalogue-only',standard:'12J201 平屋面建筑构造',officialSource:'https://www.chinabuilding.com.cn/book-1943.html-12J201',
 publisherSource:'https://ebook.chinabuilding.com.cn/zbooklib/book/detail/show?SiteID=1&bookID=55880',checkedOn,
 clause:'目录：A12檐沟、A17出入口、E4～E5蓄水檐沟/女儿墙落口、H19检修孔',page:null,
 verification:'本次核对官方目录及适用范围，并未取得上述各完整详图页；目录只作进一步定位，不用作新增构造或尺寸依据。该图集旧分级仍须服从GB 55030—2022。',
};
export function roofBatchTwoReferences(def){
 const base=[drawingReference,{
  kind:'source-instance',standard:'用户提供的教材原图实例',officialSource:'/images/roof/'+def.file,
  clause:def.figure??'所给局部图；图号未包含在截图内',page:null,checkedOn,
  verification:'本轮逐图查看全貌与密集局部；只保留可辨构件、视图、尺寸及层次。原图不是现行标准的合规证明。',
 },sharedWater()];
 if(def.id.startsWith('water-storage'))base.push(storage(),atlasCatalogue);
 else if(def.id.includes('tile-roof'))base.push(tiles());
 else if(def.id==='roof-access-hatch-01')base.push(roof('4.11.21及图4.11.21','39','48','https://gf.cabr-fire.com/article-49282.htm','实际阅读垂直出入口图，核对压顶圈下收头和附加层转折。原图250保持原数，不暗改为≥250或补出现代示意中的其他尺寸；局部不证明净口、盖板承载或防坠已符合。'),atlasCatalogue);
 else base.push(drainage(),atlasCatalogue);
 return base;
}
export function roofBatchTwoDifferences(def){
 const result=[];
 if(def.id.startsWith('water-storage'))result.push('原图两级墙孔和空心板为历史构造局部；GB 50345—2012 4.4.10的池体、分区和供排水要求须独立落实，不能以本图或模型证明已满足。');
 if(def.id==='eaves-gutter-01')result.push('原图横向≥200与GB 50345—2012 4.2.11对钢筋混凝土檐沟净宽的要求不同；原图材料测界未完全核定，保留原投影，不把≥200说成现行净宽下限，也不在重绘时偷偷改数。');
 if(def.id.includes('tile-roof'))result.push('原图3厚卷材/≥2涂膜是替代标法。当前设防按GB 55030—2022的防水等级与系统确定，不能把这一条原标解释成任何等级均足够。');
 if(def.id==='mortar-bed-tile-roof-01')result.push('本图保留砂浆卧瓦历史实例；对烧结瓦、混凝土瓦，GB 50345—2012 4.8.11的干法挂瓦与可靠固定要求另行适用。');
 return result;
}
