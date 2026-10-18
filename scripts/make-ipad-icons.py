#!/usr/bin/env python3
from pathlib import Path
import json
import subprocess
root=Path(__file__).resolve().parents[1]
base=root/'ios/SketchwaterPark/Assets.xcassets'
icons=base/'AppIcon.appiconset'
icons.mkdir(parents=True,exist_ok=True)
master=icons/'icon-1024.png'
source=root/'ios/Artwork/appicon-sketchwaterpark.png'
subprocess.run(['sips','-z','1024','1024',str(source),'--out',str(master)],check=True,stdout=subprocess.DEVNULL)
entries=[]
for size,scale in [(s,k) for s in [20,29,40,76] for k in [1,2]]+[(83.5,2)]:
    name=f'icon-{size}@{scale}x.png';px=str(int(size*scale))
    subprocess.run(['sips','-z',px,px,str(master),'--out',str(icons/name)],check=True,stdout=subprocess.DEVNULL)
    entries.append({'idiom':'ipad','size':f'{size}x{size}','scale':f'{scale}x','filename':name})
entries.append({'idiom':'ios-marketing','size':'1024x1024','scale':'1x','filename':master.name})
info={'author':'xcode','version':1}
(base/'Contents.json').write_text(json.dumps({'info':info},indent=2)+'\n')
(icons/'Contents.json').write_text(json.dumps({'images':entries,'info':info},indent=2)+'\n')
