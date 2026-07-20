<?php

namespace App\Controllers;

use App\Config\Database;
use App\Support\Http;
use App\Support\Schema;

class SchemaController
{
    public static function check(): void
    {
        Http::send(self::buildReport());
    }

    public static function migrate(): void
    {
        $db = Database::connection();
        $existingTables = self::existingTables($db);
        $actions = [];

        foreach (Schema::CREATE_STATEMENTS as $table => $createSql) {
            if (!in_array($table, $existingTables, true)) {
                try {
                    $db->exec($createSql);
                    $actions[] = "Tabelle `$table` angelegt";
                } catch (\Throwable $e) {
                    $actions[] = "FEHLER beim Anlegen von `$table`: " . $e->getMessage();
                }
                continue;
            }

            $existingColumns = self::existingColumns($db, $table);
            foreach (Schema::COLUMNS[$table] ?? [] as $column => $definition) {
                if ($column === 'id' || in_array($column, $existingColumns, true)) {
                    continue;
                }
                try {
                    $db->exec("ALTER TABLE `$table` ADD COLUMN `$column` $definition");
                    $actions[] = "Spalte `$table`.`$column` ergänzt";
                } catch (\Throwable $e) {
                    $actions[] = "FEHLER bei `$table`.`$column`: " . $e->getMessage();
                }
            }
        }

        Http::send(['ok' => true, 'actions' => $actions, 'report' => self::buildReport()]);
    }

    private static function buildReport(): array
    {
        $db = Database::connection();
        $existingTables = self::existingTables($db);

        $tables = [];
        $allOk = true;

        foreach (Schema::CREATE_STATEMENTS as $table => $createSql) {
            $exists = in_array($table, $existingTables, true);
            $missingColumns = [];

            if ($exists) {
                $existingColumns = self::existingColumns($db, $table);
                foreach (array_keys(Schema::COLUMNS[$table] ?? []) as $column) {
                    if ($column !== 'id' && !in_array($column, $existingColumns, true)) {
                        $missingColumns[] = $column;
                    }
                }
            }

            $tableOk = $exists && count($missingColumns) === 0;
            if (!$tableOk) {
                $allOk = false;
            }

            $tables[] = [
                'table' => $table,
                'exists' => $exists,
                'missing_columns' => $missingColumns,
                'ok' => $tableOk,
            ];
        }

        return ['ok' => $allOk, 'tables' => $tables];
    }

    /** @return string[] */
    private static function existingTables(\PDO $db): array
    {
        $stmt = $db->query('SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE()');
        return $stmt->fetchAll(\PDO::FETCH_COLUMN);
    }

    /** @return string[] */
    private static function existingColumns(\PDO $db, string $table): array
    {
        $stmt = $db->prepare('SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?');
        $stmt->execute([$table]);
        return $stmt->fetchAll(\PDO::FETCH_COLUMN);
    }
}
