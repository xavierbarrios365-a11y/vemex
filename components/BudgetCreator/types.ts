import { TipoTrabajo, ConfigCalculo, LineaMaterial, ResultadoCalculo } from '../../engineCalc';
import { Material } from '../../types';

export interface MaterialAssignment {
    concepto: string;
    materialId: string;
    manualPrice?: number;
}

export interface ExtraItem {
    id: string;
    materialId: string;
    quantity: number;
    manualPrice?: number;
}
