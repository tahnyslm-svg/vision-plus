/* Vision Plus — bouton vocal de l’en-tête sur chaque page (2026-11-23, demande de l’utilisatrice).
   Même petit bouton rond, même emplacement et même style que celui de l’accueil (classes ax-dock ax-iris de
   assets/assistant/mascot.css), avec le visage de l’agent qui accueille déjà la page. La voix ne se déclenche qu’au clic :
   l’agent dit « Bonjour ! » puis une phrase adaptée à la page (enregistrement ElevenLabs en français ; voix du navigateur
   dans les autres langues), sous-titrée dans une petite bulle. Un second clic l’arrête. Une seule voix à la fois (vp:voix).
   Données : assets/equipe/boutons.json (outils/equipe-agents/generer_boutons.py, phrases dans bouton-vocal.json). */
(function(){
"use strict";
var meta=document.querySelector('meta[name="vp-page"]'),page=meta&&meta.content;
var MQ_M=matchMedia("(max-width:760px)");
function cle(){var h=(location.hash||"").slice(1);
  /* rubriques de « Découvrir » (2026-11-24) : chaque bandeau a son agent ; Avantages et Le service → Tyna, Commencer → Soren (sa phrase de la simulation) */
  if(page==="decouvrir"&&h==="agents"&&document.documentElement.classList.contains("m-svc"))h="telephone";
  if(page==="decouvrir"&&/^(marketing|gestion|telephone|fonctionnement|secteurs)$/.test(h))return "decouvrir-"+h;
  if(page==="decouvrir"&&h==="commencer")return "demo";
  if(page==="telephone-ia"&&(/^(secretariat-medical|tableau-de-bord|missions-medicales|demonstration|video-medicale)$/.test(h)||/^mm-/.test(h)))return "telephone-ia-medical";
  return page;}
function lang(){return (document.documentElement.lang||"fr").split(/[-_]/)[0].toLowerCase();}
var D=null,k=null,au=new Audio(),parle=false;
var bt=document.createElement("button");bt.type="button";bt.className="ax-dock ax-iris bv";bt.setAttribute("aria-pressed","false");
bt.innerHTML='<span class="ax-fig" aria-hidden="true"><img alt="" width="400" height="600" decoding="async"><span class="ax-voice"><i></i><i></i><i></i><i></i></span></span><span class="sr">Écouter</span> <span class="sr bv-nom"></span>';
var bulle=document.createElement("p");bulle.className="bv-bulle";bulle.hidden=true;bulle.setAttribute("aria-live","polite");

function placer(){var top=document.querySelector(".top-in"),auth=document.querySelector(".top-auth");if(!top)return false;
  var host=MQ_M.matches||!auth?top:auth;if(bt.parentNode!==host)host.appendChild(bt);top.classList.add("has-bv");return true;}
function regler(){var x=D[k];if(!x)return;bt.querySelector("img").src=x.photo;
  bt.querySelector(".bv-nom").textContent=x.prenom;bt.title=x.prenom;bulle.textContent=x.phrase;}
function etat(on){parle=on;bt.classList.toggle("is-parle",on);bt.setAttribute("aria-pressed",on?"true":"false");
  if(on){bulle.hidden=false;
    /* ordinateur : la bulle s’ouvre juste sous le bouton, alignée sur lui */
    if(!MQ_M.matches){var r=bt.getBoundingClientRect(),w=Math.min(360,innerWidth-32);bulle.style.top=Math.round(r.bottom+10)+"px";bulle.style.right="auto";
      bulle.style.left=Math.round(Math.max(16,Math.min(innerWidth-16-w,r.left+r.width/2-w/2)))+"px";}else{bulle.style.top=bulle.style.left=bulle.style.right="";}
    requestAnimationFrame(function(){bulle.classList.add("is-in");});}
  else{bulle.classList.remove("is-in");setTimeout(function(){if(!parle)bulle.hidden=true;},250);}}
function stop(){try{au.pause();}catch(e){}if("speechSynthesis" in window)try{speechSynthesis.cancel();}catch(e){}etat(false);}
function tts(){var S="speechSynthesis" in window&&"SpeechSynthesisUtterance" in window;if(!S){stop();return;}
  var x=D[k],lp=lang(),vs=speechSynthesis.getVoices().filter(function(v){return new RegExp("^"+lp+"([-_]|$)","i").test(v.lang);});
  var F=/amélie|amelie|audrey|aurélie|marie|julie|léa|lea|céline|samantha|karen|moira|tessa|fiona|victoria|serena|kate|susan|zira|hazel|paulina|monica|alice|anna|helena|sara|kyoko|ting|mei|yuna|milena|laura|female|femme/i;
  var bon=vs.filter(function(v){return x.genre==="f"?F.test(v.name):!F.test(v.name);}),v=(bon.length?bon:vs)[0];
  var u=new SpeechSynthesisUtterance(bulle.textContent.replace(/\bIA\b/g,"I A"));if(v){u.voice=v;u.lang=v.lang;}else u.lang=document.documentElement.lang||"fr";
  u.onend=u.onerror=function(){etat(false);};etat(true);speechSynthesis.speak(u);}
function parler(){stop();try{document.dispatchEvent(new CustomEvent("vp:voix",{detail:"bouton-"+D[k].agent}));}catch(e){}
  if(lang()!=="fr"||!D[k].voix){tts();return;}   /* pas encore d’enregistrement (Orion, Vela) : voix du navigateur */
  au.src=D[k].voix;etat(true);var p=au.play();
  if(p&&p.catch)p.catch(function(e){if(!e||e.name!=="AbortError")tts();});}
au.addEventListener("ended",function(){etat(false);});
bt.addEventListener("click",function(e){e.stopPropagation();if(parle)stop();else parler();});
document.addEventListener("vp:voix",function(e){if(parle&&e.detail!=="bouton-"+(D&&D[k]&&D[k].agent))stop();});
document.addEventListener("visibilitychange",function(){if(document.hidden)stop();});
document.addEventListener("vp:lang",stop);
window.addEventListener("hashchange",function(){var n=cle();if(D&&D[n]&&n!==k){stop();k=n;regler();}});
MQ_M.addEventListener&&MQ_M.addEventListener("change",placer);

fetch("assets/equipe/boutons.json",{cache:"no-cache"}).then(function(r){return r.json();}).then(function(d){D=d;k=cle();if(!D[k])return;
  regler();document.body.appendChild(bulle);
  (function essai(n){if(placer())return;if(n<40)setTimeout(function(){essai(n+1);},100);})(0);}).catch(function(){});
})();
