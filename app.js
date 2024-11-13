const formSearchByTags = document.querySelector('[data-js="form-search-by-tags"')
const ulMedia = document.querySelector('[data-js="media"]')
const buttonClosePopup = document.querySelector('[data-js="button-close-popup"]')
const imagePopup = document.querySelector('[data-js="image-popup"]')
const imageContainer = document.querySelector('[data-js="image-container"]')

const obj = {}

imagePopup.addEventListener('click', e => {
  const dataClickedElement = e.target.dataset.js

  if(dataClickedElement != 'image-container') {
    imagePopup.classList.add('d-none')
  }
})

ulMedia.addEventListener('click', e => {
  const mediaClickedURL = e.target.dataset.js

  if (!mediaClickedURL) {
    return
  }

  imagePopup.classList.remove('d-none')
  imageContainer.src = `https://api-cdn.rule34.xxx/images/${mediaClickedURL}`
})

formSearchByTags.addEventListener('submit', async e => {
  e.preventDefault()

  const inputValue = e.target.tags.value.split(' ').join('+')

  const baseURL = 'https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&json=1&limit=52'
  const response = await fetch(`${baseURL}&tags=${inputValue}`)
  const media = await response.json()
  const documentFragment = document.createDocumentFragment()

  media.forEach(item => {
    const { preview_url: previewUrl, file_url: fileUrl, image } = item

    const liItem = document.createElement('li')
    liItem.setAttribute('class', 'd-flex justify-content-center test')

    const imgItem = document.createElement('img')
    imgItem.setAttribute('data-js', `${fileUrl.slice(fileUrl.indexOf('s/') + 2, fileUrl.length)}`)
    imgItem.src = previewUrl

    image.includes('.mp4') ? imgItem.classList.add('videoBorder') : imgItem.style.cursor = 'pointer'

    liItem.append(imgItem)
    documentFragment.append(liItem)
  })

  ulMedia.innerHTML = ''
  ulMedia.append(documentFragment)

  e.target.tags.focus()
})

/*
https://api-cdn.rule34.xxx/images/2201/8c62233a4bd7215a1322f5e36d7e203c.png
*/