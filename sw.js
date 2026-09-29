// IAT LPO service worker: receives files shared from WhatsApp (Android share menu).
// It does not cache the app, so the newest version always loads.
self.addEventListener('install',e=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method==='POST'&&u.pathname.endsWith('/share-target')){
    e.respondWith((async()=>{
      let info=[],files=[];
      try{
        const fd=await e.request.formData();
        for(const [k,v] of fd.entries()){
          if(v&&typeof v==='object'){info.push(`${k}:file:${v.type||'?'}:${v.size}`);if(v.size)files.push(v)}
          else info.push(`${k}:text:${String(v).slice(0,60)}`);
        }
      }catch(err){info.push('error:'+err.message)}
      const cache=await caches.open('iat-shared');
      let i=0;
      for(const f of files){
        await cache.put(`shared/${Date.now()}-${i++}`,new Response(f,{headers:{'Content-Type':f.type||'application/octet-stream','X-Name':encodeURIComponent(f.name||'lpo')}}));
      }
      return Response.redirect('./?shared='+files.length+'&dbg='+encodeURIComponent(info.join(' | ')||'empty form'),303);
    })());
  }
});
