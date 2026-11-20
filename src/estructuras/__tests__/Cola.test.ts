import { describe, expect, test } from '@jest/globals';

import { Cola } from '../Cola';

describe('Cola', () => {
  test('desencolar una cola vacía devuelve undefined y no rompe nada', () => {
    const cola = new Cola<string>();
    expect(cola.desencolar()).toBeUndefined();
    expect(cola.tamanio).toBe(0);
    expect(cola.vacia).toBe(true);
  });

  test('respeta el orden de llegada', () => {
    const cola = new Cola<string>();
    cola.encolar('Ana');
    cola.encolar('Beto');
    cola.encolar('Caro');
    expect(cola.desencolar()).toBe('Ana');
    expect(cola.desencolar()).toBe('Beto');
    expect(cola.desencolar()).toBe('Caro');
  });

  test('frente muestra al primero sin sacarlo', () => {
    const cola = new Cola<string>(['Ana', 'Beto']);
    expect(cola.frente()).toBe('Ana');
    expect(cola.tamanio).toBe(2);
  });

  test('tamanio cuenta solo los elementos que siguen esperando', () => {
    const cola = new Cola<number>([1, 2, 3, 4]);
    cola.desencolar();
    expect(cola.tamanio).toBe(3);
    expect(cola.aArray()).toEqual([2, 3, 4]);
  });

  test('sigue funcionando después de compactar el array interno', () => {
    const cola = new Cola<number>();
    for (let i = 1; i <= 10; i++) cola.encolar(i);
    for (let i = 1; i <= 6; i++) cola.desencolar();
    cola.encolar(11);
    expect(cola.aArray()).toEqual([7, 8, 9, 10, 11]);
    expect(cola.frente()).toBe(7);
  });

  test('aArray devuelve una copia que no modifica la cola', () => {
    const cola = new Cola<string>(['Ana']);
    const copia = cola.aArray();
    copia.push('Intrusa');
    expect(cola.tamanio).toBe(1);
    expect(cola.aArray()).toEqual(['Ana']);
  });
});
