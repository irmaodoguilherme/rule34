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
  serverTimestamp
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
const enlargedMediaContainer = document.querySelector('[data-container="enlarged-media"]')
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
const pageNavigationButtonsContainer = document.querySelector('[data-container="page-navigation-buttons"]')
const buttonDecrementPage = document.querySelector('[data-button="decrement-page"]')
const displayCurrentPageId = document.querySelector('[data-js="current-page"]')
const buttonIncrementPage = document.querySelector('[data-button="increment-page"]')
const filterContainer = document.querySelector('[data-container="filter"]')
const mediaFilter = document.querySelector('[data-js="image-filter"]')

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
  let pageId = 0

  return {
    getPageId: () => pageId,
    incrementPageId: () => ++pageId,
    decrementPageId: () => --pageId
  }
})()

const manipulateClasses = (classToRemove, classToAdd, ...els) => {
  els.forEach(el => {
    el.classList.remove(classToRemove)
    el.classList.add(classToAdd)
  })
}

const getFetchUrl = (tagsToBeSearched, pageId = 0) => {
  const baseUrl =
    'https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&json=1&limit=52'
  return `${baseUrl}&tags=${tagsToBeSearched}&pid=${pageId}`
}

const fetchMedia = async (tagsToBeSearched, pageId = 0) => {
  const response = await fetch(getFetchUrl(tagsToBeSearched, pageId))
  return await response.json()
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

  mediaContainer.setAttribute('class', 'btn p-0 m-0 max-h-100 max-w-90')
  mediaContainer.setAttribute('data-file_url', file_url)
  mediaContainer.setAttribute('data-id', id)
  mediaContainer.setAttribute('data-owner', owner)
  mediaContainer.setAttribute('data-tags', tags)
  mediaContainer.setAttribute('data-image', image)

  if (time) {
    mediaContainer.setAttribute('data-time', time)
  }

  if (isMediaAVideo) {
    mediaContainer.classList.add('video-outline')
  }

  mediaLi.append(mediaContainer)
  return mediaLi
}

const renderMediaLis = media => {
  const documentFragment = new DocumentFragment()

  media.forEach(mediaItem => {
    documentFragment.append(getMediaLi(mediaItem.data ?
      mediaItem.data() :
      mediaItem))
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
    const { tags } = doc.data()
    documentFragment.append(tags.split(' ').map(tag => `${tag},`).join(''))
  })

  const sortedOptions = getSortedOptions(documentFragment.textContent)

  fillFilter(sortedOptions)
}

const checkClickedMedia = async id => {
  const mediaRef = doc(db, 'media', id)
  const mediaSnapshot = await getDoc(mediaRef)

  /* Deixei dessa forma pois parece o mais simples no momento para mim. */
  const { bookmark: isMediaBookmarked = false, like: isMediaLiked = false } =
    mediaSnapshot.exists() ? mediaSnapshot.data() : {}

  return { isMediaBookmarked, isMediaLiked }
}

const handleButtonStyling = (button, isConditionTruthy, classToAddOrRemove) => {
  if (isConditionTruthy) {
    manipulateClasses(`bi-${classToAddOrRemove}`, `bi-${classToAddOrRemove}-fill`, button)
    return
  }

  manipulateClasses(`bi-${classToAddOrRemove}-fill`, `bi-${classToAddOrRemove}`, button)
}

const getMediaEl = (
  elTag,
  preview_url,
  {
    file_url,
    id,
    owner,
    tags,
    image
  }) => {
  const mediaEl = document.createElement(elTag)
  mediaEl.src = file_url
  mediaEl.setAttribute('data-js', 'media')
  mediaEl.setAttribute('data-preview_url', preview_url)
  mediaEl.setAttribute('data-id', id)
  mediaEl.setAttribute('data-owner', owner)
  mediaEl.setAttribute('data-tags', tags)
  mediaEl.setAttribute('data-image', image)
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
  enlargedMediaContainer.append(mediaEl)
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

  updateCurrentPageId()
  clearMediaList()
  renderMediaLis(media)
}

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
  const media = await fetchMedia(tagsToBeSearched)

  hideMediaFilter()
  clearMediaList()
  resetPageId()
  showPageNavigationButtons()
  renderMediaLis(media)
}

const toggleEnlargedMediaContainerVisibility = () => {
  const enlargedMediaContainer =
    document.querySelector('[data-js="enlarged-media-container"]')
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
}

const handleOnPopupClick = e => {
  const dataClose = e.target.dataset.js
  const isOffcanvasVisible = offcanvas.classList.contains('transform-none')

  if (dataClose != 'offcanvas' && isOffcanvasVisible) {
    hideOffcanvas()
    return
  }

  if (dataClose === 'close-popup' || dataClose === 'enlarged-media-container') {
    hidePopup()
    toggleEnlargedMediaContainerVisibility()
    removeMedia()
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

const handleButtonShowLikesClick = async userid => {
  const queryLikedMedia =
    query(
      collectionMedia,
      where('like', '!=', false),
      where('userid', '==', userid)
    )
  const { docs } = await getDocs(queryLikedMedia)

  clearMediaList()
  renderMediaLis(docs)
  showMediaFilter()
  handleFilterOptions(docs)
}

const handleButtonShowBookmarksClick = async userid => {
  const queryBookmarkedMedia =
    query(
      collectionMedia,
      where('bookmark', '!=', false),
      where('userid', '==', userid)
    )
  const { docs } = await getDocs(queryBookmarkedMedia)

  clearMediaList()
  renderMediaLis(docs)
  showMediaFilter()
  handleFilterOptions(docs)
}

const handleButtonShowActivityClick = async userid => {
  const queryPrivateMedia = query(collectionMedia, where('userid', '==', userid))
  const { docs } = await getDocs(queryPrivateMedia)

  clearMediaList()
  renderMediaLis(docs)
  showMediaFilter()
  handleFilterOptions(docs)
}

formFetchMedia.addEventListener('submit', handleFormFetchSubmit)
ulMedia.addEventListener('click', handleOnMediaClick)
popup.addEventListener('click', handleOnPopupClick)
buttonHome.addEventListener('click', handleOnButtonHomeClick)
buttonIncrementPage.addEventListener('click', handleButtonIncrementPage)
buttonDecrementPage.addEventListener('click', handleButtonDecrementPage)

onAuthStateChanged(auth, user => {
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

  buttonLogin.classList.add('d-none')
  buttonMenu.classList.remove('d-none')
  mediaButtonsContainer.classList.remove('d-none')

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

const request = new XMLHttpRequest()
request.open('Get', 'https://ac.rule34.xxx/autocomplete.php?q=f')
request.send()

request.addEventListener('readystatechange', () => {
  if (request.readyState === 4) {
    console.log(request.responseText)
  }
})