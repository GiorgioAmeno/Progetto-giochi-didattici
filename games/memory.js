(()=>{
const API=window.APP_CONFIG?.API_BASE?.replace(/\/$/,"");
const token=sessionStorage.getItem("studentGameToken");
const board=document.querySelector("#board");
const timer=document.querySelector("#timer");
const pairs=document.querySelector("#pairs");
const msg=document.querySelector("#game-message");
const qd=document.querySelector("#question-dialog");
const rd=document.querySelector("#result-dialog");

if(!token){location.replace("../index.html");return;}

/*
 * CONTENUTI MODIFICABILI DALL'INSEGNANTE
 * Ogni operatore ha una definizione e tre domande V/F.
 * Per modificare le domande, cambia il testo e la risposta (true/false).
 */
const operatori = [
  {
    simbolo:"||", definizione:"OR logico: almeno una condizione è vera",
    domande:[
      {testo:"Con || il risultato è vero se almeno una delle due condizioni è vera.", risposta:true},
      {testo:"Con || entrambe le condizioni devono essere vere per ottenere true.", risposta:false},
      {testo:"|| è l'operatore OR logico.", risposta:true}
    ]
  },
  {
    simbolo:"&&", definizione:"AND logico: entrambe le condizioni sono vere",
    domande:[
      {testo:"Con && il risultato è vero soltanto se entrambe le condizioni sono vere.", risposta:true},
      {testo:"Con && basta che una sola condizione sia vera.", risposta:false},
      {testo:"&& è l'operatore AND logico.", risposta:true}
    ]
  },
  {
    simbolo:"!", definizione:"NOT logico: inverte il valore booleano",
    domande:[
      {testo:"!true produce false.", risposta:true},
      {testo:"! è l'operatore OR logico.", risposta:false},
      {testo:"!false produce true.", risposta:true}
    ]
  },
  {
    simbolo:"=", definizione:"assegnamento: assegna un valore a una variabile",
    domande:[
      {testo:"In C++, x = 5 assegna il valore 5 alla variabile x.", risposta:true},
      {testo:"= verifica se due valori sono uguali.", risposta:false},
      {testo:"L'operatore = è usato per assegnare un valore.", risposta:true}
    ]
  },
  {
    simbolo:"==", definizione:"uguaglianza: confronta due valori",
    domande:[
      {testo:"== confronta due valori per verificare se sono uguali.", risposta:true},
      {testo:"== assegna il valore a una variabile.", risposta:false},
      {testo:"L'espressione 4 == 4 restituisce true.", risposta:true}
    ]
  },
  {
    simbolo:"!=", definizione:"diverso: verifica se due valori non sono uguali",
    domande:[
      {testo:"!= restituisce true quando i due valori confrontati sono diversi.", risposta:true},
      {testo:"!= significa maggiore o uguale.", risposta:false},
      {testo:"L'espressione 3 != 3 restituisce false.", risposta:true}
    ]
  },
  {
    simbolo:"<", definizione:"minore",
    domande:[
      {testo:"5 < 8 restituisce true.", risposta:true},
      {testo:"< significa maggiore.", risposta:false},
      {testo:"2 < 1 restituisce true.", risposta:false}
    ]
  },
  {
    simbolo:">", definizione:"maggiore",
    domande:[
      {testo:"9 > 4 restituisce true.", risposta:true},
      {testo:"> significa minore o uguale.", risposta:false},
      {testo:"3 > 7 restituisce true.", risposta:false}
    ]
  },
  {
    simbolo:"<=", definizione:"minore o uguale",
    domande:[
      {testo:"4 <= 4 restituisce true.", risposta:true},
      {testo:"<= significa strettamente minore.", risposta:false},
      {testo:"6 <= 3 restituisce true.", risposta:false}
    ]
  },
  {
    simbolo:">=", definizione:"maggiore o uguale",
    domande:[
      {testo:"7 >= 7 restituisce true.", risposta:true},
      {testo:">= significa strettamente maggiore.", risposta:false},
      {testo:"2 >= 5 restituisce true.", risposta:false}
    ]
  },
  {
    simbolo:"+=", definizione:"somma e assegna il risultato",
    domande:[
      {testo:"x += 2 equivale a x = x + 2.", risposta:true},
      {testo:"+= sottrae 2 dalla variabile.", risposta:false},
      {testo:"+= è un operatore di assegnamento composto.", risposta:true}
    ]
  },
  {
    simbolo:"-=", definizione:"sottrae e assegna il risultato",
    domande:[
      {testo:"x -= 3 equivale a x = x - 3.", risposta:true},
      {testo:"-= incrementa la variabile di uno.", risposta:false},
      {testo:"-= è un operatore di assegnamento composto.", risposta:true}
    ]
  },
  {
    simbolo:"/", definizione:"divisione",
    domande:[
      {testo:"L'operatore / esegue una divisione.", risposta:true},
      {testo:"/ calcola il resto della divisione intera.", risposta:false},
      {testo:"12 / 3 vale 4.", risposta:true}
    ]
  },
  {
    simbolo:"%", definizione:"resto della divisione intera",
    domande:[
      {testo:"17 % 5 restituisce 2.", risposta:true},
      {testo:"% esegue una divisione e restituisce il quoziente.", risposta:false},
      {testo:"10 % 2 restituisce 0.", risposta:true}
    ]
  },
  {
    simbolo:"++", definizione:"incrementa di uno",
    domande:[
      {testo:"++ aumenta di uno il valore di una variabile.", risposta:true},
      {testo:"++ decrementa di uno il valore di una variabile.", risposta:false},
      {testo:"Se x vale 4, dopo x++ vale 5.", risposta:true}
    ]
  },
  {
    simbolo:"--", definizione:"decrementa di uno",
    domande:[
      {testo:"-- diminuisce di uno il valore di una variabile.", risposta:true},
      {testo:"-- incrementa di uno il valore di una variabile.", risposta:false},
      {testo:"Se x vale 4, dopo x-- vale 3.", risposta:true}
    ]
  }
];

const fissi=["=","==","%"];
const casuali=operatori.filter(o=>!fissi.includes(o.simbolo));
const shuffle=a=>{
  a=[...a];
  for(let i=a.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
};

let first=null,second=null,locked=false,matched=new Set();
let start=Date.now(),interval=null,question=null;
const secs=()=>Math.floor((Date.now()-start)/1000);
const fmt=n=>String(Math.floor(n/60)).padStart(2,"0")+":"+String(n%60).padStart(2,"0");

function createCard(item,side){
  const b=document.createElement("button");
  b.type="button";
  b.className="memory-card";
  b.dataset.pair=item.simbolo;
  b.dataset.side=side;
  b.setAttribute("aria-label","Carta coperta");
  b.textContent="?";
  b.addEventListener("click",()=>flip(b));
  return b;
}

function draw(){
  board.innerHTML="";
  const chosen=[
    ...fissi.map(s=>operatori.find(o=>o.simbolo===s)),
    ...shuffle(casuali).slice(0,5)
  ];
  const cards=[];
  chosen.forEach(item=>{
    cards.push({item,side:"symbol"});
    cards.push({item,side:"definition"});
  });
  shuffle(cards).forEach(c=>board.appendChild(createCard(c.item,c.side)));
  pairs.textContent=matched.size+" / 8";
}

function showCard(b){
  const item=operatori.find(o=>o.simbolo===b.dataset.pair);
  b.classList.add("revealed");
  b.replaceChildren();
  const main=document.createElement("span");
  main.className="card-main";
  main.textContent=b.dataset.side==="symbol"?item.simbolo:item.definizione;
  b.appendChild(main);
  b.setAttribute("aria-label",main.textContent);
}

function hideCard(b){
  b.classList.remove("revealed");
  b.textContent="?";
  b.setAttribute("aria-label","Carta coperta");
}

function restartBoardAfterWrongAnswer(){
  // Si rimescolano le carte e si azzerano le coppie, ma start NON cambia:
  // il timer continua a conteggiare anche il tempo già trascorso.
  first=null;second=null;locked=false;matched.clear();
  msg.textContent="Risposta errata: ricomincia da capo. Il tempo continua!";
  draw();
}

function flip(b){
  if(locked||b.classList.contains("revealed")||b.classList.contains("matched"))return;
  showCard(b);
  if(!first){first=b;return;}
  second=b;
  locked=true;
  const samePair=first.dataset.pair===second.dataset.pair;
  const differentSides=first.dataset.side!==second.dataset.side;

  if(samePair&&differentSides){
    first.classList.add("matched");
    second.classList.add("matched");
    matched.add(first.dataset.pair);
    pairs.textContent=matched.size+" / 8";
    first=second=null;
    locked=false;
    askForOperator(matched.size===8);
  }else{
    setTimeout(()=>{
      hideCard(first);hideCard(second);
      first=second=null;locked=false;
    },750);
  }
}

function askForOperator(isLastPair){
  const item=operatori.find(o=>o.simbolo===Array.from(matched).at(-1));
  question=shuffle(item.domande)[0];
  document.querySelector("#question-text").textContent=
    "Operatore "+item.simbolo+" – "+item.definizione+".\n\n"+question.testo;
  qd.dataset.lastPair=isLastPair?"true":"false";
  qd.showModal();
}

document.querySelectorAll("[data-answer]").forEach(b=>{
  b.addEventListener("click",()=>{
    const val=b.dataset.answer==="true";
    qd.close();
    if(val!==question.risposta){
      restartBoardAfterWrongAnswer();
      return;
    }
    msg.textContent="Risposta corretta!";
    if(qd.dataset.lastPair==="true")finish();
  });
});

async function finish(){
  clearInterval(interval);
  const duration=secs();
  document.querySelector("#final-time").textContent="Tempo impiegato: "+fmt(duration);
  rd.showModal();
  try{
    const r=await fetch(API+"/api/games/complete",{
      method:"POST",
      headers:{"Content-Type":"application/json","Authorization":"Bearer "+token},
      body:JSON.stringify({durationSeconds:duration})
    });
    const d=await r.json();
    if(!r.ok)throw Error(d.error||"Salvataggio non riuscito");
    document.querySelector("#save-status").textContent="Risultato registrato correttamente.";
  }catch(e){
    document.querySelector("#save-status").textContent="Attenzione: salvataggio non riuscito. Avvisa l'insegnante.";
  }
}

document.querySelector("#play-again").addEventListener("click",()=>{
  rd.close();
  matched.clear();first=second=null;locked=false;
  start=Date.now();
  timer.textContent="00:00";
  msg.textContent="";
  draw();
  interval=setInterval(()=>timer.textContent=fmt(secs()),500);
});

(async()=>{
  try{
    const r=await fetch(API+"/api/me",{headers:{Authorization:"Bearer "+token}});
    const d=await r.json();
    if(!r.ok)throw Error();
    document.querySelector("#welcome").textContent="Ciao "+d.student+"! Abbina ogni simbolo alla sua definizione.";
    draw();
    interval=setInterval(()=>timer.textContent=fmt(secs()),500);
  }catch{
    sessionStorage.removeItem("studentGameToken");
    location.replace("../index.html");
  }
})();
})();
