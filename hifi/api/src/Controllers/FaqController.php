<?php

namespace App\Controllers;

use App\Config\Database;
use App\Support\Http;

class FaqController
{
    public static function index(): void
    {
        $stmt = Database::connection()->query(
            'SELECT id, question_de, answer_de, question_en, answer_en, sort_order
             FROM faqs ORDER BY sort_order, id'
        );
        Http::send($stmt->fetchAll());
    }

    public static function store(): void
    {
        $body = Http::jsonBody();
        [$questionDe, $answerDe, $questionEn, $answerEn] = self::validate($body);

        $db = Database::connection();
        $stmt = $db->prepare(
            'INSERT INTO faqs (question_de, answer_de, question_en, answer_en, sort_order)
             VALUES (?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $questionDe,
            $answerDe,
            $questionEn,
            $answerEn,
            (int) ($body['sort_order'] ?? 0),
        ]);

        Http::send(['id' => (int) $db->lastInsertId()], 201);
    }

    public static function update(array $params): void
    {
        $id = (int) $params['id'];
        $body = Http::jsonBody();
        [$questionDe, $answerDe, $questionEn, $answerEn] = self::validate($body);

        $stmt = Database::connection()->prepare(
            'UPDATE faqs SET question_de = ?, answer_de = ?, question_en = ?, answer_en = ?, sort_order = ?
             WHERE id = ?'
        );
        $stmt->execute([
            $questionDe,
            $answerDe,
            $questionEn,
            $answerEn,
            (int) ($body['sort_order'] ?? 0),
            $id,
        ]);

        Http::send(['ok' => true]);
    }

    public static function destroy(array $params): void
    {
        $stmt = Database::connection()->prepare('DELETE FROM faqs WHERE id = ?');
        $stmt->execute([(int) $params['id']]);
        Http::send(['ok' => true]);
    }

    private static function validate(array $body): array
    {
        $questionDe = trim($body['question_de'] ?? '');
        $answerDe = trim($body['answer_de'] ?? '');
        $questionEn = trim($body['question_en'] ?? '');
        $answerEn = trim($body['answer_en'] ?? '');

        if ($questionDe === '' || $answerDe === '' || $questionEn === '' || $answerEn === '') {
            Http::error('Frage und Antwort sind in beiden Sprachen erforderlich', 422);
        }

        return [$questionDe, $answerDe, $questionEn, $answerEn];
    }
}
