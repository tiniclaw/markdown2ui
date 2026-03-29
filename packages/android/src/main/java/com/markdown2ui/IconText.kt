package com.markdown2ui

import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Icon
import androidx.compose.material3.LocalTextStyle
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp

// Material icon name → android.R.drawable resource mapping
private val iconMap: Map<String, Int> = mapOf(
    "home" to android.R.drawable.ic_menu_myplaces,
    "search" to android.R.drawable.ic_menu_search,
    "settings" to android.R.drawable.ic_menu_preferences,
    "edit" to android.R.drawable.ic_menu_edit,
    "delete" to android.R.drawable.ic_menu_delete,
    "add" to android.R.drawable.ic_menu_add,
    "close" to android.R.drawable.ic_menu_close_clear_cancel,
    "share" to android.R.drawable.ic_menu_share,
    "send" to android.R.drawable.ic_menu_send,
    "camera" to android.R.drawable.ic_menu_camera,
    "upload" to android.R.drawable.ic_menu_upload,
    "save" to android.R.drawable.ic_menu_save,
    "info" to android.R.drawable.ic_menu_info_details,
    "calendar" to android.R.drawable.ic_menu_my_calendar,
    "call" to android.R.drawable.ic_menu_call,
    "phone" to android.R.drawable.ic_menu_call,
    "more" to android.R.drawable.ic_menu_more,
    "gallery" to android.R.drawable.ic_menu_gallery,
    "image" to android.R.drawable.ic_menu_gallery,
    "map" to android.R.drawable.ic_menu_mapmode,
    "location" to android.R.drawable.ic_menu_mylocation,
    "globe" to android.R.drawable.ic_menu_mapmode,
    "view" to android.R.drawable.ic_menu_view,
    "sort" to android.R.drawable.ic_menu_sort_alphabetically,
    "help" to android.R.drawable.ic_menu_help,
    "report" to android.R.drawable.ic_menu_report_image,
    "zoom" to android.R.drawable.ic_menu_zoom,
    "day" to android.R.drawable.ic_menu_day,
)

// Emoji fallback for icons without a Material resource
private val emojiFallback: Map<String, String> = mapOf(
    "email" to "✉️", "notification" to "🔔", "chat" to "💬",
    "person" to "👤", "people" to "👥", "account" to "👤",
    "check" to "✓", "lock" to "🔒", "unlock" to "🔓", "key" to "🔑",
    "file" to "📄", "folder" to "📁", "video" to "🎬", "music" to "🎵",
    "document" to "📝", "code" to "💻",
    "warning" to "⚠️", "error" to "❌", "success" to "✅",
    "star" to "⭐", "star_filled" to "⭐", "heart" to "❤️", "flag" to "🚩",
    "clock" to "🕐",
    "cart" to "🛒", "payment" to "💳", "money" to "💰",
    "gift" to "🎁", "tag" to "🏷️", "receipt" to "🧾",
    "car" to "🚗", "train" to "🚆", "plane" to "✈️",
    "bus" to "🚌", "bike" to "🚲", "walk" to "🚶", "ship" to "🚢",
    "sun" to "☀️", "moon" to "🌙", "cloud" to "☁️", "fire" to "🔥",
    "light" to "💡", "dark" to "🌙", "wifi" to "📶", "power" to "⏻",
    "remove" to "−", "back" to "←", "forward" to "→",
    "up" to "↑", "down" to "↓", "menu" to "☰",
    "refresh" to "↻", "copy" to "📋", "download" to "⬇️",
    "link" to "🔗", "external_link" to "↗️",
)

private val iconNameRegex = Regex("^:([a-z][a-z0-9_]*):\\s*")

data class IconParts(
    val iconName: String? = null,
    val drawableRes: Int? = null,
    val emojiFallbackChar: String? = null,
    val text: String,
)

fun extractIconParts(text: String): IconParts {
    val match = iconNameRegex.find(text) ?: return IconParts(text = text)
    val name = match.groupValues[1]
    val rest = text.substring(match.range.last + 1).trimStart()
    return IconParts(
        iconName = name,
        drawableRes = iconMap[name],
        emojiFallbackChar = emojiFallback[name],
        text = rest,
    )
}

@Composable
fun IconText(
    text: String,
    modifier: Modifier = Modifier,
    style: TextStyle = LocalTextStyle.current,
) {
    val parts = extractIconParts(text)

    if (parts.drawableRes != null) {
        Row(verticalAlignment = Alignment.CenterVertically, modifier = modifier) {
            Icon(
                painter = painterResource(parts.drawableRes),
                contentDescription = parts.iconName,
                modifier = Modifier.size(18.dp),
                tint = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Spacer(modifier = Modifier.width(4.dp))
            Text(text = parts.text, style = style)
        }
    } else if (parts.emojiFallbackChar != null) {
        Row(verticalAlignment = Alignment.CenterVertically, modifier = modifier) {
            Text(text = parts.emojiFallbackChar, style = style)
            Spacer(modifier = Modifier.width(4.dp))
            Text(text = parts.text, style = style)
        }
    } else {
        Text(text = parts.text, style = style, modifier = modifier)
    }
}

/**
 * Renders option text with label:description formatting.
 * Text before the first colon is bolded; text after is normal weight.
 */
@Composable
fun OptionIconText(
    text: String,
    modifier: Modifier = Modifier,
    style: TextStyle = LocalTextStyle.current,
) {
    val parts = extractIconParts(text)
    val colonIdx = parts.text.indexOf(':')

    @Composable
    fun StyledText() {
        if (colonIdx >= 0) {
            Text(
                text = buildAnnotatedString {
                    withStyle(SpanStyle(fontWeight = FontWeight.Bold)) {
                        append(parts.text.substring(0, colonIdx))
                    }
                    append(parts.text.substring(colonIdx))
                },
                style = style,
            )
        } else {
            Text(text = parts.text, style = style)
        }
    }

    if (parts.drawableRes != null) {
        Row(verticalAlignment = Alignment.CenterVertically, modifier = modifier) {
            Icon(
                painter = painterResource(parts.drawableRes),
                contentDescription = parts.iconName,
                modifier = Modifier.size(18.dp),
                tint = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Spacer(modifier = Modifier.width(4.dp))
            StyledText()
        }
    } else if (parts.emojiFallbackChar != null) {
        Row(verticalAlignment = Alignment.CenterVertically, modifier = modifier) {
            Text(text = parts.emojiFallbackChar, style = style)
            Spacer(modifier = Modifier.width(4.dp))
            StyledText()
        }
    } else {
        StyledText()
    }
}
