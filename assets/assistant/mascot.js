/* Vision Plus — assistant d'accueil de la page d'accueil.
   Depuis le 2026-11-23 : c’est Tyna, l’assistante IA de l’équipe d’agents (portrait assets/equipe/tyna-*.webp), qui accueille,
   à la place du robot. Elle dit son message (sous-titré dans la bulle), puis guide le visiteur vers le bon agent :
   raccourcis vers les fiches de l’accueil, ou champ « Que souhaitez-vous faire ? » orienté par mots-clés (sinon la FAQ). Voix : celle du navigateur (voix féminine de préférence) tant que l’enregistrement d’Iris n’existe pas ;
   pour la voix enregistrée, renseigner AUDIO, puis recalculer SEG (débuts des phrases) et ENV (volume toutes les 40 ms).
   1. À chaque ouverture du site (pas au retour depuis une autre page du site) : le robot salue et présente Vision Plus à voix haute (bienvenue-vision-plus.mp4, voix naturelle
      enregistrée), le texte s'affiche en même temps dans une bulle, puis il propose les raccourcis (services, FAQ).
   2. Si le navigateur bloque le son automatique : animation et texte tout de suite, voix à la première interaction
      (sur mobile : dès que le visiteur touche le robot).
   2 bis. À chaque arrivée sur l’accueil, ordinateur comme téléphone, la bulle s’ouvre et le robot parle tout seul.
      Si le navigateur bloque le son (Safari sur iPhone, Chrome à la première visite), la voix démarre au premier appui ou clic
      n’importe où sur la page, sans viser le robot. Toucher le robot relance sa voix ; jamais deux lectures en même temps.
   3. Bouche calée sur le volume de l'enregistrement (ENV) ; surlignage et gestes calés sur ses segments (SEG).
   4. Commandes discrètes : couper le son, arrêter la présentation, réduire le robot dans l'en-tête, où il ne recouvre aucun contenu.
      Depuis le 2026-11-24 (demande de l’utilisatrice : « Tyna parle automatiquement chaque fois qu’on ouvre Vision Plus ») :
      le son coupé ne vaut que pour la page en cours, il n’est plus mémorisé d’une visite à l’autre ; Tyna reparle aussi
      au retour par le bouton « Précédent » (page restaurée par le navigateur, évènement pageshow) et même si son portrait
      ne se charge pas.
   Repli : voix du navigateur si le fichier audio ne peut pas être lu. Rien n'est envoyé à un serveur.
   Règle : ne présenter que des fonctions réellement disponibles ou clairement configurables. */
(function(){
"use strict";
var A=window.VISIONPLUS;if(!A||document.querySelector(".axbot"))return;
/* son coupé : pour la page en cours seulement (Tyna reparle à chaque ouverture du site) ; l’ancien choix mémorisé est effacé */
var ST_KEY="assistant.home",st={muted:false};try{A.store.set(ST_KEY,{});}catch(e){}
var MQ_M=matchMedia("(max-width:760px)"),MQ_R=matchMedia("(prefers-reduced-motion: reduce)");
function save(){}

/* ---------- texte lu : début de chaque segment dans bienvenue-vision-plus.mp4 (secondes), paragraphe, geste ---------- */
var SEG=[
  {t:0,p:0,s:"Bonjour, je suis Tyna, votre assistante IA chez Vision Plus.",g:"wave"},
  {t:3.8,p:1,s:"Dites-moi ce que vous souhaitez faire et je vous guide vers le bon agent.",g:"present"}
];
/* volume de la voix toutes les 40 ms (0 à 9), mesuré sur bienvenue-vision-plus.mp4 : la bouche le suit */
var ENV="";   /* plus d’enveloppe précalculée : l’intensité suit le son en direct (voir sync) */
var AUDIO="assets/equipe/voix/tyna-accueil.m4a",IMG="assets/equipe/tyna-400.webp";   /* voix enregistrée de Tyna (ElevenLabs, « Clémence », élégante, assurée et énergique, en français (échangée avec Jade)) ; sinon voix du navigateur */
var SHORT=[["telephone","phone","Naya · Répondre à mes appels"],["secretariat","file","Iris · Agenda, devis et e-mails"],["marketing","mega","Milo · Mes publications"],["web","layers","Noa · Mon site internet"],["agents","user","Voir toute l’équipe"]];
var IC={
  minus:'<path d="M6 12h12"/>',
  speak:'<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>',
  mute:'<path d="M11 5 6 9H3v6h3l5 4z"/><path d="m16 9.5 5 5M21 9.5l-5 5"/>',
  stop:'<rect x="6.5" y="6.5" width="11" height="11" rx="2"/>',
  replay:'<path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.5"/><path d="M4 4v4.5h4.5"/>'
};
function ic(n){return IC[n]?'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">'+IC[n]+"</svg>":A.icon(n);}
function fig(){return '<span class="ax-fig" aria-hidden="true"><img alt="" width="400" height="600" decoding="async"><span class="ax-voice"><i></i><i></i><i></i><i></i></span></span>';}

/* ---------- panneau ---------- */
var root=document.createElement("aside");root.className="axbot ax-iris";root.id="ax-panel";root.hidden=true;root.setAttribute("aria-label","Tyna, assistante IA de Vision Plus");
root.innerHTML=
  '<div class="ax-bubble" role="dialog" aria-labelledby="ax-name">'+
    '<div class="ax-top"><span class="ax-name" id="ax-name">Tyna · Assistante IA</span><div class="ax-tools">'+
      '<button type="button" class="ax-ic" data-act="mute"></button>'+
      '<button type="button" class="ax-ic" data-act="stop" aria-label="Arrêter la présentation" title="Arrêter la présentation" hidden>'+ic("stop")+"</button>"+
      '<button type="button" class="ax-ic" data-act="min" aria-label="Réduire l\'assistant dans l\'en-tête" title="Réduire">'+ic("minus")+"</button></div></div>"+
    '<div class="ax-txt" aria-live="polite"></div>'+
    '<p class="ax-hint">'+ic("speak")+'<span>Touchez Tyna pour l’écouter</span></p>'+
    '<div class="ax-more" hidden><p class="ax-more-t">Vers quel agent ?</p><div class="ax-short">'+
      SHORT.map(function(s){return '<button type="button" class="ax-sc" data-go="'+s[0]+'">'+A.icon(s[1])+"<span>"+s[2]+"</span>"+A.icon("arrow")+"</button>";}).join("")+"</div>"+
      '<form class="ax-ask" action="faq.html" method="get" role="search"><label class="sr" for="ax-q">Ce que vous souhaitez faire</label>'+
        '<input id="ax-q" name="q" type="text" maxlength="200" autocomplete="off" placeholder="Que souhaitez-vous faire ?">'+
        '<button type="submit" class="ax-send" aria-label="Trouver le bon agent">'+A.icon("send")+"</button></form>"+
      '<div class="ax-foot"><p class="ax-note">Je vous oriente vers le bon agent, sinon vers la FAQ.</p><button type="button" class="ax-chip" data-act="replay">'+ic("replay")+"Réécouter</button></div>"+
    "</div>"+
  "</div>"+
  '<div class="ax-char" aria-hidden="true"><span class="ax-glow"></span><span class="ax-float"><span class="ax-tilt">'+fig()+"</span></span></div>";
var txt=root.querySelector(".ax-txt"),more=root.querySelector(".ax-more"),arm=root.querySelector(".ax-arm"),bubble=root.querySelector(".ax-bubble"),
    bMute=root.querySelector('[data-act="mute"]'),bStop=root.querySelector('[data-act="stop"]');

/* ---------- au repos : pastille dans l'en-tête ---------- */
var dock=document.createElement("button");dock.type="button";dock.className="ax-dock ax-iris";
dock.setAttribute("aria-controls","ax-panel");dock.setAttribute("aria-expanded","false");
dock.setAttribute("aria-label","Tyna, assistante IA : trouver le bon agent");dock.title="Tyna, assistante IA";dock.innerHTML=fig();
function placeDock(){var top=document.querySelector(".top-in"),auth=document.querySelector(".top-auth");if(!top)return;
  var host=MQ_M.matches||!auth?top:auth;if(dock.parentNode!==host)host.appendChild(dock);
  dock.setAttribute("aria-label",MQ_M.matches?"Écouter Tyna, l’assistante IA":"Tyna, assistante IA : trouver le bon agent");}

/* ---------- affichage ---------- */
var view="";
function renderWelcome(){view="welcome";var ps=[[],[],[],[]];
  SEG.forEach(function(g,i){ps[g.p].push('<span class="ax-s" data-i="'+i+'">'+A.esc(g.s)+"</span>");});
  txt.innerHTML=ps.filter(function(p){return p.length;}).map(function(p){return "<p data-i18n-split>"+p.join(" ")+"</p>";}).join("");
  more.hidden=true;}
function renderMenu(){view="menu";txt.innerHTML='<p class="ax-hello">Que souhaitez-vous découvrir ?</p>';more.hidden=false;more.querySelector(".ax-more-t").hidden=true;}
function reveal(){if(more.hidden){more.querySelector(".ax-more-t").hidden=false;more.hidden=false;}}
function tools(){
  bMute.setAttribute("aria-pressed",st.muted?"true":"false");
  bMute.setAttribute("aria-label",st.muted?"Réactiver le son":"Couper le son");bMute.title=st.muted?"Son coupé · réactiver":"Couper le son";
  bMute.innerHTML=ic(st.muted?"mute":"speak");
  bStop.hidden=!(playing||waiting);}
function isOpen(){return !root.hidden&&root.classList.contains("is-in");}
function open(v,byUser){
  if(v==="menu")renderMenu();else renderWelcome();
  root.hidden=false;dock.setAttribute("aria-expanded","true");tools();fitBanner();y0=v==="menu"?(window.scrollY||0):null;
  setTimeout(function(){root.classList.add("is-in");},20);
  if(byUser){var f=root.querySelector(".ax-more:not([hidden]) .ax-sc")||root.querySelector(".ax-tools button");if(f)f.focus({preventScroll:true});}}
function close(byUser){
  halt();if(byUser||!pend){pend=false;unlisten();}else{waiting=false;root.classList.remove("is-waiting");}
  var had=root.contains(document.activeElement);
  root.classList.remove("is-in");dock.setAttribute("aria-expanded","false");
  setTimeout(function(){if(!root.classList.contains("is-in"))root.hidden=true;},MQ_R.matches?0:320);
  if(!MQ_R.matches){dock.classList.remove("is-pop");void dock.offsetWidth;dock.classList.add("is-pop");}
  if(had)dock.focus({preventScroll:true});}

/* ---------- gestes : 6 poses rendues en 3D (0 repos, 1 bras tendu vers la bulle, 2-3 levé, 4-5 salut) ---------- */
var armF=0,armT=0;
function armSeq(seq,ms){clearTimeout(armT);if(!arm||MQ_R.matches||!seq.length)return;var k=0;
  (function step(){armF=seq[k++];arm.style.backgroundPositionX=(armF*20)+"%";if(k<seq.length)armT=setTimeout(step,ms);})();}
function toRest(){var seq=[];for(var f=Math.min(armF,3);f>=0;f--)seq.push(f);if(armF>3)seq.unshift(3);armSeq(seq,70);}
function nod(){if(MQ_R.matches)return;root.classList.add("is-nod");setTimeout(function(){root.classList.remove("is-nod");},450);}
function pose(c,ms){if(MQ_R.matches)return;root.classList.add(c);setTimeout(function(){root.classList.remove(c);},ms);}
function gesture(g){
  if(!arm){if(g==="wave"||g==="hello")pose("is-wave",1400);else if(g==="present"||g==="bounce")pose("is-lean",900);else if(g==="nod")nod();return;}
  if(g==="wave")armSeq([1,2,3,4,3,5,3,4,3,2,1,0],85);
  else if(g==="present")armSeq([1],0);
  else if(g==="bounce")armSeq([2,1],130);
  else if(g==="rest")toRest();
  else if(g==="hello")armSeq([1,2,3,4,3,5,3],90);
  else if(g==="nod")nod();}

/* ---------- voix : enregistrement, sinon voix du navigateur ---------- */
var au=null,useAudio=false,playing=false,waiting=false,raf=0,seg=-1,mouth=0,resumeOnShow=false;
(function(){var a=document.createElement("audio");
  if(AUDIO&&a.canPlayType&&a.canPlayType(/\.m4a$/.test(AUDIO)?'audio/mp4; codecs="mp4a.40.2"':"audio/mpeg")){a.preload="auto";a.src=AUDIO;au=a;useAudio=true;
    a.addEventListener("ended",function(){finish();});
    /* début de la 2e phrase : au prorata du texte (le message de Tyna est dit d’un seul trait) */
    a.addEventListener("loadedmetadata",function(){if(!isFinite(a.duration)||SEG.length<2)return;var tot=0,acc=0;SEG.forEach(function(g){tot+=g.s.length;});
      for(var k=1;k<SEG.length;k++){acc+=SEG[k-1].s.length;SEG[k].t=+(a.duration*acc/tot).toFixed(2);}});}})();
var V={ok:"speechSynthesis" in window&&"SpeechSynthesisUtterance" in window,voice:null,i:0,token:0,timer:0};
/* langue du site (sélecteur de langue) : l'enregistrement n'existe qu'en français ; dans les autres langues, la voix du navigateur lit le texte traduit */
function lang(){return (document.documentElement.lang||"fr").split(/[-_]/)[0].toLowerCase();}
function isFr(){return lang()==="fr";}
function pickVoice(){
  var lp=lang(),vs=speechSynthesis.getVoices().filter(function(v){return new RegExp("^"+lp+"([-_]|$)","i").test(v.lang);});if(!vs.length)return null;
  function score(v){var n=v.name,s=0;
    if(/fr[-_]FR/i.test(v.lang))s+=4;
    if(/natural|neural|online/i.test(n))s+=8;
    if(/premium|enhanced|amélior/i.test(n))s+=6;
    if(/denise|vivienne|eloise|audrey|aurélie|amélie|marie|céline|google|léa|julie|hortense/i.test(n))s+=3;
    if(/henri|remy|rémy|thomas|daniel|nicolas|paul|guillaume|claude|mathieu/i.test(n))s-=6;   /* Tyna : voix féminine de préférence */
    if(/grandma|grandpa|eddy|flo\b|reed|rocko|sandy|shelley|jacques/i.test(n))s-=12;
    return s;}
  return vs.sort(function(a,b){return score(b)-score(a);})[0];}
if(V.ok){V.voice=pickVoice();speechSynthesis.addEventListener("voiceschanged",function(){V.voice=pickVoice();});}
document.addEventListener("vp:voix",function(e){if(e.detail!=="tyna-accueil"&&playing)halt();});
document.addEventListener("vp:lang",function(){stopSpeech();if(playing)finish();if(V.ok)V.voice=pickVoice();});

function setSeg(i){seg=i;
  [].forEach.call(txt.querySelectorAll(".ax-s"),function(el){var k=+el.getAttribute("data-i");el.classList.toggle("is-now",k===i);el.classList.toggle("is-past",k<i);});
  /* bulle raccourcie (petit écran, bannière cookies) : la phrase lue reste visible */
  var now=txt.querySelector(".ax-s.is-now");
  if(now&&bubble.scrollHeight>bubble.clientHeight+4){var y=now.offsetTop,h=now.offsetHeight;
    if(y<bubble.scrollTop+40||y+h>bubble.scrollTop+bubble.clientHeight-12)bubble.scrollTo({top:Math.max(0,y-56),behavior:MQ_R.matches?"auto":"smooth"});}
  if(i>=0&&SEG[i].g)gesture(SEG[i].g);}
function onPlay(){try{document.dispatchEvent(new CustomEvent("vp:voix",{detail:"tyna-accueil"}));}catch(e){}playing=true;waiting=false;pend=false;unlisten();more.hidden=true;root.classList.add("is-playing","is-talking");tools();
  if(useAudio){cancelAnimationFrame(raf);raf=requestAnimationFrame(sync);}}
/* calage sur l'enregistrement : segment en cours, gestes, ouverture de la bouche */
function sync(){
  if(!playing||!au)return;
  var t=au.currentTime,i=0;while(i<SEG.length-1&&t>=SEG[i+1].t-.04)i++;if(i!==seg)setSeg(i);
  var v=ENV?(ENV.charCodeAt(Math.min(ENV.length-1,Math.floor(t/.04)))-48)/9:.55+.35*Math.sin(t*8.3)*Math.sin(t*3.1);mouth+=(v-mouth)*.55;
  if(!MQ_R.matches)root.style.setProperty("--m",(.1+.9*mouth).toFixed(3));
  raf=requestAnimationFrame(sync);}
function speak(){
  stopSpeech();seg=-1;
  if(useAudio&&isFr()){au.muted=!!st.muted;try{au.currentTime=0;}catch(e){}
    var p=au.play();
    if(p&&p.then)p.then(onPlay,function(e){if(e&&e.name==="NotAllowedError")listen();else if(e&&e.name==="AbortError"){/* lecture relancée entre-temps : rien à faire */}else{useAudio=false;speak();}});else onPlay();
    return;}
  if(!V.ok||!V.voice){reveal();return;}
  root.classList.add("is-tts");ttsSay();}
function ttsSay(){
  var parts=SEG.map(function(g,i){var el=txt.querySelector('.ax-s[data-i="'+i+'"]');return isFr()?g.s.replace(/\bIA\b/g,"I A"):((el&&el.textContent)||g.s);}),
      starts=[],n=0;parts.forEach(function(p){starts.push(n);n+=p.length+1;});
  var u=new SpeechSynthesisUtterance(parts.join(" ")),my=++V.token;
  u.voice=V.voice;u.lang=V.voice.lang;u.rate=1;u.pitch=1.02;
  u.onstart=function(){if(my!==V.token)return;clearTimeout(V.timer);if(!playing)onPlay();setSeg(0);};
  u.onboundary=function(e){if(my!==V.token)return;var k=0;while(k<starts.length-1&&e.charIndex>=starts[k+1])k++;if(k!==seg)setSeg(k);};
  u.onend=function(){if(my===V.token)finish();};
  u.onerror=function(e){if(my!==V.token)return;clearTimeout(V.timer);if(e.error==="not-allowed"&&!playing){V.token++;listen();}else finish();};
  speechSynthesis.speak(u);
  /* certains navigateurs mettent la voix en attente sans erreur : on considère alors le son bloqué */
  if(!playing){clearTimeout(V.timer);V.timer=setTimeout(function(){if(!playing&&my===V.token){V.token++;speechSynthesis.cancel();listen();}},1800);}}
function stopSpeech(){V.token++;clearTimeout(V.timer);if(V.ok)try{speechSynthesis.cancel();}catch(e){}if(au&&!au.paused)au.pause();}
/* fin naturelle ou arrêt : le robot baisse le bras et propose les raccourcis */
function finish(){
  playing=false;cancelAnimationFrame(raf);stopSpeech();
  root.classList.remove("is-playing","is-talking","is-tts");root.style.removeProperty("--m");
  [].forEach.call(txt.querySelectorAll(".ax-s"),function(el){el.classList.remove("is-now","is-past");});
  toRest();reveal();tools();markScroll();}
function halt(){if(playing)finish();}

/* ---------- son bloqué : la voix démarre à la première interaction ---------- */
/* son bloqué : le premier appui, clic ou touche n’importe où sur la page lance la voix (sur téléphone, le simple défilement
   ne compte pas pour le navigateur) ; la présentation reste en attente même si la bulle s’est rangée pendant le défilement */
var EVTS=["pointerdown","keydown","touchend","click"],EVTS_M=["touchend","click","keydown"],EVTS_ALL=["pointerdown","keydown","touchend","click"],pend=false;
function listen(){
  waiting=true;pend=true;reveal();tools();markScroll();
  if(seg<0&&!MQ_R.matches&&isOpen())gesture("wave");
  if(MQ_M.matches)root.classList.add("is-waiting");
  if(!listen.on){listen.on=true;(MQ_M.matches?EVTS_M:EVTS).forEach(function(t){document.addEventListener(t,onFirst,true);});}}
function unlisten(){waiting=false;root.classList.remove("is-waiting");if(listen.on){listen.on=false;EVTS_ALL.forEach(function(t){document.removeEventListener(t,onFirst,true);});}}
var fired=0;
function onFirst(e){
  if(!pend||playing)return;
  if(Date.now()-fired<1200)return;          /* un appui déclenche plusieurs évènements (touchend puis click) : une seule lecture */
  if(st.muted){pend=false;unlisten();tools();return;}
  if(e.type==="keydown"&&e.key==="Escape")return;
  if(e.target&&e.target.closest&&e.target.closest(".ax-tools,.ax-dock,.ax-more,.ax-char"))return;
  fired=Date.now();
  if(isOpen()){speak();return;}
  /* bulle rangée : elle ne se rouvre que si le son démarre vraiment (un défilement ne la rouvre jamais) */
  if(useAudio&&isFr()){au.muted=false;try{au.currentTime=0;}catch(err){}
    var p=au.play();
    if(p&&p.then){p.then(function(){au.pause();open("welcome",false);speak();},function(){});return;}}
  open("welcome",false);speak();}

/* ---------- raccourcis : la fiche du module sur l’accueil (équipe d’agents), sinon la page dédiée ---------- */
var PAGES={telephone:"telephone-ia.html",secretariat:"telephone-ia.html#missions",medical:"telephone-ia.html#secretariat-medical",marketing:"decouvrir.html#marketing",
  ads:"campagne-ads.html",web:"decouvrir.html#gestion",artisan:"artisan-os.html",agents:"index.html#agents"};
/* mots-clés (sans accents) → module ; l’ordre compte : le plus précis d’abord */
var ROUTES=[["medical",/medic|patient|cabinet|sante|docteur|clinique|infirm|dentist|kine/],
  ["artisan",/chantier|batiment|artisan|plomb|electricien|renovation|btp|peintre|plaquiste/],
  ["ads",/publicit|\bpub\b|campagne|\bads?\b|amazon|annonce/],
  ["marketing",/reseau|publication|instagram|facebook|linkedin|tiktok|\bpost|contenu|marketing|visibilite/],
  ["web",/\bsite|\bweb|page|horaire|\bmenu\b|mise a jour|en ligne/],
  ["telephone",/appel|telephon|standard|repondeur|decroch/],
  ["secretariat",/devis|agenda|rendez|rdv|mail|courrier|document|commande|colis|administrat|secretar|factur|dossier|planning/]];
function route(q){var n=(q||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  for(var i=0;i<ROUTES.length;i++)if(ROUTES[i][1].test(n))return ROUTES[i][0];return null;}
function go(k){
  if(k==="faq"){halt();location.href="faq.html#question";return;}
  if(k==="agents"){var sec=document.getElementById("agents");if(!sec){halt();location.href=PAGES.agents;return;}
    close();sec.scrollIntoView({behavior:MQ_R.matches?"auto":"smooth",block:"start"});return;}
  var b=document.querySelector('.eq-more[data-fiche="fiche-'+k+'"]');
  if(!b){halt();location.href=PAGES[k]||"decouvrir.html";return;}
  close();b.click();}
root.querySelector(".ax-ask").addEventListener("submit",function(e){var k=route(root.querySelector("#ax-q").value);if(k){e.preventDefault();go(k);}});

/* ---------- mobile : toucher le robot lance sa voix ---------- */
function playFromTouch(){
  if(playing)return;                                   /* déjà en train de parler : pas de seconde lecture */
  if(st.muted){st.muted=false;save();}                 /* le toucher vaut demande explicite d'écoute */
  if(!isOpen())open("welcome",false);else if(view!=="welcome")renderWelcome();
  unlisten();speak();}

/* ---------- événements ---------- */
dock.addEventListener("click",function(){
  if(MQ_M.matches){playFromTouch();return;}
  if(isOpen())close(true);else open("menu",true);});
root.querySelector(".ax-char").addEventListener("click",function(){if(MQ_M.matches)playFromTouch();});
root.addEventListener("click",function(e){
  var g=e.target.closest("[data-go]");if(g){go(g.getAttribute("data-go"));return;}
  var b=e.target.closest("[data-act]");if(!b)return;
  switch(b.getAttribute("data-act")){
    case "mute":st.muted=!st.muted;save();
      if(st.muted){unlisten();if(playing&&!useAudio)finish();else if(au)au.muted=true;}
      else if(au)au.muted=false;
      tools();break;
    case "stop":unlisten();halt();tools();break;
    case "min":close(true);break;
    case "replay":if(view!=="welcome")renderWelcome();if(st.muted){st.muted=false;save();}speak();break;}});
root.addEventListener("submit",function(e){var q=root.querySelector("#ax-q");if(!q.value.trim()){e.preventDefault();q.focus();return;}halt();});
root.addEventListener("keydown",function(e){if(e.key==="Escape"&&isOpen()){e.stopPropagation();close(true);}});
document.addEventListener("visibilitychange",function(){
  root.classList.toggle("ax-paused",document.hidden);dock.classList.toggle("ax-paused",document.hidden);
  if(document.hidden){if(playing&&useAudio&&!au.paused){au.pause();resumeOnShow=true;}else if(playing)finish();}
  else if(resumeOnShow){resumeOnShow=false;if(playing&&isOpen())au.play().catch(function(){finish();});}});
window.addEventListener("pagehide",function(){stopSpeech();});
/* hors lecture, le robot s'efface dans l'en-tête dès que le visiteur parcourt la page : il ne masque aucun contenu */
var y0=null,ty=0;
function markScroll(){y0=window.scrollY||0;}
window.addEventListener("scroll",function(){if(ty)return;ty=setTimeout(function(){ty=0;
  if(isOpen()&&!playing&&y0!=null&&Math.abs((window.scrollY||0)-y0)>160&&!root.contains(document.activeElement))close();},120);},{passive:true});
(MQ_M.addEventListener?MQ_M.addEventListener("change",placeDock):MQ_M.addListener(placeDock));

/* ---------- démarrage ---------- */
/* bannière cookies encore affichée (mobile, petit écran) : la bulle se place au-dessus d'elle, puis reprend sa place */
function fitBanner(){
  var c=document.querySelector(".cookie");root.style.bottom="";bubble.style.maxHeight="";
  if(!c||root.hidden)return;
  var cr=c.getBoundingClientRect(),pr=root.getBoundingClientRect();
  if(!cr.height||cr.left>=pr.right||cr.right<=pr.left)return;
  root.style.bottom=Math.round(innerHeight-cr.top+10)+"px";
  var head=document.querySelector(".top"),room=cr.top-10-(head?head.getBoundingClientRect().bottom:0)-(MQ_M.matches?root.querySelector(".ax-char").offsetHeight*.7:0)-8;
  bubble.style.maxHeight=Math.max(160,Math.round(room))+"px";}
document.addEventListener("vp:consent",function(){setTimeout(fitBanner,30);});
window.addEventListener("resize",function(){if(!root.hidden)fitBanner();});
/* présentation automatique à chaque arrivée sur l’accueil (ouverture du site, lien, onglet « Accueil », rechargement),
   sur ordinateur comme sur téléphone : la bulle s’ouvre et le robot parle (si le son est bloqué : voir listen()) */
function present(){
  if(document.hidden){document.addEventListener("visibilitychange",function v(){if(!document.hidden){document.removeEventListener("visibilitychange",v);setTimeout(present,400);}});return;}
  open("welcome",false);
  if(st.muted){gesture("wave");reveal();tools();return;}
  speak();}
function start(){
  placeDock();document.body.appendChild(root);document.documentElement.classList.add("has-axbot");
  var imgs=[].slice.call(document.querySelectorAll(".axbot .ax-fig img,.ax-dock .ax-fig img")),n=imgs.length;
  /* portrait chargé ou introuvable : dans les deux cas Tyna se présente (sans portrait, la voix et la bulle restent) */
  imgs.forEach(function(im){im.onload=im.onerror=function(){im.onload=im.onerror=null;if(--n===0)setTimeout(present,500);};im.src=IMG;});
  if(!n)setTimeout(present,500);
}
/* retour par « Précédent » ou « Suivant » : le navigateur restaure la page telle quelle sans relancer ce script (pagehide a coupé la voix) ;
   Tyna se présente de nouveau, comme à chaque ouverture */
window.addEventListener("pageshow",function(e){if(!e.persisted||!root.parentNode)return;if(playing)finish();unlisten();present();});
function idle(){("requestIdleCallback" in window)?requestIdleCallback(start,{timeout:1200}):setTimeout(start,200);}
if(document.readyState==="complete")idle();else window.addEventListener("load",idle);
})();
