const configured = () =>
  window.SUPABASE_URL &&
  window.SUPABASE_ANON_KEY &&
  !window.SUPABASE_URL.includes("PASTE_") &&
  !window.SUPABASE_ANON_KEY.includes("PASTE_");

const client = configured()
  ? window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY)
  : null;

const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

async function getSession(){ if(!client) return null; const {data}=await client.auth.getSession(); return data.session; }
async function getProfile(){
  const session=await getSession(); if(!session) return null;
  const {data,error}=await client.from("profiles").select("id,email,role,display_name").eq("id",session.user.id).single();
  if(error) return null; return data;
}
function show(id){document.querySelectorAll("[data-page]").forEach(x=>x.classList.add("hidden")); $(id)?.classList.remove("hidden");}
async function logout(){if(client) await client.auth.signOut(); location.href="index.html";}

async function loadNotes(filter=""){
  const box=$("#notesList"); if(!box) return;
  if(!client){box.innerHTML='<div class="notice">The notes database is not connected yet. Follow the setup guide in README.md to connect Supabase.</div>';return;}
  let q=client.from("notes").select("*").order("created_at",{ascending:false});
  if(filter) q=q.or(`title.ilike.%${filter}%,subject.ilike.%${filter}%,chapter.ilike.%${filter}%`);
  const {data,error}=await q;
  if(error){box.innerHTML=`<div class="notice error">${esc(error.message)}</div>`;return;}
  if(!data.length){box.innerHTML='<div class="notice">No notes found.</div>';return;}
  box.innerHTML=data.map(n=>`
    <article class="note">
      <div><div class="muted">${esc(n.subject)} • ${esc(n.chapter||"General")}</div><h3>${esc(n.title)}</h3><p>${esc(n.description||"")} ${n.important?'⭐ Important':''}</p></div>
      <div class="note-actions">${n.file_url?`<a class="btn primary" target="_blank" href="${esc(n.file_url)}">Open note</a>`:""}</div>
    </article>`).join("");
}

async function login(e){
  e.preventDefault(); const msg=$("#msg"); msg.className="notice"; msg.textContent="Signing in…";
  if(!client){msg.className="notice error";msg.textContent="Connect Supabase first. See README.md.";return;}
  const email=$("#email").value.trim(), password=$("#password").value;
  const {error}=await client.auth.signInWithPassword({email,password});
  if(error){msg.className="notice error";msg.textContent=error.message;return;}
  location.href="dashboard.html";
}
async function signup(e){
  e.preventDefault(); const msg=$("#msg"); msg.className="notice"; msg.textContent="Creating account…";
  if(!client){msg.className="notice error";msg.textContent="Connect Supabase first. See README.md.";return;}
  const email=$("#email").value.trim(), password=$("#password").value;
  const {error}=await client.auth.signUp({email,password});
  if(error){msg.className="notice error";msg.textContent=error.message;return;}
  msg.className="notice success";msg.textContent="Account created. If email confirmation is enabled, check your email before signing in.";
}
async function protectDashboard(){
  const session=await getSession(); if(!session){location.href="login.html";return null;}
  const profile=await getProfile();
  if(!profile || profile.role!=="editor"){document.body.innerHTML='<div class="container"><div class="notice error"><strong>Access denied.</strong> Your account is not authorised to edit notes.</div><a class="btn dark" href="index.html">Back to site</a></div>';return null;}
  $("#editorEmail").textContent=profile.email||session.user.email;
  return profile;
}
async function uploadNote(e){
  e.preventDefault(); const msg=$("#uploadMsg"); msg.className="notice"; msg.textContent="Uploading…";
  if(!client){msg.className="notice error";msg.textContent="Connect Supabase first.";return;}
  const profile=await getProfile(); if(!profile||profile.role!=="editor"){msg.className="notice error";msg.textContent="You are not authorised.";return;}
  const file=$("#file").files[0]; if(!file){msg.className="notice error";msg.textContent="Please choose a PDF or document.";return;}
  if(file.size>15*1024*1024){msg.className="notice error";msg.textContent="Please keep files below 15 MB.";return;}
  const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,"_");
  const path=`${crypto.randomUUID()}-${safe}`;
  const {error:upErr}=await client.storage.from("notes").upload(path,file,{upsert:false});
  if(upErr){msg.className="notice error";msg.textContent=upErr.message;return;}
  const {data:urlData}=client.storage.from("notes").getPublicUrl(path);
  const {error:dbErr}=await client.from("notes").insert({
    title:$("#title").value.trim(),subject:$("#subject").value,chapter:$("#chapter").value.trim(),
    description:$("#description").value.trim(),important:$("#important").checked,
    file_url:urlData.publicUrl,file_path:path,created_by:profile.id
  });
  if(dbErr){await client.storage.from("notes").remove([path]);msg.className="notice error";msg.textContent=dbErr.message;return;}
  msg.className="notice success";msg.textContent="Note uploaded successfully!";
  e.target.reset(); await loadAdminNotes();
}
async function loadAdminNotes(){
  const box=$("#adminNotes"); if(!box||!client)return;
  const {data,error}=await client.from("notes").select("*").order("created_at",{ascending:false});
  if(error){box.innerHTML=`<div class="notice error">${esc(error.message)}</div>`;return;}
  box.innerHTML=data.map(n=>`<tr><td>${esc(n.title)}</td><td>${esc(n.subject)}</td><td>${esc(n.chapter||"")}</td><td>${new Date(n.created_at).toLocaleDateString()}</td><td><button class="btn danger" onclick="deleteNote('${n.id}','${esc(n.file_path||"")}')">Delete</button></td></tr>`).join("");
}
async function deleteNote(id,path){
  if(!confirm("Delete this note?")) return;
  const {error}=await client.from("notes").delete().eq("id",id);
  if(error){alert(error.message);return;}
  if(path) await client.storage.from("notes").remove([path]);
  await loadAdminNotes();
}

document.addEventListener("DOMContentLoaded",async()=>{
  $("#loginForm")?.addEventListener("submit",login);
  $("#signupForm")?.addEventListener("submit",signup);
  $("#uploadForm")?.addEventListener("submit",uploadNote);
  $("#search")?.addEventListener("input",e=>loadNotes(e.target.value.trim()));
  $("#logout")?.addEventListener("click",logout);
  if($("#notesList")) loadNotes();
  if($("#dashboard")) { const p=await protectDashboard(); if(p) loadAdminNotes(); }
});
