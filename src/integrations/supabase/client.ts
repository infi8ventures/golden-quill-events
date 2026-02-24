/**
 * Local Storage Mock Database
 * Replaces Supabase for development/offline use
 * To re-enable Supabase, restore the original file from git
 */

// Types
interface LocalData {
  clients: any[];
  events: any[];
  quotations: any[];
  quotation_items: any[];
  invoices: any[];
  invoice_items: any[];
  payments: any[];
}

// Initialize local storage with default data
const DEFAULT_DATA: LocalData = {
  clients: [
    { id: '1', name: 'Acme Corporation', email: 'contact@acme.com', phone: '9876543210', address: '123 Business St', created_at: new Date().toISOString() },
    { id: '2', name: 'Wedding Planners Inc', email: 'info@weddingplanners.com', phone: '9876543211', address: '456 Event Ave', created_at: new Date().toISOString() },
    { id: '3', name: 'Corporate Events Ltd', email: 'hello@corpevents.com', phone: '9876543212', address: '789 Conference Blvd', created_at: new Date().toISOString() },
  ],
  events: [
    { id: '1', name: 'Annual Gala 2026', date: '2026-03-15', venue: 'Grand Ballroom', client_id: '1', status: 'upcoming', created_at: new Date().toISOString() },
    { id: '2', name: 'Smith Wedding', date: '2026-04-20', venue: 'Rose Garden Estate', client_id: '2', status: 'upcoming', created_at: new Date().toISOString() },
    { id: '3', name: 'Tech Conference', date: '2026-05-10', venue: 'Convention Center', client_id: '3', status: 'planning', created_at: new Date().toISOString() },
  ],
  quotations: [],
  quotation_items: [],
  invoices: [],
  invoice_items: [],
  payments: [],
};

// Get data from localStorage or use defaults
function getData(): LocalData {
  const stored = localStorage.getItem('app_local_db');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // Merge with DEFAULT_DATA to ensure newly added tables (like payments) exist
      const merged: any = { ...DEFAULT_DATA, ...parsed };
      for (const key of Object.keys(DEFAULT_DATA)) {
        if (!merged[key] || !Array.isArray(merged[key])) {
          merged[key] = [];
        }
      }
      return merged as LocalData;
    } catch {
      return { ...DEFAULT_DATA };
    }
  }
  // Initialize with default data
  saveData(DEFAULT_DATA);
  return { ...DEFAULT_DATA };
}

// Save data to localStorage
function saveData(data: LocalData): void {
  localStorage.setItem('app_local_db', JSON.stringify(data));
}

// Generate a UUID
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Mock query builder that mimics Supabase's API
class MockQueryBuilder {
  private table: keyof LocalData;
  private data: LocalData;
  private filters: Array<{ column: string; value: any; op: string }> = [];
  private selectColumns: string = '*';
  private orderByColumn: string | null = null;
  private orderAsc: boolean = true;
  private limitCount: number | null = null;
  private isSingle: boolean = false;
  private isCount: boolean = false;
  private isHead: boolean = false;
  private pendingInsert: any[] | null = null;
  private pendingUpdate: any | null = null;
  private pendingDelete: boolean = false;

  constructor(table: keyof LocalData) {
    this.table = table;
    this.data = getData();
  }

  select(columns: string = '*', options?: { count?: string; head?: boolean }) {
    this.selectColumns = columns;
    if (options?.count) {
      this.isCount = true;
    }
    if (options?.head) {
      this.isHead = true;
    }
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push({ column, value, op: 'eq' });
    return this;
  }

  neq(column: string, value: any) {
    this.filters.push({ column, value, op: 'neq' });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderByColumn = column;
    this.orderAsc = options?.ascending !== false;
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  insert(records: any | any[]) {
    this.pendingInsert = Array.isArray(records) ? records : [records];
    return this;
  }

  update(updates: any) {
    this.pendingUpdate = updates;
    return this;
  }

  delete() {
    this.pendingDelete = true;
    return this;
  }

  private executeDelete() {
    const data = getData();
    const before = data[this.table].length;

    data[this.table] = data[this.table].filter((item: any) => {
      const matches = this.filters.every(f => {
        if (f.op === 'eq') return item[f.column] === f.value;
        if (f.op === 'neq') return item[f.column] !== f.value;
        return true;
      });
      return !matches;
    });

    saveData(data);
    return { data: null, error: null, count: before - data[this.table].length };
  }

  private executeInsert() {
    if (!this.pendingInsert) return { data: null, error: null };

    const data = getData();
    const now = new Date().toISOString();

    const newItems = this.pendingInsert.map(item => ({
      ...item,
      id: item.id || generateId(),
      created_at: item.created_at || now,
    }));

    data[this.table] = [...data[this.table], ...newItems];
    saveData(data);

    if (this.isSingle) {
      return { data: newItems[0], error: null };
    }
    return { data: newItems, error: null };
  }

  private executeUpdate() {
    if (!this.pendingUpdate) return { data: null, error: null };

    const data = getData();
    let updated: any[] = [];

    data[this.table] = data[this.table].map((item: any) => {
      const matches = this.filters.every(f => {
        if (f.op === 'eq') return item[f.column] === f.value;
        if (f.op === 'neq') return item[f.column] !== f.value;
        return true;
      });

      if (matches) {
        const updatedItem = { ...item, ...this.pendingUpdate };
        updated.push(updatedItem);
        return updatedItem;
      }
      return item;
    });

    saveData(data);
    return { data: updated, error: null };
  }

  private executeSelect() {
    // Refresh data in case it changed
    this.data = getData();
    let result = [...this.data[this.table]];

    // Apply filters
    result = result.filter((item: any) => {
      return this.filters.every(f => {
        if (f.op === 'eq') return item[f.column] === f.value;
        if (f.op === 'neq') return item[f.column] !== f.value;
        return true;
      });
    });

    // Handle nested relations like "*, clients(name, email)"
    // Parse selectColumns for relation patterns
    const relationMatches = this.selectColumns.matchAll(/(\w+)\([^)]+\)/g);
    for (const match of relationMatches) {
      const relationTable = match[1] as keyof LocalData;
      const foreignKey = `${relationTable.replace(/s$/, '')}_id`; // e.g., "clients" -> "client_id"

      if (this.data[relationTable]) {
        result = result.map((item: any) => {
          const relatedId = item[foreignKey];
          if (relatedId) {
            const related = this.data[relationTable].find((r: any) => r.id === relatedId);
            return { ...item, [relationTable]: related || null };
          }
          return { ...item, [relationTable]: null };
        });
      }
    }

    // Apply ordering
    if (this.orderByColumn) {
      result.sort((a: any, b: any) => {
        const aVal = a[this.orderByColumn!];
        const bVal = b[this.orderByColumn!];
        if (aVal < bVal) return this.orderAsc ? -1 : 1;
        if (aVal > bVal) return this.orderAsc ? 1 : -1;
        return 0;
      });
    }

    // Apply limit
    if (this.limitCount !== null) {
      result = result.slice(0, this.limitCount);
    }

    // Return count if requested
    if (this.isCount || this.isHead) {
      return { data: null, count: result.length, error: null };
    }

    // Return single or array
    if (this.isSingle) {
      return { data: result[0] || null, error: result[0] ? null : null };
    }
    return { data: result, error: null };
  }

  then(resolve: (result: any) => void, reject?: (error: any) => void) {
    try {
      let result;

      if (this.pendingInsert) {
        result = this.executeInsert();
      } else if (this.pendingUpdate) {
        result = this.executeUpdate();
      } else if (this.pendingDelete) {
        result = this.executeDelete();
      } else {
        result = this.executeSelect();
      }

      resolve(result);
    } catch (error) {
      if (reject) reject(error);
      else resolve({ data: null, error });
    }
  }
}

// Mock Supabase client
export const supabase = {
  from: (table: string) => new MockQueryBuilder(table as keyof LocalData),

  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: (_callback: any) => ({
      data: { subscription: { unsubscribe: () => { } } },
    }),
    signOut: async () => ({ error: null }),
    signInWithPassword: async () => ({ data: { user: null, session: null }, error: { message: 'Auth disabled' } }),
  },
};

// Helper to reset data to defaults (useful for testing)
export function resetLocalDatabase() {
  localStorage.removeItem('app_local_db');
  getData(); // Re-initialize with defaults
}

// Helper to export data
export function exportLocalDatabase(): LocalData {
  return getData();
}

// Helper to import data
export function importLocalDatabase(data: LocalData) {
  saveData(data);
}