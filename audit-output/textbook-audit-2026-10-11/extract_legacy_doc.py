from pathlib import Path
import struct, json, hashlib, re

SOURCE = Path(r'D:\构造相关内容\建筑构造上册讲义-李峰.doc')
OUT = Path(__file__).parent
data = SOURCE.read_bytes()
u16 = lambda b, p: struct.unpack_from('<H', b, p)[0]
u32 = lambda b, p: struct.unpack_from('<I', b, p)[0]
sector_size = 1 << u16(data, 30)
mini_size = 1 << u16(data, 32)
END = 0xfffffffe
FREE = 0xffffffff
def sector(n):
    return data[(n+1)*sector_size:(n+2)*sector_size]
fat_sectors = list(struct.unpack_from('<109I', data, 76))
difat = u32(data, 68)
for _ in range(u32(data, 72)):
    vals = struct.unpack('<%dI' % (sector_size//4), sector(difat))
    fat_sectors.extend(vals[:-1])
    difat = vals[-1]
fat_sectors = [x for x in fat_sectors if x < 0xfffffffa][:u32(data, 44)]
fat = []
for n in fat_sectors:
    fat.extend(struct.unpack('<%dI' % (sector_size//4), sector(n)))
def chain(start, table):
    seen = set()
    while start < 0xfffffffa:
        if start in seen or start >= len(table):
            raise ValueError('Invalid sector chain')
        seen.add(start)
        yield start
        start = table[start]
def read_big(start):
    return b''.join(sector(n) for n in chain(start, fat))
directory = read_big(u32(data, 48))
entries = []
for p in range(0, len(directory), 128):
    e = directory[p:p+128]
    size = u16(e, 64)
    if size >= 2:
        entries.append({'name':e[:size-2].decode('utf-16le'), 'type':e[66], 'start':u32(e,116), 'size':struct.unpack_from('<Q',e,120)[0]})
root = next(e for e in entries if e['type']==5)
mini_stream = read_big(root['start'])[:root['size']]
mini_fat_bytes = read_big(u32(data, 60)) if u32(data, 64) else b''
mini_fat = list(struct.unpack('<%dI' % (len(mini_fat_bytes)//4), mini_fat_bytes))
def read_stream(name):
    e = next(e for e in entries if e['name']==name)
    if e['size'] < u32(data,56):
        buf = b''.join(mini_stream[n*mini_size:(n+1)*mini_size] for n in chain(e['start'],mini_fat))
    else:
        buf = read_big(e['start'])
    return buf[:e['size']]
word = read_stream('WordDocument')
table_name = '1Table' if u16(word,10)&0x200 else '0Table'
table = read_stream(table_name)
p = 32
csw = u16(word,p); p += 2 + csw*2
cslw = u16(word,p); p += 2
ccp_text = u32(word,p+12)
p += cslw*4
pair_count = u16(word,p); p += 2
fc_clx = u32(word,p+33*8)
lcb_clx = u32(word,p+33*8+4)
clx = table[fc_clx:fc_clx+lcb_clx]
q = 0
while clx[q] == 1:
    q += 3 + u16(clx,q+1)
assert clx[q] == 2
lcb = u32(clx,q+1)
plc = clx[q+5:q+5+lcb]
count = (lcb-4)//12
cps = struct.unpack_from('<%dI' % (count+1),plc)
chunks = []
for i in range(count):
    if cps[i] >= ccp_text: break
    length = min(cps[i+1],ccp_text)-cps[i]
    fc = u32(plc,4*(count+1)+i*8+2)
    compressed = bool(fc&0x40000000)
    pos = fc&0x3fffffff
    if compressed:
        pos //= 2
        chunks.append(word[pos:pos+length].decode('cp1252',errors='replace'))
    else:
        chunks.append(word[pos:pos+length*2].decode('utf-16le',errors='replace'))
text = ''.join(chunks)
OUT.mkdir(parents=True,exist_ok=True)
(OUT/'source-raw.txt').write_text(text,encoding='utf-8')
paragraphs = []
for raw in text.split('\r'):
    clean = raw.replace('\x07',' | ').replace('\x0b','\n').replace('\x0c','\n[手动分页]\n')
    clean = clean.replace('\x13','[域开始]').replace('\x14','[域值]').replace('\x15','[域结束]')
    clean = clean.replace('\x01','[嵌入对象]').replace('\x08','[浮动对象]')
    clean = re.sub(r'[\x00-\x06\x0e-\x12\x16-\x1f]','',clean).strip()
    if clean:
        paragraphs.append({'id':f'P{len(paragraphs)+1:04d}','text':clean})
(OUT/'paragraphs.json').write_text(json.dumps(paragraphs,ensure_ascii=False,indent=2),encoding='utf-8')
(OUT/'source-paragraphs.txt').write_text('\n\n'.join(f"[{x['id']}] {x['text']}" for x in paragraphs),encoding='utf-8')
meta = {'source':str(SOURCE),'sha256':hashlib.sha256(data).hexdigest(),'size':len(data),'fib_version':u16(word,2),'main_text_cp_count':ccp_text,'extracted_characters':len(text),'paragraphs':len(paragraphs),'pieces':count,'table':table_name,'streams':entries,'replacement_characters':text.count('\ufffd')}
(OUT/'extraction-metadata.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(meta,ensure_ascii=False,indent=2))
print('\n'.join(f"[{x['id']}] {x['text']}" for x in paragraphs[:35]))
