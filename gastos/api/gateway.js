'use strict';
const crypto=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');

const username=process.env.FH_LOGIN_USER || '';
const password=process.env.FH_LOGIN_PASSWORD || '';
const secret=process.env.FH_SESSION_SECRET || '';

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
  '<img class="logo" alt="From Home Sandwiches & More" src="/logo.jpg">'+
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
  if(pathname==='/logo.jpg'){
    try{res.statusCode=200;res.setHeader('Content-Type','image/jpeg');return res.end(safeFile('logo.jpg'))}
    catch(e){res.statusCode=404;return res.end('Logo no disponible')}
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