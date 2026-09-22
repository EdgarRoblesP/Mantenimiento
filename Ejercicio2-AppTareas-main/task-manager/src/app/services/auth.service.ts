import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoginResponse, MessageResponse, User } from '../models/auth.model';
import { rethrowAsApiError } from '../core/http-error';

const TOKEN_KEY = 'listwebsite.token';
const USER_KEY = 'listwebsite.user';

/**
 * Estado de sesión del frontend (NRF-01 a NRF-05).
 *
 * El token se guarda en `localStorage` para sobrevivir a una recarga; la
 * validez real la decide el backend, que comprueba la sesión en base de datos.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  private readonly userSubject = new BehaviorSubject<User | null>(this.readStoredUser());
  public readonly user$: Observable<User | null> = this.userSubject.asObservable();
  public readonly isAuthenticated$: Observable<boolean> = this.user$.pipe(map(Boolean));

  public get currentUser(): User | null {
    return this.userSubject.value;
  }

  public get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  public get isAuthenticated(): boolean {
    return Boolean(this.token && this.currentUser);
  }

  /** NRF-01 - el backend envía el correo de verificación (NRF-02). */
  public register(email: string, password: string, confirmPassword: string): Observable<MessageResponse> {
    return this.http
      .post<MessageResponse>(`${this.baseUrl}/register`, { email, password, confirmPassword })
      .pipe(catchError(rethrowAsApiError));
  }

  /** NRF-02 - devuelve también el usuario ya verificado. */
  public verifyEmail(token: string): Observable<MessageResponse & { user: User }> {
    return this.http
      .post<MessageResponse & { user: User }>(`${this.baseUrl}/verify-email`, { token })
      .pipe(catchError(rethrowAsApiError));
  }

  /** NRF-02 - reenvío desde el banner de «cuenta sin verificar». */
  public resendVerification(email: string): Observable<MessageResponse> {
    return this.http
      .post<MessageResponse>(`${this.baseUrl}/resend-verification`, { email })
      .pipe(catchError(rethrowAsApiError));
  }

  /** NRF-03 */
  public login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, { email, password }).pipe(
      tap(response => this.storeSession(response)),
      catchError(rethrowAsApiError)
    );
  }

  /**
   * NRF-05 - el backend revoca la sesión; el estado local se limpia pase lo que
   * pase para que el usuario no quede atrapado si la petición falla.
   */
  public logout(): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.baseUrl}/logout`, {}).pipe(
      tap(() => this.clearSession()),
      catchError(error => {
        this.clearSession();
        return rethrowAsApiError(error);
      })
    );
  }

  /** NRF-04 - solicitud del enlace. */
  public forgotPassword(email: string): Observable<MessageResponse> {
    return this.http
      .post<MessageResponse>(`${this.baseUrl}/forgot-password`, { email })
      .pipe(catchError(rethrowAsApiError));
  }

  /** NRF-04 - nueva contraseña. */
  public resetPassword(
    token: string,
    password: string,
    confirmPassword: string
  ): Observable<MessageResponse> {
    return this.http
      .post<MessageResponse>(`${this.baseUrl}/reset-password`, { token, password, confirmPassword })
      .pipe(catchError(rethrowAsApiError));
  }

  /** Revalida la sesión guardada al arrancar la aplicación. */
  public loadProfile(): Observable<User> {
    return this.http.get<{ user: User }>(`${this.baseUrl}/me`).pipe(
      map(response => response.user),
      tap(user => {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        this.userSubject.next(user);
      }),
      catchError(rethrowAsApiError)
    );
  }

  /** Lo llama el interceptor cuando el backend responde 401. */
  public clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.userSubject.next(null);
  }

  private storeSession(response: LoginResponse): void {
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    this.userSubject.next(response.user);
  }

  private readStoredUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw || !localStorage.getItem(TOKEN_KEY)) {
      return null;
    }

    try {
      return JSON.parse(raw) as User;
    } catch {
      // Dato corrupto en localStorage: se descarta y se pide iniciar sesión.
      this.clearSession();
      return null;
    }
  }
}
