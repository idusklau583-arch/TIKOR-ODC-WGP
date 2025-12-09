let map, myLocation = null;
let dataODC = [];
let markers = [];
let routingControl = null;

// ======== LOGIN =========
function doLogin() {
    const u = loginUser.value.trim();
    const p = loginPass.value.trim();
    const r = loginRole.value;

    if (
        (r === "admin" && u === "admin" && p === "12345") ||
        (r === "teknisi" && u === "teknisi" && p === "11111")
    ) {
        loginScreen.style.display = "none";
        loadData();
        initMap();
        render();
    } else {
        alert("Login salah!");
    }
}

function logout() {
    if (confirm("Yakin mau logout?")) {
        location.reload();
    }
}

// ======== MAP =========
function initMap() {
    map = L.map("map").setView([-9.666, 120.265], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);
}

function locateMe() {
    if (!navigator.geolocation) return alert("Browser tidak support GPS!");
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            myLocation = [pos.coords.latitude, pos.coords.longitude];
            map.setView(myLocation, 16);

            // Hapus marker lama "Lokasi Saya" jika ada
            markers.forEach((m) => {
                if (m.options.title === "Lokasi Saya") map.removeLayer(m);
            });

            const m = L.marker(myLocation, { title: "Lokasi Saya" })
                .addTo(map)
                .bindPopup("Lokasi Saya")
                .openPopup();

            markers.push(m);
        },
        () => alert("Gagal mendapatkan lokasi")
    );
}

function fillWithMyLocation() {
    if (!myLocation) {
        alert("Aktifkan GPS dulu!");
        return;
    }
    lat.value = myLocation[0];
    lng.value = myLocation[1];
}

// ======== SIMPAN ODC =========
function simpan() {
    if (!nama.value || !kode.value || !lokasi.value || !lat.value || !lng.value) {
        alert("Mohon isi semua data!");
        return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
        dataODC.push({
            nama: nama.value,
            kode: kode.value,
            lokasi: lokasi.value,
            lat: parseFloat(lat.value),
            lng: parseFloat(lng.value),
            foto: e.target.result || "",
        });

        saveData();
        render();

        alert("ODC disimpan!");

        clearForm();
        showMenu("tableMenu");
    };

    if (foto.files[0]) reader.readAsDataURL(foto.files[0]);
    else reader.onload({ target: { result: "" } });
}

function clearForm() {
    nama.value = "";
    kode.value = "";
    lokasi.value = "";
    lat.value = "";
    lng.value = "";
    foto.value = "";
}

// ======== RENDER =========
function render() {
    dataTable.innerHTML = "";
    markers.forEach((m) => map.removeLayer(m));
    markers = [];

    dataODC.forEach((d, i) => {
                const tr = document.createElement("tr");

                tr.innerHTML = `
      <td>${d.nama}</td>
      <td>${d.kode}</td>
      <td>${d.lokasi}</td>
      <td>${d.lat.toFixed(6)}</td>
      <td>${d.lng.toFixed(6)}</td>
      <td>${d.foto ? `<img src="${d.foto}" width="50" />` : "-"}</td>
      <td>
        <button class="btn-xs" onclick="routeTo(${i})">🗺 Rute</button>
        <button class="btn-gmaps" onclick="openGoogleMaps(${i})">🚗 Maps</button>
        <button class="btn-xs" onclick="editData(${i})">✏️ Edit</button>
        <button class="btn-xs" onclick="deleteData(${i})">❌ Hapus</button>
      </td>
    `;

    dataTable.appendChild(tr);

    if (d.lat && d.lng) {
      const m = L.marker([d.lat, d.lng])
        .addTo(map)
        .bindPopup(`
          <b>${d.nama}</b><br/>
          ${d.kode}<br/>
          <button class="btn-xs" onclick="routeTo(${i})">🗺 Rute App</button>
          <button class="btn-gmaps" onclick="openGoogleMaps(${i})">🚗 Maps</button>
        `);
      markers.push(m);
    }
  });
}

// ======== ROUTING =========
function routeTo(i) {
  if (!myLocation) return alert("Aktifkan GPS!");
  if (routingControl) map.removeControl(routingControl);

  routingControl = L.Routing.control({
    waypoints: [
      L.latLng(myLocation[0], myLocation[1]),
      L.latLng(dataODC[i].lat, dataODC[i].lng),
    ],
    router: L.Routing.osrmv1({
      serviceUrl: "https://router.project-osrm.org/route/v1",
    }),
    addWaypoints: false,
  }).addTo(map);
}

function clearRoute() {
  if (routingControl) map.removeControl(routingControl);
}

// ======== GOOGLE MAPS =========
function openGoogleMaps(i) {
  if (!myLocation) return alert("Aktifkan GPS!");
  const mode = navMode.value;
  const d = dataODC[i];

  const url = `https://www.google.com/maps/dir/?api=1&origin=${myLocation[0]},${myLocation[1]}&destination=${d.lat},${d.lng}&travelmode=${mode}`;
  window.open(url, "_blank");
}

// ======== SEARCH =========
function doSearch() {
  const q = qSearch.value.toLowerCase();
  if (!q) {
    loadData();
    render();
    return;
  }
  dataODC = dataODC.filter((d) => d.nama.toLowerCase().includes(q));
  render();
}

// ======== MENU =========
function showMenu(id) {
  mapMenu.classList.add("hidden");
  tableMenu.classList.add("hidden");
  formMenu.classList.add("hidden");
  document.getElementById(id).classList.remove("hidden");
}

// ======== DARK MODE =========
function toggleDark() {
  document.documentElement.classList.toggle("dark");
}

// ======== LOCALSTORAGE =========
function saveData() {
  localStorage.setItem("tikorDataODC", JSON.stringify(dataODC));
}

function loadData() {
  const json = localStorage.getItem("tikorDataODC");
  if (json) {
    dataODC = JSON.parse(json);
  } else {
    dataODC = [];
  }
}

// ======== EDIT & DELETE =========
function editData(i) {
  const d = dataODC[i];
  nama.value = d.nama;
  kode.value = d.kode;
  lokasi.value = d.lokasi;
  lat.value = d.lat;
  lng.value = d.lng;
  foto.value = "";

  showMenu("formMenu");

  // Hapus data lama, nanti disimpan ulang jika simpan ditekan
  dataODC.splice(i, 1);
  saveData();
  render();
}

function deleteData(i) {
  if (confirm("Yakin ingin hapus data ini?")) {
    dataODC.splice(i, 1);
    saveData();
    render();
  }
}

// ======== CLEAR ROUTE BUTTON =========
function clearRoute() {
  if (routingControl) {
    map.removeControl(routingControl);
    routingControl = null;
  }
}

// ======== SERVICE WORKER =========
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("sw.js")
    .then(() => console.log("Service Worker terdaftar"))
    .catch((err) => console.log("Gagal daftar Service Worker", err));
}