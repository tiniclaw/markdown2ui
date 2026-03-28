import type { FormatAnnotation } from '@markdown2ui/parser';

export function formatDisplayValue(
  value: number,
  fmt?: FormatAnnotation,
  locale: string = navigator.language
): string {
  if (!fmt) return String(value);

  switch (fmt.type) {
    case 'currency':
      try {
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: fmt.code,
          maximumFractionDigits: 0,
        }).format(value);
      } catch {
        return `${value} ${fmt.code}`;
      }

    case 'unit':
      if (fmt.plural && value !== 1) {
        return `${value.toLocaleString(locale)} ${fmt.plural}`;
      }
      return `${value.toLocaleString(locale)} ${fmt.unit}`;

    case 'percent':
      return `${value.toLocaleString(locale)}%`;

    case 'integer':
      return Math.round(value).toLocaleString(locale);

    case 'decimal':
      return value.toLocaleString(locale, {
        minimumFractionDigits: fmt.places,
        maximumFractionDigits: fmt.places,
      });

    default:
      return String(value);
  }
}
