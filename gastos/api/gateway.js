'use strict';
const crypto=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');

const username=process.env.FH_LOGIN_USER || '';
const password=process.env.FH_LOGIN_PASSWORD || '';
const secret=process.env.FH_SESSION_SECRET || '';
const BRAND_LOGO=Buffer.from('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','base64');

function eq(a,b) {
  const aa=Buffer.from(String(a),'utf8'), bb=Buffer.from(String(b),'utf8');
  return aa.length===bb.length && crypto.timingSafeEqual(aa,bb);
}
function sign(payload) {return crypto.createHmac('sha256',secret).update(payload).digest('base64url')}
function cookie(req) {
  return (req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('fh_session='))?.slice(11)||'';
}
function check(req){
  if(!secret || !username || !password)return false;
  const parts=cookie(req).split('.');
  if(parts.length!==2||!eq(sign(parts[0]),parts[1]))return false;
  try{const d=JSON.parse(Buffer.from(parts[0],'base64url').toString('utf8'));return d.u===username&&Number(d.e)>Date.now()}catch(e){return false}
}
function safeFile(name) {
  for(const candidate of [path.join(process.cwd(),name),path.join(__dirname,'..',name),path.join(__dirname,name)]){
    try{if(fs.existsSync(candidate))return fs.readFileSync(candidate)}catch(e){}
  }
  throw new Error('No se encontró '+name);
}
function htmlLogin(error){
  return '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#f46b16"><title>Acceso · From Home Control de Gastos</title>'+
  '<style>*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#fff7f1;color:#251b15;font:16px/1.5 system-ui,-apple-system,sans-serif;padding:18px}.card{width:min(100%,430px);background:white;border:1px solid #f1e2d9;border-radius:24px;padding:28px;box-shadow:0 24px 50px #b85c1915}.logo{width:210px;max-width:90%;height:auto;display:block;margin:0 auto 12px}h1{font-size:25px;line-height:1.2;text-align:center;margin:8px 0}p{color:#766c66;text-align:center;margin:0 0 24px}label{display:block;margin:14px 0 5px;font-size:13px;font-weight:700}input{display:block;width:100%;border:1px solid #e6d9d0;border-radius:11px;padding:13px;font-size:16px}button{display:block;width:100%;border:none;border-radius:12px;background:#f46b16;color:white;font-size:17px;font-weight:700;padding:13px;margin-top:22px}.error{background:#ffe9e7;color:#8b2421;border-radius:10px;padding:11px;margin-top:12px;font-size:14px}small{display:block;text-align:center;color:#83756c;margin-top:18px}</style></head><body><div class="card">'+
  '<img class="logo" alt="From Home Sandwiches & More" src="/brand.webp">'+
  '<h1>Control de Gastos</h1><p>Acceso privado · From Home Sandwiches & More</p>'+
  '<form method="post" action="/api/login" autocomplete="on"><label for="user">Usuario</label><input id="user" name="user" autocomplete="username" required maxlength="80" autocapitalize="none"><label for="pass">Contraseña</label><input id="pass" type="password" name="pass" autocomplete="current-password" required><button type="submit">Entrar a mi panel</button>'+
  (error?'<div class="error" role="alert">Usuario o contraseña incorrectos.</div>':'')+
  '</form><small>Tu información de gastos se guarda en este dispositivo.</small></div></body></html>';
}
async function readBody(req){
  return await new Promise((resolve,reject)=>{
    let data='',size=0;
    req.on('data',chunk=>{size+=chunk.length;if(size>4096){reject(new Error('Solicitud demasiado grande'));req.destroy()}else data+=chunk.toString('utf8')});
    req.on('end',()=>resolve(data));req.on('error',reject);
  });
}
module.exports=async function(req,res){
  res.setHeader('Cache-Control','private, no-store, max-age=0');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-Frame-Options','DENY');
  res.setHeader('Referrer-Policy','no-referrer');
  const url=new URL(req.url||'/','https://fromhome.example');
  const pathname=url.pathname;
  if(pathname==='/brand.webp' || pathname==='/logo.jpg'){
    res.statusCode=200;
    res.setHeader('Content-Type','image/webp');
    res.setHeader('Cache-Control','public, max-age=86400');
    return res.end(BRAND_LOGO);
  }
  if(req.method==='POST' && pathname==='/api/login'){
    let form;
    try{form=new URLSearchParams(await readBody(req))}catch(e){res.statusCode=400;return res.end('Solicitud inválida')}
    if(secret && eq(form.get('user')||'',username) && eq(form.get('pass')||'',password)){
      const payload=Buffer.from(JSON.stringify({u:username,e:Date.now()+604800000})).toString('base64url');
      res.setHeader('Set-Cookie','fh_session='+payload+'.'+sign(payload)+'; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800');
      res.statusCode=303;res.setHeader('Location','/');return res.end();
    }
    res.statusCode=401;res.setHeader('Content-Type','text/html; charset=utf-8');return res.end(htmlLogin(true));
  }
  if(pathname==='/logout'){
    res.setHeader('Set-Cookie','fh_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');
    res.statusCode=303;res.setHeader('Location','/');return res.end();
  }
  if(!check(req)){
    res.statusCode=200;res.setHeader('Content-Type','text/html; charset=utf-8');return res.end(htmlLogin(false));
  }
  if(req.method!=='GET' && req.method!=='HEAD'){res.statusCode=405;return res.end('Método no permitido')}
  if(pathname==='/' || pathname==='/index.html' || pathname==='/gastos/' || pathname==='/gastos/index.html'){
    try{
      let html=safeFile('index.html').toString('utf8');
      html=html.replace('<nav id="nav">','<div style="text-align:right;padding-top:10px"><a href="/logout" style="color:#ad4211;font-size:12px">Cerrar sesión</a></div><nav id="nav">');
      res.statusCode=200;res.setHeader('Content-Type','text/html; charset=utf-8');return res.end(html)
    }catch(e){res.statusCode=500;return res.end('No se pudo cargar el panel')}
  }
  res.statusCode=404;return res.end('No encontrado');
};