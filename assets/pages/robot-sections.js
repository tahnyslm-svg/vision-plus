/* Vision Plus — agent de l’en-tête dans « Votre secrétaire IA » (Iris) et « Secrétariat médical IA » (Alma) (téléphone, ≤ 760 px).
   Portrait de l’agent dans un cadre de verre (il remplace l’ancienne mascotte robot depuis le 2026-11-23 : plus de bras,
   d’yeux ni de bouche animés). À l’arrivée sur la section (une fois) : l’agent apparaît, son cadre s’illumine pendant que
   sa bulle s’affiche, puis il acquiesce d’un léger mouvement ; ensuite il flotte (animations en pause hors écran).
   Un appui sur l’agent lui fait dire le texte de sa bulle : voix du navigateur dans la langue du site (de préférence une voix
   féminine, Iris et Alma étant des femmes) ; une voix enregistrée en français reste possible avec l’attribut data-voix.
   Un second appui l’arrête. Jamais de son sans appui. Mouvement réduit : pas d’apparition ni de geste, la voix reste disponible.
   Styles : robot-sections.css */
(function(){
"use strict";
var bots=document.querySelectorAll(".sbot");if(!bots.length)return;
var R=matchMedia("(prefers-reduced-motion: reduce)");
if(!R.matches&&"IntersectionObserver" in window)document.documentElement.classList.add("sbot-js");

function nod(b){if(R.matches)return;b.classList.add("is-nod");setTimeout(function(){b.classList.remove("is-nod");},450);}
function talkFor(b,ms){b.classList.add("is-talking");clearTimeout(b._talkT);b._talkT=setTimeout(function(){if(!b._speaking)b.classList.remove("is-talking");},ms);}

/* arrivée sur la section */
if(document.documentElement.classList.contains("sbot-js")){
  var io=new IntersectionObserver(function(es){es.forEach(function(e){var b=e.target;
    b.classList.toggle("is-run",e.isIntersecting);
    if(e.isIntersecting&&e.intersectionRatio>=0.6&&!b.classList.contains("is-in")){
      b.classList.add("is-in");
      setTimeout(function(){talkFor(b,1500);},700);
      setTimeout(function(){nod(b);},2400);
    }});},{threshold:[0,0.6]});
  [].forEach.call(bots,function(b){io.observe(b);});
}else [].forEach.call(bots,function(b){b.classList.add("is-in","is-run");});

/* voix : texte de la bulle (traduit s’il le faut), voix du navigateur dans la langue du site */
var S="speechSynthesis" in window&&"SpeechSynthesisUtterance" in window;
function lang(){return (document.documentElement.lang||"fr").split(/[-_]/)[0].toLowerCase();}
function voice(){if(!S)return null;var lp=lang();
  var vs=speechSynthesis.getVoices().filter(function(v){return new RegExp("^"+lp+"([-_]|$)","i").test(v.lang);});if(!vs.length)return null;
  function score(v){var n=v.name,s=0;if(/natural|neural|online/i.test(n))s+=8;if(/premium|enhanced|amélior/i.test(n))s+=6;
    /* voix féminines courantes (macOS, iOS, Windows, Android, Chrome) */
    if(/female|femme|amélie|amelie|audrey|aurélie|aurelie|marie|virginie|julie|denise|hortense|sylvie|céline|celine|eloise|élise|elise|vivienne|ariane|joana|luciana|monica|paulina|anna|alice|alva|sara|samantha|karen|moira|tessa|zira|aria|jenny|google (français|french|deutsch|español|italiano)/i.test(n))s+=5;
    if(/grandma|grandpa|eddy|flo\b|reed|rocko|sandy|shelley|jacques/i.test(n))s-=12;return s;}
  return vs.sort(function(a,c){return score(c)-score(a);})[0];}
if(S&&speechSynthesis.addEventListener)speechSynthesis.addEventListener("voiceschanged",function(){});
var current=null;
function stop(b){if(!b)return;b._speaking=false;b.classList.remove("is-talking");if(b._au&&!b._au.paused)b._au.pause();if(current===b)current=null;}
function stopAll(){try{if(S)speechSynthesis.cancel();}catch(e){}if(current)stop(current);}
/* voix du navigateur : texte de la bulle dans la langue du site */
function tts(b){
  if(!S){talkFor(b,1600);return;}
  var say=b.querySelector(".sbot-say");var u=new SpeechSynthesisUtterance((say&&say.textContent||"").trim());
  var v=voice();if(v){u.voice=v;u.lang=v.lang;}else u.lang=document.documentElement.lang||"fr";u.rate=1;u.pitch=1.05;
  u.onend=u.onerror=function(){stop(b);};
  current=b;b._speaking=true;b.classList.add("is-talking","is-in");
  speechSynthesis.speak(u);}
/* voix enregistrée (data-voix, en français) ; dans les autres langues ou si le fichier ne se lit pas : voix du navigateur */
function speak(b){
  var was=current===b;stopAll();if(was)return;
  /* une seule voix à la fois : les autres voix se taisent, et une vidéo en cours se met en pause (assets/agent-accueil.js, VP_VIDEO) */
  try{document.dispatchEvent(new CustomEvent("vp:voix",{detail:"sbot"}));}catch(e){}
  var src=b.getAttribute("data-voix");
  if(src&&lang()==="fr"){
    var a=b._au||(b._au=new Audio(src));a.preload="auto";try{a.currentTime=0;}catch(e){}
    a.onended=function(){stop(b);};
    current=b;b._speaking=true;b.classList.add("is-talking","is-in");
    var p=a.play();if(p&&p.catch)p.catch(function(e){if(current!==b)return;stop(b);if(!e||e.name!=="AbortError")tts(b);});
    return;}
  tts(b);}
[].forEach.call(bots,function(b){var c=b.querySelector(".sbot-char");if(c)c.addEventListener("click",function(){speak(b);});});
document.addEventListener("visibilitychange",function(){if(document.hidden)stopAll();});
document.addEventListener("vp:lang",stopAll);
/* une vidéo démarre ou un autre agent parle : l’agent de l’en-tête se tait */
document.addEventListener("vp:voix",function(e){if(e.detail!=="sbot"&&current)stopAll();});
})();
