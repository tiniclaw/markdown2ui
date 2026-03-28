package com.markdown2ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.DatePicker
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.RadioButton
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Slider
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TimePicker
import androidx.compose.material3.rememberDatePickerState
import androidx.compose.material3.rememberTimePickerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.foundation.border
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.ui.layout.SubcomposeLayout
import coil.compose.AsyncImage
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun RenderBlock(block: Block, formState: FormState, errors: Map<String, String> = emptyMap()) {
    when (block) {
        is Block.SingleSelect -> SingleSelectRenderer(block, formState)
        is Block.MultiSelect -> MultiSelectRenderer(block, formState, errors)
        is Block.Sequence -> SequenceRenderer(block, formState)
        is Block.Confirmation -> ConfirmationRenderer(block, formState)
        is Block.TextInput -> TextInputRenderer(block, formState, errors)
        is Block.TypedInput -> TypedInputRenderer(block, formState, errors)
        is Block.Slider -> SliderRenderer(block, formState)
        is Block.Date -> DateRenderer(block, formState)
        is Block.Time -> TimeRenderer(block, formState)
        is Block.Datetime -> DatetimeRenderer(block, formState)
        is Block.FileUpload -> FileUploadRenderer(block, formState)
        is Block.ImageUpload -> ImageUploadRenderer(block, formState)
        is Block.Header -> HeaderRenderer(block)
        is Block.Hint -> HintRenderer(block)
        is Block.Divider -> DividerRenderer()
        is Block.Prose -> ProseRenderer(block)
        is Block.Group -> GroupRenderer(block, formState, errors)
    }
}

@Composable
private fun BlockLabel(label: String, required: Boolean?) {
    if (required == true) {
        Row {
            IconText(text = label, style = MaterialTheme.typography.labelLarge)
            Text(text = " *", style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.error)
        }
    } else {
        IconText(text = label, style = MaterialTheme.typography.labelLarge)
    }
}

@Composable
private fun BlockHint(hint: String?) {
    if (hint != null) {
        Text(
            text = hint,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

// --- Adaptive Select Layout ---
// Tries to render `segmented` in a single row. If any child is clipped or
// the intrinsic height exceeds a single-line threshold, renders `fallback` instead.

@Composable
private fun AdaptiveSelectLayout(
    segmented: @Composable () -> Unit,
    fallback: @Composable () -> Unit,
) {
    SubcomposeLayout { constraints ->
        // Measure the segmented row at full width
        val segmentedPlaceables = subcompose("measure", segmented).map {
            it.measure(constraints)
        }
        // MD3 SegmentedButton single-line height is ~48dp with padding.
        // If the row exceeds 52dp, at least one label wrapped → use fallback.
        val singleLineMax = 52.dp.roundToPx()
        val fits = segmentedPlaceables.all { it.height <= singleLineMax }

        val placeables = if (fits) {
            segmentedPlaceables
        } else {
            subcompose("fallback", fallback).map { it.measure(constraints) }
        }

        val width = placeables.maxOfOrNull { it.width } ?: 0
        val height = placeables.sumOf { it.height }
        layout(width, height) {
            var y = 0
            placeables.forEach {
                it.placeRelative(0, y)
                y += it.height
            }
        }
    }
}

// --- Image Option Grid ---

@Composable
private fun ImageOptionGrid(
    options: List<Pair<String, String?>>,
    selected: List<String>,
    onTap: (String) -> Unit,
) {
    LazyVerticalGrid(
        columns = GridCells.Adaptive(minSize = 140.dp),
        horizontalArrangement = Arrangement.spacedBy(10.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
        modifier = Modifier.height((((options.size + 1) / 2) * 170).dp),
    ) {
        items(options, key = { it.first }) { (text, image) ->
            val isSelected = text in selected
            val borderColor = if (isSelected) MaterialTheme.colorScheme.primary
                else MaterialTheme.colorScheme.outlineVariant
            val borderWidth = if (isSelected) 2.dp else 1.dp

            Column(
                modifier = Modifier
                    .clip(MaterialTheme.shapes.medium)
                    .border(borderWidth, borderColor, MaterialTheme.shapes.medium)
                    .clickable { onTap(text) },
            ) {
                if (image != null) {
                    AsyncImage(
                        model = image,
                        contentDescription = text,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(105.dp),
                    )
                }
                Text(
                    text = text,
                    style = MaterialTheme.typography.labelLarge,
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                )
            }
        }
    }
}

// --- SingleSelect ---

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun SingleSelectRenderer(block: Block.SingleSelect, formState: FormState) {
    val blockId = block.id ?: return
    val selected = formState.getValue(blockId) as? String
    val hasImages = block.options.any { it.image != null }

    Column(modifier = Modifier.fillMaxWidth()) {
        BlockLabel(block.label, block.required)
        Spacer(modifier = Modifier.height(4.dp))

        if (hasImages) {
            ImageOptionGrid(
                options = block.options.map { it.text to it.image },
                selected = listOfNotNull(selected),
                onTap = { formState.setValue(blockId, it) },
            )
        } else {
            AdaptiveSelectLayout(
                segmented = {
                    SingleChoiceSegmentedButtonRow(modifier = Modifier.fillMaxWidth()) {
                        block.options.forEachIndexed { index, option ->
                            SegmentedButton(
                                selected = selected == option.text,
                                onClick = { formState.setValue(blockId, option.text) },
                                shape = SegmentedButtonDefaults.itemShape(
                                    index = index,
                                    count = block.options.size,
                                ),
                            ) {
                                IconText(text = option.text)
                            }
                        }
                    }
                },
                fallback = {
                    Card(
                        colors = CardDefaults.outlinedCardColors(),
                        border = CardDefaults.outlinedCardBorder(),
                        shape = MaterialTheme.shapes.medium,
                    ) {
                        block.options.forEachIndexed { index, option ->
                            val isSelected = selected == option.text
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable { formState.setValue(blockId, option.text) }
                                    .then(
                                        if (isSelected) Modifier.background(MaterialTheme.colorScheme.secondaryContainer)
                                        else Modifier
                                    )
                                    .padding(horizontal = 16.dp, vertical = 10.dp),
                            ) {
                                IconText(
                                    text = option.text,
                                    style = MaterialTheme.typography.bodyLarge.copy(
                                        color = if (isSelected) MaterialTheme.colorScheme.onSecondaryContainer
                                            else MaterialTheme.colorScheme.onSurface,
                                    ),
                                    modifier = Modifier.weight(1f),
                                )
                                if (isSelected) {
                                    Text(
                                        text = "✓",
                                        color = MaterialTheme.colorScheme.onSecondaryContainer,
                                        style = MaterialTheme.typography.titleMedium,
                                    )
                                }
                            }
                            if (index < block.options.size - 1) {
                                HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
                            }
                        }
                    }
                },
            )
        }
        BlockHint(block.hint)
    }
}

// --- MultiSelect ---

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun MultiSelectRenderer(block: Block.MultiSelect, formState: FormState, errors: Map<String, String> = emptyMap()) {
    val blockId = block.id ?: return
    @Suppress("UNCHECKED_CAST")
    val selected = (formState.getValue(blockId) as? List<String>) ?: emptyList()
    val error = errors[blockId]
    val hasImages = block.options.any { it.image != null }

    Column(modifier = Modifier.fillMaxWidth()) {
        BlockLabel(block.label, block.required)
        Spacer(modifier = Modifier.height(4.dp))

        if (hasImages) {
            ImageOptionGrid(
                options = block.options.map { it.text to it.image },
                selected = selected,
                onTap = { text ->
                    val newList = if (text in selected) selected - text else selected + text
                    formState.setValue(blockId, newList)
                },
            )
        } else {
            FlowRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                block.options.forEach { option ->
                    val isSelected = option.text in selected
                    FilterChip(
                        selected = isSelected,
                        onClick = {
                            val newList = if (isSelected) selected - option.text else selected + option.text
                            formState.setValue(blockId, newList)
                        },
                        label = { IconText(text = option.text) },
                    )
                }
            }
        }
        if (error != null) {
            Text(
                text = error,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.error,
                modifier = Modifier.padding(start = 4.dp, top = 2.dp),
            )
        }
        BlockHint(block.hint)
    }
}

// --- Sequence ---

@Composable
private fun SequenceRenderer(block: Block.Sequence, formState: FormState) {
    val blockId = block.id ?: return
    @Suppress("UNCHECKED_CAST")
    val items = (formState.getValue(blockId) as? List<String>) ?: block.items

    Column(modifier = Modifier.fillMaxWidth()) {
        BlockLabel(block.label, block.required)
        Spacer(modifier = Modifier.height(4.dp))

        items.forEachIndexed { index, item ->
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 2.dp),
            ) {
                Text(
                    text = "${index + 1}.",
                    style = MaterialTheme.typography.bodyMedium,
                    modifier = Modifier.width(28.dp),
                )
                Text(
                    text = item,
                    style = MaterialTheme.typography.bodyLarge,
                    modifier = Modifier.weight(1f),
                )
                IconButton(
                    onClick = {
                        if (index > 0) {
                            val mutable = items.toMutableList()
                            val temp = mutable[index]
                            mutable[index] = mutable[index - 1]
                            mutable[index - 1] = temp
                            formState.setValue(blockId, mutable)
                        }
                    },
                    enabled = index > 0,
                    modifier = Modifier.size(36.dp),
                ) {
                    Text("\u25B2", style = MaterialTheme.typography.bodySmall)
                }
                IconButton(
                    onClick = {
                        if (index < items.lastIndex) {
                            val mutable = items.toMutableList()
                            val temp = mutable[index]
                            mutable[index] = mutable[index + 1]
                            mutable[index + 1] = temp
                            formState.setValue(blockId, mutable)
                        }
                    },
                    enabled = index < items.lastIndex,
                    modifier = Modifier.size(36.dp),
                ) {
                    Text("\u25BC", style = MaterialTheme.typography.bodySmall)
                }
            }
        }
        BlockHint(block.hint)
    }
}

// --- Confirmation ---

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun ConfirmationRenderer(block: Block.Confirmation, formState: FormState) {
    val blockId = block.id ?: return
    val value = (formState.getValue(blockId) as? Boolean) ?: false

    Column(modifier = Modifier.fillMaxWidth()) {
        BlockLabel(block.label, block.required)
        Spacer(modifier = Modifier.height(8.dp))
        FlowRow(
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.fillMaxWidth(),
        ) {
            // Filled style follows the SELECTED state
            if (value == false) {
                Button(
                    onClick = { formState.setValue(blockId, false) },
                ) { IconText(text = block.noLabel) }
            } else {
                OutlinedButton(
                    onClick = { formState.setValue(blockId, false) },
                ) { IconText(text = block.noLabel) }
            }
            if (value == true) {
                Button(
                    onClick = { formState.setValue(blockId, true) },
                ) { IconText(text = block.yesLabel) }
            } else {
                OutlinedButton(
                    onClick = { formState.setValue(blockId, true) },
                ) { IconText(text = block.yesLabel) }
            }
        }
        BlockHint(block.hint)
    }
}

// --- TextInput ---

@Composable
private fun TextInputRenderer(block: Block.TextInput, formState: FormState, errors: Map<String, String> = emptyMap()) {
    val blockId = block.id ?: return
    val value = (formState.getValue(blockId) as? String) ?: ""
    val error = errors[blockId]

    Column(modifier = Modifier.fillMaxWidth()) {
        OutlinedTextField(
            value = value,
            onValueChange = { formState.setValue(blockId, it) },
            label = {
                val label = if (block.required == true) "${block.label} *" else block.label
                IconText(text = label)
            },
            placeholder = block.placeholder?.let { { Text(it) } },
            modifier = Modifier.fillMaxWidth(),
            minLines = if (block.multiline) 3 else 1,
            maxLines = if (block.multiline) 8 else 1,
            singleLine = !block.multiline,
            isError = error != null,
        )
        if (error != null) {
            Text(
                text = error,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.error,
                modifier = Modifier.padding(start = 4.dp, top = 2.dp),
            )
        }
        BlockHint(block.hint)
    }
}

// --- TypedInput ---

@Composable
private fun TypedInputRenderer(block: Block.TypedInput, formState: FormState, errors: Map<String, String> = emptyMap()) {
    val blockId = block.id ?: return
    val value = (formState.getValue(blockId) as? String) ?: ""
    val error = errors[blockId]

    val keyboardType = when (block.format) {
        "email" -> KeyboardType.Email
        "tel" -> KeyboardType.Phone
        "url" -> KeyboardType.Uri
        "number" -> KeyboardType.Number
        "password" -> KeyboardType.Password
        else -> KeyboardType.Text
    }

    val visualTransformation = if (block.format == "password") {
        PasswordVisualTransformation()
    } else {
        VisualTransformation.None
    }

    Column(modifier = Modifier.fillMaxWidth()) {
        OutlinedTextField(
            value = value,
            onValueChange = { formState.setValue(blockId, it) },
            label = {
                val label = if (block.required == true) "${block.label} *" else block.label
                IconText(text = label)
            },
            placeholder = block.placeholder?.let { { Text(it) } },
            modifier = Modifier.fillMaxWidth(),
            keyboardOptions = KeyboardOptions(keyboardType = keyboardType),
            visualTransformation = visualTransformation,
            singleLine = true,
            isError = error != null,
        )
        if (error != null) {
            Text(
                text = error,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.error,
                modifier = Modifier.padding(start = 4.dp, top = 2.dp),
            )
        }
        if (block.displayFormat != null && value.toDoubleOrNull() != null) {
            Text(
                text = formatDisplayValue(value.toDouble(), block.displayFormat),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(top = 2.dp),
            )
        }
        BlockHint(block.hint)
    }
}

// --- Slider ---

@Composable
private fun SliderRenderer(block: Block.Slider, formState: FormState) {
    val blockId = block.id ?: return
    val value = (formState.getValue(blockId) as? Float) ?: block.default.toFloat()

    Column(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            BlockLabel(block.label, block.required)
            Text(
                text = formatDisplayValue(value, block.displayFormat),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.primary,
            )
        }
        Slider(
            value = value,
            onValueChange = { formState.setValue(blockId, it) },
            valueRange = block.min.toFloat()..block.max.toFloat(),
            steps = if (block.step != null) {
                ((block.max - block.min) / block.step).toInt() - 1
            } else {
                0
            },
            modifier = Modifier.fillMaxWidth(),
        )
        BlockHint(block.hint)
    }
}

// --- Date ---

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun DateRenderer(block: Block.Date, formState: FormState) {
    val blockId = block.id ?: return
    val value = (formState.getValue(blockId) as? String) ?: block.default
    var showDialog by remember { mutableStateOf(false) }

    Column(modifier = Modifier.fillMaxWidth()) {
        OutlinedTextField(
            value = value,
            onValueChange = {},
            label = {
                val label = if (block.required == true) "${block.label} *" else block.label
                IconText(text = label)
            },
            modifier = Modifier
                .fillMaxWidth()
                .clickable { showDialog = true },
            readOnly = true,
            enabled = false,
        )
        BlockHint(block.hint)
    }

    if (showDialog) {
        val datePickerState = rememberDatePickerState()
        DatePickerDialog(
            onDismissRequest = { showDialog = false },
            confirmButton = {
                TextButton(onClick = {
                    datePickerState.selectedDateMillis?.let { millis ->
                        val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.US)
                        formState.setValue(blockId, sdf.format(Date(millis)))
                    }
                    showDialog = false
                }) {
                    Text("OK")
                }
            },
            dismissButton = {
                TextButton(onClick = { showDialog = false }) {
                    Text("Cancel")
                }
            },
        ) {
            DatePicker(state = datePickerState)
        }
    }
}

// --- Time ---

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun TimeRenderer(block: Block.Time, formState: FormState) {
    val blockId = block.id ?: return
    val value = (formState.getValue(blockId) as? String) ?: block.default
    var showDialog by remember { mutableStateOf(false) }

    val parts = value.split(":")
    val initialHour = parts.getOrNull(0)?.toIntOrNull() ?: 0
    val initialMinute = parts.getOrNull(1)?.toIntOrNull() ?: 0

    Column(modifier = Modifier.fillMaxWidth()) {
        OutlinedTextField(
            value = value,
            onValueChange = {},
            label = {
                val label = if (block.required == true) "${block.label} *" else block.label
                IconText(text = label)
            },
            modifier = Modifier
                .fillMaxWidth()
                .clickable { showDialog = true },
            readOnly = true,
            enabled = false,
        )
        BlockHint(block.hint)
    }

    if (showDialog) {
        val timePickerState = rememberTimePickerState(
            initialHour = initialHour,
            initialMinute = initialMinute,
        )
        Dialog(onDismissRequest = { showDialog = false }) {
            androidx.compose.material3.Surface(
                shape = MaterialTheme.shapes.extraLarge,
                tonalElevation = 6.dp,
            ) {
                Column(
                    modifier = Modifier.padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    TimePicker(state = timePickerState)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.End,
                    ) {
                        TextButton(onClick = { showDialog = false }) {
                            Text("Cancel")
                        }
                        TextButton(onClick = {
                            val formatted = String.format(
                                Locale.US,
                                "%02d:%02d",
                                timePickerState.hour,
                                timePickerState.minute,
                            )
                            formState.setValue(blockId, formatted)
                            showDialog = false
                        }) {
                            Text("OK")
                        }
                    }
                }
            }
        }
    }
}

// --- Datetime ---

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun DatetimeRenderer(block: Block.Datetime, formState: FormState) {
    val blockId = block.id ?: return
    val value = (formState.getValue(blockId) as? String) ?: block.default
    var showDateDialog by remember { mutableStateOf(false) }
    var showTimeDialog by remember { mutableStateOf(false) }
    var pendingDate by remember { mutableStateOf("") }

    // Parse existing value: expect "yyyy-MM-ddTHH:mm" or similar
    val datePart = value.substringBefore("T").takeIf { it.contains("-") } ?: ""
    val timePart = value.substringAfter("T", "").takeIf { it.contains(":") } ?: "00:00"

    Column(modifier = Modifier.fillMaxWidth()) {
        OutlinedTextField(
            value = value,
            onValueChange = {},
            label = {
                val label = if (block.required == true) "${block.label} *" else block.label
                IconText(text = label)
            },
            modifier = Modifier
                .fillMaxWidth()
                .clickable { showDateDialog = true },
            readOnly = true,
            enabled = false,
        )
        BlockHint(block.hint)
    }

    if (showDateDialog) {
        val datePickerState = rememberDatePickerState()
        DatePickerDialog(
            onDismissRequest = { showDateDialog = false },
            confirmButton = {
                TextButton(onClick = {
                    datePickerState.selectedDateMillis?.let { millis ->
                        val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.US)
                        pendingDate = sdf.format(Date(millis))
                    }
                    showDateDialog = false
                    showTimeDialog = true
                }) {
                    Text("Next")
                }
            },
            dismissButton = {
                TextButton(onClick = { showDateDialog = false }) {
                    Text("Cancel")
                }
            },
        ) {
            DatePicker(state = datePickerState)
        }
    }

    if (showTimeDialog) {
        val tParts = timePart.split(":")
        val timePickerState = rememberTimePickerState(
            initialHour = tParts.getOrNull(0)?.toIntOrNull() ?: 0,
            initialMinute = tParts.getOrNull(1)?.toIntOrNull() ?: 0,
        )
        Dialog(onDismissRequest = { showTimeDialog = false }) {
            androidx.compose.material3.Surface(
                shape = MaterialTheme.shapes.extraLarge,
                tonalElevation = 6.dp,
            ) {
                Column(
                    modifier = Modifier.padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    TimePicker(state = timePickerState)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.End,
                    ) {
                        TextButton(onClick = { showTimeDialog = false }) {
                            Text("Cancel")
                        }
                        TextButton(onClick = {
                            val time = String.format(
                                Locale.US,
                                "%02d:%02d",
                                timePickerState.hour,
                                timePickerState.minute,
                            )
                            formState.setValue(blockId, "${pendingDate}T$time")
                            showTimeDialog = false
                        }) {
                            Text("OK")
                        }
                    }
                }
            }
        }
    }
}

// --- FileUpload ---

@Composable
private fun FileUploadRenderer(block: Block.FileUpload, formState: FormState) {
    Column(modifier = Modifier.fillMaxWidth()) {
        BlockLabel(block.label, block.required)
        Spacer(modifier = Modifier.height(4.dp))
        OutlinedButton(
            onClick = { /* File picker integration point */ },
            modifier = Modifier.fillMaxWidth(),
        ) {
            val extensions = block.extensions?.joinToString(", ") ?: "any"
            Text("Choose file ($extensions)")
        }
        BlockHint(block.hint)
    }
}

// --- ImageUpload ---

@Composable
private fun ImageUploadRenderer(block: Block.ImageUpload, formState: FormState) {
    Column(modifier = Modifier.fillMaxWidth()) {
        BlockLabel(block.label, block.required)
        Spacer(modifier = Modifier.height(4.dp))
        OutlinedButton(
            onClick = { /* Image picker integration point */ },
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text("Choose image")
        }
        BlockHint(block.hint)
    }
}

// --- Header ---

@Composable
private fun HeaderRenderer(block: Block.Header) {
    val style = when (block.level) {
        1 -> MaterialTheme.typography.titleMedium
        else -> MaterialTheme.typography.titleSmall
    }
    IconText(
        text = block.text,
        style = style,
        modifier = Modifier.padding(top = 4.dp),
    )
}

// --- Hint ---

@Composable
private fun HintRenderer(block: Block.Hint) {
    IconText(
        text = block.text,
        style = MaterialTheme.typography.bodySmall,
    )
}

// --- Divider ---

@Composable
private fun DividerRenderer() {
    HorizontalDivider(modifier = Modifier.padding(vertical = 4.dp))
}

// --- Prose ---

@Composable
private fun ProseRenderer(block: Block.Prose) {
    IconText(
        text = block.text,
        style = MaterialTheme.typography.bodyMedium,
    )
}

// --- Group ---

@Composable
private fun GroupRenderer(block: Block.Group, formState: FormState, errors: Map<String, String> = emptyMap()) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceContainerLow,
        ),
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            // Group name is for accessibility only, not displayed
            BoxWithConstraints(modifier = Modifier.fillMaxWidth()) {
                if (maxWidth > 400.dp) {
                    // Side-by-side when there's enough space
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        block.children.forEach { child ->
                            Box(modifier = Modifier.weight(1f)) {
                                RenderBlock(block = child, formState = formState, errors = errors)
                            }
                        }
                    }
                } else {
                    // Stack vertically on narrow screens
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        block.children.forEach { child ->
                            RenderBlock(block = child, formState = formState, errors = errors)
                        }
                    }
                }
            }
        }
    }
}
