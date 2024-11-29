import {
  initializeApp
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js';
import {
  getFirestore,
  collection,
  addDoc,
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
const mediaPopup = document.querySelector('[data-js="media-popup"]')
const mediaContainer = document.querySelector('[data-js="media-container"]')
const formFetchMedia = document.querySelector('[data-js="form-search"]')
const buttonDownload = document.querySelector('[data-js="download-media"]')
const buttonLikeMedia = document.querySelector('[data-js="like-media"]')
const buttonBookmarkMedia = document.querySelector('[data-js="bookmark-media"]')
const buttonProfile = document.querySelector('[data-button="profile"]')
const buttonLogin = document.querySelector('[data-button="login"]')
const buttonLogout = document.querySelector('[data-button="logout"]')
const buttonHome = document.querySelector('[data-button="home"]')
const buttonShowLikes = document.querySelector('[data-button="show-likes"]')
const buttonShowBookmarks = document.querySelector('[data-button="show-bookmarks"]')
const offcanvas = document.querySelector('[data-js="offcanvas"]')
const offcanvasPopup = document.querySelector('[data-js="offcanvas-popup"]')
const buttonShowActivity = document.querySelector('[data-button="show-activity"]')
const mediaButtons = document.querySelector('[data-js="media-buttons"]')
const pageButtons = document.querySelector('[data-js="page-buttons"]')
const buttonDecrementPageId = document.querySelector('[data-button="decrement-page"]')
const displayCurrentPage = document.querySelector('[data-js="current-page"]')
const buttonIncrementPageId = document.querySelector('[data-button="increment-page"]')
const filterContainer = document.querySelector('[data-js="sort-container"]')
const imageFilter = document.querySelector('[data-js="image-sorter"]')

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
  mediaLi.classList.add('custom')

  const mediaContainer = document.createElement('img')
  mediaContainer.src = preview_url
  mediaContainer.classList.add('clickable')
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

const getFetchUrl = (tagsToBeSearched, pageId = 0) => {
  const baseUrl =
    'https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&json=1&limit=52'
  return `${baseUrl}&tags=${tagsToBeSearched}&pid=${pageId}`
}

const fetchMedia = async tagsToBeSearched => {
  const response = await fetch(getFetchUrl(tagsToBeSearched))
  return await response.json()
}

const hideMediaFilter = () => filterContainer.classList.add('hide')
const clearMediaList = () => ulMedia.innerHTML = ''
const resetPageId = () => displayCurrentPage.textContent = '1'
const hidePageNavigationButtons = () => pageButtons.classList.remove('hide')

const handleFormFetchSubmit = async e => {
  e.preventDefault()

  const tagsToBeSearched = e.target.tags.value.split(' ').join('+')
  const media = await fetchMedia(tagsToBeSearched)

  hideMediaFilter()
  clearMediaList()
  resetPageId()
  hidePageNavigationButtons()
  renderMediaLis(media)
}

const checkClickedMedia = async id => {
  const mediaRef = doc(db, 'media', id)
  const mediaSnapshot = await getDoc(mediaRef)

  /* Deixei dessa forma pois parece o mais simples no momento para mim. */
  const { bookmark: isMediaBookmarked = false, like: isMediaLiked = false } =
    mediaSnapshot.exists() ? mediaSnapshot.data() : {}

  return { isMediaBookmarked, isMediaLiked }
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
    mediaEl.classList.add('video')
    return mediaEl
  }

  mediaEl.classList.add('media')
  return mediaEl
}

const manipulateClasses = (classToRemove, classToAdd, ...els) => {
  els.forEach(el => {
    el.classList.remove(classToRemove)
    el.classList.add(classToAdd)
  })
}

const handleButtonStyling = (button, isConditionTruthy, classToAddOrRemove) => {
  if (isConditionTruthy) {
    manipulateClasses(`bi-${classToAddOrRemove}`, `bi-${classToAddOrRemove}-fill`, button)
    return
  }

  manipulateClasses(`bi-${classToAddOrRemove}-fill`, `bi-${classToAddOrRemove}`, button)
}

const enlargeClickedMedia = (elTag, preview_url, dataMedia) => {
  const mediaEl = getMediaEl(elTag, preview_url, dataMedia)
  mediaContainer.append(mediaEl)
}

const showMediaPopup = () => mediaPopup.classList.remove('hide')

const handleOnMediaClick = async e => {
  const { src: preview_url, dataset: dataMedia } = e.target
  const { file_url: isClickedElementAMedia } = dataMedia

  if (!isClickedElementAMedia) {
    return
  }

  const { id, image } = dataMedia
  const { isMediaLiked, isMediaBookmarked } = await checkClickedMedia(id)
  const elTag = image.includes('.mp4') ? 'video' : 'img'

  handleButtonStyling(buttonLikeMedia, isMediaLiked, 'heart')
  handleButtonStyling(buttonBookmarkMedia, isMediaBookmarked, 'bookmark')
  enlargeClickedMedia(elTag, preview_url, dataMedia)
  showMediaPopup()
}

const removeMedia = () => {
  const media = document.querySelector('[data-js="media"]')
  media.src = ''
  media.remove()
}

const hideMediaPopup = () => mediaPopup.classList.add('hide')

const handleOnMediaPopupClick = e => {
  const dataClose = e.target.dataset.js

  if (dataClose === 'close-popup' || dataClose === 'x') {
    hideMediaPopup()
    removeMedia()
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

const dislikeMedia = async mediaRef =>
  await updateDoc(mediaRef, { like: deleteField() })

const isMediaDeletable = async mediaRef => {
  const isButtonBookmarkFilled =
    buttonBookmarkMedia.classList.contains('bi-bookmark-fill')

  if (!isButtonBookmarkFilled) {
    await deleteDoc(mediaRef)
  }
}

const handleButtonLikeMediaClick = async userid => {
  const media = document.querySelector('[data-js="media"]')
  const dataMedia = media.dataset
  const { id } = dataMedia
  const mediaRef = doc(db, 'media', id)
  const isButtonLikeFilled =
    buttonLikeMedia.classList.contains('bi-heart-fill')

  if (isButtonLikeFilled) {
    dislikeMedia(mediaRef)
    manipulateClasses('bi-heart-fill', 'bi-heart', buttonLikeMedia)
    isMediaDeletable(mediaRef)
    return
  }

  manipulateClasses('bi-heart', 'bi-heart-fill', buttonLikeMedia)
  likeMedia(mediaRef, userid, media.src, dataMedia)
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

const handleBookmarkMediaClick = async userid => {
  const media = document.querySelector('[data-js="media"]')
  const dataMedia = media.dataset
  const [{ id }, { src: file_url }] = [dataMedia, media]
  const mediaRef = doc(db, 'media', id)
  const isButtonBookmarkFilled =
    buttonBookmarkMedia.classList.contains('bi-bookmark-fill')

  if (isButtonBookmarkFilled) {
    unbookmarkMedia(mediaRef)
    manipulateClasses('bi-bookmark-fill', 'bi-bookmark', buttonBookmarkMedia)

    return
  }

  manipulateClasses('bi-bookmark', 'bi-bookmark-fill', buttonBookmarkMedia)
  bookmarkMedia(mediaRef, userid, file_url, dataMedia)
}

const login = async () => await signInWithPopup(auth, provider)

const handleOnButtonHomeClick = () => {
  hideMediaFilter()
  clearMediaList()
  hidePageNavigationButtons()
}

const showOffcanvas = () => {
  offcanvasPopup.classList.remove('hide')
  setTimeout(() => offcanvas.classList.add('show-offcanvas'), 100)
}

const hideOffcanvas = () => {
  offcanvas.classList.remove('show-offcanvas')
  setTimeout(() => offcanvasPopup.classList.add('hide'), 250)
}

const handleOffcanvasPopupClick = e => {
  const clickedElement = e.target
  const dataClickedElement = clickedElement.dataset.js

  if (dataClickedElement != 'offcanvas') {
    hideOffcanvas()
  }
}

const logout = async () => {
  await signOut(auth)
  hideOffcanvas()
  hideMediaFilter()
  clearMediaList()
}

const showMediaFilter = () => filterContainer.classList.remove('hide')

const getTagsOptions = tags => tags.split(' ').map((tag, index, array) =>
  index === array.length - 1 ?
    `<option>${tag}</option> ` :
    `<option>${tag}</option>`
).join(' ')

const getFilterOptions = tags => {
  const documentFragment = new DocumentFragment()
  documentFragment.append(getTagsOptions(tags))

  return documentFragment
}

const removeDuplicates = array =>
  array.filter((tag, index, array) => array.indexOf(tag) === index)
const fillFilterOptions = filteredTags =>
  imageFilter.innerHTML = `<option>none</option>${filteredTags}`
const getSortedOptions = tags =>
  removeDuplicates(getFilterOptions(tags).textContent.split(' ')).sort().join('')


const handleFilterOptions = docs => {
  const documentFragment = new DocumentFragment()

  docs.forEach(doc => {
    const { tags } = doc.data()
    documentFragment.append(getSortedOptions(tags))
  })

  fillFilterOptions(documentFragment.textContent)
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

const handleButtonShowActivityClick = async userid => {
  const queryPrivateMedia = query(collectionMedia, where('userid', '==', userid))
  const { docs } = await getDocs(queryPrivateMedia)

  clearMediaList()
  renderMediaLis(docs)
  showMediaFilter()
  handleFilterOptions(docs)
}

const showBookmarks = async userid => {
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

const updateCurrentPageId = () =>
  displayCurrentPage.textContent = state.getPageId() + 1
const handleButtonIncrementPage = () => fetchNextPage(state.incrementPageId())
const handleButtonDecrementPage = () => {
  const pageId = state.getPageId()

  if (pageId === 0) {
    return
  }

  fetchNextPage(state.decrementPageId())
}

const fetchNextPage = async pageId => {
  if (formFetchMedia.tags.value === '') {
    return
  }

  const tags = formFetchMedia.tags.value.split(' ').join('+')
  const response = await fetch(getFetchUrl(tags, pageId))
  const media = await response.json()

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
  manipulateClasses('d-block', 'hide', ...lisParentsToHide)
}

const showMediaLis = (lis, desiredTag) => {
  const lisParentsToShow = getLisParents(filterMedia(lis, desiredTag, true))
  manipulateClasses('hide', 'd-block', ...lisParentsToShow)
}

const handleMediaDisplay = (mediaLis, inputTag) => {
  hideMediaLis(mediaLis, inputTag)
  showMediaLis(mediaLis, inputTag)
}

const showAllLis = mediaLis => mediaLis.forEach(mediaItem =>
  mediaItem.parentElement.classList.remove('hide'))

const handleFilterInput = e => {
  const desiredTag = e.target.value
  const mediaLis = [...document.querySelectorAll('[data-tags]')]

  if (desiredTag === 'none') {
    showAllLis(mediaLis)
    return
  }

  handleMediaDisplay(mediaLis, desiredTag)
}

formFetchMedia.addEventListener('submit', handleFormFetchSubmit)
ulMedia.addEventListener('click', handleOnMediaClick)
mediaPopup.addEventListener('click', handleOnMediaPopupClick)
buttonHome.addEventListener('click', handleOnButtonHomeClick)
offcanvasPopup.addEventListener('click', handleOffcanvasPopupClick)
buttonIncrementPageId.addEventListener('click', handleButtonIncrementPage)
buttonDecrementPageId.addEventListener('click', handleButtonDecrementPage)

onAuthStateChanged(auth, user => {
  if (!user) {
    buttonLogin.classList.remove('hide')
    buttonProfile.classList.add('hide')
    mediaButtons.classList.add('hide')

    buttonLogin.addEventListener('click', login)
    imageFilter.removeEventListener('click', handleFilterInput)
    buttonProfile.removeEventListener('click', showOffcanvas)
    buttonLogout.removeEventListener('click', logout)
    buttonLikeMedia.onclick = ''
    buttonBookmarkMedia.onclick = ''
    buttonShowLikes.onclick = ''
    buttonShowBookmarks.onclick = ''
    buttonShowActivity.onlick = ''
    return
  }

  buttonLogin.classList.add('hide')
  buttonProfile.classList.remove('hide')
  mediaButtons.classList.remove('hide')

  buttonLogin.removeEventListener('click', login)
  imageFilter.addEventListener('input', handleFilterInput)
  buttonProfile.addEventListener('click', showOffcanvas)
  buttonLogout.addEventListener('click', logout)
  buttonLikeMedia.onclick = () => handleButtonLikeMediaClick(user.uid)
  buttonBookmarkMedia.onclick = () => handleBookmarkMediaClick(user.uid)
  buttonShowLikes.onclick = () => handleButtonShowLikesClick(user.uid)
  buttonShowBookmarks.onclick = () => showBookmarks(user.uid)
  buttonShowActivity.onclick = () => handleButtonShowActivityClick(user.uid)
})