const API_URL = 'http://localhost:3000/api';
let employees = [];

document.addEventListener('DOMContentLoaded', () => {
    loadEmployees();
    setupForm();
    setupMasks();
});

async function loadEmployees() {
    const search = document.getElementById('searchName').value;
    const dept = document.getElementById('filterDept').value;
    const pos = document.getElementById('filterPos').value;

    const params = new URLSearchParams({ search, department: dept, position: pos });
    const res = await fetch(`${API_URL}/employees?${params}`);
    employees = await res.json();
    renderTable();
}

function renderTable() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';

    employees.forEach(emp => {
        const tr = document.createElement('tr');
        if (emp.is_fired) tr.classList.add('row-fired');

        tr.innerHTML = `
            <td>${emp.full_name}</td>
            <td>${emp.department}</td>
            <td>${emp.position}</td>
            <td>${emp.salary.toLocaleString()} ₽</td>
            <td>
                <span class="${emp.is_fired ? 'status-fired' : 'status-active'}">
                    ${emp.is_fired ? 'Уволен' : 'Работает'}
                </span>
            </td>
            <td>
                <button class="btn-edit" onclick="editEmployee(${emp.id})" 
                    ${emp.is_fired ? 'disabled' : ''}>✏️</button>
                <button class="btn-fire" onclick="fireEmployee(${emp.id})" 
                    ${emp.is_fired ? 'disabled' : ''}>🚫</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function openModal(isEdit = false) {
    document.getElementById('modal').style.display = 'block';
    document.getElementById('modalTitle').textContent = isEdit ? 'Редактировать' : 'Новый сотрудник';
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
    document.getElementById('employeeForm').reset();
    document.getElementById('empId').value = '';
}

function setupForm() {
    document.getElementById('employeeForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id = document.getElementById('empId').value;
        const data = {
            full_name: document.getElementById('fullName').value,
            birth_date: document.getElementById('birthDate').value,
            passport: document.getElementById('passport').value,
            contact_info: document.getElementById('contact').value,
            address: document.getElementById('address').value,
            department: document.getElementById('department').value,
            position: document.getElementById('position').value,
            salary: document.getElementById('salary').value,
            hire_date: document.getElementById('hireDate').value
        };

        const url = id ? `${API_URL}/employees/${id}` : `${API_URL}/employees`;
        const method = id ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            closeModal();
            loadEmployees();
        } else {
            const err = await res.json();
            alert('Ошибка: ' + err.error);
        }
    });
}

async function editEmployee(id) {
    const emp = employees.find(e => e.id === id);
    if (!emp) return;

    document.getElementById('empId').value = emp.id;
    document.getElementById('fullName').value = emp.full_name;
    document.getElementById('birthDate').value = emp.birth_date;
    document.getElementById('passport').value = emp.passport;
    document.getElementById('contact').value = emp.contact_info;
    document.getElementById('address').value = emp.address;
    document.getElementById('department').value = emp.department;
    document.getElementById('position').value = emp.position;
    document.getElementById('salary').value = emp.salary;
    document.getElementById('hireDate').value = emp.hire_date;

    openModal(true);
}

async function fireEmployee(id) {
    if (!confirm('Вы уверены, что хотите уволить сотрудника?')) return;

    const res = await fetch(`${API_URL}/employees/${id}/fire`, { method: 'PATCH' });
    if (res.ok) {
        loadEmployees();
    } else {
        alert('Ошибка при увольнении');
    }
}

function setupMasks() {
    document.getElementById('passport').addEventListener('input', (e) => {
        let val = e.target.value.replace(/\D/g, '').slice(0, 10);
        if (val.length > 4) val = val.slice(0, 4) + ' ' + val.slice(4);
        e.target.value = val;
    });

    document.getElementById('contact').addEventListener('input', (e) => {
        let val = e.target.value.replace(/\D/g, '').slice(0, 11);
        if (val.startsWith('8')) val = '7' + val.slice(1);
        if (!val.startsWith('7')) val = '7' + val;
        
        let formatted = '+7';
        if (val.length > 1) formatted += ' (' + val.slice(1, 4);
        if (val.length > 4) formatted += ') ' + val.slice(4, 7);
        if (val.length > 7) formatted += '-' + val.slice(7, 9);
        if (val.length > 9) formatted += '-' + val.slice(9, 11);
        
        e.target.value = formatted;
    });
}

window.onclick = (e) => {
    const modal = document.getElementById('modal');
    if (e.target === modal) closeModal();
};