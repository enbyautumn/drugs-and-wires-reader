let corsProxy = atob('aHR0cHM6Ly9jb3JzLmV2YWV4aXN0cy53b3JrZXJzLmRldi8/dXJsPQ==')

async function request(url) {
    return await fetch(corsProxy + url)
}

function unescapeHTML(string) {
    return string.replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&#8217;/g, "'")
        .replace(/&#8220;/g, '"')
        .replace(/&#8221;/g, '"')
        .replace(/&#8211;/g, '-')
        .replace(/&#8230;/g, '...')
        .replace(/&#8242;/g, '"')
        .replace(/&#8243;/g, '"')
        .replace(/&#8216;/g, "'")
        .replace(/&#8212;/g, '--')
        .replace(/&#8224;/g, '"')
        .replace(/&#8225;/g, '"')
        .replace(/&#8226;/g, '"')
        .replace(/&#8230;/g, '...')
        .replace(/&#8212;/g, '--')
        .replace(/&#8240;/g, '"')
        .replace(/&#8242;/g, '"')
        .replace(/&#8243;/g, '"')
        .replace(/&#8216;/g, "'")
        .replace(/&#8217;/g, "'")
        .replace(/&#8218;/g, "'")
        .replace(/&#8219;/g, "'")
        .replace(/&#8220;/g, '"')
        .replace(/&#8221;/g, '"')
        .replace(/&#8222;/g, '"')
        .replace(/&#8223;/g, '"')
        .replace(/&#038;/g, '&')
}

let hoursToMS = (hours) => hours * 60 * 60 * 1000

function getPageNum() {
    let pageNum = parseInt(window.location.hash.replace('#', '')) - 1
    return pageNum
}

function setPageNum(pageNum) {
    localStorage.setItem('pageNum', currentPage)
    window.location.hash = pageNum + 1
    document.getElementById("page-input").value = pageNum + 1
}

async function getPageContent(page) {
    let pageContent = await request(page.pageUrl).then(response => response.text())
    page.title = unescapeHTML(pageContent.match(/<h1>([^<]*)<\/h1>/g)[0].replace(/<h1>|<\/h1>/g, ''))
    page.imageUrl = pageContent.match(/src=\"[^\"]*\" class=\"attachment-full size-full/g)[0].match(/https:\/\/www.drugsandwires.fail\/wp-content\/uploads\/[^\"]*/g)[0]

}

let currentPage = parseInt(localStorage.getItem('pageNum')) > 0 ? parseInt(localStorage.getItem('pageNum')) : getPageNum() > 0 ? getPageNum() : 0;
console.log(currentPage)
setPageNum(currentPage)

async function loadIndex() {

    let archive = await request('https://www.drugsandwires.fail/contents/archive/').then(res => res.text())

    let pageUrls = archive.match(/<li><a href='[^']*' class='webcomic-link webcomic1-link self-webcomic-link self-webcomic1-link'>/g)

    pageUrls = pageUrls.map(page => page.match(/https:\/\/www.drugsandwires.fail\/dnwcomic\/[^']*/g)[0])

    let pages = pageUrls.map(pageUrl => {
        return {
            pageUrl,
            title: undefined,
            imageUrl: undefined,
        }
    })

    return pages

}

let pageIndex = {}
if (localStorage.getItem('saveDate') && Date.now() - localStorage.getItem('saveDate') < hoursToMS(.1)) {       
    pageIndex = JSON.parse(localStorage.getItem('pageIndex'))
}
loadIndex().then(pages => {
    pageIndex = {...pages, ...pageIndex}
}).then(loadPage(currentPage))

async function loadPage(pageNum) {
    if (pageNum < 0) {
        currentPage = 0
        setPageNum(currentPage)
        return false
    }

    if (pageNum >= (Object.keys(pageIndex).length)) {
        currentPage = Object.keys(pageIndex).length - 1
        setPageNum(currentPage)
        return false
    }

    let page = pageIndex[pageNum]

    if (!page.title || !page.imageUrl) {
        console.log("Fetching page details " + pageNum)
        await getPageContent(page)
    }

    localStorage.setItem('pageIndex', JSON.stringify(pageIndex))
    localStorage.setItem('saveDate', Date.now())

    document.title = page.title

    // document.getElementById("title").innerText = page.title

    document.getElementById("content").src = page.imageUrl

    return true
}

window.addEventListener("hashchange", () => {
    currentPage = getPageNum();
    loadPage(currentPage)
});

document.getElementById("full-left").addEventListener("click", (e) => {
    currentPage = 0
    // loadPage(currentPage)
    setPageNum(currentPage)
})

document.getElementById("full-right").addEventListener("click", (e) => {
    currentPage = Object.keys(pageIndex).length - 1
    // loadPage(currentPage)
    setPageNum(currentPage)
})

document.getElementById("left").addEventListener("click", (e) => {
    currentPage--
    // loadPage(currentPage)
    setPageNum(currentPage)
})

document.getElementById("right").addEventListener("click", (e) => {
    currentPage++
    // loadPage(currentPage)
    setPageNum(currentPage)
})

document.getElementById("page-input").addEventListener("change", (e) => {
    currentPage = parseInt(e.target.value) - 1
    // loadPage(currentPage)
    setPageNum(currentPage)
})

document.addEventListener('swiped-left', function(e) {
    if (window.visualViewport.scale == 1) {
        // console.log(e.target)
        console.log('swiped left')
        currentPage++
        // loadPage(currentPage)
        setPageNum(currentPage)
    }
})

document.addEventListener('swiped-right', function(e) {
    if (window.visualViewport.scale == 1) {
        // console.log(e.target)
        console.log('swiped right')
        currentPage--
        // loadPage(currentPage)
        setPageNum(currentPage)
    }
})

// TODO
// - make it a PWA
// - make it some better colors

loadPage(currentPage)