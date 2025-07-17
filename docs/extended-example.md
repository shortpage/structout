## Party Music 🎵

A richer schema that turns loose party-planning notes into a structured playlist.

### Prerequisites
1. **Complete Quick Start** - Ensure you've completed the basic example above.
2. **Keep API Keys Ready** - You'll use the same API keys from the quick start.

### Setup & Build Schema

#### Create the Schema Shell
1. Click **New** (blue button).
2. Fill in the schema details:
  - **ID:** `helloWorldOfMusic`
  - **Description:** `Hello World Starter schema for a wedding-party playlist`

#### Add the Root Array `playlist`
1. Click **+** (root level).
2. Configure the field:
  - **Field name:** `playlist`
  - **Type:** Array → Object
  - **AI prompt:** `Party Music Playlist`
3. Click **SAVE**.

#### Define Song-Level Fields
Click the **+** button inside `playlist` to add these child fields:

1. **track**
  - **Type:** String
  - **AI prompt:** `Name of the Track`

2. **position**
  - **Type:** Number
  - **AI prompt:** `Track Position in Playlist`

3. **moods**
  - **Type:** Array → String
  - **AI prompt:** `Max two moods (e.g. Upbeat)`

4. **djprompts**
  - **Type:** Array → Object
  - **AI prompt:** `Time Marker and Shout-out Instructions to the Dancing Guests`

#### Add Sub-fields to `djprompts`
Click the **+** button inside `djprompts` to add:

1. **timemarkersecond**
  - **Type:** Number
  - **AI prompt:** `Second in the song when the prompt fires`

2. **djprompt**
  - **Type:** String
  - **AI prompt:** `Simple DJ prompt (e.g. Hands up!)`

Click **Save** (top bar) to save the complete schema.

### Test Extraction via Code

#### Setup
1. **Download Bundle** - Click the download button in the Generated Schema panel.
2. **Extract & Open** - Unzip the downloaded bundle in your IDE.
3. **Create Input File** - In the `input/` directory, create `helloworldofmusic_content.txt` and paste:
   ```text
   I want to make a playlist for a wedding party.
   A mix of popular and upbeat songs.
   The party is about three hours long.
   The music should guide guests from high energy, 
   down to medium for dinner or mingling, 
   then back up to high energy to close out the night.
   Include both the latest hits and some timeless favorites.
   Plan a 45–60-minute break in the middle for speeches.
   Also emphasis to include these two: 
   "Shut Up and Dance" by Walk the Moon and "Uptown Funk" by Bruno Mars
   ```

4. **Run the extraction**:
   ```bash
   cd anthropic
   python helloworldofmusic_sonnet_main.py
   Master pass‑phrase:
   ```
   *(Provide Master passphrase if prompted)*

### Check Results
Look in the `output/` folder for:
- **`helloworldofmusic_sonnet.json`** - Structured JSON output
- **`helloworldofmusic_sonnet.out`** - Execution log with performance metrics

**Sample JSON Output:**
```json
{
  "playlist": [
    {
      "track": "Can't Stop the Feeling!",
      "position": 1,
      "moods": ["upbeat", "joyful"],
      "djprompts": [
        {
          "timemarkersecond": 45,
          "djprompt": "Everybody clap!"
        }
      ]
    },
    {
      "track": "Uptown Funk",
      "position": 2,
      "moods": ["funky", "party"],
      "djprompts": [
        {
          "timemarkersecond": 30,
          "djprompt": "Move right!"
        },
        {
          "timemarkersecond": 75,
          "djprompt": "Move left!"
        }
      ]
    }
  ]
}
```

**Sample Log Output:**
```text
2025-07-16T15:18:23

-----------------------------------------------
 Provider     : anthropic
 Model        : claude-3-5-sonnet-20240620
 Generated at : 2025-07-16T15:18:23
 Input tokens : 892
 Output tokens: 147
 Exec-time ms : 2341
-----------------------------------------------

{
  "playlist": [
    {
      "track": "Can't Stop the Feeling!",
      "position": 1,
      "moods": ["upbeat", "joyful"],
      "djprompts": [
        {
          "timemarkersecond": 45,
          "djprompt": "Everybody clap!"
        }
      ]
    },
    {
      "track": "Uptown Funk",
      "position": 2,
      "moods": ["funky", "party"],
      "djprompts": [
        {
          "timemarkersecond": 30,
          "djprompt": "Move right!"
        },
        {
          "timemarkersecond": 75,
          "djprompt": "Move left!"
        }
      ]
    }
  ]
}
```

Congrats 🎉 — you've successfully extracted structured playlist data from unstructured party notes!
