"""Prototype-only Chromium checks and review sheets. Run with the root server on :4387."""
import subprocess,json,re
from pathlib import Path
from PIL import Image,ImageDraw
P=Path(__file__).parent
base=['mise','exec','agent-browser@0.38.2','--','agent-browser','--session','identity-study']
def ab(*args):return subprocess.check_output(base+list(args),text=True).strip()
def luminance(s):
 rgb=[int(s[i:i+2],16)/255 for i in (1,3,5)]
 return sum(w*(v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4) for w,v in zip([.2126,.7152,.0722],rgb))
def contrast(a,b):
 x,y=sorted([luminance(a),luminance(b)]);return (y+.05)/(x+.05)
results=[]
for direction in ['a','b','c']:
 css=(P/f'{direction}.css').read_text();tokens=dict(re.findall(r'--([\w-]+):(#[\da-fA-F]{6})',css))
 for fg,bg in [('ink','bg'),('muted','bg'),('accent','bg'),('muted','study'),('button-ink','accent')]:
  ratio=contrast(tokens[fg],tokens[bg]);assert ratio>=4.5,(direction,fg,bg,ratio)
 for label,w,h in [('desktop',1440,1050),('mobile',360,900)]:
  ab('set','viewport',str(w),str(h));ab('open',f'http://127.0.0.1:4387/docs/research/prototypes/memory-identity/{direction}.html')
  data=ab('eval','document.fonts.ready.then(()=>JSON.stringify({width:innerWidth,scroll:document.documentElement.scrollWidth,broken:[...document.images].filter(i=>!i.naturalWidth).length,fonts:document.fonts.status,missingAnchors:[...document.querySelectorAll("a[href^=\\\"#\\\"]")].filter(a=>!document.querySelector(a.getAttribute("href"))).length}))')
  d=json.loads(data);d=json.loads(d) if isinstance(d,str) else d
  assert d['width']==d['scroll'] and d['broken']==0 and d['missingAnchors']==0,(direction,label,d)
  results.append({'direction':direction,'viewport':label,**d})
  ab('screenshot',str(P/f'{direction}-{label}.jpg'));ab('screenshot',str(P/f'{direction}-{label}-full.jpg'),'--full')
for fg,bg in [('#f0f4f3','#172f3b'),('#b8cdd3','#172f3b'),('#dca574','#172f3b'),('#88502c','#e4ebed'),('#bdcdd2','#1e3541'),('#e4ebed','#1e3541'),('#b8d1d8','#1e3541'),('#bcbcaf','#25251f')]:
 assert contrast(fg,bg)>=4.5,(fg,bg)
print(json.dumps(results,indent=2));(P/'checks.json').write_text(json.dumps(results,indent=2)+'\n')
for label in ['desktop','mobile']:
 pics=[Image.open(P/f'{d}-{label}.jpg').convert('RGB') for d in ['a','b','c']]
 target_w=640 if label=='desktop' else 360
 pics=[im.resize((target_w,round(im.height*target_w/im.width))) for im in pics]
 sheet=Image.new('RGB',(target_w*3+64,max(im.height for im in pics)+80),'#d8dcd6');draw=ImageDraw.Draw(sheet)
 for i,(name,im) in enumerate(zip(['A / Mnemonic Foundry','B / Civic Archive','C / Signal Bureau'],pics)):
  x=16+i*(target_w+16);draw.text((x,17),name,fill='#202a24');sheet.paste(im,(x,48))
 sheet.save(P/f'{label}-comparison.jpg',quality=92)
