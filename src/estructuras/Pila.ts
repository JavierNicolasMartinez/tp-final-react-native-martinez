export class Pila<T> {
  #items: T[];

  constructor(inicial: T[] = []) {
    this.#items = [...inicial];
  }

  push(x: T): void {
    this.#items.push(x);
  }

  pop(): T | undefined {
    return this.#items.pop();
  }

  tope(): T | undefined {
    return this.#items[this.#items.length - 1];
  }

  get vacia(): boolean {
    return this.#items.length === 0;
  }

  get tamanio(): number {
    return this.#items.length;
  }

  // copia de base a tope, para que nadie toque el array interno
  aArray(): T[] {
    return [...this.#items];
  }
}
