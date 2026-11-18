//! Image -> HTML -> PDF converter.
//!
//! Pipeline: a document image is sent to a local vision model (via Ollama), which
//! transcribes it into an HTML document. The HTML can be reviewed / edited in the
//! app and is finally printed to PDF with headless Chromium.

use dioxus::prelude::*;

use settings::Settings;
use views::{Convert, Navbar, SettingsPage};

mod ollama;
mod pdf;
mod settings;
mod views;

#[derive(Debug, Clone, Routable, PartialEq)]
#[rustfmt::skip]
enum Route {
    #[layout(Navbar)]
        #[route("/")]
        Convert {},
        #[route("/settings")]
        SettingsPage {},
}

const FAVICON: Asset = asset!("/assets/favicon.ico");
const MAIN_CSS: Asset = asset!("/assets/styling/main.css");

fn main() {
    use dioxus::desktop::{Config, LogicalSize, WindowBuilder};

    let window = WindowBuilder::new()
        .with_title("Image to PDF")
        .with_inner_size(LogicalSize::new(1300.0, 880.0));

    dioxus::LaunchBuilder::desktop()
        .with_cfg(Config::new().with_window(window).with_menu(None))
        .launch(App);
}

#[component]
fn App() -> Element {
    // Settings are shared with every page through the context API.
    use_context_provider(|| Signal::new(Settings::load()));

    rsx! {
        document::Link { rel: "icon", href: FAVICON }
        document::Link { rel: "stylesheet", href: MAIN_CSS }
        Router::<Route> {}
    }
}
