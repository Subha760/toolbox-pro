/* Toolidea shared motion layer: lightweight, accessible, no external assets. */
(function(){
  const container=document.getElementById('toolContainer');
  if(!container)return;
  const observer=new MutationObserver(()=>{
    container.querySelectorAll('.result-box, canvas, img, .btn').forEach((el,i)=>{
      if(el.dataset.tiMotion)return;
      el.dataset.tiMotion='1';
      el.style.animationDelay=Math.min(i*35,280)+'ms';
      el.classList.add(el.classList.contains('result-box')?'ti-result-pop':'ti-motion-item');
    });
  });
  observer.observe(container,{childList:true,subtree:true});
  const style=document.createElement('style');
  style.textContent='.ti-motion-item{animation:tiMotionItem .34s cubic-bezier(.2,.8,.2,1) both}@keyframes tiMotionItem{from{opacity:0;transform:translateY(8px) scale(.985)}to{opacity:1;transform:none}}';
  document.head.appendChild(style);
})();
