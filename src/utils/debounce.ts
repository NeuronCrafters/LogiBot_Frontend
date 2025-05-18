/**
 * Função de utilitário para debounce de eventos
 * Limita a frequência com que uma função pode ser executada
 * 
 * @param fn Função a ser executada após o debounce
 * @param delay Atraso em milissegundos
 * @returns Função com debounce aplicado
 */
export function debounce<F extends (...args: any[]) => any>(fn: F, delay: number) {
  let timer: ReturnType<typeof setTimeout>;

  return (...args: Parameters<F>) => {
    // Cancela o timer anterior
    clearTimeout(timer);

    // Inicia um novo timer
    timer = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}

/**
 * Função de utilidade para throttle de eventos
 * Garante que uma função não seja executada mais frequentemente que o tempo especificado
 * 
 * @param fn Função a ser executada após o throttle
 * @param limit Limite de tempo em milissegundos
 * @returns Função com throttle aplicado
 */
export function throttle<F extends (...args: any[]) => any>(fn: F, limit: number) {
  let inThrottle: boolean = false;

  return (...args: Parameters<F>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;

      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}