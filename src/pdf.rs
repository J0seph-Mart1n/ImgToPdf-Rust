//! HTML -> PDF conversion using headless Chromium.

use anyhow::{bail, Context, Result};
use std::path::Path;
use std::time::{SystemTime, UNIX_EPOCH};

/// Render `html` to a PDF file at `output` using the given Chromium executable.
pub async fn html_to_pdf(chromium: &str, html: &str, output: &Path) -> Result<()> {
    let stamp = SystemTime::now().duration_since(UNIX_EPOCH)?.as_nanos();
    let work_dir = std::env::temp_dir().join(format!("img_to_pdf-{}-{stamp}", std::process::id()));
    tokio::fs::create_dir_all(&work_dir).await?;
    let html_path = work_dir.join("document.html");
    tokio::fs::write(&html_path, html).await?;

    let result = tokio::process::Command::new(chromium)
        .arg("--headless")
        .arg("--disable-gpu")
        .arg("--no-first-run")
        .arg("--no-pdf-header-footer")
        // Separate profile so it never collides with a running browser instance.
        .arg(format!("--user-data-dir={}", work_dir.join("profile").display()))
        .arg(format!("--print-to-pdf={}", output.display()))
        .arg(format!("file://{}", html_path.display()))
        .output()
        .await
        .with_context(|| format!("failed to start `{chromium}`. Check the Chromium path in Settings"));

    let _ = tokio::fs::remove_dir_all(&work_dir).await;
    let out = result?;

    if !out.status.success() || !output.exists() {
        bail!(
            "Chromium failed ({}): {}",
            out.status,
            String::from_utf8_lossy(&out.stderr).trim()
        );
    }
    Ok(())
}
