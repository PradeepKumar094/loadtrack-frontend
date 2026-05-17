export interface SortState {
  column: string;
  direction: 'asc' | 'desc' | '';
}

export function sortData<T>(data: T[], sort: SortState): T[] {
  if (!sort.column || !sort.direction) return data;
  return [...data].sort((a: any, b: any) => {
    let valA = getNestedValue(a, sort.column);
    let valB = getNestedValue(b, sort.column);

    // Handle nulls
    if (valA == null) return 1;
    if (valB == null) return -1;

    // Numeric
    if (typeof valA === 'number' && typeof valB === 'number') {
      return sort.direction === 'asc' ? valA - valB : valB - valA;
    }

    // String
    valA = String(valA).toLowerCase();
    valB = String(valB).toLowerCase();
    if (valA < valB) return sort.direction === 'asc' ? -1 : 1;
    if (valA > valB) return sort.direction === 'asc' ? 1 : -1;
    return 0;
  });
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((acc, key) => acc?.[key], obj);
}
