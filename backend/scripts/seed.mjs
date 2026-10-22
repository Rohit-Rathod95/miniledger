const base = 'http://localhost:4000';
const phone = '9850704543';
const json = (r) => r.json();

const otp = await fetch(base + '/auth/request-otp', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
}).then(json);

const { token } = await fetch(base + '/auth/verify-otp', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, otp: otp.otp }),
}).then(json);

const auth = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token };
const daysFromNow = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

const loans = [
    { friendName: 'Amit', amount: 500.5, dueDate: daysFromNow(-3) },   // overdue
    { friendName: 'Priya', amount: 1200, dueDate: daysFromNow(5) },    // upcoming
    { friendName: 'Rahul', amount: 300, dueDate: daysFromNow(-10) },  // overdue
    { friendName: 'Sneha', amount: 750, dueDate: daysFromNow(2) },    // upcoming
];

for (const l of loans) {
    const r = await fetch(base + '/loans', { method: 'POST', headers: auth, body: JSON.stringify(l) }).then(json);
    console.log('created', r.friendName, r.amount, r.dueDate, 'overdue=' + r.isOverdue);
}

const list = await fetch(base + '/loans', { headers: auth }).then(json);
const repaid = await fetch(base + `/loans/${list[0].id}/repaid`, {
    method: 'PATCH', headers: auth, body: JSON.stringify({}),
}).then(json);
console.log('marked repaid:', repaid.friendName);
console.log('summary ->', await fetch(base + '/summary', { headers: auth }).then(json));
