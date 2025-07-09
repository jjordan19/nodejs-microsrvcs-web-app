// When connecting to a different network, run scripts/get_local_ip.sh to update the private_ip var
var private_ip = '0.0.0.0';

function updateMediaUrls() {
    function replaceSrcAttr(elements, attr) {
        for (let i = 0; i < elements.length; i++) {
            let url = elements[i][attr];
            if (url.includes('localhost:3000')) {
                elements[i][attr] = url.replace('localhost:3000', `${private_ip}:3000`);
            }
        }
    }

    replaceSrcAttr(document.getElementsByTagName('a'), 'href');
    replaceSrcAttr(document.getElementsByTagName('img'), 'src');
    replaceSrcAttr(document.getElementsByTagName('video'), 'src');
}

window.onload = function () {
    function hasTouchSupport() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }

    if (hasTouchSupport()) {
        console.log("Mobile device detected");
        updateMediaUrls();

        // Observe the page for dynamically added elements
        const observer = new MutationObserver(updateMediaUrls);
        observer.observe(document.body, { childList: true, subtree: true });
    } else {
        console.log("Desktop device detected");
    }
};
