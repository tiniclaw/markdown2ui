// markdown2ui parser (bundled)
var module = { exports: {} };
var exports = module.exports;
(function() {
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  normalize: () => normalize,
  parse: () => parse
});
module.exports = __toCommonJS(index_exports);

// src/id.ts
function deriveId(label) {
  let id = label.toLowerCase();
  id = id.replace(/[^\x00-\x7F]/g, "");
  id = id.replace(/[^a-z0-9]/g, "_");
  id = id.replace(/_{2,}/g, "_");
  id = id.replace(/^_|_$/g, "");
  if (id === "" || /^[0-9]/.test(id)) {
    id = "field_" + id;
  }
  return id;
}
function resolveCollisions(ids) {
  const seen = /* @__PURE__ */ new Map();
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    if (id === void 0) continue;
    if (seen.has(id)) {
      const count = seen.get(id) + 1;
      seen.set(id, count);
      ids[i] = `${id}_${count}`;
    } else {
      seen.set(id, 1);
    }
  }
}
function extractIdFromText(text) {
  const idMatch = text.match(/^([a-z][a-z0-9_]*)(!)?\s*:\s+(.+)$/);
  if (idMatch) {
    return {
      id: idMatch[1],
      label: idMatch[3],
      required: idMatch[2] === "!"
    };
  }
  if (text.endsWith("!")) {
    return {
      label: text.slice(0, -1),
      required: true
    };
  }
  return { label: text, required: false };
}

// src/normalize.ts
var CHECKED_CHARS = /* @__PURE__ */ new Set(["x", "X", "v", "V", "*", "\u2713", "\u221A", "\u2714"]);
function normalizeCheckboxContent(char) {
  if (CHECKED_CHARS.has(char)) return "x";
  return " ";
}
function normalizeLine(line) {
  const trimmed = line.trim();
  if (trimmed === "") return "";
  let result = trimmed;
  result = normalizeMarkdownFormatting(result);
  result = normalizeCheckbox(result);
  result = normalizeListMarkers(result);
  result = normalizeMissingSpace(result);
  result = normalizeSequenceDelimiter(result);
  result = normalizeTemporalCase(result);
  result = normalizeConfirmation(result);
  result = normalizeMissingUploadParens(result);
  return result;
}
function normalizeMarkdownFormatting(line) {
  if (/^[-#>?~@!\[{}\d]/.test(line) || line.startsWith("//")) {
    return line;
  }
  let result = line;
  if (result.startsWith("**") && result.endsWith("**") || result.startsWith("__") && result.endsWith("__")) {
    result = result.slice(2, -2);
  } else if (result.startsWith("*") && result.endsWith("*") && !result.startsWith("**") || result.startsWith("_") && result.endsWith("_") && !result.startsWith("__")) {
    result = result.slice(1, -1);
  }
  return result;
}
function normalizeCheckbox(line) {
  const m = line.match(
    /^-\s*[\[(]([xXvV*✓√✔✗✘ ]?)[\])]\s+(.+)$/
  );
  if (m) {
    const checked = normalizeCheckboxContent(m[1]);
    return `- [${checked}] ${m[2]}`;
  }
  const m2 = line.match(
    /^[\[(]([xXvV*✓√✔✗✘ ]?)[\])]\s+(.+)$/
  );
  if (m2 && !m2[2].startsWith("(")) {
    const checked = normalizeCheckboxContent(m2[1]);
    return `- [${checked}] ${m2[2]}`;
  }
  return line;
}
function normalizeListMarkers(line) {
  const m = line.match(/^[*+]\s+(.+)$/);
  if (m) {
    return `- ${m[1]}`;
  }
  const m2 = line.match(/^[*+]([^\s*+].+)$/);
  if (m2) {
    return `- ${m2[1]}`;
  }
  return line;
}
function normalizeMissingSpace(line) {
  if (line.startsWith(">>") && !line.startsWith(">> ") && !line.startsWith(">>!")) {
    return ">> " + line.slice(2);
  }
  if (line.startsWith(">>!") && !line.startsWith(">>! ")) {
    return ">>! " + line.slice(3);
  }
  if (line.startsWith(">") && !line.startsWith(">>") && !line.startsWith("> ") && !line.startsWith(">!")) {
    return "> " + line.slice(1);
  }
  if (line.startsWith(">!") && !line.startsWith(">>") && !line.startsWith(">! ")) {
    return ">! " + line.slice(2);
  }
  if (line.startsWith("-") && !line.startsWith("- ") && !line.startsWith("--") && !line.startsWith("-[") && !line.startsWith("-(")) {
    return "- " + line.slice(1);
  }
  if (line.startsWith("~") && !line.startsWith("~ ")) {
    return "~ " + line.slice(1);
  }
  if (line.startsWith("##") && !line.startsWith("## ") && !line.startsWith("###")) {
    return "## " + line.slice(2);
  }
  if (line.startsWith("#") && !line.startsWith("##") && !line.startsWith("# ")) {
    return "# " + line.slice(1);
  }
  return line;
}
function normalizeSequenceDelimiter(line) {
  const m = line.match(/^(\d+)[):]\s+(.+)$/);
  if (m) {
    return `${m[1]}. ${m[2]}`;
  }
  const m2 = line.match(/^(\d+)[):]([^\s].+)$/);
  if (m2) {
    return `${m2[1]}. ${m2[2]}`;
  }
  return line;
}
function normalizeTemporalCase(line) {
  const m = line.match(/^@(datetime|date|time)(.*)/i);
  if (m) {
    return `@${m[1].toLowerCase()}${m[2]}`;
  }
  return line;
}
function normalizeConfirmation(line) {
  if (line.startsWith("? ") && !line.startsWith("?!")) {
    return "?!" + line.slice(1);
  }
  if (line.startsWith("?") && !line.startsWith("?!") && !line.startsWith("? ")) {
    return "?! " + line.slice(1);
  }
  return line;
}
function normalizeMissingUploadParens(line) {
  const imgMatch = line.match(/^!\[(.+)\]$/);
  if (imgMatch) {
    return `![${imgMatch[1]}]()`;
  }
  const fileMatch = line.match(/^\[(.+)\]$/);
  if (fileMatch) {
    return `[${fileMatch[1]}]()`;
  }
  return line;
}
function normalize(input) {
  return input.split("\n").map((line) => normalizeLine(line)).join("\n");
}

// src/parse.ts
var LEADING_IMAGE_REGEX = /^!\[[^\]]*\]\(([^)]+)\)\s*/;
function extractLeadingImage(text) {
  const m = text.match(LEADING_IMAGE_REGEX);
  if (m) {
    return { image: m[1], text: text.slice(m[0].length) };
  }
  return { text };
}
function matchDivider(line) {
  if (/^-{3,}$/.test(line)) return { type: "divider" };
  return null;
}
function matchHeader(line) {
  const m2 = line.match(/^##\s+(.+)$/);
  if (m2) return { type: "header", level: 2, text: m2[1] };
  const m1 = line.match(/^#\s+(.+)$/);
  if (m1) return { type: "header", level: 1, text: m1[1] };
  return null;
}
function matchHint(line) {
  const m = line.match(/^\/\/\s*(.*)$/);
  if (m) return { type: "hint", text: m[1] };
  return null;
}
function matchImageUpload(line) {
  const m = line.match(/^!\[(.+)\]\(\)$/);
  if (!m) return null;
  let inner = m[1];
  let id;
  let required = false;
  if (inner.startsWith("! ")) {
    required = true;
    inner = inner.slice(2);
  }
  const idMatch = inner.match(/^([a-z][a-z0-9_]*)(!)?\s*:\s+(.+)$/);
  if (idMatch) {
    id = idMatch[1];
    if (idMatch[2] === "!") required = true;
    inner = idMatch[3];
  }
  return { type: "image-upload", id, label: inner, required };
}
function matchMultiSelectOption(line) {
  const m = line.match(/^- \[(x| )\](!)?\s+(.+)$/);
  if (!m) return null;
  const { image, text } = extractLeadingImage(m[3]);
  return {
    type: "multi-select-option",
    text,
    selected: m[1] === "x",
    optionRequired: m[2] === "!",
    image
  };
}
function matchFileUpload(line) {
  const m = line.match(/^\[(.+)\]\(([^)]*)\)$/);
  if (!m) return null;
  const parens = m[2].trim();
  if (parens !== "" && !/^(\.[a-zA-Z0-9]+)(,\s*\.[a-zA-Z0-9]+)*$/.test(parens)) {
    return null;
  }
  let inner = m[1];
  let id;
  let required = false;
  if (inner.startsWith("! ")) {
    required = true;
    inner = inner.slice(2);
  }
  const idMatch = inner.match(/^([a-z][a-z0-9_]*)(!)?\s*:\s+(.+)$/);
  if (idMatch) {
    id = idMatch[1];
    if (idMatch[2] === "!") required = true;
    inner = idMatch[3];
  }
  const extensions = parens ? parens.split(/,\s*/).map((e) => e.trim()) : void 0;
  return { type: "file-upload", id, label: inner, required, extensions };
}
function matchTextInput(line) {
  const m = line.match(/^(>>?)(!)?\s+(.+)$/);
  if (!m) return null;
  const multiline = m[1] === ">>";
  let required = m[2] === "!";
  let rest = m[3];
  let id;
  const idMatch = rest.match(/^([a-z][a-z0-9_]*)(!)?\s*:\s+(.+)$/);
  if (idMatch) {
    id = idMatch[1];
    if (idMatch[2] === "!") required = true;
    rest = idMatch[3];
  }
  let placeholder;
  let prefill;
  const prefillIdx = rest.indexOf(" || ");
  if (prefillIdx !== -1) {
    prefill = rest.slice(prefillIdx + 4).trim();
    rest = rest.slice(0, prefillIdx);
  }
  const placeholderIdx = rest.indexOf(" | ");
  if (placeholderIdx !== -1) {
    placeholder = rest.slice(placeholderIdx + 3).trim();
    rest = rest.slice(0, placeholderIdx);
  }
  const label = rest.trim();
  return { type: "text-input", multiline, id, label, required, placeholder, prefill };
}
function matchConfirmation(line) {
  const m = line.match(/^\?!\s+(.+)$/);
  if (!m) return null;
  let content = m[1];
  let id;
  const idMatch = content.match(/^([a-z][a-z0-9_]*)(!)?\s*:\s+(.+)$/);
  if (idMatch) {
    id = idMatch[1];
    content = idMatch[3];
  }
  const colonIdx = content.lastIndexOf(" : ");
  if (colonIdx >= 0) {
    const qmarkIdx = content.lastIndexOf(" ? ", colonIdx);
    if (qmarkIdx >= 0) {
      const question = content.slice(0, qmarkIdx);
      const yesLabel = content.slice(qmarkIdx + 3, colonIdx);
      const noLabel = content.slice(colonIdx + 3);
      return { type: "confirmation", id, label: question, yesLabel, noLabel };
    }
  }
  return { type: "confirmation", id, label: content, yesLabel: "Yes", noLabel: "No" };
}
function matchSlider(line) {
  const m = line.match(/^~\s+(.+)$/);
  if (!m) return null;
  let rest = m[1];
  let id;
  const idMatch = rest.match(/^([a-z][a-z0-9_]*)(!)?\s*:\s+(.+)$/);
  if (idMatch) {
    id = idMatch[1];
    rest = idMatch[3];
  }
  const formatParsed = parseFormatAnnotation(rest);
  rest = formatParsed.rest;
  const NUM = "\\d+(?:\\.\\d+)?";
  const sliderMatch = rest.match(
    new RegExp(`^(.+?)\\s*\\[(${NUM})\\s*-\\s*(${NUM})\\]\\s*\\((${NUM})\\)(?:\\s*%(${NUM}))?$`)
  );
  if (!sliderMatch) return null;
  return {
    type: "slider",
    id,
    label: sliderMatch[1].trim(),
    min: parseFloat(sliderMatch[2]),
    max: parseFloat(sliderMatch[3]),
    default: parseFloat(sliderMatch[4]),
    step: sliderMatch[5] ? parseFloat(sliderMatch[5]) : void 0,
    displayFormat: formatParsed.format
  };
}
function parseFormatAnnotation(text) {
  const currencyMatch = text.match(/\s+@currency\(([A-Za-z]{3})\)\s*$/);
  if (currencyMatch) {
    return { rest: text.slice(0, currencyMatch.index), format: { type: "currency", code: currencyMatch[1].toUpperCase() } };
  }
  const unitMatch = text.match(/\s+@unit\(([^)]+)\)\s*$/);
  if (unitMatch) {
    const parts = unitMatch[1].split("|");
    const format = { type: "unit", unit: parts[0] };
    if (parts.length > 1) format.plural = parts[1];
    return { rest: text.slice(0, unitMatch.index), format };
  }
  const percentMatch = text.match(/\s+@percent\s*$/);
  if (percentMatch) {
    return { rest: text.slice(0, percentMatch.index), format: { type: "percent" } };
  }
  const intMatch = text.match(/\s+@integer\s*$/);
  if (intMatch) {
    return { rest: text.slice(0, intMatch.index), format: { type: "integer" } };
  }
  const decMatch = text.match(/\s+@decimal\((\d+)\)\s*$/);
  if (decMatch) {
    return { rest: text.slice(0, decMatch.index), format: { type: "decimal", places: parseInt(decMatch[1], 10) } };
  }
  return { rest: text };
}
function matchTypedInput(line) {
  const m = line.match(/^@(email|tel|url|number|password|color)(!)?\s+(.+)$/);
  if (!m) return null;
  const inputFormat = m[1];
  let required = m[2] === "!";
  let rest = m[3];
  let id;
  const idMatch = rest.match(/^([a-z][a-z0-9_]*)(!)?\s*:\s+(.+)$/);
  if (idMatch) {
    id = idMatch[1];
    if (idMatch[2] === "!") required = true;
    rest = idMatch[3];
  }
  let displayFormat;
  if (inputFormat === "number") {
    const parsed = parseFormatAnnotation(rest);
    rest = parsed.rest;
    displayFormat = parsed.format;
  }
  let placeholder;
  let prefill;
  const prefillIdx = rest.indexOf(" || ");
  if (prefillIdx !== -1) {
    prefill = rest.slice(prefillIdx + 4).trim();
    rest = rest.slice(0, prefillIdx);
  }
  const placeholderIdx = rest.indexOf(" | ");
  if (placeholderIdx !== -1) {
    placeholder = rest.slice(placeholderIdx + 3).trim();
    rest = rest.slice(0, placeholderIdx);
  }
  return {
    type: "typed-input",
    format: inputFormat,
    id,
    label: rest.trim(),
    required,
    placeholder,
    prefill,
    displayFormat
  };
}
function matchTemporal(line) {
  const m = line.match(/^@(datetime|date|time)(!)?\s+(.+)$/);
  if (!m) return null;
  const temporalType = m[1];
  let required = m[2] === "!";
  let rest = m[3];
  let id;
  const idMatch = rest.match(/^([a-z][a-z0-9_]*)(!)?\s*:\s+(.+)$/);
  if (idMatch) {
    id = idMatch[1];
    if (idMatch[2] === "!") required = true;
    rest = idMatch[3];
  }
  let defaultValue = "NOW";
  const pipeIdx = rest.indexOf(" | ");
  if (pipeIdx !== -1) {
    defaultValue = rest.slice(pipeIdx + 3).trim();
    rest = rest.slice(0, pipeIdx);
  }
  return {
    type: temporalType,
    id,
    label: rest.trim(),
    required,
    default: defaultValue
  };
}
function matchGroupStart(line) {
  const m = line.match(/^\{\s*(.*)$/);
  if (!m) return null;
  const name = m[1].trim() || void 0;
  return { type: "group-start", name };
}
function matchGroupEnd(line) {
  if (line === "}") return { type: "group-end" };
  return null;
}
function matchSequenceOption(line) {
  const m = line.match(/^\d+\.\s+(.+)$/);
  if (!m) return null;
  return { type: "sequence-option", text: m[1] };
}
function matchSingleSelectOption(line) {
  const m = line.match(/^-\s+(.+)$/);
  if (!m) return null;
  let text = m[1];
  let isDefault = false;
  if (text.endsWith(" (default)")) {
    isDefault = true;
    text = text.slice(0, -" (default)".length);
  }
  const { image, text: cleanText } = extractLeadingImage(text);
  return { type: "single-select-option", text: cleanText, isDefault, image };
}
function matchLabelLine(line, nextLine) {
  if (nextLine === null) return null;
  const isNextSelect = /^-\s+/.test(nextLine) || /^- \[(x| )\]\s+/.test(nextLine) || /^\d+\.\s+/.test(nextLine);
  if (!isNextSelect) return null;
  const info = extractIdFromText(line);
  return {
    type: "label-line",
    id: info.id,
    label: info.label,
    required: info.required
  };
}
function classifyLine(line, nextLine) {
  return matchDivider(line) ?? matchHeader(line) ?? matchHint(line) ?? matchImageUpload(line) ?? matchMultiSelectOption(line) ?? matchFileUpload(line) ?? matchTextInput(line) ?? matchConfirmation(line) ?? matchSlider(line) ?? matchTypedInput(line) ?? matchTemporal(line) ?? matchGroupStart(line) ?? matchGroupEnd(line) ?? matchSequenceOption(line) ?? matchSingleSelectOption(line) ?? matchLabelLine(line, nextLine) ?? { type: "prose", text: line };
}
function tokenize(input) {
  const rawLines = input.split("\n");
  const tokens = [];
  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i].trimEnd();
    if (line.trim() === "") {
      tokens.push({ type: "blank" });
      continue;
    }
    const trimmed = line.trim();
    if (trimmed.startsWith("\\")) {
      const unescaped = trimmed.slice(1);
      tokens.push({ type: "prose", text: unescaped });
      continue;
    }
    let nextLine = null;
    for (let j = i + 1; j < rawLines.length; j++) {
      const candidate = rawLines[j].trim();
      if (candidate !== "") {
        nextLine = candidate;
        break;
      }
    }
    tokens.push(classifyLine(trimmed, nextLine));
  }
  return tokens;
}
function isInteractive(block) {
  return ![
    "header",
    "hint",
    "divider",
    "prose",
    "group"
  ].includes(block.type);
}
function assemble(tokens) {
  const blocks = [];
  let i = 0;
  let pendingLabel = null;
  let groupStack = null;
  function addBlock(block) {
    if (groupStack) {
      groupStack.children.push(block);
    } else {
      blocks.push(block);
    }
  }
  function lastBlock() {
    if (groupStack && groupStack.children.length > 0) {
      return groupStack.children[groupStack.children.length - 1];
    }
    if (blocks.length > 0) {
      return blocks[blocks.length - 1];
    }
    return void 0;
  }
  while (i < tokens.length) {
    const token = tokens[i];
    if (token.type === "blank") {
      pendingLabel = null;
      i++;
      continue;
    }
    if (token.type === "label-line") {
      pendingLabel = { id: token.id, label: token.label, required: token.required };
      i++;
      continue;
    }
    if (token.type === "hint") {
      const prev = lastBlock();
      if (prev && "hint" in prev) {
        prev.hint = prev.hint ? prev.hint + "\n" + token.text : token.text;
      } else if (prev) {
        prev.hint = token.text;
      }
      i++;
      continue;
    }
    if (token.type === "group-start") {
      groupStack = { name: token.name, children: [] };
      i++;
      continue;
    }
    if (token.type === "group-end") {
      if (groupStack) {
        const group = { type: "group", children: groupStack.children };
        if (groupStack.name) group.name = groupStack.name;
        blocks.push(group);
        groupStack = null;
      }
      i++;
      continue;
    }
    if (token.type === "single-select-option") {
      const options = [];
      while (i < tokens.length && tokens[i].type === "single-select-option") {
        const opt = tokens[i];
        const option = { text: opt.text, default: opt.isDefault };
        if (opt.image) option.image = opt.image;
        options.push(option);
        i++;
      }
      if (!options.some((o) => o.default)) {
        options[0].default = true;
      }
      const label = pendingLabel?.label ?? options[0].text;
      const block = {
        type: "single-select",
        id: pendingLabel?.id,
        label,
        options
      };
      if (pendingLabel?.required) block.required = true;
      addBlock(block);
      pendingLabel = null;
      continue;
    }
    if (token.type === "multi-select-option") {
      const options = [];
      while (i < tokens.length && tokens[i].type === "multi-select-option") {
        const opt = tokens[i];
        const option = { text: opt.text, selected: opt.selected };
        if (opt.optionRequired) option.required = true;
        if (opt.image) option.image = opt.image;
        options.push(option);
        i++;
      }
      const label = pendingLabel?.label ?? options[0].text;
      const block = {
        type: "multi-select",
        id: pendingLabel?.id,
        label,
        options
      };
      if (pendingLabel?.required) block.required = true;
      addBlock(block);
      pendingLabel = null;
      continue;
    }
    if (token.type === "sequence-option") {
      const items = [];
      while (i < tokens.length && tokens[i].type === "sequence-option") {
        const opt = tokens[i];
        items.push(opt.text);
        i++;
      }
      const label = pendingLabel?.label ?? items[0];
      const block = {
        type: "sequence",
        id: pendingLabel?.id,
        label,
        items
      };
      addBlock(block);
      pendingLabel = null;
      continue;
    }
    if (token.type === "header") {
      addBlock({ type: "header", level: token.level, text: token.text });
      i++;
      continue;
    }
    if (token.type === "divider") {
      addBlock({ type: "divider" });
      i++;
      continue;
    }
    if (token.type === "prose") {
      addBlock({ type: "prose", text: token.text });
      i++;
      continue;
    }
    if (token.type === "confirmation") {
      const block = {
        type: "confirmation",
        id: token.id,
        label: token.label,
        yesLabel: token.yesLabel,
        noLabel: token.noLabel
      };
      addBlock(block);
      i++;
      continue;
    }
    if (token.type === "text-input") {
      const block = {
        type: "text-input",
        id: token.id,
        label: token.label,
        multiline: token.multiline
      };
      if (token.required) block.required = true;
      if (token.placeholder) block.placeholder = token.placeholder;
      if (token.prefill) block.prefill = token.prefill;
      addBlock(block);
      i++;
      continue;
    }
    if (token.type === "typed-input") {
      const block = {
        type: "typed-input",
        id: token.id,
        label: token.label,
        format: token.format
      };
      if (token.required) block.required = true;
      if (token.placeholder) block.placeholder = token.placeholder;
      if (token.prefill) block.prefill = token.prefill;
      if (token.displayFormat) block.displayFormat = token.displayFormat;
      addBlock(block);
      i++;
      continue;
    }
    if (token.type === "slider") {
      const block = {
        type: "slider",
        id: token.id,
        label: token.label,
        min: token.min,
        max: token.max,
        default: token.default
      };
      if (token.step !== void 0) block.step = token.step;
      if (token.displayFormat) block.displayFormat = token.displayFormat;
      addBlock(block);
      i++;
      continue;
    }
    if (token.type === "date" || token.type === "time" || token.type === "datetime") {
      const block = {
        type: token.type,
        id: token.id,
        label: token.label,
        default: token.default
      };
      if (token.required) block.required = true;
      addBlock(block);
      i++;
      continue;
    }
    if (token.type === "file-upload") {
      const block = {
        type: "file-upload",
        id: token.id,
        label: token.label
      };
      if (token.required) block.required = true;
      if (token.extensions) block.extensions = token.extensions;
      addBlock(block);
      i++;
      continue;
    }
    if (token.type === "image-upload") {
      const block = {
        type: "image-upload",
        id: token.id,
        label: token.label
      };
      if (token.required) block.required = true;
      addBlock(block);
      i++;
      continue;
    }
    i++;
  }
  if (groupStack) {
    const group = { type: "group", children: groupStack.children };
    if (groupStack.name) group.name = groupStack.name;
    blocks.push(group);
  }
  return blocks;
}
function assignIds(blocks) {
  const allBlocks = flattenBlocks(blocks);
  const ids = [];
  const interactiveBlocks = [];
  for (const block of allBlocks) {
    if (isInteractive(block)) {
      if (!block.id) {
        block.id = deriveId(block.label);
      }
      ids.push(block.id);
      interactiveBlocks.push(block);
    }
  }
  resolveCollisions(ids);
  for (let i = 0; i < interactiveBlocks.length; i++) {
    interactiveBlocks[i].id = ids[i];
  }
}
function flattenBlocks(blocks) {
  const result = [];
  for (const block of blocks) {
    if (block.type === "group") {
      result.push(...flattenBlocks(block.children));
    } else {
      result.push(block);
    }
  }
  return result;
}
function cleanBlock(block) {
  for (const key of Object.keys(block)) {
    if (block[key] === void 0) {
      delete block[key];
    }
  }
  if (block.type === "group" && block.children) {
    for (const child of block.children) {
      cleanBlock(child);
    }
  }
}
function parse(input, options) {
  let source = input;
  if (options?.normalize) {
    source = normalize(source);
  }
  const tokens = tokenize(source);
  const blocks = assemble(tokens);
  assignIds(blocks);
  for (const block of blocks) {
    cleanBlock(block);
  }
  return { version: "0.9", blocks };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  normalize,
  parse
});

})();
var m2u_parse = module.exports.parse;
function parseMarkdown(input) {
  return JSON.stringify(m2u_parse(input));
}
