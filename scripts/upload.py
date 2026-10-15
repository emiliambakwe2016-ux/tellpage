"""Upload static assets using a short-lived TellPage Pages upload JWT. Never uploads user projects."""
import pathlib,hashlib,base64,json,urllib.request,mimetypes,concurrent.futures
root=pathlib.Path('dist');token=pathlib.Path('/tmp/tellpage-upload-token').read_text().strip()
def api(endpoint,payload):
 req=urllib.request.Request('https://api.cloudflare.com/client/v4/pages/assets/'+endpoint,data=json.dumps(payload).encode(),headers={'Authorization':'Bearer '+token,'Content-Type':'application/json'})
 try:
  with urllib.request.urlopen(req,timeout=90) as r:data=json.load(r)
 except urllib.error.HTTPError as e:raise RuntimeError(str(e.code)+' '+e.read().decode()[:350])
 if not data.get('success'):raise RuntimeError(str(data.get('errors')))
 return data.get('result')
files={}
for f in root.rglob('*'):
 if f.is_file() and f.name!='_headers':
  raw=f.read_bytes();h=hashlib.sha256(raw).hexdigest()[:32];files[h]=(f,raw)
manifest={'/'+f.relative_to(root).as_posix():h for h,(f,_) in files.items()}
missing=api('check-missing',{'hashes':list(files)})
print('Assets:',len(files),'Missing:',len(missing),flush=True)
batches=[];batch=[];weight=0
for h in missing:
 f,raw=files[h]
 item={'key':h,'value':base64.b64encode(raw).decode(),'metadata':{'contentType':{'.mjs':'text/javascript','.js':'text/javascript','.wasm':'application/wasm','.webmanifest':'application/manifest+json'}.get(f.suffix,mimetypes.guess_type(f.name)[0] or 'application/octet-stream')},'base64':True}
 if weight+len(raw)>5*1024*1024 and batch:batches.append(batch);batch=[];weight=0
 batch.append(item);weight+=len(raw)
if batch:batches.append(batch)
def upload(b):
 api('upload',b);print('Uploaded batch of',len(b),'assets',flush=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as ex:list(ex.map(upload,batches))
api('upsert-hashes',{'hashes':list(files)})
pathlib.Path('/tmp/tellpage-manifest.json').write_text(json.dumps(manifest))
print('Static asset upload complete.',flush=True)
