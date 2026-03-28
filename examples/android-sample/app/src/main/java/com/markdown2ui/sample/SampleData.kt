package com.markdown2ui.sample

/**
 * Hardcoded AST JSON strings representing three demo forms.
 * These match the exact AST format produced by the markdown2ui parser.
 */
object SampleData {

    val HOTEL_SEARCH = """
    {
      "version": "0.9",
      "blocks": [
        {
          "type": "header",
          "level": 1,
          "text": "Hotel Search"
        },
        {
          "type": "group",
          "name": "dates",
          "children": [
            {
              "type": "date",
              "id": "checkin",
              "label": "Check-in",
              "default": "2026-03-28"
            },
            {
              "type": "date",
              "id": "checkout",
              "label": "Check-out",
              "default": "NOW"
            }
          ]
        },
        {
          "type": "slider",
          "id": "budget",
          "label": "Budget per night",
          "min": 50000,
          "max": 500000,
          "default": 150000,
          "step": 10000,
          "displayFormat": { "type": "currency", "code": "KRW" }
        },
        {
          "type": "single-select",
          "id": "region",
          "label": "Preferred area",
          "options": [
            { "text": "Near Station", "default": false },
            { "text": "Downtown", "default": true },
            { "text": "Airport", "default": false }
          ]
        },
        {
          "type": "multi-select",
          "id": "conditions",
          "label": "Requirements",
          "options": [
            { "text": "Non-smoking", "selected": true },
            { "text": "Breakfast", "selected": false },
            { "text": "Pool", "selected": false }
          ]
        },
        {
          "type": "sequence",
          "id": "priority",
          "label": "Sort by",
          "items": ["Price", "Location", "Reviews"]
        }
      ]
    }
    """.trimIndent()

    val BUG_REPORT = """
    {
      "version": "0.9",
      "blocks": [
        {
          "type": "header",
          "level": 1,
          "text": "Bug Report"
        },
        {
          "type": "text-input",
          "id": "title",
          "label": "Bug title",
          "multiline": false,
          "required": true
        },
        {
          "type": "text-input",
          "id": "steps",
          "label": "Steps to reproduce",
          "multiline": true,
          "required": true
        },
        {
          "type": "single-select",
          "id": "severity",
          "label": "Severity",
          "options": [
            { "text": "Low", "default": false },
            { "text": "Medium", "default": true },
            { "text": "High", "default": false },
            { "text": "Critical", "default": false }
          ]
        },
        {
          "type": "image-upload",
          "id": "screenshot",
          "label": "Screenshot"
        }
      ]
    }
    """.trimIndent()

    val QUICK_SURVEY = """
    {
      "version": "0.9",
      "blocks": [
        {
          "type": "header",
          "level": 1,
          "text": "Quick Survey"
        },
        {
          "type": "typed-input",
          "id": "email_address",
          "label": "Email address",
          "format": "email"
        },
        {
          "type": "text-input",
          "id": "name",
          "label": "Your name",
          "multiline": false,
          "prefill": "John Doe"
        },
        {
          "type": "slider",
          "id": "rating",
          "label": "Overall rating",
          "min": 1,
          "max": 5,
          "default": 3,
          "step": 1,
          "displayFormat": { "type": "unit", "unit": "star", "plural": "stars" }
        },
        {
          "type": "single-select",
          "id": "recommend",
          "label": "Would you recommend us?",
          "options": [
            { "text": "Definitely", "default": false },
            { "text": "Maybe", "default": true },
            { "text": "No", "default": false }
          ]
        },
        {
          "type": "confirmation",
          "id": "submit_confirm",
          "label": "Submit your response?",
          "required": true,
          "yesLabel": "Yes, submit",
          "noLabel": "Not yet"
        }
      ]
    }
    """.trimIndent()
}
