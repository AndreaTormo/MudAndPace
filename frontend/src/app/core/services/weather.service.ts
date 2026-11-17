import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiResponse } from '../models/api.model';
import { WeatherForecast, WeatherQuery } from '../models/weather.model';
import { ApiService } from './api.service';

function isWeatherForecast(data: WeatherForecast | null | undefined): data is WeatherForecast {
  return (
    typeof data === 'object' &&
    data !== null &&
    Array.isArray(data.days) &&
    typeof data.location === 'object' &&
    data.location !== null &&
    typeof data.units === 'object' &&
    data.units !== null
  );
}

@Injectable({ providedIn: 'root' })
export class WeatherService {
  private readonly api = inject(ApiService);

  getForecast(query: WeatherQuery): Observable<WeatherForecast> {
    let params = new HttpParams()
      .set('lat', query.latitude)
      .set('lon', query.longitude);

    if (query.date) {
      params = params.set('date', query.date);
    } else {
      params = params.set('days', query.days ?? 3);
    }

    return this.api.getAi<ApiResponse<WeatherForecast>>('agent/weather', params).pipe(
      map((response) => {
        const data = response?.data;
        if (!isWeatherForecast(data)) {
          throw new Error('INVALID_RESPONSE');
        }
        return data;
      })
    );
  }
}
