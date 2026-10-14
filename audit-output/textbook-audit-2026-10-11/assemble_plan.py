from pathlib import Path
import json, collections, hashlib, re

OUT = Path(__file__).parent
PROJECT = OUT.parent.parent
SOURCE = Path(r'D:\构造相关内容\建筑构造上册讲义-李峰.doc')
def read_json(name):
    return json.loads((OUT/name).read_text(encoding='utf-8'))
paragraphs = read_json('paragraphs.json')
metadata = read_json('extraction-metadata.json')
inventory = read_json('site-inventory.json')
blocks = read_json('root-blocks.json') + read_json('first-half-blocks.json') + read_json('second-half-blocks.json')
blocks.sort(key=lambda x:x['source_start'])
assert hashlib.sha256(SOURCE.read_bytes()).hexdigest()==metadata['sha256'], '原稿已改变，须重新定位'
coverage = collections.Counter()
for block in blocks:
    assert isinstance(block['source_start'],int) and isinstance(block['source_end'],int)
    assert 1 <= block['source_start'] <= block['source_end'] <= len(paragraphs), block
    coverage.update(range(block['source_start'],block['source_end']+1))
missing = [n for n in range(1,len(paragraphs)+1) if not coverage[n]]
duplicates = [n for n,v in coverage.items() if v!=1]
assert not missing, f'未覆盖段落 {missing}'
assert not duplicates, f'重复主归属段落 {duplicates}'
known = {x['section_id']:x for x in inventory}
module_aliases = {'intro':'introduction','window':'door-window','windows':'door-window','deformation':'deformation-joint','doorWindow':'door-window'}
unknown_targets = []
for i,block in enumerate(blocks,1):
    block['allocation_id'] = f'B{i:03d}'
    block['destination_module'] = module_aliases.get(block['destination_module'],block['destination_module'])
    target = block['destination_section']
    if target in known:
        block['target_public_path'] = known[target]['public_path']
        assert known[target]['module']==block['destination_module'], f'模块归属不一致 {block}'
    elif target.startswith(('proposed:','archive:')):
        block['target_public_path'] = None
    else:
        unknown_targets.append(target)
assert not unknown_targets, f'目标ID未找到 {unknown_targets}'
configured = [x for x in inventory if x['module']!='principles' and x['section_id']!='index']
missing_sections = [x['section_id'] for x in configured if not any(b['destination_section']==x['section_id'] for b in blocks)]
assert len(configured)==35 and not missing_sections, f'现有配置子板块覆盖缺口 {missing_sections}'
(OUT/'content-allocation.json').write_text(json.dumps({'source_sha256':metadata['sha256'],'paragraph_count':len(paragraphs),'scope':'内容规划，未执行网站导入','blocks':blocks},ensure_ascii=False,indent=2),encoding='utf-8')

chapters = [
 ('introduction','绪论'),('wall','墙体'),('door-window','门窗'),('foundation','基础与地基'),
 ('floor','楼地层和装修专题'),('shared','饰面装修共享总论'),('stairs','楼梯'),('roof','屋顶'),('deformation-joint','变形缝'),
 ('training','训练任务'),('archive','源资料归档')]

def refpath(path):
    return str(path.absolute()).replace('\\','/')
def file_link(label,path,line=None):
    return f'[{label}](<{refpath(path)}'+(f':{line}' if line else '')+'>)'
def p_range(block):
    a,b=block['source_start'],block['source_end']
    return f'P{a:04d}' if a==b else f'P{a:04d}—P{b:04d}'
def merged_ranges(assigned):
    merged=[]
    for block in sorted(assigned,key=lambda x:x['source_start']):
        start,end=block['source_start'],block['source_end']
        if merged and start==merged[-1]['source_end']+1:
            merged[-1]['source_end']=end
        else:
            merged.append({'source_start':start,'source_end':end})
    return '、'.join(p_range(x) for x in merged)
lines_by_id = {}
for i,line in enumerate((OUT/'source-paragraphs.txt').read_text(encoding='utf-8').splitlines(),1):
    m = re.match(r'\[(P\d{4})\]',line)
    if m: lines_by_id[m.group(1)] = i

detail = ['# 建筑构造讲义逐块内容分配清单','',
 '本清单为后续编写正文提供主归属、原文范围、保留要点、去重方式及待核问题。现有页面位置经当前仓库核对；`proposed:`表示规划中的新板块或任务，`archive:`表示只保留原资料，尚未写入网站。','',
 f'原文共{len(paragraphs)}个定位条目，分为{len(blocks)}个连续且不重叠的主归属块。每个P条目恰好属于一个块；跨章节引用不另算主归属。P编号不是Word页码。','',
 '原文范围内含有标题、分页提示及课堂重复句；“保留要点”是整理方向，并不表示整段原文可以原样上线。图片与表格行列关系需回查原稿。','']
for module,title in chapters:
    chapter_blocks = [b for b in blocks if b['destination_module']==module]
    if not chapter_blocks: continue
    detail += [f'## {title}','']
    sections = collections.defaultdict(list)
    for block in chapter_blocks:
        sections[block['destination_section']].append(block)
    for section, section_blocks in sections.items():
        dest_title = known[section]['title'] if section in known else section_blocks[0]['destination_title']
        detail += [f'### {dest_title}','',f'归属ID `{section}`。','']
        if section in known:
            target=PROJECT/known[section]['public_path']
            assert target.exists()
            detail += [f'现有网页 {file_link(dest_title,target)}。当前状态：'+('已有简短正文，需合并并核验。' if known[section]['has_body'] else '占位，待编写正文。'),'']
        elif section.startswith('proposed:'):
            detail += ['建议新增承接位置；本轮未创建网页或训练任务。','']
        else:
            detail += ['原资料归档，不进入学生教材正文。','']
        for block in section_blocks:
            pid=f"P{block['source_start']:04d}"
            source_link=file_link(p_range(block),OUT/'source-paragraphs.txt',lines_by_id[pid])
            detail += [f"**{block['allocation_id']} {block['source_title']}**",'',f'原文 {source_link}。处理：{block["action"]}。','']
            points=block.get('content_points',[])
            if points:
                detail += ['保留及组织要点：',''] + [f'- {point}' for point in points] + ['']
            flags=block.get('review_flags',[])
            if flags:
                detail += ['整理或核验事项：',''] + [f'- {flag}' for flag in flags] + ['']
            refs=block.get('cross_references',[])
            if refs:
                detail += ['交叉引用：'+ '；'.join(str(x) for x in refs)+'。','']
detail_text='\n'.join(detail)
rendered_ids=re.findall(r'^\*\*(B\d+) ',detail_text,flags=re.M)
assert len(rendered_ids)==len(blocks) and len(set(rendered_ids))==len(blocks), '可读清单有遗漏或重复'
(OUT/'逐块内容分配清单.md').write_text(detail_text,encoding='utf-8')

overview=(OUT/'report-overview.md').read_text(encoding='utf-8')
matrix=['','## 现有板块的原文分配索引','',
 '下表覆盖全部35个现有配置子板块及额外的墙体概述页。拟新增板块、训练、档案的原文分配另见逐块清单。某一已有板块的主归属原文较少时，不能据此删除该板块；应标为补写或交叉引用。','',
 '| 网站板块 | 主归属原文范围 | 现状及编写提示 |','|---|---|---|']
for item in inventory:
    if item['module']=='principles': continue
    assigned=[b for b in blocks if b['destination_section']==item['section_id'] and b['destination_module']==item['module']]
    ranges=merged_ranges(assigned) or ('作为章导言，引用墙体作用、类型和设计要求内容' if item['section_id']=='index' else '无独立主归属块，须从相关原理与案例提炼或补写')
    state='已有简短正文，合并并核验' if item['has_body'] else '目前占位，待编写正文'
    module_label=dict(chapters).get(item['module'],item['module'])
    matrix.append('| '+module_label+' / '+item['title']+' `'+item['section_id']+'` | '+ranges+' | '+state+' |')
matrix += ['', '## 本轮交付及覆盖检查','',
 f'- {file_link("逐块内容分配清单",OUT/"逐块内容分配清单.md")}：逐块记录原文位置、目标板块、内容要点、合并与补写要求。',
 f'- {file_link("网站结构核对记录",OUT/"site-structure.md")}：网站现有模块、页面、正文状态、实际显示链及同步风险。',
 f'- {file_link("可继续处理的结构化分配表",OUT/"content-allocation.json")}：为后续编写和导入保留同一份主归属数据。',
 f'- {file_link("原文定位文本",OUT/"source-paragraphs.txt")}：支持按P编号检索核对。','',
 f'覆盖检查结果：4321个条目全部归位；共{len(blocks)}块，未分配0条，重复主归属0条。主归属覆盖表示没有遗漏原文资料，不表示所有内容都应保留为教材正文。原稿SHA256复核一致，未改动原稿。网站页面和源码未执行导入。','']
(OUT/'内容梳理与章节归位报告.md').write_text(overview+'\n'+'\n'.join(matrix),encoding='utf-8')
checks=dict(paragraph_count=len(paragraphs),block_count=len(blocks),unassigned_paragraphs=missing,multiply_assigned_paragraphs=duplicates,unknown_destinations=unknown_targets,existing_subsections=len(configured),uncovered_existing_subsections=missing_sections,source_unchanged=True,site_import_performed=False)
(OUT/'coverage-check.json').write_text(json.dumps(checks,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(checks,ensure_ascii=False))
print('Generated report and detailed allocation list')
