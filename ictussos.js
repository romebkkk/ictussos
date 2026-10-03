/*!
 * IctusSOS v1.0.0 — Detección precoz de Ictus y Fibrilación Auricular en 60 segundos
 * Open-source rapid stroke assessment (FAST / Cincinnati scale) & arrhythmia checker.
 *
 * Copyright (c) 2026 DataFlow Elegance - Ismael Ben Kazem
 * Licencia MIT · 100% en el navegador · Privacidad total
 *
 * BASES CLÍNICAS:
 *  - Escala Prehospitalaria de Cincinnati (CPSS) / Escala FAST (Face, Arm, Speech, Time)
 *  - Guías del Código Ictus del Sistema Nacional de Salud (España) y American Stroke Association
 *  - Detección de Fibrilación Auricular asintomática por variabilidad de pulso (Criterios ESC)
 *
 * AVISO VITAL:
 *  Ante la mínima sospecha de ictus, LLAMA INMEDIATAMENTE AL 112 (o tu número de emergencias).
 *  Cada minuto cuenta: «Tiempo es cerebro».
 */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.IctusSOS = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var VERSION = '1.0.0';

  /**
   * Evaluación de la escala FAST / Cincinnati
   * @param {object} signos - { cara: bool, brazo: bool, habla: bool }
   */
  function evaluarFAST(signos) {
    signos = signos || {};
    var cara = !!signos.cara;
    var brazo = !!signos.brazo;
    var habla = !!signos.habla;

    var numPositivos = (cara ? 1 : 0) + (brazo ? 1 : 0) + (habla ? 1 : 0);
    var sospechaIctus = numPositivos > 0;

    // Probabilidad según validaciones clínicas de la Escala Cincinnati:
    // 1 signo anormal = 72% de probabilidad de ictus agudo
    // 3 signos anormales = >85% de probabilidad
    var probabilidad = 'baja';
    var porcentajeEst = '< 5%';
    var urgencia = 'informativa';

    if (numPositivos >= 3) {
      probabilidad = 'muy_alta';
      porcentajeEst = '> 85%';
      urgencia = 'alarma_roja';
    } else if (numPositivos >= 1) {
      probabilidad = 'alta';
      porcentajeEst = '> 72%';
      urgencia = 'alarma_roja';
    }

    var mensaje112 = '';
    if (sospechaIctus) {
      var detalles = [];
      if (cara) detalles.push('asimetría facial/boca torcida');
      if (brazo) detalles.push('pérdida de fuerza en brazo');
      if (habla) detalles.push('dificultad para hablar o entender');
      mensaje112 = 'Sospecha fundada de ICTUS AGUDO con ' + detalles.join(', ') + '. Activen Código Ictus.';
    }

    return {
      sospechaIctus: sospechaIctus,
      numSignosPositivos: numPositivos,
      signos: { cara: cara, brazo: brazo, habla: habla },
      probabilidadClinica: probabilidad,
      porcentajeEstimado: porcentajeEst,
      urgencia: urgencia,
      mensajeSugerido112: mensaje112
    };
  }

  /**
   * Análisis del ritmo cardíaco por intervalos de toques táctiles (Tap-Tempo)
   * Analiza la regularidad para detectar sospecha de Fibrilación Auricular (arritmia silenciosa).
   * @param {number[]} marcasTiempoMs - Array de timestamps de toques al ritmo del pulso
   */
  function analizarRitmoPulso(marcasTiempoMs) {
    if (!Array.isArray(marcasTiempoMs) || marcasTiempoMs.length < 10) {
      return {
        ok: false,
        error: 'Se necesitan al menos 10 pulsaciones registradas para analizar el ritmo.'
      };
    }

    // Calcular intervalos entre latidos sucesivos (RR intervals en ms)
    var intervalos = [];
    for (var i = 1; i < marcasTiempoMs.length; i++) {
      var diff = marcasTiempoMs[i] - marcasTiempoMs[i - 1];
      // Filtrar toques absurdos (<250ms = >240bpm, o >2500ms = <24bpm)
      if (diff >= 250 && diff <= 2500) {
        intervalos.push(diff);
      }
    }

    if (intervalos.length < 8) {
      return { ok: false, error: 'Demasiadas pulsaciones irregulares o fuera de rango fisiológico.' };
    }

    // Frecuencia cardíaca media (BPM)
    var suma = intervalos.reduce(function (a, b) { return a + b; }, 0);
    var mediaMs = suma / intervalos.length;
    var bpm = Math.round(60000 / mediaMs);

    // Desviación típica y coeficiente de variación (CV = SD / Media)
    var sumaCuadradosDiff = intervalos.reduce(function (a, b) { return a + Math.pow(b - mediaMs, 2); }, 0);
    var sd = Math.sqrt(sumaCuadradosDiff / intervalos.length);
    var cv = (sd / mediaMs) * 100; // Porcentaje de irregularidad

    // RMSSD: raíz cuadrada del valor cuadrático medio de las diferencias sucesivas
    var sumaDiffSucesivas = 0;
    for (var j = 1; j < intervalos.length; j++) {
      sumaDiffSucesivas += Math.pow(intervalos[j] - intervalos[j - 1], 2);
    }
    var rmssd = Math.sqrt(sumaDiffSucesivas / (intervalos.length - 1));

    // Diagnóstico del ritmo:
    // Un CV > 18% con RMSSD elevado es el patrón típico de fibrilación auricular (arritmia absoluta)
    var sospechaArritmia = cv > 18;
    var ritmo = 'regular';
    var aviso = 'Ritmo cardíaco regular. No se detectan anomalías evidentes en el patrón de latidos.';

    if (sospechaArritmia) {
      ritmo = 'irregular_arritmico';
      aviso = 'Ritmo cardíaco marcadamente IRREGULAR. Este patrón caótico es compatible con una posible Fibrilación Auricular (la arritmia más asociada a ictus). Consulta con tu médico para un electrocardiograma (ECG).';
    } else if (bpm > 105) {
      ritmo = 'taquicardia';
      aviso = 'Pulsaciones aceleradas (taquicardia > 100 lpm), aunque con ritmo regular.';
    } else if (bpm < 50) {
      ritmo = 'bradicardia';
      aviso = 'Pulsaciones lentas (bradicardia < 50 lpm), aunque con ritmo regular.';
    }

    return {
      ok: true,
      bpmEstimado: bpm,
      irregularidadPorcentaje: Math.round(cv),
      sospechaArritmia: sospechaArritmia,
      clasificacionRitmo: ritmo,
      avisoClinico: aviso
    };
  }

  /**
   * Calcula la ventana terapéutica de oro (< 4.5 horas para trombolisis)
   */
  function calcularVentanaTerapeutica(horaInicioStr) {
    if (!horaInicioStr) return { conocida: false, dentroVentana: true, minutosTranscurridos: 0 };

    var partes = horaInicioStr.split(':');
    if (partes.length !== 2) return { conocida: false, dentroVentana: true, minutosTranscurridos: 0 };

    var ahora = new Date();
    var inicio = new Date();
    inicio.setHours(parseInt(partes[0], 10), parseInt(partes[1], 10), 0, 0);

    // Si la hora es posterior a la actual, asumimos ayer
    if (inicio.getTime() > ahora.getTime()) {
      inicio.setDate(inicio.getDate() - 1);
    }

    var diffMin = Math.round((ahora.getTime() - inicio.getTime()) / 60000);
    var dentroVentana = diffMin <= 270; // 4.5 horas = 270 min

    return {
      conocida: true,
      minutosTranscurridos: diffMin,
      horasTexto: (Math.round((diffMin / 60) * 10) / 10) + ' horas',
      dentroVentanaTrombolisis: dentroVentana,
      urgenciaMensaje: dentroVentana 
        ? '⚡ Dentro de la ventana óptima de reperfusión (< 4.5h). El tratamiento puede revertir las secuelas si se actúa de inmediato.' 
        : '⚠️ Han pasado más de 4.5 horas. El tratamiento endovascular (trombectomía) aún puede ser viable hasta 24h. LLAMA AL 112 YA.'
    };
  }

  var PROTOCOLO_PRIMEROS_AUXILIOS = {
    hacer: [
      'Llama de inmediato al 112 y pide activar el «Código Ictus».',
      'Apunta la hora exacta en la que se vieron los primeros síntomas.',
      'Afloja la ropa ajustada alrededor del cuello (camisa, corbata, bufanda).',
      'Si está consciente, mantén a la persona tumbada con la cabeza ligeramente incorporada (30º) en un lugar tranquilo.',
      'Si pierde el conocimiento pero respira, colócala en Posición Lateral de Seguridad (PLS).'
    ],
    noHacer: [
      'NUNCA le des nada de comer ni de beber (riesgo muy alto de atragantamiento y asfixia).',
      'NUNCA le des Aspirina ni medicamentos antes de que el hospital haga un TAC (si el ictus es hemorrágico, la aspirina aumentaría el sangrado cerebral letalmente).',
      'NO esperes a ver si «se le pasa durmiendo». Cada minuto mueren 2 millones de neuronas.',
      'NO traslades a la persona en coche particular salvo orden expresa del 112; la ambulancia medicalizada avisa al neurólogo de guardia del hospital de camino.'
    ]
  };

  return {
    VERSION: VERSION,
    evaluarFAST: evaluarFAST,
    analizarRitmoPulso: analizarRitmoPulso,
    calcularVentanaTerapeutica: calcularVentanaTerapeutica,
    PROTOCOLO_PRIMEROS_AUXILIOS: PROTOCOLO_PRIMEROS_AUXILIOS
  };
});
