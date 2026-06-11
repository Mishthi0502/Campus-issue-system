import { auth, db } from './firebase-config.js';
import { 
    onAuthStateChanged, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut,
    GoogleAuthProvider,
    signInWithPopup 
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import { 
    collection, 
    addDoc, 
    query, 
    where, 
    onSnapshot, 
    doc, 
    updateDoc, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const googleProvider = new GoogleAuthProvider();
let userRole = localStorage.getItem('selectedRole') || null;

// --- Helper Functions ---
const isJIITEmail = (email) => email.endsWith('@mail.jiit.ac.in');

// --- Navigation & Back Button ---
document.getElementById('select-student').onclick = () => {
    userRole = 'student';
    localStorage.setItem('selectedRole', 'student');
    toggleAuthUI('Student');
};

document.getElementById('select-admin').onclick = () => {
    userRole = 'admin';
    localStorage.setItem('selectedRole', 'admin');
    toggleAuthUI('Admin');
};

document.getElementById('back-to-portal').onclick = (e) => {
    e.preventDefault();
    localStorage.removeItem('selectedRole');
    location.reload();
};

function toggleAuthUI(roleName) {
    document.getElementById('portal-selection').classList.add('hidden');
    document.getElementById('auth-section').classList.remove('hidden');
    document.getElementById('auth-title').innerText = `${roleName} Login`;
}

// --- Authentication Observer ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Double-check domain even if already logged in
        if (!isJIITEmail(user.email)) {
            signOut(auth);
            return;
        }

        document.getElementById('user-header').classList.remove('hidden');
        document.getElementById('user-name-top').textContent = user.email.split('@')[0];
        document.getElementById('auth-section').classList.add('hidden');
        
        if (userRole === 'admin') {
            document.getElementById('admin-view').classList.remove('hidden');
            loadAdminIssues();
        } else {
            document.getElementById('student-view').classList.remove('hidden');
            loadStudentIssues(user.email);
        }
    } else {
        document.getElementById('user-header').classList.add('hidden');
        if (!userRole) document.getElementById('portal-selection').classList.remove('hidden');
    }
});

// --- Auth Actions (Login, Signup, Google) ---

// Google Sign-In with Domain Restriction
document.getElementById('google-btn').onclick = () => {
    signInWithPopup(auth, googleProvider)
        .then((result) => {
            if (!isJIITEmail(result.user.email)) {
                signOut(auth);
                alert("Unauthorized: You must sign in with your JIIT Google account (@mail.jiit.ac.in).");
            }
        })
        .catch(e => alert(e.message));
};

// Email/Password Login with Domain Restriction
document.getElementById('login-btn').onclick = () => {
    const emailVal = document.getElementById('email').value;
    const passVal = document.getElementById('password').value;

    if (!isJIITEmail(emailVal)) {
        alert("Access Denied: Please use your official JIIT email (@mail.jiit.ac.in).");
        return;
    }

    signInWithEmailAndPassword(auth, emailVal, passVal).catch(e => alert(e.message));
};

// Email/Password Signup with Domain Restriction
document.getElementById('signup-btn').onclick = () => {
    const emailVal = document.getElementById('email').value;
    const passVal = document.getElementById('password').value;
    
    if (!emailVal || !passVal) {
        alert("Please enter both email and password.");
        return;
    }

    if (!isJIITEmail(emailVal)) {
        alert("Registration Restricted: Only @mail.jiit.ac.in emails are allowed.");
        return;
    }

    createUserWithEmailAndPassword(auth, emailVal, passVal)
        .then(() => alert("Account Created! You are now logged in."))
        .catch(e => alert(e.message));
};

// --- Database Logic ---

function loadStudentIssues(email) {
    const q = query(collection(db, "issues"), where("reporterEmail", "==", email));
    onSnapshot(q, (snapshot) => {
        const list = document.getElementById('student-issues-list');
        const countDisplay = document.getElementById('issue-count-display');
        if (countDisplay) countDisplay.innerText = `Total Issues Reported: ${snapshot.size}`;
        
        list.innerHTML = "";
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            list.innerHTML += `
                <div class="issue-card">
                    <p><strong>${data.category}</strong>: ${data.description}</p>
                    <p>Status: <strong>${data.status}</strong></p>
                </div><hr>`;
        });
    });
}

function loadAdminIssues() {
    onSnapshot(collection(db, "issues"), (snapshot) => {
        const list = document.getElementById('admin-issues-list');
        list.innerHTML = "";
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const id = docSnap.id;
            const btn = data.status === "Pending" ? 
                `<button onclick="resolveIssue('${id}')">Mark Resolved</button>` : "✅ Resolved";
            list.innerHTML += `<div class="admin-card"><p>${data.description}</p>${btn}</div><hr>`;
        });
    });
}

window.resolveIssue = async (id) => {
    await updateDoc(doc(db, "issues", id), { status: "Resolved" });
};

// --- Form Submission ---
const issueForm = document.getElementById('issue-form');
if (issueForm) {
    issueForm.onsubmit = async (e) => {
        e.preventDefault();
        const newIssue = {
            name: document.getElementById('student-name').value,
            reporterEmail: auth.currentUser.email,
            description: document.getElementById('description').value,
            category: document.getElementById('category').value,
            location: document.getElementById('location').value,
            status: "Pending",
            createdAt: serverTimestamp()
        };
        await addDoc(collection(db, "issues"), newIssue);
        alert("Complaint Submitted Successfully!");
        e.target.reset();
    };
}

// --- Logout Logic ---
document.getElementById('logout-btn-top').onclick = () => {
    signOut(auth).then(() => {
        localStorage.removeItem('selectedRole');
        location.reload();
    });
};