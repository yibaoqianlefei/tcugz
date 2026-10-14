import json
import re
from pathlib import Path
from collections import Counter

root = Path('audit-output/textbook-overall-audit-2026-10-12')
project = Path.cwd().as_posix()
read = lambda name: json.loads((root / name).read_text(encoding='utf-8'))
inventory = read('inventory.json')
browser = read('browser-evidence.json')['summary']
models = read('models-principles-findings.json')
all_raw = {}
for name in ['first-half-findings.json', 'second-half-findings.json', 'models-principles-findings.json', 'platform-findings.json']:
    for finding in read(name)['findings']:
        all_raw[finding['id']] = finding

def absolute(file):
    return file.replace('\\', '/') if len(file) > 2 and file[1] == ':' else project + '/' + file.replace('\\', '/')

def normalize(finding):
    locations = [{'file': absolute(finding['file']), 'line': finding['line']}]
    locations.extend({'file': absolute(item['file']), 'line': item['line']} for item in finding.get('related_locations', []))
    refs = finding.get('primary_source_urls', [])
    for item in finding.get('references', []) + finding.get('official_sources', []):
        refs.append(item['url'])
    return {
        'id': finding['id'], 'severity': finding.get('severity', finding.get('priority')),
        'title': finding['title'], 'locations': locations, 'status': finding.get('status', 'confirmed'),
        'evidence': finding.get('evidence', finding.get('evidence_excerpt', '')),
        'observation': finding.get('observation', ''), 'impact': finding['impact'],
        'recommendation': finding['recommendation'], 'source_ranges': finding.get('source_ranges', []),
        'source_evidence': finding.get('source_evidence', ''), 'references': refs,
    }

blueprint = [
    (['MP-01'], None, 'P1'), (['MP-02'], None, 'P1'),
    (['MP-03'], None, 'P2'), (['MP-04'], None, 'P2'), (['MP-05'], None, 'P2'),
    (['MP-06'], None, 'P2'), (['MP-07'], None, 'P2'),
    (['PT-01'], None, 'P2'), (['PT-05'], None, 'P2'),
    (['SH-06','MP-08'], '正文缺少关键教学图与原理对比证据，已有图模未形成随文教学链', 'P2'),
    (['FH-01'], None, 'P2'), (['FH-02'], None, 'P2'),
    (['FH-03','FH-04'], '砌体材料标注与组砌排块尚缺可操作的识图和尺寸实例', 'P2'),
    (['FH-05'], None, 'P2'), (['FH-06'], None, 'P2'),
    (['SH-01','SH-02'], '楼梯算例尚缺舒适性比较、明确判定与调整后的完整复核', 'P2'),
    (['SH-03'], None, 'P2'), (['SH-04'], None, 'P2'), (['SH-05'], None, 'P2'),
    (['SH-07','SH-08'], '实践任务缺统一起步题包、参考成果与可观察的评价档次', 'P2'),
    (['SH-09','FH-08'], '自测与识图、计算及绘图目标不完全对应', 'P2'),
    (['FH-07'], None, 'P3'), (['PT-02'], None, 'P3'), (['PT-03'], None, 'P3'), (['PT-04'], None, 'P3'),
]
findings = []
for index, (ids, title, priority) in enumerate(blueprint, 1):
    parts = [normalize(all_raw[id]) for id in ids]
    findings.append({
        'id': f'AO-{index:02d}', 'severity': priority, 'title': title or parts[0]['title'],
        'source_finding_ids': ids, 'locations': [loc for item in parts for loc in item['locations']],
        'details': parts, 'status': '已确认，具体参数的待核边界保留在各子项说明中',
    })
counts = dict(Counter(item['severity'] for item in findings))
assert counts == {'P1': 2, 'P2': 19, 'P3': 4}, counts
assert len({id for item in findings for id in item['source_finding_ids']}) == len(all_raw)
for finding in findings:
    for location in finding['locations']:
        file = Path(location['file'])
        assert file.exists(), location
        assert 1 <= location['line'] <= len(file.read_text(encoding='utf-8').splitlines()), location

chapter_plan = [
    ('introduction','绪论','分类维度、基本构成、影响因素、设计协同、三种尺寸及基本模数算例。','等级查表案例；平立剖、轴线、标高与索引图例；制图规范依据栏。','AO-11、12、22'),
    ('foundation','基础与地基','地基/基础、侧阻/端阻、埋深因素、地下防护、抗浮与差异沉降。','一组简化地层与荷载条件，候选基础平剖对照，以及底板—外墙防水节点。','AO-04、15'),
    ('wall','墙体','作用与分类、砌筑、隔墙、墙脚与洞口细部、设计性能、饰面连接。','MU/M材料标注；两皮排块、转角与洞口尺寸链；同步防潮和模型卡条件。','AO-05、13'),
    ('door-window','门窗','四种尺寸口径、三种面积比、四类缝、开启方式、安装与性能协调。','一套有窗表、开启立面、安装剖面和面积/净尺寸计算的教学窗。','AO-14'),
    ('floor','楼地层','板/地坪、五类传力、施工阶段、地面材料、湿区、阳台、装修与顶棚。','给定支承与轴网的梁格布置示范，湿区及吊顶节点和完整做法表。','AO-17、10'),
    ('stairs','楼梯','16/8/7计数、投影与净空量法、板梁式及预制、细部、坡道与设备接口。','首层入口从失败到修改的算例，首/标准/顶层平剖图和齐/错步比较；修语义联动。','AO-06、16'),
    ('roof','屋顶','排水/防水、材料工艺、节点、正置/倒置、金属与种植屋面基础机理。','先修旧模型层次和坡度；再补完整平屋面系统案例与矩形/L形脊谷作图。','AO-01、02、18、19'),
    ('deformation-joint','变形缝','三类缝、断开范围、设置场景、位移条件、盖缝及多专业接口。','断开范围图和可动/固定位置示意；一个判断/修改的节点练习。','AO-10、21'),
    ('principles','构造原理','热、水、声、火的概念、路径、适用条件、读图检查与概念自测。','每专题一幅路径图和一个条件明确的比较任务；热湿/声/防火给可核查证据。','AO-10、07'),
    ('practice','实践任务','7类目标、步骤、提交物和自查；两种调研模式、五张综合图及权重。','统一小建筑题包、完整成果与典型错误样例，三档表现量规及任务进阶。','AO-20、21'),
]

summary = {
    'audit_started':'2026-10-12','audit_completed':'2026-10-13','scope':'本地文字教材、原讲义分配、模型知识卡、训练、案例、伙伴和阅读界面',
    'verdict':'当前具备可阅读的文字讲义基础；正式图文交互教材仍需先修知识卡错误，再补识图、算例、练习和资料证据。',
    'counts': counts, 'totals': inventory['totals'], 'browser': browser,
    'model_coverage': models['coverage'], 'findings': findings,
    'standards_note':'对关键冲突和少量版本做一手核查，未进行工程设计条文全量认证。',
    'withdrawn_suspicions':['墙身防潮A仅凭nodes.name判断旧001失配已撤回，浏览器与meshes.name证据证明匹配正常。'],
    'unverified_items':['首层出入口02–04的同型绑定仅静态待抽测','反向手动知识卡步骤不用于确认联动状态','图中固定厚度/强度等需逐个按来源和系统核查','第三方/受访问限制案例资料不据工具403认定学生端失效'],
}
(root/'整体审计问题清单.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

def link(location):
    return f"[{Path(location['file']).name}:{location['line']}](<{location['file']}:{location['line']}>)"

lines = [
    '# 建筑构造教材整体审计报告',
    '', '审计开始于 2026-10-12，完成于 2026-10-13。沿用开始日期命名证据目录。审计对象为本地网站当前版本，原 DOC 与教材、模型及知识卡未作内容修改；本轮只保存报告、夹具和截图，生产构建更新了 dist。',
    '', '## 审计结论',
    '', '**网站阅读功能通过核查，文字教材已经形成较清楚的知识框架；整体仍适合作为教学讲义初稿，尚不能把全部图模和参数作为已审定的正式构造教材。**',
    '', '新整理的章节与原理正文中，核心概念区分及已给几何演算未发现本轮确认的 P1 错误。扩大到既有模型知识卡后，确认两项应先修正的严重教学误导：平屋面功能/层位说明与实际模型冲突，檐沟把找坡方式和沟材的限值混用。它们又进入伙伴构件记录，正文的条件化说明不能自动消除旧卡片的错误。',
    '', '教学能力的主要短板是图、完整实例与应用练习。大部分页面能回答“是什么、为什么”，但尚不能独立完成“认图—查依据—计算/判断—修改—绘图”的全过程。七项实践对有前置方案的课堂较友好，缺少方案的自学者仍需要起步题包和参考成果。',
    '', f"合并重复或高度关联发现后，共 **{len(findings)} 项：P1 {counts['P1']} 项、P2 {counts['P2']} 项、P3 {counts['P3']} 项**。P1 为明确的严重误导，P2 为重要一致性或教学能力缺口，P3 为表达、来源入口与自学体验改善。该分级不是教学质量百分制评分。",
    '', '## 范围与证据',
    '', '| 核查项 | 当前结果 | 解释边界 |', '| --- | --- | --- |',
    '| 正文 | 54篇：核心41、原理6、实践7；62524个汉字 | 已逐页通读，字数不代表知识深度 |',
    '| 路由 | 64个阅读/目录地址 | 正文正式副本与实际lesson副本相同，不能据此证明全部语义正确 |',
    '| 教学图表 | 正文19个表格、0个嵌入图片 | 网站另有节点二维图与封面，不能把正文0图误述为全站无图 |',
    '| 模型引用 | 10篇正文直链到15个不同模型 | 基础、门窗和原理正文目前无直接模型链接 |',
    '| 图模资产 | 53个available节点，对应59个GLB路径存在 | 不是所有资产均经过逐构件实点和专业审校 |',
    '| 训练 | 8种模式、17题，只涉及6个节点，8题在檐沟 | 功能模式数量不等于章节内容覆盖数量 |',
    '| 依据入口 | 11篇正文含外部资料链接 | 统一来源说明已有，具体标准与模型参数仍缺完整主题级依据目录 |',
    '| 浏览器 | 64地址×1440/390/320px，共192次访问通过 | 没有空白、溢出、高度错位和运行错误；不等于全部无障碍与远程网络性能认证 |',
    '| 自动检查 | 全文渲染/链接/路由、伙伴、训练、TypeScript及Vite构建通过 | 这些检查没有覆盖图片、每道题的教学层级、所有模型身份与全部规范参数 |',
    '', '原讲义的234个内容块归位记录为主题对应，P编号为提取段落位置而非Word页码。分配登记不等于逐粒度教学知识已完全保留。原图、浮动对象与坏表未完整恢复；不能从纯文字提取结果推断原图具体做法。原DOC哈希与前次记录一致。',
    '', '## 先处理的两项严重问题',
    '', '1. **平屋面层次和功能。**冷底子油与干铺卷材的卡片都说位于保温层下方，GLB实际几何把它们放在上方；干铺卷材还在防水与保护之间。需结合原图审定基层处理/隔离等功能，同步总说明与伙伴，不能通过移动模型去迎合错误文字。',
    '', '2. **檐沟坡度和适用条件。**现卡片把结构层写为≥2%找坡，又把镀锌钢板和混凝土沟统一写为纵坡≥0.5%。GB55030-2022第4.4.3条区分结构找坡与混凝土沟；前者3%、后者1%的条件在[政府托管引用文本第8页（PDF第11页）](https://ghzrzyw.beijing.gov.cn/zhengwuxinxi/zcwj/qtwj/202412/P020241225565818834800.pdf)可核查。整改应先拆清找坡方式与沟材，再审定条款，不能只替换数字。',
    '', '另需处理SBS表的版本：旧GB18242-2008已于2026-05-01废止，被[GB/T18242-2025](https://openstd.samr.gov.cn/bzgk/std/newGbInfo?hcno=7EA6F5078E8E89A1421BF3DC30906953)代替，见[国家标准平台旧标准状态](https://std.samr.gov.cn/gb/search/gbDetailed?id=71F772D75A79D3A7E05397BE0A0AB82A)。当前表只写无年份GB18242，且未说明产品类别和试验条件；不能机械更名后沿用旧数值。此四行表格仅在UI显示，未直接被序列化进伙伴，错误描述的传播另有实际证据。',
    '', '## 章节能力与补齐方向',
    '', '| 板块 | 正文数 / 汉字 | 已具备 | 主要补齐 | 关联项 |', '| --- | --- | --- | --- | --- |',
]
for group,title,present,missing,ids in chapter_plan:
    stat=inventory['groups'][group]
    lines.append(f"| {title} | {stat['articles']} / {stat['chineseCharacters']} | {present} | {missing} | {ids} |")
lines.extend([
    '', '## 问题索引', '', '| 编号 | 优先级 | 问题 | 首要定位 |', '| --- | --- | --- | --- |',
])
for item in findings:
    lines.append(f"| {item['id']} | {item['severity']} | {item['title']} | {link(item['locations'][0])} |")
lines.extend(['', '## 逐项证据与修订建议'])
for item in findings:
    lines.extend(['', f"### {item['id']} · {item['severity']} · {item['title']}", '', '合并来源：'+'、'.join(item['source_finding_ids'])+'。定位：'+'；'.join(link(loc) for loc in item['locations'][:4])+'。'])
    for detail in item['details']:
        lines.extend(['', '**证据：** '+detail['evidence']])
        if detail['observation']: lines.extend(['', detail['observation']])
        if detail['source_ranges']: lines.extend(['', '源段落：'+ '、'.join(detail['source_ranges'])+'。'+detail['source_evidence']])
        lines.extend(['', '**影响：** '+detail['impact'], '', '**建议：** '+detail['recommendation'], '', '**确认边界：** '+detail['status']])
        if detail['references']:
            lines.extend(['', '核查入口：'+'；'.join(f'[来源{index}]({url})' for index,url in enumerate(detail['references'],1))+'。'])
lines.extend([
    '', '## 可执行的修订顺序与验收',
    '', '| 顺序 | 修改对象 | 应交付的结果 | 验收重点 |', '| --- | --- | --- | --- |',
    '| 1 | 平屋面、檐沟、SBS、阶梯基础和防潮卡片 | 图/模型/卡片/来源一致的审定记录，并同步实际传播渠道 | 两个P1消除；每个通用参数有对象、条件、版本和条款；历史模型明确标识 |',
    '| 2 | 首层楼梯语义联动、图纸副标题和正文图片管道 | 稳定的构件身份、对象正确的标题、可显示且可读的图与alt | 模型点选命中指定知识卡；正向和反向分别实测；图片进入正式页 |',
    '| 3 | 制图、门窗、砌体、基础、楼板、楼梯及屋面实例 | 条件明确、可逐步跟随的图题、计算和完整做法样例 | 学生能认图、完成一项判断/计算，再核查修改结果 |',
    '| 4 | 七项实践及自测 | 统一起步题包、完整参考成果、典型错误与表现量规 | 无个人方案的学生也能启动；同一学习目标有概念与应用验证 |',
    '| 5 | 伙伴定位、来源目录、阅读位置和排版 | 小节级来源与跳转、可追溯依据、续读和清洁格式 | 选中前/中/后段能找到对应上下文；段落链接稳定；无字面标记 |',
    '', '优先图谱建议：平立剖/轴线索引一组；砖砌体两皮排块与洞口；基础类型及地层/地下防水转折；楼板支承与梁格；首/标准/顶层楼梯平剖及齐错步；正置/倒置屋面层序；檐沟/落口/泛水；矩形与L形脊谷；三类变形缝断开范围与可动连接。先核查并复用已有二维资产，缺项再制作，图注应记录来源、重绘及教学简化范围。',
    '', '## 撤回疑点与未完成认证',
    '', '墙身防潮A模型曾因只看nodes.name、不看meshes.name而被怀疑无法匹配旧001名称。实际3D点击命中dense-base::地面垫层为密实材料001并显示卡片，已撤回该判断。首层出入口01则真实命中整体长题名，右侧六个语义构件卡没有展开，并出现名称未匹配的开发警告；02—04仅作静态候选，不登记为全部实点故障。',
    '', '模型特定厚度、强度、配方与历史材料没有被一律判违规。泡沫保温等卡片的系统条件、旧图适用性仍应继续复核。法恩斯沃斯部分原始资料在本次工具中返回403，未据此认定用户浏览器链接失效。局部对比度计算不构成WCAG全量认证，59个GLB路径存在不构成59个模型专业认证。',
    '', '自测为公开自主学习，参考答案和前端题库可见符合当前产品定位；本轮没有要求把它改造成安全考试系统。实践的权重相加正确，但权重本身没有提供评分档次。',
    '', '上轮verification生成脚本写入的passed字段是实施摘要，不能单独当作随源变化自动运行的检验器。本轮自动检查有实际执行记录，教学深度与标准冲突依靠逐页、跨渠道和一手资料核查。',
    '', '## 证据文件',
    '', '- [结构化整体问题清单](./整体审计问题清单.json)：25项合并发现与原子发现关联。',
    '- [逐页库存](./inventory.json)：正文长度、图表、链接、目标标题与同步状态。',
    '- [浏览器证据](./browser-evidence.json)：192次访问与逐地址观测。',
    '- [平台夹具](./platform-probes.json)：图片丢失、字面强调、对比度和阅读位置。',
    '- [模型实点证据](./node-interaction-evidence.json)：两节点的实际选择身份及确认边界。',
    '- [执行记录](./execution-evidence.json)：实际命令、日期、结果和环境说明。',
    '- [前半正文](./first-half-findings.md)、[后半正文](./second-half-findings.md)、[模型与原理](./models-principles-findings.md)：详细原始审阅。',
    '', '本轮报告保存审计发现与修订要求，尚未执行上述教材修复。网站服务已恢复，便于继续核查。',
])
report_text = '\n'.join(lines)+'\n'
report_text = re.sub(r'\]\(\./([^)]*)\)', lambda match: f'](<{project}/{root.as_posix()}/{match[1]}>)', report_text)
(root/'教材整体审计报告.md').write_text(report_text,encoding='utf-8')

matrix=['# 章节审计与修订矩阵','','开始2026-10-12，完成2026-10-13。能力判断基于逐页审閱和原资料对照，未使用百分制评分。','','| 板块 | 篇数 | 现有能力 | 关键补齐 | 关联发现 |','| --- | --- | --- | --- | --- |']
for group,title,present,missing,ids in chapter_plan:
    matrix.append(f"| {title} | {inventory['groups'][group]['articles']} | {present} | {missing} | {ids} |")
matrix.extend(['','优先完成AO-01/02，随后按总报告的修订顺序实施；避免以主题路由已登记代替图文、实例和任务完成度核查。'])
(root/'章节审计与修订矩阵.md').write_text('\n'.join(matrix)+'\n',encoding='utf-8')
print(json.dumps({'findings':len(findings),'priorities':counts,'report_chinese_characters':sum('\u3400'<=c<='\u9fff' for c in '\n'.join(lines))},ensure_ascii=False))
