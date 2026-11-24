/* Vision Plus — page d’accueil « Une équipe d’agents IA » : icônes, fiches des modules (dialog), apparitions douces,
   légère parallaxe de l’équipe à la souris. Sans script, tout le contenu reste visible ; les fiches sont alors
   remplacées par les liens « Découvrir … » des cartes. Styles : accueil.css. */
(function(){
"use strict";
var A=window.VISIONPLUS;
var reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
var fine=matchMedia("(hover:hover) and (pointer:fine)").matches;
var html=document.documentElement;
html.classList.add("eq-js");

/* icônes du site (même jeu que l’en-tête) */
if(A&&A.icon)document.querySelectorAll(".eq-home [data-ico], .eq-dlg [data-ico]").forEach(function(el){el.outerHTML=A.icon(el.dataset.ico,el.dataset.cls||"");});

/* fiches : ouverture par « En savoir plus », par l’adresse (#fiche-…), fermeture par la croix, Échap ou un clic à côté */
var last=null;
function openFiche(id,from){var d=document.getElementById(id);if(!d||!d.showModal)return false;
  last=from||null;if(!d.open)d.showModal();html.classList.add("eq-lock");d.scrollTop=0;
  if(location.hash!=="#"+id&&history.replaceState)history.replaceState(null,"","#"+id);return true;}
document.querySelectorAll(".eq-dlg").forEach(function(d){
  d.addEventListener("close",function(){html.classList.remove("eq-lock");
    if(location.hash==="#"+d.id&&history.replaceState)history.replaceState(null,"",location.pathname+location.search+"#agents");
    if(last&&last.focus)last.focus();last=null;});
  d.addEventListener("click",function(e){if(e.target===d)d.close();var c=e.target.closest("[data-close]");if(c)d.close();});
});
document.querySelectorAll(".eq-more[data-fiche]").forEach(function(b){
  b.addEventListener("click",function(){openFiche(b.dataset.fiche,b);});});
function fromHash(){var h=(location.hash||"").slice(1);if(/^fiche-[a-z]+$/.test(h))openFiche(h,null);}
fromHash();window.addEventListener("hashchange",fromHash);

/* cartes : apparition au défilement */
var cards=[].slice.call(document.querySelectorAll(".eq-card"));
cards.forEach(function(c,i){c.style.setProperty("--k",i%5);});
if(!reduced&&"IntersectionObserver" in window){
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("is-vu");io.unobserve(e.target);}});},{rootMargin:"0px 0px -8% 0px",threshold:.12});
  cards.forEach(function(c){io.observe(c);});
}else cards.forEach(function(c){c.classList.add("is-vu");});

/* équipe du premier écran : parallaxe douce à la souris (ordinateur, jamais en mouvement réduit) */
var team=document.querySelector(".vh-team"),hero=document.querySelector(".vh");
if(team&&hero&&fine&&!reduced){var raf=0,tx=0,ty=0;
  function apply(){raf=0;team.style.setProperty("--px",tx.toFixed(3));team.style.setProperty("--py",ty.toFixed(3));}
  hero.addEventListener("pointermove",function(e){if(e.pointerType!=="mouse")return;var r=hero.getBoundingClientRect();
    tx=Math.max(-1,Math.min(1,(e.clientX-r.left)/r.width*2-1));ty=Math.max(-1,Math.min(1,(e.clientY-r.top)/r.height*2-1));if(!raf)raf=requestAnimationFrame(apply);});
  hero.addEventListener("pointerleave",function(){tx=0;ty=0;if(!raf)raf=requestAnimationFrame(apply);});
}
})();

/* Voix des agents : chaque personnage a sa propre voix.
   En français : enregistrement ElevenLabs (assets/equipe/voix/<prénom>.mp3, voix distincte par personnage, voir outils/equipe-agents/voix.json).
   Autres langues, ou si le fichier ne se lit pas : voix du navigateur, choisie par personnage (genre, timbre et rythme différents),
   qui lit le prénom et la phrase traduite de la fiche. Une seule voix à la fois (Tyna se tait quand un agent parle). */
(function(){
"use strict";
var btns=[].slice.call(document.querySelectorAll(".eq-voice"));if(!btns.length)return;
var S="speechSynthesis" in window&&"SpeechSynthesisUtterance" in window,cur=null,au=null;
function lang(){return (document.documentElement.lang||"fr").split(/[-_]/)[0].toLowerCase();}
function hash(s){var h=0;for(var i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))|0;return Math.abs(h);}
var FEM=/amélie|amelie|audrey|aurélie|marie|denise|vivienne|eloise|julie|léa|lea|céline|hortense|samantha|karen|moira|tessa|fiona|victoria|serena|kate|susan|zira|hazel|paulina|monica|alice|anna|helena|sara|yuna|kyoko|ting|mei|sin-ji|milena|ioana|zuzana|laura|nora|female|femme|woman/i,
    MASC=/thomas|daniel|nicolas|henri|rémy|remy|paul|guillaume|mathieu|claude|alex|fred|jorge|diego|luca|reed|eddy|oliver|aaron|arthur|gordon|rishi|maged|yuri|xander|male|homme|man\b/i;
function pick(agent,g){if(!S)return null;var lp=lang(),vs=speechSynthesis.getVoices().filter(function(v){return new RegExp("^"+lp+"([-_]|$)","i").test(v.lang);});
  if(!vs.length)return null;var bon=vs.filter(function(v){return g==="f"?FEM.test(v.name)&&!MASC.test(v.name):MASC.test(v.name)&&!FEM.test(v.name);});
  var l=bon.length?bon:vs;return l[hash(agent)%l.length];}
function idle(b){if(!b)return;b.classList.remove("is-playing");b.setAttribute("aria-pressed","false");}
function stop(){if(au&&!au.paused)au.pause();if(S)try{speechSynthesis.cancel();}catch(e){}idle(cur);cur=null;}
function tts(b){if(!S){idle(b);cur=null;return;}
  var a=b.dataset.agent,ph=document.getElementById(b.dataset.dit),nom=document.getElementById(b.getAttribute("aria-describedby"));
  var t=((nom?nom.textContent.split("\n")[0]+". ":"")+(ph?ph.textContent:"")).replace(/[«»“”„"「」]/g,"").replace(/\bIA\b/g,"I A").trim();
  var u=new SpeechSynthesisUtterance(t),v=pick(a,b.dataset.genre),h=hash(a);
  if(v){u.voice=v;u.lang=v.lang;}else u.lang=document.documentElement.lang||"fr";
  u.pitch=(b.dataset.genre==="f"?1.02:.9)+(h%7)*.03;u.rate=.96+(h%5)*.025;   /* timbre et rythme propres à chacun */
  u.onend=u.onerror=function(){if(cur===b){idle(b);cur=null;}};speechSynthesis.speak(u);}
function play(b){
  var was=cur===b;stop();if(was)return;
  cur=b;b.classList.add("is-playing");b.setAttribute("aria-pressed","true");
  try{document.dispatchEvent(new CustomEvent("vp:voix",{detail:b.dataset.agent}));}catch(e){}
  /* data-voix="" : agent sans enregistrement (Orion, Vela) → voix du navigateur, en français aussi */
  var f=b.hasAttribute("data-voix")?b.dataset.voix:"assets/equipe/voix/"+b.dataset.agent+".mp3";
  if(lang()==="fr"&&f){au=au||new Audio();au.src=f;
    au.onended=function(){if(cur===b){idle(b);cur=null;}};
    var p=au.play();if(p&&p.catch)p.catch(function(e){if(cur!==b||(e&&e.name==="AbortError"))return;tts(b);});return;}
  tts(b);}
btns.forEach(function(b){b.addEventListener("click",function(e){e.stopPropagation();play(b);});});
if(S&&speechSynthesis.addEventListener)speechSynthesis.addEventListener("voiceschanged",function(){});
document.addEventListener("vp:voix",function(e){if(cur&&e.detail!==cur.dataset.agent)stop();});
document.querySelectorAll(".eq-dlg").forEach(function(d){d.addEventListener("close",stop);});
document.addEventListener("visibilitychange",function(){if(document.hidden)stop();});
document.addEventListener("vp:lang",stop);
})();
