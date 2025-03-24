// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBpuBEVumunNdexlfEeH4yeZSqqUNbbhZE",
  authDomain: "mehanfresh-f5daa.firebaseapp.com",
  projectId: "mehanfresh-f5daa",
  storageBucket: "mehanfresh-f5daa.firebasestorage.app",
  messagingSenderId: "677869309187",
  appId: "1:677869309187:web:3d993090a12ef857c1ed36",
  measurementId: "G-W1ZV2BJD2X"
};

firebase.initializeApp(firebaseConfig);
const firestore = firebase.firestore();

// IndexedDB Setup
let db;
const request = indexedDB.open("MineralWaterDB", 1);

request.onerror = (event) => {
  console.error("IndexedDB error:", event);
};

request.onupgradeneeded = (event) => {
  db = event.target.result;
  // Object stores for customers, bottles, bills
  if (!db.objectStoreNames.contains("customers")) {
    db.createObjectStore("customers", { keyPath: "qr" });
  }
  if (!db.objectStoreNames.contains("bottles")) {
    db.createObjectStore("bottles", { keyPath: "qr" });
  }
  if (!db.objectStoreNames.contains("bills")) {
    db.createObjectStore("bills", { autoIncrement: true });
  }
};

request.onsuccess = (event) => {
  db = event.target.result;
  console.log("IndexedDB initialized");
  // Simulate initial data if necessary
  simulateInitialData();
  loadDashboardData();
  loadCustomerList();
};
import * as qrcodegen from "./qrcodegen.js"; // Adjust path as needed

// Create a QR Code
const qr = qrcodegen.QrCode.encodeText("Hello, World!", qrcodegen.QrCode.Ecc.MEDIUM);

// Render to HTML canvas
const size = qr.size;
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.width = size;
canvas.height = size;

for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
        ctx.fillStyle = qr.getModule(x, y) ? "black" : "white";
        ctx.fillRect(x, y, 1, 1);
    }
}

// Simulate initial data: 5 customers and 10 bottles
function simulateInitialData(){
  const transaction = db.transaction(["customers", "bottles"], "readwrite");
  const customersStore = transaction.objectStore("customers");
  const bottlesStore = transaction.objectStore("bottles");

  // Insert sample customers if not already present
  ["AAAA", "AAAB", "AAAC", "AAAD", "AAAE"].forEach(qr => {
    customersStore.get(qr).onsuccess = (e) => {
      if(!e.target.result){
        customersStore.add({
          qr: qr,
          name: "Customer " + qr,
          phone: "0000000000",
          category: "Shop",
          area: "Area 1",
          notes: ""
        });
      }
    };
  });
  // Insert sample bottles (0001–0010) with status "In Stock"
  for(let i=1;i<=10;i++){
    let bottleQR = ("000" + i).slice(-4);
    bottlesStore.get(bottleQR).onsuccess = (e) => {
      if (!e.target.result) {
        bottlesStore.add({
          qr: bottleQR,
          status: "In Stock",
          customerQR: null,
          timestamp: Date.now()
        });
      }
    };
  }
}

// ---------- QR Scanning and Camera API ----------
const scanCustomerBtn = document.getElementById("scan-customer-btn");
const scanBottleBtn = document.getElementById("scan-bottle-btn");
const scanResult = document.getElementById("scan-result");
const cameraSection = document.getElementById("camera-section");
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const closeCameraBtn = document.getElementById("close-camera-btn");

let cameraStream = null;

// For simplicity a dummy scan function (replace with real QR code library integration)
function startScan(callback){
  cameraSection.hidden = false;
  navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
    .then(stream => {
      cameraStream = stream;
      video.srcObject = stream;
      // Simulate scanning: after 3 seconds, take a snapshot and return dummy qr:
      setTimeout(() => {
        callback("DUMMYQR");
        stopScan();
      }, 3000);
    })
    .catch(err => {
      console.error("Camera error:", err);
    });
}

function stopScan(){
  if(cameraStream){
    cameraStream.getTracks().forEach(track => track.stop());
  }
  cameraSection.hidden = true;
}

closeCameraBtn.addEventListener("click", stopScan);

// Event listeners for scan buttons
scanCustomerBtn.addEventListener("click", () => {
  startScan((scannedQR) => {
    console.log("Customer QR scanned:", scannedQR);
    // Check in IndexedDB: if not found in local DB then show new customer form
    const transaction = db.transaction(["customers"], "readonly");
    const store = transaction.objectStore("customers");
    store.get(scannedQR).onsuccess = (evt) => {
      const customer = evt.target.result;
      if (customer) {
        scanResult.textContent = "Customer found: " + customer.name;
      } else {
        scanResult.textContent = "Customer not found. Please add details.";
        document.getElementById("new-customer-form").hidden = false;
        // Pre-fill QR field (if needed) or store in a variable for later use.
        newCustomerQR = scannedQR;
      }
    };
  });
});

scanBottleBtn.addEventListener("click", () => {
  startScan((scannedQR) => {
    console.log("Bottle QR scanned:", scannedQR);
    // Bottle Workflow: determine if bottle is being collected or delivered.
    // Here we simply toggle between statuses for demonstration.
    const transaction = db.transaction(["bottles"], "readwrite");
    const store = transaction.objectStore("bottles");
    store.get(scannedQR).onsuccess = (evt) => {
      let bottle = evt.target.result;
      if (bottle) {
        if(bottle.status === "In Stock"){
          // simulate delivery: assign to current customer if exists (dummy logic)
          bottle.status = "Delivered";
        } else if(bottle.status === "Delivered"){
          // simulate collection return
          bottle.status = "Collected";
        } else {
          bottle.status = "In Stock";
        }
        bottle.timestamp = Date.now();
        store.put(bottle);
        scanResult.textContent = "Bottle " + scannedQR + " updated to " + bottle.status;
      } else {
        scanResult.textContent = "Bottle not found in records.";
      }
    };
  });
});

// ---------- Customer Form ----------
let newCustomerQR = "";
const customerForm = document.getElementById("customer-form");
customerForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const customerData = {
    qr: newCustomerQR || ("CUST" + Date.now()),
    name: document.getElementById("c-name").value,
    phone: document.getElementById("c-phone").value,
    category: document.getElementById("c-category").value,
    area: document.getElementById("c-area").value,
    notes: document.getElementById("c-notes").value
  };
  const transaction = db.transaction(["customers"], "readwrite");
  const store = transaction.objectStore("customers");
  store.add(customerData).onsuccess = () => {
    scanResult.textContent = "New Customer saved: " + customerData.name;
    document.getElementById("new-customer-form").hidden = true;
    newCustomerQR = "";
    // Optionally sync to Firebase
    firestore.collection("customers").doc(customerData.qr).set(customerData);
    loadCustomerList();
  };
});

// ---------- Bill Generation ----------
function generateBill(customerQR, bottleCount, oldBalance=0) {
  // Retrieve bottle price from dashboard settings (localStorage used as a simple store)
  let price = localStorage.getItem("bottlePrice") || 50;
  const total = bottleCount * price;
  const bill = {
    customerQR,
    bottles: bottleCount,
    total,
    paymentStatus: "Pending",
    oldBalance,
    timestamp: Date.now()
  };
  // Save to IndexedDB
  const transaction = db.transaction(["bills"], "readwrite");
  const store = transaction.objectStore("bills");
  store.add(bill).onsuccess = () => {
    document.getElementById("bill-details").textContent = 
      `Bill for ${bottleCount} bottles: ₹${total} (Old Balance: ₹${oldBalance})`;
    // Optionally sync the bill to Firestore if online
    if(navigator.onLine) {
      firestore.collection("bills").add(bill);
    }
  };
}

// For demonstration, a dummy call to generate a bill (in a real app this is triggered by workflow)
window.generateDummyBill = () => {
  generateBill("AAAA", 2, 100);
};

// ---------- Search Customers ----------
document.getElementById("search-btn").addEventListener("click", () => {
  const query = document.getElementById("search-query").value.toLowerCase();
  const transaction = db.transaction(["customers"], "readonly");
  const store = transaction.objectStore("customers");
  const results = [];
  store.openCursor().onsuccess = (e) => {
    let cursor = e.target.result;
    if (cursor) {
      if(cursor.value.name.toLowerCase().includes(query) || cursor.value.qr.toLowerCase().includes(query)){
        results.push(cursor.value);
      }
      cursor.continue();
    } else {
      displaySearchResults(results);
    }
  };
});

function displaySearchResults(customers){
  const container = document.getElementById("search-results");
  container.innerHTML = "";
  if(customers.length === 0) {
    container.textContent = "No results found.";
    return;
  }
  customers.forEach(cust => {
    let div = document.createElement("div");
    div.textContent = `${cust.qr} - ${cust.name} (${cust.category})`;
    container.appendChild(div);
  });
}

// ---------- Sync to Firebase ----------
document.getElementById("sync-btn").addEventListener("click", () => {
  // Here you’d iterate through unsynced IndexedDB data and push to Firestore
  // For example:
  const transaction = db.transaction(["customers", "bills", "bottles"]);
  // Sync customers
  transaction.objectStore("customers").openCursor().onsuccess = e => {
    let cursor = e.target.result;
    if(cursor){
      firestore.collection("customers").doc(cursor.value.qr).set(cursor.value);
      cursor.continue();
    }
  };
  // Sync bills
  transaction.objectStore("bills").openCursor().onsuccess = e => {
    let cursor = e.target.result;
    if(cursor){
      firestore.collection("bills").add(cursor.value);
      cursor.continue();
    }
  };
  // Sync bottles
  transaction.objectStore("bottles").openCursor().onsuccess = e => {
    let cursor = e.target.result;
    if(cursor){
      firestore.collection("bottles").doc(cursor.value.qr).set(cursor.value);
      cursor.continue();
    }
  };
  alert("Data sync in progress!");
});

// ---------- Office Dashboard Functions ----------
document.getElementById("save-price-btn").addEventListener("click", () => {
  const price = document.getElementById("bottle-price").value;
  if(price > 0){
    localStorage.setItem("bottlePrice", price);
    firestore.collection("appSettings").doc("pricing").set({ bottlePrice: price });
    alert("Price saved!");
  }
});

function loadDashboardData(){
  // Load and display stats (query IndexedDB or Firebase for current bottle status)
  const transaction = db.transaction(["bottles"], "readonly");
  const store = transaction.objectStore("bottles");
  let inStock = 0, pending = 0;
  store.openCursor().onsuccess = e => {
    let cursor = e.target.result;
    if(cursor){
      if(cursor.value.status === "In Stock"){
        inStock++;
      } else if(cursor.value.status === "Delivered"){
        pending++;
      }
      cursor.continue();
    } else {
      document.getElementById("stock").textContent = "Stock: " + inStock;
      document.getElementById("pending").textContent = "Pending Deliveries: " + pending;
      // For delivery stats, you might aggregate data by timestamp from Firestore.
    }
  };
}

function loadCustomerList(){
  const list = document.getElementById("customer-list");
  list.innerHTML = "";
  const transaction = db.transaction(["customers"], "readonly");
  const store = transaction.objectStore("customers");
  store.openCursor().onsuccess = e => {
    let cursor = e.target.result;
    if(cursor){
      let li = document.createElement("li");
      li.textContent = `${cursor.value.qr} - ${cursor.value.name} [${cursor.value.category}]`;
      // Delete button with confirmation
      let delBtn = document.createElement("button");
      delBtn.textContent = "Delete";
      delBtn.className = "btn red";
      delBtn.onclick = () => {
        if(confirm("Are you sure?")){
          const delTrans = db.transaction(["customers"], "readwrite");
          delTrans.objectStore("customers").delete(cursor.value.qr);
          li.remove();
          // Also remove from Firebase:
          firestore.collection("customers").doc(cursor.value.qr).delete();
        }
      };
      li.appendChild(delBtn);
      list.appendChild(li);
      cursor.continue();
    }
  };
}

// Listen for online events to trigger auto-sync
window.addEventListener("online", () => {
  console.log("Back online, auto-syncing data.");
  document.getElementById("sync-btn").click();
});
