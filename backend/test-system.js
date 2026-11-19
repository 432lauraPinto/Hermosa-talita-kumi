const http = require('http');

const BASE_URL = 'http://localhost:5000/api';

function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${path}`);
    const postData = body ? JSON.stringify(body) : null;

    const headers = {
      'Content-Type': 'application/json'
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (postData) headers['Content-Length'] = Buffer.byteLength(postData);

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: headers,
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Timeout en ${method} ${path}`));
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('   BATERÍA DE PRUEBAS — HERMOSA TALITA KUMI SPA                 ');
  console.log('   Multi-sucursal, Calendario Lun-Sáb, Notificaciones, IA       ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(name, condition, extraInfo = '') {
    if (condition) {
      console.log(`[PASS] ${name}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name} ${extraInfo}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    const health = await makeRequest('GET', '/health');
    assert('1. Endpoint de Salud /api/health', health.status === 200 && health.body.status === 'ONLINE');

    // 2. Sucursales (4 sedes oficiales: Villa Fátima, UPEA – El Alto, Ceja – El Alto, Max Paredes)
    const branches = await makeRequest('GET', '/branches');
    assert('2. Consulta de Sucursales /api/branches (4 sedes oficiales)', 
      branches.status === 200 && 
      branches.body.branches.length === 4 &&
      branches.body.branches.some(b => b.name === 'Villa Fátima') &&
      branches.body.branches.some(b => b.name === 'UPEA – El Alto') &&
      branches.body.branches.some(b => b.name === 'Ceja – El Alto') &&
      branches.body.branches.some(b => b.name === 'Max Paredes')
    );
    console.log(`       -> Sedes registradas: ${branches.body.branches.map(b => b.name).join(' | ')}`);

    // 3. Servicios
    const services = await makeRequest('GET', '/services');
    assert('3. Catálogo de Servicios /api/services', services.status === 200 && services.body.services.length >= 40);

    // 4. Login Cliente
    const loginClient = await makeRequest('POST', '/auth/login', {
      email: 'maria.gonzalez@example.com',
      password: 'Cliente123!'
    });
    assert('4. Login de Cliente (María González)', loginClient.status === 200 && loginClient.body.token != null);
    const clientToken = loginClient.body.token;

    // 5. Login Admin General Oficial
    const loginAdmin = await makeRequest('POST', '/auth/login', {
      email: 'admin@talitakumi.com',
      password: 'Admin123!'
    });
    assert('5. Login de Administrador General (admin@talitakumi.com)', loginAdmin.status === 200 && loginAdmin.body.user.role === 'ADMINISTRADOR');
    const adminToken = loginAdmin.body.token;

    // 6. Calendario: Lunes a Sábado disponible
    // Usamos una fecha futura que caiga en Lunes (ej. 2026-11-09) y Domingo (2026-11-08)
    const mondaySlots = await makeRequest('GET', '/appointments/available-slots?branch_id=1&date=2026-11-09&service_id=1');
    assert('6. Calendario: Día Lunes genera slots automáticamente', 
      mondaySlots.status === 200 && 
      mondaySlots.body.isClosed === false && 
      mondaySlots.body.availableSlots.length > 0
    );

    // 7. Calendario: Domingo bloqueado por defecto
    const sundaySlots = await makeRequest('GET', '/appointments/available-slots?branch_id=1&date=2026-11-08');
    assert('7. Calendario: Domingos cerrados por defecto (Regla de descanso)', 
      sundaySlots.status === 200 && 
      sundaySlots.body.isClosed === true && 
      sundaySlots.body.slots.length === 0
    );

    // 8. Ocupación de horario y confirmación automática con datos de sede
    const testDate = '2026-11-16'; // Lunes
    const testTime = '11:00';
    const book1 = await makeRequest('POST', '/appointments', {
      branch_id: 1,
      service_id: 1,
      date: testDate,
      time: testTime,
      observations: 'Cita de prueba automatizada'
    }, clientToken);

    assert('8. Creación de Reserva con cálculo de hora fin y notificación', 
      book1.status === 201 && 
      book1.body.appointment != null &&
      book1.body.appointment.end_time != null &&
      book1.body.appointment.branch_name.includes('Villa Fátima')
    );
    const createdAppointmentId = book1.body.appointment.id;

    // 9. Prevención de colisión en la misma sede (HTTP 409 Conflict)
    const book2 = await makeRequest('POST', '/appointments', {
      branch_id: 1,
      service_id: 1,
      date: testDate,
      time: testTime,
      observations: 'Intento colisión en misma sede'
    }, clientToken);
    assert('9. Prevención de Colisión en misma sucursal (HTTP 409 Conflict)', book2.status === 409);

    // 10. Consulta de Notificaciones del Cliente
    const notifs = await makeRequest('GET', '/notifications', null, clientToken);
    assert('10. Centro de Notificaciones del Cliente (/api/notifications)', 
      notifs.status === 200 && 
      notifs.body.notifications.length > 0 &&
      notifs.body.notifications[0].title.includes('Hermosa Talita Kumi')
    );
    console.log(`       -> Última notificación: "${notifs.body.notifications[0].title}"`);

    // 11. Liberación automática del horario al cancelar reserva
    const cancelRes = await makeRequest('DELETE', `/appointments/${createdAppointmentId}`, null, clientToken);
    assert('11. Cancelación de Reserva y liberación inmediata del horario', cancelRes.status === 200);

    // 12. Verificar que el horario cancelado vuelve a estar libre
    const verifyFree = await makeRequest('GET', `/appointments/available-slots?branch_id=1&date=${testDate}&service_id=1`);
    assert('12. Comprobación de que el horario vuelve a estar disponible tras cancelar', 
      verifyFree.status === 200 && verifyFree.body.availableSlots.includes(testTime)
    );

    // 13. Agente IA Conversacional: Centro Estético Cristiano Talita Kumi
    const chatTalita = await makeRequest('POST', '/chat', { message: '¿Por qué se llaman Hermosa Talita Kumi?' });
    assert('13. Agente IA: Significado y bienvenida cristiana', 
      chatTalita.status === 200 && (
        chatTalita.body.reply.toLowerCase().includes('talita') ||
        chatTalita.body.reply.toLowerCase().includes('levántate') ||
        chatTalita.body.reply.toLowerCase().includes('dios') ||
        chatTalita.body.reply.toLowerCase().includes('estético')
      )
    );

    // 14. Dashboard Administrativo
    const stats = await makeRequest('GET', '/dashboard/stats', null, adminToken);
    assert('14. Dashboard Administrativo con métricas centralizadas', stats.status === 200 && stats.body.stats != null);

    console.log('\n================================================================');
    console.log(` RESULTADO FINAL: ${passed} pruebas exitosas, ${failed} fallidas.`);
    console.log('================================================================');

    if (failed === 0) {
      process.exit(0);
    } else {
      process.exit(1);
    }

  } catch (err) {
    console.error('Error durante la ejecución del test suite:', err);
    process.exit(1);
  }
}

// Iniciar servidor y ejecutar pruebas
const app = require('./src/server');
setTimeout(() => {
  runTestSuite();
}, 1500);
