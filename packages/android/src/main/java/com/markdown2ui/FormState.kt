package com.markdown2ui

import androidx.compose.runtime.mutableStateMapOf
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject

class FormState {
    internal val values = mutableStateMapOf<String, Any?>()

    fun getValue(id: String): Any? = values[id]

    fun setValue(id: String, value: Any?) {
        values[id] = value
    }

    fun initializeDefaults(blocks: List<Block>) {
        blocks.forEach { block ->
            when (block) {
                is Block.SingleSelect -> {
                    val blockId = block.id ?: return@forEach
                    if (blockId !in values) {
                        val defaultOption = block.options.firstOrNull { it.default }
                        values[blockId] = defaultOption?.text
                    }
                }
                is Block.MultiSelect -> {
                    val blockId = block.id ?: return@forEach
                    if (blockId !in values) {
                        val selected = block.options.filter { it.selected }.map { it.text }
                        values[blockId] = selected
                    }
                }
                is Block.Sequence -> {
                    val blockId = block.id ?: return@forEach
                    if (blockId !in values) {
                        values[blockId] = block.items.toMutableList()
                    }
                }
                is Block.Confirmation -> {
                    val blockId = block.id ?: return@forEach
                    if (blockId !in values) {
                        values[blockId] = false
                    }
                }
                is Block.TextInput -> {
                    val blockId = block.id ?: return@forEach
                    if (blockId !in values) {
                        values[blockId] = block.prefill ?: ""
                    }
                }
                is Block.TypedInput -> {
                    val blockId = block.id ?: return@forEach
                    if (blockId !in values) {
                        values[blockId] = block.prefill ?: ""
                    }
                }
                is Block.Slider -> {
                    val blockId = block.id ?: return@forEach
                    if (blockId !in values) {
                        values[blockId] = block.default.toFloat()
                    }
                }
                is Block.Date -> {
                    val blockId = block.id ?: return@forEach
                    if (blockId !in values) {
                        values[blockId] = if (block.default == "NOW") {
                            java.time.LocalDate.now().toString()
                        } else block.default
                    }
                }
                is Block.Time -> {
                    val blockId = block.id ?: return@forEach
                    if (blockId !in values) {
                        values[blockId] = if (block.default == "NOW") {
                            java.time.LocalTime.now().let { String.format(java.util.Locale.US, "%02d:%02d", it.hour, it.minute) }
                        } else block.default
                    }
                }
                is Block.Datetime -> {
                    val blockId = block.id ?: return@forEach
                    if (blockId !in values) {
                        values[blockId] = if (block.default == "NOW") {
                            java.time.LocalDateTime.now().toString().take(16)
                        } else block.default
                    }
                }
                is Block.FileUpload -> {
                    val blockId = block.id ?: return@forEach
                    if (blockId !in values) {
                        values[blockId] = null
                    }
                }
                is Block.ImageUpload -> {
                    val blockId = block.id ?: return@forEach
                    if (blockId !in values) {
                        values[blockId] = null
                    }
                }
                is Block.Group -> {
                    initializeDefaults(block.children)
                }
                is Block.Header, is Block.Hint, is Block.Divider, is Block.Prose -> {
                    // Display-only blocks have no state
                }
            }
        }
    }

    /**
     * Validates all required fields and returns a map of block-id to error message.
     * An empty map means no validation errors.
     */
    fun validate(blocks: List<Block>): Map<String, String> {
        val errors = mutableMapOf<String, String>()
        validateBlocks(blocks, errors)
        return errors
    }

    private fun validateBlocks(blocks: List<Block>, errors: MutableMap<String, String>) {
        blocks.forEach { block ->
            when (block) {
                is Block.TextInput -> {
                    val blockId = block.id ?: return@forEach
                    if (block.required == true) {
                        val value = (values[blockId] as? String) ?: ""
                        if (value.isBlank()) {
                            errors[blockId] = "${block.label} is required"
                        }
                    }
                }
                is Block.TypedInput -> {
                    val blockId = block.id ?: return@forEach
                    val value = (values[blockId] as? String) ?: ""
                    if (block.required == true && value.isBlank()) {
                        errors[blockId] = "${block.label} is required"
                    } else if (value.isNotBlank()) {
                        when (block.format) {
                            "email" -> if (!value.contains("@") || !value.contains(".")) {
                                errors[blockId] = "Enter a valid email address"
                            }
                            "url" -> if (!value.startsWith("http://") && !value.startsWith("https://") && !value.contains(".")) {
                                errors[blockId] = "Enter a valid URL"
                            }
                            "tel" -> if (value.filter { it.isDigit() || it == '+' }.length < 7) {
                                errors[blockId] = "Enter a valid phone number"
                            }
                            else -> {}
                        }
                    }
                }
                is Block.MultiSelect -> {
                    val blockId = block.id ?: return@forEach
                    if (block.required == true) {
                        @Suppress("UNCHECKED_CAST")
                        val selected = (values[blockId] as? List<String>) ?: emptyList()
                        if (selected.isEmpty()) {
                            errors[blockId] = "Select at least one option"
                        }
                    }
                }
                is Block.Group -> {
                    validateBlocks(block.children, errors)
                }
                else -> { /* no validation needed */ }
            }
        }
    }

    fun serializeCompact(blocks: List<Block>): String {
        val json = buildJsonObject {
            collectValues(blocks, this)
        }
        return json.toString()
    }

    private fun collectValues(blocks: List<Block>, builder: kotlinx.serialization.json.JsonObjectBuilder) {
        blocks.forEach { block ->
            when (block) {
                is Block.Group -> collectValues(block.children, builder)
                is Block.Header, is Block.Hint, is Block.Divider, is Block.Prose -> {}
                else -> {
                    val blockId = block.id ?: return@forEach
                    val value = values[blockId]
                    builder.put(blockId, toJsonElement(value))
                }
            }
        }
    }

    private fun toJsonElement(value: Any?): JsonElement = when (value) {
        null -> JsonNull
        is String -> JsonPrimitive(value)
        is Number -> JsonPrimitive(value)
        is Boolean -> JsonPrimitive(value)
        is List<*> -> JsonArray(value.map { toJsonElement(it) })
        else -> JsonPrimitive(value.toString())
    }
}
