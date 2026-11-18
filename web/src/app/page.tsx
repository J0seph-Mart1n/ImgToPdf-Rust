"use client";

import React, { useState } from "react";

type SampleId = "invoice" | "lab" | "research";
type OutputTab = "preview" | "source" | "pdf";
type OsTab = "linux" | "macos" | "windows";

interface SampleDoc {
  id: SampleId;
  title: string;
  fileName: string;
  scanSize: string;
  pdfSize: string;
  heading: string;
  subtitle: string;
  rows: { col1: string; col2: string; col3: string }[];
  totalLabel: string;
  totalValue: string;
  note: string;
}

const SAMPLES: Record<SampleId, SampleDoc> = {
  invoice: {
    id: "invoice",
    title: "Engineering Invoice",
    fileName: "scan_invoice_2048.jpg",
    scanSize: "3.8 MB JPEG Scan",
    pdfSize: "42 KB Vector PDF",
    heading: "INVOICE #INV-2026-089",
    subtitle: "Apex Robotics Lab · Issued: Nov 18, 2026 · Net 15",
    rows: [
      { col1: "Embedded Rust Firmware Audit", col2: "24 hrs", col3: "$2,880.00" },
      { col1: "PCB Thermal Imaging & Calibration", col2: "1 unit", col3: "$950.00" },
      { col1: "On-Device Vision Model Quantization", col2: "8 hrs", col3: "$1,120.00" },
    ],
    totalLabel: "Total Due",
    totalValue: "$4,950.00",
    note: "Payment via ACH / Wire. All deliverables verified on local hardware.",
  },
  lab: {
    id: "lab",
    title: "Clinical Lab Report",
    fileName: "pathology_panel_scan.png",
    scanSize: "5.1 MB PNG Scan",
    pdfSize: "56 KB Vector PDF",
    heading: "COMPREHENSIVE METABOLIC PANEL",
    subtitle: "Patient ID: #8841-A · Specimen: Venous Blood · Verified Local OCR",
    rows: [
      { col1: "Fasting Glucose", col2: "89 mg/dL", col3: "Ref: 70 – 99 mg/dL" },
      { col1: "Hemoglobin A1c", col2: "5.2 %", col3: "Ref: 4.0 – 5.6 %" },
      { col1: "TSH (Thyroid Stimulating)", col2: "1.94 mIU/L", col3: "Ref: 0.45 – 4.50 mIU/L" },
    ],
    totalLabel: "Panel Status",
    totalValue: "WITHIN NORMAL LIMITS",
    note: "Processed 100% offline on clinic workstation — zero HIPAA cloud exposure.",
  },
  research: {
    id: "research",
    title: "Academic Benchmark Table",
    fileName: "paper_page4_photo.webp",
    scanSize: "2.9 MB Camera Photo",
    pdfSize: "38 KB Vector PDF",
    heading: "Table 3: Local VLM Document Transcription Accuracy",
    subtitle: "Evaluated on 4 GB Laptop GPU (RTX 3050 Mobile · num_ctx = 8192)",
    rows: [
      { col1: "Qwen2.5-VL 3B (Q4_K_M)", col2: "97.8% ANLS", col3: "2.1 GB VRAM" },
      { col1: "Qwen3-VL 4B (Q4_K_M)", col2: "98.6% ANLS", col3: "2.8 GB VRAM" },
      { col1: "Legacy Tesseract OCR", col2: "74.2% ANLS", col3: "Loses table layout" },
    ],
    totalLabel: "Best Local Balance",
    totalValue: "Qwen2.5-VL 3B / Qwen3-VL 4B",
    note: "HTML5 intermediate representation preserves colspan, rowspan, and CSS Grid.",
  },
};

const OS_COMMANDS: Record<
  OsTab,
  { label: string; badge: string; browserNote: string; commands: string }
> = {
  linux: {
    label: "Linux (Arch / Omarchy / Ubuntu)",
    badge: "WebKitGTK + Chromium",
    browserNote: "Auto-detects /usr/bin/chromium, google-chrome-stable, or brave.",
    commands: `# 1. Install system linker dependency & Ollama
sudo pacman -S xdotool ollama-cuda
sudo systemctl enable --now ollama

# 2. Launch the desktop app (models can be downloaded right inside the UI!)
dx serve --desktop`,
  },
  macos: {
    label: "macOS (Apple Silicon & Intel)",
    badge: "WKWebView + Chrome / Edge",
    browserNote:
      "Auto-detects Google Chrome.app, Chromium.app, Brave Browser.app, or Microsoft Edge.app.",
    commands: `# 1. Install Ollama with Homebrew
brew install --cask ollama
ollama serve &

# 2. Run the native macOS desktop app
dx serve --desktop`,
  },
  windows: {
    label: "Windows 10 & 11 (x64 / ARM64)",
    badge: "WebView2 + Built-in MS Edge",
    browserNote:
      "Uses pre-installed Microsoft Edge (msedge.exe) or Chrome with normalized file:///C:/ URLs.",
    commands: `# 1. Install Ollama via Winget
winget install Ollama.Ollama

# 2. Launch the desktop app (Edge headless PDF printing works out of the box)
dx serve --desktop`,
  },
};

const FAQS = [
  {
    q: "Why convert Image → HTML → PDF instead of directly Image → PDF?",
    a: "Standard image-to-PDF tools simply wrap a blurry raster image inside a PDF container, or use brittle OCR boxes that destroy table borders and multi-column layouts. By converting to semantic HTML5 + CSS first, you get an inspectable, editable document that Chromium renders into a crisp, searchable vector PDF at a fraction of the file size.",
  },
  {
    q: "What if the AI model is not downloaded in Ollama yet?",
    a: "The application automatically checks your local Ollama server on startup and before conversion. If your configured model (such as qwen2.5vl:3b) is missing, an in-app banner lets you download it with one click, displaying a live streaming progress bar (percentage and MB downloaded) right inside the window.",
  },
  {
    q: "Can I customize how a specific image is converted?",
    a: "Yes. In addition to the global base prompt in Settings, the main Convert screen features a dedicated Custom Instructions box where you can pass per-document instructions—such as 'Use a modern sans-serif font', 'Highlight total amounts in blue', or 'Translate headings to English'.",
  },
  {
    q: "Does any document data ever leave my computer?",
    a: "Never. Both the vision model inference (via your local Ollama instance on localhost:11434) and the PDF rendering (via local headless Chromium/Chrome/Edge with an isolated temporary profile) execute 100% offline on your machine.",
  },
  {
    q: "What hardware do I need to run the default model?",
    a: "The default qwen2.5vl:3b model requires roughly 2.5–3.2 GB of VRAM (or unified memory on Apple Silicon / system RAM on CPU fallback) and runs smoothly on an NVIDIA RTX 3050 Mobile (4 GB VRAM) or M1/M2/M3/M4 Mac.",
  },
];

export default function ShowcasePage() {
  const [sampleId, setSampleId] = useState<SampleId>("invoice");
  const [outputTab, setOutputTab] = useState<OutputTab>("preview");
  const [osTab, setOsTab] = useState<OsTab>("linux");
  const [customPrompt, setCustomPrompt] = useState<string>(
    "Use a clean sans-serif font and highlight the total row in blue."
  );
  const [highlightTotals, setHighlightTotals] = useState<boolean>(true);
  const [sansFont, setSansFont] = useState<boolean>(true);
  const [showMissingModelDemo, setShowMissingModelDemo] = useState<boolean>(false);
  const [downloadPct, setDownloadPct] = useState<number>(68);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [copied, setCopied] = useState<boolean>(false);

  const sample = SAMPLES[sampleId];

  const generatedHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @page { size: A4; margin: 15mm; }
    body {
      font-family: ${sansFont ? "'Inter', system-ui, sans-serif" : "Georgia, serif"};
      color: #0f172a;
      line-height: 1.5;
    }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
    th { background: #f1f5f9; }
    .total-row { ${
      highlightTotals
        ? "background: #dbeafe; color: #1d4ed8; font-weight: 700;"
        : "font-weight: 700;"
    } }
  </style>
</head>
<body>
  <h1>${sample.heading}</h1>
  <p>${sample.subtitle}</p>
  <table>
    <thead>
      <tr><th>Item / Metric</th><th>Quantity / Value</th><th>Amount / Reference</th></tr>
    </thead>
    <tbody>
${sample.rows
  .map((r) => `      <tr><td>${r.col1}</td><td>${r.col2}</td><td>${r.col3}</td></tr>`)
  .join("\n")}
      <tr class="total-row">
        <td colspan="2">${sample.totalLabel}</td>
        <td>${sample.totalValue}</td>
      </tr>
    </tbody>
  </table>
  <p><small>${sample.note}</small></p>
</body>
</html>`;

  const copyCommands = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(OS_COMMANDS[osTab].commands);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div>
      {/* Top Navigation */}
      <header className="navbar">
        <div className="container navbar-inner">
          <a href="#" className="brand">
            <span className="brand-icon">DF</span>
            <span>DocForge AI</span>
          </a>
          <nav className="nav-links">
            <a href="#demo">Interactive Demo</a>
            <a href="#features">Features</a>
            <a href="#downloads">Downloads</a>
            <a href="#pricing">Editions</a>
            <a href="#faq">FAQ</a>
          </nav>
          <div style={{ display: "flex", gap: "10px" }}>
            <a href="#downloads" className="btn btn-primary btn-sm">
              Download App
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="pill">
            <span>🦀 Built with Rust + Dioxus 0.7 · 100% Local Ollama Vision AI</span>
          </div>
          <h1>
            Document Images to <span className="gradient-text">Editable HTML & Vector PDF</span> —
            Running 100% on Your Machine
          </h1>
          <p>
            Stop settling for blurry image-wrapped PDFs or cloud OCR that leaks sensitive documents.
            DocForge AI uses local vision models to reconstruct layout, tables, and styling into
            clean HTML5 before rendering print-ready PDFs via headless Chromium.
          </p>
          <div className="hero-actions">
            <a href="#downloads" className="btn btn-primary">
              ⬇ Download for Linux, macOS & Windows
            </a>
            <a href="#demo" className="btn">
              ✨ Try Interactive Pipeline Demo
            </a>
          </div>
          <div className="hero-badges">
            <span>🔒 Zero Cloud API Calls</span>
            <span>📥 Built-in Ollama Model Downloader</span>
            <span>✏️ Live HTML5 Source Editor & Custom Prompts</span>
            <span>🖥️ Native Linux, macOS & Windows</span>
          </div>
        </div>
      </section>

      {/* Interactive 3-Step Pipeline Workbench Demo */}
      <section id="demo">
        <div className="container">
          <div className="section-header">
            <div className="section-tag">Interactive App Preview</div>
            <h2>Experience the Image → HTML → PDF Workbench</h2>
            <p>
              Switch sample documents, test the Custom Instructions prompt box, or preview the
              in-app Ollama model downloader right below.
            </p>
          </div>

          <div className="workbench">
            {/* Simulated Window Titlebar */}
            <div className="workbench-top">
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div className="window-dots">
                  <span className="dot red" />
                  <span className="dot yellow" />
                  <span className="dot green" />
                </div>
                <strong style={{ fontSize: "0.9rem" }}>Image → PDF (Dioxus Desktop)</strong>
              </div>

              <div className="tab-group">
                {(Object.keys(SAMPLES) as SampleId[]).map((id) => (
                  <button
                    key={id}
                    onClick={() => setSampleId(id)}
                    className={`tab-btn ${sampleId === id ? "active" : ""}`}
                  >
                    📄 {SAMPLES[id].title}
                  </button>
                ))}
              </div>

              <button
                className="btn btn-sm"
                onClick={() => setShowMissingModelDemo((v) => !v)}
                style={{
                  borderColor: showMissingModelDemo ? "#f59e0b" : undefined,
                  color: showMissingModelDemo ? "#fcd34d" : undefined,
                }}
              >
                {showMissingModelDemo
                  ? "✓ Hide Model Downloader Banner"
                  : "📥 Preview In-App Model Downloader"}
              </button>
            </div>

            {/* Simulated App Toolbar & Custom Instructions Box */}
            <div className="workbench-controls">
              {showMissingModelDemo && (
                <div
                  style={{
                    padding: "12px 14px",
                    borderRadius: "9px",
                    border: "1px solid #3b6ef5",
                    background: "#16203a",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "10px",
                      fontSize: "0.86rem",
                    }}
                  >
                    <span>
                      🔄 Downloading <code>qwen2.5vl:3b</code> from Ollama: pulling layers (
                      {downloadPct}% — {Math.round((downloadPct / 100) * 3150)} / 3150 MB)
                    </span>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        className="btn btn-sm"
                        onClick={() => setDownloadPct((p) => (p >= 100 ? 25 : Math.min(100, p + 15)))}
                      >
                        Simulate Progress ({downloadPct}%)
                      </button>
                    </div>
                  </div>
                  <div
                    style={{
                      width: "100%",
                      height: "7px",
                      background: "#0f1320",
                      borderRadius: "999px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${downloadPct}%`,
                        height: "100%",
                        background: "#3b6ef5",
                        transition: "width 0.2s ease",
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="control-row">
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "0.84rem", fontWeight: 600 }}>
                    Custom instructions{" "}
                    <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>
                      (appended to the base prompt in Settings)
                    </span>
                  </span>
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button
                    className={`tab-btn ${sansFont ? "active" : ""}`}
                    onClick={() => {
                      setSansFont((v) => !v);
                      setCustomPrompt(
                        !sansFont
                          ? "Use a clean sans-serif font and highlight totals."
                          : "Use classic serif typography for print."
                      );
                    }}
                  >
                    {sansFont ? "✓ Sans-Serif Font" : "Serif Font"}
                  </button>
                  <button
                    className={`tab-btn ${highlightTotals ? "active" : ""}`}
                    onClick={() => setHighlightTotals((v) => !v)}
                  >
                    {highlightTotals ? "✓ Highlight Totals Row" : "Plain Totals Row"}
                  </button>
                </div>
              </div>

              <div className="prompt-bar">
                <span style={{ color: "var(--accent)", fontSize: "0.85rem", fontWeight: 600 }}>
                  Prompt +
                </span>
                <input
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Optional: extra instructions for this conversion..."
                />
                <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                  Model: <code>qwen2.5vl:3b</code>
                </span>
              </div>
            </div>

            {/* Two-Pane Split View */}
            <div className="workbench-grid">
              {/* Left Pane: Source Image */}
              <div className="workbench-pane">
                <div className="pane-title">
                  <span>Source image · {sample.fileName}</span>
                  <span>{sample.scanSize}</span>
                </div>
                <div className="pane-content">
                  <div className="scan-surface">
                    <div className="scan-page">
                      <h4>{sample.heading}</h4>
                      <p style={{ marginBottom: "10px", opacity: 0.8 }}>{sample.subtitle}</p>
                      <table className="scan-table">
                        <thead>
                          <tr>
                            <th>Description</th>
                            <th>Value</th>
                            <th>Notes / Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sample.rows.map((r, idx) => (
                            <tr key={idx}>
                              <td>{r.col1}</td>
                              <td>{r.col2}</td>
                              <td>{r.col3}</td>
                            </tr>
                          ))}
                          <tr>
                            <td colSpan={2}>
                              <strong>{sample.totalLabel}</strong>
                            </td>
                            <td>
                              <strong>{sample.totalValue}</strong>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                      <p style={{ fontSize: "0.74rem", opacity: 0.75 }}>{sample.note}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Pane: HTML Preview / HTML Source / Vector PDF */}
              <div className="workbench-pane">
                <div className="pane-title">
                  <div className="tab-group">
                    <button
                      className={`tab-btn ${outputTab === "preview" ? "active" : ""}`}
                      onClick={() => setOutputTab("preview")}
                    >
                      1. Live HTML Preview
                    </button>
                    <button
                      className={`tab-btn ${outputTab === "source" ? "active" : ""}`}
                      onClick={() => setOutputTab("source")}
                    >
                      2. Editable HTML5 Source
                    </button>
                    <button
                      className={`tab-btn ${outputTab === "pdf" ? "active" : ""}`}
                      onClick={() => setOutputTab("pdf")}
                    >
                      3. Final Vector PDF ({sample.pdfSize})
                    </button>
                  </div>
                </div>

                <div className="pane-content">
                  {outputTab === "source" ? (
                    <pre className="code-view">{generatedHtml}</pre>
                  ) : (
                    <div className={`pdf-sheet ${sansFont ? "accent-theme" : "serif-theme"}`}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "10px",
                          paddingBottom: "8px",
                          borderBottom: "2px solid #e2e8f0",
                        }}
                      >
                        <div>
                          <h3>{sample.heading}</h3>
                          <p style={{ color: "#475569", fontSize: "0.82rem" }}>{sample.subtitle}</p>
                        </div>
                        {outputTab === "pdf" && (
                          <span
                            style={{
                              background: "#dcfce7",
                              color: "#166534",
                              fontSize: "0.74rem",
                              fontWeight: 700,
                              padding: "4px 9px",
                              borderRadius: "999px",
                            }}
                          >
                            ✓ A4 Print-Ready PDF · {sample.pdfSize}
                          </span>
                        )}
                      </div>

                      <table>
                        <thead>
                          <tr>
                            <th>Item / Metric</th>
                            <th>Quantity / Value</th>
                            <th>Amount / Reference</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sample.rows.map((r, idx) => (
                            <tr key={idx}>
                              <td>{r.col1}</td>
                              <td>{r.col2}</td>
                              <td>{r.col3}</td>
                            </tr>
                          ))}
                          <tr className={highlightTotals ? "highlight-total" : ""}>
                            <td colSpan={2}>{sample.totalLabel}</td>
                            <td>{sample.totalValue}</td>
                          </tr>
                        </tbody>
                      </table>
                      <p style={{ color: "#64748b", fontSize: "0.78rem" }}>{sample.note}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section id="features">
        <div className="container">
          <div className="section-header">
            <div className="section-tag">Why DocForge AI</div>
            <h2>Engineered for Accuracy, Privacy & Control</h2>
            <p>
              Every stage of the pipeline is transparent and inspectable—no black-box PDF blobs and
              no external SaaS subscriptions required.
            </p>
          </div>

          <div className="grid-3">
            <div className="card">
              <div className="card-icon">🧠</div>
              <h3>Local Vision AI via Ollama</h3>
              <p>
                Uses vision-language models like <code>qwen2.5vl:3b</code> or{" "}
                <code>qwen3-vl:4b</code> on your own GPU or CPU. Automatic Lanczos3 downscaling
                keeps VRAM usage well within 4 GB laptop GPUs.
              </p>
            </div>

            <div className="card">
              <div className="card-icon">📥</div>
              <h3>In-App Model Downloader</h3>
              <p>
                No terminal required to fetch models. If your selected model isn&apos;t installed in
                Ollama yet, download it directly inside the app with a live streaming progress bar.
              </p>
            </div>

            <div className="card">
              <div className="card-icon">✍️</div>
              <h3>Per-Image Custom Prompt Box</h3>
              <p>
                Pass custom instructions on the Convert screen to restyle fonts, highlight specific
                fields, translate text, or adapt layout rules while preserving strict HTML5 output.
              </p>
            </div>

            <div className="card">
              <div className="card-icon">🧩</div>
              <h3>Editable HTML5 Intermediate</h3>
              <p>
                Fix a typo, adjust a table cell, or tweak CSS styling in the built-in HTML source
                editor with instant live preview before generating the final PDF.
              </p>
            </div>

            <div className="card">
              <div className="card-icon">🖨️</div>
              <h3>Headless Chromium / Edge PDF Engine</h3>
              <p>
                Full support for CSS Grid, Flexbox, and <code>@page</code> print media rules. Uses
                an isolated temporary browser profile so it never conflicts with open browser tabs.
              </p>
            </div>

            <div className="card">
              <div className="card-icon">⚡</div>
              <h3>Pure Rust & Dioxus 0.7 Desktop</h3>
              <p>
                Native performance without Electron bloat. Runs seamlessly across Linux, macOS, and
                Windows with automatic browser path detection and native OS file dialogs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Cross-Platform Downloads & Setup Guide */}
      <section id="downloads">
        <div className="container">
          <div className="section-header">
            <div className="section-tag">Cross-Platform Support</div>
            <h2>Run Natively on Linux, macOS & Windows</h2>
            <p>
              Automatically detects Chromium, Google Chrome, Brave, or pre-installed Microsoft Edge
              on your operating system.
            </p>
          </div>

          <div
            className="card"
            style={{ maxWidth: "900px", margin: "0 auto", gap: "18px", padding: "28px" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <div className="tab-group">
                {(["linux", "macos", "windows"] as OsTab[]).map((os) => (
                  <button
                    key={os}
                    className={`tab-btn ${osTab === os ? "active" : ""}`}
                    onClick={() => setOsTab(os)}
                  >
                    {os === "linux" && "🐧 Linux"}
                    {os === "macos" && "🍎 macOS"}
                    {os === "windows" && "🪟 Windows"}
                  </button>
                ))}
              </div>
              <span className="pill" style={{ marginBottom: 0 }}>
                {OS_COMMANDS[osTab].badge}
              </span>
            </div>

            <div>
              <h3 style={{ marginBottom: "4px" }}>{OS_COMMANDS[osTab].label}</h3>
              <p>{OS_COMMANDS[osTab].browserNote}</p>
            </div>

            <div style={{ position: "relative" }}>
              <pre className="terminal-box">{OS_COMMANDS[osTab].commands}</pre>
              <button
                onClick={copyCommands}
                className="btn btn-sm"
                style={{ position: "absolute", top: "12px", right: "12px" }}
              >
                {copied ? "✓ Copied" : "Copy Commands"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing / Edition Comparison */}
      <section id="pricing">
        <div className="container">
          <div className="section-header">
            <div className="section-tag">Editions</div>
            <h2>Free Local App Forever — Optional Pro Workflows</h2>
            <p>
              Run the complete desktop converter free and open-source on your own hardware, or
              upgrade for batch automation and team server deployments.
            </p>
          </div>

          <div className="grid-3">
            <div className="card pricing-card">
              <h3>Community Local</h3>
              <div className="price">
                $0 <span>/ forever</span>
              </div>
              <p>Complete desktop application running on your local Ollama instance.</p>
              <ul className="feature-list">
                <li>✓ Unlimited local Image → HTML → PDF conversions</li>
                <li>✓ In-app Ollama model checker & streaming downloader</li>
                <li>✓ Custom per-image instructions prompt box</li>
                <li>✓ Live HTML preview & source code editor</li>
                <li>✓ Linux, macOS & Windows support</li>
              </ul>
              <a href="#downloads" className="btn">
                Download Free Edition
              </a>
            </div>

            <div className="card pricing-card featured">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h3>Pro Workstation</h3>
                <span className="pill" style={{ marginBottom: 0 }}>
                  Most Popular
                </span>
              </div>
              <div className="price">
                $19 <span>/ one-time license</span>
              </div>
              <p>Built for power users processing multi-page binders, receipts, and archives.</p>
              <ul className="feature-list">
                <li>✓ Everything in Community Local</li>
                <li>✓ Multi-image batch queue → single merged PDF</li>
                <li>✓ Hot-folder watcher for automatic scanner ingestion</li>
                <li>✓ Custom CSS print templates (A4, Letter, Legal, Invoice)</li>
                <li>✓ Bundled zero-config sidecar inference engine</li>
              </ul>
              <a href="#downloads" className="btn btn-primary">
                Get Pro Workstation
              </a>
            </div>

            <div className="card pricing-card">
              <h3>Team Self-Hosted</h3>
              <div className="price">
                $49 <span>/ month per server</span>
              </div>
              <p>Deploy on an internal LAN GPU server for clinics, law firms, and engineering teams.</p>
              <ul className="feature-list">
                <li>✓ Shared LAN Ollama GPU cluster scheduling</li>
                <li>✓ REST API & webhook document pipeline</li>
                <li>✓ Role-based prompt & stylesheet presets</li>
                <li>✓ Air-gapped deployment & compliance audit logs</li>
                <li>✓ Priority engineering support</li>
              </ul>
              <a href="#downloads" className="btn">
                Contact for Team License
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq">
        <div className="container">
          <div className="section-header">
            <div className="section-tag">FAQ</div>
            <h2>Frequently Asked Questions</h2>
            <p>Everything you need to know about the local Image → HTML → PDF architecture.</p>
          </div>

          <div className="faq-list">
            {FAQS.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="faq-item">
                  <button
                    className="faq-q"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                  >
                    <span>{item.q}</span>
                    <span style={{ color: "var(--accent)", fontSize: "1.2rem" }}>
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>
                  {isOpen && <div className="faq-a">{item.a}</div>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>
            DocForge AI · Built with Rust, Dioxus 0.7, Ollama Vision Models & Headless Chromium ·
            Runs 100% Locally on Linux, macOS & Windows
          </p>
        </div>
      </footer>
    </div>
  );
}
