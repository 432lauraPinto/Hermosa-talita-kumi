const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const {
  validarNombreCompleto,
  validarTelefonoBolivia,
  validarFechaNacimiento,
  evaluarFortalezaPassword,
} = require('../functions/src/lib/validators');

describe('Validadores puros de registro y perfil (validators.js)', () => {
  it('valida y normaliza nombre y apellido correctamente', () => {
    const ok = validarNombreCompleto('  Ana   María   Quispe  ');
    assert.equal(ok.valido, true);
    assert.equal(ok.valor, 'Ana María Quispe');

    assert.equal(validarNombreCompleto('Ana').valido, false);
    assert.equal(validarNombreCompleto('Ana 1234').valido, false);
    assert.equal(validarNombreCompleto('   ').valido, false);
  });

  it('valida y normaliza números celulares de Bolivia (8 dígitos iniciando con 6 o 7)', () => {
    const r1 = validarTelefonoBolivia('77197857');
    assert.equal(r1.valido, true);
    assert.equal(r1.valor, '+591 77197857');

    const r2 = validarTelefonoBolivia('+591 69123456');
    assert.equal(r2.valido, true);
    assert.equal(r2.valor, '+591 69123456');

    const r3 = validarTelefonoBolivia('59176230119');
    assert.equal(r3.valido, true);
    assert.equal(r3.valor, '+591 76230119');

    // Fijo La Paz, incompleto o vacío -> rechazados
    assert.equal(validarTelefonoBolivia('22441122').valido, false);
    assert.equal(validarTelefonoBolivia('+591 ').valido, false);
    assert.equal(validarTelefonoBolivia('71234').valido, false);
  });

  it('valida fecha de nacimiento opcional sin permitir fechas futuras o inválidas', () => {
    const refNow = new Date('2026-11-24T12:00:00Z');
    assert.equal(validarFechaNacimiento(null, refNow).valido, true);
    assert.equal(validarFechaNacimiento('', refNow).valido, true);
    assert.equal(validarFechaNacimiento('1995-04-12', refNow).valido, true);

    assert.equal(validarFechaNacimiento('2030-01-01', refNow).valido, false);
    assert.equal(validarFechaNacimiento('2020-05-10', refNow).valido, false);
    assert.equal(validarFechaNacimiento('1995-02-30', refNow).valido, false);
  });

  it('evalúa fortaleza de contraseña según política (8+, 1 mayúscula y 1 número)', () => {
    const debil = evaluarFortalezaPassword('123456');
    assert.equal(debil.cumplePolitica, false);
    assert.equal(debil.nivel, 'debil');

    const sinMayus = evaluarFortalezaPassword('clave1234');
    assert.equal(sinMayus.cumplePolitica, false);

    const fuerte = evaluarFortalezaPassword('Talita2026!');
    assert.equal(fuerte.cumplePolitica, true);
    assert.equal(fuerte.nivel, 'fuerte');
  });
});
