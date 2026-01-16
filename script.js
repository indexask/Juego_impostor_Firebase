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
    Marcas: ["Nike", "Adidas", "Jordan", "Gucci", "Apple", "Samsung", "Coca-Cola", "Pepsi", "McDonald's", "Netflix", "Disney", "Sony", "Microsoft", "Toyota", "Zara", "Michael Kors"],
    Peliculas: ["Piratas del Caribe", "Coco", "Buscando a Nemo","Titanic", "Avatar", "Avengers", "Spiderman", "Batman", "Shrek", "Toy Story", "Harry Potter", "Star Wars", "El Padrino", "Rocky", "Rápido y Furioso", "Jurassic Park", "El Rey León"],
    UrbanoChile: ["Cris MJ", "Pailita", "Young Cister", "Polimá Westcoast", "Pablo Chill-E", "Marcianeke", "El Jordan 23", "Jere Klein", "Julianno Sosa", "Standly", "King Savagge", "Ak4:20", "FloyyMenor", "DrefQuila", "Princesa Alba"],
    UrbanoMundial: ["Bad Bunny", "Daddy Yankee", "Karol G", "J Balvin", "Anuel AA", "Feid (Ferxxo)", "Rauw Alejandro", "Maluma", "Ozuna", "Arcángel", "Nicky Jam", "Wisin & Yandel", "Don Omar", "Myke Towers", "Bizarrap"],
    Paises: ["Chile", "Argentina", "Perú", "Brasil", "Colombia", "Venezuela", "México", "Estados Unidos", "España", "Francia", "Italia", "Alemania", "Inglaterra", "Rusia", "China", "Japón", "Corea del Sur", "Egipto", "India"],
    Animales: ["Perro", "Gato", "León", "Tigre", "Elefante", "Jirafa", "Mono", "Oso Panda", "Canguro", "Pingüino", "Delfín", "Tiburón", "Ballena", "Águila", "Loro", "Serpiente", "Cocodrilo", "Tortuga", "Rana", "Caballo"],
    Objetos: ["Silla", "Mesa", "Lápiz", "Teléfono", "Cuchara", "Tenedor", "Vaso", "Plato", "Cama", "Reloj", "Llave", "Zapato", "Computador", "Cuaderno", "Mochila", "Botella", "Control Remoto", "Escoba", "Toalla", "Tijeras"],
    ComidaChilena: ["Cazuela", "Pastel de Choclo", "Empanada", "Completo", "Humitas", "Charquicán", "Curanto", "Porotos", "Sopaipillas", "Mote con Huesillos", "Chorrillana", "Machas a la Parmesana", "Carbonada", "Pebre", "Milcao", "Arrollado", "Asado", "Prietas"]
};

const nombresBonitos = {
    Marcas:"🔱Marcas✔️",
    Peliculas:"🎥Peliculas🍿",
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
        // Si elige todas, borramos las anteriores y metemos todas las claves
        activeCategories = Object.keys(categorias);
    } else {
        // Si ya está "Todas" activo, lo limpiamos para permitir selección manual
        if (activeCategories.length === Object.keys(categorias).length) {
             activeCategories = [];
        }
        
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
    const impostorInput = document.getElementById('impostorCount').value;
    let impostorCount = parseInt(impostorInput);
    
    // 1. LEER ESTADO DEL BOTÓN DE PISTAS
    const areHintsEnabled = document.getElementById('hintsEnabled').checked;

    // VALIDACIONES
    if (activeCategories.length === 0) return alert("¡Agrega al menos una categoría!");

    const roomRef = doc(db, "rooms", myRoomId);
    const roomSnap = await getDoc(roomRef);
    const roomData = roomSnap.data();
    const playersList = roomData.players;
    const totalPlayers = playersList.length;

    // Historial de palabras usadas (si no existe, empezamos con array vacío)
    let usedWordsHistory = roomData.usedWords || [];

    if (totalPlayers < 3) return alert("Mínimo 3 jugadores.");
    if (impostorCount >= totalPlayers) impostorCount = totalPlayers - 1;

    // 2. CREAR POOL Y FILTRAR REPETIDAS
    let availablePool = [];
    let possibleCategories = []; // Para saber de qué categoría vino la palabra

    activeCategories.forEach(catKey => {
        if (categorias[catKey]) {
            // Filtramos: Solo agregamos palabras que NO estén en el historial
            const wordsInCat = categorias[catKey].filter(word => !usedWordsHistory.includes(word));
            
            wordsInCat.forEach(w => {
                availablePool.push({ word: w, catKey: catKey });
            });
        }
    });

    // 3. LOGICA DE RESET AUTOMÁTICO
    // Si ya usamos todas las palabras de las categorías seleccionadas, limpiamos el historial
    if (availablePool.length === 0) {
        alert("¡Se acabaron las palabras nuevas! Reiniciando historial de palabras...");
        usedWordsHistory = []; // Limpiamos localmente
        
        // Volvemos a llenar el pool completo
        activeCategories.forEach(catKey => {
            if (categorias[catKey]) {
                categorias[catKey].forEach(w => {
                    availablePool.push({ word: w, catKey: catKey });
                });
            }
        });
    }

    // 4. ELEGIR PALABRA SECRETA
    const selection = availablePool[Math.floor(Math.random() * availablePool.length)];
    const secretWord = selection.word;
    const categoryName = nombresBonitos[selection.catKey] || selection.catKey;

    // 5. ASIGNAR ROLES (Shuffle)
    let rolesArray = [];
    for (let i = 0; i < impostorCount; i++) rolesArray.push("IMPOSTOR");
    while (rolesArray.length < totalPlayers) rolesArray.push(secretWord);

    // Fisher-Yates Shuffle
    for (let i = rolesArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [rolesArray[i], rolesArray[j]] = [rolesArray[j], rolesArray[i]];
    }

    let rolesMap = {};
    playersList.forEach((p, i) => rolesMap[p.name] = rolesArray[i]);
    const starter = playersList[Math.floor(Math.random() * playersList.length)].name;

    // 6. ACTUALIZAR FIREBASE
    // Usamos 'arrayUnion' para agregar la palabra al historial sin borrar lo anterior
    // Si reiniciamos el historial (paso 3), deberíamos haberlo limpiado, pero para simplificar,
    // en la próxima ronda updateDoc lo manejará.
    
    let updatePayload = {
        status: "playing",
        gameData: { 
            roles: rolesMap, 
            starter: starter,
            hintsEnabled: areHintsEnabled, // Guardamos si se activaron o no
            hint: categoryName // La pista es SOLO la categoría
        }
    };

    // Si tuvimos que reiniciar el historial porque estaba lleno
    if (availablePool.length === 0) {
        updatePayload.usedWords = [secretWord]; // Reseteamos en la BD
    } else {
        updatePayload.usedWords = arrayUnion(secretWord); // Agregamos al historial existente
    }

    await updateDoc(roomRef, updatePayload);
};

function setupGameScreen(gameData) {
    showScreen('screen-game');
    document.getElementById('myGameName').innerText = myName;

    const myRole = gameData.roles[myName];
    const roleDisplay = document.getElementById('roleDisplay');
    const hintDisplay = document.getElementById('impostorHint'); // Asegúrate de haber creado este <p> en el HTML

    roleDisplay.className = "role-text";
    roleDisplay.innerText = myRole; 
    
    // Reset visual
    hintDisplay.style.display = 'none';

    if (myRole === "IMPOSTOR") {
        roleDisplay.classList.add("impostor-text");
        
        // CONDICIÓN DOBLE: ¿Soy impostor? Y ADEMÁS ¿Están las pistas activadas?
        if (gameData.hintsEnabled) {
            hintDisplay.style.display = 'block';
            hintDisplay.innerText = `(Pista: ${gameData.hint})`;
        }
        
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

// Función para llenar el select automáticamente basado en tu objeto 'categorias'
function llenarSelectAutomaticamente() {
    const select = document.getElementById('themeSelect');
    // Mantenemos solo la opción "Todas"
    select.innerHTML = '<option value="Todas">🌟 TODAS LAS CATEGORÍAS</option>';
    
    // Recorremos las claves de tu objeto
    Object.keys(categorias).forEach(key => {
        const nombreVisible = nombresBonitos[key] || key; // Usa el nombre bonito si existe, si no, usa la clave
        select.innerHTML += `<option value="${key}">${nombreVisible}</option>`;
    });
}

// Llama a esta función cuando cargue la página o cuando crees la sala
llenarSelectAutomaticamente();