const $=(s,p=document)=>p.querySelector(s), $$=(s,p=document)=>[...p.querySelectorAll(s)];

// Initial reveal and scroll choreography use native APIs to keep the site light.
window.addEventListener('load',()=>setTimeout(()=>$('.page-loader').classList.add('done'),450));
const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target)}}),{threshold:.12});
$$('.reveal').forEach((el,i)=>{el.style.transitionDelay=`${(i%4)*70}ms`;observer.observe(el)});
window.addEventListener('scroll',()=>$('.nav-shell').classList.toggle('scrolled',scrollY>30),{passive:true});

// Mobile menu, appearance control, and active service accordion.
$('.menu-toggle').addEventListener('click',e=>{const open=$('.nav-shell').classList.toggle('open');e.currentTarget.setAttribute('aria-expanded',open)});
$('.theme-toggle').addEventListener('click',()=>document.body.classList.toggle('dark'));
$$('.service').forEach(card=>card.addEventListener('click',()=>{$$('.service').forEach(c=>c.classList.remove('active'));card.classList.add('active')}));

// Counters start once the achievement rail reaches the viewport.
const countObserver=new IntersectionObserver(([entry])=>{if(!entry.isIntersecting)return;$$('[data-count]').forEach(el=>{const target=+el.dataset.count,start=performance.now();const tick=now=>{const p=Math.min((now-start)/1300,1);el.textContent=Math.round(target*(1-Math.pow(1-p,3)));if(p<1)requestAnimationFrame(tick)};requestAnimationFrame(tick)});countObserver.disconnect()},{threshold:.5});
countObserver.observe($('.metrics'));

// Talent directory filtering and compact profile dialog.
$$('.filters button').forEach(button=>button.addEventListener('click',()=>{$$('.filters button').forEach(b=>b.classList.remove('active'));button.classList.add('active');$$('.talent-card').forEach(card=>card.classList.toggle('hide',button.dataset.filter!=='all'&&card.dataset.category!==button.dataset.filter))}));
const modal=$('.profile-modal');
$$('.talent-card').forEach(card=>card.addEventListener('click',()=>{$('h2',modal).textContent=card.dataset.name;$('h3',modal).textContent=card.dataset.role;$('.modal-avatar',modal).textContent=card.dataset.name.split(' ').map(x=>x[0]).join('');modal.showModal()}));
$('.modal-close').addEventListener('click',()=>modal.close());
modal.addEventListener('click',e=>{if(e.target===modal)modal.close()});

// Form tabs can also be opened directly from navigation CTAs.
function switchTab(name){$$('[data-tab-target]').forEach(b=>b.classList.toggle('active',b.dataset.tabTarget===name));$$('.tab-panel').forEach(p=>p.classList.toggle('active',p.id===`${name}-form`))}
$$('[data-tab-target]').forEach(button=>button.addEventListener('click',()=>switchTab(button.dataset.tabTarget)));
$$('[data-tab]').forEach(link=>link.addEventListener('click',()=>switchTab(link.dataset.tab)));
$('#budget').addEventListener('input',e=>$('#budget-output').textContent=`NT$ ${Number(e.target.value).toLocaleString('en-US')}`);
$$('.tab-panel').forEach(form=>form.addEventListener('submit',e=>{e.preventDefault();$('.toast').classList.add('show');setTimeout(()=>$('.toast').classList.remove('show'),3500);form.reset()}));

// Magnetic controls and a precision cursor are enabled only for fine pointers.
if(matchMedia('(pointer:fine)').matches){const cursor=$('.cursor');window.addEventListener('pointermove',e=>{cursor.style.left=`${e.clientX}px`;cursor.style.top=`${e.clientY}px`});$$('a,button,.talent-card').forEach(el=>{el.addEventListener('mouseenter',()=>{cursor.classList.add('hover');cursor.classList.toggle('card',el.classList.contains('talent-card'))});el.addEventListener('mouseleave',()=>cursor.className='cursor')});$$('.magnetic').forEach(el=>el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect();el.style.transform=`translate(${(e.clientX-r.left-r.width/2)*.12}px,${(e.clientY-r.top-r.height/2)*.12}px)`}));$$('.magnetic').forEach(el=>el.addEventListener('pointerleave',()=>el.style.transform=''))}

// Lightweight Three.js scene: procedural compass rings + S-curve particles.
async function initScene(){
  if(matchMedia('(prefers-reduced-motion:reduce)').matches)return;
  try{
    const THREE=await import('https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js');
    const canvas=$('#hero-canvas'),scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(40,innerWidth/innerHeight,.1,100);camera.position.set(0,0,11);
    const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.setSize(innerWidth,innerHeight);
    const group=new THREE.Group();group.position.x=innerWidth>800?3.4:1.8;scene.add(group);
    const material=new THREE.MeshBasicMaterial({color:0x3aaee8,wireframe:true,transparent:true,opacity:.28});
    [2.25,1.72,1.15].forEach((radius,i)=>{const ring=new THREE.Mesh(new THREE.TorusGeometry(radius,.012,5,110),material.clone());ring.rotation.x=1.04+i*.16;ring.rotation.y=.3;group.add(ring)});
    const needleShape=new THREE.Shape();needleShape.moveTo(0,2.5);needleShape.lineTo(.25,-.3);needleShape.lineTo(0,-2.7);needleShape.lineTo(-.2,-.25);needleShape.closePath();const needle=new THREE.Mesh(new THREE.ShapeGeometry(needleShape),new THREE.MeshBasicMaterial({color:0x69c9f7,transparent:true,opacity:.72,side:THREE.DoubleSide}));needle.rotation.z=-.42;group.add(needle);
    const points=[];for(let i=0;i<450;i++){const t=i/449*Math.PI*2;const y=2.3-4.6*i/449,x=Math.sin(t)*(.72+.28*Math.cos(t*2));points.push(x+(Math.random()-.5)*.12,y+(Math.random()-.5)*.12,(Math.random()-.5)*.7)}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(points,3));group.add(new THREE.Points(geo,new THREE.PointsMaterial({color:0x8edcff,size:.035,transparent:true,opacity:.85})));
    let px=0,py=0;window.addEventListener('pointermove',e=>{px=(e.clientX/innerWidth-.5)*.25;py=(e.clientY/innerHeight-.5)*.18},{passive:true});
    const resize=()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);group.position.x=innerWidth>800?3.4:1.7};window.addEventListener('resize',resize);
    const animate=t=>{group.rotation.y+=(px-group.rotation.y)*.025;group.rotation.x+=(py-group.rotation.x)*.025;group.rotation.z=Math.sin(t*.00025)*.06;renderer.render(scene,camera);requestAnimationFrame(animate)};requestAnimationFrame(animate);
  }catch(error){console.info('3D scene unavailable; static hero retained.',error)}
}
initScene();
