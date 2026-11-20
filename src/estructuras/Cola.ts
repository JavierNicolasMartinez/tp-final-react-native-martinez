export class Cola<T> {
  #items: (T | undefined)[];
  #frente = 0; // índice del primer elemento válido

  constructor(inicial: T[] = []) {
    this.#items = [...inicial];
  }

  encolar(x: T): void {
    this.#items.push(x); // O(1)
  }

  desencolar(): T | undefined {
    if (this.vacia) return undefined;

    const valor = this.#items[this.#frente];
    this.#items[this.#frente] = undefined; // suelto la referencia para no retener memoria
    this.#frente++;

    // Compactación amortizada: cuando la mitad del array ya es basura,
    // lo recorto una sola vez en lugar de mover elementos en cada desencolado.
    if (this.#frente * 2 >= this.#items.length) {
      this.#items = this.#items.slice(this.#frente);
      this.#frente = 0;
    }

    return valor; // O(1) amortizado
  }

  frente(): T | undefined {
    return this.#items[this.#frente];
  }

  get vacia(): boolean {
    return this.tamanio === 0;
  }

  get tamanio(): number {
    return this.#items.length - this.#frente;
  }

  aArray(): T[] {
    return this.#items.slice(this.#frente) as T[]; // copia, para que nadie modifique el original
  }
}
