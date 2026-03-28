package com.markdown2ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

private fun countConfirmations(blocks: List<Block>): Int =
    blocks.sumOf { block ->
        when (block) {
            is Block.Confirmation -> 1 as Int
            is Block.Group -> countConfirmations(block.children)
            else -> 0 as Int
        }
    }

@Composable
fun Markdown2UI(
    ast: Ast,
    onSubmit: (String) -> Unit = {},
    modifier: Modifier = Modifier,
) {
    val formState = remember {
        FormState().also { it.initializeDefaults(ast.blocks) }
    }
    var errors by remember { mutableStateOf<Map<String, String>>(emptyMap()) }
    val hideSubmit = remember(ast) { countConfirmations(ast.blocks) == 1 }

    val handleSubmit: () -> Unit = {
        val validationErrors = formState.validate(ast.blocks)
        errors = validationErrors
        if (validationErrors.isEmpty()) {
            onSubmit(formState.serializeCompact(ast.blocks))
        }
    }

    LazyColumn(
        modifier = modifier.padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        items(ast.blocks, key = { it.hashCode() }) { block ->
            RenderBlock(block = block, formState = formState, errors = errors, onSubmit = if (hideSubmit) handleSubmit else null)
        }
        if (!hideSubmit) {
            item {
                Spacer(modifier = Modifier.height(8.dp))
                Button(
                    onClick = handleSubmit,
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text("Submit", style = MaterialTheme.typography.labelLarge)
                }
                Spacer(modifier = Modifier.height(16.dp))
            }
        }
    }
}
