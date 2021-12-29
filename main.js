let corsProxy = atob('aHR0cHM6Ly9jb3JzLmV2YWV4aXN0cy53b3JrZXJzLmRldi8/dXJsPQ==')

async function request(url) {
    return await fetch(corsProxy + url)
}

function unescapeHTML(string) {
    return string
        .replace(/&#038;/g, '&')
        .replace(/&#8211;/g, '-')
        .replace(/&#8217;/g, '’')
}

function killToast(toast) {
    let text = toast.innerText
    toast.remove()
    toast = document.createElement("div");
    toast.id = "toast"
    toast.className = "kill";
    toast.innerText = text;
    toast.style.width = `${(image.offsetWidth * 80)/Math.max(document.documentElement.clientWidth, window.innerWidth || 100)}vw`
    toastLocation.appendChild(toast)
    setTimeout(() => {
        toast.remove()
    }, 400)
}

function replaceToast(toast, text) {
    toast.remove()
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "replace";
    toast.innerText = text;
    toast.style.width = `${(image.offsetWidth * 80)/Math.max(document.documentElement.clientWidth, window.innerWidth || 100)}vw`
    toast.addEventListener('swiped-down', e => killToast(toast))
    toast.addEventListener('touchstart', e => {
        e.preventDefault()
        killToast(toast)
    })
    toast.addEventListener('click', e => killToast(toast))
    toastLocation.appendChild(toast)
    setTimeout(() => {
        toast.remove()
    }, 2900);
}

let toastLocation = document.getElementsByClassName("flex-column")[0]
function toast(text) {
    let oldToast = document.getElementById("toast")
    if (oldToast && oldToast.innerText == text) {
        return
    }
    if (oldToast && oldToast.getAnimations()[0].currentTime < 2500) {
        replaceToast(oldToast, text)
    } else {
        let toast = document.createElement("div");
        toast.style.width = `${(image.offsetWidth * 80)/Math.max(document.documentElement.clientWidth, window.innerWidth || 100)}vw`
        toast.id = "toast";
        toast.innerText = text
        toast.className = 'show'
        
        toast.addEventListener('swiped-down', e => killToast(toast))
        toast.addEventListener('touchstart', e => {
            e.preventDefault()
            killToast(toast)
        })
        toast.addEventListener('click', e => killToast(toast))
        toastLocation.appendChild(toast)
        setTimeout(() => {
            toast.remove()
        }, 2900);    
    }
}

let info = document.getElementById("info")
document.getElementById("info-button").addEventListener("click", e => {
    info.style.width = `${(image.offsetWidth * 80)/Math.max(document.documentElement.clientWidth, window.innerWidth || 0)}vw`
    info.classList.add("show")
    // setTimeout(() => info.classList.remove("show"), 500)
})

document.getElementById("close-info").addEventListener("click", e => {
    info.classList.remove("show")
    info.classList.add("hide")
    setTimeout(() => info.classList.remove("hide"), 500)
})


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
    image.onload = () => toast(page.title)
    preloadImages(preloadSeek)

    currentType = "other"
    for (let sectionType in sectionTypes) {
        if (sectionTypes[sectionType].regex.test(page.pageUrl)) {
            currentType = sectionType
        }
    }

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

let sectionTypes = {
    chapter: {
        regex: /https:\/\/www\.drugsandwires\.fail\/dnwcomic\/chapter-.*-page.*\//
    },
    wirepedia: {
        regex: /https:\/\/www\.drugsandwires\.fail\/dnwcomic\/wirepedia-.*\//
    },
    extras: {
        regex: /https:\/\/www\.drugsandwires\.fail\/dnwcomic\/dw-extras-.*\//
    },
    fear_and_loading: {
        regex: /https:\/\/www\.drugsandwires\.fail\/dnwcomic\/fear_and_loading-.*\//
    },
    guest_art_week: {
        regex: /https:\/\/www\.drugsandwires\.fail\/dnwcomic\/guest-art-week-.*\//
    },
    other: {
        regex: /a^/
    }
}

function nextSection() {
    let regex = sectionTypes[currentType].regex
    let searchArray = pageIndex.slice(currentPage + 1, -1)
    console.log(searchArray[0])
    let pageNum = currentPage + 1 + searchArray.findIndex(page => !regex.test(page.pageUrl))
    pageNum = pageNum == -1 ? pageIndex.length - 1 : pageNum
    loadPage(pageNum)
    return pageNum
}

function prevSection() {
    let regex = sectionTypes[currentType].regex
    let searchArray = pageIndex.slice(0, currentPage).reverse()
    let pageNum = searchArray.length - 1 - searchArray.findIndex(page => !regex.test(page.pageUrl))
    pageNum = pageNum == -1 ? 0 : pageNum
    loadPage(pageNum)
    return pageNum
}

let currentType = "chapter"
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

loadPage(currentPage).then(() => loadIndexOfPages().then(() => loadPage(currentPage)))


window.addEventListener("hashchange", () => {
    let pageNum = parseInt(window.location.hash.replace('#', '')) - 1
    if (pageNum != currentPage && !isNaN(pageNum)) {
        loadPage(pageNum)
    }
});

document.getElementById("full-left").addEventListener("click", (e) => {
    prevSection()
})

document.getElementById("full-left").addEventListener("long-press", (e) => {
    e.preventDefault()
    loadPage(0)
})

document.getElementById("full-right").addEventListener("click", (e) => {
    nextSection()
})

document.getElementById("full-right").addEventListener("long-press", (e) => {
    e.preventDefault()
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

document.getElementById("image-container").addEventListener("click", (e) => {
    toast(document.title)
})