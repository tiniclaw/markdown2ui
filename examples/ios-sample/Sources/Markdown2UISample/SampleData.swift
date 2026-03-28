enum SampleData {

    // MARK: - Hotel Search

    static let hotelSearch = """
    {
      "version": "0.9",
      "blocks": [
        { "type": "header", "level": 1, "text": "Hotel Search" },
        { "type": "prose", "text": "Find the perfect stay for your trip." },
        { "type": "divider" },
        {
          "type": "group",
          "name": "dates",
          "children": [
            {
              "type": "date",
              "id": "checkin",
              "label": "Check-in Date",
              "default": "2026-04-01",
              "required": true
            },
            {
              "type": "date",
              "id": "checkout",
              "label": "Check-out Date",
              "default": "2026-04-05",
              "required": true
            }
          ]
        },
        {
          "type": "slider",
          "id": "budget",
          "label": "Nightly Budget",
          "min": 50000,
          "max": 500000,
          "default": 150000,
          "step": 10000,
          "displayFormat": { "type": "currency", "code": "KRW" }
        },
        {
          "type": "single-select",
          "id": "room_type",
          "label": "Room Type",
          "options": [
            { "text": "Standard", "default": true },
            { "text": "Deluxe", "default": false },
            { "text": "Suite", "default": false }
          ]
        },
        {
          "type": "multi-select",
          "id": "amenities",
          "label": "Amenities",
          "hint": "Select all that apply",
          "options": [
            { "text": "Wi-Fi", "selected": true },
            { "text": "Breakfast", "selected": false },
            { "text": "Pool", "selected": false },
            { "text": "Gym", "selected": false },
            { "text": "Parking", "selected": false }
          ]
        },
        {
          "type": "sequence",
          "id": "priorities",
          "label": "Rank Your Priorities",
          "hint": "Drag to reorder",
          "items": ["Location", "Price", "Reviews", "Amenities"]
        }
      ]
    }
    """

    // MARK: - Bug Report

    static let bugReport = """
    {
      "version": "0.9",
      "blocks": [
        { "type": "header", "level": 1, "text": "Bug Report" },
        { "type": "prose", "text": "Help us squash the bug. Please fill out every required field." },
        { "type": "divider" },
        {
          "type": "text-input",
          "id": "title",
          "label": "Bug Title",
          "multiline": false,
          "placeholder": "Short summary of the issue",
          "required": true
        },
        {
          "type": "text-input",
          "id": "steps",
          "label": "Steps to Reproduce",
          "multiline": true,
          "placeholder": "1. Go to ...\\n2. Click on ...\\n3. Observe ...",
          "required": true
        },
        {
          "type": "text-input",
          "id": "expected",
          "label": "Expected Behavior",
          "multiline": true,
          "placeholder": "What should have happened?",
          "required": true
        },
        {
          "type": "single-select",
          "id": "severity",
          "label": "Severity",
          "required": true,
          "options": [
            { "text": "Critical", "default": false },
            { "text": "Major", "default": false },
            { "text": "Minor", "default": true },
            { "text": "Cosmetic", "default": false }
          ]
        },
        {
          "type": "image-upload",
          "id": "screenshot",
          "label": "Screenshot",
          "hint": "Attach a screenshot if possible"
        }
      ]
    }
    """

    // MARK: - Quick Survey

    static let quickSurvey = """
    {
      "version": "0.9",
      "blocks": [
        { "type": "header", "level": 1, "text": "Quick Survey" },
        { "type": "prose", "text": "We value your feedback. This only takes a minute!" },
        { "type": "divider" },
        {
          "type": "typed-input",
          "id": "email",
          "label": "Email Address",
          "format": "email",
          "placeholder": "you@example.com",
          "required": true
        },
        {
          "type": "text-input",
          "id": "feedback",
          "label": "What do you think of the app?",
          "multiline": true,
          "placeholder": "Your thoughts..."
        },
        {
          "type": "slider",
          "id": "rating",
          "label": "Overall Rating",
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
          "id": "newsletter",
          "label": "Subscribe to our newsletter?",
          "yesLabel": "Yes, sign me up",
          "noLabel": "No thanks"
        }
      ]
    }
    """
}
