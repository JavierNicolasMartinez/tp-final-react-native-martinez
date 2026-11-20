import { describe, expect, test } from '@jest/globals';

import { Pila } from '../Pila';

describe('Pila', () => {
  test('arranca vacía', () => {
    const pila = new Pila<number>();
    expect(pila.vacia).toBe(true);
    expect(pila.tamanio).toBe(0);
    expect(pila.tope()).toBeUndefined();
  });

  test('push deja el último elemento en el tope', () => {
    const pila = new Pila<string>();
    pila.push('a');
    pila.push('b');
    expect(pila.tope()).toBe('b');
    expect(pila.tamanio).toBe(2);
  });

  test('pop saca en orden inverso al de entrada', () => {
    const pila = new Pila<number>([1, 2, 3]);
    expect(pila.pop()).toBe(3);
    expect(pila.pop()).toBe(2);
    expect(pila.pop()).toBe(1);
    expect(pila.pop()).toBeUndefined();
  });

  test('aArray devuelve una copia que no modifica la pila', () => {
    const pila = new Pila<number>([1, 2]);
    const copia = pila.aArray();
    copia.push(99);
    expect(pila.aArray()).toEqual([1, 2]);
    expect(pila.tamanio).toBe(2);
  });
});
