/**
 * Test Suite para IctusSOS v2.0.0 - Validación clínica de BE-FAST, VAN (LVO) y Arritmias
 */

const assert = require('assert');
const IctusSOS = require('./ictussos');

console.log('--- INICIANDO TESTS CLÍNICOS DE ICTUSSOS v2.0.0 ---');

// Test 1: Ictus posterior aislado (B - Equilibrio + E - Ojos) que fallaba en FAST clásico
const resBEFASTPosterior = IctusSOS.evaluarBEFAST({
  equilibrio: true,
  ojos: true,
  cara: false,
  brazo: false,
  habla: false
});
assert.strictEqual(resBEFASTPosterior.sospechaIctus, true);
assert.strictEqual(resBEFASTPosterior.territorioProbable, 'posterior_vertebrobasilar');
assert.strictEqual(resBEFASTPosterior.urgencia, 'alarma_roja');
console.log('✅ Test 1 Superado: Ictus posterior vertebrobasilar detectado con BE-FAST (resolviendo el punto ciego de FAST).');

// Test 2: FAST clásico retrocompatible
const resFAST = IctusSOS.evaluarFAST({
  cara: true,
  brazo: true,
  habla: false
});
assert.strictEqual(resFAST.sospechaIctus, true);
assert.strictEqual(resFAST.numSignosPositivos, 2);
console.log('✅ Test 2 Superado: Retrocompatibilidad con FAST clásico preservada.');

// Test 3: Oclusión de Gran Vaso (LVO) mediante escala VAN
const lvoPositivo = IctusSOS.evaluarLVO_VAN({
  debilidadBrazo: true,
  alteracionVisual: true,
  afasiaComprension: false,
  negligenciaEspacial: false
});
assert.strictEqual(lvoPositivo.sospechaGranVaso, true);
assert.ok(lvoPositivo.recomendacionTransporte.includes('TROMBECTOMÍA'));
console.log('✅ Test 3 Superado: Escala VAN detecta correctamente Oclusión de Gran Vaso para trombectomía.');

// Test 4: Oclusión de Gran Vaso negativa (solo debilidad motora sin síntomas corticales)
const lvoNegativo = IctusSOS.evaluarLVO_VAN({
  debilidadBrazo: true,
  alteracionVisual: false,
  afasiaComprension: false,
  negligenciaEspacial: false
});
assert.strictEqual(lvoNegativo.sospechaGranVaso, false);
console.log('✅ Test 4 Superado: Escala VAN discrimina debilidad aislada sin afectación cortical.');

// Test 5: Ritmo cardíaco regular normal
const timestampsRegulares = [];
let t = 1000;
for (let i = 0; i < 15; i++) {
  timestampsRegulares.push(t);
  t += 800; // 800ms = 75 bpm constante
}
const ritmoNormal = IctusSOS.analizarRitmoPulso(timestampsRegulares);
assert.strictEqual(ritmoNormal.ok, true);
assert.strictEqual(ritmoNormal.sospechaArritmia, false);
assert.strictEqual(ritmoNormal.clasificacionRitmo, 'regular');
console.log('✅ Test 5 Superado: Ritmo sinusal regular verificado sin falsas alarmas.');

// Test 6: Arritmia absoluta caótica (Fibrilación Auricular)
const timestampsFA = [
  0, 620, 1150, 1500, 2200, 2700, 3100, 3900, 4350, 5100, 5500, 6300, 6750, 7500
];
const ritmoFA = IctusSOS.analizarRitmoPulso(timestampsFA);
assert.strictEqual(ritmoFA.ok, true);
assert.strictEqual(ritmoFA.sospechaArritmia, true);
assert.strictEqual(ritmoFA.clasificacionRitmo, 'irregular_arritmico');
console.log('✅ Test 6 Superado: Fibrilación auricular detectada por variabilidad RR.');

// Test 7: Ventana terapéutica con ventana de trombectomía extendida (hasta 24h)
const ahora = new Date();
const haceCincoHoras = new Date(ahora.getTime() - 5 * 3600000);
const horaCincoH = ('0' + haceCincoHoras.getHours()).slice(-2) + ':' + ('0' + haceCincoHoras.getMinutes()).slice(-2);
const ventana5h = IctusSOS.calcularVentanaTerapeutica(horaCincoH);
assert.strictEqual(ventana5h.dentroVentanaTrombolisis, false);
assert.strictEqual(ventana5h.dentroVentanaTrombectomia, true);
console.log('✅ Test 7 Superado: Ventana extendida de trombectomía mecánica (24h) calculada correctamente.');

// Test 8: Algoritmo PPG de luminosidad de canal rojo
const fakeFrame = {
  data: new Uint8ClampedArray([220, 50, 50, 255, 230, 40, 40, 255, 210, 60, 60, 255, 225, 45, 45, 255])
};
const brilloRojo = IctusSOS.calcularBrilloRojoPPG(fakeFrame);
assert.ok(brilloRojo >= 200);
console.log('✅ Test 8 Superado: Extracción de canal rojo PPG validada.');

console.log('\n--- TODOS LOS 8 TESTS DE ICTUSSOS v2.0.0 SUPERADOS EXITOSAMENTE ---');
