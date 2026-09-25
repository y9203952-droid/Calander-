import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const state = {
  user:null, space:null, memories:new Map(),
  month:new Date(new Date().getFullYear(),new Date().getMonth(),1),
  selected:null, dark:false, searchTimer:null
};

const demoPhotos = ["📷","🌅","🌸","🌃"];

function toast(msg){
  const t=$("#toast"); t.textContent=msg; t.classList.add("show");
  clearTimeout(toast.t); toast.t=setTimeout(()=>t.classList.remove("show"),2600);
}
function fmt(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function dateText(key){return new Date(key+"T00:00:00").toLocaleDateString(undefined,{weekday:"long",year:"numeric",month:"long",day:"numeric"})}
function setVisible(id,yes){$(id)?.classList.toggle("hidden",!yes)}
function appVisible(){setVisible("#authScreen",false);setVisible("#spaceScreen",false);setVisible("#app",true)}
function nowGreeting(){
  const h=new Date().getHours();
  return h<12?"Good morning, Akarsh & Ritu ♡":h<18?"Good afternoon, Akarsh & Ritu ♡":"Good evening, Akarsh & Ritu ♡";
}
function tick(){
  const n=new Date();
  $("#liveDate").textContent=n.toLocaleDateString(undefined,{weekday:"long",day:"numeric",month:"long",year:"numeric"});
  $("#liveTime").textContent=n.toLocaleTimeString(undefined,{hour:"2-digit",minute:"2-digit",second:"2-digit"});
  $("#greeting").textContent=nowGreeting();
}
setInterval(tick,1000);tick();

async function boot(){
  if(SUPABASE_URL.includes("YOUR-PROJECT") || SUPABASE_ANON_KEY.includes("YOUR_SUPABASE")){
    toast("Add your Supabase URL and key in config.js first.");
    return;
  }
  const {data}=await supabase.auth.getUser();
  state.user=data.user;
  if(!state.user){setVisible("#authScreen",true);return}
  await loadSpace();
}
async function loadSpace(){
  const {data,error}=await supabase.from("memory_space_members")
    .select("space_id,memory_spaces(id,name,created_by)")
    .eq("user_id",state.user.id);
  if(error){toast(error.message);return}
  const spaces=(data||[]).map(x=>x.memory_spaces).filter(Boolean);
  if(!spaces.length){setVisible("#authScreen",false);setVisible("#app",false);setVisible("#spaceScreen",true);return}
  state.space=spaces[0];
  appVisible();
  $("#settingsSpaceName").textContent=state.space.name;
  $("#spaceId").textContent=state.space.id;
  await loadMemories(); renderAll(); loadMemberCount();
}
async function loadMemberCount(){
  const {data}=await supabase.from("memory_space_members").select("user_id").eq("space_id",state.space.id);
  $("#memberCount").textContent=`${data?.length||0} / 2`;
}
async function loadMemories(){
  const {data,error}=await supabase.from("memories")
    .select("id,space_id,memory_date,thought,mood,favorite,created_by,memory_photos(id,storage_path,sort_order)")
    .eq("space_id",state.space.id).order("memory_date",{ascending:true});
  if(error){toast(error.message);return}
  state.memories.clear();
  for(const m of data||[]){
    m.memory_photos=(m.memory_photos||[]).sort((a,b)=>a.sort_order-b.sort_order);
    state.memories.set(m.memory_date,m);
  }
}
function renderAll(){renderCalendar();renderRecent();renderStats();renderRollback();renderOnThisDay();renderMood();renderSearch("");}
function renderCalendar(){
  const grid=$("#calendarGrid"), y=state.month.getFullYear(), m=state.month.getMonth();
  $("#monthTitle").textContent=state.month.toLocaleDateString(undefined,{month:"long",year:"numeric"});
  grid.innerHTML="";
  const first=new Date(y,m,1), start=(first.getDay()+6)%7, days=new Date(y,m+1,0).getDate(), today=fmt(new Date());
  for(let i=0;i<start;i++) grid.appendChild(document.createElement("div"));
  for(let d=1;d<=days;d++){
    const key=fmt(new Date(y,m,d)), mem=state.memories.get(key), b=document.createElement("button");
    b.className="day"+(key===today?" today":"")+(mem?" has-memory":"");
    b.innerHTML=`<span>${d}</span>${mem?`<b>${esc(mem.mood||"♡")}</b><i>${mem.favorite?"♥":"•"}</i>`:""}`;
    b.onclick=()=>openEditor(key);grid.appendChild(b);
  }
}
function esc(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function renderRecent(){
  const arr=[...state.memories.values()].sort((a,b)=>b.memory_date.localeCompare(a.memory_date)).slice(0,5);
  $("#recentList").innerHTML=arr.length?arr.map((m,i)=>`
    <div class="recent-item" data-date="${m.memory_date}">
      <div class="recent-thumb" style="background-position:${i%2?"right":"center"}"></div>
      <div><strong>${dateText(m.memory_date)}</strong><p>${esc(m.thought||"A beautiful day with you...")}</p><small>${esc(m.mood||"😊")} &nbsp; ${m.favorite?"♥ Favorite":"Shared memory"}</small></div>
      <span class="dots">•••</span>
    </div>`).join(""):`<div class="empty">No memories yet. Add your first one ♡</div>`;
  $$(".recent-item").forEach(x=>x.onclick=()=>openEditor(x.dataset.date));
}
function renderStats(){
  const a=[...state.memories.values()];
  $("#statMemories").textContent=a.length;
  $("#statPhotos").textContent=a.reduce((n,m)=>n+(m.memory_photos?.length||0),0);
  $("#statThoughts").textContent=a.filter(m=>m.thought?.trim()).length;
  $("#statFavorites").textContent=a.filter(m=>m.favorite).length;
}
function renderRollback(){
  const n=new Date(), candidates=[
    new Date(n.getFullYear()-1,n.getMonth(),n.getDate()),
    new Date(n.getFullYear(),n.getMonth()-1,n.getDate())
  ];
  const found=candidates.map(fmt).map(k=>state.memories.get(k)).filter(Boolean)[0];
  const count=found?[found]:[];
  $("#rollbackMeta").textContent=found?`${count.length} memory · ${found.memory_photos?.length||0} photos · ${found.thought?"1 thought":"0 thoughts"}`:"No memory from this date yet — your story starts today.";
  $("#rollbackOpen").onclick=()=>found?openEditor(found.memory_date):openEditor(fmt(n));
}
function renderOnThisDay(){
  const n=new Date(), years=[1,2,3,4], holder=$("#onThisDay");
  holder.innerHTML=years.map((age,i)=>{
    const y=n.getFullYear()-age, key=fmt(new Date(y,n.getMonth(),n.getDate())), m=state.memories.get(key);
    return `<button class="otd-item" data-date="${m?.memory_date||""}">
      <div class="otd-img" style="filter:hue-rotate(${i*14}deg)"></div>
      <div class="otd-copy"><b>${y}</b><small>${m?"A memory from "+age+" year"+(age>1?"s":"")+" ago":"A blank page waiting for a memory"}</small></div>
    </button>`;
  }).join("");
  $$(".otd-item").forEach(x=>{if(x.dataset.date)x.onclick=()=>openEditor(x.dataset.date)});
}
function renderMood(){
  const today=state.memories.get(fmt(new Date()));
  $$("#moodPicker button").forEach(b=>b.classList.toggle("active",b.dataset.mood===today?.mood));
}
function renderSearch(q){
  const box=$("#searchResults"); if(!q){box.innerHTML="";return}
  const arr=[...state.memories.values()].filter(m=>
    `${m.memory_date} ${m.thought} ${m.mood}`.toLowerCase().includes(q.toLowerCase())).slice(0,20);
  box.innerHTML=arr.length?arr.map(m=>`<div class="result" data-date="${m.memory_date}"><b>${dateText(m.memory_date)}</b><div>${esc(m.mood)} ${esc(m.thought||"No thought")}</div></div>`).join(""):`<div class="empty">No matching memories.</div>`;
  $$(".result").forEach(x=>x.onclick=()=>openEditor(x.dataset.date));
}

async function openEditor(key){
  state.selected=key;
  const m=state.memories.get(key);
  $("#editorTitle").textContent=m?"Edit Memory":"Add Memory";
  $("#editorDate").textContent=dateText(key);
  $("#thought").value=m?.thought||"";
  $("#mood").value=m?.mood||"😊";
  $("#favorite").checked=!!m?.favorite;
  $("#photoList").innerHTML=(m?.memory_photos||[]).map(p=>`<div class="photo-row"><span>📷 ${esc(p.storage_path.split("/").pop())}</span><button class="btn danger" data-remove="${p.id}">Remove</button></div>`).join("");
  $("#editor").classList.add("open");
  $$("#photoList [data-remove]").forEach(b=>b.onclick=()=>removePhoto(b.dataset.remove));
}
function closeEditor(){$("#editor").classList.remove("open");state.selected=null}
async function saveMemory(){
  const payload={space_id:state.space.id,memory_date:state.selected,thought:$("#thought").value.trim(),mood:$("#mood").value,favorite:$("#favorite").checked,created_by:state.user.id};
  const old=state.memories.get(state.selected);
  let r=old
    ? await supabase.from("memories").update(payload).eq("id",old.id).select().single()
    : await supabase.from("memories").insert(payload).select().single();
  if(r.error){toast(r.error.message);return}
  toast("Saved for both of you ♡"); await loadMemories();renderAll();closeEditor();
}
async function uploadPhotos(files){
  let m=state.memories.get(state.selected);
  if(!m){toast("Save the memory before adding photos.");return}
  for(const f of files){
    if(!f.type.startsWith("image/"))continue;
    if(f.size>10*1024*1024){toast(`${f.name} is over 10 MB.`);continue}
    const ext=(f.name.split(".").pop()||"jpg").replace(/[^a-z0-9]/gi,"").toLowerCase();
    const path=`${state.space.id}/${m.id}/${crypto.randomUUID()}.${ext}`;
    const up=await supabase.storage.from("memory-photos").upload(path,f,{contentType:f.type});
    if(up.error){toast(up.error.message);continue}
    const ins=await supabase.from("memory_photos").insert({memory_id:m.id,space_id:state.space.id,storage_path:path,sort_order:m.memory_photos?.length||0,created_by:state.user.id});
    if(ins.error){await supabase.storage.from("memory-photos").remove([path]);toast(ins.error.message)}
  }
  await loadMemories();renderAll();openEditor(state.selected);
}
async function removePhoto(id){
  const m=state.memories.get(state.selected), p=m?.memory_photos?.find(x=>x.id===id);if(!p)return;
  await supabase.storage.from("memory-photos").remove([p.storage_path]);
  const r=await supabase.from("memory_photos").delete().eq("id",id);
  if(r.error){toast(r.error.message);return}
  await loadMemories();renderAll();openEditor(state.selected);
}
async function deleteMemory(){
  const m=state.memories.get(state.selected);if(!m)return;
  if(!confirm("Delete this shared memory for both of you?"))return;
  for(const p of m.memory_photos||[])await supabase.storage.from("memory-photos").remove([p.storage_path]);
  const r=await supabase.from("memories").delete().eq("id",m.id);
  if(r.error){toast(r.error.message);return}
  toast("Memory deleted.");await loadMemories();renderAll();closeEditor();
}
async function createSpace(){
  const {data,error}=await supabase.rpc("create_memory_space",{space_name:$("#spaceNameInput").value.trim()||"Akarsh & Ritu"});
  if(error){toast(error.message);return}
  await loadSpace();await createInvite();
}
async function createInvite(){
  const {data,error}=await supabase.rpc("create_memory_invite",{target_space:state.space.id});
  if(error){toast(error.message);return}
  $("#inviteBox").classList.remove("hidden");$("#inviteCode").value=data[0].invite_code;
  $("#inviteExpiry").textContent="Expires "+new Date(data[0].expires_at).toLocaleString();
}
async function joinSpace(){
  const code=$("#joinCode").value.trim();
  if(!code){toast("Paste the invite code.");return}
  const {error}=await supabase.rpc("redeem_memory_invite",{invite_code:code});
  if(error){toast(error.message);return}
  await loadSpace();toast("You are now sharing the same little world ♡");
}
function scrollToId(id){document.getElementById(id)?.scrollIntoView({behavior:"smooth",block:"start"})}

$("#signIn").onclick=async()=>{
  const {error}=await supabase.auth.signInWithPassword({email:$("#email").value.trim(),password:$("#password").value});
  if(error)toast(error.message);
};
$("#signUp").onclick=async()=>{
  const {error}=await supabase.auth.signUp({email:$("#email").value.trim(),password:$("#password").value});
  if(error)toast(error.message);else toast("Account created. Check your email if confirmation is enabled.");
};
$("#signOut").onclick=()=>supabase.auth.signOut();
$("#createSpace").onclick=createSpace;
$("#joinSpace").onclick=joinSpace;
$("#newInvite").onclick=createInvite;
$("#copyInvite").onclick=async()=>{await navigator.clipboard.writeText($("#inviteCode").value);toast("Invite code copied.");};
$("#addToday").onclick=()=>openEditor(fmt(new Date()));
$("#viewCalendar").onclick=()=>scrollToId("calendar");
$("#viewRollback").onclick=()=>scrollToId("rollback");
$("#focusSearch").onclick=()=>{$("#search").classList.remove("hidden-section");scrollToId("search");$("#searchInput").focus()};
$("#allMemories").onclick=()=>scrollToId("memories");
$("#allRecent").onclick=()=>scrollToId("memories");
$("#prevMonth").onclick=()=>{state.month=new Date(state.month.getFullYear(),state.month.getMonth()-1,1);renderCalendar()};
$("#nextMonth").onclick=()=>{state.month=new Date(state.month.getFullYear(),state.month.getMonth()+1,1);renderCalendar()};
$("#closeEditor").onclick=closeEditor;
$("#saveMemory").onclick=saveMemory;
$("#deleteMemory").onclick=deleteMemory;
$("#photoInput").onchange=e=>uploadPhotos([...e.target.files]);
$("#searchInput").oninput=e=>{clearTimeout(state.searchTimer);state.searchTimer=setTimeout(()=>renderSearch(e.target.value.trim()),120)};
$("#darkToggle").onclick=()=>{state.dark=!state.dark;document.documentElement.classList.toggle("dark",state.dark)};
$$("#moodPicker button").forEach(b=>b.onclick=()=>openEditor(fmt(new Date())).then(()=>{$("#mood").value=b.dataset.mood}));

$$(".nav-item").forEach(b=>b.onclick=()=>{
  $$(".nav-item").forEach(x=>x.classList.remove("active"));b.classList.add("active");
  const t=b.dataset.target;
  if(t==="home")window.scrollTo({top:0,behavior:"smooth"});
  else scrollToId(t);
});

supabase.auth.onAuthStateChange(()=>boot());
boot();
