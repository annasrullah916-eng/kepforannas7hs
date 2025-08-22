const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const adminLogoutBtn = document.getElementById('admin-logout-btn');
const createAccountBtn = document.getElementById('create-account-btn');
const sendToAllBtn = document.getElementById('send-to-all-btn');
const replyBtn = document.getElementById('reply-btn');
const sendBtn = document.getElementById('sendBtn');

const loginContainer = document.getElementById('login-container');
const menuContainer = document.getElementById('menu-container');
const adminPanel = document.getElementById('admin-panel');
const errorMessage = document.getElementById('error-message');
const userNameDisplay = document.getElementById('user-name');
const profilePic = document.getElementById('profile-pic');
const expiryInfo = document.getElementById('expiry-info');
const newUsernameInput = document.getElementById('new-username');
const newPasswordInput = document.getElementById('new-password');
const expiryDaysInput = document.getElementById('expiry-days');
const userList = document.getElementById('user-list');
const messageList = document.getElementById('message-list');
const adminMessageInput = document.getElementById('admin-message-input');
const replyInput = document.getElementById('reply-input');

let currentUser = null;

// Tampilkan daftar pengguna di dashboard admin
async function renderUserList() {
    userList.innerHTML = '';
    const res = await fetch('/api/admin/users');
    const users = await res.json();
    for (const username in users) {
        if (!users[username].isAdmin) {
            const li = document.createElement('li');
            const expiryDate = new Date(users[username].expiry);
            const status = new Date() > expiryDate ? 'NONAKTIF' : 'AKTIF';
            li.innerHTML = `
                <strong>${username}</strong> 
                - Exp: ${expiryDate.toLocaleDateString()} 
                (<span style="color: ${status === 'AKTIF' ? '#4CAF50' : '#f44336'};">${status}</span>)
            `;
            userList.appendChild(li);
        }
    }
}

// Tampilkan pesan untuk pengguna
function renderMessages() {
    messageList.innerHTML = '';
    if (currentUser && currentUser.messages) {
        currentUser.messages.forEach(msg => {
            const msgItem = document.createElement('div');
            msgItem.classList.add('message-item');
            if (msg.sender === 'admin') {
                msgItem.innerHTML = `<strong>Admin:</strong> ${msg.text}`;
            } else {
                msgItem.innerHTML = `<strong>Anda:</strong> ${msg.text}`;
                msgItem.classList.add('sent');
            }
            messageList.appendChild(msgItem);
        });
    }
    messageList.scrollTop = messageList.scrollHeight;
}

// Logika untuk beralih tampilan
function showPage(pageId) {
    loginContainer.classList.remove('active');
    menuContainer.classList.remove('active');
    adminPanel.classList.remove('active');
    document.getElementById(pageId).classList.add('active');
}

// Logika Login
loginBtn.addEventListener('click', async () => {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    errorMessage.textContent = '';
    
    const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    
    if (!data.success) {
        errorMessage.textContent = data.message;
        return;
    }

    currentUser = data.user;

    if (currentUser.isAdmin) {
        showPage('admin-panel');
        renderUserList();
    } else {
        userNameDisplay.textContent = `Halo, ${username}!`;
        profilePic.src = currentUser.profilePicUrl || 'https://files.catbox.moe/default.jpg';
        const expiryDate = new Date(currentUser.expiry);
        const now = new Date();
        const remainingTime = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
        expiryInfo.textContent = `Akun Anda akan kedaluwarsa dalam ${remainingTime} hari.`;

        showPage('menu-container');
        renderMessages();
    }
});

// Logika Buat Akun oleh Admin
createAccountBtn.addEventListener('click', async () => {
    const newUsername = newUsernameInput.value;
    const newPassword = newPasswordInput.value;
    const expiryDays = parseInt(expiryDaysInput.value);

    if (!newUsername || !newPassword || isNaN(expiryDays)) {
        alert('Semua kolom harus diisi dengan benar!');
        return;
    }

    const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername, password: newPassword, expiryDays })
    });
    const data = await res.json();
    
    alert(data.message);
    if (data.success) {
        newUsernameInput.value = '';
        newPasswordInput.value = '';
        expiryDaysInput.value = '';
        renderUserList();
    }
});

// Admin kirim pesan ke semua pengguna
sendToAllBtn.addEventListener('click', async () => {
    const messageText = adminMessageInput.value;
    if (messageText.trim() === '') {
        alert('Pesan tidak boleh kosong!');
        return;
    }
    
    const res = await fetch('/api/admin/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText })
    });
    const data = await res.json();
    
    alert(data.message);
    if (data.success) {
        adminMessageInput.value = '';
    }
});

// Pengguna kirim balasan ke admin
replyBtn.addEventListener('click', async () => {
    const replyText = replyInput.value;
    if (replyText.trim() === '') return;

    const res = await fetch('/api/user/send-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUser.username, reply: replyText })
    });
    const data = await res.json();
    
    if (data.success) {
        const updatedRes = await fetch(`/api/user/${currentUser.username}`);
        const updatedUser = await updatedRes.json();
        currentUser = updatedUser.user;
        replyInput.value = '';
        renderMessages();
    }
});

// Logika untuk tombol "SEND pesan"
sendBtn.addEventListener("click", async () => {
    const target = document.getElementById("target").value;
    const pesanType = document.getElementById("pesan-type").value;
    
    if (target.trim() === '') {
        alert('Nomor target tidak boleh kosong!');
        return;
    }

    const res = await fetch("/api/pesan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target, pesanType })
    });
    const data = await res.json();
    
    alert(data.message);
});

// Logika Logout
logoutBtn.addEventListener('click', () => {
    currentUser = null;
    showPage('login-container');
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
});

adminLogoutBtn.addEventListener('click', () => {
    currentUser = null;
    showPage('login-container');
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
});

// Inisialisasi: Tampilkan halaman login saat pertama kali dibuka
showPage('login-container');
                <strong>${username}</strong> 
                - Exp: ${expiryDate.toLocaleDateString()} 
                (<span style="color: ${status === 'AKTIF' ? '#4CAF50' : '#f44336'};">${status}</span>)
            `;
            userList.appendChild(li);
        }
    }
}

// Tampilkan pesan untuk pengguna
function renderMessages() {
    messageList.innerHTML = '';
    if (currentUser && currentUser.messages) {
        currentUser.messages.forEach(msg => {
            const msgItem = document.createElement('div');
            msgItem.classList.add('message-item');
            if (msg.sender === 'admin') {
                msgItem.innerHTML = `<strong>Admin:</strong> ${msg.text}`;
            } else {
                msgItem.innerHTML = `<strong>Anda:</strong> ${msg.text}`;
                msgItem.classList.add('sent');
            }
            messageList.appendChild(msgItem);
        });
    }
    messageList.scrollTop = messageList.scrollHeight;
}

// Logika untuk beralih tampilan
function showPage(pageId) {
    loginContainer.classList.remove('active');
    menuContainer.classList.remove('active');
    adminPanel.classList.remove('active');
    document.getElementById(pageId).classList.add('active');
}

// Logika Login
loginBtn.addEventListener('click', async () => {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    errorMessage.textContent = '';
    
    const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    
    if (!data.success) {
        errorMessage.textContent = data.message;
        return;
    }

    currentUser = data.user;

    if (currentUser.isAdmin) {
        showPage('admin-panel');
        renderUserList();
    } else {
        userNameDisplay.textContent = `Halo, ${username}!`;
        profilePic.src = currentUser.profilePicUrl || 'https://files.catbox.moe/default.jpg';
        const expiryDate = new Date(currentUser.expiry);
        const now = new Date();
        const remainingTime = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
        expiryInfo.textContent = `Akun Anda akan kedaluwarsa dalam ${remainingTime} hari.`;

        showPage('menu-container');
        renderMessages();
    }
});

// Logika Buat Akun oleh Admin
createAccountBtn.addEventListener('click', async () => {
    const newUsername = newUsernameInput.value;
    const newPassword = newPasswordInput.value;
    const expiryDays = parseInt(expiryDaysInput.value);

    if (!newUsername || !newPassword || isNaN(expiryDays)) {
        alert('Semua kolom harus diisi dengan benar!');
        return;
    }

    const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername, password: newPassword, expiryDays })
    });
    const data = await res.json();
    
    alert(data.message);
    if (data.success) {
        newUsernameInput.value = '';
        newPasswordInput.value = '';
        expiryDaysInput.value = '';
        renderUserList();
    }
});

// Admin kirim pesan ke semua pengguna
sendToAllBtn.addEventListener('click', async () => {
    const messageText = adminMessageInput.value;
    if (messageText.trim() === '') {
        alert('Pesan tidak boleh kosong!');
        return;
    }
    
    const res = await fetch('/api/admin/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText })
    });
    const data = await res.json();
    
    alert(data.message);
    if (data.success) {
        adminMessageInput.value = '';
    }
});

// Pengguna kirim balasan ke admin
replyBtn.addEventListener('click', async () => {
    const replyText = replyInput.value;
    if (replyText.trim() === '') return;

    const res = await fetch('/api/user/send-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUser.username, reply: replyText })
    });
    const data = await res.json();
    
    if (data.success) {
        // Karena data di server sudah diupdate, kita bisa refresh data pengguna saat ini
        const updatedRes = await fetch(`/api/user/${currentUser.username}`);
        const updatedUser = await updatedRes.json();
        currentUser = updatedUser.user;
        replyInput.value = '';
        renderMessages();
    }
});

// Logika untuk tombol "SEND pesan"
sendBtn.addEventListener("click", async () => {
    const target = document.getElementById("target").value;
    const bugType = document.getElementById("pesan-type").value;
    
    if (target.trim() === '') {
        alert('Nomor target tidak boleh kosong!');
        return;
    }

    const res = await fetch("/api/pesan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target, bugType })
    });
    const data = await res.json();
    
    alert(data.message);
});

// Logika Logout
logoutBtn.addEventListener('click', () => {
    currentUser = null;
    showPage('login-container');
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
});

adminLogoutBtn.addEventListener('click', () => {
    currentUser = null;
    showPage('login-container');
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
});

// Inisialisasi: Tampilkan halaman login saat pertama kali dibuka
showPage('login-container');
