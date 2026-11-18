use crate::Route;
use dioxus::prelude::*;

const NAVBAR_CSS: Asset = asset!("/assets/styling/navbar.css");

#[component]
pub fn Navbar() -> Element {
    rsx! {
        document::Link { rel: "stylesheet", href: NAVBAR_CSS }

        nav { id: "navbar",
            span { class: "brand", "Image → PDF" }
            Link { to: Route::Convert {}, active_class: "active", "Convert" }
            Link { to: Route::SettingsPage {}, active_class: "active", "Settings" }
        }

        main { id: "content", Outlet::<Route> {} }
    }
}
