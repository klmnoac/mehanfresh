// At the top of app.js, after Firebase imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';

const firebaseConfig = {
    apiKey: "AIzaSyBpuBEVumunNdexlfEeH4yeZSqqUNbbhZE",
    authDomain: "mehanfresh-f5daa.firebaseapp.com",
    projectId: "mehanfresh-f5daa",
    storageBucket: "mehanfresh-f5daa.firebasestorage.app",
    messagingSenderId: "677869309187",
    appId: "1:677869309187:web:3d993090a12ef857c1ed36",
    measurementId: "G-W1ZV2BJD2X"
  };

const app = initializeApp(firebaseConfig);
const dbFirebase = getFirestore(app);
console.log('Firebase connected:', dbFirebase);

// QR Scanner Setup
const html5QrCode = new Html5Qrcode("qr-reader");

document.getElementById('scanCustomer').addEventListener('click', () => {
    html5QrCode.start(
        { facingMode: "environment" }, // Use rear camera
        { fps: 10, qrbox: 250 },       // Scan settings
        (decodedText) => {
            checkCustomer(decodedText);
            html5QrCode.stop();       // Stop scanning after success
        },
        (error) => {
            console.log('QR Scan Error:', error);
        }
    ).catch(err => {
        console.error('Camera failed to start:', err);
        alert('Couldn’t open camera. Check permissions or try another browser.');
    });
});

document.getElementById('scanBottle').addEventListener('click', () => {
    if (!currentCustomer) return alert('Scan a customer first!');
    html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        (decodedText) => {
            handleBottle(decodedText);
            html5QrCode.stop();
        },
        (error) => {
            console.log('QR Scan Error:', error);
        }
    ).catch(err => {
        console.error('Camera failed to start:', err);
    });
});

// Add a div for the QR reader in index.html if not already present
// Place this inside the mobile-view div, before the buttons:
document.getElementById('mobile-view').insertAdjacentHTML('afterbegin', '<div id="qr-reader" style="width: 100%; max-width: 300px; margin: 10px auto;"></div>');
