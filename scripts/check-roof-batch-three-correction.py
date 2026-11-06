"""Regression checks from r1 source-review findings, not an engineering approval."""
import hashlib, json, re
from pathlib import Path
from xml.etree import ElementTree as ET

ROOT = Path('audit-output/roof-source-redraw-batch-03-2026-11-03')
NS = {'s': 'http://www.w3.org/2000/svg'}
def group(tree, identity):
    return tree.find('.//s:g[@data-geometry-id="' + identity + '"]', NS)

def outlines(d):
    """Sample only the absolute M/L/H/V/Q/Z commands used in the corrected domains."""
    tokens = re.findall(r'[A-Za-z]|[-+]?(?:\d*\.\d+|\d+)', d)
    paths, pts, i, x, y, cmd = [], [], 0, 0., 0., None
    def number():
        nonlocal i
        value = float(tokens[i]); i += 1
        return value
    while i < len(tokens):
        if tokens[i].isalpha(): cmd = tokens[i]; i += 1
        if cmd == 'M':
            if pts: paths.append(pts)
            x, y = number(), number(); pts = [(x, y)]; cmd = 'L'
        elif cmd == 'L': x, y = number(), number(); pts.append((x,y))
        elif cmd == 'H': x = number(); pts.append((x,y))
        elif cmd == 'V': y = number(); pts.append((x,y))
        elif cmd == 'Q':
            cx,cy,ex,ey=number(),number(),number(),number()
            for j in range(1,101):
                t=j/100; pts.append(((1-t)**2*x+2*t*(1-t)*cx+t*t*ex,(1-t)**2*y+2*t*(1-t)*cy+t*t*ey))
            x,y=ex,ey
        elif cmd == 'Z':
            pts.append(pts[0]); paths.append(pts); pts=[]; cmd=None
        else: raise ValueError('Unsupported command '+str(cmd))
    if pts: paths.append(pts)
    return paths

def contains(poly,point):
    x,y=point; hit=False
    for a,b in zip(poly,poly[1:]+poly[:1]):
        if (a[1]>y)!=(b[1]>y) and x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]: hit=not hit
    return hit

checks=[]
for mode in ['textbook','node']:
    files={p.stem:p for p in (ROOT/mode).glob('*.svg')}
    trees={key:ET.parse(p).getroot() for key,p in files.items()}
    vent=trees['vent-pipe-roof-01']
    cove=[outlines(p.attrib['d'])[0] for p in group(vent,'pipe-root-coves').findall('s:path',NS) if p.attrib.get('fill')=='url(#mortar)']
    assert len(cove)==2
    assert any(contains(poly,(150,390)) for poly in cove), 'Left source solid cove became a void'
    assert any(contains(poly,(252,380)) for poly in cove), 'Right source solid cove became a void'
    assert not any(contains(poly,(212,380)) for poly in cove), 'Pipe bore filled'
    high=trees['high-low-roof-joint-02']
    paths=group(high,'waterproof-turn').findall('s:path',NS)
    points=[pt for p in paths for segment in outlines(p.attrib['d']) for pt in segment]
    assert not any(351 < x < 394 and 198 < y < 302 for x,y in points), 'Waterproof path enters low wall'
    cove26=outlines(group(high,'wall-external-cove').find('s:path',NS).attrib['d'])[0]
    assert contains(cove26,(400,280)) and not contains(cove26,(380,260)), 'Wall-external cove identity'
    for identity in ['rigid-roof-transverse-joint-01','rigid-roof-transverse-joint-02']:
        assert len(group(trees[identity],'separate-rebar').findall('s:circle',NS))==4, 'Source visible cut points missing'
    top=group(trees['rigid-roof-transverse-joint-01'],'rigid-layers').find('s:path',NS).attrib['d']
    assert '165' not in top, 'Obsolete horizontal top through shoulder returned'
    for identity,gid in [('vent-pipe-roof-01','hollow-vent-pipe'),('cast-iron-rainwater-outlet-01','grate-half-elevation')]:
        assert group(trees[identity],gid).find('.//s:path[@stroke-dasharray]',NS) is not None, 'Centerline role lost'
    checks.append({'mode':mode,'passed':True,'assertions':['vent source cove interior occupied and bore clear','waterproof samples outside low-wall interior','wall-external cove occupied','transverse visible cut-point count','obsolete shoulder-crossing segment absent','centerline dash pattern'], 'sha256':{k:hashlib.sha256(p.read_bytes()).hexdigest() for k,p in files.items()}})

out={'scope':'Regression of explicit r1 defects using source-review expectations and sampled r2 geometry; not complete geometric or standards certification','checks':checks}
(ROOT/'checks/correction-r2/geometry-regression.json').write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding='utf8')
print('Corrected-domain regression passed in both SVG editions.')
