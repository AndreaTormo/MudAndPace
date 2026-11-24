import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SentimentRankingItem } from '../../../../core/models/aiAnalysis.model';

@Component({
  selector: 'app-admin-sentiment-ranking',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (items().length === 0) {
      <p class="mt-3 text-sm text-gray-500">No hay elementos con suficientes comentarios.</p>
    } @else {
      <div class="mt-4 overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="text-xs uppercase tracking-wide text-gray-400">
            <tr>
              <th class="pb-2">Nombre</th>
              <th class="pb-2 text-right">Comentarios</th>
              <th class="pb-2 text-right">Puntuación</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            @for (item of items(); track item.id) {
              <tr>
                <td class="py-2 pr-3 text-gray-800">{{ item.name }}</td>
                <td class="py-2 text-right text-gray-500">{{ item.total }}</td>
                <td class="py-2 text-right font-semibold text-brand">{{ item.score }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `
})
export class AdminSentimentRanking {
  readonly items = input.required<SentimentRankingItem[]>();
}
