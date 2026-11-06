// Read-only source review completed on 2026-11-01 for batch-one drawings 04–08.
// localSource is relative to the drawing audit directory. Source snapshots are
// copied by the caller; this module does not download or modify any artifact.
// For source-instance entries, officialSource points to the supplied image;
// it is not a claim that the historical illustration is a current standard.
const checkedOn = '2026-11-01';
const archive = 'standards/review-2026-11-01/';
const waterproofAnnouncement = 'https://www.mohurd.gov.cn/gongkai/zc/wjk/art/2022/art_17339_768499.html';
const roofCodeStatus = 'https://ebook.chinabuilding.com.cn/zbooklib/book/detail/show?SiteID=1&bookID=60869';
const roofCodePdf = 'https://jncc.jinan.gov.cn/attach/0/cbe8bbd564d441da855045b991be1fac.pdf';
const roofCodeDetails = 'https://gf.cabr-fire.com/article-49282.htm';
const atlasCatalogue = 'https://www.chinabuilding.com.cn/book-1943.html-12J201';
const roofCodeBoundary = '截至核对日，国标电子书库仍列GB 50345—2012为现行；住建部2022年第147号公告已废止其中3.0.5、4.5.1、4.5.5、4.5.6、4.5.7、4.8.1、4.9.1、5.1.6原强制条文。与GB 55030—2022不一致时执行后者，不把整本GB 50345称为废止。';
const atlasBoundary = '12J201本次官方查询仍列现行，适用排水坡度2%～5%、钢筋混凝土结构层的工业与民用平屋面。2012版及2013年更正图页的具体设防、材料和厚度仍须服从GB 55030—2022；不把商品入库日期说成新版。';

function instance(file, figure, verification) {
  return {
    kind: 'source-instance',
    standard: '教材原图实例（几何、标注与材料名称来源）',
    officialSource: '/images/roof/' + file,
    clause: figure || '原截图未包含图号；按所给图像核对',
    page: figure ? figure + '；原截图未给教材印刷页码' : '所给原图局部；教材印刷页码未取得',
    checkedOn,
    verification,
    localSource: archive + 'original-' + file,
  };
}

function waterproof(clause, page, verification) {
  return {
    kind: 'standard-corroboration',
    standard: 'GB 55030—2022 建筑与市政工程防水通用规范',
    officialSource: waterproofAnnouncement,
    publisherSource: 'https://ebook.chinabuilding.com.cn/zbooklib/book/detail/show?SiteID=1&bookID=154718',
    clause,
    page,
    checkedOn,
    verification: verification + ' 已放大阅读住建部官方扫描原件；全部条文强制，2023-04-01实施。旧图局部不代表现代完整设防已经满足。',
    localSource: archive + 'GB55030-2022-official.pdf',
  };
}

function roofCode(clause, page, verification, readingSource = roofCodeDetails) {
  return {
    kind: 'standard-corroboration',
    standard: 'GB 50345—2012 屋面工程技术规范',
    officialSource: roofCodeStatus,
    documentSource: roofCodePdf,
    readingSource,
    readingSources: [readingSource, ...(clause.includes('4.2.') ? ['https://gf.cabr-fire.com/article-49194.htm'] : [])],
    statusSource: waterproofAnnouncement,
    clause,
    page,
    checkedOn,
    verification: verification + ' 实际阅读政府域名公开PDF相关页，并与中国建筑科学研究院建筑防火研究所在线原文交叉核对。' + roofCodeBoundary,
    localSource: archive + 'GB50345-jinan.pdf',
  };
}

function atlas(page, figure, filename, verification, correction = false) {
  return {
    kind: 'atlas-page-corroboration',
    standard: '12J201 平屋面建筑构造',
    officialSource: atlasCatalogue,
    publisherSource: 'https://ebook.chinabuilding.com.cn/zbooklib/book/detail/show?SiteID=1&bookID=55880',
    documentSource: 'https://www.chinabuilding.com.cn/bztbase/' + (correction ? 'gengzheng/' : 'yangzhang/') + filename,
    clause: figure,
    page: page + '（实际取得并放大阅读的官方公开' + (correction ? '更正页' : '样张') + '）',
    checkedOn,
    verification: verification + ' ' + atlasBoundary,
    localSource: archive + filename,
  };
}

const atlasIllustrationScope = () => atlas(
  'A2',
  '2.2.5；并查看2.2.3～2.2.4及表3～5的适用背景',
  '12J201_A2g.jpg',
  '更正页说明大比例防水图例本身不指定具体材料，材料需回到所选做法核定。本次只用它约束识图范围；旧分级和厚度表不作为重绘增补参数。未据目录声称已读A15～A16变形缝完整图页。',
  true,
);

export const roofReviewReferencesById = {
  'coating-parapet-flashing-01': [
    instance(
      'coating-parapet-flashing-diagram.png',
      '图6-40',
      '逐项核对墙体剖切、墙槽、压条、水泥钉、涂膜与附加卷材的分层转折、板端油膏嵌缝及水泥砂浆抹灰。≥250和60分别取自原图相邻竖向尺寸段；未由规范倒推墙槽尺寸、涂膜厚度或固定间距。',
    ),
    waterproof(
      '2.0.2；4.4.1及表4.4.1-1；4.4.5、4.4.6',
      '印刷页2、15～17；官方PDF第6、19～21页',
      '核对屋面防水寿命、按等级设防及局部增强、保护的系统背景；只旁证节点须与完整防水系统衔接，不把≥250和60都归为本规范统一要求。',
    ),
    roofCode(
      '4.11.14，特别是第2～5款；图4.11.14-2；对应条文说明',
      '印刷页32～33、136～137；PDF第41～42、145～146页',
      '实际核对高女儿墙泛水、角部附加层、上端收头和上部墙面防水。图4.11.14-2旁证接口分工；原图涂膜、附加卷材和凹槽轮廓仍分别保留，不照搬现代示意的保温层或盖板。',
    ),
    atlas(
      'B6',
      '倒置式屋面女儿墙泛水，图1～6及附注',
      '12J201_B6.png',
      '实际核对上翻、角部附加层、固定及密封关系。B6为倒置式屋面，与原图的系统层序不同；只作接口旁证，不能据此给原图加倒置保温、@500固定间距或防火隔离带。A13原图集页未取得，不称其已验证。',
    ),
  ],
  'coating-high-low-roof-flashing-01': [
    instance(
      'coating-high-low-roof-flashing-diagram.png',
      '图6-41',
      '逐项核对高墙与低屋面间隙、U形跨缝段、外侧镀锌薄钢板、墙槽嵌缝和两处水泥钉/压条固定。图题沿用涂膜屋面语境，但原图材料引线实标防水卷材；≥250取自原图，缝宽和板厚未标。',
    ),
    waterproof(
      '4.4.5第3款；并核对4.4.1',
      '印刷页15～17；官方PDF第19～21页',
      '实际阅读高低跨变形缝的立墙泛水须适应变形、变形缝处设附加层及防水上翻的原文。仅支持跨缝密封关系，不确定原图U形深度、缝宽或钢板规格。',
    ),
    roofCode(
      '4.11.18第1、2、4款；图4.11.18-2；对应条文说明',
      '印刷页36～37、138；PDF第45～46、147页',
      '实际核对高低跨变形缝的可变形封盖和外部金属保护。标准示意不是该历史节点的定型详图；不得把U形跨缝段改成紧贴基层的直线，也不得用钢板将两侧刚性锁死。',
    ),
    atlasIllustrationScope(),
  ],
  'straight-rainwater-outlet-65-01': [
    instance(
      'straight-rainwater-outlet-65-diagram.png',
      null,
      '实际核对定型铸铁水落口的口罩、口杯/下接管及板洞口嵌合、油膏嵌缝和1∶2.5水泥砂浆。底部尺寸为6、100、6，测点按原图。原截图只有定型铸铁水落口标注，没有65或DN65文字；65型是既有条目命名，不据此改口径。',
    ),
    waterproof(
      '4.4.3、4.4.4、4.4.5；5.4.3、5.4.4',
      '印刷页16～17、26；官方PDF第20～21、30页',
      '核对排水、防水增强、施工防堵及檐沟天沟雨水口蓄水检验的系统要求。局部口杯图不提供汇水流量、雨量或选型计算，原图产品几何不因条文而改换。',
    ),
    roofCode(
      '4.11.16；图4.11.16-1；对应条文说明；另核对4.2.4在线原文',
      '印刷页35～36、137～138；PDF第44～45、146～147页；4.2.4另见在线章节',
      '实际核对直式口杯与承重结构固定、金属防锈、周边汇水坡和防水伸入口杯。500mm指周边直径范围，50mm指防水层伸入口杯的长度；它们仅为现代细部核查值，不代替本图6/100/6或生成未画出的附加尺寸。排水能力仍需按给排水条件计算。',
    ),
    atlas(
      'A12',
      '卷材、涂膜防水屋面檐沟，图1～3及a～d',
      '12J201_A12.png',
      '实际看过沟底、立边连续防水、端头密封及外缘断水。它是檐沟系统样张，只作汇水构件周边衔接的间接旁证，不是65型口杯的制造或选型图；A18～A20完整雨水口图页未取得。',
    ),
  ],
  'straight-rainwater-outlet-cast-iron-01': [
    instance(
      'straight-rainwater-outlet-cast-iron-diagram.png',
      null,
      '实际核对镀锌钢丝球的通透网格及进入喉部的收束端、铸铁口、砂浆与板洞口界面、油膏嵌缝和1∶2.5配比。原图未给球径、丝径、网格间距、管径或壁厚，不从像素比例补造工程尺寸。',
    ),
    waterproof(
      '4.4.3、4.4.4、4.4.5；5.4.3、5.4.4',
      '印刷页16～17、26；官方PDF第20～21、30页',
      '核对排水通畅、节点增强、施工防堵和雨水口检验的系统要求，不据此认定镀锌钢丝球是现行指定拦污形式。',
    ),
    roofCode(
      '4.11.16；图4.11.16-1；对应条文说明；另核对4.2.4在线原文',
      '印刷页35～36、137～138；PDF第44～45、146～147页；4.2.4另见在线章节',
      '实际核对金属防锈、口杯固定和防水与口杯的连续收接。该条没有指定镀锌钢丝球及其尺寸；历史拦污构件按原图保留，排水性能、清理条件及现行产品适配仍须另核。',
    ),
    atlas(
      'A12',
      '卷材、涂膜防水屋面檐沟，图1～3及a～d',
      '12J201_A12.png',
      '实际读取檐沟内连续防水与端部密封，只旁证周边系统衔接。该页未验证本图钢丝球及铸铁口制造形状，不能把其口部图示替换成本图实物；A18～A20完整图页未取得。',
    ),
  ],
  'free-fall-ring-beam-eaves-01': [
    instance(
      'free-fall-ring-beam-eaves-01-diagram.png',
      null,
      '实际核对圈梁与挑檐板整体剖形、右侧空心板孔洞、隔离层、防水层、檐端滴水及左上60的两条竖向测界。60是檐端局部水平尺寸，不是板厚或整个悬挑长度。传统刚性防水身份依教材上下文记录，孤立截图未给材料强度、层厚或配筋。',
    ),
    waterproof(
      '2.0.2；4.4.1及表4.4.1-1；4.4.3、4.4.4',
      '印刷页2、15～16；官方PDF第6、19～20页',
      '实际核对现代平屋面分级设防和排水背景。表中主防水材料列卷材与涂料，历史单一刚性防水层不能直接宣称满足当前整屋面要求；保留历史实例，不在图内补入现代多道柔性设防。',
    ),
    roofCode(
      '4.11.5、4.11.7及图4.11.7；对应条文说明；另核对4.2.3在线原文',
      '印刷页28、134～135；PDF第37、143～144页；4.2.3另见在线排水设计章节',
      '实际核对外缘滴水/鹰嘴的断水作用。图4.11.7是涂膜屋面，只旁证檐端排水原理，不是传统刚性层的完整设计。无组织排水的适用还取决于建筑高度、气候等条件，并须同时满足现行通用规范排水要求。',
    ),
    atlas(
      'A12',
      '卷材、涂膜防水屋面檐沟，详图c、d及图1～3',
      '12J201_A12.png',
      '实际读取c、d外缘断水处理，仅旁证滴水路径。A12为有组织檐沟，不能替代本图自由落水圈梁挑檐，不复制其中沟槽、保温层、钢压条或尺寸。A11完整檐口挑檐图页未取得。',
    ),
  ],
};

// Each value is a string array suitable for the evidence record's unresolved
// field. Unread atlas pages and absent source dimensions stay explicit.
export const roofReviewLimitationsById = {
  'coating-parapet-flashing-01': [
    '≥250和60按原图分别记录；涂膜厚度、附加卷材品种、固定间距和原图未示层次不由现代示意补造。',
    '12J201实际读取B6为倒置式女儿墙样张，只支持转折与收头关系；A13完整图页未取得。',
    '局部旧图不构成完整屋面设防审定；GB50345仍现行但旧强条部分废止，冲突时执行GB55030。',
  ],
  'coating-high-low-roof-flashing-01': [
    '图题为涂膜屋面语境，原引线实标防水卷材；不得以图题覆盖材料实标或消除U形跨缝自由度。',
    '原图未给缝宽、钢板厚度、卷材规格和背衬材料；规范示意不提供该实例的补充尺寸。',
    '12J201只实际读取A2更正页表达范围；A15～A16变形缝完整图页未取得，不能声称已验证。',
    'GB50345仍现行但旧强条部分废止，跨缝接口旁证不代表本图满足现行整屋面设防。',
  ],
  'straight-rainwater-outlet-65-01': [
    '原图只有定型铸铁水落口及6/100/6、1∶2.5实标；65型命名出处未取得，不解释为DN65。',
    '未核制造标准、产品选型或汇水能力；现代直式口图中的500mm直径范围和50mm伸入长度不替代原产品几何。',
    '12J201实际读取A12仅为系统衔接的间接旁证；A18～A20完整雨水口图页未取得。',
    'GB50345仍现行但旧强条部分废止，需与GB55030的设防、排水与检验要求合用。',
  ],
  'straight-rainwater-outlet-cast-iron-01': [
    '钢丝球为原图历史拦污构件；本次所读规范没有指定该形式、球径、丝径或网格间距。',
    '原图未给管径和壁厚，不从像素补尺寸；未核现行产品、排水流量和维护清理条件。',
    '12J201实际读取A12不验证本图钢丝球或口杯型号；A18～A20完整图页未取得。',
    'GB50345仍现行但旧强条部分废止，节点防水接口旁证不等于整屋面现行合规。',
  ],
  'free-fall-ring-beam-eaves-01': [
    '本图保留传统刚性防水教学实例；不得将单一旧刚性层说成满足GB55030完整分级设防。',
    '60仅为檐端局部水平尺寸；原图未给配筋、锚固、材料强度和防水层厚度，不补造结构设计。',
    '现代涂膜檐口和12J201 A12有组织檐沟只旁证滴水原理，不替换本图；A11完整图页未取得。',
    '自由落水的工程适用性须结合建筑高度、气候和现行排水系统设计核定；局部图不能提供结论。',
    'GB50345仍现行但旧强条部分废止；本轮未做工程审图或整屋面适用性审定。',
  ],
};

export const revisionNotesById = {
  'coating-parapet-flashing-01': [
    '分开记录原图≥250、60及凹槽收头，增加高女儿墙条文与B6实读页的适用边界。',
    '明确原图层序和现代防水系统要求各自的证据来源。',
  ],
  'coating-high-low-roof-flashing-01': [
    '明确原标防水卷材、U形跨缝与外部钢板的分工，补充高低跨缝实际条文和图号。',
    '保留跨缝变形要求，标明A15～A16未取得完整图页。',
  ],
  'straight-rainwater-outlet-65-01': [
    '将65型条目名与原图6/100/6尺寸分开，补充直式水落口原文旁证。',
    '说明A12仅支持周边系统衔接，不验证产品型号及排水能力。',
  ],
  'straight-rainwater-outlet-cast-iron-01': [
    '区分历史钢丝球、铸铁口及周边防水关系，明确未标尺寸不补造。',
    '补充直式口条文，撤除对图集未读完整页或钢丝球通用性的推断。',
  ],
  'free-fall-ring-beam-eaves-01': [
    '明确60测界、结构挑檐及空心板原图关系，保留传统刚性防水实例身份。',
    '将现代滴水旁证与现代完整设防要求分别说明，不在旧图内替换系统。',
  ],
};
