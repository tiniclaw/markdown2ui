import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import type {
  Block,
  SingleSelectBlock,
  MultiSelectBlock,
  SequenceBlock,
  ConfirmationBlock,
  TextInputBlock,
  TypedInputBlock,
  SliderBlock,
  DateBlock,
  TimeBlock,
  DatetimeBlock,
  FileUploadBlock,
  ImageUploadBlock,
  HeaderBlock,
  HintBlock,
  DividerBlock,
  ProseBlock,
  GroupBlock,
  FormatAnnotation,
} from '@markdown2ui/parser';
import { useFormState } from './FormContext';
import { styles } from './styles';

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDisplayValue(value: number, fmt?: FormatAnnotation): string {
  if (!fmt) return String(value);
  switch (fmt.type) {
    case 'currency':
      try {
        return new Intl.NumberFormat(undefined, {
          style: 'currency',
          currency: fmt.code,
          maximumFractionDigits: 0,
        }).format(value);
      } catch {
        return `${value} ${fmt.code}`;
      }
    case 'unit':
      if (fmt.plural && value !== 1) return `${value.toLocaleString()} ${fmt.plural}`;
      return `${value.toLocaleString()} ${fmt.unit}`;
    case 'percent':
      return `${value.toLocaleString()}%`;
    case 'integer':
      return Math.round(value).toLocaleString();
    case 'decimal':
      return value.toLocaleString(undefined, {
        minimumFractionDigits: fmt.places,
        maximumFractionDigits: fmt.places,
      });
    default:
      return String(value);
  }
}

const FORMAT_TO_KEYBOARD: Record<string, any> = {
  email: 'email-address',
  tel: 'phone-pad',
  url: 'url',
  number: 'numeric',
  password: 'default',
  color: 'default',
};

// ── Component Renderers ──────────────────────────────────────────────────────

function SingleSelect({ block }: { block: SingleSelectBlock }) {
  const { values, setValue } = useFormState();
  const selected = values[block.id!] as string | undefined;

  return (
    <View style={styles.card}>
      <Text style={styles.label}>{block.label}</Text>
      {block.options.map((opt) => {
        const isSelected = selected === opt.text;
        return (
          <TouchableOpacity
            key={opt.text}
            style={[styles.optionRow, isSelected && styles.optionRowSelected]}
            onPress={() => setValue(block.id!, opt.text)}
            activeOpacity={0.7}
          >
            <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
              {isSelected && <View style={styles.radioDot} />}
            </View>
            <Text style={styles.optionText}>{opt.text}</Text>
          </TouchableOpacity>
        );
      })}
      {block.hint && <Text style={styles.hint}>{block.hint}</Text>}
    </View>
  );
}

function MultiSelect({ block }: { block: MultiSelectBlock }) {
  const { values, setValue } = useFormState();
  const selected = (values[block.id!] as string[]) || [];

  function toggle(text: string) {
    const next = selected.includes(text)
      ? selected.filter((s) => s !== text)
      : [...selected, text];
    setValue(block.id!, next);
  }

  return (
    <View style={styles.card}>
      <Text style={styles.label}>{block.label}</Text>
      {block.options.map((opt) => {
        const isSelected = selected.includes(opt.text);
        return (
          <TouchableOpacity
            key={opt.text}
            style={[styles.optionRow, isSelected && styles.optionRowSelected]}
            onPress={() => toggle(opt.text)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
              {isSelected && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.optionText}>{opt.text}</Text>
          </TouchableOpacity>
        );
      })}
      {block.hint && <Text style={styles.hint}>{block.hint}</Text>}
    </View>
  );
}

function Sequence({ block }: { block: SequenceBlock }) {
  const { values, setValue } = useFormState();
  const items = (values[block.id!] as string[]) || block.items;

  function moveItem(fromIndex: number, toIndex: number) {
    if (toIndex < 0 || toIndex >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setValue(block.id!, next);
  }

  return (
    <View style={styles.card}>
      <Text style={styles.label}>{block.label}</Text>
      {items.map((item, index) => (
        <View key={`${item}-${index}`} style={styles.sequenceItem}>
          <View style={styles.sequenceIndex}>
            <Text style={styles.sequenceIndexText}>{index + 1}</Text>
          </View>
          <Text style={styles.sequenceText}>{item}</Text>
          <View style={styles.sequenceControls}>
            <TouchableOpacity
              style={[styles.arrowButton, index === 0 && styles.arrowButtonDisabled]}
              onPress={() => moveItem(index, index - 1)}
              disabled={index === 0}
              activeOpacity={0.7}
            >
              <Text style={styles.arrowText}>↑</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.arrowButton, index === items.length - 1 && styles.arrowButtonDisabled]}
              onPress={() => moveItem(index, index + 1)}
              disabled={index === items.length - 1}
              activeOpacity={0.7}
            >
              <Text style={styles.arrowText}>↓</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
      {block.hint && <Text style={styles.hint}>{block.hint}</Text>}
    </View>
  );
}

function Confirmation({ block }: { block: ConfirmationBlock }) {
  const { values, setValue } = useFormState();
  const value = values[block.id!] as boolean | undefined;

  return (
    <View style={styles.card}>
      <Text style={styles.confirmationLabel}>{block.label}</Text>
      <View style={styles.confirmationButtons}>
        <TouchableOpacity
          style={[styles.btnSecondary, value === false && styles.btnActive]}
          onPress={() => setValue(block.id!, false)}
          activeOpacity={0.7}
        >
          <Text style={styles.btnSecondaryText}>{block.noLabel}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btnPrimary, value === true && styles.btnActive]}
          onPress={() => setValue(block.id!, true)}
          activeOpacity={0.7}
        >
          <Text style={styles.btnPrimaryText}>{block.yesLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function TextInputField({ block }: { block: TextInputBlock }) {
  const { values, setValue, errors } = useFormState();
  const value = (values[block.id!] as string) ?? block.prefill ?? '';
  const error = errors[block.id!];

  return (
    <View style={styles.card}>
      <Text style={styles.label}>
        {block.label}
        {block.required && <Text style={styles.requiredMark}> *</Text>}
      </Text>
      <TextInput
        style={[
          styles.input,
          block.multiline && styles.inputMultiline,
          error ? styles.inputError : undefined,
        ]}
        placeholder={block.placeholder}
        value={value}
        onChangeText={(text) => setValue(block.id!, text)}
        multiline={block.multiline}
        placeholderTextColor="#999"
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
      {block.hint && <Text style={styles.hint}>{block.hint}</Text>}
    </View>
  );
}

function TypedInputField({ block }: { block: TypedInputBlock }) {
  const { values, setValue, errors } = useFormState();
  const value = (values[block.id!] as string) ?? block.prefill ?? '';
  const error = errors[block.id!];
  const keyboardType = FORMAT_TO_KEYBOARD[block.format] ?? 'default';

  return (
    <View style={styles.card}>
      <Text style={styles.label}>
        {block.label}
        {block.required && <Text style={styles.requiredMark}> *</Text>}
      </Text>
      <TextInput
        style={[styles.input, error ? styles.inputError : undefined]}
        placeholder={block.placeholder}
        value={value}
        onChangeText={(text) => setValue(block.id!, text)}
        keyboardType={keyboardType}
        secureTextEntry={block.format === 'password'}
        autoCapitalize={block.format === 'email' || block.format === 'url' ? 'none' : 'sentences'}
        autoComplete={
          block.format === 'email' ? 'email'
            : block.format === 'tel' ? 'tel'
              : undefined
        }
        placeholderTextColor="#999"
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
      {block.hint && <Text style={styles.hint}>{block.hint}</Text>}
    </View>
  );
}

function SliderField({ block }: { block: SliderBlock }) {
  const { values, setValue } = useFormState();
  const value = (values[block.id!] as number) ?? block.default;
  const step = block.step || 1;
  const fmt = block.displayFormat;

  // Simple slider implementation using TextInput for value since
  // @react-native-community/slider is an extra dependency.
  // Users can type values directly or use +/- buttons.
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{block.label}</Text>
      <View style={styles.sliderContainer}>
        <View style={styles.sliderRow}>
          <TouchableOpacity
            style={styles.arrowButton}
            onPress={() => setValue(block.id!, Math.max(block.min, value - step))}
            disabled={value <= block.min}
            activeOpacity={0.7}
          >
            <Text style={styles.arrowText}>−</Text>
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={styles.sliderValue}>{formatDisplayValue(value, fmt)}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 4 }}>
              <Text style={styles.sliderMinMax}>{formatDisplayValue(block.min, fmt)}</Text>
              <Text style={styles.sliderMinMax}>{formatDisplayValue(block.max, fmt)}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.arrowButton}
            onPress={() => setValue(block.id!, Math.min(block.max, value + step))}
            disabled={value >= block.max}
            activeOpacity={0.7}
          >
            <Text style={styles.arrowText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
      {block.hint && <Text style={styles.hint}>{block.hint}</Text>}
    </View>
  );
}

function DateField({ block }: { block: DateBlock | TimeBlock | DatetimeBlock }) {
  const { values, setValue, errors } = useFormState();
  const value = (values[block.id!] as string) ?? '';
  const error = errors[block.id!];

  const placeholderMap: Record<string, string> = {
    date: 'YYYY-MM-DD',
    time: 'HH:MM',
    datetime: 'YYYY-MM-DDTHH:MM',
  };

  return (
    <View style={styles.card}>
      <Text style={styles.label}>
        {block.label}
        {(block as any).required && <Text style={styles.requiredMark}> *</Text>}
      </Text>
      <TextInput
        style={[styles.input, error ? styles.inputError : undefined]}
        placeholder={placeholderMap[block.type] || 'Enter value'}
        value={value}
        onChangeText={(text) => setValue(block.id!, text)}
        placeholderTextColor="#999"
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
      {(block as any).hint && <Text style={styles.hint}>{(block as any).hint}</Text>}
    </View>
  );
}

function FileUploadField({ block }: { block: FileUploadBlock | ImageUploadBlock }) {
  const isImage = block.type === 'image-upload';
  const extensions = block.type === 'file-upload' ? (block as FileUploadBlock).extensions : undefined;

  return (
    <View style={styles.card}>
      <Text style={styles.label}>
        {block.label}
        {block.required && <Text style={styles.requiredMark}> *</Text>}
      </Text>
      <TouchableOpacity
        style={styles.uploadButton}
        onPress={() => Alert.alert('Upload', `${isImage ? 'Image' : 'File'} picker not implemented in this sample.`)}
        activeOpacity={0.7}
      >
        <Text style={styles.uploadText}>
          {isImage ? '📷 Tap to select image' : '📎 Tap to select file'}
        </Text>
      </TouchableOpacity>
      {extensions && extensions.length > 0 && (
        <Text style={styles.hint}>Accepted: {extensions.join(', ')}</Text>
      )}
      {block.hint && <Text style={styles.hint}>{block.hint}</Text>}
    </View>
  );
}

function Header({ block }: { block: HeaderBlock }) {
  return (
    <Text style={block.level === 1 ? styles.header1 : styles.header2}>
      {block.text}
    </Text>
  );
}

function Hint({ block }: { block: HintBlock }) {
  return <Text style={styles.hint}>{block.text}</Text>;
}

function Divider() {
  return <View style={styles.divider} />;
}

function Prose({ block }: { block: ProseBlock }) {
  return <Text style={styles.prose}>{block.text}</Text>;
}

function Group({ block }: { block: GroupBlock }) {
  return (
    <View style={styles.group}>
      {block.children.map((child, i) => (
        <View key={i} style={styles.groupChild}>
          <BlockRenderer block={child} />
        </View>
      ))}
    </View>
  );
}

// ── Main BlockRenderer ───────────────────────────────────────────────────────

export function BlockRenderer({ block }: { block: Block }) {
  switch (block.type) {
    case 'single-select':
      return <SingleSelect block={block} />;
    case 'multi-select':
      return <MultiSelect block={block} />;
    case 'sequence':
      return <Sequence block={block} />;
    case 'confirmation':
      return <Confirmation block={block} />;
    case 'text-input':
      return <TextInputField block={block} />;
    case 'typed-input':
      return <TypedInputField block={block} />;
    case 'slider':
      return <SliderField block={block} />;
    case 'date':
    case 'time':
    case 'datetime':
      return <DateField block={block} />;
    case 'file-upload':
    case 'image-upload':
      return <FileUploadField block={block} />;
    case 'header':
      return <Header block={block} />;
    case 'hint':
      return <Hint block={block} />;
    case 'divider':
      return <Divider />;
    case 'prose':
      return <Prose block={block} />;
    case 'group':
      return <Group block={block} />;
    default:
      return null;
  }
}
