import bcrypt from 'bcrypt';
import { dbRun, dbGet } from '../config/database.js';

export const initDatabase = async () => {
  try {
    console.log('🔧 Initializing database...');

    // Create Users table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        full_name TEXT NOT NULL,
        email TEXT,
        role TEXT NOT NULL CHECK(role IN ('admin', 'atsep')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME
      )
    `);

    // Create Systems table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS systems (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('active', 'failure', 'backup', 'inactive')),
        location TEXT,
        frequency TEXT,
        description TEXT,
        last_check DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Scenarios table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS scenarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        source_system_id INTEGER,
        target_system_id INTEGER,
        steps TEXT,
        estimated_time INTEGER,
        priority TEXT CHECK(priority IN ('low', 'medium', 'high', 'critical')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (source_system_id) REFERENCES systems (id),
        FOREIGN KEY (target_system_id) REFERENCES systems (id)
      )
    `);

    // Create Incidents table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS incidents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        system_id INTEGER,
        severity TEXT CHECK(severity IN ('low', 'medium', 'high', 'critical')),
        status TEXT CHECK(status IN ('open', 'in_progress', 'resolved', 'closed')),
        reported_by INTEGER,
        resolved_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        resolved_at DATETIME,
        FOREIGN KEY (system_id) REFERENCES systems (id),
        FOREIGN KEY (reported_by) REFERENCES users (id),
        FOREIGN KEY (resolved_by) REFERENCES users (id)
      )
    `);

    // Create Logs table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL,
        entity_type TEXT,
        entity_id INTEGER,
        user_id INTEGER,
        details TEXT,
        ip_address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // Check if default users exist
    const adminExists = await dbGet('SELECT id FROM users WHERE username = ?', ['admin']);
    
    if (!adminExists) {
      console.log('👤 Creating default users...');
      
      // Hash passwords
      const adminPassword = await bcrypt.hash('admin123', 10);
      const atsepPassword = await bcrypt.hash('atsep123', 10);

      // Create admin user
      await dbRun(`
        INSERT INTO users (username, password, full_name, email, role)
        VALUES (?, ?, ?, ?, ?)
      `, ['admin', adminPassword, 'Administrator', 'admin@ccr-casa.ma', 'admin']);

      // Create atsep user
      await dbRun(`
        INSERT INTO users (username, password, full_name, email, role)
        VALUES (?, ?, ?, ?, ?)
      `, ['atsep', atsepPassword, 'ATSEP Operator', 'atsep@ccr-casa.ma', 'atsep']);

      console.log('✅ Default users created (admin/admin123, atsep/atsep123)');
    }

    // Check if systems exist
    const systemsExist = await dbGet('SELECT COUNT(*) as count FROM systems');
    
    if (systemsExist.count === 0) {
      console.log('📡 Creating default systems...');

      // Create SITTI system
      await dbRun(`
        INSERT INTO systems (name, type, status, location, frequency, description)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        'SITTI',
        'VHF/HF',
        'active',
        'CCR Casablanca',
        '118.1-136.975 MHz / 2-30 MHz',
        'Système principal de communication sol-air'
      ]);

      // Create GAREX300 system
      await dbRun(`
        INSERT INTO systems (name, type, status, location, frequency, description)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        'GAREX300',
        'VHF',
        'inactive',
        'CCR Casablanca',
        '118.1-136.975 MHz',
        'Système de secours VHF'
      ]);

      // Create PCR960M system
      await dbRun(`
        INSERT INTO systems (name, type, status, location, frequency, description)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        'PCR960M',
        'HF',
        'inactive',
        'CCR Casablanca',
        '2-30 MHz',
        'Système de secours HF'
      ]);

      console.log('✅ Default systems created');
    }

    // Check if scenarios exist
    const scenariosExist = await dbGet('SELECT COUNT(*) as count FROM scenarios');
    
    if (scenariosExist.count === 0) {
      console.log('📋 Creating default scenarios...');

      const steps1 = JSON.stringify([
        'Vérifier l\'état du système SITTI',
        'Activer le système PCR960M',
        'Transférer les fréquences HF',
        'Tester la communication',
        'Confirmer le basculement'
      ]);

      const steps2 = JSON.stringify([
        'Vérifier l\'état du système SITTI',
        'Activer le système GAREX300',
        'Transférer les fréquences VHF',
        'Tester la communication',
        'Confirmer le basculement'
      ]);

      const steps3 = JSON.stringify([
        'Diagnostiquer la panne SITTI',
        'Activer PCR960M pour HF',
        'Activer GAREX300 pour VHF',
        'Coordonner avec les aéronefs',
        'Documenter l\'incident'
      ]);

      await dbRun(`
        INSERT INTO scenarios (name, description, source_system_id, target_system_id, steps, estimated_time, priority)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        'Basculement SITTI → PCR960M',
        'Basculement du système principal vers le système de secours HF',
        1, 3, steps1, 5, 'high'
      ]);

      await dbRun(`
        INSERT INTO scenarios (name, description, source_system_id, target_system_id, steps, estimated_time, priority)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        'Basculement SITTI → GAREX300',
        'Basculement du système principal vers le système de secours VHF',
        1, 2, steps2, 5, 'high'
      ]);

      await dbRun(`
        INSERT INTO scenarios (name, description, source_system_id, target_system_id, steps, estimated_time, priority)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        'Panne Totale SITTI',
        'Activation simultanée des systèmes de secours',
        1, null, steps3, 10, 'critical'
      ]);

      console.log('✅ Default scenarios created');
    }

    console.log('✅ Database initialization complete');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  }
};