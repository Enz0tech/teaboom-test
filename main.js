document.addEventListener('DOMContentLoaded', () => {
  // Нахожу форму
  const form = document.querySelector('.tea-card__order-form')
  if (!form) return

  // Элементы отображения цены над корзиной
  const mainCurrentPrice = document.getElementById('mainCurrentPrice')
  const mainOldPrice = document.getElementById('mainOldPrice')

  // Функция пересчёта всего вызывается при клике на вес, и при клике на +/-
  const updatePricesAndButtons = (quantityContainer) => {
    const minusBtn = quantityContainer.querySelector('.quantity__button--minus')
    const plusBtn = quantityContainer.querySelector('.quantity__button--plus')
    const input = quantityContainer.querySelector('.quantity__input')

    if (!minusBtn || !plusBtn || !input) return

    const min = parseInt(input.min) || 1
    const max = parseInt(input.max) || 99
    let value = parseInt(input.value) || min

    // 1. Доступность кнопок +/-
    minusBtn.disabled = (value <= min)
    plusBtn.disabled = (value >= max)

    // 2. Поиск выбранной радиокнопки
    const activeRadio = form.querySelector('input[name="weight"]:checked')
    if (!activeRadio) return

    // Нахожу родительский label выбранного веса
    const activeLabel = activeRadio.closest('.order-form__radio-label')
    if (!activeLabel) return

    const priceContainer = activeLabel.querySelector('.discount-price')
    const oldPriceContainer = activeLabel.querySelector('.old-price')

    // 3. Считаю и обновляю цены
    if (priceContainer && mainCurrentPrice) {
      const basePrice = parseFloat(priceContainer.getAttribute('data-base-price')) || 0
      let totalCurrentPrice = basePrice * value
      mainCurrentPrice.textContent = totalCurrentPrice.toLocaleString('ru-RU') + ' ₽'
    }

    if (oldPriceContainer && mainOldPrice) {
      // беру текст из элемента с атрибутом data-old-price, если его нет беру текст из тега del
      const oldPriceBase = parseFloat(activeRadio.getAttribute('data-old-price')) || parseFloat(oldPriceContainer.textContent) || 0
      let totalOldPrice = oldPriceBase * value
      mainOldPrice.textContent = totalOldPrice.toLocaleString('ru-RU') + ' ₽'
    }
  }

  // Блок с количеством товара
  form.querySelectorAll('.quantity').forEach(container => {
    const minusBtn = container.querySelector('.quantity__button--minus')
    const plusBtn = container.querySelector('.quantity__button--plus')
    const input = container.querySelector('.quantity__input')

    if (!minusBtn || !plusBtn || !input) return

    const min = parseInt(input.min) || 1
    const max = parseInt(input.max) || 99

    // Клик по минусу
    minusBtn.addEventListener('click', () => {
      let value = parseInt(input.value) || min
      if (value > min) {
        input.value = value - 1
        updatePricesAndButtons(container)
      }
    })

    // Клик по плюсу
    plusBtn.addEventListener('click', () => {
      let value = parseInt(input.value) || min
      if (value < max) {
        input.value = value + 1
        updatePricesAndButtons(container)
      }
    })

    // Ручной ввод количества
    input.addEventListener('change', () => {
      let value = parseInt(input.value)
      if (isNaN(value) || value < min) {
        input.value = min
      }
      else if (value > max) {
        input.value = max
      }
      updatePricesAndButtons(container)
    })

    // Стартовый запуск при загрузке страницы для настройки кнопок и цен конкретного контейнера
    updatePricesAndButtons(container)
  })

  // Выбор веса и пересчёт цены при изменении
  form.addEventListener('change', (event) => {
    if (event.target.name === 'weight') {
      // Когда пользователь меняет вес, нам нужно пересчитать цены с учетом текущего количества штук
      const quantityContainer = form.querySelector('.quantity')
      if (quantityContainer) {
        updatePricesAndButtons(quantityContainer)
      }
    }
  })

  //  Ajax отправка в корзину на сервер
  form.addEventListener('submit', async (event) => {
    // 1. Отменяю перезагрузку страницы браузером
    event.preventDefault()

    // Нахожу кнопку отправки, чтобы временно её заблокировать и поменять текст
    const submitBtn = form.querySelector('.order-form__submit-btn')
    if (!submitBtn) return

    // Сохраняю исходный текст кнопки, чтобы вернуть его позже
    const originalBtnText = submitBtn.textContent
    const formData = new FormData(form)

    try {
      // Визуализирую процесс пользователю
      submitBtn.disabled = true
      submitBtn.textContent = 'Добавление...'

      // Отправляю запрос на сервер
      const response = await fetch('/api/cart/add', {
        method: 'POST',
        body: formData // Отправка данных с формы
      })

      // Проверка, что сервер ответил успешно
      if (response.ok) {
        // Если успешно то меняется кнопка на зеленую галочку
        submitBtn.textContent = 'Добавлено! ✔️'
        submitBtn.style.backgroundColor = 'var(--color-green, #28a745)'
        submitBtn.style.borderColor = 'var(--color-green, #28a745)'

        // Через 2 секунды возвращаю кнопке исходный вид
        setTimeout(() => {
          submitBtn.disabled = false
          submitBtn.textContent = originalBtnText
          submitBtn.style.backgroundColor = '' // сброс до стилей из CSS
          submitBtn.style.borderColor = ''
        }, 2000)

      } else {
        throw new Error('Ошибка сервера') // Иначе ошибка, прокидываю её через кэтч
      }

    } catch (error) {
      // Ошибка, например пропал интернет или упал сервер
      console.error('Не удалось добавить товар:', error)
      submitBtn.textContent = 'Ошибка ❌'
      
      setTimeout(() => {
        submitBtn.disabled = false
        submitBtn.textContent = originalBtnText
      }, 2000)
    }
  })
})
