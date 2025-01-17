import {
  initializeApp
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js';
import {
  getFirestore,
  collection,
  setDoc,
  deleteDoc,
  updateDoc,
  deleteField,
  getDoc,
  getDocs,
  doc,
  query,
  where,
  serverTimestamp,
  onSnapshot
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js'
import {
  GoogleAuthProvider,
  getAuth,
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js"

const ulMedia = document.querySelector('[data-js="media-list"]')
const popup = document.querySelector('[data-js="popup"]')
const enlargedMedia = document.querySelector('[data-container="enlarged-media"]')
const buttonNextMedia = document.querySelector('[data-button="next-media"]')
const buttonPreviousMedia = document.querySelector('[data-button="previous-media"]')
const tagsList = document.querySelector('[data-ul="tags"]')
const formFetchMedia = document.querySelector('[data-form="fetch"]')
const buttonDownload = document.querySelector('[data-button="download"]')
const buttonLike = document.querySelector('[data-button="like"]')
const buttonBookmark = document.querySelector('[data-button="bookmark"]')
const buttonMenu = document.querySelector('[data-button="menu"]')
const buttonLogin = document.querySelector('[data-button="login"]')
const buttonLogout = document.querySelector('[data-button="logout"]')
const buttonHome = document.querySelector('[data-button="home"]')
const buttonShowLikes = document.querySelector('[data-button="show-likes"]')
const buttonShowBookmarks = document.querySelector('[data-button="show-bookmarks"]')
const offcanvas = document.querySelector('[data-js="offcanvas"]')
const buttonShowActivity = document.querySelector('[data-button="show-activity"]')
const mediaButtonsContainer = document.querySelector('[data-container="media-buttons"]')
const pageNavigationButtonsContainer =
  document.querySelector('[data-container="page-navigation-buttons"]')
// const buttonDecrementPage = document.querySelector('[data-button="decrement-page"]')
const displayCurrentPageId = document.querySelector('[data-js="current-page"]')
// const buttonIncrementPage = document.querySelector('[data-button="increment-page"]')
const filterContainer = document.querySelector('[data-container="filter"]')
const mediaFilter = document.querySelector('[data-js="image-filter"]')
const enlargedMediaContainer =
  document.querySelector('[data-js="enlarged-media-container"]')
const buttonClosePopup = document.querySelector('[data-js="close-popup"]')

const firebaseConfig = {
  apiKey: "AIzaSyC3ibhZluc8MPpS0JtFhhnzsfcdz-0W9a4",
  authDomain: "rule34-bbfb7.firebaseapp.com",
  projectId: "rule34-bbfb7",
  storageBucket: "rule34-bbfb7.firebasestorage.app",
  messagingSenderId: "734770576483",
  appId: "1:734770576483:web:d35b20c502d60a13114c56"
};

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const collectionMedia = collection(db, 'media')
const provider = new GoogleAuthProvider()
const auth = getAuth(app)

const state = (() => {
  let mediaQuantity
  let currentMediaId = 0
  let currentPageId = 1

  return {
    getCurrentMediaId: () => currentMediaId,
    getMediaQuantity: () => mediaQuantity,
    updateMediaQuantity: newMediaQuantity => {
      if (typeof (mediaQuantity) != 'number') {
        return
      }

      mediaQuantity = newMediaQuantity
    },
    incrementCurrentMediaId: () => {
      if (currentMediaId === mediaQuantity) {
        return
      }

      return ++currentMediaId
    },
    decrementCurrentMediaId: () => {
      if (currentMediaId === 0) {
        return
      }

      return --currentMediaId
    },
    updateCurrentMediaId: newCurrentId => {
      if (typeof (newCurrentId) != 'number') {
        return
      }

      currentMediaId = newCurrentId
    },
    getCurrentPageId: () => currentPageId,
    incrementPageId: () => ++currentPageId,
    decrementPageId: () => --currentPageId,
    updateCurrentPageId: newCurrentPageId => {
      if (typeof (newCurrentPageId) != 'number') {
        return
      }

      currentPageId = newCurrentPageId
    }
  }
})()

const databaseMedia = (() => {
  let media

  return {
    getMedia: () => media,
    updateMedia: async newMediaObj => {
      if (typeof (newMediaObj) != 'object') {
        return
      }

      media = newMediaObj
      return media
    },
    addMedia: newMedia => {
      if (typeof (newMedia) != 'object') {
        return
      }

      media.push(newMedia)
    }
  }
})()

const hideButtonClosePopup = () => buttonClosePopup.classList.add('d-none')
const showButtonClosePopup = () => buttonClosePopup.classList.remove('d-none')

const manipulateClasses = (classToRemove, classToAdd, ...els) => {
  els.forEach(el => {
    el.classList.remove(classToRemove)
    el.classList.add(classToAdd)
  })
}

const getFetchUrl = (tagsToBeSearched, pageId = 0) => {
  const baseUrl =
    'https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&json=1&limit=1000'
  return `${baseUrl}&tags=${tagsToBeSearched}&pid=${pageId}`
}

const fetchMedia = async (tagsToBeSearched, pageId = 0) => {
  try {
    const response = await fetch(getFetchUrl(tagsToBeSearched, pageId))
    return databaseMedia.updateMedia(await response.json())
  } catch (error) {
    console.log(error)
  }
}

const hideMediaFilter = () => filterContainer.classList.add('d-none')
const showMediaFilter = () => filterContainer.classList.remove('d-none')
const clearMediaList = () => ulMedia.innerHTML = ''
const resetPageId = () => displayCurrentPageId.textContent = '1'
const showPageNavigationButtons = () =>
  pageNavigationButtonsContainer.classList.remove('d-none')
const hidePageNavigationButtons = () =>
  pageNavigationButtonsContainer.classList.add('d-none')

const getMediaLi = (
  mediaId,
  {
    preview_url,
    file_url,
    id,
    owner,
    tags,
    image,
    time = false
  }) => {
  const isMediaAVideo = image.includes('mp4')

  const mediaLi = document.createElement('li')
  mediaLi.classList.add('col-sm')

  const mediaContainer = document.createElement('img')
  mediaContainer.src = preview_url

  mediaContainer.setAttribute('class', 'btn p-0 m-0 max-h-100 max-w-90 media-frame border-0')
  mediaContainer.setAttribute('data-file_url', file_url)
  mediaContainer.setAttribute('data-id', id)
  mediaContainer.setAttribute('data-owner', owner)
  mediaContainer.setAttribute('data-tags', tags)
  mediaContainer.setAttribute('data-image', image)
  mediaContainer.setAttribute('data-mediaId', mediaId)

  if (time) {
    mediaContainer.setAttribute('data-time', time.toDate())
  }

  if (isMediaAVideo) {
    mediaContainer.classList.add('video-outline')
  }

  mediaLi.append(mediaContainer)
  return mediaLi
}

const getLikedMedia = media => media.filter(mediaItem => mediaItem.like === true)
const getBookmarkedMedia = media => media.filter(mediaItem => mediaItem.bookmark === true)
const sortByTime = arr => {
  if(!arr[0].time) {
    return arr
  }

  return arr.sort((a, b) => b.time.toDate() - a.time.toDate())
}
const getSortedByTimeMedia = media =>
  sortByTime(media.map(mediaItem => mediaItem.data()))

const renderMediaLis = media => {
  const documentFragment = new DocumentFragment()
  state.updateMediaQuantity(media.length)

  media.forEach(mediaItem => {
    documentFragment.append(getMediaLi(state.getCurrentMediaId(), mediaItem))
    state.incrementCurrentMediaId()
  })

  ulMedia.append(documentFragment)
}

const fillFilter = filteredTags => {
  mediaFilter.innerHTML = `<option>none</option>${filteredTags}`
}

const getFilterOptions = tags => tags.split(',').map(tag => {
  if (tag === '') {
    return
  }

  return `<option>${tag}</option>`
})

const removeDuplicates = array =>
  array.filter((tag, index, array) => array.indexOf(tag) === index)
const getSortedOptions = string =>
  removeDuplicates(getFilterOptions(string)).sort().join(' ')

const handleFilterOptions = docs => {
  const documentFragment = new DocumentFragment()

  docs.forEach(doc => {
    const { tags } = doc
    documentFragment.append(tags.split(' ').map(tag => `${tag},`).join(''))
  })

  const sortedOptions = getSortedOptions(documentFragment.textContent)

  fillFilter(sortedOptions)
}

const checkClickedMedia = async id => {
  const [mediaRef] = databaseMedia.getMedia().filter(media => media.id === id)
  /* Deixei dessa forma pois parece o mais simples no momento para mim. */
  const { bookmark: isMediaBookmarked = false, like: isMediaLiked = false } =
    mediaRef || {}

  return { isMediaBookmarked, isMediaLiked }
}

const handleButtonStyling = (button, isConditionTruthy, classToAddOrRemove) => {
  if (isConditionTruthy) {
    manipulateClasses(`bi-${classToAddOrRemove}`, `bi-${classToAddOrRemove}-fill`, button)
    return
  }

  manipulateClasses(`bi-${classToAddOrRemove}-fill`, `bi-${classToAddOrRemove}`, button)
}

// const getMediaEl = (
//   elTag,
//   preview_url,
//   {
//     file_url,
//     id,
//     owner,
//     tags,
//     image
//   }) => {
//   const mediaEl = document.createElement(elTag)
//   mediaEl.src = file_url
//   mediaEl.setAttribute('data-js', 'media')
//   mediaEl.setAttribute('data-preview_url', preview_url)
//   mediaEl.setAttribute('data-id', id)
//   mediaEl.setAttribute('data-owner', owner)
//   mediaEl.setAttribute('data-tags', tags)
//   mediaEl.setAttribute('data-image', image)
//   buttonDownload.href = file_url

//   if (elTag === 'video') {
//     mediaEl.setAttribute('controls', '')
//     mediaEl.setAttribute('class', 'max-w-100 h-100 max-h-fit')
//     return mediaEl
//   }

//   mediaEl.setAttribute('class', 'max-w-100 h-100 max-h-fit')
//   return mediaEl
// }
const getMediaEl = (
  elTag,
  preview_url,
  {
    file_url,
    id,
    owner,
    tags,
    image,
    mediaid
  }) => {
  const mediaEl = document.createElement(elTag)
  mediaEl.src = file_url
  mediaEl.setAttribute('data-js', 'media')
  mediaEl.setAttribute('data-preview_url', preview_url)
  mediaEl.setAttribute('data-id', id)
  mediaEl.setAttribute('data-owner', owner)
  mediaEl.setAttribute('data-tags', tags)
  mediaEl.setAttribute('data-image', image)
  mediaEl.setAttribute('data-mediaid', mediaid)
  buttonDownload.href = file_url

  if (elTag === 'video') {
    mediaEl.setAttribute('controls', '')
    mediaEl.setAttribute('class', 'max-w-100 h-100 max-h-fit')
    return mediaEl
  }

  mediaEl.setAttribute('class', 'max-w-100 h-100 max-h-fit')
  return mediaEl
}

const enlargeClickedMedia = (elTag, preview_url, dataMedia) => {
  const mediaEl = getMediaEl(elTag, preview_url, dataMedia)
  enlargedMedia.insertAdjacentElement('afterbegin', mediaEl)
}

const showPopup = () => popup.classList.remove('d-none')
const hidePopup = () => popup.classList.add('d-none')

const removeMedia = () => {
  const media = document.querySelector('[data-js="media"]')
  media.src = ''
  media.remove()
}

const showOffcanvas = () => {
  popup.classList.remove('d-none')
  setTimeout(() => offcanvas.classList.add('transform-none'), 100)
}

const hideOffcanvas = () => {
  offcanvas.classList.remove('transform-none')
  setTimeout(() => popup.classList.add('d-none'), 250)
}

const updateCurrentPageId = () =>
  displayCurrentPageId.textContent = state.getPageId() + 1

const fetchNextPage = async pageId => {
  if (formFetchMedia.tags.value === '') {
    return
  }

  const tags = formFetchMedia.tags.value.split(' ').join('+')
  const media = await fetchMedia(tags, pageId)

  state.updateCurrentMediaId(0)
  updateCurrentPageId()
  clearMediaList()
  renderMediaLis(media)
}

// const sortMedia = () => {
//   ulMedia
// }

const filterMedia = (lis, desiredTag, returnMatchedLi) => lis.filter(li => {
  const matchedLi = li.dataset.tags.includes(desiredTag)
  return returnMatchedLi ? matchedLi : !matchedLi
})

const getLisParents = lis => lis.map(li => li.parentElement)
const hideMediaLis = (lis, desiredTag) => {
  const lisParentsToHide = getLisParents(filterMedia(lis, desiredTag, false))
  manipulateClasses('d-block', 'd-none', ...lisParentsToHide)
}

const showMediaLis = (lis, desiredTag) => {
  const lisParentsToShow = getLisParents(filterMedia(lis, desiredTag, true))
  manipulateClasses('d-none', 'd-block', ...lisParentsToShow)
}

const showAllLis = mediaLis => mediaLis.forEach(mediaItem =>
  mediaItem.parentElement.classList.remove('d-none'))

const handleMediaDisplay = (mediaLis, inputTag) => {
  hideMediaLis(mediaLis, inputTag)
  showMediaLis(mediaLis, inputTag)
}

const dislikeMedia = async mediaRef =>
  await updateDoc(mediaRef, { like: deleteField() })

const isMediaDeletable = async mediaRef => {
  const isButtonBookmarkFilled =
    buttonBookmark.classList.contains('bi-bookmark-fill')

  if (!isButtonBookmarkFilled) {
    await deleteDoc(mediaRef)
  }
}

const likeMedia = async (
  mediaRef,
  userid,
  file_url,
  {
    preview_url,
    id,
    owner,
    tags,
    image
  }) => {
  await setDoc(mediaRef, {
    file_url,
    preview_url,
    id,
    owner,
    tags,
    image,
    time: serverTimestamp(),
    like: true,
    userid
  }, { merge: true })
}

const unbookmarkMedia = async mediaRef =>
  await updateDoc(mediaRef, { bookmark: deleteField() })

const bookmarkMedia = async (
  mediaRef,
  userid,
  file_url,
  {
    preview_url,
    id,
    owner,
    tags,
    image
  }) => {
  await setDoc(mediaRef, {
    file_url,
    preview_url,
    id,
    owner,
    tags,
    image,
    time: serverTimestamp(),
    bookmark: true,
    userid
  }, { merge: true })
}

const handleFormFetchSubmit = async e => {
  e.preventDefault()

  const tagsToBeSearched = e.target.tags.value.split(' ').join('+')
  const media = (await fetchMedia(tagsToBeSearched)).slice(0, 52)

  state.updateCurrentMediaId(0)
  hideMediaFilter()
  clearMediaList()
  showPageNavigationButtons()
  renderMediaLis(media)

  /* Daqui para baixo ajusta a quantidade de páginas disponiveis */
  const availablePagesContainer = document.querySelector('[data-js="available-pages"]')
  const databasedMedia = databaseMedia.getMedia()
  const pagesQuantity = Math.round(databasedMedia.length / 52)
  const pages = new DocumentFragment()

  for(let i = 0; i < pagesQuantity; i++) {
    const page = document.createElement('p')
    page.setAttribute('class', 'btn border-0 text-white fs-3 m-0 p-0')
    page.setAttribute('data-pageid', i+1)
    page.textContent = i + 1

    if (i === 0) {
      page.classList.add('ms-4')
      page.setAttribute('data-js', 'current-page')
      pages.append(page)
    }
    
    if(i === pagesQuantity - 1) {
      page.classList.add('me-4')
      pages.append(page)
    }

    pages.append(page)
  }

  pageNavigationButtonsContainer.classList.remove('d-none')
  availablePagesContainer.innerHTML = ''
  availablePagesContainer.append(pages)
  availablePagesContainer.setAttribute('data-filter', '')
}

const toggleEnlargedMediaContainerVisibility = () => {
  enlargedMediaContainer.classList.toggle('d-none')
}

const handleOnMediaClick = async e => {
  const { src: preview_url, dataset: dataMedia } = e.target
  const { file_url: isClickedElementAMedia } = dataMedia

  if (!isClickedElementAMedia) {
    return
  }

  const { id, image } = dataMedia
  const { isMediaLiked, isMediaBookmarked } = await checkClickedMedia(id)
  const elTag = image.includes('.mp4') ? 'video' : 'img'

  handleButtonStyling(buttonLike, isMediaLiked, 'heart')
  handleButtonStyling(buttonBookmark, isMediaBookmarked, 'bookmark')
  enlargeClickedMedia(elTag, preview_url, dataMedia)
  showPopup()
  toggleEnlargedMediaContainerVisibility()
  showButtonClosePopup()
}

const handleOnPopupClick = e => {
  const dataClose = e.target.dataset.js
  const isOffcanvasVisible = offcanvas.classList.contains('transform-none')
  const selectedDataToClosePopup = ['close-popup', 'popup', 'enlarged-media-container']

  if (dataClose != 'offcanvas' && isOffcanvasVisible) {
    hideOffcanvas()
    return
  }

  if (selectedDataToClosePopup.includes(dataClose)) {
    hidePopup()
    hideButtonClosePopup()
    toggleEnlargedMediaContainerVisibility()
    removeMedia()
    hideMediaButtons()
  }
}

const handleOnButtonHomeClick = () => {
  hideMediaFilter()
  clearMediaList()
  hidePageNavigationButtons()
}

const handleButtonIncrementPage = () => fetchNextPage(state.incrementPageId())
const handleButtonDecrementPage = () => {
  const pageId = state.getPageId()

  if (pageId <= 0) {
    return
  }

  fetchNextPage(state.decrementPageId())
}

const login = async () => await signInWithPopup(auth, provider)
const logout = async () => {
  await signOut(auth)
  hideOffcanvas()
  hideMediaFilter()
  clearMediaList()
}

const handleFilterInput = e => {
  const desiredTag = e.target.value
  const mediaLis = [...document.querySelectorAll('[data-tags]')]

  if (desiredTag === 'none') {
    showAllLis(mediaLis)
    return
  }

  handleMediaDisplay(mediaLis, desiredTag)
}

const handleButtonLikeMediaClick = async userid => {
  const media = document.querySelector('[data-js="media"]')
  const dataMedia = media.dataset
  const { id } = dataMedia
  const mediaRef = doc(db, 'media', id)
  const isButtonLikeFilled =
    buttonLike.classList.contains('bi-heart-fill')

  if (isButtonLikeFilled) {
    dislikeMedia(mediaRef)
    manipulateClasses('bi-heart-fill', 'bi-heart', buttonLike)
    isMediaDeletable(mediaRef)
    return
  }

  manipulateClasses('bi-heart', 'bi-heart-fill', buttonLike)
  likeMedia(mediaRef, userid, media.src, dataMedia)
}

const handleBookmarkMediaClick = async userid => {
  const media = document.querySelector('[data-js="media"]')
  const dataMedia = media.dataset
  const [{ id }, { src: file_url }] = [dataMedia, media]
  const mediaRef = doc(db, 'media', id)
  const isButtonBookmarkFilled =
    buttonBookmark.classList.contains('bi-bookmark-fill')

  if (isButtonBookmarkFilled) {
    unbookmarkMedia(mediaRef)
    manipulateClasses('bi-bookmark-fill', 'bi-bookmark', buttonBookmark)

    return
  }

  manipulateClasses('bi-bookmark', 'bi-bookmark-fill', buttonBookmark)
  bookmarkMedia(mediaRef, userid, file_url, dataMedia)
}

const x = (firstNumber, secondNumber, arr) => arr.slice((0 + firstNumber), (52 + secondNumber))

const handleButtonShowLikesClick = async userid => {
  const databasedMedia = await fetchDatabaseMedia(userid)
  const likedMedia = getLikedMedia(databasedMedia)
  const sortedLikedMedia = x(0, 0, sortByTime(likedMedia))

  state.updateCurrentMediaId(0)
  clearMediaList()
  renderMediaLis(sortedLikedMedia)
  showMediaFilter()
  handleFilterOptions(sortedLikedMedia)

  /* Daqui para baixo ajusta a quantidade de páginas disponiveis */
  const availablePagesContainer = document.querySelector('[data-js="available-pages"]')
  const pagesQuantity = Math.round(likedMedia.length / 52)
  const pages = new DocumentFragment()

  for(let i = 0; i < pagesQuantity; i++) {
    const page = document.createElement('p')
    page.setAttribute('class', 'btn border-0 text-white fs-3 m-0 p-0')
    page.setAttribute('data-pageid', i+1)
    page.textContent = i + 1

    if (i === 0) {
      page.classList.add('ms-4')
      page.setAttribute('data-js', 'current-page')
      pages.append(page)
    }
    
    if(i === pagesQuantity - 1) {
      page.classList.add('me-4')
      pages.append(page)
    }

    pages.append(page)
  }

  pageNavigationButtonsContainer.classList.remove('d-none')
  availablePagesContainer.innerHTML = ''
  availablePagesContainer.append(pages)
  availablePagesContainer.setAttribute('data-filter', 'like')
}

const handleButtonShowBookmarksClick = async userid => {
  state.updateCurrentMediaId(0)

  const databasedMedia = await fetchDatabaseMedia(userid)
  const bookmarkedMedia = getBookmarkedMedia(databasedMedia)
  const sortedBookmarkedMedia = x(0, 0, sortByTime(bookmarkedMedia))

  /* Limpa a ulMedia */
  clearMediaList()
  /* Renderiza as lis */
  renderMediaLis(sortedBookmarkedMedia)
  /* Exibe as opções de filtro */
  showMediaFilter()
  /* Renderiza as opções de filtro */
  handleFilterOptions(sortedBookmarkedMedia)

  /* Daqui para baixo ajusta a quantidade de páginas disponiveis */
  const availablePagesContainer = document.querySelector('[data-js="available-pages"]')
  const pagesQuantity = Math.round(bookmarkedMedia.length / 52)
  const pages = new DocumentFragment()

  for(let i = 0; i < pagesQuantity; i++) {
    const page = document.createElement('p')
    page.setAttribute('class', 'btn border-0 text-white fs-3 m-0 p-0')
    page.setAttribute('data-pageid', i+1)
    page.textContent = i + 1

    if (i === 0) {
      page.classList.add('ms-4')
      page.setAttribute('data-js', 'current-page')
      pages.append(page)
    }
    
    if(i === pagesQuantity - 1) {
      page.classList.add('me-4')
      pages.append(page)
    }

    pages.append(page)
  }

  pageNavigationButtonsContainer.classList.remove('d-none')
  availablePagesContainer.innerHTML = ''
  availablePagesContainer.append(pages)
  availablePagesContainer.setAttribute('data-filter', 'bookmark')
}

const y = (firstNumber, arr) => arr.slice((firstNumber - 52), firstNumber)

document.querySelector('[data-js="available-pages"]').addEventListener('click', e => {
  const { target } = e
  const pageId = Number(target.textContent)

  if(pageId < 1){
    return
  }

  const availablePagesContainer = document.querySelector('[data-js="available-pages"]')
  const databasedMedia = databaseMedia.getMedia()

  /* Obtêm o id do último item da lista */
  if(pageId === (state.getCurrentPageId() + 1)){
    const filterAttribute = availablePagesContainer.dataset.filter
    const filteredDatabasedMedia = databasedMedia.filter(media => media[filterAttribute])
    // const bookmarkedMedia = getBookmarkedMedia(databaseMedia.getMedia())
    const orderedDatabasedMedia = x(Number([...ulMedia.children][[...ulMedia.children].length - 1].children[0].dataset.mediaid) + 1, Number([...ulMedia.children][[...ulMedia.children].length - 1].children[0].dataset.mediaid) + 1, sortByTime(filterAttribute != 'bookmark' && filterAttribute != 'like' ? databasedMedia : filteredDatabasedMedia))
    // const orderedDatabasedMedia = x(Number([...ulMedia.children][[...ulMedia.children].length - 1].children[0].dataset.mediaid) + 1, Number([...ulMedia.children][[...ulMedia.children].length - 1].children[0].dataset.mediaid) + 1, sortByTime(databasedMedia))

    state.incrementPageId()
    clearMediaList()
    renderMediaLis(orderedDatabasedMedia)
    showMediaFilter()
    handleFilterOptions(orderedDatabasedMedia)
    return
  }

  /* Precisa melhorar
  Obtêm o id do primeiro item  */
  if(pageId === (state.getCurrentPageId() - 1)){
    state.updateCurrentMediaId((Number(ulMedia.children[0].children[0].dataset.mediaid) - 52))

    const filterAttribute = availablePagesContainer.dataset.filter
    const filteredDatabasedMedia = databasedMedia.filter(media => media[filterAttribute])

    // const bookmarkedMedia = getBookmarkedMedia(databaseMedia.getMedia())
    const orderedDatabasedMedia = y(Number(ulMedia.children[0].children[0].dataset.mediaid), sortByTime(filterAttribute != 'bookmark' && filterAttribute != 'like' ? databasedMedia : filteredDatabasedMedia))
    // const orderedBookmarkedMedia = y(Number(ulMedia.children[0].children[0].dataset.mediaid), sortByTime(bookmarkedMedia))

    state.decrementPageId()
    clearMediaList()
    renderMediaLis(orderedDatabasedMedia)
    showMediaFilter()
    handleFilterOptions(orderedDatabasedMedia)
    return
  }
})

const handleButtonShowActivityClick = () => {
  const media = databaseMedia.getMedia()
  const orderedMedia = sortByTime(media)

  clearMediaList()
  renderMediaLis(orderedMedia)
  showMediaFilter()
  handleFilterOptions(orderedMedia)
}

const fetchDatabaseMedia = async userid => {
  const queryPrivateMedia = query(collectionMedia, where('userid', '==', userid))
  const { docs } = await getDocs(queryPrivateMedia)
  const media = docs.map(doc => doc.data())

  return databaseMedia.updateMedia(media)
}

const idleTimer = (() => {
  const idleTime = 3000
  let idleTimeout

  return {
    resetIdleTimer: () => {
      clearTimeout(idleTimeout)
      idleTimeout = setTimeout(hideMediaButtons, idleTime)
    }
  }
})()

const hideMediaButtons = () => {
  [...mediaButtonsContainer.children].forEach(mediaButton => mediaButton.classList.add('d-none'))
}

const showMediaButtons = () => {
  if(!buttonLike.classList.contains('d-none')) {
    idleTimer.resetIdleTimer()
    return
  }

  [...mediaButtonsContainer.children].forEach(mediaButton => mediaButton.classList.remove('d-none'))
  idleTimer.resetIdleTimer()
}

formFetchMedia.addEventListener('submit', handleFormFetchSubmit)
ulMedia.addEventListener('click', handleOnMediaClick)
popup.addEventListener('click', handleOnPopupClick)
buttonHome.addEventListener('click', handleOnButtonHomeClick)
// buttonIncrementPage.addEventListener('click', handleButtonIncrementPage)
// buttonDecrementPage.addEventListener('click', handleButtonDecrementPage)
buttonNextMedia.addEventListener('click', async () => {
  const activeMedia = document.querySelector('[data-js="media"]')
  const nextMediaId = Number(activeMedia.dataset.mediaid) + 1

  if (nextMediaId === state.getMediaQuantity()) {
    return
  }

  const nextMediaToBeDisplayed =
    document.querySelector(`[data-mediaid="${nextMediaId}"]`)
  const { src: preview_url, dataset } = nextMediaToBeDisplayed
  const { id, image } = dataset
  const { isMediaLiked, isMediaBookmarked } = await checkClickedMedia(id)
  const elTag = image.includes('.mp4') ? 'video' : 'img'

  removeMedia()
  handleButtonStyling(buttonLike, isMediaLiked, 'heart')
  handleButtonStyling(buttonBookmark, isMediaBookmarked, 'bookmark')
  enlargeClickedMedia(elTag, preview_url, dataset)
})

buttonPreviousMedia.addEventListener('click', () => {
  const activeMedia = document.querySelector('[data-js="media"]')
  const nextMediaId = Number(activeMedia.dataset.mediaid) - 1

  if (nextMediaId < 0) {
    return
  }

  const nextMediaToBeDisplayed =
    document.querySelector(`[data-mediaid="${nextMediaId}"]`)
  const { src: preview_url, dataset } = nextMediaToBeDisplayed
  const { image } = dataset
  const elTag = image.includes('.mp4') ? 'video' : 'img'

  removeMedia()
  enlargeClickedMedia(elTag, preview_url, dataset)
})

enlargedMediaContainer.addEventListener('mousemove', showMediaButtons)
onAuthStateChanged(auth, user => {
  let unsubscribe

  if(!user && unsubscribe) {
    unsubscribe()
  }

  if (!user) {

    buttonLogin.classList.remove('d-none')
    buttonMenu.classList.add('d-none')
    mediaButtonsContainer.classList.add('d-none')
    
    buttonLogin.addEventListener('click', login)
    mediaFilter.removeEventListener('click', handleFilterInput)
    buttonMenu.removeEventListener('click', showOffcanvas)
    buttonLogout.removeEventListener('click', logout)
    buttonLike.onclick = ''
    buttonBookmark.onclick = ''
    buttonShowLikes.onclick = ''
    buttonShowBookmarks.onclick = ''
    buttonShowActivity.onlick = ''
    return
  }
  
  // const queryPrivateMedia = query(collectionMedia, where('userid', '==', user.uid))
  // unsubscribe = onSnapshot(queryPrivateMedia, doc => {
  //   doc.docChanges().forEach(docChange => {
  //     if(docChange.type === 'modified') {
  //       databaseMedia.addMedia(docChange.doc.data())
  //       //// console.log(docChange, docChange.doc.data(), databaseMedia.getMedia())
  //     }
  //   })

  //   const media = doc.docChanges().map(docChange => docChange.doc.data())
  //   databaseMedia.updateMedia(media)
  // })

  buttonLogin.classList.add('d-none')
  buttonMenu.classList.remove('d-none')
  mediaButtonsContainer.classList.remove('d-none')
  // fetchDatabaseMedia(user.uid)
  
  buttonLogin.removeEventListener('click', login)
  mediaFilter.addEventListener('input', handleFilterInput)
  buttonMenu.addEventListener('click', showOffcanvas)
  buttonLogout.addEventListener('click', logout)
  buttonLike.onclick = () => handleButtonLikeMediaClick(user.uid)
  buttonBookmark.onclick = () => handleBookmarkMediaClick(user.uid)
  buttonShowLikes.onclick = () => handleButtonShowLikesClick(user.uid)
  buttonShowBookmarks.onclick = () => handleButtonShowBookmarksClick(user.uid)
  buttonShowActivity.onclick = () => handleButtonShowActivityClick(user.uid)
})