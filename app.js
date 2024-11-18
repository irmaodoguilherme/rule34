import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js';
import { getFirestore, collection, addDoc, getDoc, getDocs, doc, query, where } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js'

const ulMedia = document.querySelector('[data-js="media-list"]')
const mediaPopup = document.querySelector('[data-js="media-popup"]')
const mediaContainer = document.querySelector('[data-js="media-container"]')
const formFetchMedia = document.querySelector('[data-js="form-search"]')
const buttonDownload = document.querySelector('[data-js="download-media"]')
const buttonLikeMedia = document.querySelector('[data-js="like-media"]')
const buttonBookmarkMedia = document.querySelector('[data-js="bookmark-media"]')
const buttonProfile = document.querySelector('[data-button="profile"]')
const buttonHome = document.querySelector('[data-button="home"]')

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

formFetchMedia.addEventListener('submit', async e => {
  e.preventDefault()

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

    if(media.image.includes('mp4')) {
      mediaImg.classList.add('video-outline')
    }

    mediaLi.append(mediaImg)
    documentFragment.append(mediaLi)
  })

  ulMedia.innerHTML = ''
  ulMedia.append(documentFragment)
})

ulMedia.addEventListener('click', e => {
  const dataMedia = e.target.dataset

  if (!dataMedia.fileurl) {
    return
  }

  const [mediaPreviewUrl, mediaFileUrl, mediaId, mediaOwner, mediaTags, mediaImage] =
    [e.target.src, dataMedia.fileurl, dataMedia.id, dataMedia.owner, dataMedia.tags, dataMedia.image]

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
  buttonDownload.href = dataMedia

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

// buttonClosePopup.addEventListener('click', () => {
//   const media = document.querySelector('[data-js="media"]')

//   mediaPopup.classList.add('hide')

//   if (media) {
//     media.remove()
//   }
// })

buttonLikeMedia.addEventListener('click', async () => {
  const media = document.querySelector('[data-js="media"]')
  const dataMedia = media.dataset
  const [mediaFileUrl, mediaPreviewUrl, mediaId, mediaOwner, mediaTags, mediaImage] =
    [media.src, dataMedia.previewurl, dataMedia.id, dataMedia.owner, dataMedia.tags, dataMedia.image]

  buttonLikeMedia.classList.toggle('bi-heart')
  buttonLikeMedia.classList.toggle('bi-heart-fill')

  await addDoc(collectionMedia, {
    fileUrl: mediaFileUrl,
    previewurl: mediaPreviewUrl,
    id: mediaId,
    owner: mediaOwner,
    tags: mediaTags,
    image: mediaImage
  })
})

buttonBookmarkMedia.addEventListener('click', () => {
  buttonBookmarkMedia.classList.toggle('bi-bookmark')
  buttonBookmarkMedia.classList.toggle('bi-bookmark-fill')
})

buttonProfile.addEventListener('click', async () => {
  ulMedia.innerHTML = ''

  const x = await getDocs(query(collectionMedia, where('image', '!=', false)))
  const documentFragment = new DocumentFragment()

  x.docs.forEach(doc => {
    const { fileUrl, id, owner, previewurl, tags, image } = doc.data()
    
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

    if(image.includes('.mp4')) {
      mediaImg.classList.add('video-outline')
    }
  
    mediaLi.append(mediaImg)
    documentFragment.append(mediaLi)
  })

  // const docData = (await getDoc(doc(db, "media", 'iIVyPRPj1x7CcUrLTbdS'))).data()

  ulMedia.append(documentFragment)
})

buttonHome.addEventListener('click', async () => {
  ulMedia.innerHTML = ''
})

/* https://api-cdn.rule34.xxx/images/2201/8c62233a4bd7215a1322f5e36d7e203c.png */