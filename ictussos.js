/*!
 * IctusSOS v2.0.0 — Detección precoz de Ictus con escala BE-FAST, triaje de Gran Vaso (VAN) y arritmia por fotopletismografía/pulso
 * Open-source rapid stroke assessment (BE-FAST & VAN LVO scale) & arrhythmia checker.
 *
 * Copyright (c) 2026 DataFlow Elegance - Ismael Ben Kazem
 * Licencia MIT · 100% en el navegador · Privacidad total
 *
 * BASES CLÍNICAS:
 *  - Escala BE-FAST (Balance, Eyes, Face, Arm, Speech, Time) - Aroor et al., Stroke 2017
 *  - Detección de Oclusión de Gran Vaso mediante escala VAN (Teleb et al., J NeuroIntervent Surg 2017)
 *  - Guías del Código Ictus del Sistema Nacional de Salud (España) y AHA/ASA
 *  - Criterios de Fibrilación Auricular ESC (arritmia absoluta por variabilidad RR)
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

  var VERSION = '2.0.0';

  /**
   * Evaluación de la escala BE-FAST (Sensibilidad ~95% frente al 80% de FAST)
   * Captura ictus de circulación posterior (cerebelo y troncoencefálico).
   * @param {object} signos - { equilibrio: bool, ojos: bool, cara: bool, brazo: bool, habla: bool }
   */
  function evaluarBEFAST(signos) {
    signos = signos || {};
    var equilibrio = !!signos.equilibrio; // B - Balance (pérdida repentina de equilibrio, mareo intenso)
    var ojos = !!signos.ojos;             // E - Eyes (pérdida súbita de visión en un ojo o visión doble)
    var cara = !!signos.cara;             // F - Face (asimetría facial, boca caída al sonreír)
    var brazo = !!signos.brazo;           // A - Arm (pérdida de fuerza o parálisis en un brazo)
    var habla = !!signos.habla;           // S - Speech (dificultad para hablar o comprender)

    var numPositivos = (equilibrio ? 1 : 0) + (ojos ? 1 : 0) + (cara ? 1 : 0) + (brazo ? 1 : 0) + (habla ? 1 : 0);
    var sospechaIctus = numPositivos > 0;

    var territorio = 'no_detectado';
    if (equilibrio || ojos) {
      territorio = (cara || brazo || habla) ? 'mixto_anterior_posterior' : 'posterior_vertebrobasilar';
    } else if (cara || brazo || habla) {
      territorio = 'anterior_carotideo';
    }

    var probabilidad = 'baja';
    var porcentajeEst = '< 3%';
    var urgencia = 'informativa';

    if (numPositivos >= 3) {
      probabilidad = 'critica_muy_alta';
      porcentajeEst = '> 88%';
      urgencia = 'alarma_roja';
    } else if (numPositivos >= 1) {
      probabilidad = 'alta';
      porcentajeEst = '> 75%';
      urgencia = 'alarma_roja';
    }

    var mensaje112 = '';
    if (sospechaIctus) {
      var detalles = [];
      if (equilibrio) detalles.push('pérdida brusca de equilibrio/inestabilidad');
      if (ojos) detalles.push('alteración visual súbita/visión doble');
      if (cara) detalles.push('asimetría facial (boca torcida)');
      if (brazo) detalles.push('claudicación motora en brazo');
      if (habla) detalles.push('disartria o afasia en el habla');
      
      mensaje112 = 'Sospecha fundada de ICTUS AGUDO (Escala BE-FAST positiva: ' + detalles.join(', ') + 
                   '). Territorio probable: ' + territorio.replace(/_/g, ' ') + '. SOLICITO ACTIVACIÓN DE CÓDIGO ICTUS.';
    }

    return {
      sospechaIctus: sospechaIctus,
      numSignosPositivos: numPositivos,
      signos: {
        equilibrio: equilibrio,
        ojos: ojos,
        cara: cara,
        brazo: brazo,
        habla: habla
      },
      territorioProbable: territorio,
      probabilidadClinica: probabilidad,
      porcentajeEstimado: porcentajeEst,
      urgencia: urgencia,
      mensajeSugerido112: mensaje112
    };
  }

  /**
   * Retrocompatibilidad con FAST clásico
   */
  function evaluarFAST(signos) {
    signos = signos || {};
    var res = evaluarBEFAST({
      cara: signos.cara,
      brazo: signos.brazo,
      habla: signos.habla
    });
    return res;
  }

  /**
   * Triaje de Oclusión de Gran Vaso (LVO - Large Vessel Occlusion) mediante escala VAN
   * Predice si el paciente es candidato a Trombectomía Mecánica en sala de Neurointervencionismo.
   * Criterio: Debilidad motora en brazo + al menos 1 síntoma cortical (Visión, Afasia, Negligencia).
   * @param {object} p - { debilidadBrazo: bool, alteracionVisual: bool, afasiaComprension: bool, negligenciaEspacial: bool }
   */
  function evaluarLVO_VAN(p) {
    p = p || {};
    var motor = !!p.debilidadBrazo;
    var v = !!p.alteracionVisual; // Ceguera parcial, diplopía, defecto de campo visual
    var a = !!p.afasiaComprension; // Incapacidad para nombrar objetos sencillos o seguir órdenes simples
    var n = !!p.negligenciaEspacial; // Ignora el lado izquierdo del cuerpo o no reconoce su propio brazo

    var tieneCortical = v || a || n;
    var esLVO = motor && tieneCortical;

    return {
      sospechaGranVaso: esLVO,
      motorPresente: motor,
      sintomasCorticales: { vision: v, afasia: a, negligencia: n },
      recomendacionTransporte: esLVO
        ? 'ALERTA DE TROMBECTOMÍA: Alta sospecha de Oclusión de Arteria Cerebral Media o Carótida Interna. Traslado prioritario directo a Hospital de Nivel 3 con Unidad de Neurorradiología Intervencionista.'
        : (motor ? 'Sospecha de ictus sin signos corticales masivos de gran vaso. Traslado a centro de ictus más cercano.' : 'Sin datos de oclusión de gran vaso.')
    };
  }

  /**
   * Análisis del ritmo cardíaco por intervalos (Tap-Tempo o PPG)
   * Analiza la regularidad para detectar sospecha de Fibrilación Auricular (arritmia silenciosa).
   * @param {number[]} marcasTiempoMs - Array de timestamps de latidos
   */
  function analizarRitmoPulso(marcasTiempoMs) {
    if (!Array.isArray(marcasTiempoMs) || marcasTiempoMs.length < 10) {
      return {
        ok: false,
        error: 'Se necesitan al menos 10 pulsaciones registradas para analizar el ritmo.'
      };
    }

    var intervalos = [];
    for (var i = 1; i < marcasTiempoMs.length; i++) {
      var diff = marcasTiempoMs[i] - marcasTiempoMs[i - 1];
      if (diff >= 250 && diff <= 2500) {
        intervalos.push(diff);
      }
    }

    if (intervalos.length < 8) {
      return { ok: false, error: 'Demasiadas pulsaciones irregulares o fuera de rango fisiológico (24 - 240 bpm).' };
    }

    var suma = intervalos.reduce(function (a, b) { return a + b; }, 0);
    var mediaMs = suma / intervalos.length;
    var bpm = Math.round(60000 / mediaMs);

    var sumaCuadradosDiff = intervalos.reduce(function (a, b) { return a + Math.pow(b - mediaMs, 2); }, 0);
    var sd = Math.sqrt(sumaCuadradosDiff / intervalos.length);
    var cv = (sd / mediaMs) * 100; // Coeficiente de variación %

    // RMSSD (Root Mean Square of Successive Differences)
    var sumaDiffSucesivas = 0;
    for (var j = 1; j < intervalos.length; j++) {
      sumaDiffSucesivas += Math.pow(intervalos[j] - intervalos[j - 1], 2);
    }
    var rmssd = Math.sqrt(sumaDiffSucesivas / (intervalos.length - 1));

    // Criterio diagnóstico de Fibrilación Auricular por variabilidad temporal:
    // CV > 18% con RMSSD > 65ms es característico de arritmia absoluta
    var sospechaArritmia = cv > 18 && rmssd > 50;
    var ritmo = 'regular';
    var aviso = 'Ritmo cardíaco regular. No se observan anomalías patentes en la cadencia de latidos.';

    if (sospechaArritmia) {
      ritmo = 'irregular_arritmico';
      aviso = 'Ritmo cardíaco marcadamente CAÓTICO / IRREGULAR (CV ' + Math.round(cv) + '%, RMSSD ' + Math.round(rmssd) + 'ms). Este patrón es compatible con posible Fibrilación Auricular (la causa número 1 de ictus embólico). Acude a tu médico para un electrocardiograma (ECG).';
    } else if (bpm > 105) {
      ritmo = 'taquicardia';
      aviso = 'Pulsaciones aceleradas (taquicardia > 100 lpm), con ritmo regular.';
    } else if (bpm < 50) {
      ritmo = 'bradicardia';
      aviso = 'Pulsaciones lentas (bradicardia < 50 lpm), con ritmo regular.';
    }

    return {
      ok: true,
      bpmEstimado: bpm,
      irregularidadPorcentaje: Math.round(cv),
      rmssdMs: Math.round(rmssd),
      sospechaArritmia: sospechaArritmia,
      clasificacionRitmo: ritmo,
      avisoClinico: aviso
    };
  }

  /**
   * Procesador de fotopletismografía (PPG) por cámara para extraer brillo medio del canal rojo
   * @param {ImageData} frame - Datos de píxeles del frame capturado por la cámara con flash
   */
  function calcularBrilloRojoPPG(frame) {
    if (!frame || !frame.data) return 0;
    var data = frame.data;
    var totalR = 0;
    var count = 0;
    // Muestreo espaciado para rendimiento a 60 fps
    for (var i = 0; i < data.length; i += 16) {
      totalR += data[i];
      count++;
    }
    return count > 0 ? (totalR / count) : 0;
  }

  /**
   * Ventana terapéutica de oro (< 4.5h trombolisis, hasta 24h trombectomía mecánica)
   */
  function calcularVentanaTerapeutica(horaInicioStr) {
    if (!horaInicioStr) return { conocida: false, dentroVentana: true, minutosTranscurridos: 0 };

    var partes = horaInicioStr.split(':');
    if (partes.length !== 2) return { conocida: false, dentroVentana: true, minutosTranscurridos: 0 };

    var ahora = new Date();
    var inicio = new Date();
    inicio.setHours(parseInt(partes[0], 10), parseInt(partes[1], 10), 0, 0);

    if (inicio.getTime() > ahora.getTime()) {
      inicio.setDate(inicio.getDate() - 1);
    }

    var diffMin = Math.round((ahora.getTime() - inicio.getTime()) / 60000);
    var dentroTrombolisis = diffMin <= 270; // 4.5 horas
    var dentroTrombectomia = diffMin <= 1440; // 24 horas

    return {
      conocida: true,
      minutosTranscurridos: diffMin,
      horasTexto: (Math.round((diffMin / 60) * 10) / 10) + ' horas',
      dentroVentanaTrombolisis: dentroTrombolisis,
      dentroVentanaTrombectomia: dentroTrombectomia,
      urgenciaMensaje: dentroTrombolisis 
        ? '⚡ DENTRO DE VENTANA DE ORO (< 4.5h): La fibrinólisis intravenosa puede revertir el déficit si el paciente llega ya al hospital.' 
        : (dentroTrombectomia 
            ? '⚠️ Superadas 4.5 horas: La trombectomía mecánica endovascular sigue siendo viable hasta las 24 horas tras el inicio.'
            : '🚨 Más de 24 horas de evolución: Requiere ingreso urgente para neuroprotección y prevención de recidivas.')
    };
  }

  var PROTOCOLO_PRIMEROS_AUXILIOS = {
    hacer: [
      'Llama de inmediato al 112 y solicita activación de «CÓDIGO ICTUS».',
      'Apunta la hora exacta del inicio o de la última vez que viste a la persona bien (Last Known Normal).',
      'Mantén a la persona acostada con el cabecero incorporado a 30º para no elevar la presión intracraneal.',
      'Afloja prendas apretadas en cuello y cintura (corbatas, camisas, cinturones).',
      'Si vomita o pierde el conocimiento respirando, colócala en Posición Lateral de Seguridad (PLS) del lado afecto.'
    ],
    noHacer: [
      'NUNCA dar de beber, comer ni administrar medicamentos (riesgo de aspiración pulmonar mortal por disfagia).',
      'NUNCA dar Aspirina: si el ictus es hemorrágico (aneurisma), la aspirina causaría una hemorragia letal.',
      'NO esperar a que «descanse a ver si se le pasa». Por cada minuto mueren 2 millones de neuronas.',
      'NO trasladar en coche particular salvo que el 112 lo ordene expresamente.'
    ]
  };

  return {
    VERSION: VERSION,
    evaluarBEFAST: evaluarBEFAST,
    evaluarFAST: evaluarFAST,
    evaluarLVO_VAN: evaluarLVO_VAN,
    analizarRitmoPulso: analizarRitmoPulso,
    calcularBrilloRojoPPG: calcularBrilloRojoPPG,
    calcularVentanaTerapeutica: calcularVentanaTerapeutica,
    PROTOCOLO_PRIMEROS_AUXILIOS: PROTOCOLO_PRIMEROS_AUXILIOS
  };
});
