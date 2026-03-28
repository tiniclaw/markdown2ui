package com.markdown2ui

import java.text.NumberFormat
import java.util.Currency
import java.util.Locale

/** Format a number as a whole integer string when it has no fractional part. */
private fun formatWholeNumber(value: Number): String {
    val d = value.toDouble()
    return if (d % 1 == 0.0) d.toLong().toString() else value.toString()
}

fun formatDisplayValue(
    value: Number,
    format: FormatAnnotation?,
    locale: Locale = Locale.getDefault(),
): String {
    if (format == null) return formatWholeNumber(value)

    return when (format) {
        is FormatAnnotation.Currency -> {
            val nf = NumberFormat.getCurrencyInstance(locale)
            try {
                nf.currency = Currency.getInstance(format.code)
            } catch (_: IllegalArgumentException) {
                // Fall back to default currency if code is invalid
            }
            nf.format(value)
        }

        is FormatAnnotation.Unit -> {
            val unitLabel = if (value.toDouble() != 1.0 && format.plural != null) {
                format.plural
            } else {
                format.unit
            }
            val formatted = formatWholeNumber(value)
            "$formatted $unitLabel"
        }

        is FormatAnnotation.Percent -> {
            val nf = NumberFormat.getPercentInstance(locale)
            nf.format(value.toDouble() / 100.0)
        }

        is FormatAnnotation.Integer -> {
            val nf = NumberFormat.getIntegerInstance(locale)
            nf.format(value.toLong())
        }

        is FormatAnnotation.Decimal -> {
            val nf = NumberFormat.getNumberInstance(locale)
            nf.minimumFractionDigits = format.places
            nf.maximumFractionDigits = format.places
            nf.format(value)
        }
    }
}
