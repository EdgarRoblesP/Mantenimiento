/**
 * Error de negocio con código HTTP y clave estable.
 * El `code` es el que consume el frontend para elegir el mensaje/estado visual
 * de las pantallas de error del diseño (banner, campo en rojo, etc.).
 */
export class AppError extends Error {
  constructor(status, code, message, details = undefined) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(code, message, details) {
    return new AppError(400, code, message, details);
  }

  static unauthorized(code, message) {
    return new AppError(401, code, message);
  }

  static forbidden(code, message) {
    return new AppError(403, code, message);
  }

  static notFound(code, message) {
    return new AppError(404, code, message);
  }

  static conflict(code, message) {
    return new AppError(409, code, message);
  }

  static tooManyRequests(code, message) {
    return new AppError(429, code, message);
  }
}
