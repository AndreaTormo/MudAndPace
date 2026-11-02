import { HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { throwError } from 'rxjs';
import Swal from 'sweetalert2';
import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor', () => {
  let fireSpy: jasmine.Spy;

  beforeEach(() => {
    fireSpy = spyOn(Swal, 'fire');
  });

  function propagate(error: unknown): { caught: unknown; swal: { icon?: string; text?: string } | undefined } {
    const req = new HttpRequest('GET', '/api/v1/test');
    let caught: unknown;

    errorInterceptor(req, () => throwError(() => error)).subscribe({
      error: (e) => (caught = e)
    });

    const swal = fireSpy.calls.mostRecent()?.args[0] as
      | { icon?: string; text?: string }
      | undefined;
    return { caught, swal };
  }

  it('muestra mensaje de timeout ante un TimeoutError', () => {
    const timeout = new Error('timeout');
    timeout.name = 'TimeoutError';

    const { caught, swal } = propagate(timeout);

    expect(caught).toBe(timeout);
    expect(swal?.icon).toBe('error');
    expect(swal?.text).toContain('tiempo de espera');
  });

  it('muestra mensaje de conexión ante status 0', () => {
    const error = new HttpErrorResponse({ status: 0 });

    const { caught, swal } = propagate(error);

    expect(caught).toBe(error);
    expect(swal?.text).toContain('No se puede conectar');
  });

  it('muestra el mensaje de la API en un 403', () => {
    const error = new HttpErrorResponse({
      status: 403,
      error: { error: { code: 'FORBIDDEN', message: 'Requiere rol ADMIN' } }
    });

    const { swal } = propagate(error);

    expect(swal?.text).toBe('Requiere rol ADMIN');
  });

  it('usa el mensaje por defecto en un 403 sin cuerpo de API', () => {
    const error = new HttpErrorResponse({ status: 403 });

    const { swal } = propagate(error);

    expect(swal?.text).toContain('No tienes permiso');
  });

  it('usa el mensaje por defecto en un 401 sin cuerpo de API', () => {
    const error = new HttpErrorResponse({ status: 401 });

    const { swal } = propagate(error);

    expect(swal?.text).toContain('Debes iniciar sesión');
  });

  it('despliega los details de Zod en un 400', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Datos no válidos',
          details: [
            { path: 'name', message: 'requerido' },
            { path: 'email', message: 'formato inválido' }
          ]
        }
      }
    });

    const { swal } = propagate(error);

    expect(swal?.text).toContain('Datos no válidos');
    expect(swal?.text).toContain('name: requerido');
    expect(swal?.text).toContain('email: formato inválido');
  });

  it('muestra mensaje genérico ante una respuesta inválida sin estructura de API', () => {
    const error = new HttpErrorResponse({ status: 422, error: '<html>oops</html>' });

    const { swal } = propagate(error);

    expect(swal?.text).toBe('Se ha producido un error inesperado.');
  });

  it('muestra mensaje de servidor ante un 500', () => {
    const error = new HttpErrorResponse({ status: 500 });

    const { swal } = propagate(error);

    expect(swal?.text).toContain('Error del servidor');
  });

  it('re-lanza el error original para que lo consuman los callers', () => {
    const error = new HttpErrorResponse({ status: 409 });

    const { caught } = propagate(error);

    expect(caught).toBe(error);
  });
});
