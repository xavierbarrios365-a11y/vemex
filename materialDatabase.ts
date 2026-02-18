
/**
 * ═══════════════════════════════════════════════════════════════════
 *  VEMEX PRO-ENGINEERING — Base de Datos Universal de Ferretería v3.0
 * ═══════════════════════════════════════════════════════════════════
 *  Contiene 150+ materiales estándar: Perfiles, Láminas, Tubos, Herrajes.
 *  Incluye diferentes calibres, consumibles especializados y techos.
 * ═══════════════════════════════════════════════════════════════════
 */

export interface UniversalMaterial {
    id: string;
    name: string;
    category: 'perfil' | 'tubo' | 'lamina' | 'herraje' | 'consumible';
    subCategory: string;
    unit: 'tramo_6m' | 'pza' | 'm2' | 'kg' | 'lt' | 'paquete';
    priceBase: number;
    description: string;
    gauge?: string;
}

const PTR_SIZES = ['1"', '1 1/4"', '1 1/2"', '2"', '2 1/2"', '3"', '4"'];
const PTR_GAUGES = [
    { label: 'Cal 14', priceMod: 1.0 },
    { label: 'Cal 13', priceMod: 1.15 },
    { label: 'Cal 12', priceMod: 1.35 },
    { label: 'Cal 11', priceMod: 1.6 },
    { label: 'Cal 10 (Industrial)', priceMod: 2.1 }
];

const TUBO_SIZES = ['1/2"', '3/4"', '1"', '1 1/4"', '1 1/2"', '2"', '3"', '4"'];
const TUBO_CEDULAS = [
    { label: 'Céd 30', priceMod: 1.0 },
    { label: 'Céd 40 (Industrial)', priceMod: 1.4 }
];

const GENERATED_MATERIALS: UniversalMaterial[] = [];

// Generar PTRs
PTR_SIZES.forEach(size => {
    PTR_GAUGES.forEach(gauge => {
        const basePrice = 400 + (PTR_SIZES.indexOf(size) * 150);
        GENERATED_MATERIALS.push({
            id: `ptr-${size.replace(/ /g, '-')}-${gauge.label.replace(/ /g, '-')}`,
            name: `PTR ${size} ${gauge.label}`,
            category: 'perfil',
            subCategory: 'PTR',
            unit: 'tramo_6m',
            priceBase: Math.round(basePrice * gauge.priceMod),
            description: `Perfil tubular cuadrado ${size} ${gauge.label}`,
            gauge: gauge.label
        });
    });
});

// Generar Tubos
TUBO_SIZES.forEach(size => {
    TUBO_CEDULAS.forEach(ced => {
        const basePrice = 250 + (TUBO_SIZES.indexOf(size) * 120);
        GENERATED_MATERIALS.push({
            id: `tubo-${size.replace(/\//g, '-')}-${ced.label.replace(/ /g, '-')}`,
            name: `Tubo ${size} ${ced.label}`,
            category: 'tubo',
            subCategory: 'Tubería',
            unit: 'tramo_6m',
            priceBase: Math.round(basePrice * ced.priceMod),
            description: `Tubo redondo ${size} ${ced.label}`,
            gauge: ced.label
        });
    });
});

const ROOFING: UniversalMaterial[] = [
    { id: 'roof-r101-galv', name: 'Lámina R-101 Galv. 3.66m', category: 'lamina', subCategory: 'Techo', unit: 'pza', priceBase: 520, description: 'Lámina acanalada estándar' },
    { id: 'roof-r101-pintro', name: 'Lámina R-101 Pintro 3.66m', category: 'lamina', subCategory: 'Techo', unit: 'pza', priceBase: 740, description: 'Lámina prepintada blanca' },
    { id: 'roof-losacero-15', name: 'Lámina Losacero 15 3.66m', category: 'lamina', subCategory: 'Techo', unit: 'pza', priceBase: 1250, description: 'Lámina para entrepiso' },
    { id: 'roof-poly-transp', name: 'Poliacetato Transparente (m2)', category: 'lamina', subCategory: 'Techo', unit: 'm2', priceBase: 380, description: 'Techo traslúcido económico' },
    { id: 'roof-poly-celular', name: 'Policarbonato Celular 6mm (m2)', category: 'lamina', subCategory: 'Techo', unit: 'm2', priceBase: 520, description: 'Policarbonato de alta resistencia' },
    { id: 'roof-machimbrado', name: 'Machimbrado de Madera (m2)', category: 'lamina', subCategory: 'Techo', unit: 'm2', priceBase: 890, description: 'Acabado cálido en techos' },
    { id: 'roof-termico', name: 'Panel Térmico / Multypanel (m2)', category: 'lamina', subCategory: 'Techo', unit: 'm2', priceBase: 1450, description: 'Aislamiento térmico y acústico' },
];

const CONSUMABLES: UniversalMaterial[] = [
    // Discos
    { id: 'disc-cut-4.5', name: 'Disco de Corte 4.5" Acero', category: 'consumible', subCategory: 'Abrasivos', unit: 'pza', priceBase: 28, description: 'Corte fino de perfiles' },
    { id: 'disc-cut-7', name: 'Disco de Corte 7" Acero', category: 'consumible', subCategory: 'Abrasivos', unit: 'pza', priceBase: 65, description: 'Corte de placa pesada' },
    { id: 'disc-cut-14', name: 'Disco Tronzadora 14"', category: 'consumible', subCategory: 'Abrasivos', unit: 'pza', priceBase: 145, description: 'Para sierra de mesa' },
    { id: 'disc-grind-4.5', name: 'Disco de Desbaste 4.5"', category: 'consumible', subCategory: 'Abrasivos', unit: 'pza', priceBase: 42, description: 'Pulido de soldadura' },
    { id: 'disc-flap-4.5', name: 'Disco Flap Grano 60', category: 'consumible', subCategory: 'Abrasivos', unit: 'pza', priceBase: 58, description: 'Acabado espejo/fino' },

    // Brocas / Mechas
    { id: 'bit-metal-1/8', name: 'Mecha p/Metal 1/8"', category: 'consumible', subCategory: 'Taladrado', unit: 'pza', priceBase: 35, description: 'Alta velocidad' },
    { id: 'bit-metal-1/4', name: 'Mecha p/Metal 1/4"', category: 'consumible', subCategory: 'Taladrado', unit: 'pza', priceBase: 65, description: 'Para tornillería' },
    { id: 'bit-metal-3/8', name: 'Mecha p/Metal 3/8"', category: 'consumible', subCategory: 'Taladrado', unit: 'pza', priceBase: 120, description: 'Alta velocidad' },
    { id: 'bit-metal-1/2', name: 'Mecha p/Metal 1/2"', category: 'consumible', subCategory: 'Taladrado', unit: 'pza', priceBase: 185, description: 'Estructural' },
    { id: 'bit-conc-1/4', name: 'Broca p/Concreto 1/4"', category: 'consumible', subCategory: 'Instalación', unit: 'pza', priceBase: 45, description: 'Para taquetes' },
    { id: 'bit-conc-3/8', name: 'Broca p/Concreto 3/8"', category: 'consumible', subCategory: 'Instalación', unit: 'pza', priceBase: 85, description: 'Instalación pesada' },

    // Pintura
    { id: 'paint-prim-gray', name: 'Fondo Anticorrosivo Gris (lt)', category: 'consumible', subCategory: 'Pintura', unit: 'lt', priceBase: 195, description: 'Base para metal' },
    { id: 'paint-prim-red', name: 'Fondo Anticorrosivo Rojo (lt)', category: 'consumible', subCategory: 'Pintura', unit: 'lt', priceBase: 185, description: 'Base para metal' },
    { id: 'paint-esm-black', name: 'Esmalte Negro Satinado (lt)', category: 'consumible', subCategory: 'Pintura', unit: 'lt', priceBase: 240, description: 'Acabado final' },
    { id: 'paint-esm-white', name: 'Esmalte Blanco Brillante (lt)', category: 'consumible', subCategory: 'Pintura', unit: 'lt', priceBase: 240, description: 'Acabado final' },
    { id: 'paint-thinner', name: 'Thinner Estándar (lt)', category: 'consumible', subCategory: 'Pintura', unit: 'lt', priceBase: 65, description: 'Diluyente' },

    // Soldadura y Otros
    { id: 'weld-6013-1/8', name: 'Electrodos 6013 1/8" (kg)', category: 'consumible', subCategory: 'Soldadura', unit: 'kg', priceBase: 125, description: 'Soldadura manual' },
    { id: 'silicone-clear', name: 'Silicona Transparente Tubo', category: 'consumible', subCategory: 'Selladores', unit: 'pza', priceBase: 95, description: 'Sellado de techos' },
];

const LAMINAS_PLACAS: UniversalMaterial[] = [
    { id: 'lam-lisa-26', name: 'Lámina Lisa Cal 26', category: 'lamina', subCategory: 'Lisa', unit: 'pza', priceBase: 720, description: 'Lámina 4x8 económica' },
    { id: 'lam-lisa-24', name: 'Lámina Lisa Cal 24', category: 'lamina', subCategory: 'Lisa', unit: 'pza', priceBase: 840, description: 'Lámina 4x8 estándar' },
    { id: 'lam-lisa-18', name: 'Lámina Lisa Cal 18', category: 'lamina', subCategory: 'Lisa', unit: 'pza', priceBase: 1890, description: 'Lámina gruesa industrial' },
    { id: 'placa-1/8', name: 'Placa de Acero 1/8"', category: 'lamina', subCategory: 'Placa', unit: 'pza', priceBase: 2100, description: 'Placa 4x10 industrial' },
    { id: 'placa-1/4', name: 'Placa de Acero 1/4"', category: 'lamina', subCategory: 'Placa', unit: 'pza', priceBase: 4200, description: 'Placa pesada industrial' },
];

const HARDWARE: UniversalMaterial[] = [
    { id: 'lock-res', name: 'Chapa Residencial', category: 'herraje', subCategory: 'Cerraduras', unit: 'pza', priceBase: 450, description: 'Garantía residencial' },
    { id: 'lock-hd', name: 'Chapa de Alta Seguridad', category: 'herraje', subCategory: 'Cerraduras', unit: 'pza', priceBase: 1150, description: 'Uso comercial' },
    { id: 'hinge-4', name: 'Bisagra de Libro 4"', category: 'herraje', subCategory: 'Bisagras', unit: 'pza', priceBase: 45, description: 'Bisagra estándar' },
    { id: 'hinge-tub-1', name: 'Bisagra Tubular 1"', category: 'herraje', subCategory: 'Bisagras', unit: 'pza', priceBase: 35, description: 'Para herrería' },
    { id: 'roller-100', name: 'Carretilla/Rodaja 4"', category: 'herraje', subCategory: 'Portones', unit: 'pza', priceBase: 280, description: 'Para portón corredizo' },
];

export const MATERIAL_DATABASE: UniversalMaterial[] = [
    ...GENERATED_MATERIALS,
    ...ROOFING,
    ...CONSUMABLES,
    ...LAMINAS_PLACAS,
    ...HARDWARE
];

export const CATEGORIES = [
    { id: 'perfil', label: 'Perfiles PTR/Macizos', icon: 'architecture' },
    { id: 'tubo', label: 'Tubería Redonda', icon: 'radio_button_checked' },
    { id: 'lamina', label: 'Láminas, Placas y Techos', icon: 'layers' },
    { id: 'herraje', label: 'Herrajes y Accesorios', icon: 'handyman' },
    { id: 'consumible', label: 'Consumibles, Pintura y Mechas', icon: 'inventory_2' },
];
