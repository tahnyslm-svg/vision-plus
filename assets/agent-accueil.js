/* Vision Plus — l’agent de chaque catégorie se présente dans sa banderole (2026-11-23, demandes de l’utilisatrice).
   Sur chaque catégorie, une banderole comme celles d’Iris et d’Alma : le portrait de l’agent dans un cadre de verre et sa bulle
   (prénom, rôle, phrase). À l’arrivée sur la catégorie (page, section #ancre ou onglet de « Découvrir »), l’agent se présente
   avec sa voix ; un appui sur son portrait le fait parler de nouveau, un second appui l’arrête.
   Voix : enregistrement ElevenLabs en français (assets/equipe/voix/), voix du navigateur dans les autres langues ;
   si le navigateur bloque le son, la voix part au premier clic ou appui sur la page. Une seule voix à la fois (vp:voix).
   Pages du compte : pas de banderole (formulaires) mais une petite carte discrète, une seule présentation par visite.
   Données : assets/equipe/agents.json. Styles : assets/agent-accueil.css. Pas sur l’accueil (Tyna y accueille déjà).
   2026-11-24 : chaque rubrique du menu commence par le bandeau de son agent, suivi de cette banderole (tableau RUB ci-dessous).
   2026-11-24 : priorité au son des vidéos (bloc ci-dessous). */

/* ---------- priorité au son des vidéos (2026-11-24, demande de l’utilisatrice) ----------
   Dès que le visiteur lance une vidéo (« Lecture », ou chaque relance, sur ordinateur comme sur téléphone), toutes les voix d’agents
   se coupent (événement vp:voix « video ») et seul le son de la vidéo reste audible. Pendant la lecture, mise en mémoire tampon
   comprise, aucune présentation ne se relance d’elle-même. À la pause ou à la fin, l’agent de la rubrique reste silencieux :
   il ne reparle que si le visiteur choisit de le réécouter (clic sur l’agent). Si le visiteur clique sur un agent pendant
   la lecture, la vidéo se met en pause : un seul son à la fois.
   Lecteurs suivis : toute balise <video> de la page, et « Voir l’équipe en action » (assets/pages/equipe-action.js), qui annonce
   sa lecture par l’événement vp:video {etat:"lecture"|"pause"|"fin", id, el}. Les voix consultent window.VP_VIDEO.lecture.
   Ce bloc vit ici parce que ce fichier est chargé sur toutes les pages qui ont une vidéo et un agent qui se présente. */
(function(){
"use strict";
if(window.VP_VIDEO)return;
var joueurs={},LECTEURS={video:1,"seq-tina":1};
var V=window.VP_VIDEO={lecture:false,zone:".vp,video,.eqa"};
function maj(){V.lecture=Object.keys(joueurs).length>0;}
function annonce(etat,el){try{document.dispatchEvent(new CustomEvent("vp:video",{detail:{etat:etat,id:"video",el:el,interne:true}}));}catch(e){}}
function videosEnLecture(){return [].filter.call(document.getElementsByTagName("video"),function(v){return !v.paused&&!v.ended;});}
/* balises <video> : les événements des médias ne remontent pas, on les capte à la descente */
document.addEventListener("play",function(e){var v=e.target;if(!v||v.tagName!=="VIDEO")return;joueurs.video=1;maj();
  try{document.dispatchEvent(new CustomEvent("vp:voix",{detail:"video"}));}catch(_){}annonce("lecture",v);},true);
["pause","ended","emptied"].forEach(function(t){document.addEventListener(t,function(e){var v=e.target;if(!v||v.tagName!=="VIDEO")return;
  if(!videosEnLecture().length){delete joueurs.video;maj();annonce(t==="ended"?"fin":"pause",v);}},true);});
/* autres lecteurs (présentation de Tina) */
document.addEventListener("vp:video",function(e){var d=e.detail||{};if(d.interne||!d.id)return;
  if(d.etat==="lecture")joueurs[d.id]=1;else delete joueurs[d.id];maj();});
/* le visiteur choisit d’écouter un agent pendant une vidéo : la vidéo se met en pause (les voix automatiques, elles, sont bloquées) */
document.addEventListener("vp:voix",function(e){if(!V.lecture||LECTEURS[e.detail])return;
  videosEnLecture().forEach(function(v){try{v.pause();}catch(_){}});});
})();

(function(){
"use strict";
var meta=document.querySelector('meta[name="vp-page"]'),page=meta&&meta.content;
/* rubriques de chaque page (2026-11-24) : [ancres, agent, bandeau après lequel poser sa banderole, "apres" | "debut"].
   L’ancre de l’adresse choisit la rubrique ; "" = arrivée sans ancre. Chaque rubrique a son bandeau d’agent
   (assets/pages/scene-agent.css : titre, agent, texte et boutons à gauche, l’agent en grand à droite), puis sa banderole animée qui parle.
   Un même agent peut tenir deux rubriques d’une page (Tyna : Le service et Avantages) : une banderole par rubrique. */
var RUB={
  decouvrir:[[["agents"],"tyna","#agents>.ag-hero"],[[""],"tyna",".dec-hero"],[["marketing"],"milo","#marketing>.ag-hero"],[["telephone"],"naya","#telephone>.ag-hero"],
    [["gestion"],"noa","#gestion>.ag-hero"],[["fonctionnement"],"orion","#fonctionnement>.ag-hero"],[["avantages"],"tyna","#equipe-en-action","seq"],
    [["secteurs"],"vela","#secteurs>.ag-hero"],[["commencer"],"soren","#commencer>.ag-hero"]],
  "telephone-ia":[[["secretariat-medical","tableau-de-bord","missions-medicales","demonstration","video-medicale"],"alma","#secretariat-medical .mh"],[[""],"iris",".ti-hero"]],
  artisan:[[[""],"arlo",".ao-hero"]],ads:[[[""],"jade",".ag-scene-jade"]],offre:[[[""],"tyna",".ov"]],
  demo:[[[""],"soren","#v-intro>.ag-hero"]],faq:[[[""],"cyra","main>.ag-hero"]],sav:[[[""],"eden","#v-home>.ag-hero"]],
  compte:[[[""],"tyna"]],connexion:[[[""],"tyna"]],inscription:[[[""],"tyna"]],"mot-de-passe":[[[""],"eden"]],"espace-client":[[[""],"tyna"]]
};
var DISCRET={compte:1,connexion:1,inscription:1,"mot-de-passe":1,"espace-client":1};
var R=page&&RUB[page];if(!R)return;
var RM=matchMedia("(prefers-reduced-motion: reduce)");
var VV=window.VP_VIDEO||{lecture:false,zone:".vp,video,.eqa"};
var courant=-1,muets={};   /* rubrique où se trouve le visiteur ; rubriques dont une vidéo a été lancée : leur agent attend qu’on le choisisse */
/* rubrique de l’adresse (index dans R) ; les ancres « mm-… » appartiennent au secrétariat médical */
function rubPour(h){h=h==null?(location.hash||"").slice(1):h;if(/^mm-/.test(h))h="secretariat-medical";var d=-1;
  /* « Découvrir » : sur ordinateur, l’arrivée sans ancre est accueillie par la banderole de Le service ; sur téléphone (écran par écran,
     assets/mobile.js), par celle qui suit le premier écran, et l’ancre #agents ouvre l’onglet « Votre secrétaire IA » (Naya) */
  if(page==="decouvrir"){var M=document.documentElement.classList.contains("m-svc");if(M&&h==="agents")h="telephone";if(!M&&!h)h="agents";}
  for(var i=0;i<R.length;i++){if(h&&R[i][0].indexOf(h)>=0)return i;if(d<0&&R[i][0].indexOf("")>=0)d=i;}return d;}
function lang(){return (document.documentElement.lang||"fr").split(/[-_]/)[0].toLowerCase();}
var HP='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>';
var DATA=null,au=new Audio(),actif=null,attente=null,bandes={};

/* ---------- voix partagée ---------- */
function marque(el,on){if(!el)return;el.classList.toggle("is-parle",on);var b=el.querySelector("[aria-pressed]");if(b)b.setAttribute("aria-pressed",on?"true":"false");}
function stop(){try{au.pause();}catch(e){}if("speechSynthesis" in window)try{speechSynthesis.cancel();}catch(e){}if(actif)marque(actif.el,false);actif=null;}
function tts(k,el){var S="speechSynthesis" in window&&"SpeechSynthesisUtterance" in window;if(!S){stop();return;}
  var a=DATA[k],lp=lang(),vs=speechSynthesis.getVoices().filter(function(v){return new RegExp("^"+lp+"([-_]|$)","i").test(v.lang);});
  var F=/amélie|amelie|audrey|aurélie|marie|julie|léa|lea|céline|samantha|karen|moira|tessa|fiona|victoria|serena|kate|susan|zira|hazel|paulina|monica|alice|anna|helena|sara|kyoko|ting|mei|yuna|milena|laura|female|femme/i;
  var bon=vs.filter(function(v){return a.genre==="f"?F.test(v.name):!F.test(v.name);}),v=(bon.length?bon:vs)[0];
  var nom=el.querySelector(".ag-nom"),ph=el.querySelector(".ag-phrase");
  var u=new SpeechSynthesisUtterance(((nom?nom.textContent+". ":"")+(ph?ph.textContent:"")).replace(/[«»“”„"「」]/g,"").replace(/\bIA\b/g,"I A"));
  if(v){u.voice=v;u.lang=v.lang;}else u.lang=document.documentElement.lang||"fr";
  u.onend=u.onerror=function(ev){if(!actif||actif.el!==el)return;marque(el,false);actif=null;
    if(ev&&ev.error==="not-allowed"){attente={k:k,el:el};el.classList.add("is-attente");return;}fini(el);};speechSynthesis.speak(u);}
var tour=0;   /* chaque prise de parole a son numéro : l’échec d’une lecture remplacée ne coupe pas la suivante */
function parler(k,el){stop();var n=++tour;actif={k:k,el:el};marque(el,true);attente=null;
  try{document.dispatchEvent(new CustomEvent("vp:voix",{detail:"accueil-"+k}));}catch(e){}
  if(lang()!=="fr"||!DATA[k].voix){tts(k,el);return;}   /* pas d’enregistrement (Orion, Vela) : voix du navigateur */
  au.src=DATA[k].voix;var p=au.play();
  if(p&&p.catch)p.catch(function(e){if(n!==tour||!actif||actif.el!==el)return;marque(el,false);actif=null;
    if(e&&e.name==="NotAllowedError"){attente={k:k,el:el};el.classList.add("is-attente");}else if(!e||e.name!=="AbortError")tts(k,el);});}
au.addEventListener("ended",function(){if(actif){var el=actif.el;marque(el,false);actif=null;fini(el);}});
function fini(el){if(el&&el.classList.contains("ag-acc")){clearTimeout(el._t);el._t=setTimeout(function(){el.classList.add("is-range");},5000);}}
/* son bloqué : la voix part au premier geste sur la page (hors banderole et carte) ;
   un geste sur un lecteur vidéo, ou pendant une vidéo, vaut choix de la vidéo : l’agent en attente ne parle pas */
function lacher(){if(attente){attente.el.classList.remove("is-attente");attente=null;}}
function premierGeste(e){var t=e.target;if(!attente||!t||!t.closest||t.closest(".ag-band,.ag-acc"))return;
  if(VV.lecture||t.closest(VV.zone)){lacher();return;}
  var a=attente;attente=null;a.el.classList.remove("is-attente");parler(a.k,a.el);}
["pointerdown","keydown","touchend"].forEach(function(t){document.addEventListener(t,premierGeste,true);});

/* ---------- banderole (pages des catégories) ---------- */
function banderole(k){var a=DATA[k],d=document.createElement("div");d.className="ag-band";d.dataset.agent=k;
  d.innerHTML='<button type="button" class="ag-band-pic" aria-pressed="false"><span class="ag-band-fig"><img src="'+a.photo+'" alt="" width="400" height="600" decoding="async" loading="lazy"></span>'+
    '<span class="ag-band-onde" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span class="sr">Écouter</span> <span class="sr ag-nom-sr"></span></button>'+
    '<p class="ag-band-bulle"><span class="ag-band-id"><b class="ag-nom"></b><span class="ag-role"></span></span><span class="ag-phrase"></span>'+
    '<span class="ag-band-hint">'+HP+'<span>Écouter</span></span></p>';
  d.querySelector(".ag-nom").textContent=a.prenom;d.querySelector(".ag-nom-sr").textContent=a.prenom;
  d.querySelector(".ag-role").textContent=a.role;d.querySelector(".ag-phrase").textContent=a.phrase;
  function clic(){if(actif&&actif.el===d){stop();return;}d.classList.remove("is-attente");parler(k,d);}
  d.querySelector(".ag-band-pic").addEventListener("click",clic);
  d.querySelector(".ag-band-bulle").addEventListener("click",clic);
  if("IntersectionObserver" in window&&!RM.matches){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){d.classList.add("is-vu");io.unobserve(d);}});},{threshold:.35});io.observe(d);}
  else d.classList.add("is-vu");
  return d;}
/* "seq" : la rubrique a sa propre séquence présentée par l’agent (Avantages : « Voir l’équipe en action », assets/pages/equipe-action.js) */
function poser(r){var cible=document.querySelector(r[2]||"main > section");if(!cible)return null;if(r[3]==="seq")return cible;
  var d=banderole(r[1]);if(r[3]==="debut")cible.insertBefore(d,cible.firstChild);else cible.parentNode.insertBefore(d,cible.nextSibling);return d;}

/* ---------- carte discrète (pages du compte) ---------- */
function carte(k){var a=DATA[k],c=document.createElement("aside");c.className="ag-acc";c.dataset.agent=k;c.setAttribute("aria-labelledby","ag-acc-nom");
  c.innerHTML='<button type="button" class="ag-acc-pastille"><img src="'+a.photo+'" alt="" width="400" height="600" decoding="async"><span class="sr">Écouter</span> <span class="sr ag-nom-sr"></span></button>'+
    '<div class="ag-acc-carte"><div class="ag-acc-pic"><img src="'+a.photo+'" alt="" width="400" height="600" decoding="async"><span class="ag-acc-onde" aria-hidden="true"><i></i><i></i><i></i><i></i></span></div>'+
    '<div class="ag-acc-txt"><p class="ag-acc-id"><b id="ag-acc-nom" class="ag-nom"></b><span class="ag-acc-role"></span></p><p class="ag-acc-phrase ag-phrase"></p>'+
    '<div class="ag-acc-act"><button type="button" class="ag-acc-ecouter" aria-pressed="false">'+HP.replace('<svg','<svg class="ico"')+'<span>Écouter</span></button><a class="ag-acc-plus" href="index.html#fiche-'+a.module+'"><span>En savoir plus</span></a></div></div>'+
    '<button type="button" class="ag-acc-x" aria-label="Fermer"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>';
  c.querySelector(".ag-nom").textContent=a.prenom;c.querySelectorAll(".ag-nom-sr").forEach(function(x){x.textContent=a.prenom;});
  c.querySelector(".ag-acc-role").textContent=a.role;c.querySelector(".ag-phrase").textContent=a.phrase;
  c.querySelector(".ag-acc-ecouter").addEventListener("click",function(){if(actif&&actif.el===c)stop();else parler(k,c);});
  c.querySelector(".ag-acc-x").addEventListener("click",function(){stop();attente=null;c.classList.add("is-range");});
  c.querySelector(".ag-acc-pastille").addEventListener("click",function(){c.classList.remove("is-range");parler(k,c);});
  document.body.appendChild(c);requestAnimationFrame(function(){c.classList.add("is-in");});return c;}

/* ---------- arrivée sur une rubrique (#ancre) : les banderoles s’insèrent après le saut du navigateur vers l’ancre et la décalent ;
   on revient au début de la rubrique (son bandeau), sauf si la personne a déjà fait défiler. Les onglets de « Découvrir » se placent
   eux-mêmes (decouvrir.html) ; le téléphone de « Découvrir » montre une rubrique à la fois (assets/mobile.js). ---------- */
var bouge=false;["wheel","touchmove","keydown","mousedown"].forEach(function(t){addEventListener(t,function(){bouge=true;},{once:true,passive:true});});
function recaler(){var h=(location.hash||"").slice(1),c=h&&document.getElementById(h);
  if(!c||bouge||c.getAttribute("role")==="tabpanel"||document.documentElement.classList.contains("m-svc"))return;c.scrollIntoView({block:"start"});}
window.addEventListener("hashchange",function(){bouge=false;});

/* ---------- accueil : l’agent de la rubrique se présente ---------- */
/* un seul accueil à la fois : l’onglet cliqué et le changement d’ancre arrivent ensemble, on ne lance la voix qu’une fois */
var prevu=null;
function accueillir(i){courant=i;var el=bandes[i];if(!el||(actif&&actif.el===el)||(prevu&&prevu.el===el))return;if(prevu)clearTimeout(prevu.t);
  prevu={el:el,t:setTimeout(function(){prevu=null;
    /* priorité à la vidéo : aucune présentation pendant une lecture, ni dans une rubrique dont la vidéo a été lancée */
    if(VV.lecture||muets[i])return;
    /* « Offre sur mesure » (2026-11-24, demande de l’utilisatrice) : Tina reste visible dans sa banderole mais ne se présente pas
       d’elle-même ; un appui sur son portrait la fait toujours parler */
    if(page==="offre")return;
    if(R[i][3]==="seq"){stop();try{el.dispatchEvent(new CustomEvent("vp:seq"));}catch(e){}return;}parler(R[i][1],el);},RM.matches?0:700)};}

/* rubrique d’un lecteur : la plus proche ancre de la rubrique qui le contient, sinon la rubrique de l’arrivée sans ancre */
function rubDe(el){for(var n=el;n&&n!==document.body;n=n.parentElement){if(n.id)for(var i=0;i<R.length;i++){if(R[i][0].indexOf(n.id)>=0)return i;}}
  var d=rubPour("");return d>=0?d:courant;}
/* une vidéo démarre (ou redémarre) : l’agent se tait, rien ne reste en attente, et sa rubrique reste silencieuse ensuite */
document.addEventListener("vp:video",function(e){var d=e.detail||{};if(d.etat!=="lecture")return;
  stop();lacher();if(prevu){clearTimeout(prevu.t);prevu=null;}
  var i=d.el?rubDe(d.el):courant;if(i>=0)muets[i]=1;});

document.addEventListener("vp:voix",function(e){if(actif&&e.detail!=="accueil-"+actif.k)stop();});
document.addEventListener("visibilitychange",function(){if(document.hidden)stop();});
document.addEventListener("vp:lang",stop);

fetch("assets/equipe/agents.json",{cache:"no-cache"}).then(function(r){return r.json();}).then(function(d){DATA=d;
  var i=rubPour();if(i<0)return;
  if(DISCRET[page]){var cle="vp.accueil-agent."+page,vu=false;try{vu=sessionStorage.getItem(cle)==="1";sessionStorage.setItem(cle,"1");}catch(e){}
    var c=carte(R[i][1]);bandes[i]=c;if(vu)c.classList.add("is-range");else accueillir(i);return;}
  /* une banderole par rubrique, juste après son bandeau (Découvrir : huit rubriques ; Votre secrétaire IA : Iris et Alma) */
  R.forEach(function(r,j){if(DATA[r[1]]){var el=poser(r);if(el)bandes[j]=el;}});
  document.documentElement.classList.add("has-ag-band");
  recaler();if(document.readyState!=="complete")addEventListener("load",recaler);setTimeout(recaler,1200);
  accueillir(i);
  window.addEventListener("hashchange",function(){var n=rubPour();if(n>=0)accueillir(n);});
  /* onglets de « Découvrir » : chaque onglet cliqué accueille avec son agent */
  document.querySelectorAll('[role="tab"][aria-controls]').forEach(function(t){t.addEventListener("click",function(){
    var n=rubPour(t.getAttribute("aria-controls"));if(n>=0&&R[n][0].indexOf(t.getAttribute("aria-controls"))>=0)accueillir(n);});});
}).catch(function(){});
})();
