# Taste (Continuously Learned by [CommandCode][cmd])

[cmd]: https://commandcode.ai/

# database
- Use MongoDB Atlas for database storage. Confidence: 0.50

# code-editor
- New files should always start with the default boilerplate/snippet template, not with the currently written code. Confidence: 0.70
- Show the complete/untruncated question/file name at the top of the main code editor area. Confidence: 0.75
- Save/persist the stdin input text along with code, but do not save the output text. Confidence: 0.65

# workflow
- Clicking "New question" should immediately create an "Untitled" file with boilerplate (no save dialog/popup). The filename should be editable inline via a pencil/edit button in the code editor header. Confidence: 0.75

# ui-styling
- Use the same font as the editor (monospace) across all UI text everywhere. Confidence: 0.65
- The SUMORA watermark must be centered within the code editor area specifically, not across the whole screen. Confidence: 0.70

