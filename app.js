(function(){
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



    function showTab(id) {
      document.querySelectorAll('.tab-section').forEach(div => div.classList.remove('tab-active'));
      document.getElementById(id).classList.add('tab-active');
      document.querySelectorAll('.nav-link').forEach(btn => btn.classList.remove('active'));
      event.target.classList.add('active');
    }

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

    function simpanTabel(id) {
      const rows = document.querySelectorAll(`#${id} tbody tr`);
      const data = [];
      rows.forEach(row => {
        const cells = [...row.querySelectorAll("td:not(:last-child)")].map(td => td.innerText.trim());
        if (cells.some(c => c !== "")) data.push(cells);
      });
      localStorage.setItem(id, JSON.stringify(data));
      alert("Tabel disimpan!");
    }

    function loadTabel(id, cols) {
      const tbody = document.querySelector(`#${id} tbody`);
      tbody.innerHTML = "";
      const data = JSON.parse(localStorage.getItem(id)) || [];
      data.forEach(d => tambahBaris(id, cols, d));
      tambahBarisKosong(id, cols);
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
      row.setAttribute("oninput", `cekBarisAkhir(this, '${id}', ${cols})`);
    }

    function tambahBarisKosong(id, cols) {
      tambahBaris(id, cols, Array(cols).fill(""));
    }

    function cekBarisAkhir(row, tableId, cols) {
      const tbody = document.querySelector(`#${tableId} tbody`);
      const last = tbody.lastElementChild;
      if (row === last) tambahBarisKosong(tableId, cols);
    }

    function hapusBaris(el) {
      const row = el.closest("tr");
      row.remove();
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
      rows.forEach(row => {
        const matkul = row.querySelector(".matkul").innerText.trim();
        const deskripsi = row.querySelector(".deskripsi").innerText.trim();
        const deadline = row.querySelector(".deadline").innerText.trim();
        const status = row.querySelector(".status input").checked;
        if (matkul || deskripsi || deadline) {
          data.push({ matkul, deskripsi, deadline, status });
        }
      });
      localStorage.setItem("tugasList", JSON.stringify(data));
      alert("Tugas disimpan!");
    }

    function loadTabelTugas() {
      const data = JSON.parse(localStorage.getItem("tugasList")) || [];
      const tbody = document.querySelector("#tabel-tugas tbody");
      tbody.innerHTML = "";
      data.forEach(d => tambahBarisTugas(d));
      tambahBarisTugas();
    }

    function tambahBarisTugas(data = {}) {
      const tbody = document.querySelector("#tabel-tugas tbody");
      const row = tbody.insertRow();

      const td1 = row.insertCell();
      td1.classList.add("matkul");
      td1.contentEditable = true;
      td1.innerText = data.matkul || "";

      const td2 = row.insertCell();
      td2.classList.add("deskripsi");
      td2.contentEditable = true;
      td2.innerText = data.deskripsi || "";

      const td3 = row.insertCell();
      td3.classList.add("deadline");
      td3.contentEditable = true;
      td3.innerText = data.deadline || "";

      const td4 = row.insertCell();
      td4.classList.add("status");
      td4.innerHTML = `<input type="checkbox" ${data.status ? "checked" : ""}>`;

      const td5 = row.insertCell();
      td5.innerHTML = `<span class="hapus-btn" onclick="hapusBaris(this)">❌</span>`;

      row.setAttribute("oninput", `cekBarisAkhir(this, 'tabel-tugas', 4)`);
    }

    
  function simpanEventKalender(events) {
    localStorage.setItem("eventsKalender", JSON.stringify(events));
  }

  function loadEventKalender() {
    return JSON.parse(localStorage.getItem("eventsKalender")) || [];
  }

  function initKalender() {
    const calendarEl = document.getElementById('calendar');
    const calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      editable: true,
      selectable: true,
      eventClick: function(info) {
        if (confirm(`Hapus kegiatan: "${info.event.title}"?`)) {
          info.event.remove();
          const allEvents = calendar.getEvents().map(e => ({
            title: e.title,
            start: e.startStr,
            color: e.backgroundColor
          }));
          simpanEventKalender(allEvents);
        }
      },
      events: loadEventKalender(),
      dateClick: function(info) {
        const title = prompt('Masukkan nama kegiatan:', 'Kuliah');
        if (!title) return;

        const category = prompt('Kategori? (kuliah, ujian, tugas, lainnya):', 'kuliah');
        let color = '#3788d8'; // default

        switch (category.toLowerCase()) {
          case 'kuliah': color = '#28a745'; break; // hijau
          case 'ujian': color = '#dc3545'; break; // merah
          case 'tugas': color = '#ffc107'; break; // kuning
          case 'lainnya': color = '#6c757d'; break; // abu
        }

        const event = { title, start: info.dateStr, color };
        calendar.addEvent(event);

        const allEvents = calendar.getEvents().map(e => ({
          title: e.title,
          start: e.startStr,
          color: e.backgroundColor
        }));
        simpanEventKalender(allEvents);
      },
      eventDrop: function() {
        const allEvents = calendar.getEvents().map(e => ({
          title: e.title,
          start: e.startStr,
          color: e.backgroundColor
        }));
        simpanEventKalender(allEvents);
      },
      eventRemove: function() {
        const allEvents = calendar.getEvents().map(e => ({
          title: e.title,
          start: e.startStr,
          color: e.backgroundColor
        }));
        simpanEventKalender(allEvents);
      }
    });
    calendar.render();
  }


    
  function checkLogin() {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    if (isLoggedIn === "true") {
      document.getElementById("loginPage").style.display = "none";
      document.querySelector(".container").style.display = "block";
    } else {
      document.getElementById("loginPage").style.display = "block";
      document.querySelector(".container").style.display = "none";
    }
  }

  function doLogin() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    if ((username === "Krisna" && password === "Gahansa123@") || (username === "Saleh" && password === "Saleh123")) {
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem('currentUser', username);
      location.reload();
    } else {
      alert("Username atau password salah!");
    }
  }

  function logout() {
    localStorage.removeItem("isLoggedIn");
    location.reload();
  }


    window.onload = () => {
    checkLogin();
    initKalender();
      loadText("dashboardInput");
      loadProfil();
      loadFotoProfil();
      loadTabel("tabel-matkul", 4);
      loadTabel("tabel-jadwal", 4);
      loadTabel("tabel-nilai", 3);
      loadTabelTugas();
      tampilCatatan();
    };
  

function showLogin(){document.getElementById("loginPage").style.display='block';document.getElementById("mainApp").style.display='none';}
function showApp(){document.getElementById("loginPage").style.display='none';document.getElementById("mainApp").style.display='block';}
window.addEventListener('load',function(){if(localStorage.getItem('isLoggedIn')==='true'){showApp();}else{showLogin();}});
function handleLogin(){// TODO: validasi form login di sini
localStorage.setItem('isLoggedIn','true');showApp();}
function handleLogout(){localStorage.removeItem('isLoggedIn');showLogin();}


  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js');
    });
  }