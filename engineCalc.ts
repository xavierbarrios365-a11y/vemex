
/**
 * ═══════════════════════════════════════════════════════════════════
 *  VEMEX PRO-ENGINEERING — Motor de Cálculo Universal v3.0
 * ═══════════════════════════════════════════════════════════════════
 *  Función: calcularMaterialesUniversal()
 *  Capacidad: Genera la lista de compras exacta para CUALQUIER
 *  trabajo de herrería estándar, aplicando la fórmula geométrica
 *  correcta para cada caso (SWITCH).
 * ═══════════════════════════════════════════════════════════════════
 */

// ─── TIPOS DE TRABAJO SOPORTADOS ─────────────────────────────────
export type TipoTrabajo =
    // Grupo A: Cerramientos
    | 'puerta'
    | 'ventana'
    | 'porton'
    | 'proteccion_ventana'
    | 'cancel'
    | 'cortina_metalica'
    // Grupo B: Lineales
    | 'barandal'
    | 'cerca'
    | 'pasamanos'
    | 'reja'
    | 'malla_ciclonica'
    | 'tubular_ornamental'
    // Grupo C: Techumbres
    | 'techumbre'
    | 'pergola'
    | 'domo'
    | 'dos_aguas'
    | 'arco'
    // Grupo D: Escaleras
    | 'escalera_recta'
    | 'escalera_caracol'
    | 'escalera_tipo_u'
    | 'escalera_con_descanso';

export type GrupoTrabajo = 'cerramientos' | 'lineales' | 'techumbres' | 'escaleras';

// ─── CONFIGURACIÓN POR TIPO ──────────────────────────────────────
export interface ConfigCalculo {
    // Cerramientos
    separacionBarrotes?: number;   // metros (default 0.12)
    grosorMarco?: number;          // metros (default 0.038 = PTR 1.5")
    grosorBarrote?: number;        // metros (default 0.012 = cuadrado 1/2")
    rellenoTipo?: 'barrotes' | 'lamina'; // tipo de relleno interior
    refuerzosInternos?: number;    // número de refuerzos horizontales

    // Lineales
    separacionPostes?: number;     // metros (default 1.5)
    lineasHorizontales?: number;   // tubos horizontales intermedios (default 3)

    // Techumbres
    separacionVigas?: number;      // metros (default 3.0)
    separacionMontenes?: number;   // metros (default 1.0)
    vueloTecho?: number;           // metros de vuelo/alero (default 0.3)
    anchoLamina?: number;          // metros (default 1.0 útil)
    largoLamina?: number;          // metros (default 3.66 = lámina estándar)

    // Escaleras
    alturaPaso?: number;           // metros (default 0.18)
    huellaEscalon?: number;        // metros (default 0.28)
}

// ─── RESULTADO DE LÍNEA DE MATERIAL ──────────────────────────────
export interface LineaMaterial {
    concepto: string;          // "Marco Perimetral", "Barrotes Verticales", etc.
    metrosLineales: number;    // metros reales calculados
    tramosNecesarios: number;  // tramos de 6m (redondeado arriba)
    piezas: number;            // para unitarios (chapas, bisagras)
    esPieza: boolean;          // true si se cuenta por pieza, no por ML
    sobrante: number;          // metros sobrantes de taller
    materialSugerido: string;  // nombre sugerido del material
    categoriaRol: string;      // "marco" | "relleno" | "estructura" | "herraje"
}

// ─── RESULTADO COMPLETO ──────────────────────────────────────────
export interface ResultadoCalculo {
    grupo: GrupoTrabajo;
    tipoTrabajo: TipoTrabajo;
    descripcion: string;
    lineas: LineaMaterial[];
    metrosTotales: number;
    tramosTotales: number;
    desperdicioAplicado: number; // porcentaje
}

// ─── HELPERS ─────────────────────────────────────────────────────
function ml(metros: number): number {
    return Math.round(metros * 1000) / 1000; // 3 decimales
}

function tramosDeSeisM(metrosConDesp: number): number {
    return Math.ceil(metrosConDesp / 6);
}

function linea(
    concepto: string,
    metrosLineales: number,
    materialSugerido: string,
    categoriaRol: string,
    desperdicio: number
): LineaMaterial {
    const conDesp = ml(metrosLineales * (1 + desperdicio));
    const tramos = tramosDeSeisM(conDesp);
    const comprado = tramos * 6;
    return {
        concepto,
        metrosLineales: ml(conDesp),
        tramosNecesarios: tramos,
        piezas: 0,
        esPieza: false,
        sobrante: ml(comprado - conDesp),
        materialSugerido,
        categoriaRol,
    };
}

function pieza(
    concepto: string,
    cantidad: number,
    materialSugerido: string,
    categoriaRol: string
): LineaMaterial {
    return {
        concepto,
        metrosLineales: 0,
        tramosNecesarios: 0,
        piezas: cantidad,
        esPieza: true,
        sobrante: 0,
        materialSugerido,
        categoriaRol,
    };
}

// ─── CLASIFICADOR DE GRUPO ───────────────────────────────────────
/**
 * Clasifica un tipo de trabajo en su grupo funcional correspondiente.
 */
export function getGrupo(tipo: TipoTrabajo): GrupoTrabajo {
    switch (tipo) {
        case 'puerta':
        case 'ventana':
        case 'porton':
        case 'proteccion_ventana':
        case 'cancel':
        case 'cortina_metalica':
            return 'cerramientos';
        case 'barandal':
        case 'cerca':
        case 'pasamanos':
        case 'reja':
        case 'malla_ciclonica':
        case 'tubular_ornamental':
            return 'lineales';
        case 'techumbre':
        case 'pergola':
        case 'domo':
        case 'dos_aguas':
        case 'arco':
            return 'techumbres';
        case 'escalera_recta':
        case 'escalera_caracol':
        case 'escalera_tipo_u':
        case 'escalera_con_descanso':
            return 'escaleras';
    }
}

// ─── CATÁLOGO DE TIPOS CON METADATA ─────────────────────────────
export interface TipoTrabajoMeta {
    id: TipoTrabajo;
    label: string;
    grupo: GrupoTrabajo;
    grupoLabel: string;
    icon: string;
    color: string;
    descripcion: string;
}

export const CATALOGO_TIPOS: TipoTrabajoMeta[] = [
    // Grupo A: Cerramientos
    { id: 'ventana', label: 'Ventana', grupo: 'cerramientos', grupoLabel: 'Cerramientos', icon: 'window', color: '#4682b4', descripcion: 'Marco + barrotes/lámina' },
    { id: 'puerta', label: 'Puerta', grupo: 'cerramientos', grupoLabel: 'Cerramientos', icon: 'door_front', color: '#4682b4', descripcion: 'Marco perimetral + relleno' },
    { id: 'porton', label: 'Portón', grupo: 'cerramientos', grupoLabel: 'Cerramientos', icon: 'garage', color: '#4682b4', descripcion: 'Portón corredizo/abatible' },
    { id: 'proteccion_ventana', label: 'Protección', grupo: 'cerramientos', grupoLabel: 'Cerramientos', icon: 'grid_on', color: '#4682b4', descripcion: 'Reja p/ventana con marco' },
    { id: 'cancel', label: 'Cancel', grupo: 'cerramientos', grupoLabel: 'Cerramientos', icon: 'door_sliding', color: '#4682b4', descripcion: 'Divisor de vidrio/aluminio' },
    { id: 'cortina_metalica', label: 'Cortina Metálica', grupo: 'cerramientos', grupoLabel: 'Cerramientos', icon: 'blinds', color: '#4682b4', descripcion: 'Cortina enrollable p/local' },
    // Grupo B: Lineales
    { id: 'barandal', label: 'Barandal', grupo: 'lineales', grupoLabel: 'Lineales', icon: 'fence', color: '#ff6700', descripcion: 'Pasamanos + postes + relleno' },
    { id: 'cerca', label: 'Cerca', grupo: 'lineales', grupoLabel: 'Lineales', icon: 'security', color: '#ff6700', descripcion: 'Cerca perimetral con postes' },
    { id: 'pasamanos', label: 'Pasamanos', grupo: 'lineales', grupoLabel: 'Lineales', icon: 'stacked_bar_chart', color: '#ff6700', descripcion: 'Tubo superior lineal' },
    { id: 'reja', label: 'Reja', grupo: 'lineales', grupoLabel: 'Lineales', icon: 'deployed_code', color: '#ff6700', descripcion: 'Reja perimetral sólida' },
    { id: 'malla_ciclonica', label: 'Malla Ciclónica', grupo: 'lineales', grupoLabel: 'Lineales', icon: 'grid_4x4', color: '#ff6700', descripcion: 'Postes + malla + alambre' },
    { id: 'tubular_ornamental', label: 'Tubular Ornamental', grupo: 'lineales', grupoLabel: 'Lineales', icon: 'auto_awesome', color: '#ff6700', descripcion: 'Cerca decorativa tubular' },
    // Grupo C: Techumbres
    { id: 'techumbre', label: 'Techumbre', grupo: 'techumbres', grupoLabel: 'Techumbres', icon: 'roofing', color: '#22c55e', descripcion: 'Estructura + láminas' },
    { id: 'pergola', label: 'Pérgola', grupo: 'techumbres', grupoLabel: 'Techumbres', icon: 'deck', color: '#22c55e', descripcion: 'Pérgola con vigas expuestas' },
    { id: 'domo', label: 'Domo', grupo: 'techumbres', grupoLabel: 'Techumbres', icon: 'wb_twilight', color: '#22c55e', descripcion: 'Domo policarbonato/acrílico' },
    { id: 'dos_aguas', label: 'Dos Aguas', grupo: 'techumbres', grupoLabel: 'Techumbres', icon: 'cottage', color: '#22c55e', descripcion: 'Techo a 2 pendientes' },
    { id: 'arco', label: 'Arco Techo', grupo: 'techumbres', grupoLabel: 'Techumbres', icon: 'filter_drama', color: '#22c55e', descripcion: 'Estructura curva/arco' },
    // Grupo D: Escaleras
    { id: 'escalera_recta', label: 'Recta', grupo: 'escaleras', grupoLabel: 'Escaleras', icon: 'stairs', color: '#a855f7', descripcion: 'Escalones + limones laterales' },
    { id: 'escalera_caracol', label: 'Caracol', grupo: 'escaleras', grupoLabel: 'Escaleras', icon: 'assist_walker', color: '#a855f7', descripcion: 'Espiral c/poste central' },
    { id: 'escalera_tipo_u', label: 'Tipo U', grupo: 'escaleras', grupoLabel: 'Escaleras', icon: 'u_turn_right', color: '#a855f7', descripcion: '2 tramos + descanso 180°' },
    { id: 'escalera_con_descanso', label: 'Con Descanso', grupo: 'escaleras', grupoLabel: 'Escaleras', icon: 'view_cozy', color: '#a855f7', descripcion: '2 tramos + plataforma' },
];

// ═════════════════════════════════════════════════════════════════
//  FUNCIÓN PRINCIPAL — MOTOR UNIVERSAL
// ═════════════════════════════════════════════════════════════════
/**
 * FUNCIÓN PRINCIPAL — MOTOR UNIVERSAL DE CÁLCULO
 * Realiza el despiece técnico y presupuesto base para trabajos de herrería.
 * 
 * @param tipoTrabajo - Identificador único del tipo de obra (puerta, reja, etc.)
 * @param ancho - Dimensión horizontal de la obra en metros.
 * @param alto - Dimensión vertical o largo de la obra en metros.
 * @param config - Parámetros técnicos opcionales (grosores, separaciones).
 * @returns ResultadoCalculo con lista de materiales, tramos y consumibles.
 */
export function calcularMaterialesUniversal(
    tipoTrabajo: TipoTrabajo,
    ancho: number,
    alto: number,
    config: ConfigCalculo = {}
): ResultadoCalculo {
    // 0. VALIDACIÓN DE ENTRADAS (Fail-Safe)
    if (ancho <= 0 || alto <= 0) {
        return {
            grupo: getGrupo(tipoTrabajo),
            tipoTrabajo,
            descripcion: 'Dimensiones inválidas (≤ 0)',
            lineas: [],
            metrosTotales: 0,
            tramosTotales: 0,
            desperdicioAplicado: 0
        };
    }

    const grupo = getGrupo(tipoTrabajo);
    const DESP = 0.10; // 10% desperdicio general

    const resultado: ResultadoCalculo = {
        grupo,
        tipoTrabajo,
        descripcion: '',
        lineas: [],
        metrosTotales: 0,
        tramosTotales: 0,
        desperdicioAplicado: DESP * 100,
    };

    // ─────────────────────────────────────────────────────────────
    // CASO 1: CERRAMIENTOS (Puertas, Ventanas, Portones)
    // ─────────────────────────────────────────────────────────────
    if (grupo === 'cerramientos') {
        const label = CATALOGO_TIPOS.find(t => t.id === tipoTrabajo)?.label || tipoTrabajo;
        resultado.descripcion = `${label} de ${ancho}m × ${alto}m`;

        const grosorMarco = config.grosorMarco ?? 0.038;
        const grosorBarrote = config.grosorBarrote ?? 0.012;
        const separacion = config.separacionBarrotes ?? 0.12;
        const relleno = config.rellenoTipo ?? 'barrotes';
        const refuerzos = config.refuerzosInternos ?? 0;

        // Cortina Metálica: cálculo especial
        if (tipoTrabajo === 'cortina_metalica') {
            resultado.lineas.push(linea('Guías Laterales (2)', alto * 2, 'Ángulo 2" Cal 14', 'marco', DESP));
            resultado.lineas.push(linea('Eje Superior (Tambor)', ancho + 0.2, 'Tubo Redondo 3" Sch40', 'estructura', DESP));
            const numDuelas = Math.ceil(alto / 0.076); // ~3" cada duela
            resultado.lineas.push(pieza(`${numDuelas} Duelas de Cortina`, numDuelas, 'Duela p/Cortina 3"', 'relleno'));
            resultado.lineas.push(pieza('Resortes/Mecanismo', 2, 'Resorte p/Cortina', 'herraje'));
            resultado.lineas.push(pieza('Chapa Cortina', 1, 'Chapa Cortina', 'herraje'));
        } else {
            // Marco Perimetral (puerta, ventana, porton, proteccion, cancel)
            const perimetro = (alto * 2) + (ancho * 2);
            resultado.lineas.push(
                linea('Marco Perimetral', perimetro, 'PTR 1 1/2" Cal 14', 'marco', DESP)
            );

            if (refuerzos > 0) {
                resultado.lineas.push(
                    linea(`${refuerzos} Refuerzo(s) Interno(s)`, ancho * refuerzos, 'PTR 1 1/2" Cal 14', 'marco', DESP)
                );
            }

            // Relleno Interior
            if (relleno === 'barrotes') {
                const huecoInterior = ancho - (grosorMarco * 2);
                const numBarrotes = Math.floor(huecoInterior / (separacion + grosorBarrote));
                const alturaBarrote = alto - (grosorMarco * 2);
                resultado.lineas.push(
                    linea(`${numBarrotes} Barrotes Verticales @${(separacion * 100).toFixed(0)}cm`, numBarrotes * alturaBarrote, 'Cuadrado 1/2"', 'relleno', DESP)
                );
            } else {
                const areaInterior = (ancho - grosorMarco * 2) * (alto - grosorMarco * 2);
                resultado.lineas.push(
                    linea(`Lámina Interior (${areaInterior.toFixed(2)}m²)`, areaInterior, 'Lámina Cal 24', 'relleno', DESP)
                );
            }

            // Herrajes
            if (tipoTrabajo === 'puerta' || tipoTrabajo === 'porton') {
                resultado.lineas.push(pieza('Bisagras Industriales', tipoTrabajo === 'porton' ? 6 : 3, 'Bisagra 4"', 'herraje'));
                resultado.lineas.push(pieza('Chapa / Cerradura', 1, 'Chapa Residencial', 'herraje'));
            }
            if (tipoTrabajo === 'cancel') {
                resultado.lineas.push(pieza('Riel Superior/Inferior', 2, 'Riel p/Cancel', 'herraje'));
                resultado.lineas.push(pieza('Rodamientos', 4, 'Rodamiento p/Cancel', 'herraje'));
            }
        }
    }

    // ─────────────────────────────────────────────────────────────
    // CASO 2: LINEALES (Barandales, Cercas, Pasamanos)
    // ─────────────────────────────────────────────────────────────
    else if (grupo === 'lineales') {
        const label = CATALOGO_TIPOS.find(t => t.id === tipoTrabajo)?.label || tipoTrabajo;
        resultado.descripcion = `${label} de ${ancho}m × ${alto}m alto`;

        const separacionPostes = config.separacionPostes ?? 1.5;
        const lineasH = config.lineasHorizontales ?? 3;

        // Malla Ciclónica: cálculo especial
        if (tipoTrabajo === 'malla_ciclonica') {
            const numPostes = Math.ceil(ancho / 3.0) + 1; // cada 3m
            resultado.lineas.push(linea(`${numPostes} Postes @3m`, numPostes * (alto + 0.4), 'Poste Galvanizado 2 3/8"', 'estructura', DESP));
            const rollosMalla = Math.ceil(ancho / 20); // rollos de 20m
            resultado.lineas.push(pieza(`${rollosMalla} Rollo(s) Malla Ciclónica`, rollosMalla, 'Malla Ciclónica Cal 12.5', 'relleno'));
            resultado.lineas.push(linea('Alambre de Tensión', ancho * 3, 'Alambre Galv. Cal 12', 'relleno', DESP));
            resultado.lineas.push(pieza('Tensor/Tirfor p/Malla', numPostes, 'Tensor p/Malla', 'herraje'));
        } else {
            // 1. Pasamanos / Tubo Superior
            resultado.lineas.push(
                linea('Pasamanos Superior', ancho, 'PTR 1 1/2" Cal 14', 'estructura', DESP)
            );

            // 2. Postes Verticales
            const numPostes = Math.ceil(ancho / separacionPostes) + 1;
            const matPoste = tipoTrabajo === 'reja' ? 'PTR 2×2" Cal 14' : 'PTR 1 1/2" Cal 14';
            resultado.lineas.push(
                linea(`${numPostes} Postes @${separacionPostes}m`, numPostes * alto, matPoste, 'estructura', DESP)
            );

            // 3. Horizontales
            if (lineasH > 0 && tipoTrabajo !== 'pasamanos') {
                resultado.lineas.push(
                    linea(`${lineasH} Líneas Horizontales`, ancho * lineasH, 'PTR 1" Cal 14', 'relleno', DESP)
                );
            }

            // 4. Relleno vertical
            if (tipoTrabajo === 'barandal' || tipoTrabajo === 'reja' || tipoTrabajo === 'tubular_ornamental') {
                const grosorBarrote = config.grosorBarrote ?? 0.012;
                const separacion = config.separacionBarrotes ?? 0.12;
                const numBarrotines = Math.floor(ancho / (separacion + grosorBarrote));
                const alturaBarrotin = tipoTrabajo === 'barandal' ? alto * 0.7 : alto;
                const matRelleno = tipoTrabajo === 'tubular_ornamental' ? 'Tubo Redondo 3/4"' : 'Cuadrado 1/2"';
                resultado.lineas.push(
                    linea(`${numBarrotines} Barrotines`, numBarrotines * alturaBarrotin, matRelleno, 'relleno', DESP)
                );
            }
        }
    }

    // ─────────────────────────────────────────────────────────────
    // CASO 3: TECHUMBRES (Techos, Pérgolas)
    // ─────────────────────────────────────────────────────────────
    else if (grupo === 'techumbres') {
        const label = CATALOGO_TIPOS.find(t => t.id === tipoTrabajo)?.label || tipoTrabajo;
        resultado.descripcion = `${label} de ${ancho}m × ${alto}m`;

        const sepVigas = config.separacionVigas ?? 3.0;
        const sepMontenes = config.separacionMontenes ?? 1.0;
        const vuelo = config.vueloTecho ?? 0.30;
        const anchoLamina = config.anchoLamina ?? 1.0;
        const largoLamina = config.largoLamina ?? 3.66;

        const anchoTotal = ancho + (vuelo * 2);
        let altoTotal = alto + (vuelo * 2);

        // Arco: desarrollo = PI * radio (semicírculo sobre ancho)
        if (tipoTrabajo === 'arco') {
            altoTotal = (Math.PI * (ancho / 2)); // desarrollo del arco
        }
        // Dos aguas: pendiente = hipotenusa desde centro
        if (tipoTrabajo === 'dos_aguas') {
            const mediaAgua = ancho / 2;
            const pendiente = Math.sqrt(Math.pow(mediaAgua, 2) + Math.pow(alto, 2));
            altoTotal = pendiente + vuelo;
        }

        // 1. Vigas Maestras
        const numVigas = Math.ceil(anchoTotal / sepVigas) + 1;
        resultado.lineas.push(
            linea(`${numVigas} Vigas Maestras @${sepVigas}m`, numVigas * altoTotal, 'PTR 4×2" Cal 14', 'estructura', DESP)
        );

        // 2. Montenes
        const numMontenes = Math.ceil(altoTotal / sepMontenes) + 1;
        resultado.lineas.push(
            linea(`${numMontenes} Montenes @${sepMontenes}m`, numMontenes * anchoTotal, 'Monten C 4"', 'estructura', DESP)
        );

        // 3. Cubierta (Láminas o Policarbonato)
        const areaTotal = anchoTotal * altoTotal;
        const areaLamina = anchoLamina * largoLamina;
        const numLaminas = Math.ceil(areaTotal / areaLamina);
        const matLamina = tipoTrabajo === 'domo' ? `Policarbonato ${largoLamina}m` : `Lámina Galv. ${largoLamina}m`;
        resultado.lineas.push(
            pieza(`${numLaminas} Paneles Cubierta`, numLaminas, matLamina, 'relleno')
        );

        // 4. Columnas (pérgola 4, domo 4+, dos aguas depende)
        if (tipoTrabajo === 'pergola' || tipoTrabajo === 'domo') {
            resultado.lineas.push(
                linea('4 Columnas de Soporte', 4 * 2.5, 'PTR 3×3" Cal 14', 'estructura', DESP)
            );
        }
        if (tipoTrabajo === 'dos_aguas') {
            resultado.lineas.push(
                linea('Cumbrera (Remate Superior)', ancho, 'Lámina Cumbrera', 'relleno', DESP)
            );
        }
    }

    // ─────────────────────────────────────────────────────────────
    // CASO 4: ESCALERAS (Rectas)
    // ─────────────────────────────────────────────────────────────
    else if (grupo === 'escaleras') {
        const label = CATALOGO_TIPOS.find(t => t.id === tipoTrabajo)?.label || 'Escalera';
        resultado.descripcion = `Escalera ${label} — ${alto}m altura × ${ancho}m ancho`;

        const alturaPaso = config.alturaPaso ?? 0.18;
        const huella = config.huellaEscalon ?? 0.28;

        if (tipoTrabajo === 'escalera_caracol') {
            // Caracol: poste central + peldaños radiales
            const numEscalones = Math.ceil(alto / alturaPaso);
            const radio = ancho / 2;
            resultado.lineas.push(linea('Poste Central', alto + 1.0, 'Tubo Redondo 4" Sch40', 'estructura', DESP));
            resultado.lineas.push(linea(`${numEscalones} Peldaños Radiales`, numEscalones * radio, 'Placa Antiderrapante 3/16"', 'relleno', DESP));
            // Barandal helicoidal: desarrollo ≈ circunferencia × vueltas
            const vueltas = numEscalones / 12; // ~12 escalones por vuelta
            const desarrolloBarandal = 2 * Math.PI * radio * vueltas;
            resultado.lineas.push(linea('Barandal Helicoidal', desarrolloBarandal, 'Tubo Redondo 1 1/2"', 'estructura', DESP));
            const numPostesB = numEscalones;
            resultado.lineas.push(linea(`${numPostesB} Postes Barandal`, numPostesB * 0.9, 'Cuadrado 1/2"', 'estructura', DESP));
        } else if (tipoTrabajo === 'escalera_tipo_u' || tipoTrabajo === 'escalera_con_descanso') {
            // 2 tramos + descanso
            const alturaTramo = alto / 2;
            const numEscalonesTramo = Math.ceil(alturaTramo / alturaPaso);
            const numEscalones = numEscalonesTramo * 2;
            const largoTramo = numEscalonesTramo * huella;
            const hipotenusa = Math.sqrt(Math.pow(alturaTramo, 2) + Math.pow(largoTramo, 2));

            // 4 limones (2 tramos × 2 laterales)
            resultado.lineas.push(linea('4 Limones (2 tramos)', hipotenusa * 4, 'PTR 4×2" Cal 14', 'estructura', DESP));
            resultado.lineas.push(linea(`${numEscalones} Peldaños`, numEscalones * ancho, 'Placa Antiderrapante 3/16"', 'relleno', DESP));
            // Descanso
            resultado.lineas.push(linea('Plataforma de Descanso', ancho * ancho, 'Placa Antiderrapante 3/16"', 'estructura', DESP));
            resultado.lineas.push(linea(`${numEscalones} Costillas`, numEscalones * (alturaPaso * 2), 'Ángulo 1 1/4"', 'estructura', DESP));
            resultado.lineas.push(linea('Barandal (2 tramos)', hipotenusa * 2, 'PTR 1 1/2" Cal 14', 'estructura', DESP));
            const numPostesB = Math.ceil(hipotenusa * 2 / 1.0) + 2;
            resultado.lineas.push(linea(`${numPostesB} Postes Barandal`, numPostesB * 0.9, 'PTR 1" Cal 14', 'estructura', DESP));
        } else {
            // Escalera Recta (original)
            const numEscalones = Math.ceil(alto / alturaPaso);
            const largoHorizontal = numEscalones * huella;
            const hipotenusa = Math.sqrt(Math.pow(alto, 2) + Math.pow(largoHorizontal, 2));
            resultado.lineas.push(linea(`2 Limones (${hipotenusa.toFixed(2)}m c/u)`, hipotenusa * 2, 'PTR 4×2" Cal 14', 'estructura', DESP));
            resultado.lineas.push(linea(`${numEscalones} Peldaños @${ancho}m`, ancho * numEscalones, 'Placa Antiderrapante 3/16"', 'relleno', DESP));
            resultado.lineas.push(linea(`${numEscalones} Costillas`, numEscalones * (alturaPaso * 2), 'Ángulo 1 1/4"', 'estructura', DESP));
            resultado.lineas.push(linea('Barandal de Seguridad', hipotenusa, 'PTR 1 1/2" Cal 14', 'estructura', DESP));
            const numPostesBarandal = Math.ceil(hipotenusa / 1.0) + 1;
            resultado.lineas.push(linea(`${numPostesBarandal} Postes Barandal`, numPostesBarandal * 0.9, 'PTR 1" Cal 14', 'estructura', DESP));
        }
    }

    // ─── TOTALES PARCIALES (PARA CONSUMIBLES) ────────────────────
    const metrosEstructurales = resultado.lineas
        .filter(l => l.categoriaRol === 'marco' || l.categoriaRol === 'estructura')
        .reduce((acc, l) => acc + l.metrosLineales, 0);

    const metrosRelleno = resultado.lineas
        .filter(l => l.categoriaRol === 'relleno' && !l.esPieza)
        .reduce((acc, l) => acc + l.metrosLineales, 0);

    // ─────────────────────────────────────────────────────────────
    // CÁLCULO DE CONSUMIBLES (Electrodo, Discos, Mechas)
    // ─────────────────────────────────────────────────────────────

    // 1. Electrodos (estimación: 1kg por cada 20-30m de perfiles livianos/medios)
    const kgElectrodo = ml((metrosEstructurales + metrosRelleno) * 0.04);
    if (kgElectrodo > 0) {
        resultado.lineas.push(pieza('Electrodos 6013 1/8" (Estimado)', Math.ceil(kgElectrodo), 'Electrodos 6013 1/8" (kg)', 'consumible'));
    }

    // 2. Discos de Corte 4.5" (fuerza por cortes: marco + relleno)
    // Estimación: 1 disco por cada 15-20 cortes.
    const cutsMarco = 4 + (config.refuerzosInternos ?? 0) * 2;
    let cutsRelleno = 0;
    if (grupo === 'cerramientos' && config.rellenoTipo === 'barrotes') {
        const huecoInterior = ancho - ((config.grosorMarco ?? 0.038) * 2);
        cutsRelleno = Math.floor(huecoInterior / ((config.separacionBarrotes ?? 0.12) + (config.grosorBarrote ?? 0.012))) * 2;
    } else if (grupo === 'lineales') {
        cutsRelleno = (Math.ceil(ancho / (config.separacionPostes ?? 1.5)) + 1) * 2;
    }
    const totalCuts = cutsMarco + cutsRelleno;
    const numDiscosCorte = Math.ceil(totalCuts / 15);
    if (numDiscosCorte > 0) {
        resultado.lineas.push(pieza('Discos de Corte 4.5" (Estimado)', numDiscosCorte, 'Disco de Corte 4.5"', 'consumible'));
    }

    // 3. Disco de Desbaste (1 por cada 2-3 discos de corte)
    const numDiscosDesbaste = Math.ceil(numDiscosCorte / 3);
    if (numDiscosDesbaste > 0) {
        resultado.lineas.push(pieza('Disco de Desbaste (Pulido)', numDiscosDesbaste, 'Disco de Desbaste 4.5"', 'consumible'));
    }

    // 4. Mechas/Brocas (Para instalación: taquetes, chapas, etc.)
    if (grupo === 'cerramientos' || grupo === 'lineales') {
        resultado.lineas.push(pieza('Mecha 1/4" (Instalación)', 1, 'Mecha p/Metal 1/4"', 'consumible'));
        if (config.rellenoTipo === 'barrotes') {
            resultado.lineas.push(pieza('Mecha 1/8" (Puntos)', 1, 'Mecha p/Metal 1/8"', 'consumible'));
        }
    }

    // 5. Disco de Tronzadora (14") — para techos o escaleras pesadas
    if (grupo === 'techumbres' || grupo === 'escaleras') {
        resultado.lineas.push(pieza('Disco Tronzadora 14"', 1, 'Disco Tronzadora 14"', 'consumible'));
    }

    // ─── TOTALES FINALES ───────────────────────────────────────────
    resultado.metrosTotales = resultado.lineas.reduce((acc, l) => acc + l.metrosLineales, 0);
    resultado.tramosTotales = resultado.lineas.reduce((acc, l) => acc + l.tramosNecesarios, 0);

    return resultado;
}

// ─── DEFAULTS DE CONFIG POR TIPO ─────────────────────────────────
/**
 * Retorna la configuración de ingeniería por defecto para un tipo de trabajo.
 * Estos valores aseguran que el motor de cálculo siempre use dimensiones válidas.
 */
export function getDefaultConfig(tipo: TipoTrabajo): ConfigCalculo {
    switch (getGrupo(tipo)) {
        case 'cerramientos':
            return {
                separacionBarrotes: tipo === 'proteccion_ventana' ? 0.10 : 0.12,
                grosorMarco: 0.038,
                grosorBarrote: 0.012,
                rellenoTipo: tipo === 'cortina_metalica' ? 'lamina' : 'barrotes',
                refuerzosInternos: tipo === 'porton' ? 2 : (tipo === 'puerta' || tipo === 'cancel' ? 1 : 0),
            };
        case 'lineales':
            return {
                separacionPostes: tipo === 'malla_ciclonica' ? 3.0 : 1.5,
                lineasHorizontales: tipo === 'pasamanos' ? 0 : (tipo === 'malla_ciclonica' ? 0 : 3),
                separacionBarrotes: 0.12,
                grosorBarrote: 0.012,
            };
        case 'techumbres':
            return {
                separacionVigas: 3.0,
                separacionMontenes: 1.0,
                vueloTecho: 0.30,
                anchoLamina: tipo === 'domo' ? 1.22 : 1.0,
                largoLamina: 3.66,
            };
        case 'escaleras':
            return {
                alturaPaso: 0.18,
                huellaEscalon: 0.28,
            };
    }
}
