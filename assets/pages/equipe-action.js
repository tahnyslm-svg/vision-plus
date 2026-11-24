/* Vision Plus — « Voir l’équipe en action » (rubrique Avantages de Découvrir, 2026-11-24, maquette de l’utilisatrice).
   Tina présente l’équipe : ses paroles s’affichent en sous-titres et chaque agent s’allume quand elle le nomme.
   Voix : l’enregistrement indiqué par data-audio (français), calé sur les temps data-t des sous-titres ; tant qu’il n’existe pas,
   la séquence défile en silence au rythme du texte affiché. Autres langues : sous-titres traduits (assets/i18n), voix d’origine.
   Lecture : au clic, ou à l’arrivée sur la rubrique (événement « vp:seq » envoyé par assets/agent-accueil.js) ;
   si le navigateur bloque le son, la lecture part au premier geste sur la page. Une seule voix à la fois (vp:voix). */
(function(){
"use strict";
var box=document.getElementById("equipe-en-action");if(!box)return;
var cues=[].slice.call(box.querySelectorAll(".eqa-c")),eq=box.querySelector(".eqa-equipe"),tiles={};
[].forEach.call(box.querySelectorAll(".eqa-equipe li"),function(li){tiles[li.dataset.ag]=li;});
var btn=box.querySelector(".eqa-play"),track=box.querySelector(".eqa-track"),fill=track.querySelector("i"),time=box.querySelector(".eqa-time"),
    son=box.querySelector(".eqa-son"),plein=box.querySelector(".eqa-plein"),suite=box.querySelector(".eqa-suite");
var src=box.dataset.audio||"",au=null;
if(src){au=new Audio();au.preload="metadata";au.src=src;son.hidden=false;au.addEventListener("error",function(){au=null;son.hidden=true;});}
var T=[],total=0,pos=0,joue=false,t0=0,courant=-1,attente=false;

/* temps de chaque sous-titre : ceux de l’enregistrement (data-t), sinon au rythme du texte affiché (environ 14 caractères par seconde) */
function calculer(){T=[];var t=0,cal=au&&cues.every(function(c){return c.dataset.t;});
  cues.forEach(function(c,i){if(cal){T.push(+c.dataset.t);}else{T.push(t);t+=Math.max(2.4,c.textContent.trim().length/14)+.35;}});
  total=cal?+(box.dataset.fin||T[T.length-1]+4):t;}
function mmss(s){s=Math.max(0,Math.round(s));return Math.floor(s/60)+":"+String(s%60).padStart(2,"0");}
function montrer(i){if(i===courant)return;courant=i;
  cues.forEach(function(c,j){c.hidden=j!==i;});
  Object.keys(tiles).forEach(function(k){tiles[k].classList.remove("is-nomme");});
  var ag=i>=0?cues[i].dataset.ag:"";eq.classList.toggle("tous",ag==="tous");if(tiles[ag])tiles[ag].classList.add("is-nomme");}
function maj(){var p=total?Math.min(1,pos/total):0;fill.style.width=(p*100).toFixed(2)+"%";time.textContent=mmss(pos)+" / "+mmss(total);
  var i=-1;for(var j=0;j<T.length;j++){if(pos>=T[j])i=j;}montrer(i);}
function boucle(){if(!joue)return;pos=au&&!au.paused?au.currentTime:(performance.now()-t0)/1000;maj();
  if(pos>=total){fin();return;}requestAnimationFrame(boucle);}
/* priorité au son de la présentation (assets/agent-accueil.js, VP_VIDEO) : elle s’annonce comme une vidéo, les voix d’agents se taisent */
function signal(etat){try{document.dispatchEvent(new CustomEvent("vp:video",{detail:{etat:etat,id:"seq-tina",el:box}}));}catch(e){}}
function fin(){joue=false;pos=total;maj();box.classList.remove("is-lecture");btn.setAttribute("aria-pressed","false");eq.classList.add("tous");if(suite)suite.hidden=false;if(au)au.pause();signal("fin");}
function lancer(){if(joue)return;if(!T.length||pos>=total){calculer();pos=0;}
  joue=true;attente=false;box.classList.add("is-ouvert","is-lecture");btn.setAttribute("aria-pressed","true");if(suite)suite.hidden=true;
  try{document.dispatchEvent(new CustomEvent("vp:voix",{detail:"seq-tina"}));}catch(e){}
  signal("lecture");
  /* on ne repositionne le son que s’il n’est pas déjà au bon endroit (reprise après pause : aucun saut, même si le serveur ne permet pas de se déplacer dans le fichier) */
  if(au){if(Math.abs(au.currentTime-pos)>.25){try{au.currentTime=pos;}catch(e){}}var p=au.play();
    if(p&&p.catch)p.catch(function(e){if(e&&e.name==="NotAllowedError"){joue=false;attente=true;box.classList.remove("is-lecture");btn.setAttribute("aria-pressed","false");signal("pause");}
      else{au=null;son.hidden=true;t0=performance.now()-pos*1000;}});}
  t0=performance.now()-pos*1000;requestAnimationFrame(boucle);}
function arreter(){if(!joue)return;joue=false;if(au)au.pause();box.classList.remove("is-lecture");btn.setAttribute("aria-pressed","false");signal("pause");}

btn.addEventListener("click",function(){if(joue)arreter();else lancer();});
track.addEventListener("click",function(e){if(!T.length)calculer();var r=track.getBoundingClientRect();pos=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width))*total;
  if(au)try{au.currentTime=pos;}catch(_){}t0=performance.now()-pos*1000;box.classList.add("is-ouvert");maj();if(!joue)lancer();});
son.addEventListener("click",function(){if(!au)return;au.muted=!au.muted;son.setAttribute("aria-pressed",au.muted?"true":"false");son.setAttribute("aria-label",au.muted?"Remettre le son":"Couper le son");});
plein.addEventListener("click",function(){if(document.fullscreenElement)document.exitFullscreen();else if(box.requestFullscreen){box.classList.add("is-ouvert");box.requestFullscreen().catch(function(){});}});
/* arrivée sur la rubrique : Tina se présente (assets/agent-accueil.js) */
box.addEventListener("vp:seq",function(){lancer();});
/* son bloqué : la lecture part au premier geste sur la page */
["pointerdown","keydown","touchend"].forEach(function(t){document.addEventListener(t,function(e){if(!attente||box.contains(e.target))return;attente=false;lancer();},true);});
document.addEventListener("vp:voix",function(e){if(e.detail!=="seq-tina")arreter();});
document.addEventListener("visibilitychange",function(){if(document.hidden)arreter();});
calculer();maj();montrer(-1);
})();
