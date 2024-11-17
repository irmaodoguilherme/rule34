import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js';
import { getFirestore, collection, addDoc } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js'

const ulMedia = document.querySelector('[data-js="media-list"]')
const mediaPopup = document.querySelector('[data-js="media-popup"]')
const mediaContainer = document.querySelector('[data-js="media-container"]')
// const formFetchMedia = document.querySelector('[data-js="form-fetch-media"]')
const buttonDownload = document.querySelector('[data-js="download-media"]')
const buttonLikeMedia = document.querySelector('[data-js="like-media"]')
const buttonBookmarkMedia = document.querySelector('[data-js="bookmark-media"]')

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

// formFetchMedia.addEventListener('submit', async e => {
//   e.preventDefault()

//   const tags = e.target.tags.value.split(' ').join('+')
//   const response = await fetch(`https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&json=1&limit=52&tags=${tags}`)
//   const fetchedMedia = await response.json()
//   const documentFragment = new DocumentFragment()

//   fetchedMedia.forEach(media => {
//     const mediaLi = document.createElement('li')
//     mediaLi.classList.add('custom')

//     const mediaImg = document.createElement('img')
//     mediaImg.src = media.preview_url
//     mediaImg.classList.add('clickable')
//     mediaImg.setAttribute('data-mediaUrl', media.file_url)

//     mediaLi.append(mediaImg)
//     documentFragment.append(mediaLi)
//   })

//   ulMedia.innerHTML = ''
//   ulMedia.append(documentFragment)
// })

const fetchMedia = async e => {
  e.preventDefault()

  const tags =  e.target.tags.value.split(' ').join('+')
  const response = await fetch(`https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&json=1&limit=52&tags=${tags}`)
  const fetchedMedia = await response.json()
  const documentFragment = new DocumentFragment()

  fetchedMedia.forEach(media => {
    const mediaLi = document.createElement('li')
    mediaLi.classList.add('custom')

    const mediaImg = document.createElement('img')
    mediaImg.src = media.preview_url
    mediaImg.classList.add('clickable')
    mediaImg.setAttribute('data-mediaUrl', media.file_url)

    mediaLi.append(mediaImg)
    documentFragment.append(mediaLi)
  })

  ulMedia.innerHTML = ''
  ulMedia.append(documentFragment)
}

ulMedia.addEventListener('click', e => {
  const dataMedia = e.target.dataset.mediaurl

  if (!dataMedia) {
    return
  }

  const mediaImg = document.createElement('img')
  mediaImg.src = dataMedia
  mediaImg.classList.add('media')
  mediaImg.setAttribute('data-js', 'media')
  buttonDownload.href = dataMedia

  mediaContainer.append(mediaImg)
  mediaPopup.classList.remove('hide')
})

mediaPopup.addEventListener('click', e => {
  const dataClose = e.target.dataset.js

  if (dataClose === 'close-popup' || dataClose === undefined) {
    const media = document.querySelector('[data-js="media"]')

    mediaPopup.classList.add('hide')
    media.remove()
  }
})

// buttonClosePopup.addEventListener('click', () => {
//   const media = document.querySelector('[data-js="media"]')

//   mediaPopup.classList.add('hide')

//   if (media) {
//     media.remove()
//   }
// })

buttonLikeMedia.addEventListener('click', async () => {
  const media = document.querySelector('[data-js="media"]')
  const mediaUrl = media.src

  buttonLikeMedia.classList.toggle('bi-heart')
  buttonLikeMedia.classList.toggle('bi-heart-fill')

  await addDoc(collectionMedia, {
    fileUrl: mediaUrl
  })
})

buttonBookmarkMedia.addEventListener('click', () => {
  buttonBookmarkMedia.classList.toggle('bi-bookmark')
  buttonBookmarkMedia.classList.toggle('bi-bookmark-fill')
})

/*  */

const buttonSearch = document.querySelector('[data-button="search"]')

const getSearchButton = () => {
  const liButton = document.createElement('li')
  liButton.setAttribute('class', 'button-container search-button-container')
  liButton.setAttribute('data-button', 'search')

  const searchIcon = document.createElement('i')
  searchIcon.setAttribute('class', 'nav-bar-button bi bi-search search-button')

  const iconLabel = document.createElement('p')
  iconLabel.setAttribute('class', 'nav-bar-label search-button-labe')
  iconLabel.textContent = 'Search'

  liButton.append(searchIcon, iconLabel)
  return liButton
}

const handleInputSearchBlur = () => {
  const firstNavBarButton = document.querySelector('.button-container')
  const formSearch = document.querySelector('[data-js="form-search"]')
  const searchButton = getSearchButton()

  formSearch.remove()
  searchButton.addEventListener('click', handleSearchButtonClick)
  firstNavBarButton.insertAdjacentElement('afterend', searchButton)
}

const getFormAndSearch = () => {
  const formSearch = document.createElement('form')
  formSearch.classList.add('form-search')
  formSearch.setAttribute('data-js', 'form-search')

  const inputSearch = document.createElement('input')
  inputSearch.placeholder = 'Search'
  inputSearch.classList.add('input-search')
  inputSearch.setAttribute('name', 'tags')

  formSearch.append(inputSearch)

  return [formSearch, inputSearch]
}

const handleSearchButtonClick = () => {
  const firstNavBarButton = document.querySelector('.button-container')
  const buttonSearch = document.querySelector('[data-button="search"]')
  const [formSearch, inputSearch] = getFormAndSearch()

  buttonSearch.remove()
  inputSearch.addEventListener('blur', handleInputSearchBlur)
  formSearch.addEventListener('submit', fetchMedia)
  firstNavBarButton.insertAdjacentElement('afterend', formSearch)
  inputSearch.focus()
}

buttonSearch.addEventListener('click', handleSearchButtonClick)

/* https://api-cdn.rule34.xxx/images/2201/8c62233a4bd7215a1322f5e36d7e203c.png */