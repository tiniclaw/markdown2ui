package com.markdown2ui.sample

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.markdown2ui.Ast
import com.markdown2ui.Markdown2UI
import kotlinx.serialization.json.Json

class MainActivity : ComponentActivity() {

    private val json = Json { ignoreUnknownKeys = true }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background,
                ) {
                    SampleApp()
                }
            }
        }
    }

    @Composable
    private fun SampleApp() {
        val tabs = listOf("Hotel Search", "Bug Report", "Quick Survey")
        val astStrings = listOf(
            SampleData.HOTEL_SEARCH,
            SampleData.BUG_REPORT,
            SampleData.QUICK_SURVEY,
        )

        var selectedTab by remember { mutableIntStateOf(0) }
        var submissionResult by remember { mutableStateOf<String?>(null) }

        val ast = remember(selectedTab) {
            json.decodeFromString<Ast>(astStrings[selectedTab])
        }

        Scaffold(
            topBar = {
                Column {
                    Text(
                        text = "markdown2ui Sample",
                        style = MaterialTheme.typography.titleLarge,
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp),
                    )
                    TabRow(selectedTabIndex = selectedTab) {
                        tabs.forEachIndexed { index, title ->
                            Tab(
                                selected = selectedTab == index,
                                onClick = { selectedTab = index },
                                text = { Text(title, maxLines = 1) },
                            )
                        }
                    }
                }
            },
        ) { innerPadding ->
            Markdown2UI(
                ast = ast,
                onSubmit = { result -> submissionResult = result },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(innerPadding),
            )
        }

        if (submissionResult != null) {
            AlertDialog(
                onDismissRequest = { submissionResult = null },
                title = { Text("Submission Result") },
                text = {
                    Text(
                        text = formatJson(submissionResult!!),
                        fontFamily = FontFamily.Monospace,
                        fontSize = 13.sp,
                    )
                },
                confirmButton = {
                    TextButton(onClick = { submissionResult = null }) {
                        Text("OK")
                    }
                },
            )
        }
    }

    /** Pretty-print a compact JSON string for readability in the dialog. */
    private fun formatJson(raw: String): String {
        return try {
            val element = json.parseToJsonElement(raw)
            Json { prettyPrint = true }.encodeToString(
                kotlinx.serialization.json.JsonElement.serializer(),
                element,
            )
        } catch (_: Exception) {
            raw
        }
    }
}
