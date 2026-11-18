//! Main page: pick an image -> run the model -> edit HTML -> export PDF.

use crate::{
    ollama::{self, PullUpdate},
    pdf,
    settings::Settings,
};
use base64::Engine;
use dioxus::prelude::*;
use std::path::PathBuf;

#[derive(Clone, PartialEq)]
enum Status {
    Idle,
    Busy(String),
    MissingModel(String),
    Downloading(PullUpdate),
    Ok(String),
    Error(String),
}

#[derive(Clone, PartialEq)]
struct LoadedImage {
    path: PathBuf,
    /// Original file bytes.
    bytes: Vec<u8>,
    /// `data:` URL used for the on-screen preview.
    preview: String,
}

#[derive(Clone, Copy, PartialEq)]
enum Tab {
    Preview,
    Source,
}

fn mime_for(path: &PathBuf) -> &'static str {
    match path.extension().and_then(|e| e.to_str()).map(|e| e.to_ascii_lowercase()).as_deref() {
        Some("jpg" | "jpeg") => "image/jpeg",
        Some("webp") => "image/webp",
        Some("bmp") => "image/bmp",
        Some("gif") => "image/gif",
        Some("tif" | "tiff") => "image/tiff",
        _ => "image/png",
    }
}

async fn convert_loaded_image(
    mut cfg: Settings,
    extra_prompt: String,
    img: LoadedImage,
    mut html: Signal<String>,
    mut tab: Signal<Tab>,
    mut status: Signal<Status>,
) {
    let extra = extra_prompt.trim();
    if !extra.is_empty() {
        cfg.prompt = format!(
            "{}\n\nAdditional user instructions / customizations (apply these while still outputting only valid HTML):\n{}",
            cfg.prompt.trim_end(),
            extra
        );
    }

    status.set(Status::Busy(format!(
        "Running {} locally… this can take a few minutes.",
        cfg.model
    )));

    let max_dim = cfg.max_image_dim;
    let prepared =
        tokio::task::spawn_blocking(move || ollama::prepare_image(&img.bytes, max_dim)).await;
    let png = match prepared {
        Ok(Ok(png)) => png,
        Ok(Err(e)) => return status.set(Status::Error(format!("{e:#}"))),
        Err(e) => return status.set(Status::Error(e.to_string())),
    };

    match ollama::image_to_html(&cfg, &png).await {
        Ok(result) => {
            html.set(result);
            tab.set(Tab::Preview);
            status.set(Status::Ok("HTML generated. Review or edit it, then export to PDF.".into()));
        }
        Err(e) => status.set(Status::Error(format!("{e:#}"))),
    }
}

#[component]
pub fn Convert() -> Element {
    let settings = use_context::<Signal<Settings>>();
    let mut image = use_signal(|| None::<LoadedImage>);
    let mut extra_prompt = use_signal(String::new);
    let mut html = use_signal(String::new);
    let mut status = use_signal(|| Status::Idle);
    let mut tab = use_signal(|| Tab::Preview);

    let busy = matches!(status(), Status::Busy(_) | Status::Downloading(_));
    let has_html = !html.read().trim().is_empty();

    // Proactively check whether the configured model is installed in Ollama.
    use_effect(move || {
        let cfg = settings();
        spawn(async move {
            if let Ok(false) = ollama::is_model_installed(&cfg.ollama_url, &cfg.model).await {
                if matches!(status(), Status::Idle | Status::MissingModel(_)) {
                    status.set(Status::MissingModel(cfg.model));
                }
            }
        });
    });

    // --- Actions -----------------------------------------------------------

    let pick_image = move |_| async move {
        let Some(file) = rfd::AsyncFileDialog::new()
            .set_title("Choose a document image")
            .add_filter("Images", &["png", "jpg", "jpeg", "webp", "bmp", "gif", "tif", "tiff"])
            .pick_file()
            .await
        else {
            return;
        };
        let path = file.path().to_path_buf();
        let bytes = file.read().await;
        let preview = format!(
            "data:{};base64,{}",
            mime_for(&path),
            base64::engine::general_purpose::STANDARD.encode(&bytes)
        );
        image.set(Some(LoadedImage { path, bytes, preview }));
        html.set(String::new());
        if !matches!(status(), Status::MissingModel(_)) {
            status.set(Status::Idle);
        }
    };

    let run_model = move |_| async move {
        let Some(img) = image() else { return };
        let cfg = settings();

        status.set(Status::Busy(format!("Checking if `{}` is installed in Ollama…", cfg.model)));
        match ollama::is_model_installed(&cfg.ollama_url, &cfg.model).await {
            Ok(true) => {}
            Ok(false) => {
                status.set(Status::MissingModel(cfg.model));
                return;
            }
            Err(e) => {
                status.set(Status::Error(format!("{e:#}")));
                return;
            }
        }

        convert_loaded_image(cfg, extra_prompt(), img, html, tab, status).await;
    };

    let download_missing_model = move |_| async move {
        let cfg = settings();
        status.set(Status::Downloading(PullUpdate {
            text: format!("Starting download of `{}` from Ollama…", cfg.model),
            percent: Some(0),
        }));

        let pull_res = ollama::pull_model(&cfg.ollama_url, &cfg.model, |update| {
            status.set(Status::Downloading(update));
        })
        .await;

        match pull_res {
            Ok(()) => {
                if let Some(img) = image() {
                    convert_loaded_image(cfg, extra_prompt(), img, html, tab, status).await;
                } else {
                    status.set(Status::Ok(format!(
                        "Model `{}` downloaded and ready. Open an image to convert.",
                        cfg.model
                    )));
                }
            }
            Err(e) => status.set(Status::Error(format!("{e:#}"))),
        }
    };

    let default_name = move |ext: &str| {
        image()
            .and_then(|i| i.path.file_stem().map(|s| s.to_string_lossy().into_owned()))
            .map(|s| format!("{s}.{ext}"))
            .unwrap_or_else(|| format!("document.{ext}"))
    };

    let export_pdf = move |_| async move {
        let Some(file) = rfd::AsyncFileDialog::new()
            .set_title("Save PDF")
            .set_file_name(default_name("pdf"))
            .add_filter("PDF", &["pdf"])
            .save_file()
            .await
        else {
            return;
        };
        let path = file.path().to_path_buf();
        status.set(Status::Busy("Rendering PDF with Chromium…".into()));
        let chromium = settings.read().chromium_path.clone();
        match pdf::html_to_pdf(&chromium, &html(), &path).await {
            Ok(()) => status.set(Status::Ok(format!("Saved {}", path.display()))),
            Err(e) => status.set(Status::Error(format!("{e:#}"))),
        }
    };

    let save_html = move |_| async move {
        let Some(file) = rfd::AsyncFileDialog::new()
            .set_title("Save HTML")
            .set_file_name(default_name("html"))
            .add_filter("HTML", &["html", "htm"])
            .save_file()
            .await
        else {
            return;
        };
        let path = file.path().to_path_buf();
        match tokio::fs::write(&path, html()).await {
            Ok(()) => status.set(Status::Ok(format!("Saved {}", path.display()))),
            Err(e) => status.set(Status::Error(e.to_string())),
        }
    };

    // --- UI ----------------------------------------------------------------

    rsx! {
        div { class: "toolbar",
            button { disabled: busy, onclick: pick_image, "📂 Open image" }
            button {
                class: "primary",
                disabled: busy || image.read().is_none(),
                onclick: run_model,
                "✨ Convert to HTML"
            }
            span { class: "spacer" }
            button { disabled: busy || !has_html, onclick: save_html, "💾 Save HTML" }
            button { class: "primary", disabled: busy || !has_html, onclick: export_pdf, "📄 Export PDF" }
        }

        div { class: "custom-prompt-box",
            div { class: "custom-prompt-header",
                span { "Custom instructions" }
                span { class: "muted", " (appended to the base prompt in Settings)" }
                span { class: "spacer" }
                if !extra_prompt.read().is_empty() {
                    button {
                        class: "btn-small",
                        disabled: busy,
                        onclick: move |_| extra_prompt.set(String::new()),
                        "Clear"
                    }
                }
            }
            textarea {
                class: "custom-prompt-input",
                rows: "2",
                disabled: busy,
                placeholder: "Optional: give additional instructions or styling rules for this conversion (e.g. \"Use a clean sans-serif font\", \"Translate to English\", \"Highlight totals in bold\")…",
                value: "{extra_prompt}",
                oninput: move |e| extra_prompt.set(e.value()),
            }
        }

        match status() {
            Status::Idle => rsx! {},
            Status::Busy(msg) => rsx! {
                div { class: "status busy",
                    span { class: "spinner" }
                    "{msg}"
                }
            },
            Status::MissingModel(model) => rsx! {
                div { class: "status warn",
                    span { "Model `{model}` is not installed in Ollama." }
                    span { class: "spacer" }
                    button {
                        class: "primary",
                        onclick: download_missing_model,
                        if image.read().is_some() {
                            "📥 Download `{model}` & Convert"
                        } else {
                            "📥 Download `{model}`"
                        }
                    }
                }
            },
            Status::Downloading(update) => rsx! {
                div { class: "status busy status-col",
                    div { class: "status-row",
                        span { class: "spinner" }
                        span { "{update.text}" }
                    }
                    if let Some(pct) = update.percent {
                        div { class: "progress-track",
                            div { class: "progress-fill", width: "{pct}%" }
                        }
                    }
                }
            },
            Status::Ok(msg) => rsx! { div { class: "status ok", "{msg}" } },
            Status::Error(msg) => rsx! { div { class: "status error", "{msg}" } },
        }

        div { class: "panes",
            // Left: source image
            section { class: "pane",
                header {
                    "Source image"
                    if let Some(img) = image.read().as_ref() {
                        span { class: "muted", " · {img.path.display()}" }
                    }
                }
                div { class: "pane-body image-body",
                    if let Some(img) = image.read().as_ref() {
                        img { src: "{img.preview}" }
                    } else {
                        div { class: "empty", "Open a scanned page or photo of a document to begin." }
                    }
                }
            }

            // Right: generated HTML
            section { class: "pane",
                header {
                    button {
                        class: if tab() == Tab::Preview { "tab active" } else { "tab" },
                        onclick: move |_| tab.set(Tab::Preview),
                        "Preview"
                    }
                    button {
                        class: if tab() == Tab::Source { "tab active" } else { "tab" },
                        onclick: move |_| tab.set(Tab::Source),
                        "HTML source"
                    }
                }
                div { class: "pane-body",
                    if !has_html {
                        div { class: "empty", "The generated HTML will appear here." }
                    } else if tab() == Tab::Preview {
                        iframe { class: "preview", srcdoc: "{html}" }
                    } else {
                        textarea {
                            class: "editor",
                            spellcheck: false,
                            value: "{html}",
                            oninput: move |e| html.set(e.value()),
                        }
                    }
                }
            }
        }
    }
}
