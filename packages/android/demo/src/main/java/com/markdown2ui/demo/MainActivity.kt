package com.markdown2ui.demo

import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.WebView
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.AssistChip
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.Button
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.markdown2ui.Ast
import com.markdown2ui.Markdown2UI
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

@Serializable
data class DemoExample(
    val id: String,
    val title: String,
    val markup: String,
    val ast: Ast,
)

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        val examplesJson = resources.openRawResource(R.raw.examples)
            .bufferedReader().use { it.readText() }
        val parserJs = resources.openRawResource(R.raw.parser)
            .bufferedReader().use { it.readText() }

        val json = Json { ignoreUnknownKeys = true }
        val examples = json.decodeFromString<List<DemoExample>>(examplesJson)

        setContent {
            AppTheme {
                MainScreen(examples = examples, parserJs = parserJs)
            }
        }
    }
}

@Composable
private fun AppTheme(content: @Composable () -> Unit) {
    val dark = isSystemInDarkTheme()
    val context = LocalContext.current
    val colors = when {
        android.os.Build.VERSION.SDK_INT >= 31 ->
            if (dark) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        dark -> darkColorScheme()
        else -> lightColorScheme()
    }
    MaterialTheme(colorScheme = colors, content = content)
}

// MARK: - JS Parser Bridge (WebView)

class ParserBridge(private val parserJs: String) {
    private var webView: WebView? = null
    private var callback: ((String) -> Unit)? = null
    private var ready = false

    fun attach(webView: WebView) {
        this.webView = webView
        webView.settings.javaScriptEnabled = true
        webView.addJavascriptInterface(object {
            @JavascriptInterface
            fun onResult(json: String) {
                callback?.invoke(json)
            }
        }, "Android")
        webView.loadDataWithBaseURL(null, "<html><body><script>$parserJs</script></body></html>", "text/html", "utf-8", null)
        ready = true
    }

    fun parse(markup: String, onResult: (String) -> Unit) {
        if (!ready) { onResult("{}"); return }
        callback = onResult
        val escaped = markup
            .replace("\\", "\\\\")
            .replace("`", "\\`")
            .replace("\$", "\\\$")
        webView?.evaluateJavascript(
            "try { Android.onResult(parseMarkdown(`$escaped`)); } catch(e) { Android.onResult('{}'); }",
            null,
        )
    }

    fun detach() {
        webView = null
        ready = false
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun MainScreen(examples: List<DemoExample>, parserJs: String) {
    var selectedTab by rememberSaveable { mutableIntStateOf(0) }
    var customAst by remember { mutableStateOf<Ast?>(null) }
    var customMarkup by rememberSaveable { mutableStateOf("") }

    Scaffold(
        bottomBar = {
            NavigationBar {
                NavigationBarItem(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    icon = { Icon(painterResource(android.R.drawable.ic_menu_edit), contentDescription = null) },
                    label = { Text("Editor") },
                )
                NavigationBarItem(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    icon = { Icon(painterResource(android.R.drawable.ic_menu_gallery), contentDescription = null) },
                    label = { Text("Showcase") },
                )
            }
        },
    ) { padding ->
        when (selectedTab) {
            0 -> EditorTab(
                examples = examples,
                parserJs = parserJs,
                onUpdate = { markup, ast ->
                    customMarkup = markup
                    customAst = ast
                },
                modifier = Modifier.padding(padding),
            )
            1 -> ShowcaseTab(
                examples = examples,
                customAst = customAst,
                customMarkup = customMarkup,
                modifier = Modifier.padding(padding),
            )
        }
    }
}

private val jsonParser = Json { ignoreUnknownKeys = true }

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun EditorTab(
    examples: List<DemoExample>,
    parserJs: String,
    onUpdate: (String, Ast?) -> Unit,
    modifier: Modifier = Modifier,
) {
    var markup by rememberSaveable { mutableStateOf(examples.firstOrNull()?.markup ?: "") }
    var astJson by remember { mutableStateOf("") }
    var result by remember { mutableStateOf<String?>(null) }

    val context = LocalContext.current
    val bridge = remember { ParserBridge(parserJs) }

    // Hidden WebView for JS parsing
    val webView = remember { WebView(context).apply { bridge.attach(this) } }
    DisposableEffect(Unit) { onDispose { bridge.detach() } }

    val focusManager = androidx.compose.ui.platform.LocalFocusManager.current

    fun doReparse(text: String = markup) {
        focusManager.clearFocus()
        bridge.parse(text) { json ->
            webView.post {
                astJson = json
                val parsed = try { jsonParser.decodeFromString<Ast>(json) } catch (_: Exception) { null }
                onUpdate(text, parsed)
            }
        }
    }

    // Initial parse
    LaunchedEffect(Unit) { doReparse() }

    val ast = remember(astJson) {
        try { jsonParser.decodeFromString<Ast>(astJson) } catch (_: Exception) { null }
    }

    Column(modifier = modifier.fillMaxSize().imePadding()) {
        TopAppBar(
            title = { Text("markdown2ui") },
            colors = TopAppBarDefaults.topAppBarColors(
                containerColor = MaterialTheme.colorScheme.surfaceContainerLow,
            ),
        )

        // Template chips
        Row(
            modifier = Modifier
                .horizontalScroll(rememberScrollState())
                .padding(horizontal = 12.dp, vertical = 4.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            examples.forEach { ex ->
                AssistChip(
                    onClick = { markup = ex.markup; doReparse(ex.markup) },
                    label = { Text(ex.title, style = MaterialTheme.typography.labelSmall) },
                )
            }
        }

        OutlinedTextField(
            value = markup,
            onValueChange = { markup = it },
            modifier = Modifier
                .fillMaxWidth()
                .height(180.dp)
                .padding(horizontal = 12.dp),
            textStyle = MaterialTheme.typography.bodySmall.copy(
                fontFamily = FontFamily.Monospace,
                fontSize = 11.sp,
                lineHeight = 15.sp,
            ),
            label = { Text("markdown2ui") },
            maxLines = 100,
        )

        Button(
            onClick = { doReparse() },
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 12.dp, vertical = 6.dp),
        ) {
            Text("Update")
        }

        if (ast != null) {
            Markdown2UI(
                ast = ast,
                onSubmit = { result = it },
                modifier = Modifier.weight(1f),
            )
        } else if (astJson.isNotEmpty()) {
            Text(
                "Parse error — check your markup",
                color = MaterialTheme.colorScheme.error,
                style = MaterialTheme.typography.bodySmall,
                modifier = Modifier.padding(horizontal = 16.dp),
            )
        }
    }

    if (result != null) {
        AlertDialog(
            onDismissRequest = { result = null },
            confirmButton = { TextButton(onClick = { result = null }) { Text("OK") } },
            title = { Text("Submitted") },
            text = { Text(result ?: "") },
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ShowcaseTab(
    examples: List<DemoExample>,
    customAst: Ast?,
    customMarkup: String,
    modifier: Modifier = Modifier,
) {
    val customId = "_custom"
    var selectedId by rememberSaveable { mutableStateOf(examples.firstOrNull()?.id ?: "") }
    var result by remember { mutableStateOf<String?>(null) }

    // Auto-select custom when it first appears
    LaunchedEffect(customAst) {
        if (customAst != null) selectedId = customId
    }

    val currentAst: Ast? = if (selectedId == customId) customAst
        else examples.firstOrNull { it.id == selectedId }?.ast

    Column(modifier = modifier.fillMaxSize()) {
        TopAppBar(
            title = { Text("Examples") },
            colors = TopAppBarDefaults.topAppBarColors(
                containerColor = MaterialTheme.colorScheme.surfaceContainerLow,
            ),
        )

        // Example picker chips
        Row(
            modifier = Modifier
                .horizontalScroll(rememberScrollState())
                .padding(horizontal = 12.dp, vertical = 4.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            if (customAst != null) {
                FilterChip(
                    selected = selectedId == customId,
                    onClick = { selectedId = customId },
                    label = { Text("Custom") },
                )
            }
            examples.forEach { ex ->
                FilterChip(
                    selected = selectedId == ex.id,
                    onClick = { selectedId = ex.id },
                    label = { Text(ex.title) },
                )
            }
        }

        if (currentAst != null) {
            Markdown2UI(
                ast = currentAst,
                onSubmit = { result = it },
                modifier = Modifier.weight(1f),
            )
        }
    }

    if (result != null) {
        AlertDialog(
            onDismissRequest = { result = null },
            confirmButton = { TextButton(onClick = { result = null }) { Text("OK") } },
            title = { Text("Submitted") },
            text = { Text(result ?: "") },
        )
    }
}
