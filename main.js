let corsProxy = atob('aHR0cHM6Ly9jb3JzLmV2YWV4aXN0cy53b3JrZXJzLmRldi8/dXJsPQ==')

async function request(url) {
    return await fetch(corsProxy + url)
}

function unescapeHTML(string) {
    return string
        .replace(/&#038;/g, '&')
        .replace(/&#8211;/g, '-')
}

function toast(text) {
    let toast = document.createElement("div");
    toast.id = "toast";
    toast.innerText = text
    toast.className = 'show'
    document.body.appendChild(toast)
    setTimeout(() => {
        toast.remove()
    }, 2900);
}


function displayPageNumber(pageNum) {
    localStorage.setItem('pageNum', currentPage)
    window.location.hash = pageNum + 1
    document.getElementById("page-input").value = pageNum + 1
}

async function loadIndexOfPages() {
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
    return true
}

async function getPageDetails(page) {
    if (page.title || page.imageUrl) {
        return true
    }
    let pageContent = await request(page.pageUrl).then(response => response.text())
    page.title = unescapeHTML(pageContent.match(/<h1>([^<]*)<\/h1>/g)[0].replace(/<h1>|<\/h1>/g, ''))
    page.imageUrl = pageContent.match(/src=\"[^\"]*\" class=\"attachment-full size-full/g)[0].match(/https:\/\/www.drugsandwires.fail\/wp-content\/uploads\/[^\"]*/g)[0]
    localStorage.setItem('pageIndex', JSON.stringify(pageIndex))
    return page
}

async function loadImage(url) {
    let img = new Image()
    return new Promise((resolve, reject) => {
        img.src = url
        img.onload = () => resolve(url)
    })
}

async function loadPage(pageNum) {
    if (pageNum < 0 || pageNum > pageIndex.length - 1) {
        return false
    }

    currentPage = pageNum
    displayPageNumber(pageNum)

    let page = pageIndex[pageNum]

    if (image.src == page.imageUrl) {
        return true
    }

    await getPageDetails(page)

    if (pageNum != currentPage) {
        return false
    }

    image.src = await(loadImage(page.imageUrl))
    document.title = page.title
    toast(page.title)
    preloadImages(preloadSeek)
    return true
}

async function preloadImages(seek, i=0, page=currentPage) {
    if (currentPage != page) {
        return false
    }

    let preloadMask = Array.from({length: (2 * seek) + 1}, (v, k) => k - seek).reverse().sort((a,b)=>Math.abs(a)-Math.abs(b)).filter(n=>n)
    if (i > preloadMask.length - 1) {
        return true
    }

    let pageNum = currentPage + preloadMask[i]

    if (pageNum < 0 || pageNum > pageIndex.length - 1) {
        return preloadImages(seek, i + 1, page)
    }

    let preloadPage = pageIndex[pageNum]
    await getPageDetails(preloadPage)
    await loadImage(preloadPage.imageUrl)
    return preloadImages(seek, i + 1, page)
}

let currentPage = 0;
let preloadSeek = 5;
let pageIndex = JSON.parse(localStorage.getItem('pageIndex')) || []
let image = document.getElementById("content")

if (localStorage.getItem('pageNum') !== null) {
    currentPage = parseInt(localStorage.getItem('pageNum'))
} else if (window.location.hash !== '') {
    let pageNum = parseInt(window.location.hash.replace('#', '')) - 1
    if (!isNaN(pageNum)) {
        currentPage = pageNum
    }
} else {
    currentPage = 0
}
displayPageNumber(currentPage)
console.log(currentPage)

loadPage(currentPage).then(() => loadIndexOfPages().then(() => loadPage(currentPage)))


window.addEventListener("hashchange", () => {
    let pageNum = parseInt(window.location.hash.replace('#', '')) - 1
    if (pageNum != currentPage && !isNaN(pageNum)) {
        loadPage(pageNum)
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

document.getElementById("image-container").addEventListener("click", e => {
    if (e.target == document.getElementById("image-container")) {
        let height = e.target.offsetHeight
        let localPos = e.clientY - e.target.getBoundingClientRect().top
        if (height / 2 > localPos) {
            toast(document.title)
        }    
    }
})