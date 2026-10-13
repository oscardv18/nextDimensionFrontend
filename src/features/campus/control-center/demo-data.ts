/*
 * Datos de demostración del centro de control (Fase 3.0). No proceden de ningún sistema real ni del
 * DataSource: el contrato del ERP para estos indicadores aún no existe (docs/pendientes-backend.md).
 * Se mantienen aquí, tipados y sin JSX, para que la presentación no dependa de su origen y puedan
 * sustituirse por una consulta sin tocar los componentes. Los textos visibles son claves de i18n.
 */

export type DepartmentId =
    | 'shared.procurement'
    | 'shared.warehouse'
    | 'shared.operations'
    | 'shared.sales'
    | 'shared.administration'
    | 'shared.human-resources';

/** Tono semántico del indicador; nunca verde como color principal (dirección aprobada). */
export type Tone = 'attention' | 'info' | 'neutral';

export type DepartmentStatus = {
    /** Clave i18n con `{{count}}`. */
    statusKey: string;
    count?: number;
    tone: Tone;
};

export const departmentStatus: Record<DepartmentId, DepartmentStatus> = {
    'shared.procurement': {
        statusKey: 'cc.status.toApprove',
        count: 4,
        tone: 'attention',
    },
    'shared.warehouse': {
        statusKey: 'cc.status.belowMinimum',
        count: 2,
        tone: 'attention',
    },
    'shared.operations': {
        statusKey: 'cc.status.inPreparation',
        count: 6,
        tone: 'attention',
    },
    'shared.sales': {
        statusKey: 'cc.status.activeOrders',
        count: 12,
        tone: 'info',
    },
    'shared.administration': {
        statusKey: 'cc.status.closingReview',
        tone: 'attention',
    },
    'shared.human-resources': {
        statusKey: 'cc.status.pendingLeave',
        count: 2,
        tone: 'attention',
    },
};

export type AttentionItem = {
    id: string;
    labelKey: string;
    count: number;
    /** Departamento que se enfoca al abrir el aviso: navegación real del campus. */
    departmentId: DepartmentId;
};

export const attention: AttentionItem[] = [
    {
        id: 'purchases',
        labelKey: 'cc.attention.purchases',
        count: 4,
        departmentId: 'shared.procurement',
    },
    {
        id: 'stock',
        labelKey: 'cc.attention.stock',
        count: 2,
        departmentId: 'shared.warehouse',
    },
    {
        id: 'cash',
        labelKey: 'cc.attention.cash',
        count: 1,
        departmentId: 'shared.administration',
    },
];

export type ProcurementStage = 'request' | 'approve' | 'buy' | 'receive';
export const procurementStages: ProcurementStage[] = [
    'request',
    'approve',
    'buy',
    'receive',
];

export type ProcurementTab = 'requests' | 'orders' | 'receptions';

export type ProcurementRecord = {
    id: string;
    titleKey: string;
    /** Área solicitante (clave de departamento). */
    areaId: DepartmentId;
    /** Persona ficticia. */
    requester: string;
    amount: number;
    statusKey: string;
    tone: Tone;
    /** Etapa en curso dentro del proceso de compra. */
    stage: ProcurementStage;
};

export const procurement: {
    counts: Record<ProcurementTab, number>;
    pendingApproval: number;
    records: Record<ProcurementTab, ProcurementRecord[]>;
} = {
    counts: { requests: 12, orders: 8, receptions: 3 },
    pendingApproval: 4,
    records: {
        requests: [
            {
                id: 'SOL-0412',
                titleKey: 'cc.demo.kitchenSupplies',
                areaId: 'shared.operations',
                requester: 'Ana Pérez',
                amount: 240,
                statusKey: 'cc.record.toApprove',
                tone: 'attention',
                stage: 'approve',
            },
            {
                id: 'SOL-0409',
                titleKey: 'cc.demo.officeSupplies',
                areaId: 'shared.administration',
                requester: 'Luis Romero',
                amount: 96,
                statusKey: 'cc.record.quoting',
                tone: 'attention',
                stage: 'request',
            },
            {
                id: 'SOL-0405',
                titleKey: 'cc.demo.uniforms',
                areaId: 'shared.human-resources',
                requester: 'Marta Gil',
                amount: 410,
                statusKey: 'cc.record.approved',
                tone: 'attention',
                stage: 'buy',
            },
        ],
        orders: [
            {
                id: 'OC-0231',
                titleKey: 'cc.demo.packaging',
                areaId: 'shared.warehouse',
                requester: 'Jorge Lara',
                amount: 1180,
                statusKey: 'cc.record.sent',
                tone: 'info',
                stage: 'buy',
            },
            {
                id: 'OC-0229',
                titleKey: 'cc.demo.cleaning',
                areaId: 'shared.operations',
                requester: 'Ana Pérez',
                amount: 320,
                statusKey: 'cc.record.confirmed',
                tone: 'info',
                stage: 'buy',
            },
        ],
        receptions: [
            {
                id: 'REC-0118',
                titleKey: 'cc.demo.beverages',
                areaId: 'shared.sales',
                requester: 'Sofía Cruz',
                amount: 640,
                statusKey: 'cc.record.partial',
                tone: 'attention',
                stage: 'receive',
            },
            {
                id: 'REC-0117',
                titleKey: 'cc.demo.packaging',
                areaId: 'shared.warehouse',
                requester: 'Jorge Lara',
                amount: 1180,
                statusKey: 'cc.record.expected',
                tone: 'neutral',
                stage: 'receive',
            },
        ],
    },
};

/*
 * Puntos de interés del interior de Compras. Se anclan a nodos visuales reales del contrato GLB 1.0.0
 * (centro superior de su caja); no se inventan coordenadas.
 */
export const procurementHotspots: { tab: ProcurementTab; nodeId: string }[] = [
    { tab: 'requests', nodeId: 'procurement.office-furniture' },
    { tab: 'orders', nodeId: 'procurement.storage-racks' },
    { tab: 'receptions', nodeId: 'procurement.dock' },
];

export const totals = { cash: 1240, requests: 12, updatedSecondsAgo: 12 };

export const demoCompany = { name: 'Empresa demo' };
export const demoUser = {
    name: 'Usuario de prueba',
    email: 'test@example.com',
    initials: 'UP',
};
