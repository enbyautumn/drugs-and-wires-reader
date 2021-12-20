let corsProxy = atob('aHR0cHM6Ly9jb3JzLmV2YWV4aXN0cy53b3JrZXJzLmRldi8/dXJsPQ==')

async function request(url) {
    return await fetch(corsProxy + url)
}

function unescapeHTML(string) {
    return string
        .replace(/&#038;/g, '&')
        .replace(/&#8211;/g, '-')
}

function preloadImage(url) {
    let img = new Image()
    let ret = {}

    let promise = () => {
        ret.promise = new Promise((resolve, reject) => {
            img.src = url
            img.onload = () => resolve(true)
            ret.cancel = () => {
                img.src = ""
                resolve(false)
            }
        })
    }

    ret.promise = promise
    return ret
}

// function preload(seek) {
//     let preloadMask = Array.from({length: (2 * seek) + 1}, (v, k) => k - seek).reverse().sort((a,b)=>Math.abs(a)-Math.abs(b)).filter(n=>n)

    
// }

let hoursToMS = (hours) => hours * 60 * 60 * 1000

function setPageNum(pageNum) {
    currentPage = pageNum;
    localStorage.setItem('pageNum', currentPage)
    window.location.hash = pageNum + 1
    document.getElementById("page-input").value = pageNum + 1
}

async function getPageContent(page) {
    if (page.title || page.imageUrl) {
        return true
    }
    let pageContent = await request(page.pageUrl).then(response => response.text())
    page.title = unescapeHTML(pageContent.match(/<h1>([^<]*)<\/h1>/g)[0].replace(/<h1>|<\/h1>/g, ''))
    page.imageUrl = pageContent.match(/src=\"[^\"]*\" class=\"attachment-full size-full/g)[0].match(/https:\/\/www.drugsandwires.fail\/wp-content\/uploads\/[^\"]*/g)[0]
    localStorage.setItem('pageIndex', JSON.stringify(pageIndex))
    return true
}

let currentPage = 0;

if (localStorage.getItem('pageNum') !== null) {
    currentPage = parseInt(localStorage.getItem('pageNum'))
} else if (window.location.hash !== '') {
    currentPage = parseInt(window.location.hash.replace('#', '')) - 1
} else {
    currentPage = 0
}
document.getElementById("page-input").value = currentPage + 1

let pageIndex = JSON.parse(localStorage.getItem('pageIndex')) || []
loadPage(currentPage).then(r => {
    loadIndex().then(() => {
        if (!r) {
            loadPage(currentPage)
        }
    })
})

async function loadIndex() {
    let archive = await request('https://www.drugsandwires.fail/contents/archive/').then(res => res.text())
    let pageUrls = archive.match(/<li><a href='[^']*' class='webcomic-link webcomic1-link self-webcomic-link self-webcomic1-link'>/g)
    pageUrls = pageUrls.map(page => page.match(/https:\/\/www.drugsandwires.fail\/dnwcomic\/[^']*/g)[0])
    let pages = []
    for (let i = 0; i < pageUrls.length; i++) {
        if (pageIndex[i] && (pageIndex[i].title || pageIndex[i].imageUrl)) {
            pages.push(pageIndex[i])
        } else {
            pages.push({
                pageUrl: pageUrls[i],
                title: undefined,
                imageUrl: undefined,
            })
        }
    }
    pageIndex = pages
    localStorage.setItem('pageIndex', JSON.stringify(pageIndex))
    return true
}

async function loadPage(pageNum) {
    if (pageNum < 0 || pageNum >= pageIndex.length) {
        return false
    }
    
    setPageNum(pageNum)
    let page = pageIndex[currentPage]

    if (document.title == page.title && pageNum == currentPage) {
        return true
    }

    if (page.title === undefined || page.imageUrl === undefined) {
        console.log("Fetch " + currentPage)
        await getPageContent(page)
    }

    document.title = page.title
    document.getElementById("content").src = page.imageUrl

    document.getElementById("content").onload = () => {
        
    }

    return true
}

// make aa function for preloading and try to make it cancellable??

window.addEventListener("hashchange", () => {
    if (parseInt(window.location.hash.replace('#', '')) - 1 != currentPage) {
        loadPage(parseInt(window.location.hash.replace('#', '')) - 1)
    }
});

document.getElementById("full-left").addEventListener("click", (e) => {
    loadPage(0)
})

document.getElementById("full-right").addEventListener("click", (e) => {
    loadPage(pageIndex.length - 1)
})

document.getElementById("left").addEventListener("click", (e) => {
    loadPage(currentPage - 1)
})

document.getElementById("right").addEventListener("click", (e) => {
    loadPage(currentPage + 1)
})

document.getElementById("page-input").addEventListener("change", (e) => {
    loadPage(parseInt(e.target.value) - 1)
})

document.addEventListener('swiped-left', function(e) {
    if (window.visualViewport.scale == 1) {
        loadPage(currentPage + 1)
    }
})

document.addEventListener('swiped-right', function(e) {
    if (window.visualViewport.scale == 1) {
        loadPage(currentPage - 1)
    }
})