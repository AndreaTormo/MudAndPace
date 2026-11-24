import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import Swal from 'sweetalert2';
import { ApiErrorBody } from '../models/api.model';

function isSilentErrorUrl(url: string): boolean {
  return (
    url.includes('/agent/weather') ||
    url.includes('/agent/activities') ||
    (url.includes('/agent/comments/') && url.endsWith('/summary')) ||
    url.includes('/auth/refresh')
  );
}

const CODE_MESSAGES: Record<string, string> = {
  DUPLICATE_COMMENT: 'Ya has publicado un comentario idéntico recientemente.',
  COMMENT_COOLDOWN: 'Espera unos segundos antes de volver a publicar un comentario.',
  COMMENT_NOT_FOUND: 'No se ha encontrado el comentario.',
  COMMENT_FORBIDDEN: 'No tienes permiso para realizar esta acción sobre el comentario.',
  COMMENT_ALREADY_REPORTED: 'Ya has reportado este comentario.',
  COMMENT_ALREADY_HIDDEN: 'El comentario ya está oculto.',
  COMMENT_ALREADY_ACTIVE: 'El comentario no está en la papelera.',
  DEPARTURE_NOT_COMPLETED: 'Podrás comentar o valorar cuando la salida haya finalizado.',
  DEPARTURE_NOT_COMMENTABLE: 'La salida no admite comentarios en este momento.',
  EVENT_NOT_COMMENTABLE: 'El evento no admite comentarios en este momento.',
  RATING_UNAUTHENTICATED: 'Debes iniciar sesión para valorar esta salida.',
  RATING_NOT_FOUND: 'Todavía no tienes una valoración en esta salida.',
  RATING_FORBIDDEN: 'No tienes permiso para modificar esta valoración.',
  RATING_SAVE_FAILED: 'No se ha podido guardar la valoración. Inténtalo de nuevo.',
  AI_UNAVAILABLE: 'El servicio de análisis IA no está disponible ahora mismo.',
  AI_TIMEOUT: 'El análisis IA ha tardado demasiado. Inténtalo de nuevo.',
  AI_INVALID_RESPONSE: 'El servicio IA ha devuelto una respuesta inesperada.'
};

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let message = 'Se ha producido un error inesperado.';

      if ((error as { name?: string }).name === 'TimeoutError') {
        message = 'La petición ha superado el tiempo de espera. Comprueba que la API está activa.';
      } else if (error.status === 0) {
        message = 'No se puede conectar con el servidor. Comprueba que la API está en marcha.';
      } else {
        const body = error.error as ApiErrorBody | null | undefined;
        const apiMessage = body?.error?.message;
        const apiCode = body?.error?.code;
        const baseMessage = (apiCode && CODE_MESSAGES[apiCode]) || apiMessage;

        if (error.status === 400) {
          message = baseMessage ?? 'La solicitud no es válida.';
          const details = body?.error?.details;
          if (Array.isArray(details) && details.length > 0) {
            const lines = details
              .slice(0, 8)
              .map((item) => {
                const issue = item as { path?: unknown; message?: unknown };
                const path = typeof issue.path === 'string' && issue.path ? issue.path : 'campo';
                const text = typeof issue.message === 'string' ? issue.message : 'no válido';
                return `${path}: ${text}`;
              })
              .join('\n');
            message = `${message}\n\n${lines}`;
          }
        } else if (error.status === 401) {
          message = baseMessage ?? 'Debes iniciar sesión para acceder a este recurso.';
        } else if (error.status === 403) {
          message = baseMessage ?? 'No tienes permiso para acceder a este recurso.';
        } else if (error.status === 404) {
          message = baseMessage ?? 'No se ha encontrado el recurso solicitado.';
        } else if (error.status === 409) {
          message = baseMessage ?? 'La operación entra en conflicto con el estado actual del recurso.';
        } else if (error.status >= 500) {
          message = baseMessage ?? 'Error del servidor. Inténtalo de nuevo más tarde.';
        } else {
          message = baseMessage ?? message;
        }
      }

      if (!isSilentErrorUrl(req.url)) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: message,
          confirmButtonColor: '#A3B18A',
          timer: 5000,
          timerProgressBar: true
        });
      }

      return throwError(() => error);
    })
  );
};
