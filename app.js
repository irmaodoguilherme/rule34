import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js';
import { getFirestore, collection, addDoc, setDoc, deleteDoc, updateDoc, deleteField, getDoc, getDocs, doc, query, where, serverTimestamp } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js'
import { GoogleAuthProvider, getAuth, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js"

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
const buttonDecrementPage = document.querySelector('[data-button="decrement-page"]')
const displayCurrentPage = document.querySelector('[data-js="current-page"]')
const buttonIncrementPage = document.querySelector('[data-button="increment-page"]')
const sortContainer = document.querySelector('[data-js="sort-container"]')
const imageSorter = document.querySelector('[data-js="image-sorter"]')

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

formFetchMedia.addEventListener('submit', async e => {
  e.preventDefault()

  sortContainer.classList.add('hide')
  const tags = e.target.tags.value.split(' ').join('+')
  const response = await fetch(`https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&json=1&limit=52&tags=${tags}`)
  const fetchedMedia = await response.json()
  const documentFragment = new DocumentFragment()

  fetchedMedia.forEach(media => {
    const mediaLi = document.createElement('li')
    mediaLi.classList.add('custom')

    const mediaImg = document.createElement('img')
    mediaImg.src = media.preview_url
    mediaImg.classList.add('clickable')
    mediaImg.setAttribute('data-fileUrl', media.file_url)
    mediaImg.setAttribute('data-Id', media.id)
    mediaImg.setAttribute('data-Owner', media.owner)
    mediaImg.setAttribute('data-Tags', media.tags)
    mediaImg.setAttribute('data-image', media.image)

    if (media.image.includes('mp4')) {
      mediaImg.classList.add('video-outline')
    }

    mediaLi.append(mediaImg)
    documentFragment.append(mediaLi)
  })

  ulMedia.innerHTML = ''
  pageButtons.classList.remove('hide')
  ulMedia.append(documentFragment)
})

ulMedia.addEventListener('click', async e => {
  const dataMedia = e.target.dataset

  if (!dataMedia.fileurl) {
    return
  }

  const [mediaPreviewUrl, mediaFileUrl, mediaId, mediaOwner, mediaTags, mediaImage] =
    [e.target.src, dataMedia.fileurl, dataMedia.id, dataMedia.owner, dataMedia.tags, dataMedia.image]

  const mediaRef = doc(db, 'media', mediaId)
  const mediaSnapshot = await getDoc(mediaRef)

  /* Deixei dessa forma pois parece o mais simples no momento para mim. */
  const { bookmark: isMediaBookmarked = false, like: isMediaLiked = false } =
    mediaSnapshot.exists() ? mediaSnapshot.data() : {}

  if (isMediaLiked) {
    buttonLikeMedia.classList.remove('bi-heart')
    buttonLikeMedia.classList.add('bi-heart-fill')
  } else {
    buttonLikeMedia.classList.remove('bi-heart-fill')
    buttonLikeMedia.classList.add('bi-heart')
  }

  if (isMediaBookmarked) {
    buttonBookmarkMedia.classList.remove('bi-bookmark')
    buttonBookmarkMedia.classList.add('bi-bookmark-fill')
  } else {
    buttonBookmarkMedia.classList.remove('bi-bookmark-fill')
    buttonBookmarkMedia.classList.add('bi-bookmark')
  }

  if (mediaImage.includes('.mp4')) {
    const mediaVideo = document.createElement('video')
    mediaVideo.setAttribute('controls', '')
    mediaVideo.setAttribute('data-js', 'media')
    mediaVideo.setAttribute('data-previewUrl', mediaPreviewUrl)
    mediaVideo.setAttribute('data-Id', mediaId)
    mediaVideo.setAttribute('data-Owner', mediaOwner)
    mediaVideo.setAttribute('data-Tags', mediaTags)
    mediaVideo.setAttribute('data-image', mediaImage)
    mediaVideo.classList.add('video')
    mediaVideo.src = mediaFileUrl

    mediaContainer.append(mediaVideo)
    mediaPopup.classList.remove('hide')
    return
  }

  const mediaImg = document.createElement('img')
  mediaImg.classList.add('media')
  mediaImg.src = mediaFileUrl
  mediaImg.setAttribute('data-js', 'media')
  mediaImg.setAttribute('data-previewUrl', mediaPreviewUrl)
  mediaImg.setAttribute('data-Id', mediaId)
  mediaImg.setAttribute('data-Owner', mediaOwner)
  mediaImg.setAttribute('data-Tags', mediaTags)
  mediaImg.setAttribute('data-Image', mediaImage)
  buttonDownload.href = mediaFileUrl

  mediaContainer.append(mediaImg)
  mediaPopup.classList.remove('hide')
})

mediaPopup.addEventListener('click', e => {
  const dataClose = e.target.dataset.js

  if (dataClose === 'close-popup' || dataClose === 'x') {
    const media = document.querySelector('[data-js="media"]')

    mediaPopup.classList.add('hide')
    media.src = ''
    media.remove()
  }
})

const likeMedia = async userid => {
  const media = document.querySelector('[data-js="media"]')
  const isButtonLikeClicked = buttonLikeMedia.classList.contains('bi-heart-fill')
  const dataMedia = media.dataset
  const [mediaFileUrl, mediaPreviewUrl, mediaId, mediaOwner, mediaTags, mediaImage] =
    [media.src, dataMedia.previewurl, dataMedia.id, dataMedia.owner, dataMedia.tags, dataMedia.image]
  const mediaRef = doc(db, 'media', mediaId)

  if (isButtonLikeClicked) {
    await updateDoc(mediaRef, { like: deleteField() })

    buttonLikeMedia.classList.remove('bi-heart-fill')
    buttonLikeMedia.classList.add('bi-heart');
    return
  }

  buttonLikeMedia.classList.remove('bi-heart')
  buttonLikeMedia.classList.add('bi-heart-fill')

  await setDoc(mediaRef, {
    fileUrl: mediaFileUrl,
    previewurl: mediaPreviewUrl,
    id: mediaId,
    owner: mediaOwner,
    tags: mediaTags,
    image: mediaImage,
    time: serverTimestamp(),
    like: true,
    userid
  }, { merge: true })
}

const bookmarkMedia = async userid => {
  const media = document.querySelector('[data-js="media"]')
  const dataMedia = media.dataset
  const [mediaFileUrl, mediaPreviewUrl, mediaId, mediaOwner, mediaTags, mediaImage] =
    [media.src, dataMedia.previewurl, dataMedia.id, dataMedia.owner, dataMedia.tags, dataMedia.image]
  const mediaRef = doc(db, 'media', mediaId)
  const isButtonBookmarkClicked = buttonBookmarkMedia.classList.contains('bi-bookmark-fill')

  if (isButtonBookmarkClicked) {
    await updateDoc(mediaRef, { bookmark: deleteField() })

    buttonBookmarkMedia.classList.remove('bi-bookmark-fill')
    buttonBookmarkMedia.classList.add('bi-bookmark');
    return
  }

  buttonBookmarkMedia.classList.toggle('bi-bookmark')
  buttonBookmarkMedia.classList.toggle('bi-bookmark-fill')

  await setDoc(mediaRef, {
    fileUrl: mediaFileUrl,
    previewurl: mediaPreviewUrl,
    id: mediaId,
    owner: mediaOwner,
    tags: mediaTags,
    image: mediaImage,
    time: serverTimestamp(),
    bookmark: true,
    userid
  }, { merge: true })
}

buttonLogin.addEventListener('click', async () => await signInWithPopup(auth, provider))

buttonHome.addEventListener('click', async () => {
  sortContainer.classList.add('hide')
  ulMedia.innerHTML = ''
})

buttonProfile.addEventListener('click', () => {
  offcanvasPopup.classList.remove('hide')
  setTimeout(() => offcanvas.classList.add('show-offcanvas'), 100)
})

offcanvasPopup.addEventListener('click', e => {
  const clickedElement = e.target
  const dataClickedElement = clickedElement.dataset.js

  if (dataClickedElement != 'offcanvas') {
    offcanvas.classList.remove('show-offcanvas')
    setTimeout(() => offcanvasPopup.classList.add('hide'), 250)
  }
})

buttonLogout.addEventListener('click', async () => {
  await signOut(auth)
  offcanvas.classList.remove('show-offcanvas')
  setTimeout(() => offcanvasPopup.classList.add('hide'), 250)
})

buttonShowLikes.addEventListener('click', async () => {
  sortContainer.classList.remove('hide')
  ulMedia.innerHTML = ''
  const likedMedia = await getDocs(query(collectionMedia, where('like', '!=', false)))
  const documentFragment = new DocumentFragment()
  const documentFragment2 = new DocumentFragment()
  likedMedia.docs.forEach(doc => {
    const { fileUrl, id, owner, previewurl, tags, image, time, like, bookmark } = doc.data()

    const mediaLi = document.createElement('li')
    mediaLi.classList.add('custom')


    const mediaImg = document.createElement('img')
    mediaImg.src = previewurl
    mediaImg.classList.add('clickable')
    mediaImg.setAttribute('data-fileUrl', fileUrl)
    mediaImg.setAttribute('data-Id', id)
    mediaImg.setAttribute('data-Owner', owner)
    mediaImg.setAttribute('data-Tags', tags)
    mediaImg.setAttribute('data-image', image)
    mediaImg.setAttribute('data-time', time)
    mediaImg.setAttribute('data-like', like)
    mediaImg.setAttribute('data-bookmark', bookmark)

    const tagsTemplateString = tags.split(' ').map((tag, index, array) => {
      if (index === array.length - 1) {
        return `<option>${tag}</option> `
      }

      return `<option>${tag}</option>`
    }).join(' ')

    if (image.includes('.mp4')) {
      mediaImg.classList.add('video-outline')
    }

    mediaLi.append(mediaImg)
    documentFragment.append(mediaLi)
    documentFragment2.append(tagsTemplateString)
  })

  ulMedia.append(documentFragment)
})

buttonShowActivity.addEventListener('click', async () => {
  sortContainer.classList.remove('hide')
  ulMedia.innerHTML = ''
  const activity = await getDocs(collectionMedia)
  const documentFragment = new DocumentFragment()
  activity.docs.forEach(doc => {
    const { fileUrl, id, owner, previewurl, tags, image, time, like, bookmark } = doc.data()

    const mediaLi = document.createElement('li')
    mediaLi.classList.add('custom')

    const mediaImg = document.createElement('img')
    mediaImg.src = previewurl
    mediaImg.classList.add('clickable')
    mediaImg.setAttribute('data-fileUrl', fileUrl)
    mediaImg.setAttribute('data-Id', id)
    mediaImg.setAttribute('data-Owner', owner)
    mediaImg.setAttribute('data-Tags', tags)
    mediaImg.setAttribute('data-image', image)
    mediaImg.setAttribute('data-time', time)
    mediaImg.setAttribute('data-like', like)
    mediaImg.setAttribute('data-bookmark', bookmark)

    if (image.includes('.mp4')) {
      mediaImg.classList.add('video-outline')
    }

    mediaLi.append(mediaImg)
    documentFragment.append(mediaLi)
  })

  ulMedia.append(documentFragment)
})

buttonShowBookmarks.addEventListener('click', async () => {
  sortContainer.classList.remove('hide')
  ulMedia.innerHTML = ''
  const bookmarks = await getDocs(query(collectionMedia, where('bookmark', '!=', false)))
  const documentFragment = new DocumentFragment()
  const documentFragment2 = new DocumentFragment()
  bookmarks.docs.forEach(doc => {
    const { fileUrl, id, owner, previewurl, tags, image, time, like, bookmark } = doc.data()
    const mediaLi = document.createElement('li')
    mediaLi.classList.add('custom')

    const mediaImg = document.createElement('img')
    mediaImg.src = previewurl
    mediaImg.classList.add('clickable')
    mediaImg.setAttribute('data-fileUrl', fileUrl)
    mediaImg.setAttribute('data-Id', id)
    mediaImg.setAttribute('data-Owner', owner)
    mediaImg.setAttribute('data-Tags', tags)
    mediaImg.setAttribute('data-image', image)
    mediaImg.setAttribute('data-time', time)
    mediaImg.setAttribute('data-like', like)
    mediaImg.setAttribute('data-bookmark', bookmark)

    const tagsTemplateString = tags.split(' ').map((tag, index, array) => {
      if (index === array.length - 1) {
        return `<option>${tag}</option> `
      }

      return `<option>${tag}</option>`
    }).join(' ')

    if (image.includes('.mp4')) {
      mediaImg.classList.add('video-outline')
    }

    mediaLi.append(mediaImg)
    documentFragment.append(mediaLi)
    documentFragment2.append(tagsTemplateString)
  })

  const filteredTags = documentFragment2.textContent.split(' ').filter((tag, index, array) => array.indexOf(tag) === index).sort().join('')

  imageSorter.innerHTML = `<option>none</option>${filteredTags}`
  ulMedia.append(documentFragment)
})

const state = (() => {
  let pageId = 0

  return {
    getPageId: () => pageId,
    incrementPageId: () => ++pageId,
    decrementPageId: () => --pageId
  }
})()

buttonDecrementPage.addEventListener('click', async () => {
  const pageId = state.getPageId()

  if (formFetchMedia.tags.value === '') {
    return
  }

  if (pageId === 0) {
    return
  }

  const tags = formFetchMedia.tags.value.split(' ').join('+')
  const response = await fetch(`https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&json=1&limit=52&tags=${tags}&pid=${state.decrementPageId()}`)
  const fetchedMedia = await response.json()
  const documentFragment = new DocumentFragment()

  fetchedMedia.forEach(media => {
    const mediaLi = document.createElement('li')
    mediaLi.classList.add('custom')

    const mediaImg = document.createElement('img')
    mediaImg.src = media.preview_url
    mediaImg.classList.add('clickable')
    mediaImg.setAttribute('data-fileUrl', media.file_url)
    mediaImg.setAttribute('data-Id', media.id)
    mediaImg.setAttribute('data-Owner', media.owner)
    mediaImg.setAttribute('data-Tags', media.tags)
    mediaImg.setAttribute('data-image', media.image)

    if (media.image.includes('mp4')) {
      mediaImg.classList.add('video-outline')
    }

    mediaLi.append(mediaImg)
    documentFragment.append(mediaLi)
  })

  ulMedia.innerHTML = ''
  displayCurrentPage.textContent = state.getPageId() + 1
  ulMedia.append(documentFragment)
})

buttonIncrementPage.addEventListener('click', async () => {
  if (formFetchMedia.tags.value === '') {
    return
  }

  const tags = formFetchMedia.tags.value.split(' ').join('+')
  const response = await fetch(`https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&json=1&limit=52&tags=${tags}&pid=${state.incrementPageId()}`) // 1
  const fetchedMedia = await response.json()
  const documentFragment = new DocumentFragment()

  fetchedMedia.forEach(media => {
    const mediaLi = document.createElement('li')
    mediaLi.classList.add('custom')

    const mediaImg = document.createElement('img')
    mediaImg.src = media.preview_url
    mediaImg.classList.add('clickable')
    mediaImg.setAttribute('data-fileUrl', media.file_url)
    mediaImg.setAttribute('data-Id', media.id)
    mediaImg.setAttribute('data-Owner', media.owner)
    mediaImg.setAttribute('data-Tags', media.tags)
    mediaImg.setAttribute('data-image', media.image)

    if (media.image.includes('mp4')) {
      mediaImg.classList.add('video-outline')
    }

    mediaLi.append(mediaImg)
    documentFragment.append(mediaLi)
  })

  ulMedia.innerHTML = ''
  displayCurrentPage.textContent = state.getPageId() + 1
  ulMedia.append(documentFragment)
})

imageSorter.addEventListener('input', e => {
  const desiredTag = e.target.value

  if (desiredTag === 'none') {
    const images = [...document.querySelectorAll('[data-tags]')]
    images.forEach(image => image.parentElement.classList.remove('hide'))
    return
  }

  const images = [...document.querySelectorAll('[data-tags]')]
  const imagesWithDesiredTag = images.filter(image => {
    if (!image.dataset.tags.includes(desiredTag)) {
      return image
    }
  })

  images.forEach(image => image.parentElement.classList.remove('hide'))
  imagesWithDesiredTag.forEach(image => image.parentElement.classList.add('hide'))
})

onAuthStateChanged(auth, user => {
  if (!user) {
    buttonLogin.classList.remove('hide')
    buttonProfile.classList.add('hide')
    mediaButtons.classList.add('hide')
    buttonLikeMedia.onclick = ''
    buttonBookmarkMedia.onclick = ''
    return
  }

  buttonLogin.classList.add('hide')
  buttonProfile.classList.remove('hide')
  mediaButtons.classList.remove('hide')
  buttonLikeMedia.onclick = () => likeMedia(user.uid)
  buttonBookmarkMedia.onclick = () => bookmarkMedia(user.uid)
})

/* https://api-cdn.rule34.xxx/images/2201/8c62233a4bd7215a1322f5e36d7e203c.png */