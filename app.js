let map, myLocation = null;
let dataODC = [];
let markers = [];
let routingControl = null;

// ======= Load Data dari LocalStorage =======
function loadData() {
    const saved = localStorage.getItem("dataODC");
    if (saved) {
        dataODC = JSON.parse(saved);
    } else {
        dataODC = [];
    }
}

// ======= Simpan Data ke LocalStorage =======
function saveData() {
    localStorage.setItem("dataODC", JSON.stringify(dataODC));
}

// ======= Login =======
function doLogin() {
    const u = loginUser.value.trim();
    const p = loginPass.value.trim();
    const r = loginRole.value;

    if (
        (r === "admin" && u === "admin" && p === "12345") ||
        (r === "teknisi" && u === "teknisi" && p === "11111")
    ) {
        loginScreen.style.display = "none";
        initMap();
        loadData();
        render();
    } else {
        alert("Login salah!");
    }
}

function logout() {
    location.reload();
}

// ======= Inisialisasi Peta =======
function initMap() {
    map = L.map("map").setView([-9.666, 120.265], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);
}

// ======= Lokasi Saya =======
function locateMe() {
    if (!navigator.geolocation) {
        alert("Geolocation tidak didukung oleh browser ini.");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (pos) => {
            myLocation = [pos.coords.latitude, pos.coords.longitude];
            map.setView(myLocation, 16);

            // Hapus marker lama lokasi saya
            if (markers.myLocMarker) map.removeLayer(markers.myLocMarker);

            // Tambah marker lokasi saya
            markers.myLocMarker = L.marker(myLocation)
                .addTo(map)
                .bindPopup("Lokasi Saya")
                .openPopup();
        },
        () => {
            alert("Gagal mendapatkan lokasi. Pastikan GPS aktif dan izinkan akses lokasi.");
        }
    );
}

// ======= Isi form koordinat dengan lokasi saya =======
function fillWithMyLocation() {
    if (!myLocation) {
        alert("Aktifkan GPS dulu!");
        return;
    }
    lat.value = myLocation[0];
    lng.value = myLocation[1];
}

// ======= Simpan data ODC =======
function simpan() {
    const n = nama.value.trim();
    const k = kode.value.trim();
    const l = lokasi.value.trim();
    const la = parseFloat(lat.value);
    const ln = parseFloat(lng.value);

    if (!n || !k || !l || isNaN(la) || isNaN(ln)) {
        alert("Isi semua field dengan benar!");
        return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
        dataODC.push({
            nama: n,
            kode: k,
            lokasi: l,
            lat: la,
            lng: ln,
            foto: e.target.result || "",
        });

        saveData();
        render();
        alert("ODC berhasil disimpan!");

        // Reset form
        nama.value = "";
        kode.value = "";
        lokasi.value = "";
        lat.value = "";
        lng.value = "";
        foto.value = "";

        showMenu("tableMenu");
    };

    if (foto.files[0]) {
        reader.readAsDataURL(foto.files[0]);
    } else {
        // Jika tidak upload foto, tetap simpan dengan foto kosong
        reader.onload({ target: { result: "" } });
    }
}

// ======= Render Daftar dan Marker =======
function render() {
    dataTable.innerHTML = "";

    // Hapus semua marker kecuali lokasi saya
    markers.forEach((m) => {
        if (m !== markers.myLocMarker) map.removeLayer(m);
    });
    markers = markers.myLocMarker ? [markers.myLocMarker] : [];

    dataODC.forEach((d, i) => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
      <td>${d.nama}</td>
      <td>${d.kode}</td>
      <td>${d.lokasi}</td>
      <td>${d.lat.toFixed(6)}</td>
      <td>${d.lng.toFixed(6)}</td>
      <td>${d.foto ? `<img src="${d.foto}" width="50" class="rounded" />` : ""}</td>
      <td>
        <button onclick="routeTo(${i})" class="btn btn-sm">Rute</button>
        <button onclick="openGoogleMaps(${i})" class="btn btn-sm btn-gmaps">Maps</button>
        <button onclick="editODC(${i})" class="btn btn-sm bg-yellow-500">Edit</button>
        <button onclick="deleteODC(${i})" class="btn btn-sm bg-red-600">Hapus</button>
      </td>
    `;
    dataTable.appendChild(tr);

    if (d.lat && d.lng) {
      const m = L.marker([d.lat, d.lng])
        .addTo(map)
        .bindPopup(`
          <b>${d.nama}</b><br />
          ${d.kode}<br />
          <button class="btn btn-xs" onclick="routeTo(${i})">🗺 Rute App</button>
          <button class="btn btn-xs btn-gmaps" onclick="openGoogleMaps(${i})">🚗 Maps</button>
        `);
      markers.push(m);
    }
  });
}

// ======= Routing =======
function routeTo(i) {
  if (!myLocation) {
    alert("Aktifkan GPS!");
    return;
  }
  if (routingControl) {
    map.removeControl(routingControl);
  }

  const destLat = Number(dataODC[i].lat);
  const destLng = Number(dataODC[i].lng);

  if (isNaN(destLat) || isNaN(destLng)) {
    alert("Koordinat tujuan tidak valid!");
    return;
  }

  routingControl = L.Routing.control({
    waypoints: [L.latLng(myLocation[0], myLocation[1]), L.latLng(destLat, destLng)],
    router: L.Routing.osrmv1({
      serviceUrl: "https://router.project-osrm.org/route/v1",
    }),
    lineOptions: {
      styles: [{ color: "blue", opacity: 0.6, weight: 5 }],
    },
    addWaypoints: false,
    routeWhileDragging: false,
    showAlternatives: false,
  }).addTo(map);
}

function clearRoute() {
  if (routingControl) {
    map.removeControl(routingControl);
    routingControl = null;
  }
}

// ======= Open Google Maps =======
function openGoogleMaps(i) {
  if (!myLocation) {
    alert("Aktifkan GPS!");
    return;
  }

  const mode = navMode.value;
  const d = dataODC[i];

  const url = `https://www.google.com/maps/dir/?api=1&origin=${myLocation[0]},${myLocation[1]}&destination=${d.lat},${d.lng}&travelmode=${mode}`;
  window.open(url, "_blank");
}

// ======= Search =======
function doSearch() {
  const q = qSearch.value.toLowerCase();

  // Load from saved data for search so original dataODC tetap utuh
  loadData();

  dataODC = dataODC.filter((d) => d.nama.toLowerCase().includes(q) || d.lokasi.toLowerCase().includes(q) || d.kode.toLowerCase().includes(q));
  render();
}

// ======= Show Menu =======
function showMenu(id) {
  mapMenu.classList.add("hidden");
  tableMenu.classList.add("hidden");
  formMenu.classList.add("hidden");
  document.getElementById(id).classList.remove("hidden");
}

// ======= Dark Mode Toggle =======
function toggleDark() {
  document.documentElement.classList.toggle("dark");
}

// ======= Export to Excel =======
function exportExcel() {
  const ws = XLSX.utils.json_to_sheet(dataODC);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "ODC");
  XLSX.writeFile(wb, "data_odc.xlsx");
}

// ======= Edit ODC =======
function editODC(i) {
  const d = dataODC[i];
  showMenu("formMenu");

  nama.value = d.nama;
  kode.value = d.kode;
  lokasi.value = d.lokasi;
  lat.value = d.lat;
  lng.value = d.lng;

  // Foto tidak diisi ulang karena tidak bisa file input value set
  foto.value = "";

  // Ubah tombol simpan jadi update
  const btn = document.querySelector("#formMenu button.bg-green-600");
  btn.textContent = "Update";
  btn.onclick = () => updateODC(i);
}

// ======= Update ODC =======
function updateODC(i) {
  const n = nama.value.trim();
  const k = kode.value.trim();
  const l = lokasi.value.trim();
  const la = parseFloat(lat.value);
  const ln = parseFloat(lng.value);

  if (!n || !k || !l || isNaN(la) || isNaN(ln)) {
    alert("Isi semua field dengan benar!");
    return;
  }

  const reader = new FileReader();

  reader.onload = (e) => {
    dataODC[i] = {
      nama: n,
      kode: k,
      lokasi: l,
      lat: la,
      lng: ln,
      foto: e.target.result || dataODC[i].foto || "",
    };

    saveData();
    render();
    alert("Data ODC berhasil diperbarui!");

    // Reset form dan tombol simpan
    resetForm();
    showMenu("tableMenu");
  };

  if (foto.files[0]) {
    reader.readAsDataURL(foto.files[0]);
  } else {
    // Tidak update foto
    reader.onload({ target: { result: dataODC[i].foto || "" } });
  }
}

function resetForm() {
  nama.value = "";
  kode.value = "";
  lokasi.value = "";
  lat.value = "";
  lng.value = "";
  foto.value = "";

  const btn = document.querySelector("#formMenu button.bg-green-600");
  btn.textContent = "Simpan";
  btn.onclick = simpan;
}

// ======= Delete ODC =======
function deleteODC(i) {
  if (confirm("Yakin ingin menghapus data ini?")) {
    dataODC.splice(i, 1);
    saveData();
    render();
  }
}

// ======= Auto-load data and init =======
window.onload = () => {
  loadData();
  render();

  // Jika loginScreen masih muncul, fokus ke username
  if (!loginScreen.style.display || loginScreen.style.display !== "none") {
    loginUser.focus();
  }
};