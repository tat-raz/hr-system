const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Раздаем фронтенд из папки public

// Подключение к БД
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) {
        console.error('Ошибка подключения к БД:', err.message);
    } else {
        console.log('Подключено к базе данных SQLite.');
        initDB();
    }
});

// Инициализация таблицы
function initDB() {
    const sql = `
        CREATE TABLE IF NOT EXISTS employees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            birth_date TEXT,
            passport TEXT,
            contact_info TEXT,
            address TEXT,
            department TEXT,
            position TEXT,
            salary REAL,
            hire_date TEXT,
            is_fired INTEGER DEFAULT 0
        )
    `;
    db.run(sql, (err) => {
        if (err) console.error('Ошибка создания таблицы:', err.message);
        else console.log('Таблица employees готова.');
    });
}

// 1. Получить всех сотрудников 
app.get('/api/employees', (req, res) => {
    const { search, department, position } = req.query;
    let sql = 'SELECT * FROM employees WHERE 1=1';
    const params = [];

    if (search) {
        sql += ' AND full_name LIKE ?';
        params.push(`%${search}%`);
    }
    if (department) {
        sql += ' AND department = ?';
        params.push(department);
    }
    if (position) {
        sql += ' AND position = ?';
        params.push(position);
    }

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 2. Создать сотрудника
app.post('/api/employees', (req, res) => {
    const { full_name, birth_date, passport, contact_info, address, department, position, salary, hire_date } = req.body;
    
    if (!full_name) return res.status(400).json({ error: 'ФИО обязательно' });

    const sql = `INSERT INTO employees (full_name, birth_date, passport, contact_info, address, department, position, salary, hire_date, is_fired) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`;
    const params = [full_name, birth_date, passport, contact_info, address, department, position, salary, hire_date];

    db.run(sql, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, message: 'Сотрудник создан' });
    });
});

// 3. Редактировать сотрудника
app.put('/api/employees/:id', (req, res) => {
    const { id } = req.params;
    const data = req.body;

    db.get('SELECT is_fired FROM employees WHERE id = ?', [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Сотрудник не найден' });
        
        if (row.is_fired === 1) {
            return res.status(403).json({ error: 'Нельзя редактировать уволенного сотрудника' });
        }

        const sql = `UPDATE employees SET 
            full_name = ?, birth_date = ?, passport = ?, contact_info = ?, 
            address = ?, department = ?, position = ?, salary = ?, hire_date = ? 
            WHERE id = ?`;
        
        const params = [
            data.full_name, data.birth_date, data.passport, data.contact_info, 
            data.address, data.department, data.position, data.salary, data.hire_date, id
        ];

        db.run(sql, params, function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Данные обновлены' });
        });
    });
});

// 4. Уволить сотрудника
app.patch('/api/employees/:id/fire', (req, res) => {
    const { id } = req.params;
    
    const sql = 'UPDATE employees SET is_fired = 1 WHERE id = ?';
    
    db.run(sql, [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Сотрудник не найден' });
        
        res.json({ message: 'Сотрудник уволен' });
    });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});