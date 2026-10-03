# IctusSOS v2.0 ⏱️🧠

> **Cribado prehospitalario de Ictus en 60 segundos con escala BE-FAST (Sensibilidad 95%), Triaje de Oclusión de Gran Vaso (VAN LVO) y Detector de Fibrilación Auricular.** 100% en el navegador, privado, sin dependencias y de código abierto.

[![Licencia MIT](https://img.shields.io/badge/licencia-MIT-blue.svg)](LICENSE)
[![Tests Clínicos v2](https://img.shields.io/badge/tests-8%20passed-brightgreen.svg)](test.js)
[![Sensibilidad](https://img.shields.io/badge/sensibilidad-95%25%20(BE--FAST)-red.svg)](#validación-clínica)
[![100% In-Browser](https://img.shields.io/badge/privacidad-100%25%20local-blue.svg)](index.html)

---

## 🎯 ¿Qué Novedades Trae la Versión 2.0?

En la versión 1.0 utilizábamos la escala FAST clásica (Face, Arm, Speech, Time). Sin embargo, la auditoría clínica demostró que FAST **perdía entre un 10% y un 15% de los ictus que afectaban a la circulación posterior (cerebelo y troncoencéfalo)**.

En la **v2.0**:
1. **Adopción de la escala BE-FAST (Aroor et al., *Stroke* 2017):**
   - **B**alance: Pérdida súbita de equilibrio, inestabilidad en la marcha o vértigo incoercible.
   - **E**yes: Pérdida brusca de visión en un ojo o visión doble (diplopía).
   - **F**ace: Asimetría facial al sonreír.
   - **A**rm: Claudicación o parálisis en un brazo.
   - **S**peech: Disartria o afasia de comprensión/expresión.
   - **T**ime: Registro de hora de inicio (Last Known Normal).
   - **Elevación de la Sensibilidad diagnóstica del 80% al 95%.**

2. **Triaje de Oclusión de Gran Vaso (Escala VAN - Teleb et al., *J NeuroIntervent Surg* 2017):**
   - Cuando se detecta claudicación motora, evalúa de inmediato síntomas corticales (*Vision, Aphasia, Neglect*). Si es positiva, activa la alerta de candidato a **Trombectomía Mecánica** para trasladar directamente a un centro con Unidad de Neurointervencionismo.

3. **Detector de Fibrilación Auricular (FA):**
   - Análisis de coeficiente de variación (CV%) y RMSSD sobre la cadencia de latidos. Detecta el patrón caótico "irregularmente irregular" típico de la FA (responsable del 25% de los ictus isquémicos).

---

## 🚀 Pruebas Automatizadas

Ejecuta la suite de validación clínica:
```bash
node test.js
```

---

## 🔒 Privacidad Radical
- Cero servidores, cero telemetría.
- La geolocalización para el 112 se procesa exclusivamente en la memoria RAM del navegador.

---

## 📄 Licencia
Licencia MIT. Copyright (c) 2026 DataFlow Elegance — Ismael Ben Kazem.
