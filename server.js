const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = process.env.env || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Path file data
const USERS_FILE = path.join(__dirname, "users.json");

// Helper Functions
const loadUsers = () => {
    try {
        if (fs.existsSync(USERS_FILE)) {
            const data = fs.readFileSync(USERS_FILE, "utf8");
            return JSON.parse(data);
        }
        return {};
    } catch (error) {
        console.error("Error loading users:", error);
        return {};
    }
};

const saveUsers = (data) => {
    try {
        fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Error saving users:", error);
    }
};

// Pastikan file users.json ada saat server dimulai
if (!fs.existsSync(USERS_FILE) || Object.keys(loadUsers()).length === 0) {
    saveUsers({
        'admin': { 
            password: '12345', 
            isAdmin: true,
            expiry: null,
            profilePicUrl: 'https://files.catbox.moe/admin.jpg',
            messages: []
        },
        'user1': {
            password: 'pass1',
            isAdmin: false,
            expiry: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(),
            profilePicUrl: 'https://files.catbox.moe/default.jpg',
            messages: [{ sender: 'admin', text: 'Halo user1, akun Anda aktif selama 30 hari!', timestamp: new Date().toISOString() }]
        }
    });
}

// ===================================
// API Endpoints
// ===================================

/**
 * Endpoint Login
 * Memvalidasi username dan password.
 */
app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const users = loadUsers();
    const user = users[username];
    
    if (!user || user.password !== password) {
        return res.status(401).json({ success: false, message: "Username atau password salah." });
    }

    if (!user.isAdmin) {
        const now = new Date();
        const expiryDate = new Date(user.expiry);
        if (now > expiryDate) {
            return res.status(403).json({ success: false, message: `Akun Anda sudah kedaluwarsa pada ${expiryDate.toLocaleDateString()}. Silakan hubungi admin untuk aktivasi kembali.` });
        }
    }

    const userData = { ...user, username };
    delete userData.password;
    res.json({ success: true, message: "Login berhasil!", user: userData });
});

/**
 * Endpoint Admin: Membuat Akun Pengguna
 */
app.post("/api/admin/create-user", (req, res) => {
    const { username, password, expiryDays } = req.body;
    const users = loadUsers();

    if (users[username]) {
        return res.status(409).json({ success: false, message: "Username sudah ada." });
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + parseInt(expiryDays));

    users[username] = {
        password: password,
        isAdmin: false,
        expiry: expiryDate.toISOString(),
        profilePicUrl: 'https://files.catbox.moe/default.jpg',
        messages: []
    };

    saveUsers(users);
    res.json({ success: true, message: "Akun berhasil dibuat." });
});

/**
 * Endpoint Admin: Mengirim Pesan ke Semua Pengguna
 */
app.post("/api/admin/send-message", (req, res) => {
    const { message } = req.body;
    const users = loadUsers();

    for (const username in users) {
        if (!users[username].isAdmin) {
            users[username].messages.push({
                sender: 'admin',
                text: message,
                timestamp: new Date().toISOString()
            });
        }
    }

    saveUsers(users);
    res.json({ success: true, message: "Pesan berhasil dikirim ke semua pengguna." });
});

/**
 * Endpoint Pengguna: Mengirim Balasan
 */
app.post("/api/user/send-reply", (req, res) => {
    const { username, reply } = req.body;
    const users = loadUsers();

    if (!users[username]) {
        return res.status(404).json({ success: false, message: "Pengguna tidak ditemukan." });
    }

    users[username].messages.push({
        sender: username,
        text: reply,
        timestamp: new Date().toISOString()
    });

    users['admin'].messages.push({
        sender: username,
        text: reply,
        timestamp: new Date().toISOString()
    });

    saveUsers(users);
    res.json({ success: true, message: "Balasan berhasil dikirim." });
});

/**
 * Endpoint Pengiriman Pesan dari Frontend
 */
app.post("/api/pesan", async (req, res) => {
    const { target, pesanType } = req.body;
    if (!target) {
        return res.status(400).json({ success: false, message: "Nomor target dibutuhkan." });
    }

    try {
        console.log(`Mengirim pesan '${pesanType}' ke target: ${target}`);
        res.json({ success: true, message: `Pesan '${pesanType}' terkirim ke ${target}` });
    } catch (err) {
        res.status(500).json({ success: false, message: "Gagal kirim pesan", error: err.message });
    }
});

/**
 * Endpoint untuk mendapatkan data pengguna tertentu (untuk keperluan refresh data)
 */
app.get("/api/user/:username", (req, res) => {
    const { username } = req.params;
    const users = loadUsers();
    const user = users[username];

    if (!user) {
        return res.status(404).json({ success: false, message: "Pengguna tidak ditemukan." });
    }
    
    const userData = { ...user, username };
    delete userData.password;
    res.json({ success: true, user: userData });
});

/**
 * Endpoint untuk mendapatkan seluruh daftar pengguna (untuk admin)
 */
app.get("/api/admin/users", (req, res) => {
    const users = loadUsers();
    res.json(users);
});

// Jalankan server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
if (!fs.existsSync(USERS_FILE)) {
    saveUsers({
        'Kep': {
            password: '1',
            isAdmin: true,
            expiry: null,
            profilePicUrl: 'https://files.catbox.moe/admin.jpg',
            messages: []
        }
    });
}

// ===================================
// API Endpoints
// ===================================

/**
 * Endpoint Login
 * Memvalidasi username dan password.
 */
app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const users = loadUsers();
    const user = users[username];
    
    if (!user || user.password !== password) {
        return res.status(401).json({ success: false, message: "Username atau password salah." });
    }

    if (!user.isAdmin) {
        const now = new Date();
        const expiryDate = new Date(user.expiry);
        if (now > expiryDate) {
            return res.status(403).json({ success: false, message: `Akun Anda sudah kedaluwarsa pada ${expiryDate.toLocaleDateString()}. Silakan hubungi admin untuk aktivasi kembali.` });
        }
    }

    // Mengirim data pengguna (tanpa password)
    const userData = { ...user };
    delete userData.password;
    res.json({ success: true, message: "Login berhasil!", user: userData });
});

/**
 * Endpoint Admin: Membuat Akun Pengguna
 */
app.post("/api/admin/create-user", (req, res) => {
    const { username, password, expiryDays } = req.body;
    const users = loadUsers();

    if (users[username]) {
        return res.status(409).json({ success: false, message: "Username sudah ada." });
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + parseInt(expiryDays));

    users[username] = {
        password: password,
        isAdmin: false,
        expiry: expiryDate.toISOString(),
        profilePicUrl: 'https://files.catbox.moe/default.jpg',
        messages: []
    };

    saveUsers(users);
    res.json({ success: true, message: "Akun berhasil dibuat." });
});

/**
 * Endpoint Admin: Mengirim Pesan ke Semua Pengguna
 */
app.post("/api/admin/send-message", (req, res) => {
    const { message } = req.body;
    const users = loadUsers();

    for (const username in users) {
        if (!users[username].isAdmin) {
            users[username].messages.push({
                sender: 'admin',
                text: message,
                timestamp: new Date().toISOString()
            });
        }
    }

    saveUsers(users);
    res.json({ success: true, message: "Pesan berhasil dikirim ke semua pengguna." });
});

/**
 * Endpoint Pengguna: Mengirim Balasan
 */
app.post("/api/user/send-reply", (req, res) => {
    const { username, reply } = req.body;
    const users = loadUsers();

    if (!users[username]) {
        return res.status(404).json({ success: false, message: "Pengguna tidak ditemukan." });
    }

    users[username].messages.push({
        sender: username,
        text: reply,
        timestamp: new Date().toISOString()
    });

    users['Kep'].messages.push({
        sender: username,
        text: reply,
        timestamp: new Date().toISOString()
    });

    saveUsers(users);
    res.json({ success: true, message: "Balasan berhasil dikirim." });
});

/**
 * Endpoint Pengiriman Pesan dari Frontend (tombol SEND)
 */
app.post("/api/pesan", async (req, res) => {
    const { target, bugType } = req.body;
    if (!target) {
        return res.status(400).json({ success: false, message: "Nomor target dibutuhkan." });
    }

    try {
        // Di sini Anda bisa memanggil fungsi pengiriman pesan Anda
        // Contoh: await InvisibleHome(target, { pesan: bugType });
        console.log(`Mengirim pesan '${bugType}' ke target: ${target}`);
        res.json({ success: true, message: `Pesan '${bugType}' terkirim ke ${target}` });
    } catch (err) {
        res.status(500).json({ success: false, message: "Gagal kirim pesan", error: err.message });
    }
});

/**
 * Endpoint untuk mendapatkan data pengguna tertentu (untuk keperluan refresh data)
 */
app.get("/api/user/:username", (req, res) => {
    const { username } = req.params;
    const users = loadUsers();
    const user = users[username];

    if (!user) {
        return res.status(404).json({ success: false, message: "Pengguna tidak ditemukan." });
    }
    
    const userData = { ...user };
    delete userData.password;
    res.json({ success: true, user: userData });
});

/**
 * Endpoint untuk mendapatkan seluruh daftar pengguna (untuk admin)
 */
app.get("/api/admin/users", (req, res) => {
    const users = loadUsers();
    res.json(users);
});

// Jalankan server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
