import 'package:path/path.dart' as p;
import 'package:sqflite/sqflite.dart';
import '../models/diary_entry.dart';

class StorageService {
  static const _dbName = 'geodiario_db.db';
  static const _table = 'records';
  static Database? _db;

  static Future<Database> _database() async {
    if (_db != null) return _db!;
    final dbPath = await getDatabasesPath();
    final path = p.join(dbPath, _dbName);
    _db = await openDatabase(
      path,
      version: 1,
      onCreate: (db, version) async {
        await db.execute('''
          CREATE TABLE $_table(
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            imageData TEXT NOT NULL,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            createdAt TEXT NOT NULL,
            address TEXT
          )
        ''');
      },
    );
    return _db!;
  }

  static List<DiaryEntry> get _sampleEntries {
    final now = DateTime.now();
    return [
      DiaryEntry(
        id: 'seed-1',
        title: 'Pôr do sol no Parque Ibirapuera',
        imageData:
            'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
        latitude: -23.587416,
        longitude: -46.657634,
        createdAt: now.subtract(const Duration(hours: 24)).toIso8601String(),
        address: 'Av. Pedro Álvares Cabral - Vila Mariana, São Paulo - SP',
      ),
      DiaryEntry(
        id: 'seed-2',
        title: 'Visita ao Jardim Botânico',
        imageData:
            'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
        latitude: -22.969123,
        longitude: -43.224376,
        createdAt: now.subtract(const Duration(hours: 48)).toIso8601String(),
        address: 'R. Jardim Botânico, 1008 - Jardim Botânico, Rio de Janeiro - RJ',
      ),
    ];
  }

  static Future<List<DiaryEntry>> getAllEntries() async {
    final db = await _database();
    final maps = await db.query(_table);
    if (maps.isEmpty) {
      // Seed initial entries
      for (final e in _sampleEntries) {
        await db.insert(_table, e.toMap(),
            conflictAlgorithm: ConflictAlgorithm.replace);
      }
      final seeded = _sampleEntries.toList()
        ..sort((a, b) => b.createdAt.compareTo(a.createdAt));
      return seeded;
    }
    final list = maps.map((m) => DiaryEntry.fromMap(m)).toList();
    list.sort((a, b) =>
        DateTime.parse(b.createdAt).compareTo(DateTime.parse(a.createdAt)));
    return list;
  }

  static Future<void> insertEntry(DiaryEntry entry) async {
    final db = await _database();
    await db.insert(_table, entry.toMap(),
        conflictAlgorithm: ConflictAlgorithm.replace);
  }

  static Future<void> deleteEntry(String id) async {
    final db = await _database();
    await db.delete(_table, where: 'id = ?', whereArgs: [id]);
  }
}
