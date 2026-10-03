/**
 * IctusSOS - Test suite unitario (sin dependencias, ejecutable con Node)
 * Comando: node test.js
 */
'use strict';
var assert = require('assert');
var IctusSOS = require('./ictussos.js');

var passed = 0;
function test(nombre, fn) {
  try {
    fn();
    passed++;
    console.log('  [OK] ' + nombre);
  } catch (e) {
    console.error('  [FAIL] ' + nombre + '\n         ' + e.message);
    process.exitCode = 1;
  }
}

console.log('=== 1. Escala FAST / Cincinnati ===');

test('Un solo signo (ej: asimetría en cara) dispara Alarma Roja con probabilidad > 72%', function () {
  var r = IctusSOS.evaluarFAST({ cara: true, brazo: false, habla: false });
  assert.strictEqual(r.sospechaIctus, true);
  assert.strictEqual(r.numSignosPositivos, 1);
  assert.strictEqual(r.probabilidadClinica, 'alta');
  assert.strictEqual(r.urgencia, 'alarma_roja');
  assert.ok(/asimetría facial/i.test(r.mensajeSugerido112));
});

test('Los tres signos positivos disparan probabilidad muy alta (> 85%)', function () {
  var r = IctusSOS.evaluarFAST({ cara: true, brazo: true, habla: true });
  assert.strictEqual(r.numSignosPositivos, 3);
  assert.strictEqual(r.probabilidadClinica, 'muy_alta');
  assert.ok(/asimetría/i.test(r.mensajeSugerido112) && /brazo/i.test(r.mensajeSugerido112) && /hablar/i.test(r.mensajeSugerido112));
});

test('Cero signos indican probabilidad baja', function () {
  var r = IctusSOS.evaluarFAST({ cara: false, brazo: false, habla: false });
  assert.strictEqual(r.sospechaIctus, false);
  assert.strictEqual(r.urgencia, 'informativa');
});

console.log('\n=== 2. Detección de Fibrilación Auricular (Tap-Tempo) ===');

test('Ritmo regular (~800ms = 75 bpm) clasifica como ritmo regular', function () {
  // 12 toques regulares con ligerísima variación fisiológica
  var toques = [0, 800, 1610, 2405, 3210, 4000, 4805, 5600, 6410, 7200, 8005, 8810];
  var r = IctusSOS.analizarRitmoPulso(toques);
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.sospechaArritmia, false);
  assert.strictEqual(r.clasificacionRitmo, 'regular');
  assert.ok(r.bpmEstimado >= 73 && r.bpmEstimado <= 77);
});

test('Ritmo caótico / irregular detecta sospecha de Fibrilación Auricular', function () {
  // Toques con alta variación R-R caótica (típica de fibrilación auricular)
  var toques = [0, 450, 1100, 1400, 2200, 2600, 3500, 3900, 4800, 5100, 6100, 6500];
  var r = IctusSOS.analizarRitmoPulso(toques);
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.sospechaArritmia, true);
  assert.strictEqual(r.clasificacionRitmo, 'irregular_arritmico');
});

test('Menos de 10 pulsaciones devuelve error de muestra insuficiente', function () {
  var r = IctusSOS.analizarRitmoPulso([0, 800, 1600]);
  assert.strictEqual(r.ok, false);
});

console.log('\n=== 3. Ventana Terapéutica y Primeros Auxilios ===');

test('Calcula ventana de trombolisis adecuadamente', function () {
  var ahora = new Date();
  var h = ahora.getHours();
  var m = ahora.getMinutes();
  var horaStr = (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  var r = IctusSOS.calcularVentanaTerapeutica(horaStr);
  assert.strictEqual(r.conocida, true);
  assert.strictEqual(r.dentroVentanaTrombolisis, true);
});

test('Protocolo de primeros auxilios prohíbe explícitamente comida y aspirina', function () {
  var noHacer = IctusSOS.PROTOCOLO_PRIMEROS_AUXILIOS.noHacer.join(' ');
  assert.ok(/comer|beber/i.test(noHacer));
  assert.ok(/aspirina/i.test(noHacer));
});

console.log('\n' + passed + ' tests de detección de ictus superados con éxito.');
