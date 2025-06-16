(function(){
  // Storage prefixing for user isolation
  const originalSet = Storage.prototype.setItem;
  const originalGet = Storage.prototype.getItem;
  const originalRemove = Storage.prototype.removeItem;
  const WHITELIST = ['isLoggedIn','currentUser'];
  function withPrefix(key){
    const user = originalGet.call(localStorage,'currentUser');
    if(!user || WHITELIST.includes(key)) return key;
    return user + '_' + key;
  }
  Storage.prototype.setItem = function(key,value){ originalSet.call(this, withPrefix(key), value); };
  Storage.prototype.getItem = function(key){ return originalGet.call(this, withPrefix(key)); };
  Storage.prototype.removeItem = function(key){ originalRemove.call(this, withPrefix(key)); };
})();

function showTab(id, ev) {
  document.querySelectorAll('.tab-section').forEach(div => div.classList.remove('tab-active'));
  document.getElementById(id).classList.add('tab-active');
  document.querySelectorAll('.nav-link').forEach(btn => btn.classList.remove('active'));
  if(ev && ev.target) ev.target.classList.add('active');
  if(id==='forumchat' && typeof scrollChatToBottom === "function") scrollChatToBottom();
}

// ========== PATCH GABUNG JADWAL & KALENDER ==============
function loadJadwalDanKalender() {
  const dataJadwal = JSON.parse(localStorage.getItem("tabel-jadwal")) || [];
  const eventsKalender = JSON.parse(localStorage.getItem("eventsKalender")) || [];
  const hariMap = { 'Senin': 1, 'Selasa': 2, 'Rabu': 3, 'Kamis': 4, 'Jumat': 5, 'Sabtu': 6, 'Minggu': 0 };
  const now = new Date();
  const jadwalEvents = dataJadwal
    .filter(row => row[0] && row[1])
    .map(row => {
      const hari = row[0];
      const jam = row[1];
      const matkul = row[2] || '';
      const kelas = row[3] || '';
      let base = new Date(now);
      base.setDate(now.getDate() - base.getDay() + (hariMap[hari] ?? 1));
      let jamStart = jam.split('-')[0].trim();
      base.setHours(Number(jamStart.split(':')[0]), Number(jamStart.split(':')[1]||'0'), 0, 0);
      return {
        title: `${matkul}${kelas ? ' (' + kelas + ')' : ''}`,
        start: base.toISOString().slice(0,16),
        color: '#28a745',
        extendedProps: { _jadwalRow: row },
        id: 'jadwal-'+hari+'-'+jam+'-'+matkul+'-'+kelas
      }
    });
  const jadwalEventIds = new Set(jadwalEvents.map(ev=>ev.id));
  const nonJadwalEvents = eventsKalender.filter(ev => !ev.id || !ev.id.startsWith('jadwal-'));
  return [...jadwalEvents, ...nonJadwalEvents];
}
function simpanEventKalender(events) {
  const nonJadwalEvents = events.filter(ev => !ev.id || !ev.id.startsWith('jadwal-'));
  localStorage.setItem("eventsKalender", JSON.stringify(nonJadwalEvents));
}
function simpanTabel(id) {
  const rows = document.querySelectorAll(`#${id} tbody tr`);
  const data = [];
  const headerLen = document.querySelectorAll(`#${id} thead th`).length - 1;
  rows.forEach(row => {
    const cells = [...row.querySelectorAll("td")].slice(0, headerLen).map(td => td.innerText.trim());
    if (cells.some(c => c !== "")) data.push(cells);
  });
  localStorage.setItem(id, JSON.stringify(data));
  if (id === 'tabel-jadwal') {
    if (window.calendarObj) {
      window.calendarObj.removeAllEvents();
      loadJadwalDanKalender().forEach(ev => window.calendarObj.addEvent(ev));
    }
  }
  alert("Tabel disimpan!");
}
function tambahBarisManual(id) {
  const cols = document.querySelectorAll(`#${id} thead th`).length - 1;
  tambahBaris(id, cols, Array(cols).fill(""));
  if (id === 'tabel-jadwal' && window.calendarObj) {
    setTimeout(() => {
      window.calendarObj.removeAllEvents();
      loadJadwalDanKalender().forEach(ev => window.calendarObj.addEvent(ev));
    }, 200);
  }
}
function loadTabel(id) {
  const cols = document.querySelectorAll(`#${id} thead th`).length - 1;
  const tbody = document.querySelector(`#${id} tbody`);
  tbody.innerHTML = "";
  const data = JSON.parse(localStorage.getItem(id)) || [];
  data.forEach(d => tambahBaris(id, cols, d));
  if (!barisKosongAda(id, cols)) tambahBarisKosong(id, cols);
}
function initKalenderGabungan() {
  const calendarEl = document.getElementById('calendar');
  if (!calendarEl) return;
  if (window.calendarObj) { window.calendarObj.destroy(); }
  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridWeek',
    editable: true,
    selectable: true,
    eventClick: function(info) {
      if (info.event.id && info.event.id.startsWith('jadwal-')) {
        alert("Edit jadwal hanya bisa melalui tabel Jadwal Kuliah di bawah kalender.");
        return;
      }
      let newTitle = prompt('Edit judul kegiatan:', info.event.title);
      if (newTitle === null) return;
      if (newTitle === '') {
        if (confirm(`Hapus kegiatan: "${info.event.title}"?`)) {
          info.event.remove();
          simpanEventKalender(calendar.getEvents().map(e => ({
            id: e.id, title: e.title, start: e.startStr, color: e.backgroundColor
          })));
        }
        return;
      }
      info.event.setProp('title', newTitle);
      let category = prompt('Kategori? (kuliah, ujian, tugas, lainnya):', 'lainnya');
      let color = '#6c757d';
      switch ((category||'').toLowerCase()) {
        case 'kuliah': color = '#28a745'; break;
        case 'ujian': color = '#dc3545'; break;
        case 'tugas': color = '#ffc107'; break;
        case 'lainnya': color = '#6c757d'; break;
      }
      info.event.setProp('backgroundColor', color);
      simpanEventKalender(calendar.getEvents().map(e => ({
        id: e.id, title: e.title, start: e.startStr, color: e.backgroundColor
      })));
    },
    events: loadJadwalDanKalender(),
    dateClick: function(info) {
      const title = prompt('Masukkan nama kegiatan:', 'Kuliah');
      if (!title) return;
      const category = prompt('Kategori? (kuliah, ujian, tugas, lainnya):', 'lainnya');
      let color = '#6c757d';
      switch ((category||'').toLowerCase()) {
        case 'kuliah': color = '#28a745'; break;
        case 'ujian': color = '#dc3545'; break;
        case 'tugas': color = '#ffc107'; break;
        case 'lainnya': color = '#6c757d'; break;
      }
      const id = 'ev-'+Date.now();
      const event = { id, title, start: info.dateStr, color };
      calendar.addEvent(event);
      simpanEventKalender(calendar.getEvents().map(e => ({
        id: e.id, title: e.title, start: e.startStr, color: e.backgroundColor
      })));
    },
    eventDrop: function() {
      simpanEventKalender(calendar.getEvents().map(e => ({
        id: e.id, title: e.title, start: e.startStr, color: e.backgroundColor
      })));
    },
    eventResize: function() {
      simpanEventKalender(calendar.getEvents().map(e => ({
        id: e.id, title: e.title, start: e.startStr, color: e.backgroundColor
      })));
    }
  });
  calendar.render();
  window.calendarObj = calendar;
}
function loadTabelJadwalDanKalender() {
  loadTabel('tabel-jadwal');
  setTimeout(()=>initKalenderGabungan(),200);
}
document.addEventListener('input', function(e){
  if (e.target.closest('#tabel-jadwal')) {
    setTimeout(()=> {
      if (window.calendarObj) {
        window.calendarObj.removeAllEvents();
        loadJadwalDanKalender().forEach(ev => window.calendarObj.addEvent(ev));
      }
    }, 200);
  }
});
function hapusBaris(el) {
  const row = el.closest("tr");
  const tbody = row.parentNode;
  const id = tbody.parentNode.id;
  row.remove();
  const cols = document.querySelectorAll(`#${id} thead th`).length - 1;
  if (!barisKosongAda(id, cols)) tambahBarisKosong(id, cols);
  if (id === 'tabel-jadwal' && window.calendarObj) {
    setTimeout(() => {
      window.calendarObj.removeAllEvents();
      loadJadwalDanKalender().forEach(ev => window.calendarObj.addEvent(ev));
    }, 200);
  }
}

// ========== PATCH VERIFIKASI & NOTIFIKASI DASHBOARD =============
function tampilkanPendingUsers() {
  const list = document.getElementById("pendingUsersList");
  if (!list) return;
  window.db.ref("pendingUsers").on("value", snap => {
    list.innerHTML = "";
    if (!snap.exists()) {
      list.innerHTML = "<li class='list-group-item'>Belum ada pendaftar baru.</li>";
      tampilkanPendingNotifDashboard([]);
      return;
    }
    const pendings = [];
    snap.forEach(child => {
      const data = child.val();
      pendings.push(data);
      const li = document.createElement("li");
      li.className = "list-group-item d-flex justify-content-between align-items-center";
      li.innerHTML = `<div>
        <b>${data.username}</b> (${data.nama})<br>
        <small>Daftar: ${data.waktu ? new Date(data.waktu).toLocaleString() : '-'}</small>
      </div>
      <div>
        <button class="btn btn-success btn-sm me-2" onclick="approveUser('${child.key}')">Konfirmasi</button>
        <button class="btn btn-danger btn-sm" onclick="tolakUser('${child.key}')">Tolak</button>
      </div>`;
      list.appendChild(li);
    });
    tampilkanPendingNotifDashboard(pendings);
  });
}
function tampilkanPendingNotifDashboard(pendingList) {
  const notifDiv = document.getElementById("pendingNotif");
  const currentUser = (localStorage.getItem('currentUser')||"").toLowerCase();
  if (!notifDiv) return;
  if (currentUser !== "krisna") {
    notifDiv.innerHTML = "";
    return;
  }
  if (!pendingList || pendingList.length === 0) {
    notifDiv.innerHTML = "";
    return;
  }
  notifDiv.innerHTML = pendingList.map(
    d=> `<div class="alert alert-warning p-2 mb-1" style="font-size:0.97em;">
      <b>${d.username}</b> (${d.nama}) ingin meminta persetujuan kamu
    </div>`
  ).join('');
}
// ==============================================================

function simpanText(id) {
  localStorage.setItem(id, document.getElementById(id).value);
  alert("Disimpan!");
}
function loadText(id) {
  const saved = localStorage.getItem(id);
  if (saved) document.getElementById(id).value = saved;
}
function simpanProfil() {
  const rows = document.querySelectorAll("#profilTable tr");
  const data = {};
  rows.forEach(row => {
    const key = row.children[0].innerText;
    const val = row.children[1].innerText;
    data[key] = val;
  });
  localStorage.setItem("profil", JSON.stringify(data));
  alert("Profil disimpan!");
}
function loadProfil() {
  const saved = JSON.parse(localStorage.getItem("profil"));
  if (saved) {
    const rows = document.querySelectorAll("#profilTable tr");
    rows.forEach(row => {
      const key = row.children[0].innerText;
      if (saved[key]) row.children[1].innerText = saved[key];
    });
  }
}
function uploadFoto() {
  const input = document.getElementById("fotoInput");
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    const fotoBase64 = e.target.result;
    document.getElementById("fotoPreview").src = fotoBase64;
    localStorage.setItem("fotoProfil", fotoBase64);
    input.classList.add("d-none");
    document.getElementById("editFotoBtn").classList.remove("d-none");
  };
  reader.readAsDataURL(file);
}
function editFoto() {
  document.getElementById("fotoInput").click();
}
function loadFotoProfil() {
  const savedFoto = localStorage.getItem("fotoProfil");
  if (savedFoto) {
    document.getElementById("fotoPreview").src = savedFoto;
    document.getElementById("fotoInput").classList.add("d-none");
  }
}
function tambahBaris(id, cols, values = []) {
  const tbody = document.querySelector(`#${id} tbody`);
  const row = tbody.insertRow();
  for (let i = 0; i < cols; i++) {
    const td = row.insertCell();
    td.contentEditable = true;
    td.innerText = values[i] || "";
  }
  const hapusTd = row.insertCell();
  hapusTd.innerHTML = '<span class="hapus-btn" onclick="hapusBaris(this)">❌</span>';
  row.addEventListener("input", function() {
    const lastRow = tbody.lastElementChild;
    if (row === lastRow) {
      const tds = Array.from(row.querySelectorAll("td")).slice(0, cols);
      const terisi = tds.some(td => td.innerText.trim() !== "");
      if (terisi && !barisKosongAda(id, cols)) tambahBarisKosong(id, cols);
    }
  });
}
function tambahBarisKosong(id, cols) {
  if (!barisKosongAda(id, cols)) tambahBaris(id, cols, Array(cols).fill(""));
}
function barisKosongAda(id, cols) {
  const tbody = document.querySelector(`#${id} tbody`);
  if (!tbody.lastElementChild) return false;
  const lastRow = tbody.lastElementChild;
  const tds = Array.from(lastRow.querySelectorAll("td")).slice(0, cols);
  return tds.every(td => td.innerText.trim() === "");
}
function simpanCatatan() {
  const text = document.getElementById("catatanInput").value.trim();
  if (!text) return alert("Catatan kosong");
  const saved = JSON.parse(localStorage.getItem("catatanList")) || [];
  saved.push(text);
  localStorage.setItem("catatanList", JSON.stringify(saved));
  tampilCatatan();
  document.getElementById("catatanInput").value = "";
}
function tampilCatatan() {
  const list = JSON.parse(localStorage.getItem("catatanList")) || [];
  const ul = document.getElementById("listCatatan");
  ul.innerHTML = "";
  list.forEach((item, i) => {
    const li = document.createElement("li");
    li.className = "list-group-item d-flex justify-content-between align-items-center";
    li.innerHTML = `<span>${item}</span><span class="hapus-btn" onclick="hapusCatatan(${i})">❌</span>`;
    ul.appendChild(li);
  });
}
function hapusCatatan(index) {
  const list = JSON.parse(localStorage.getItem("catatanList")) || [];
  list.splice(index, 1);
  localStorage.setItem("catatanList", JSON.stringify(list));
  tampilCatatan();
}
function simpanTabelTugas() {
  const rows = document.querySelectorAll(`#tabel-tugas tbody tr`);
  const data = [];
  const headerLen = document.querySelectorAll(`#tabel-tugas thead th`).length - 1;
  rows.forEach(row => {
    const rowData = {};
    let filled = false;
    row.querySelectorAll("td").forEach((td, i) => {
      if (i < headerLen) {
        let th = document.querySelectorAll(`#tabel-tugas thead th`)[i].innerText.trim();
        if (th === "Status") {
          rowData[th] = td.querySelector("input") ? td.querySelector("input").checked : false;
        } else {
          rowData[th] = td.innerText.trim();
        }
        if (rowData[th] !== "" && th !== "Status") filled = true;
      }
    });
    if (filled) data.push(rowData);
  });
  localStorage.setItem("tugasList", JSON.stringify(data));
  alert("Tugas disimpan!");
}
function loadTabelTugas() {
  const data = JSON.parse(localStorage.getItem("tugasList")) || [];
  const tbody = document.querySelector("#tabel-tugas tbody");
  tbody.innerHTML = "";
  data.forEach(d => tambahBarisTugas(d));
  if (!barisKosongTugasAda()) tambahBarisTugas();
}
function tambahBarisTugas(data = {}) {
  const tbody = document.querySelector("#tabel-tugas tbody");
  const row = tbody.insertRow();
  const headers = Array.from(document.querySelectorAll(`#tabel-tugas thead th`))
    .map(th => th.innerText.trim())
    .filter(h => h !== "Aksi");
  headers.forEach(header => {
    const td = row.insertCell();
    if (header === "Status") {
      td.classList.add("status");
      td.innerHTML = `<input type="checkbox" ${data[header] ? "checked" : ""}>`;
      td.querySelector("input").addEventListener("change", function() {
        cekBarisKosongTugas(row, headers.length);
      });
    } else {
      td.contentEditable = true;
      td.innerText = data[header] || "";
      td.addEventListener("input", function() {
        cekBarisKosongTugas(row, headers.length);
      });
    }
  });
  const tdAksi = row.insertCell();
  tdAksi.innerHTML = `<span class="hapus-btn" onclick="hapusBarisTugas(this)">❌</span>`;
}
function barisKosongTugasAda() {
  const tbody = document.querySelector("#tabel-tugas tbody");
  if (!tbody.lastElementChild) return false;
  const lastRow = tbody.lastElementChild;
  const headers = Array.from(document.querySelectorAll(`#tabel-tugas thead th`))
    .map(th => th.innerText.trim())
    .filter(h => h !== "Aksi");
  let kosong = true;
  lastRow.querySelectorAll("td").forEach((td, i) => {
    if (headers[i] === "Status") {
      if (td.querySelector("input") && td.querySelector("input").checked) kosong = false;
    } else if (headers[i] && td.innerText.trim() !== "") kosong = false;
  });
  return kosong;
}
function cekBarisKosongTugas(row, colCount) {
  const tbody = document.querySelector("#tabel-tugas tbody");
  const lastRow = tbody.lastElementChild;
  if (row === lastRow) {
    const headers = Array.from(document.querySelectorAll(`#tabel-tugas thead th`))
      .map(th => th.innerText.trim())
      .filter(h => h !== "Aksi");
    let terisi = false;
    lastRow.querySelectorAll("td").forEach((td, i) => {
      if (headers[i] === "Status") {
        if (td.querySelector("input") && td.querySelector("input").checked) terisi = true;
      } else if (headers[i] && td.innerText.trim() !== "") terisi = true;
    });
    if (terisi && !barisKosongTugasAda()) tambahBarisTugas();
  }
}
function tambahBarisManualTugas() {
  tambahBarisTugas();
}
function hapusBarisTugas(el) {
  const row = el.closest("tr");
  const tbody = row.parentNode;
  row.remove();
  if (!barisKosongTugasAda()) tambahBarisTugas();
}
function kirimPesanChat() {
  const pesan = document.getElementById("chatInput").value.trim();
  if (!pesan) return;
  const user = localStorage.getItem('currentUser') || "Anonim";
  window.db.ref("chat").push({
    user: user,
    pesan: pesan,
    waktu: new Date().toISOString()
  });
  document.getElementById("chatInput").value = "";
}
function tampilkanChatOnline() {
  const chatBox = document.getElementById("chatBox");
  if (!chatBox) return;
  window.db.ref("chat").limitToLast(50).on("value", function(snapshot) {
    chatBox.innerHTML = "";
    snapshot.forEach(function(child) {
      const data = child.val();
      chatBox.innerHTML += `
        <div class="mb-2">
          <b>${data.user}</b> <small class="text-muted">${new Date(data.waktu).toLocaleString()}</small><br/>
          <span>${data.pesan}</span>
        </div>`;
    });
    scrollChatToBottom();
  });
}
function scrollChatToBottom() {
  const chatBox = document.getElementById("chatBox");
  if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
}
function showRegisterModal() {
  document.getElementById("regUsername").value = "";
  document.getElementById("regPassword").value = "";
  document.getElementById("regNama").value = "";
  document.getElementById("registerModal").style.display = "flex";
}
function hideRegisterModal() {
  document.getElementById("registerModal").style.display = "none";
}
function registerAccount() {
  const username = document.getElementById("regUsername").value.trim();
  const password = document.getElementById("regPassword").value.trim();
  const nama = document.getElementById("regNama").value.trim();
  if (!username || !password || !nama) {
    alert("Semua data wajib diisi!");
    return;
  }
  window.db.ref("pendingUsers").orderByChild("username").equalTo(username).once("value", snap => {
    if (snap.exists()) {
      alert("Username sudah dalam proses pendaftaran!");
    } else {
      window.db.ref("users").orderByChild("username").equalTo(username).once("value", snap2 => {
        if (snap2.exists() || username.toLowerCase() === "krisna") {
          alert("Username sudah terdaftar!");
        } else {
          window.db.ref("pendingUsers").push({
            username, password, nama, waktu: new Date().toISOString()
          }, function(err) {
            if (err) {
              alert("Gagal mendaftar! Cek koneksi atau rules Firebase.");
            } else {
              alert("Pendaftaran berhasil! Tunggu konfirmasi admin.");
              hideRegisterModal();
              document.getElementById("regUsername").value = "";
              document.getElementById("regPassword").value = "";
              document.getElementById("regNama").value = "";
              if (typeof afterRegisterFix === "function") afterRegisterFix(username, nama);
            }
          });
        }
      });
    }
  });
}
function afterRegisterFix(username, nama) {
  if ((localStorage.getItem('currentUser')||"").toLowerCase() === "krisna" && document.getElementById("verifakun")) {
    tampilkanPendingUsers();
  }
  console.log("Perbaikan: pendingUser baru atas nama " + nama + " telah didaftarkan.");
}
function approveUser(key) {
  window.db.ref("pendingUsers/"+key).once("value", snap => {
    const data = snap.val();
    if (!data) return;
    window.db.ref("users").push({
      username: data.username,
      password: data.password,
      nama: data.nama,
      waktu: data.waktu
    }, () => {
      window.db.ref("pendingUsers/"+key).remove();
      alert("User berhasil dikonfirmasi!");
    });
  });
}
function tolakUser(key) {
  if (confirm("Tolak pendaftaran ini?")) {
    window.db.ref("pendingUsers/"+key).remove();
  }
}
window.onload = () => {
  checkLogin();
  loadTabel('tabel-matkul');
  loadTabelJadwalDanKalender();
  loadTabel('tabel-nilai');
  loadTabelTugas();
  tampilCatatan();
  tampilkanChatOnline();
  loadText("dashboardInput");
  loadProfil();
  loadFotoProfil();
  // Tab verifikasi khusus admin
  if ((localStorage.getItem('currentUser')||"").toLowerCase() === "krisna") {
    document.getElementById("verifTabBtn").style.display = "inline-block";
    document.getElementById("verifakun").style.display = "block";
    tampilkanPendingUsers();
  } else {
    document.getElementById("verifTabBtn").style.display = "none";
    document.getElementById("verifakun").style.display = "none";
    tampilkanPendingNotifDashboard([]);
  }
};
function showLogin(){document.getElementById("loginPage").style.display='block';document.getElementById("mainApp").style.display='none';}
function showApp(){document.getElementById("loginPage").style.display='none';document.getElementById("mainApp").style.display='block';}
window.addEventListener('load',function(){if(localStorage.getItem('isLoggedIn')==='true'){showApp();}else{showLogin();}});
function handleLogin(){localStorage.setItem('isLoggedIn','true');showApp();}
function handleLogout(){localStorage.removeItem('isLoggedIn');showLogin();}
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js');
  });
}
