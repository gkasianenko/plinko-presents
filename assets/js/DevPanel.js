import { config, baseConfig, updateSizesBasedOnRows } from "./config.js";

export class DevPanel {
  constructor(gameInstance) {
    this.game = gameInstance;
    this.panel = null;
    this.isVisible = true;

    this.currentSettings = this.getSettingsFromURL();

    this.init();
  }

  init() {
    if (import.meta.env) {
      if (import.meta.env.DEV || import.meta.env.MODE === "development") {
        this.createPanel();
        this.addEventListeners();
        this.addToggleKeyboard();
        this.show();
      }
    }
  }

  getSettingsFromURL() {
    const params = new URLSearchParams(window.location.search);

    return {
      mode: params.get("mode") || (config.autoMode ? "auto" : "click"),
    };
  }

  createPanel() {
    this.panel = document.createElement("div");
    this.panel.className = "dev-panel";
    this.panel.innerHTML = `
            <div class="dev-panel-row">
                <select id="dev-mode-selector">
                    <option value="click" ${
                      this.currentSettings.mode === "click" ? "selected" : ""
                    }>Click</option>
                    <option value="auto" ${
                      this.currentSettings.mode === "auto" ? "selected" : ""
                    }>Auto</option>
                </select>
            </div>
            
            <button id="dev-apply-changes" class="dev-apply-btn">Apply</button>
        `;

    document.body.appendChild(this.panel);
  }

  addEventListeners() {
    const applyBtn = this.panel.querySelector("#dev-apply-changes");
    applyBtn.addEventListener("click", () => this.applyChanges());
  }

  addToggleKeyboard() {
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.altKey && e.key === "d") {
        e.preventDefault();
        this.toggle();
      }
    });
  }

  show() {
    this.isVisible = true;
    if (this.panel) {
      this.panel.style.display = "flex";
    }
  }

  hide() {
    this.isVisible = false;
    if (this.panel) {
      this.panel.style.display = "none";
    }
  }

  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  applyChanges() {
    const modeSelector = document.getElementById("dev-mode-selector");

    const newMode = modeSelector.value;

    const url = new URL(window.location);
    url.searchParams.set("mode", newMode);

    console.log("Applying new mode:", newMode);
    window.location.href = url.toString();
  }

  static getSettingsFromURL() {
    const params = new URLSearchParams(window.location.search);
    let gameMode = "";

    if (import.meta.env) {
      gameMode = import.meta.env.GAME_MODE;
    }

    const settings = {
      mode: params.get("mode") || gameMode || "click",
    };

    console.log("Dev Settings:", settings);
    return settings;
  }

  static applyURLSettings() {
    const settings = DevPanel.getSettingsFromURL();

    // Apply settings to config
    config.autoMode = settings.mode === "auto";

    console.log("Applied URL settings to config:", settings);

    return settings;
  }
}
