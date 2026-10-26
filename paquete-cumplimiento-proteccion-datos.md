# Paquete de implementación en protección de datos personales y seguridad de la información — Colombia

**Versión 1.0 | [Fecha] | Elaborado para: [Organización]**

> **Nota legal:** este documento es un modelo operativo y no sustituye asesoría jurídica. Antes de aprobarlo, valide la normativa, las circulares y resoluciones vigentes de la SIC, la UVT del año y las reglas sectoriales aplicables. Los apartes marcados **[VALIDAR CON ABOGADO]** requieren revisión jurídica especializada.

## Contenido

0. Ficha de contexto, supuestos y advertencia
1. Diagnóstico inicial
2. Política de Tratamiento de Datos Personales
3. Modelo de autorización del Titular y aviso de privacidad
4. Política de seguridad de la información
5. Roles y responsabilidades
6. Tratamiento especial de datos sensibles y de niños, niñas y adolescentes
7. Protocolo de gestión de incidentes y brechas de seguridad
8. Contratos y cláusulas modelo con terceros
9. Registro Nacional de Bases de Datos (RNBD)
10. Plan de capacitación y concientización
11. Plan de implementación 30-60-90 días
12. Programa de auditoría interna y mejora continua
- Anexos

---

## 0. Ficha de contexto, supuestos y advertencia

| Variable | Supuesto de trabajo |
|---|---|
| Organización | **[SUPUESTO]** Sociedad privada del sector comercio/servicios, con 120 empleados y 3 sedes en Colombia. |
| Datos tratados | Clientes, empleados, candidatos, proveedores, usuarios de sitio web/app, imágenes de videovigilancia, datos de salud ocupacional y biometría para control de asistencia. |
| Sistemas | CRM en la nube, ERP, correo corporativo, sitio web, app móvil, software de nómina, CCTV y respaldos en nube. |
| Terceros | Proveedor de nómina, hosting/CRM SaaS, marketing digital, mantenimiento de CCTV, mensajería y pasarela de pagos. |
| Transferencias internacionales | **[SUPUESTO]** Sí: transmisión a encargados en EE. UU. y UE. Se debe evaluar si además existe transferencia. |
| RNBD | **[SUPUESTO]** Activos totales superiores a 100.000 UVT, por lo que la organización está obligada a inscribirse. Si no supera ese umbral, no inscribe, pero conserva las demás obligaciones. |
| Oficial de Protección de Datos | **[SUPUESTO]** Persona designada a tiempo parcial, con dependencia de la Gerencia Jurídica o de la Alta Dirección. |
| Menores | **[SUPUESTO]** Tratamiento limitado a campañas, imágenes o actividades con autorización del representante legal. |
| Ley 1266 de 2008 | **[SUPUESTO]** No aplica. Si se trata información financiera, crediticia, comercial o de servicios, active el anexo correspondiente. |

**Advertencias transversales**

- Verifique la UVT vigente y el umbral de activos para el RNBD: 100.000 UVT. Para 2026 se ha estimado en aproximadamente COP $5.237.400.000 **[VERIFICAR NORMA Y UVT VIGENTE]**.
- Verifique la lista de países con nivel adecuado de protección declarada por la SIC y las circulares vigentes sobre RNBD e incidentes.
- Si la organización es clínica, fintech, colegio o maneja datos de salud, menores o financieros, existen reglas sectoriales adicionales **[VALIDAR CON ABOGADO]**.
- La autorización y el aviso de privacidad deben estar en lenguaje claro, ser accesibles y conservarse como prueba.

---

## 1. Diagnóstico inicial

### 1.1 Metodología

1. **Entrevistas** con Gerencia, Jurídica, TI, Talento Humano, Mercadeo y dueños de proceso.
2. **Revisión documental**: políticas, contratos, autorizaciones, avisos, procedimientos de PQRS, contratos con proveedores y registros de incidentes.
3. **Recorrido técnico**: accesos, MFA, cifrado, respaldos, dispositivos, nube, CCTV y eliminación de datos.
4. **Muestreo**: 10–20 autorizaciones, 10–20 solicitudes de titulares, 5–10 contratos de encargados y 3–5 bases de datos.
5. **Calificación**: C = cumple; P = parcial; NC = no cumple; NA = no aplica.
6. **Priorización**: probabilidad (1–5) × impacto (1–5). Riesgo alto ≥ 15; medio 8–14; bajo ≤ 7.

**Entregable:** informe de brechas con hallazgo, evidencia, norma incumplida, riesgo, responsable, acción y fecha.

### 1.2 Lista de verificación

#### A. Gobierno, inventario y autorizaciones

| # | Control verificable | Norma | Evidencia | Estado |
|---|---|---|---|---|
| 1 | Política de Tratamiento aprobada, publicada y vigente | Ley 1581/2012, art. 17(k); Decreto 1074/2015, art. 2.2.2.25.3.1 | Documento aprobado, acta, publicación web | C/P/NC/NA |
| 2 | Aviso de privacidad en todos los canales de recolección | Decreto 1074/2015, art. 2.2.2.25.3.3 | Capturas, formularios, carteles | C/P/NC/NA |
| 3 | Manual interno de consultas y reclamos | Ley 1581/2012, art. 17(k) | Manual, flujo, formato | C/P/NC/NA |
| 4 | Persona o área responsable de protección de datos designada y comunicada | Decreto 1074/2015, art. 2.2.2.25.3.1, num. 4 | Resolución de designación, correo, web | C/P/NC/NA |
| 5 | Comité de Protección de Datos y actas periódicas | Ley 1581/2012, art. 17; guías SIC | Actas, plan de trabajo | C/P/NC/NA |
| 6 | Presupuesto, roles y metas asignadas | Ley 1581/2012, art. 17; accountability | Plan, presupuesto, indicadores | C/P/NC/NA |
| 7 | Inventario de bases de datos actualizado | Ley 1581/2012, arts. 17 y 25 | Inventario, diagrama de flujo | C/P/NC/NA |
| 8 | Finalidad y base legal documentadas por base de datos | Ley 1581/2012, arts. 4 y 9 | Ficha de cada base | C/P/NC/NA |
| 9 | Recolección limitada a datos pertinentes y necesarios | Ley 1581/2012, art. 4; Decreto 1074/2015, art. 2.2.2.25.2.1 | Formularios, justificación | C/P/NC/NA |
| 10 | Flujo de datos: origen, almacenamiento, destinatarios y transferencias | Ley 1581/2012, art. 17; Decreto 1074/2015 | Diagrama, registro de actividades | C/P/NC/NA |
| 11 | Plazos de retención definidos y documentados | Decreto 1074/2015, art. 2.2.2.25.2.8 | Tabla de retención | C/P/NC/NA |
| 12 | Autorización previa, expresa e informada | Ley 1581/2012, art. 9; Decreto 1074/2015, art. 2.2.2.25.2.2 | Formularios, registros electrónicos | C/P/NC/NA |
| 13 | Prueba de la autorización conservada | Decreto 1074/2015, art. 2.2.2.25.2.5 | Log, PDF, base de consentimientos | C/P/NC/NA |
| 14 | Autorización separada y explícita para datos sensibles | Ley 1581/2012, arts. 5 y 6; Decreto 1074/2015, art. 2.2.2.25.2.3 | Formulario específico | C/P/NC/NA |
| 15 | Autorización del representante legal para datos de menores | Ley 1581/2012, art. 7 | Formulario, verificación de edad | C/P/NC/NA |
| 16 | Autorización para transferencia internacional cuando aplique | Ley 1581/2012, art. 26 | Cláusula, consentimiento, evaluación | C/P/NC/NA |
| 17 | Nueva autorización si cambia la finalidad | Decreto 1074/2015, art. 2.2.2.25.2.2 | Control de cambios, comunicación | C/P/NC/NA |

#### B. Derechos de los titulares y seguridad

| # | Control verificable | Norma | Evidencia | Estado |
|---|---|---|---|---|
| 18 | Canal gratuito y de fácil acceso para consultas y reclamos | Ley 1581/2012, arts. 14 y 15 | Correo, formulario, dirección | C/P/NC/NA |
| 19 | Procedimiento con plazos legales | Ley 1581/2012, arts. 14 y 15 | Manual, plantillas, registro | C/P/NC/NA |
| 20 | Registro de solicitudes, respuestas y soportes | Ley 1581/2012, art. 17(j) | Base de PQRS, carpetas | C/P/NC/NA |
| 21 | Leyenda “reclamo en trámite” | Ley 1581/2012, art. 15, num. 2 | Captura del sistema | C/P/NC/NA |
| 22 | Verificación de identidad del solicitante | Ley 1581/2012, arts. 13 y 15 | Procedimiento, evidencia | C/P/NC/NA |
| 23 | Mecanismo de revocatoria y supresión | Ley 1581/2012, art. 8; Decreto 1074/2015, art. 2.2.2.25.2.6 | Formulario, flujo | C/P/NC/NA |
| 24 | Reporte semestral de reclamos al RNBD, si aplica | Circular SIC 003/2018; manual RNBD | Reporte, acuse | C/P/NC/NA |
| 25 | Accesos únicos, nominativos y con mínimo privilegio | Ley 1581/2012, art. 17(d); ISO 27001 | Matriz de accesos, altas/bajas | C/P/NC/NA |
| 26 | MFA en accesos remotos, administradores, correo y nube | Ley 1581/2012, art. 17(d); ISO 27001 | Configuración, capturas | C/P/NC/NA |
| 27 | Gestión de altas, cambios y retiros de usuarios | Ley 1581/2012, art. 17(d) | Checklist, tickets | C/P/NC/NA |
| 28 | Revisión periódica de accesos | Ley 1581/2012, art. 17(d) | Actas trimestrales | C/P/NC/NA |
| 29 | Contraseñas robustas y gestor de contraseñas | ISO 27001; buenas prácticas | Política, configuración | C/P/NC/NA |
| 30 | Cifrado en tránsito y en reposo | Ley 1581/2012, art. 17(d); ISO 27001 | TLS, AES-256, BitLocker | C/P/NC/NA |
| 31 | Copias de seguridad 3-2-1 y pruebas de restauración | Ley 1581/2012, art. 17(d); ISO 27001 | Plan, logs, acta de restore | C/P/NC/NA |
| 32 | Inventario y gestión de dispositivos | ISO 27001 | Inventario, MDM, cifrado | C/P/NC/NA |
| 33 | Antivirus/EDR, parches y gestión de vulnerabilidades | ISO 27001 | Consola, informe de escaneo | C/P/NC/NA |
| 34 | Registros y monitoreo de accesos | Ley 1581/2012, art. 17(d) | Logs, alertas, retención | C/P/NC/NA |
| 35 | Teletrabajo seguro y uso de nube con responsabilidad compartida | ISO 27001; guías SIC | Política, VPN, contrato cloud | C/P/NC/NA |

#### C. Terceros, datos sensibles, incidentes y RNBD

| # | Control verificable | Norma | Evidencia | Estado |
|---|---|---|---|---|
| 36 | Due diligence de encargados y proveedores | Ley 1581/2012, art. 17(i) | Cuestionario, certificaciones | C/P/NC/NA |
| 37 | Contrato o acuerdo de tratamiento con cláusulas mínimas | Ley 1581/2012, arts. 17 y 18 | Contrato, anexo DPA | C/P/NC/NA |
| 38 | Subencargados autorizados y listados | Ley 1581/2012, art. 18; ISO 27701 | Lista, autorizaciones | C/P/NC/NA |
| 39 | Transferencias internacionales evaluadas y documentadas | Ley 1581/2012, art. 26 | Evaluación, cláusulas, registro | C/P/NC/NA |
| 40 | Registro de transmisiones y transferencias | Ley 1581/2012, art. 26; RNBD | Inventario, anexo | C/P/NC/NA |
| 41 | Inventario de datos sensibles y finalidad específica | Ley 1581/2012, arts. 5 y 6 | Inventario, DPIA | C/P/NC/NA |
| 42 | Consentimiento explícito, previo y no condicionado para sensibles | Ley 1581/2012, art. 6; Decreto 1074/2015, art. 2.2.2.25.2.3 | Formulario, registro | C/P/NC/NA |
| 43 | Acceso restringido y cifrado reforzado para sensibles | Ley 1581/2012, art. 17(d) | Matriz, bóveda, logs | C/P/NC/NA |
| 44 | Menores: verificación de edad, autorización e interés superior | Ley 1581/2012, art. 7 | Procedimiento, formulario | C/P/NC/NA |
| 45 | Evaluación de impacto para tratamientos de alto riesgo | Accountability; ISO 27701 | DPIA firmada | C/P/NC/NA |
| 46 | Protocolo de incidentes aprobado y con roles | Ley 1581/2012, art. 17(n); Circular SIC 003/2018 | Protocolo, acta, simulacro | C/P/NC/NA |
| 47 | Canal de reporte interno disponible 24/7 | Ley 1581/2012, art. 17(n) | Correo, teléfono, mesa de ayuda | C/P/NC/NA |
| 48 | Registro de incidentes y preservación de evidencia | Ley 1273/2009; ISO 27001 | Bitácora, cadena de custodia | C/P/NC/NA |
| 49 | Reporte a la SIC en 15 días hábiles cuando afecte datos personales | Circular SIC 003/2018; Ley 1581/2012, art. 17(n) | Reporte, acuse, cronología | C/P/NC/NA |
| 50 | RNBD: aplicabilidad, inscripción, actualización y reporte de reclamos | Ley 1581/2012, arts. 25–27; Decreto 1074/2015, cap. 26 | Certificado RNBD, pantallas | C/P/NC/NA |
| 51 | Nuevas bases y cambios sustanciales reportados | Manual RNBD; Circular SIC 003/2018 | Registro, soportes | C/P/NC/NA |
| 52 | Capacitación de inducción y anual | Ley 1581/2012, art. 17; accountability | LMS, actas, evaluaciones | C/P/NC/NA |
| 53 | Capacitación específica por rol | ISO 27001; ISO 27701 | Plan, asistencia | C/P/NC/NA |
| 54 | Simulaciones de phishing y ejercicio de incidentes | ISO 27001 | Resultados, lecciones | C/P/NC/NA |
| 55 | Auditoría interna anual, indicadores y revisión por la dirección | Accountability; ISO 27001 | Informe, plan de acción, acta | C/P/NC/NA |

### 1.3 Matriz de brechas y priorización

| Hallazgo | Norma | Probabilidad (1–5) | Impacto (1–5) | Riesgo | Prioridad | Responsable | Fecha |
|---|---|---:|---:|---:|---|---|---|
| [Ej.] No hay prueba de autorización en formulario web | Ley 1581/2012, art. 9 | 4 | 4 | 16 | Alta | [Nombre] | [Fecha] |
| [Ej.] CCTV sin aviso ni política de retención | Ley 1581/2012; guías SIC | 3 | 4 | 12 | Media | [Nombre] | [Fecha] |
| [Ej.] Proveedor cloud sin cláusulas de incidentes | Ley 1581/2012, art. 17(i) | 3 | 5 | 15 | Alta | [Nombre] | [Fecha] |

**Regla de decisión:** todo riesgo alto debe tener plan de acción en 30 días; los medios, en 60 días; los bajos, en 90 días o en el ciclo anual.

---

## 2. Política de Tratamiento de Datos Personales (borrador completo)

**POLÍTICA DE TRATAMIENTO DE DATOS PERSONALES DE [RAZÓN SOCIAL]**

**Versión:** [1.0]  
**Fecha de aprobación:** [dd/mm/aaaa]  
**Aprobada por:** [Junta/Representante Legal/Comité]  
**Próxima revisión:** [dd/mm/aaaa]

### Artículo 1. Identificación del Responsable del Tratamiento

| Dato | Información |
|---|---|
| Razón social | [RAZÓN SOCIAL] |
| NIT | [NIT] |
| Domicilio | [Ciudad], [Departamento], Colombia |
| Dirección | [Dirección] |
| Correo electrónico | [correo@empresa.com] |
| Teléfono | [Teléfono] |
| Sitio web | [URL] |
| Representante legal | [Nombre], [Documento] |
| Área de protección de datos | [Oficina/Persona] |
| Correo para derechos | [protecciondedatos@empresa.com] |

### Artículo 2. Marco normativo

Esta política se expide en cumplimiento del artículo 15 de la Constitución Política de 1991, la Ley 1581 de 2012, el Decreto 1074 de 2015 —que compila el Decreto 1377 de 2013—, la Ley 1266 de 2008 cuando aplique, la Ley 1273 de 2009, la Ley 527 de 1999, las circulares y guías de la Superintendencia de Industria y Comercio (SIC) y las normas sectoriales aplicables.

### Artículo 3. Ámbito de aplicación

Aplica a todas las bases de datos, archivos, sistemas, canales y tratamientos que realice [RAZÓN SOCIAL] en calidad de Responsable o Encargado, incluidos clientes, empleados, candidatos, proveedores, usuarios del sitio web y app, videovigilancia, correo, nube y contratistas. Se excluyen las bases de datos de ámbito exclusivamente personal o doméstico y los datos públicos, sin perjuicio de las garantías legales.

### Artículo 4. Definiciones

- **Titular:** persona natural cuyos datos personales son tratados.
- **Responsable:** persona natural o jurídica que decide sobre la base de datos y el tratamiento.
- **Encargado:** persona que trata datos por cuenta del Responsable.
- **Tratamiento:** cualquier operación sobre datos personales, como recolección, almacenamiento, uso, circulación, supresión o transferencia.
- **Dato sensible:** dato que afecta la intimidad o cuyo uso indebido puede generar discriminación, como salud, biometría, origen étnico, orientación política, convicciones religiosas o vida sexual.
- **Transferencia:** envío de datos a un receptor que actúa como Responsable, dentro o fuera del país.
- **Transmisión:** comunicación de datos a un Encargado para que los trate por cuenta del Responsable.
- **Autorización:** consentimiento previo, expreso e informado del Titular.
- **RNBD:** Registro Nacional de Bases de Datos de la SIC.

### Artículo 5. Principios

| Principio | Aplicación |
|---|---|
| Legalidad | Tratamiento conforme a la ley y a esta política (Ley 1581/2012, art. 4). |
| Finalidad | Solo para fines determinados, explícitos y legítimos. |
| Libertad | Sin coacción, salvo deber legal o contractual. |
| Veracidad o calidad | Datos exactos, completos, actualizados y comprobables. |
| Transparencia | Información clara al Titular desde la recolección. |
| Acceso y circulación restringidos | Solo personas autorizadas y con necesidad de saber. |
| Seguridad | Medidas técnicas, humanas y administrativas para proteger los datos. |
| Confidencialidad | Deber de reserva, incluso después de terminar la relación. |

### Artículo 6. Categorías de datos y finalidades

| Titular | Datos tratados | Finalidades | Base legal | ¿Sensible? |
|---|---|---|---|---|
| Clientes | Identificación, contacto, dirección, datos financieros, historial de compras, soportes | Contratación, facturación, entrega, garantía, soporte, cobranza, obligaciones legales, marketing opcional | Contrato, autorización, obligación legal | No, salvo salud en casos concretos |
| Empleados | Identificación, contacto, datos laborales, salario, seguridad social, salud ocupacional, biometría, imágenes | Nómina, seguridad social, salud ocupacional, control de asistencia, formación, evaluación, obligaciones legales | Contrato, obligación legal, autorización para sensibles | Sí |
| Candidatos | Hoja de vida, contacto, referencias, formación | Selección, verificación, comunicación | Autorización | No, salvo datos sensibles innecesarios |
| Proveedores | Identificación, contacto, datos bancarios, RUT, representación | Contratación, pagos, compliance, comunicaciones | Contrato, obligación legal | No |
| Usuarios web/app | Identificación, contacto, IP, navegación, cookies, preferencias | Registro, transacciones, soporte, seguridad, analítica, marketing opcional | Autorización, contrato | No |
| Videovigilancia | Imagen, video, fecha, hora, ubicación | Seguridad de personas y bienes, investigación de incidentes | Aviso y autorización cuando sea exigible **[VALIDAR CON ABOGADO]** | No, pero requiere cuidado reforzado |

**Regla de minimización:** no se recolectan datos innecesarios. Si un dato no tiene finalidad documentada, no se solicita.

### Artículo 7. Autorización

La autorización será previa, expresa e informada. Podrá otorgarse por escrito, de forma oral o mediante conducta inequívoca, y nunca se presumirá del silencio (Ley 1581/2012, art. 9; Decreto 1074/2015, art. 2.2.2.25.2.4). Se conservará prueba de la autorización (Decreto 1074/2015, art. 2.2.2.25.2.5).

Cuando cambie una finalidad, se solicitará nueva autorización antes de implementar el cambio (Decreto 1074/2015, art. 2.2.2.25.2.2). Las finalidades opcionales —como marketing— tendrán casillas separadas y no podrán condicionar el servicio.

### Artículo 8. Derechos de los Titulares

Los Titulares tienen derecho a:

1. **Conocer** los datos tratados y la finalidad.
2. **Actualizar** y **rectificar** datos inexactos.
3. **Suprimir** datos cuando no exista deber legal o contractual de conservarlos.
4. **Revocar** la autorización.
5. **Solicitar prueba** de la autorización.
6. **Ser informados** sobre el uso de sus datos.
7. **Presentar quejas** ante la SIC después de agotar el trámite interno.
8. **Acceder gratuitamente** a sus datos (Ley 1581/2012, art. 8).

### Artículo 9. Consultas

**Canal:** [correo], [formulario web], [dirección física]. La solicitud debe permitir prueba de su radicación.

**Procedimiento:**

| Paso | Acción | Plazo | Responsable |
|---|---|---|---|
| 1 | Recibir y radicar la consulta | Día hábil siguiente | [Área] |
| 2 | Verificar identidad | 1 día hábil | [Área] |
| 3 | Buscar y preparar la información | 5 días hábiles | Dueño de la base |
| 4 | Responder de fondo | Máximo 10 días hábiles | [Área] |
| 5 | Si no es posible, informar motivos y fecha | Antes del vencimiento | [Área] |
| 6 | Prórroga máxima | 5 días hábiles adicionales | [Área] |

La respuesta será clara, gratuita y corresponderá a lo que repose en la base (Ley 1581/2012, art. 14).

### Artículo 10. Reclamos

**Requisitos:** nombre e identificación del Titular o representante, dirección, correo y teléfono, descripción de los hechos, documentos que se quieran hacer valer y firma o medio electrónico verificable (Ley 1581/2012, art. 15).

| Paso | Acción | Plazo | Responsable |
|---|---|---|---|
| 1 | Recibir el reclamo | Inmediato | [Área] |
| 2 | Si está incompleto, requerir subsanación | 5 días siguientes | [Área] |
| 3 | Si no subsana, declarar desistimiento | 2 meses desde el requerimiento | [Área] |
| 4 | Si no es competente, trasladar | 2 días hábiles | [Área] |
| 5 | Incluir leyenda “reclamo en trámite” | 2 días hábiles | TI |
| 6 | Decidir de fondo | 15 días hábiles | [Área] |
| 7 | Prórroga máxima | 8 días hábiles adicionales | [Área] |
| 8 | Informar al Titular | Dentro del plazo | [Área] |

Si el Titular no queda conforme, podrá acudir a la SIC una vez agotado el trámite interno (Ley 1581/2012, art. 16).

### Artículo 11. Revocatoria y supresión

El Titular podrá solicitar la revocatoria de la autorización o la supresión de sus datos mediante el procedimiento de reclamo. No procederá cuando exista deber legal o contractual de conservarlos (Decreto 1074/2015, art. 2.2.2.25.2.6). La revocatoria puede ser total o parcial. Cuando sea procedente, se eliminarán los datos de sistemas activos, respaldos y encargados, según el ciclo de retención, dejando evidencia.

### Artículo 12. Datos sensibles

Solo se tratan datos sensibles cuando exista autorización explícita del Titular o una excepción legal (Ley 1581/2012, arts. 5 y 6). Se informará que la respuesta es facultativa y que no condiciona la prestación del servicio, salvo deber legal. Se aplicarán controles reforzados: acceso restringido, cifrado, registro de auditoría, minimización y retención limitada (Decreto 1074/2015, art. 2.2.2.25.2.3).

**Ejemplos:** salud ocupacional, incapacidades, biometría para asistencia, imágenes de salud y datos de menores.

### Artículo 13. Niños, niñas y adolescentes

El tratamiento de datos de menores requiere autorización del representante legal, respeto del interés superior y de sus derechos fundamentales (Ley 1581/2012, art. 7). No se usarán para marketing comportamental, perfilamiento o fines que no sean compatibles con su bienestar. Cuando sea posible, se escuchará su opinión. Para imágenes, se verificará la autorización y el contexto de uso.

### Artículo 14. Videovigilancia

Se informará mediante aviso visible antes del ingreso o en el área videovigilada. Las cámaras serán proporcionales a la finalidad de seguridad, no se ubicarán en zonas de intimidad y no se usará audio salvo justificación legal **[VALIDAR CON ABOGADO]**. El acceso estará restringido y la grabación se conservará por [30] días, salvo investigación o deber legal.

### Artículo 15. Cookies y canales digitales

Se usarán cookies necesarias para el funcionamiento del sitio. Las cookies analíticas, publicitarias o de perfilamiento requerirán consentimiento previo, informado y granular. El usuario podrá aceptar, rechazar o configurar las cookies, y revocar el consentimiento. Se publicará una política de cookies con finalidades, proveedores y duración.

### Artículo 16. Transmisión y transferencia

Los encargados tratarán los datos solo bajo instrucciones documentadas y con cláusulas de seguridad, confidencialidad, incidentes, auditoría y devolución/eliminación. Las transferencias internacionales solo se realizarán a países con nivel adecuado de protección o con autorización expresa e inequívoca del Titular, o bajo una excepción del artículo 26 de la Ley 1581 de 2012. Se documentará la evaluación y se registrará en el RNBD cuando aplique.

### Artículo 17. Seguridad

[RAZÓN SOCIAL] implementará medidas técnicas, humanas y administrativas para evitar adulteración, pérdida, consulta, uso o acceso no autorizado (Ley 1581/2012, art. 17(d); Decreto 1074/2015, art. 2.2.2.25.3.7). Se aplicará la Política de Seguridad de la Información y el Protocolo de Incidentes anexos.

### Artículo 18. Retención y eliminación

Los datos se conservarán solo durante el tiempo necesario para la finalidad y los plazos legales, contables, fiscales, laborales o contractuales. Cumplido el plazo, se eliminarán de forma segura y se dejará evidencia. Si existe una investigación o deber legal de conservación, se aplicará retención excepcional documentada (Decreto 1074/2015, art. 2.2.2.25.2.8).

| Categoría | Retención orientativa | Criterio |
|---|---|---|
| Candidatos | [6–12 meses] | Proceso de selección **[VALIDAR CON ABOGADO]** |
| Empleados | Relación laboral + plazos laborales, de seguridad social y fiscales | Obligación legal **[VALIDAR CON ABOGADO]** |
| Nómina y contabilidad | [5–10 años] | Plazos fiscales y comerciales **[VALIDAR CON ABOGADO]** |
| Clientes | Relación + [5 años] | Contractual, fiscal y garantías **[VALIDAR CON ABOGADO]** |
| Marketing | Hasta revocatoria | Consentimiento |
| CCTV | [30] días | Seguridad; salvo investigación |
| Incidentes | [5 años] | Evidencia y accountability **[VALIDAR CON ABOGADO]** |

### Artículo 19. Oficial de Protección de Datos

[RAZÓN SOCIAL] designa a [Nombre], [cargo], correo [ ], teléfono [ ], como responsable de coordinar la implementación, atender consultas, supervisar reclamos, capacitar, monitorear incidentes y servir de enlace con la SIC. La designación no implica necesariamente una obligación legal autónoma para todos los sectores, pero es una buena práctica de accountability **[VALIDAR CON ABOGADO]**.

### Artículo 20. Modificaciones

Los cambios sustanciales se comunicarán a los Titulares antes o al momento de implementarse. Si cambia la finalidad, se solicitará nueva autorización (Decreto 1074/2015, art. 2.2.2.25.2.2). La versión vigente estará publicada en [URL] y disponible en las sedes.

### Artículo 21. Vigencia

Esta política rige desde su aprobación y será revisada al menos anualmente o cuando cambie la normativa, los sistemas, los proveedores o el riesgo. La versión anterior se conservará como evidencia.

---

## 3. Modelo de autorización del Titular y aviso de privacidad

### 3.1 Reglas para todas las autorizaciones

- Debe ser **previa** a la recolección, **expresa** e **informada** (Ley 1581/2012, art. 9).
- Debe indicar **datos**, **finalidades específicas**, **derechos**, **canales** y **política**.
- No usar casillas premarcadas, silencio ni conductas ambiguas.
- Las finalidades opcionales deben tener consentimiento separado.
- Los datos sensibles requieren autorización explícita y advertencia de que son facultativos (Decreto 1074/2015, art. 2.2.2.25.2.3).
- Conservar prueba: fecha, hora, versión del texto, canal, IP o firma (Decreto 1074/2015, art. 2.2.2.25.2.5).

### 3.2 Autorización para clientes y usuarios (formulario/web)

> Yo, [nombre completo], identificado con [tipo y número de documento], autorizo de manera previa, expresa e informada a [RAZÓN SOCIAL], NIT [ ], para tratar mis datos personales con las siguientes finalidades:
>
> - [ ] **Necesarias para el servicio:** contratación, facturación, entrega, soporte, garantía y cobranza.
> - [ ] **Obligaciones legales:** contables, fiscales, judiciales y de seguridad.
> - [ ] **Marketing:** envío de promociones, encuestas y novedades por correo, SMS, WhatsApp o redes.
> - [ ] **Analítica:** medición de uso del sitio y mejora de productos.
> - [ ] **Transferencia internacional:** envío a [proveedor/país] para [finalidad].
>
> **Datos sensibles:** se me informó que no estoy obligado a autorizar el tratamiento de datos sensibles y que puedo negarme sin afectar el servicio, salvo deber legal. Respecto de [salud/biometría], [ ] autorizo [ ] no autorizo.
>
> Declaro que conozco mis derechos de conocer, actualizar, rectificar, suprimir, revocar la autorización, solicitar prueba y presentar quejas. Puedo consultar la política en [URL] y ejercer mis derechos en [correo], [formulario] o [dirección].
>
> Fecha: [ ] Nombre: [ ] Documento: [ ] Firma o medio electrónico: [ ]

### 3.3 Cláusula para contratos de trabajo o de prestación de servicios

> El Empleado/Contratista autoriza a [RAZÓN SOCIAL] a tratar sus datos personales para la ejecución del contrato, nómina, seguridad social, salud ocupacional, control de asistencia, formación, evaluación, seguridad de la información y cumplimiento de obligaciones legales. La autorización para datos sensibles se otorga de forma separada y explícita. El Empleado/Contratista se obliga a mantener la confidencialidad de los datos a los que acceda y a reportar incidentes de forma inmediata. La Empresa tratará los datos conforme a su Política de Tratamiento, disponible en [URL].

### 3.4 Autorización de datos sensibles

> Se me informó de forma clara y previa que los datos de [salud/biometría/origen étnico/etc.] son sensibles, que **no estoy obligado** a autorizar su tratamiento y que puedo negarme sin condicionar la prestación del servicio, salvo que exista una obligación legal. Autorizo de manera explícita el tratamiento de estos datos para la finalidad de [ ]. Conozco que se aplicarán medidas reforzadas de seguridad y que puedo revocar esta autorización cuando no exista deber legal de conservación.

### 3.5 Autorización para datos de menores

> Yo, [nombre del representante legal], identificado con [documento], en calidad de [padre/madre/tutor], autorizo el tratamiento de los datos de [nombre del menor], para la finalidad de [ ]. Declaro que actúo en interés superior del menor, que se respetarán sus derechos fundamentales y que no se usarán sus datos para marketing comportamental o perfilamiento. Adjunto documento que acredita la representación legal. Fecha y firma.

### 3.6 Autorización de transferencia internacional

> Autorizo de manera expresa e inequívoca la transferencia de mis datos personales a [receptor], ubicado en [país], para la finalidad de [ ]. Se me informó que [país] [cuenta/no cuenta] con nivel adecuado de protección declarado por la SIC y que [RAZÓN SOCIAL] adoptará cláusulas contractuales y medidas de seguridad. Conozco que puedo oponerme y revocar esta autorización.

### 3.7 Aviso de privacidad breve (web, formularios, punto de venta)

> **Aviso de privacidad.** [RAZÓN SOCIAL], NIT [ ], es Responsable del Tratamiento. Tratamos sus datos para [finalidades principales]. Puede ejercer sus derechos de conocer, actualizar, rectificar, suprimir y revocar en [correo/formulario/dirección]. Consulte la Política de Tratamiento en [URL]. Los datos sensibles son facultativos. Última actualización: [fecha].

### 3.8 Aviso de privacidad integral

1. **Responsable:** [RAZÓN SOCIAL], NIT, dirección, correo y teléfono.
2. **Datos y finalidades:** [resumen por categoría].
3. **Derechos:** conocer, actualizar, rectificar, suprimir, revocar, solicitar prueba, ser informado y presentar quejas.
4. **Canales:** [correo], [formulario], [dirección].
5. **Política:** disponible en [URL] y en [dirección física].
6. **Datos sensibles:** su suministro es facultativo; se requiere autorización explícita.
7. **Menores:** tratamiento con autorización del representante legal y respeto del interés superior.
8. **Transferencias:** [países/proveedores/finalidades].
9. **Vigencia:** [fecha].

### 3.9 Aviso de videovigilancia

> **Aviso de videovigilancia.** Este establecimiento cuenta con cámaras de seguridad. Responsable: [RAZÓN SOCIAL]. Finalidad: seguridad de personas y bienes. Las imágenes se conservarán por [30] días, salvo investigación. Puede ejercer sus derechos en [canal]. Política: [URL]. No se captan zonas de intimidad.

### 3.10 Aviso de cookies

> Usamos cookies necesarias para el funcionamiento del sitio y, con su consentimiento, cookies analíticas y de marketing. Puede aceptar, rechazar o configurar sus preferencias en [enlace]. Puede cambiar su elección en cualquier momento. Consulte la política de cookies en [URL].

### 3.11 Aviso para empleados

> La Empresa trata sus datos para gestión laboral, nómina, seguridad social, salud ocupacional, control de asistencia, formación, evaluación, seguridad y cumplimiento legal. Los datos sensibles se tratan con autorización explícita y medidas reforzadas. Consulte la Política de Tratamiento en [URL] y reporte incidentes en [canal].

### 3.12 Registro de autorizaciones

| Campo | Contenido |
|---|---|
| ID | [ ] |
| Titular | [Nombre, documento] |
| Canal | [Web/formulario/contrato/presencial] |
| Fecha y hora | [ ] |
| Versión del texto | [ ] |
| Finalidades autorizadas | [ ] |
| Sensibles | [Sí/No; detalle] |
| Transferencia | [Sí/No; país] |
| Evidencia | [PDF/log/IP/firma] |
| Revocatoria | [Fecha, alcance] |

---

## 4. Política de seguridad de la información

**POLÍTICA DE SEGURIDAD DE LA INFORMACIÓN Y DEL TRATAMIENTO DE DATOS PERSONALES**

### 4.1 Objetivo y alcance

Proteger la confidencialidad, integridad, disponibilidad y privacidad de la información, incluidos los datos personales, en todas las sedes, sistemas, nube, dispositivos, empleados, contratistas y proveedores. Se alinea con ISO/IEC 27001 e ISO/IEC 27701 como referencia de buenas prácticas.

### 4.2 Clasificación de la información

| Nivel | Ejemplos | Controles |
|---|---|---|
| Pública | Información institucional autorizada | Divulgación controlada |
| Interna | Procedimientos, reportes internos | Acceso para empleados |
| Confidencial | Contratos, datos de clientes, nómina | Necesidad de saber, cifrado |
| Sensible | Salud, biometría, menores, credenciales | Acceso restringido, cifrado reforzado, auditoría |

### 4.3 Control de accesos

- Cuentas únicas y nominativas; prohibido compartir credenciales.
- Mínimo privilegio y roles (RBAC).
- Altas, cambios y retiros con checklist y revocación inmediata.
- Revisión trimestral de accesos y de cuentas privilegiadas.
- Acceso de proveedores just-in-time, supervisado y con vencimiento.
- Bloqueo de pantalla a los 5 minutos y sesiones remotas con VPN.

### 4.4 Contraseñas y MFA

- Longitud mínima de 12–14 caracteres; frases de paso permitidas.
- No reutilizar contraseñas; usar gestor corporativo.
- No compartir por correo, chat ni papel.
- Rotación solo ante sospecha de compromiso.
- MFA obligatorio en correo, VPN, administración, nube, banca y aplicaciones críticas.
- Prohibido usar cuentas personales para el trabajo.

### 4.5 Cifrado

- TLS 1.2 o superior en tránsito.
- AES-256 o equivalente en reposo para bases de datos, respaldos y dispositivos.
- Cifrado de discos en portátiles y móviles.
- Gestión de llaves documentada y acceso restringido.
- Prohibido enviar datos sensibles por canales no cifrados.

### 4.6 Copias de seguridad

- Esquema 3-2-1: tres copias, dos medios, una fuera del sitio.
- Respaldos cifrados y con control de acceso.
- Prueba de restauración al menos trimestral.
- RPO/RTO definidos por sistema crítico.
- Copia inmutable o aislada para ransomware.
- Registro de éxito/fallo y revisión mensual.

### 4.7 Gestión de dispositivos

- Inventario de equipos, responsables y ubicación.
- MDM/EDR, antivirus, parches y disco cifrado.
- Bloqueo automático, PIN/biometría y borrado remoto.
- Control de USB y medios extraíbles.
- Prohibido instalar software no autorizado.
- Disposición final con borrado seguro y certificado.

### 4.8 Teletrabajo

- Preferir equipos corporativos; si hay BYOD, aplicar MDM y contenedor seguro.
- VPN obligatoria y Wi-Fi confiable; prohibido usar equipos públicos.
- Pantalla de privacidad en espacios compartidos.
- Almacenamiento de documentos en repositorios corporativos, no en escritorio local.
- Reporte inmediato de pérdida, robo o sospecha de incidente.
- Firma de acuerdo de confidencialidad y uso aceptable.

### 4.9 Nube

- Modelo de responsabilidad compartida documentado.
- Evaluación del proveedor: seguridad, ubicación, subencargados, incidentes, continuidad y salida.
- Cifrado, SSO/MFA, registros y respaldos.
- Cláusulas de tratamiento de datos y transferencia internacional.
- Prohibido subir datos personales a herramientas de IA públicas o no aprobadas.
- Plan de salida y recuperación de datos.

### 4.10 Retención y eliminación

- Tabla de retención por categoría y base de datos.
- Eliminación segura: borrado criptográfico, sobrescritura o destrucción física (NIST SP 800-88 como referencia).
- Incluir respaldos, cachés, correos, dispositivos y copias de proveedores.
- Certificado o evidencia de eliminación.
- Excepción documentada por investigación o deber legal.

### 4.11 Registros, monitoreo y vulnerabilidades

- Registro de accesos, cambios y eventos críticos.
- Retención de logs de 6–12 meses según riesgo.
- Alertas de accesos anómalos, malware y exfiltración.
- Escaneo de vulnerabilidades trimestral y pentest anual para sistemas críticos.
- Gestión de parches con plazos por criticidad.

### 4.12 Matriz de controles mínimos

| Control | Implementación mínima | Frecuencia | Evidencia |
|---|---|---|---|
| Inventario de activos | CMDB o hoja controlada | Continua | Inventario actualizado |
| Gestión de identidades | Altas/bajas/cambios | Por evento | Tickets, checklist |
| MFA | Correo, VPN, admin, nube | Continua | Configuración |
| Revisión de accesos | Matriz y aprobación | Trimestral | Acta |
| Cifrado | Disco, base, respaldo | Continua | Configuración |
| Respaldos | 3-2-1 y prueba | Diario/trimestral | Logs, acta |
| Parches | Críticos en 7 días | Mensual | Reporte |
| Antivirus/EDR | Cobertura total | Continua | Consola |
| Logs | Centralizados | Continua | Retención |
| Vulnerabilidades | Escaneo | Trimestral | Informe |
| Pentest | Sistemas críticos | Anual | Informe |
| Proveedores | Due diligence y DPA | Anual | Ficha, contrato |
| Incidentes | Protocolo y registro | Por evento | Bitácora |
| Capacitación | Inducción y anual | Anual | LMS |
| Continuidad | Plan y prueba | Anual | Acta |

---

## 5. Roles y responsabilidades

### 5.1 Matriz de roles

| Rol | Responsabilidades principales |
|---|---|
| Alta Dirección / Junta | Aprobar política, asignar recursos, asumir accountability, revisar indicadores. |
| Comité de Protección de Datos | Gobernar el programa, priorizar riesgos, aprobar tratamientos de alto riesgo, revisar incidentes. |
| Responsable del Tratamiento | [RAZÓN SOCIAL]. Decide finalidades y medios; cumple la ley y responde ante la SIC. |
| Oficial de Protección de Datos | Coordina el programa, asesora, monitorea, capacita, atiende consultas, supervisa reclamos y es enlace con la SIC. |
| CISO / Seguridad de la Información | Define controles, gestiona riesgos, lidera incidentes, mide madurez. |
| TI | Implementa accesos, MFA, cifrado, respaldos, parches, logs y eliminación. |
| Jurídica | Revisa contratos, transferencias, incidentes, reportes a la SIC y cumplimiento normativo. |
| Talento Humano | Gestiona datos de empleados, inducción, confidencialidad y retiro. |
| Dueños de proceso | Mantienen inventario, finalidades, autorizaciones, retención y riesgos de su área. |
| Encargados / proveedores | Tratan datos solo bajo instrucciones, con seguridad, confidencialidad y reporte de incidentes. |
| Empleados y contratistas | Cumplen la política, protegen credenciales, reportan incidentes y no usan datos para fines no autorizados. |
| Auditoría interna | Evalúa independientemente el programa y formula hallazgos. |

### 5.2 Matriz RACI

| Actividad | Dirección | DPO | CISO/TI | Jurídica | Dueño de proceso | Auditoría |
|---|---|---|---|---|---|---|
| Aprobar política | A | R | C | C | I | I |
| Inventario de bases | I | A | C | C | R | I |
| Autorizaciones y avisos | I | A | C | C | R | I |
| Atención de derechos | I | A | C | C | R | I |
| Gestión de incidentes | I | A | R | C | C | I |
| Contratos con terceros | I | C | C | A/R | C | I |
| RNBD | I | A | C | C | R | I |
| Capacitación | I | A | C | C | R | I |
| Auditoría interna | I | C | C | C | C | A/R |
| Revisión por la dirección | A/R | C | C | C | I | C |

A = aprueba; R = responsable; C = consultado; I = informado.

### 5.3 Deberes de los empleados

1. Tratar datos solo para las funciones asignadas.
2. No acceder a datos sin necesidad de saber.
3. No compartir credenciales ni dispositivos.
4. Usar solo herramientas aprobadas.
5. Reportar incidentes de inmediato.
6. Mantener confidencialidad incluso después del retiro.
7. Participar en capacitaciones.
8. Cooperar en auditorías e investigaciones.

---

## 6. Tratamiento especial de datos sensibles y de niños, niñas y adolescentes

### 6.1 Datos sensibles

| Regla | Aplicación |
|---|---|
| Prohibición general | Solo se tratan con autorización explícita o excepción legal (Ley 1581/2012, arts. 5 y 6). |
| Información | Se informa que el suministro es facultativo y que no condiciona el servicio (Decreto 1074/2015, art. 2.2.2.25.2.3). |
| Finalidad | Debe ser específica, legítima y documentada. |
| Minimización | Solo el dato necesario; evitar imágenes, plantillas o campos excesivos. |
| Seguridad | Acceso restringido, cifrado, logs, bóveda de secretos y revisión periódica. |
| Retención | Plazo mínimo necesario; eliminar al cumplir la finalidad. |
| Terceros | Due diligence reforzada y cláusulas específicas. |
| DPIA | Obligatoria como buena práctica para biometría, salud, menores o gran escala. |

**Salud ocupacional:** separar del expediente laboral general; acceso solo a medicina laboral y autoridad competente; no usar para decisiones discriminatorias.

**Biometría:** evaluar alternativa no biométrica; consentimiento explícito; proteger plantillas; no almacenar imágenes crudas innecesarias; cifrado y control de acceso.

**Videovigilancia:** aviso, proporcionalidad, zonas permitidas, retención y acceso restringido.

### 6.2 Niños, niñas y adolescentes

- Autorización del representante legal (Ley 1581/2012, art. 7).
- Respeto del interés superior y de los derechos fundamentales.
- Verificación razonable de edad y representación.
- No marketing comportamental, perfilamiento ni fines incompatibles.
- Imágenes: consentimiento informado, contexto seguro y derecho de retiro.
- Acceso de los representantes a los datos del menor.
- Retención limitada y eliminación prioritaria.

### 6.3 Lista de verificación

- [ ] ¿Existe inventario de datos sensibles y de menores?
- [ ] ¿La finalidad está documentada y es necesaria?
- [ ] ¿Hay autorización explícita y separada?
- [ ] ¿Se informó que es facultativo?
- [ ] ¿El acceso está restringido y cifrado?
- [ ] ¿Hay DPIA?
- [ ] ¿El proveedor tiene cláusulas específicas?
- [ ] ¿La retención está definida?
- [ ] ¿Hay procedimiento para derechos del representante?
- [ ] ¿Se revisa periódicamente?

---

## 7. Protocolo de gestión de incidentes y brechas de seguridad

### 7.1 Definición y ejemplos

Incidente de seguridad: evento que compromete o puede comprometer la confidencialidad, integridad o disponibilidad de datos personales, como acceso no autorizado, pérdida o robo de dispositivos, ransomware, phishing exitoso, error de envío, exfiltración, mala configuración de nube o divulgación accidental.

### 7.2 Roles

| Rol | Función |
|---|---|
| Reportante | Cualquier empleado, contratista o tercero que detecte el evento. |
| Mesa de ayuda / primer contacto | Recibe, registra y escala. |
| DPO | Evalúa impacto en datos personales y coordina notificaciones. |
| CISO/TI | Contiene, investiga y recupera. |
| Jurídica | Evalúa obligaciones, reporte a SIC, comunicación y evidencia. |
| Comunicaciones | Prepara mensajes a titulares y prensa, si aplica. |
| Alta Dirección | Aprueba decisiones críticas y recursos. |

### 7.3 Fases

1. **Preparación:** protocolo, contactos, herramientas, simulacros.
2. **Detección y reporte:** canal 24/7; registrar hora, fuente y descripción.
3. **Triaje:** clasificar severidad y confirmar si hay datos personales.
4. **Contención:** aislar sistemas, revocar accesos, preservar evidencia.
5. **Investigación:** causa raíz, alcance, titulares afectados, datos comprometidos.
6. **Notificación:** SIC, titulares, encargados y autoridades penales si aplica.
7. **Recuperación:** restaurar servicios, monitorear y validar.
8. **Cierre:** informe, lecciones aprendidas y plan de mejora.

### 7.4 Plazos internos y legales

| Hito | Plazo |
|---|---|
| Acuse y registro interno | 24 horas |
| Evaluación preliminar | 72 horas |
| Decisión de reporte a SIC | 5–10 días hábiles |
| Reporte a SIC | Máximo 15 días hábiles desde detección y conocimiento del área encargada |
| Notificación a titulares | Sin demora si hay riesgo alto |
| Informe final | 30 días |

El plazo de 15 días hábiles es legal y no se suspende por la complejidad del incidente. Se puede reportar información preliminar y actualizarla después (Circular SIC 003/2018; Ley 1581/2012, art. 17(n)).

### 7.5 Severidad

| Nivel | Ejemplos | Notificación |
|---|---|---|
| Crítico | Datos sensibles, menores, ransomware, exfiltración masiva, >5.000 titulares | SIC, titulares, dirección, jurídica; evidencia penal |
| Alto | Credenciales, datos financieros, 500–5.000 titulares | SIC y titulares si hay riesgo |
| Medio | <500 titulares, acceso limitado, contenido | Evaluar SIC; registrar |
| Bajo | Sin datos personales o contenido rápido | Registrar y mejorar |

La matriz prioriza la respuesta; no reemplaza la obligación de reportar todo incidente que afecte datos personales.

### 7.6 Reporte a la SIC

- **Quién:** Responsable del Tratamiento. Los Encargados deben reportar a la SIC cuando corresponda y, en todo caso, informar al Responsable de inmediato.
- **Cómo:** si está obligado al RNBD, por el RNBD; si no, por el aplicativo de “Reporte de incidentes de seguridad” de la SIC.
- **Contenido:** fecha y hora, descripción, causa, categorías de datos, número de titulares afectados, medidas adoptadas, riesgos, contacto y estado.
- **Evidencia:** radicado, acuse, versión del reporte y actualizaciones.

### 7.7 Notificación a los titulares

Cuando exista riesgo alto, se informará en lenguaje claro: qué ocurrió, qué datos se vieron comprometidos, qué se está haciendo, recomendaciones para el titular —cambio de contraseña, vigilancia de movimientos, precauciones frente a llamadas o correos—, canal de contacto y fecha. No se incluirán datos innecesarios ni se responsabilizará al titular. Toda comunicación se documentará.

### 7.8 Preservación de evidencia y Ley 1273 de 2009

- Conservar logs, correos, imágenes, dispositivos, capturas y registros de acceso.
- No borrar, alterar ni reinstalar equipos antes de la investigación.
- Mantener cadena de custodia y registrar quién accedió a la evidencia.
- Si hay indicios de delito informático —acceso abusivo, interceptación, daño, malware, phishing, hurto electrónico—, denunciar ante la Fiscalía y coordinar con Jurídica (Ley 1273/2009, arts. 269A a 269J).
- No obstruir la investigación ni demorar el reporte a la SIC por estar investigando.

### 7.9 Registro e informe final

Cada incidente tendrá un registro único con: ID, fecha y hora, reportante, descripción, sistemas afectados, categorías de datos, número de titulares, causa probable, medidas de contención, evaluación de riesgo, notificaciones realizadas, acciones, responsables, estado y fecha de cierre. El informe final se emitirá en un máximo de 30 días e incluirá causa raíz, lecciones aprendidas y plan de mejora.

### 7.10 Plantilla de reporte de incidente

| Campo | Contenido |
|---|---|
| ID del incidente | [INC-AAAA-###] |
| Fecha y hora de detección | [ ] |
| Reportado por | [Nombre, área, contacto] |
| Descripción | [Qué pasó, cómo se detectó] |
| Sistemas afectados | [ ] |
| Datos comprometidos | [Categorías, sensibles: sí/no] |
| Titulares afectados | [Número estimado] |
| Causa probable | [ ] |
| Contención aplicada | [ ] |
| Riesgo | [Crítico/Alto/Medio/Bajo] |
| Reporte a SIC | [Fecha, radicado, canal] |
| Notificación a titulares | [Fecha, medio] |
| Acciones pendientes | [ ] |
| Responsable | [ ] |
| Estado | [Abierto/En investigación/Cerrado] |

---

## 8. Contratos y cláusulas modelo con terceros

### 8.1 Due diligence de encargados y proveedores

Antes de contratar, evaluar:

- [ ] Identidad legal, representante y situación financiera.
- [ ] Política de privacidad y seguridad de la información.
- [ ] Certificaciones: ISO/IEC 27001, SOC 2 u otras.
- [ ] Ubicación de los datos y de los subencargados.
- [ ] Historial de incidentes y plan de respuesta.
- [ ] Medidas de acceso, cifrado, respaldos y eliminación.
- [ ] Capacidad para atender derechos de titulares.
- [ ] Cláusulas de auditoría, devolución y eliminación.
- [ ] Transferencias internacionales y país de destino.
- [ ] Continuidad del negocio y plan de salida.
- [ ] Seguros, indemnización y responsabilidad.

**Clasificación del proveedor:** alto riesgo si trata datos sensibles, menores, grandes volúmenes o datos fuera del país; medio si accede a datos confidenciales; bajo si no accede a datos personales. Todo proveedor con acceso a datos debe tener contrato o anexo de tratamiento.

### 8.2 Cláusulas mínimas

| Cláusula | Contenido |
|---|---|
| Objeto y rol | Identificar si el tercero es Encargado o Responsable y delimitar el tratamiento. |
| Instrucciones | Tratar solo conforme a instrucciones documentadas del Responsable. |
| Confidencialidad | Deber de reserva para personal y subencargados. |
| Seguridad | Medidas mínimas del anexo: accesos, MFA, cifrado, respaldos, logs. |
| Personal | Personal autorizado, capacitado y con deber de confidencialidad. |
| Subencargados | Prohibición sin autorización previa; lista y mismas obligaciones. |
| Derechos | Apoyo para atender consultas, reclamos, revocatoria y supresión. |
| Incidentes | Notificación al Responsable en máximo 24 horas y cooperación. |
| Auditoría | Derecho de auditoría o evidencia equivalente. |
| Devolución/eliminación | Devolver o eliminar al terminar, con certificación. |
| Transferencia internacional | País, base legal, cláusulas y autorización cuando aplique. |
| Responsabilidad | Indemnidad por incumplimiento y por daños a titulares. |
| Duración y terminación | Vigencia, causas y obligaciones subsistentes. |
| Ley aplicable | Normativa colombiana de protección de datos. |

### 8.3 Modelo de cláusulas de encargado

> **Cláusula de tratamiento de datos personales.** El Encargado tratará los datos personales únicamente para las finalidades y bajo las instrucciones documentadas del Responsable, y no los usará para fines propios. Se obliga a: (i) mantener confidencialidad; (ii) implementar las medidas de seguridad del Anexo; (iii) limitar el acceso al personal autorizado; (iv) no subcontractar sin autorización previa y escrita; (v) asistir al Responsable en la atención de derechos de los titulares; (vi) notificar cualquier incidente dentro de las 24 horas siguientes a su detección; (vii) permitir auditorías o entregar evidencia equivalente; (viii) devolver o eliminar los datos al terminar la relación, con certificación; (ix) informar y obtener autorización para transferencias internacionales; y (x) responder por los daños derivados de su incumplimiento. El Encargado no será considerado Responsable salvo que decida sobre la finalidad o los medios del tratamiento.

### 8.4 Transferencias y transmisiones internacionales

**Distinción clave:**

- **Transmisión:** el proveedor actúa como Encargado y trata los datos solo por cuenta del Responsable. No es una transferencia en sentido estricto, pero exige contrato, seguridad y control.
- **Transferencia:** el receptor actúa como Responsable y decide sobre los datos. Requiere nivel adecuado de protección o una excepción del artículo 26 de la Ley 1581 de 2012.

**Regla de decisión:**

1. Identificar país, receptor, finalidad y categorías de datos.
2. Verificar si el país está en la lista de adecuación de la SIC.
3. Si no es adecuado, evaluar: autorización expresa e inequívoca del titular, excepción legal, declaración de conformidad de la SIC o cláusulas contractuales.
4. Documentar la evaluación y las medidas de seguridad.
5. Registrar la operación en el RNBD cuando aplique.
6. Actualizar el aviso de privacidad y la autorización.
7. Revisar anualmente o cuando cambie el proveedor o el país.

**Puntos de validación:** la lista de países adecuados, la vigencia de las declaraciones de la SIC y el tratamiento de normas corporativas vinculantes (Ley 1581/2012, arts. 26 y 27) **[VALIDAR CON ABOGADO]**.

### 8.5 Checklist de terceros

- [ ] ¿El contrato define el rol del tercero?
- [ ] ¿Incluye instrucciones y finalidad?
- [ ] ¿Tiene anexo de seguridad?
- [ ] ¿Exige notificación de incidentes en 24 horas?
- [ ] ¿Permite auditoría?
- [ ] ¿Regula subencargados?
- [ ] ¿Incluye devolución y eliminación?
- [ ] ¿Cubre transferencias internacionales?
- [ ] ¿Tiene responsabilidad e indemnidad?
- [ ] ¿Se revisa anualmente?

---

## 9. Registro Nacional de Bases de Datos (RNBD)

### 9.1 ¿Aplica?

Están obligadas las personas jurídicas de naturaleza privada con activos totales superiores a 100.000 UVT, las entidades sin ánimo de lucro con activos superiores a ese umbral y las personas jurídicas públicas. Para 2026, 100.000 UVT equivalen aproximadamente a COP $5.237.400.000 **[VERIFICAR UVT Y NORMA VIGENTE]**.

**[SUPUESTO]** La organización supera el umbral y debe inscribirse. Si no lo supera, no inscribe en el RNBD, pero debe cumplir las demás obligaciones: política, avisos, autorizaciones, derechos, seguridad, incidentes y contratos.

### 9.2 ¿Qué se inscribe?

| Campo | Contenido |
|---|---|
| Responsable | Razón social, NIT, domicilio, contacto, representante legal. |
| Base de datos | Nombre, finalidad, categorías de datos, titulares, origen. |
| Tratamiento | Recolección, almacenamiento, uso, circulación, supresión. |
| Seguridad | Medidas técnicas, humanas y administrativas. |
| Encargados | Identificación y país. |
| Transferencias | País, receptor y finalidad. |
| Canales | Consultas, reclamos y revocatoria. |
| Reclamos | Reporte semestral según calendario. |
| Política | Versión y fecha. |

### 9.3 Plazos y mantenimiento

| Obligación | Plazo |
|---|---|
| Inscripción de nueva base | Dentro de los 2 meses siguientes a su creación, según el manual del RNBD. |
| Actualización anual | Entre el 2 de enero y el 31 de marzo de cada año. |
| Reporte de reclamos | Primeros 15 días hábiles de febrero y de agosto, según calendario. |
| Cambios sustanciales | Dentro de los 10 primeros días hábiles del mes siguiente, según el manual del RNBD **[VERIFICAR]**. |
| Incidentes | 15 días hábiles desde la detección y conocimiento del área encargada. |

### 9.4 Evidencia y sanciones

Conservar certificados, pantallas, radicados, versiones de la política, reportes de reclamos y soportes de actualización. El incumplimiento puede generar multas de hasta 2.000 SMMLV, suspensión de actividades hasta por 6 meses y cierre de operaciones (Ley 1581/2012, art. 23).

### 9.5 Checklist RNBD

- [ ] ¿Se determinó la aplicabilidad con los activos y la UVT?
- [ ] ¿Están identificadas todas las bases de datos?
- [ ] ¿Cada base tiene finalidad, categorías y encargados?
- [ ] ¿Se inscribió o actualizó en el plazo?
- [ ] ¿Se reportaron los reclamos en febrero y agosto?
- [ ] ¿Se reportaron cambios sustanciales?
- [ ] ¿Se conservan radicados y versiones?
- [ ] ¿El DPO revisa el RNBD antes de cada corte?

---

## 10. Plan de capacitación y concientización

### 10.1 Objetivos

- Comprender la Ley 1581 de 2012 y la política interna.
- Reconocer datos sensibles, menores y situaciones de riesgo.
- Aplicar controles de seguridad y reportar incidentes.
- Reducir errores humanos y phishing.
- Generar evidencia de accountability.

### 10.2 Matriz de módulos

| Módulo | Audiencia | Contenido | Duración | Frecuencia | Evidencia |
|---|---|---|---|---|---|
| Fundamentos legales | Todos | Ley 1581, principios, derechos, RNBD | 60 min | Inducción y anual | LMS, evaluación |
| Política y procedimientos | Todos | Autorizaciones, avisos, PQRS, retención | 45 min | Anual | Asistencia |
| Seguridad básica | Todos | Contraseñas, MFA, phishing, dispositivos | 45 min | Anual | Evaluación |
| Incidentes | Todos | Cómo detectar y reportar en 24 horas | 30 min | Anual | Simulacro |
| Datos sensibles y menores | HR, salud, marketing, atención | Consentimiento, acceso, DPIA | 60 min | Anual | Caso práctico |
| Terceros y transferencias | Compras, Jurídica, TI | Due diligence, DPA, art. 26 | 60 min | Anual | Checklist |
| Rol específico TI | TI y seguridad | Accesos, logs, respaldos, nube | 90 min | Anual | Laboratorio |
| Rol específico HR | Talento Humano | Expedientes, salud, biometría | 60 min | Anual | Caso práctico |
| IA y herramientas no aprobadas | Todos | Riesgos de subir datos a IA pública | 30 min | Anual | Evaluación |
| Phishing | Todos | Simulación y retroalimentación | 15 min | Trimestral | Tasa de clic |

### 10.3 Calendario

- Inducción obligatoria en los primeros 5 días hábiles.
- Capacitación anual para todos.
- Simulación de phishing trimestral.
- Ejercicio de incidentes semestral.
- Actualización extraordinaria cuando cambie la política o ocurra un incidente relevante.

### 10.4 Indicadores

- Cobertura ≥ 95 %.
- Aprobación ≥ 80 %.
- Tasa de clic en phishing < 5 %.
- Incidentes reportados oportunamente ≥ 90 %.
- Satisfacción ≥ 4/5.

---

## 11. Plan de implementación 30-60-90 días

### 11.1 Gobierno del plan

**Patrocinador:** Gerencia General.  
**Líder:** Oficial de Protección de Datos.  
**Comité:** Jurídica, TI/CISO, Talento Humano, Mercadeo, Compras y dueños de proceso.  
**Seguimiento:** reunión quincenal y tablero de indicadores.

### 11.2 Fases

| Fase | Actividades | Responsable | Entregable | Indicador |
|---|---|---|---|---|
| **Días 1–30** | Designar DPO y comité; inventario de bases; mapa de flujo; diagnóstico de brechas; borrador de política y aviso; canal de incidentes; MFA y cuentas compartidas; parches críticos; prueba de respaldo; detener recolección innecesaria | DPO, TI, Jurídica | Inventario, informe de brechas, borradores, plan de quick wins | 100 % bases inventariadas; MFA en correo y VPN |
| **Días 1–30** | Revisar contratos de alto riesgo; identificar transferencias; definir tabla de retención | Compras, Jurídica | Lista de proveedores, evaluación de transferencias, tabla de retención | 100 % proveedores críticos identificados |
| **Días 31–60** | Aprobar y publicar política y avisos; actualizar autorizaciones; firmar DPA; revisar accesos; inscribir/actualizar RNBD; capacitar | Dirección, DPO, TI, HR | Política aprobada, avisos, DPA, RNBD, capacitación | Política publicada; 90 % autorizaciones actualizadas; RNBD al día |
| **Días 31–60** | Implementar retención y eliminación; reforzar CCTV; revisar cookies; plan de comunicación | TI, Jurídica, Mercadeo | Procedimiento de borrado, aviso CCTV, política de cookies | 100 % canales con aviso |
| **Días 61–90** | Simulacro de incidente; auditoría interna; tablero de indicadores; revisión por la dirección; plan de mejora; hoja de ruta 90 días | DPO, CISO, Auditoría | Informe de simulacro, auditoría, acta de revisión, plan CAPA | 100 % hallazgos críticos con plan; indicadores reportados |
| **Días 61–90** | Capacitación específica; phishing; revisión de madurez; presupuesto año siguiente | HR, TI, DPO | Resultados, informe de madurez, presupuesto | Cobertura ≥ 95 %; clic phishing < 5 % |

### 11.3 Quick wins de los primeros 30 días

- Activar MFA en correo, VPN, nube y administradores.
- Eliminar cuentas compartidas y revisar privilegios.
- Parchear vulnerabilidades críticas.
- Probar una restauración de respaldo.
- Publicar aviso de privacidad y canal de derechos.
- Detener formularios que recolectan datos sin finalidad.
- Designar un correo único para incidentes.
- Comunicar a los empleados qué hacer ante una pérdida o phishing.

### 11.4 Indicadores del plan

- % de bases inventariadas.
- % de autorizaciones con evidencia.
- % de canales con aviso actualizado.
- % de solicitudes respondidas en plazo.
- % de sistemas críticos con MFA.
- % de respaldos probados.
- % de proveedores de alto riesgo con DPA.
- % de empleados capacitados.
- Incidentes reportados a la SIC en plazo.
- RNBD actualizado antes del 31 de marzo.
- Hallazgos críticos cerrados en 60 días.

---

## 12. Programa de auditoría interna y mejora continua

### 12.1 Principios

Independencia, objetividad, enfoque basado en riesgo, evidencia, confidencialidad y orientación a la mejora. La auditoría no sustituye la responsabilidad de los dueños de proceso.

### 12.2 Plan anual

| Trimestre | Alcance | Evidencia |
|---|---|---|
| Q1 | Gobierno, política, inventario y RNBD | Documentos, inscripción, actas |
| Q2 | Autorizaciones, avisos, derechos y PQRS | Muestreo, registros, tiempos |
| Q3 | Seguridad, accesos, respaldos, nube y proveedores | Configuraciones, contratos, pruebas |
| Q4 | Incidentes, capacitación, retención y mejora | Bitácora, LMS, borrados, CAPA |

### 12.3 Métodos

- Entrevistas y recorridos.
- Revisión documental.
- Muestreo de autorizaciones, reclamos y contratos.
- Pruebas técnicas: MFA, cifrado, restauración, accesos.
- Revisión de logs y tickets.
- Comparación con la lista de verificación de la sección 1.

### 12.4 Hallazgos y CAPA

Clasificar en crítico, alto, medio y bajo. Cada hallazgo debe tener acción correctiva, responsable, fecha, evidencia y verificación de eficacia. Los críticos se escalan a la Alta Dirección y se cierran en un máximo de 30–60 días.

| Campo | Contenido |
|---|---|
| ID | [ ] |
| Hallazgo | [ ] |
| Norma | [ ] |
| Riesgo | [ ] |
| Acción | [ ] |
| Responsable | [ ] |
| Fecha compromiso | [ ] |
| Evidencia de cierre | [ ] |
| Verificación | [ ] |

### 12.5 Indicadores de accountability

| Indicador | Meta |
|---|---|
| Bases de datos inventariadas | 100 % |
| Autorizaciones con evidencia | 100 % nuevas; 90 % heredadas |
| Solicitudes respondidas en plazo | 100 % |
| Sistemas críticos con MFA | 100 % |
| Respaldos probados | 100 % trimestral |
| Proveedores de alto riesgo con DPA | 100 % |
| Empleados capacitados | ≥ 95 % |
| Incidentes reportados en plazo | 100 % |
| RNBD actualizado | 100 % antes del 31 de marzo |
| Hallazgos críticos cerrados | ≥ 90 % en 60 días |
| Clic en phishing | < 5 % |

### 12.6 Modelo de madurez

| Nivel | Descripción |
|---|---|
| 1. Inicial | Actividades aisladas, sin documentación. |
| 2. Repetible | Políticas básicas, controles informales. |
| 3. Definido | Procesos documentados, roles y métricas. |
| 4. Gestionado | Indicadores, auditoría y mejora sistemática. |
| 5. Optimizado | Mejora continua, automatización y cultura de privacidad. |

### 12.7 Revisión por la dirección

Una vez al año, revisar: cambios normativos, incidentes, quejas, resultados de auditoría, riesgos, indicadores, capacitación, proveedores, transferencias, RNBD y presupuesto. Dejar acta con decisiones y responsables.

### 12.8 Evidencia de responsabilidad demostrada

Conservar: política aprobada, avisos, autorizaciones, inventario, análisis de riesgo, DPIA, contratos, registros de capacitación, incidentes, reportes a la SIC, auditorías, actas del comité, indicadores y planes de mejora. Esta evidencia es la que demuestra que la organización actuó con diligencia.

---

## Anexo A. Plantilla de inventario de bases de datos

| Campo | Contenido |
|---|---|
| Nombre de la base | [ ] |
| Dueño de proceso | [ ] |
| Finalidad | [ ] |
| Base legal | [ ] |
| Titulares | [ ] |
| Categorías de datos | [ ] |
| ¿Datos sensibles? | [Sí/No; cuáles] |
| ¿Menores? | [Sí/No] |
| Origen y canal | [ ] |
| Sistemas y ubicación | [ ] |
| Encargados | [ ] |
| Transferencias | [ ] |
| Retención | [ ] |
| Medidas de seguridad | [ ] |
| ¿Inscrita en RNBD? | [Sí/No; fecha] |
| Última revisión | [ ] |

## Anexo B. Plantilla de retención

| Base | Dato | Plazo | Fundamento | Destino final | Responsable |
|---|---|---|---|---|---|
| [ ] | [ ] | [ ] | [Legal/contractual] | [Borrado/archivo] | [ ] |

## Anexo C. Plantilla de evaluación de impacto (DPIA)

1. Descripción del tratamiento y contexto.
2. Necesidad y proporcionalidad.
3. Categorías de datos y titulares.
4. Base legal y autorización.
5. Riesgos para derechos y libertades.
6. Medidas de seguridad y mitigación.
7. Transferencias internacionales.
8. Consulta al DPO y a Jurídica.
9. Riesgo residual y decisión.
10. Fecha de revisión.

## Anexo D. Glosario breve

- **Autorización:** consentimiento previo, expreso e informado.
- **Dato personal:** información vinculada a una persona natural identificada o identificable.
- **Dato sensible:** salud, biometría, origen étnico, política, religión, vida sexual, entre otros.
- **Encargado:** trata datos por cuenta del Responsable.
- **Responsable:** decide sobre la finalidad y los medios.
- **Transferencia:** envío a un receptor que actúa como Responsable.
- **Transmisión:** comunicación a un Encargado.
- **RNBD:** registro público de bases de datos de la SIC.
- **PQRS:** peticiones, quejas, reclamos y solicitudes.
- **DPIA:** evaluación de impacto en privacidad.

## Anexo E. Referencias normativas principales

- Constitución Política de 1991, art. 15.
- Ley 1581 de 2012.
- Decreto 1074 de 2015, que compila el Decreto 1377 de 2013.
- Ley 1266 de 2008, cuando aplique.
- Ley 1273 de 2009.
- Ley 527 de 1999.
- Ley 1480 de 2011, cuando aplique consumo.
- Circulares y guías de la SIC, en especial la Circular Externa 003 de 2018 y las guías de responsabilidad demostrada.
- ISO/IEC 27001 e ISO/IEC 27701 como buenas prácticas.
- NIST SP 800-88 para eliminación segura.

## Anexo F. Puntos que debe validar un abogado

1. Aplicabilidad del RNBD según activos y UVT.
2. Lista vigente de países con nivel adecuado de protección.
3. Uso de videovigilancia y monitoreo laboral.
4. Tratamiento de biometría y salud ocupacional.
5. Datos de menores y autorización del representante.
6. Plazos de retención laborales, fiscales, contables y sectoriales.
7. Transferencias internacionales y cláusulas contractuales.
8. Cookies, marketing y comunicaciones electrónicas.
9. Régimen sancionatorio y reporte de incidentes.
10. Normas sectoriales especiales y obligaciones adicionales.
