"use strict";

const menu = (browser.menus || browser.contextMenus);

menu.create({
    id: "parent",
    title: "History Shortcuts",
    contexts: ["link", "page", "frame"],
});


// Links
menu.create({
    id: "link-remove-url",
    parentId: "parent",
    title: "...",
    contexts: ["link"],
    onclick: removeLink,
});

menu.create({
    id: "link-domain",
    parentId: "parent",
    title: "...",
    contexts: ["link"],
    onclick: removeDomain,
});


// Page
menu.create({
    id: "page-remove-url",
    parentId: "parent",
    title: "...",
    contexts: ["page"],
    onclick: removePage,
});

menu.create({
    id: "page-domain",
    parentId: "parent",
    title: "...",
    contexts: ["page"],
    onclick: removeDomain,
});


// Frame
menu.create({
    id: "frame-remove-url",
    parentId: "parent",
    title: "...",
    contexts: ["frame"],
    onclick: removePage,
});


// Add
menu.create({
    parentId: "parent",
    type: "separator",
    contexts: ["link", "page"],
});

menu.create({
    id: "link-add-url",
    parentId: "parent",
    title: "...",
    contexts: ["link"],
    onclick: addLink,
});

menu.create({
    id: "page-add-url",
    parentId: "parent",
    title: "...",
    contexts: ["page"],
    onclick: addLink,
});

function resetMenus() {
    menu.update("parent", { visible: true });

    menu.update("link-remove-url", {
        title: "Remove link from history",
        enabled: true
    });
    menu.update("link-domain", {
        title: "Remove all history entries for link site",
        enabled: true
    });
    menu.update("page-remove-url", {
        title: "Remove page from history",
        enabled: true
    });
    menu.update("page-domain", {
        title: "Remove all history entries for page site",
        enabled: true
    });
    menu.update("frame-remove-url", {
        title: "Remove frame from history",
        enabled: true
    });
    menu.update("link-add-url", {
        title: "Add link to history",
        enabled: true
    });
    menu.update("page-add-url", {
        title: "Add page to history",
        enabled: true
    });
}
resetMenus();

function removeLink(info) {
    remove(info.linkUrl, true);
}

function removePage(info) {
    remove(info.frameUrl || info.pageUrl, true);
}

async function removeDomain(info, tab) {
    try {
        const target = new URL(info.linkUrl || info.frameUrl || info.pageUrl).origin;
        if (target == "null")
            return;

        const [confirmed] = await browser.tabs.executeScript(tab.id, {
            code: `confirm("Are you sure you wish to remove all history entries for the site?\\n${target}");`
        });
        if (confirmed)
            remove(target, false);
    } catch (error) {
        console.warn(error);
    }
}

async function remove(target, exact) {
    if (target) {
        const items = await browser.history.search({
            text: target,
            startTime: 0,
            maxResults: 512
        });
        const filtered = exact ? items.filter(i => i.url == target) : items;
        for (const item of filtered) {
            browser.history.deleteUrl({ url: item.url })
                .then(_ => console.log(`Removed history entry: ${item.url}`));
        }
    }
}

async function addLink(info, tab) {
    const target = info.linkUrl || info.pageUrl;
    browser.history.addUrl({
        url: target
    }).then(_ => console.log(`Added history entry: ${target}`));
}


// FF 60+
if (menu.onShown) {
    browser.storage.local.get().then(({ all_urls }) => {
        function setState(enabled) {
            if (enabled)
                menu.onShown.addListener(updateMenu);
            else {
                menu.onShown.removeListener(updateMenu);
                resetMenus();
            }
        }

        async function updateMenu(info) {
            try {
                const link = new URL(info.linkUrl || info.frameUrl || info.pageUrl);
                const exact = (await browser.history.search({ text: link.href, startTime: 0 })).find(h => h.url == link.href);

                let scope = "link";
                if (info.linkUrl);
                else if (info.frameUrl)
                    scope = "frame";
                else if (info.pageUrl)
                    scope = "page";

                menu.update("parent", { visible: true });
                menu.update(`${scope}-remove-url`, {
                    title: `Remove ${scope} from history: ${link.href}`,
                    enabled: !!exact,
                });
                menu.update(`${scope}-add-url`, {
                    title: `Add ${scope} to history: ${link.href}`,
                    enabled: !exact,
                });

                const hist = await browser.history.search({ text: link.origin, startTime: 0, maxResults: 100 });
                menu.update(`${scope}-domain`, {
                    title: `Remove all ${hist.length < 100 ? hist.length : "100+"} history entries for site "${link.origin}"`,
                    enabled: hist.length > 0 || !!exact,
                });
            } catch (error) {
                menu.update("parent", { visible: false });
            }
            menu.refresh();
        }

        setState(all_urls);
        browser.storage.onChanged.addListener(changes => setState(changes.all_urls.newValue));
    });
}
