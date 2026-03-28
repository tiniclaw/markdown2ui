import React, { useState, useMemo, useCallback } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { parse } from '@markdown2ui/parser';
import type { AST } from '@markdown2ui/parser';
import { FormProvider, useFormState, useValidation } from './src/FormContext';
import { BlockRenderer } from './src/BlockRenderer';
import { styles } from './src/styles';

// ── Demo Markup Strings ──────────────────────────────────────────────────────

const HOTEL_SEARCH = `# Hotel Search

{ date_range
@date checkin: Check-in | 2026-03-26
@date checkout: Check-out
}

~ budget: Budget per night [50000 - 500000] (150000) %10000 @currency(KRW)
// Unit: KRW

region: Preferred area
- Near Sapporo Station
- Susukino (default)
- Near Odori Park

conditions: Requirements
- [x] Non-smoking
- [ ] Breakfast included
- [ ] Large bath

site!: Booking site
- Any cheapest
- Agoda
- Booking.com
- Trip.com

priority: Sort by priority
1. Price
2. Location
3. Reviews
4. Cleanliness

![receipt: Receipt photo]()`;

const BUG_REPORT = `# Bug Report

>! title: Bug title | Describe the bug briefly...

severity!: Severity
- Critical
- High
- Medium (default)
- Low

>>! steps: Steps to reproduce | 1. Go to...

>> expected: Expected behavior | What should happen...

>> actual: Actual behavior | What actually happened...

@url! link: Reproduction URL | https://

{ contact
@email reporter: Your email | you@example.com
@tel phone: Phone number | +1 (555) 000-0000
}

platform!: Platform
- [x] iOS
- [ ] Android
- [ ] Web

[logs: Attach log file](.txt, .log)

?! confirm: Ready to submit? ? Yes, submit : No, go back`;

const QUICK_SURVEY = `# Quick Survey

## About You

> name: Your name | Enter your name...

experience: Years of experience
- Less than 1
- 1-3 years (default)
- 3-5 years
- 5+ years

---

## Feedback

~ rating: Overall satisfaction [1 - 10] (7)

features: Features you use
- [x] Dashboard
- [x] Reports
- [ ] API
- [ ] Integrations
- [ ] Mobile app

>> comments: Additional comments | Anything else you'd like to share...

// Your feedback is anonymous and helps us improve.

?! subscribe: Get updates? ? Yes, notify me : No thanks`;

// ── Demo Definitions ─────────────────────────────────────────────────────────

interface Demo {
  id: string;
  title: string;
  markup: string;
}

const DEMOS: Demo[] = [
  { id: 'hotel', title: 'Hotel Search', markup: HOTEL_SEARCH },
  { id: 'bug', title: 'Bug Report', markup: BUG_REPORT },
  { id: 'survey', title: 'Survey', markup: QUICK_SURVEY },
];

// ── Form Content (needs to be inside FormProvider) ───────────────────────────

function FormContent({ ast, onSubmit }: { ast: AST; onSubmit: (values: Record<string, any>) => void }) {
  const { values } = useFormState();
  const validate = useValidation(ast);

  const handleSubmit = useCallback(() => {
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      const messages = Object.entries(errors)
        .map(([field, msg]) => `${field}: ${msg}`)
        .join('\n');
      Alert.alert('Validation Error', messages);
      return;
    }
    onSubmit(values);
  }, [validate, values, onSubmit]);

  return (
    <>
      {ast.blocks.map((block, i) => (
        <BlockRenderer key={i} block={block} />
      ))}
      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleSubmit}
        activeOpacity={0.8}
      >
        <Text style={styles.submitButtonText}>Submit</Text>
      </TouchableOpacity>
    </>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [selectedDemo, setSelectedDemo] = useState<string>('hotel');

  const currentDemo = DEMOS.find((d) => d.id === selectedDemo)!;

  const ast = useMemo<AST>(() => {
    return parse(currentDemo.markup);
  }, [currentDemo.markup]);

  const handleSubmit = useCallback((values: Record<string, any>) => {
    // Filter out internal keys and format result
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(values)) {
      if (!key.includes('__')) {
        result[key] = value;
      }
    }
    Alert.alert(
      'Submission Result',
      JSON.stringify(result, null, 2),
      [{ text: 'OK' }],
    );
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Title Bar */}
      <View style={styles.titleBar}>
        <Text style={styles.titleText}>markdown2ui</Text>
      </View>

      {/* Segmented Control */}
      <View style={styles.segmentedRow}>
        {DEMOS.map((demo) => {
          const isActive = demo.id === selectedDemo;
          return (
            <TouchableOpacity
              key={demo.id}
              style={[styles.segmentButton, isActive && styles.segmentButtonActive]}
              onPress={() => setSelectedDemo(demo.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.segmentButtonText, isActive && styles.segmentButtonTextActive]}>
                {demo.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Form Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        key={selectedDemo}
      >
        <FormProvider ast={ast} key={selectedDemo}>
          <FormContent ast={ast} onSubmit={handleSubmit} />
        </FormProvider>
      </ScrollView>
    </SafeAreaView>
  );
}
