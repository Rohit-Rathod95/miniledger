const base = 'http://localhost:4000';
const phone = '9876543210';

const json = (r) => r.json();

(async () => {
    const otp = await fetch(base + '/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
    }).then(json);
    console.log('request-otp ->', otp);

    const verified = await fetch(base + '/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp: otp.otp }),
    }).then(json);
    console.log('verify-otp ->', verified);

    const auth = {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + verified.token,
    };

    const created = await fetch(base + '/loans', {
        method: 'POST',
        headers: auth,
        body: JSON.stringify({ friendName: 'Amit', amount: 500.5, dueDate: '2026-10-20' }),
    }).then(json);
    console.log('create loan ->', created);

    console.log('list ->', await fetch(base + '/loans', { headers: auth }).then(json));
    console.log('summary ->', await fetch(base + '/summary', { headers: auth }).then(json));
})();
