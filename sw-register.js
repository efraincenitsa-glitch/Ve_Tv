
if ('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('./sw.js', { scope: './' })
      .then(reg=>console.log('SW registrado en', reg.scope))
      .catch(err=>console.warn('SW fallo', err));
  });
}
