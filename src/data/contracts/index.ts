/*
 * Contrato de datos del marco y del mapa.
 *
 * Copia de resources/js/types/generated/index.ts del proyecto Arxnet original (commit 8ea5fff),
 * copiada el 2026-10-09. La fuente de verdad son los DTO PHP (app/Shell/OrganizationMap/Data y
 * app/Shell/SessionUserData.php): cuando cambien, se regenera allí y se vuelve a copiar aquí.
 * No se edita a mano.
 */
export type BuildingType = 'factory' | 'warehouse' | 'office' | 'purchasing' | 'headquarters' | 'people' | 'school' | 'preschool' | 'classrooms' | 'store' | 'kiosk' | 'kitchen' | 'dining';
export type CursorPaginatedDataCollection<TKey, TValue> = CursorPaginator<TKey, TValue>;
export type CursorPaginator<TKey, TValue> = {
data: TKey extends string ? Record<TKey, TValue> : TValue[],
links: {
url: string | null,
label: string,
active: boolean,
}[],
meta: {
path: string,
per_page: number,
next_cursor: string | null,
next_page_url: string | null,
prev_cursor: string | null,
prev_page_url: string | null,
},
};
export type CursorPaginatorInterface<TKey, TValue> = CursorPaginator<TKey, TValue>;
export type DepartmentDirectoryData = {
zones: ZoneData[],
departments: DepartmentSummaryData[],
};
export type DepartmentHue = 'violet' | 'yellow' | 'green' | 'teal' | 'blue' | 'pink' | 'indigo' | 'orange';
export type DepartmentIcon = 'factory' | 'package' | 'sales' | 'cart' | 'landmark' | 'people' | 'blocks' | 'book' | 'graduation' | 'door' | 'clipboard' | 'wallet' | 'shield' | 'receipt' | 'truck' | 'dining' | 'chef';
export type DepartmentPageData = {
context: MapContextData,
department: MapDepartmentData,
zone: ZoneData | null,
siblings: DepartmentSummaryData[],
};
export type DepartmentSummaryData = {
publicId: string,
name: string,
zoneKey: string,
summary: string,
icon: DepartmentIcon,
hue: DepartmentHue,
pendingTotal: number,
worstTone: PendingTone,
};
export type LengthAwarePaginator<TKey, TValue> = {
data: TKey extends string ? Record<TKey, TValue> : TValue[],
links: {
url: string | null,
label: string,
active: boolean,
}[],
meta: {
total: number,
current_page: number,
first_page_url: string,
from: number | null,
last_page: number,
last_page_url: string,
next_page_url: string | null,
path: string,
per_page: number,
prev_page_url: string | null,
to: number | null,
},
};
export type LengthAwarePaginatorInterface<TKey, TValue> = LengthAwarePaginator<TKey, TValue>;
export type LinkColor = 'accent' | 'orange' | 'teal' | 'slate';
export type MapContextData = {
organizationName: string,
branchName: string,
sector: Sector,
isDemo: boolean,
};
export type MapDepartmentData = {
publicId: string,
name: string,
zoneKey: string,
summary: string,
icon: DepartmentIcon,
hue: DepartmentHue,
building: BuildingType,
gridColumn: number,
gridRow: number,
pending: PendingSummaryData,
people: PeopleSummaryData,
trend: number[] | null,
};
export type MapLandmarkData = {
key: string,
name: string,
gridColumn: number,
gridRow: number,
};
export type MapLinkData = {
publicId: string,
from: string,
to: string,
name: string,
openOperations: number,
operationRefs: string[],
color: LinkColor,
};
export type OrganizationMapData = {
context: MapContextData,
gridColumns: number,
zones: ZoneData[],
departments: MapDepartmentData[],
links: MapLinkData[],
landmarks: MapLandmarkData[],
};
export type PaginatedDataCollection<TKey, TValue> = LengthAwarePaginator<TKey, TValue>;
export type PendingSummaryData = {
total: number,
worst: PendingTone,
byTone: ToneCountData[],
};
export type PendingTone = 'blocked' | 'warning' | 'approval' | 'waiting' | 'ok';
export type PeopleSummaryData = {
assigned: number,
connected: number,
};
export type Sector = 'education' | 'industry' | 'commerce' | 'restaurant';
export type SessionUserData = {
publicId: string,
name: string,
email: string,
emailVerified: boolean,
twoFactorEnabled: boolean,
locale: string | null,
};
export type ToneCountData = {
tone: PendingTone,
count: number,
};
export type ZoneData = {
key: string,
name: string,
};
