import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastService } from '../services/toast.service';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const toast = inject(ToastService);
  const token = localStorage.getItem('nexus_token');
  
  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      const detail = error?.error?.detail;
      let message = "Request failed";
      if (typeof detail === 'string') message = detail;
      else if (detail?.error) message = detail.error;
      else if (Array.isArray(detail)) message = detail[0]?.msg || message;

      if (error.status === 401) {
        localStorage.removeItem('nexus_token');
        router.navigate(['/login']);
      } else {
        toast.error(message);
      }
      return throwError(() => error);
    })
  );
};
