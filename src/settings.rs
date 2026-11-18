//! Persistent application settings, stored as JSON in `~/.config/img_to_pdf/settings.json`.

use serde::{Deserialize, Serialize};
use std::path::PathBuf;

pub const DEFAULT_PROMPT: &str = r#"You are an expert image-to-HTML converter agent.
Your task is to analyze the provided image and generate a SINGLE, self-contained HTML file
that faithfully reproduces everything visible in the image.

Follow these rules strictly:

1. **Text Extraction**: Extract ALL text from the image exactly as it appears — every heading,
   paragraph, label, caption, watermark, button text, or any other visible text. Preserve the
   original wording, capitalisation, and punctuation.

2. **Layout & Structure**: Reproduce the spatial layout of the image using modern HTML5 and CSS.
   Use flexbox or CSS grid where appropriate. If the image shows a multi-column layout, cards,
   a navigation bar, a footer, or any other structural element, replicate that structure
   precisely in HTML.

3. **Styling & Design**: Match the visual design as closely as possible:
   - Use the exact (or closest possible) colours for backgrounds, text, borders, and accents.
   - Match font sizes, weights, and styles (bold, italic, etc.).
   - Reproduce rounded corners, shadows, gradients, and spacing.
   - If the image uses a dark or light theme, replicate that theme.

4. **Images & Icons**: If the image contains photographs, illustrations, icons, or logos,
   do NOT use <img> tags or external placeholder URLs under any circumstances, as they cause rendering hangs.
   Instead, replicate them using purely CSS styling (e.g., background colours/shapes), inline SVG code, or Unicode symbols.

5. **Responsiveness**: Make the HTML reasonably responsive so it looks good at different
   viewport widths, but prioritise accuracy over responsiveness.

6. **Output Format**: Return ONLY the raw HTML code starting with <!DOCTYPE html> and ending
   with </html>. Do NOT wrap the output in markdown code fences. Do NOT include any
   explanatory text before or after the HTML."#;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(default)]
pub struct Settings {
    /// Base URL of the local Ollama server.
    pub ollama_url: String,
    /// Ollama model tag of a vision-capable model, e.g. `qwen2.5vl:3b`.
    pub model: String,
    /// Instruction prompt sent with the image.
    pub prompt: String,
    /// Model context window (tokens). Larger = longer documents, more VRAM.
    pub num_ctx: u32,
    /// Sampling temperature. Keep low for faithful transcription.
    pub temperature: f32,
    /// Longest image side (pixels) sent to the model. Bigger images cost more VRAM / time.
    pub max_image_dim: u32,
    /// Chromium / Chrome executable used for HTML -> PDF.
    pub chromium_path: String,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            ollama_url: "http://localhost:11434".into(),
            model: "qwen2.5vl:3b".into(),
            prompt: DEFAULT_PROMPT.into(),
            num_ctx: 8192,
            temperature: 0.1,
            max_image_dim: 1536,
            chromium_path: "chromium".into(),
        }
    }
}

fn settings_path() -> Option<PathBuf> {
    dirs::config_dir().map(|d| d.join("img_to_pdf").join("settings.json"))
}

impl Settings {
    /// Load settings from disk, falling back to defaults on any error.
    pub fn load() -> Self {
        settings_path()
            .and_then(|p| std::fs::read_to_string(p).ok())
            .and_then(|s| serde_json::from_str(&s).ok())
            .unwrap_or_default()
    }

    pub fn save(&self) -> anyhow::Result<PathBuf> {
        let path = settings_path().ok_or_else(|| anyhow::anyhow!("no config directory found"))?;
        if let Some(dir) = path.parent() {
            std::fs::create_dir_all(dir)?;
        }
        std::fs::write(&path, serde_json::to_string_pretty(self)?)?;
        Ok(path)
    }
}
