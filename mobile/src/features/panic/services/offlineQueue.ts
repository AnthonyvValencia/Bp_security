import * as SQLite from 'expo-sqlite';

const NOMBRE_DB = 'bp_security_panico.db';

export interface AlertaLocal {
  id_cliente: string;
  latitud: number | null;
  longitud: number | null;
  creada_en: string;
  estado: 'pendiente' | 'error';
}

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function obtenerDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(NOMBRE_DB).then(async (db) => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS alertas_pendientes (
          id_cliente TEXT PRIMARY KEY NOT NULL,
          latitud REAL,
          longitud REAL,
          creada_en TEXT NOT NULL,
          estado TEXT NOT NULL DEFAULT 'pendiente'
        );
      `);

      return db;
    });
  }

  return dbPromise;
}

export const offlineQueue = {
  async encolar(alerta: Omit<AlertaLocal, 'estado'>): Promise<void> {
    const db = await obtenerDb();

    await db.runAsync(
      'INSERT OR REPLACE INTO alertas_pendientes (id_cliente, latitud, longitud, creada_en, estado) VALUES (?, ?, ?, ?, ?)',
      [alerta.id_cliente, alerta.latitud, alerta.longitud, alerta.creada_en, 'pendiente'],
    );
  },

  async listarPendientes(): Promise<AlertaLocal[]> {
    const db = await obtenerDb();

    return db.getAllAsync<AlertaLocal>(
      "SELECT * FROM alertas_pendientes WHERE estado IN ('pendiente', 'error') ORDER BY creada_en ASC",
    );
  },

  async marcarError(idCliente: string): Promise<void> {
    const db = await obtenerDb();

    await db.runAsync("UPDATE alertas_pendientes SET estado = 'error' WHERE id_cliente = ?", [
      idCliente,
    ]);
  },

  async eliminar(idCliente: string): Promise<void> {
    const db = await obtenerDb();

    await db.runAsync('DELETE FROM alertas_pendientes WHERE id_cliente = ?', [idCliente]);
  },
};
