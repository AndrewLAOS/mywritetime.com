// main.js
import { ITEMS } from './items.js';

// Firebase imports and initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getDatabase, ref, get, set, update, onValue, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// Your firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAqmG4OxLp7f1kktoLwicGR4O2SLwqNBk0",
  authDomain: "rps-flip.firebaseapp.com",
  projectId: "rps-flip",
  storageBucket: "rps-flip.appspot.com",
  messagingSenderId: "1044307931173",
  appId: "1:1044307931173:web:efa8c8bcf4cd82c1e14fcc",
  measurementId: "G-57Z3NG9FJN"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// UI elements
const loginSection = document.getElementById('login-section');
const btnGoogleLogin = document.getElementById('btnGoogleLogin');
const loginStatus = document.getElementById('login-status');

const matchSection = document.getElementById('match-section');
const btnCreateMatch = document.getElementById('btnCreateMatch');
const matchIdInput = document.getElementById('match-id-input');
const btnJoinMatch = document.getElementById('btnJoinMatch');
const matchStatus = document.getElementById('match-status');

const gameSection = document.getElementById('game-section');
const playerCardInner = document.getElementById('player-card-inner');
const playerCardBack = document.getElementById('player-card-back');
const opponentCardInner = document.getElementById('opponent-card-inner');
const opponentCardBack = document.getElementById('opponent-card-back');
const playerNameLabel = document.getElementById('player-name-label');
const opponentNameLabel = document.getElementById('opponent-name-label');
const choicesDiv = document.getElementById('choices');
const statusText = document.getElementById('status-text');
const loadingSpinner = document.getElementById('loading-spinner');

// Game state
let currentUser = null;
let matchId = null;
let playerNumber = null;
let opponentId = null;
let gameRef = null;

// Login
btnGoogleLogin.addEventListener('click', () => {
  const provider = new GoogleAuthProvider();
  signInWithPopup(auth, provider).catch(err => {
    loginStatus.textContent = 'Login failed: ' + err.message;
  });
});

onAuthStateChanged(auth, user => {
  if (user) {
    currentUser = user;
    loginStatus.textContent = `Hello, ${user.displayName}!`;
    loginSection.hidden = true;
    matchSection.hidden = false;
  } else {
    currentUser = null;
    loginStatus.textContent = '';
    loginSection.hidden = false;
    matchSection.hidden = true;
    gameSection.hidden = true;
  }
});

function generateMatchId() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

// Create Match button
btnCreateMatch.addEventListener('click', async () => {
  matchId = generateMatchId();
  matchIdInput.value = matchId;
  await startMatch(matchId, true);
});

// Join Match button
btnJoinMatch.addEventListener('click', async () => {
  let enteredId = matchIdInput.value.trim().toUpperCase();
  if (!enteredId) {
    matchStatus.textContent = 'Please enter a Match ID to join.';
    return;
  }
  matchId = enteredId;
  await startMatch(matchId, false);
});

async function startMatch(id, isCreating) {
  matchStatus.textContent = 'Joining match...';
  loadingSpinner.style.display = 'block';
  gameSection.hidden = true;

  gameRef = ref(db, `matches/${id}`);

  const snapshot = await get(gameRef);
  const matchData = snapshot.val();

  if (isCreating) {
    if (matchData) {
      matchStatus.textContent = 'Match ID already exists, please try again.';
      loadingSpinner.style.display = 'none';
      return;
    }
    // Create match as player1
    await set(gameRef, {
      player1: {
        uid: currentUser.uid,
        name: currentUser.displayName,
        choice: null,
        score: 0,
      },
      player2: null,
      turn: 'player1',
      result: null,
      started: false,
      createdAt: serverTimestamp()
    });
    playerNumber = 'player1';
    opponentId = 'player2';
  } else {
    if (!matchData) {
      matchStatus.textContent = 'Match ID does not exist.';
      loadingSpinner.style.display = 'none';
      return;
    }
    if (!matchData.player2) {
      // Join as player2
      await update(gameRef, {
        player2: {
          uid: currentUser.uid,
          name: currentUser.displayName,
          choice: null,
          score: 0,
        },
        started: true,
        turn: 'player1',
        result: null
      });
      playerNumber = 'player2';
      opponentId = 'player1';
    } else if (matchData.player1.uid === currentUser.uid || (matchData.player2 && matchData.player2.uid === currentUser.uid)) {
      // Reconnect existing player
      if (matchData.player1.uid === currentUser.uid) {
        playerNumber = 'player1';
        opponentId = 'player2';
      } else {
        playerNumber = 'player2';
        opponentId = 'player1';
      }
    } else {
      matchStatus.textContent = 'Match is full. Try another ID.';
      loadingSpinner.style.display = 'none';
      return;
    }
  }

  matchStatus.textContent = `Joined match ${id} as ${playerNumber.toUpperCase()}`;
  loadingSpinner.style.display = 'none';
  matchSection.hidden = true;
  gameSection.hidden = false;

  setupGameUI();
  listenForGameUpdates();
}

// ... Rest of your existing functions (setupGameUI, listenForGameUpdates, etc.) remain mostly unchanged,
// just make sure they’re inside main.js and use imported ITEMS.

