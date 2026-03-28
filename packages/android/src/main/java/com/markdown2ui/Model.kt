package com.markdown2ui

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonClassDiscriminator

@Serializable
data class Ast(
    val version: String,
    val blocks: List<Block>,
)

@Serializable
data class SingleSelectOption(
    val text: String,
    val default: Boolean = false,
    val image: String? = null,
)

@Serializable
data class MultiSelectOption(
    val text: String,
    val selected: Boolean = false,
    val image: String? = null,
)

@Serializable
@JsonClassDiscriminator("type")
sealed interface FormatAnnotation {
    @Serializable
    @SerialName("currency")
    data class Currency(val code: String) : FormatAnnotation

    @Serializable
    @SerialName("unit")
    data class Unit(val unit: String, val plural: String? = null) : FormatAnnotation

    @Serializable
    @SerialName("percent")
    data object Percent : FormatAnnotation

    @Serializable
    @SerialName("integer")
    data object Integer : FormatAnnotation

    @Serializable
    @SerialName("decimal")
    data class Decimal(val places: Int) : FormatAnnotation
}

@Serializable
@JsonClassDiscriminator("type")
sealed interface Block {

    val id: String? get() = null
    val required: Boolean? get() = null
    val hint: String? get() = null

    @Serializable
    @SerialName("single-select")
    data class SingleSelect(
        val label: String,
        val options: List<SingleSelectOption>,
        override val id: String? = null,
        override val required: Boolean? = null,
        override val hint: String? = null,
    ) : Block

    @Serializable
    @SerialName("multi-select")
    data class MultiSelect(
        val label: String,
        val options: List<MultiSelectOption>,
        override val id: String? = null,
        override val required: Boolean? = null,
        override val hint: String? = null,
    ) : Block

    @Serializable
    @SerialName("sequence")
    data class Sequence(
        val label: String,
        val items: List<String>,
        override val id: String? = null,
        override val required: Boolean? = null,
        override val hint: String? = null,
    ) : Block

    @Serializable
    @SerialName("confirmation")
    data class Confirmation(
        val label: String,
        val yesLabel: String,
        val noLabel: String,
        override val id: String? = null,
        override val required: Boolean? = null,
        override val hint: String? = null,
    ) : Block

    @Serializable
    @SerialName("text-input")
    data class TextInput(
        val label: String,
        val multiline: Boolean = false,
        val placeholder: String? = null,
        val prefill: String? = null,
        override val id: String? = null,
        override val required: Boolean? = null,
        override val hint: String? = null,
    ) : Block

    @Serializable
    @SerialName("typed-input")
    data class TypedInput(
        val label: String,
        val format: String,
        val placeholder: String? = null,
        val prefill: String? = null,
        val displayFormat: FormatAnnotation? = null,
        override val id: String? = null,
        override val required: Boolean? = null,
        override val hint: String? = null,
    ) : Block

    @Serializable
    @SerialName("slider")
    data class Slider(
        val label: String,
        val min: Double,
        val max: Double,
        val default: Double,
        val step: Double? = null,
        val displayFormat: FormatAnnotation? = null,
        override val id: String? = null,
        override val required: Boolean? = null,
        override val hint: String? = null,
    ) : Block

    @Serializable
    @SerialName("date")
    data class Date(
        val label: String,
        val default: String,
        override val id: String? = null,
        override val required: Boolean? = null,
        override val hint: String? = null,
    ) : Block

    @Serializable
    @SerialName("time")
    data class Time(
        val label: String,
        val default: String,
        override val id: String? = null,
        override val required: Boolean? = null,
        override val hint: String? = null,
    ) : Block

    @Serializable
    @SerialName("datetime")
    data class Datetime(
        val label: String,
        val default: String,
        override val id: String? = null,
        override val required: Boolean? = null,
        override val hint: String? = null,
    ) : Block

    @Serializable
    @SerialName("file-upload")
    data class FileUpload(
        val label: String,
        val extensions: List<String>? = null,
        override val id: String? = null,
        override val required: Boolean? = null,
        override val hint: String? = null,
    ) : Block

    @Serializable
    @SerialName("image-upload")
    data class ImageUpload(
        val label: String,
        override val id: String? = null,
        override val required: Boolean? = null,
        override val hint: String? = null,
    ) : Block

    @Serializable
    @SerialName("header")
    data class Header(
        val level: Int,
        val text: String,
    ) : Block

    @Serializable
    @SerialName("hint")
    data class Hint(
        val text: String,
    ) : Block

    @Serializable
    @SerialName("divider")
    data class Divider(
        val placeholder: String? = null,
    ) : Block

    @Serializable
    @SerialName("prose")
    data class Prose(
        val text: String,
    ) : Block

    @Serializable
    @SerialName("group")
    data class Group(
        val name: String? = null,
        val children: List<Block>,
    ) : Block
}
