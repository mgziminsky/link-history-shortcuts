"use strict";

(async () => {

    const perms = { origins: browser.runtime.getManifest().optional_permissions };
    const all_urls = document.getElementById("all_urls");

    if (browser.contextMenus.onShown) {
        let { all_urls: enabled = false } = await browser.storage.local.get();
        all_urls.disabled = false;
        all_urls.textContent = enabled ? "Disable" : "Enable";
        all_urls.addEventListener("click", async ev => {
            if (enabled) {
                browser.permissions.remove(perms);
                browser.storage.local.clear();
                enabled = false;
            } else {
                enabled = await browser.permissions.request(perms);
                browser.storage.local.set({ all_urls: enabled });
            }
            all_urls.textContent = enabled ? "Disable" : "Enable";
        });
    }

})();
