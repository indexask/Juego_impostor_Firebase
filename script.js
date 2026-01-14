// ==========================================
// 1. IMPORTACIONES WEB (¡IMPORTANTE! USA ESTAS URLS)
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, onSnapshot, updateDoc, arrayUnion, arrayRemove } 
from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// ==========================================
// 2. TU CONFIGURACIÓN
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyBeuC8guy21AfzlMRLsR8pAK0-OuPYEh5U",
    authDomain: "impostornew-3b2fe.firebaseapp.com",
    projectId: "impostornew-3b2fe",
    storageBucket: "impostornew-3b2fe.firebasestorage.app",
    messagingSenderId: "670664873626",
    appId: "1:670664873626:web:339cc8a0458f77507f7123"
  };

// Inicializar
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ==========================================
// 3. DATOS (Categorías)
// ==========================================
const categorias = {
    UrbanoChile: ["Cris MJ", "Pailita", "Young Cister", "Polimá Westcoast", "Pablo Chill-E", "Marcianeke", "El Jordan 23", "Jere Klein", "Julianno Sosa", "Standly", "King Savagge", "Ak4:20", "FloyyMenor", "DrefQuila", "Princesa Alba"],
    UrbanoMundial: ["Bad Bunny", "Daddy Yankee", "Karol G", "J Balvin", "Anuel AA", "Feid (Ferxxo)", "Rauw Alejandro", "Maluma", "Ozuna", "Arcángel", "Nicky Jam", "Wisin & Yandel", "Don Omar", "Myke Towers", "Bizarrap"],
    Paises: ["Chile", "Argentina", "Perú", "Brasil", "Colombia", "Venezuela", "México", "Estados Unidos", "España", "Francia", "Italia", "Alemania", "Inglaterra", "Rusia", "China", "Japón", "Corea del Sur", "Egipto", "India"],
    Animales: ["Perro", "Gato", "León", "Tigre", "Elefante", "Jirafa", "Mono", "Oso Panda", "Canguro", "Pingüino", "Delfín", "Tiburón", "Ballena", "Águila", "Loro", "Serpiente", "Cocodrilo", "Tortuga", "Rana", "Caballo"],
    Objetos: ["Silla", "Mesa", "Lápiz", "Teléfono", "Cuchara", "Tenedor", "Vaso", "Plato", "Cama", "Reloj", "Llave", "Zapato", "Computador", "Cuaderno", "Mochila", "Botella", "Control Remoto", "Escoba", "Toalla", "Tijeras"],
    ComidaChilena: ["Cazuela", "Pastel de Choclo", "Empanada", "Completo", "Humitas", "Charquicán", "Curanto", "Porotos", "Sopaipillas", "Mote con Huesillos", "Chorrillana", "Machas a la Parmesana", "Carbonada", "Pebre", "Milcao", "Arrollado", "Asado", "Prietas"]
};

const nombresBonitos = {
    UrbanoChile: "🔥 Urbano CL",
    UrbanoMundial: "🌍 Urbano Mix",
    Paises: "✈️ Países",
    Animales: "🦁 Animales",
    Objetos: "📦 Objetos",
    ComidaChilena: "🍲 Comida CL"
};

// Variables Locales
let myRoomId = "";
let myName = "";
let amIHost = false;
let unsubscribe = null;
let activeCategories = []; // <--- LISTA DE CATEGORÍAS ACTIVAS

// ==========================================
// 4. LÓGICA DE RECONEXIÓN
// ==========================================
checkSession();

async function checkSession() {
    const savedRoom = localStorage.getItem('impostor_room');
    const savedName = localStorage.getItem('impostor_name');

    if (savedRoom && savedName) {
        try {
            const roomRef = doc(db, "rooms", savedRoom);
            const roomSnap = await getDoc(roomRef);

            if (roomSnap.exists()) {
                const data = roomSnap.data();
                const playerExists = data.players.some(p => p.name === savedName);
                
                if (playerExists) {
                    myRoomId = savedRoom;
                    myName = savedName;
                    amIHost = (data.host === myName);
                    enterLobby();
                } else {
                    localStorage.clear();
                }
            } else {
                localStorage.clear();
            }
        } catch (error) {
            console.error("Error reconectando:", error);
        }
    }
}

// ==========================================
// 5. FUNCIONES GLOBALES
// ==========================================

window.createRoom = async function() {
    const name = document.getElementById('playerName').value.trim();
    if (!name) return alert("¡Escribe tu nombre!");

    myName = name;
    amIHost = true;
    myRoomId = Math.random().toString(36).substring(2, 6).toUpperCase();

    try {
        await setDoc(doc(db, "rooms", myRoomId), {
            host: myName,
            players: [{ name: myName, score: 0 }],
            status: "waiting",
            gameData: null
        });
        localStorage.setItem('impostor_room', myRoomId);
        localStorage.setItem('impostor_name', myName);
        enterLobby();
    } catch (error) { console.error(error); alert("Error creando sala"); }
};

window.joinRoom = async function() {
    const name = document.getElementById('playerName').value.trim();
    const code = document.getElementById('roomCodeInput').value.trim().toUpperCase();

    if (!name || !code) return alert("Faltan datos");

    try {
        const roomRef = doc(db, "rooms", code);
        const roomSnap = await getDoc(roomRef);

        if (!roomSnap.exists()) return alert("Sala no encontrada");

        myName = name;
        myRoomId = code;
        amIHost = false;

        const players = roomSnap.data().players || [];
        if (players.some(p => p.name === name)) return alert("Nombre ocupado");

        await updateDoc(roomRef, { players: arrayUnion({ name: myName, score: 0 }) });
        localStorage.setItem('impostor_room', myRoomId);
        localStorage.setItem('impostor_name', myName);
        enterLobby();
    } catch (error) { console.error(error); alert("Error al unirse"); }
};

window.exitRoom = async function() {
    if (confirm("¿Salir de la sala?")) {
        localStorage.clear();
        location.reload();
    }
};

// --- GESTIÓN DE CATEGORÍAS (NUEVO) ---
window.addCategory = function() {
    const select = document.getElementById('themeSelect');
    const value = select.value;

    if (value === "Todas") {
        activeCategories = Object.keys(categorias);
    } else {
        if (!activeCategories.includes(value)) {
            activeCategories.push(value);
        }
    }
    renderCategories();
};

window.removeCategory = function(index) {
    activeCategories.splice(index, 1);
    renderCategories();
};

function renderCategories() {
    const container = document.getElementById('activeCategoriesList');
    container.innerHTML = '';
    
    activeCategories.forEach((cat, index) => {
        const nombre = nombresBonitos[cat] || cat;
        container.innerHTML += `
            <div style="background-color: #8e44ad; color: white; padding: 5px 10px; border-radius: 15px; font-size: 12px; display: flex; align-items: center; gap: 5px;">
                ${nombre}
                <span onclick="window.removeCategory(${index})" style="cursor: pointer; font-weight: bold; margin-left:5px;">✕</span>
            </div>
        `;
    });
}

function enterLobby() {
    showScreen('screen-lobby');
    document.getElementById('lobbyCode').innerText = myRoomId;

    if (amIHost) {
        document.getElementById('hostControls').style.display = 'block';
        document.getElementById('waitingText').style.display = 'none';
    } else {
        document.getElementById('hostControls').style.display = 'none';
        document.getElementById('waitingText').style.display = 'block';
    }
    listenToRoom();
}

function listenToRoom() {
    if (unsubscribe) unsubscribe();

    unsubscribe = onSnapshot(doc(db, "rooms", myRoomId), (docSnap) => {
        if (!docSnap.exists()) {
            localStorage.clear();
            alert("La sala se cerró");
            location.reload(); 
            return;
        }
        
        const data = docSnap.data();
        
        // Verificar expulsión
        if (!data.players.some(p => p.name === myName)) {
            localStorage.clear();
            alert("Te han sacado de la sala");
            location.reload();
            return;
        }

        // Actualizar lista
        const list = document.getElementById('lobbyPlayerList');
        list.innerHTML = '';
        data.players.forEach(p => {
            const isHost = p.name === data.host ? ' 👑' : '';
            list.innerHTML += `<li>${p.name}${isHost}</li>`;
        });

        // Cambio de estado
        if (data.status === "playing" && data.gameData) {
            setupGameScreen(data.gameData);
        } else if (data.status === "waiting") {
            showScreen('screen-lobby');
        }
    });
}

window.startGame = async function() {
    const impostorCount = parseInt(document.getElementById('impostorCount').value);

    // Validar categorías
    if (activeCategories.length === 0) return alert("¡Agrega al menos una categoría con el botón +!");

    const roomRef = doc(db, "rooms", myRoomId);
    const roomSnap = await getDoc(roomRef);
    const playersList = roomSnap.data().players;

    if (playersList.length < 3) return alert("Mínimo 3 jugadores");

    // 1. MEZCLAR PALABRAS
    let mixedPool = [];
    activeCategories.forEach(catKey => {
        if (categorias[catKey]) mixedPool = mixedPool.concat(categorias[catKey]);
    });

    if (mixedPool.length === 0) return alert("Error cargando palabras");

    const secretWord = mixedPool[Math.floor(Math.random() * mixedPool.length)];

    // 2. REPARTIR ROLES
    let roles = Array(playersList.length).fill(secretWord);
    let assigned = 0;
    while (assigned < impostorCount) {
        let r = Math.floor(Math.random() * playersList.length);
        if (roles[r] !== "IMPOSTOR") {
            roles[r] = "IMPOSTOR";
            assigned++;
        }
    }

    let rolesMap = {};
    playersList.forEach((p, i) => rolesMap[p.name] = roles[i]);
    const starter = playersList[Math.floor(Math.random() * playersList.length)].name;

    await updateDoc(roomRef, {
        status: "playing",
        gameData: { roles: rolesMap, starter: starter, word: secretWord }
    });
};

function setupGameScreen(gameData) {
    showScreen('screen-game');
    document.getElementById('myGameName').innerText = myName;

    const myRole = gameData.roles[myName];
    const roleDisplay = document.getElementById('roleDisplay');
    
    roleDisplay.className = "role-text";
    roleDisplay.innerText = myRole; 

    if (myRole === "IMPOSTOR") {
        roleDisplay.classList.add("impostor-text");
    } else {
        roleDisplay.classList.add("civilian-text");
    }

    document.getElementById('gameInfo').style.display = 'block';
    document.getElementById('starterName').innerText = gameData.starter;
}

window.resetToLobby = async function() {
    if (!amIHost) return alert("Solo el anfitrión puede reiniciar.");
    await updateDoc(doc(db, "rooms", myRoomId), { status: "waiting", gameData: null });
};

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

// Eventos Tarjeta
const cardContainer = document.getElementById('gameCard');
const cardInner = document.querySelector('.card');
if (cardContainer) {
    cardContainer.addEventListener('mousedown', () => cardInner.classList.add('flipped'));
    cardContainer.addEventListener('mouseup', () => cardInner.classList.remove('flipped'));
    cardContainer.addEventListener('mouseleave', () => cardInner.classList.remove('flipped'));
    cardContainer.addEventListener('touchstart', (e) => { e.preventDefault(); cardInner.classList.add('flipped'); }, { passive: false });
    cardContainer.addEventListener('touchend', () => cardInner.classList.remove('flipped'));
}