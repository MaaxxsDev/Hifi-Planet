<?php

namespace App;

class Router
{
    private array $routes = [];

    public function add(string $method, string $pattern, callable $handler): void
    {
        $regex = preg_replace('#\{([a-zA-Z_]+)\}#', '(?P<$1>[^/]+)', $pattern);
        $this->routes[] = [
            'method' => strtoupper($method),
            'regex' => '#^' . $regex . '$#',
            'handler' => $handler,
        ];
    }

    public function get(string $pattern, callable $handler): void
    {
        $this->add('GET', $pattern, $handler);
    }

    public function post(string $pattern, callable $handler): void
    {
        $this->add('POST', $pattern, $handler);
    }

    public function put(string $pattern, callable $handler): void
    {
        $this->add('PUT', $pattern, $handler);
    }

    public function patch(string $pattern, callable $handler): void
    {
        $this->add('PATCH', $pattern, $handler);
    }

    public function delete(string $pattern, callable $handler): void
    {
        $this->add('DELETE', $pattern, $handler);
    }

    public function dispatch(string $method, string $path): void
    {
        $method = strtoupper($method);
        $matchedPath = false;

        foreach ($this->routes as $route) {
            if (!preg_match($route['regex'], $path, $matches)) {
                continue;
            }

            $matchedPath = true;

            if ($route['method'] !== $method) {
                continue;
            }

            $params = array_filter($matches, fn($key) => !is_int($key), ARRAY_FILTER_USE_KEY);
            call_user_func($route['handler'], $params);
            return;
        }

        http_response_code($matchedPath ? 405 : 404);
        echo json_encode(['error' => $matchedPath ? 'Methode nicht erlaubt' : 'Nicht gefunden']);
    }
}
