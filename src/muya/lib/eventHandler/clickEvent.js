import { operateClassName } from '../utils/domManipulate'
import { getImageInfo } from '../utils/checkEditImage'
import { CLASS_OR_ID } from '../config'
import selection from '../selection'

class ClickEvent {
  constructor (muya) {
    this.muya = muya
    this.clickBinding()
    this.contextClickBingding()
  }

  contextClickBingding () {
    const { container, eventCenter, contentState } = this.muya
    const handler = event => {
      event.preventDefault()
      event.stopPropagation()

      // Hide format box
      eventCenter.dispatch('muya-format-picker', { reference: null })

      const { start, end } = selection.getCursorRange()

      // Cursor out of editor
      if (!start || !end) {
        return
      }

      // Commit native cursor position because right-clicking doesn't update the cursor postion.
      contentState.cursor = {
        start,
        end
      }

      const sectionChanges = contentState.selectionChange(contentState.cursor)
      eventCenter.dispatch('contextmenu', event, sectionChanges)
    }
    eventCenter.attachDOMEvent(container, 'contextmenu', handler)
  }

  clickBinding () {
    const { container, eventCenter, contentState } = this.muya
    const handler = event => {
      const { target } = event
      // handler table click
      const toolItem = getToolItem(target)
      contentState.selectedImage = null
      if (toolItem) {
        event.preventDefault()
        event.stopPropagation()
        const type = toolItem.getAttribute('data-label')
        const grandPa = toolItem.parentNode.parentNode
        if (grandPa.classList.contains('ag-tool-table')) {
          contentState.tableToolBarClick(type)
        }
      }
      // handler image and inline math preview click
      const markedImageText = target.previousElementSibling
      const mathRender = target.closest(`.${CLASS_OR_ID['AG_MATH_RENDER']}`)
      const rubyRender = target.closest(`.${CLASS_OR_ID['AG_RUBY_RENDER']}`)
      const imageWrapper = target.closest(`.${CLASS_OR_ID['AG_INLINE_IMAGE']}`)
      const imageTurnInto = target.closest('.ag-image-icon-turninto')
      const imageDelete = target.closest('.ag-image-icon-delete')
      const mathText = mathRender && mathRender.previousElementSibling
      const rubyText = rubyRender && rubyRender.previousElementSibling
      if (markedImageText && markedImageText.classList.contains(CLASS_OR_ID['AG_IMAGE_MARKED_TEXT'])) {
        eventCenter.dispatch('format-click', {
          event,
          formatType: 'image',
          data: event.target.getAttribute('src')
        })
        selectionText(markedImageText)
      } else if (mathText) {
        selectionText(mathText)
      } else if (rubyText) {
        selectionText(rubyText)
      }
      // Handle delete inline iamge by click delete icon.
      if (imageDelete && imageWrapper) {
        const imageInfo = getImageInfo(imageWrapper)
        event.preventDefault()
        event.stopPropagation()
        return contentState.deleteImage(imageInfo)
      }

      // Handle image click, to select the current image
      if (target.tagName === 'IMG' && imageWrapper) {
        // Handle select image
        const imageInfo = getImageInfo(imageWrapper)
        event.preventDefault()
        return contentState.selectImage(imageInfo)
      }

      // Handle click imagewrapper when it's empty or image load failed.
      if (
        (imageTurnInto && imageWrapper) ||
        (imageWrapper &&
        (
          imageWrapper.classList.contains('ag-empty-image') ||
          imageWrapper.classList.contains('ag-image-fail')
        ))
      ) {
        const rect = imageWrapper.getBoundingClientRect()
        const reference = {
          getBoundingClientRect () {
            if (imageTurnInto) {
              rect.height = 0
            }
            return rect
          }
        }
        const imageInfo = getImageInfo(imageWrapper)
        console.log(imageInfo)
        eventCenter.dispatch('muya-image-selector', {
          reference,
          imageInfo,
          cb: () => {}
        })
        event.preventDefault()
        return event.stopPropagation()
      }
      if (target.closest('div.ag-container-preview') || target.closest('div.ag-html-preview')) {
        return event.stopPropagation()
      }
      // handler container preview click
      const editIcon = target.closest(`.ag-container-icon`)
      if (editIcon) {
        event.preventDefault()
        event.stopPropagation()
        if (editIcon.parentNode.classList.contains('ag-container-block')) {
          contentState.handleContainerBlockClick(editIcon.parentNode)
        }
      }

      // handler to-do checkbox click
      if (target.tagName === 'INPUT' && target.classList.contains(CLASS_OR_ID['AG_TASK_LIST_ITEM_CHECKBOX'])) {
        contentState.listItemCheckBoxClick(target)
      }
      contentState.clickHandler(event)
    }

    eventCenter.attachDOMEvent(container, 'click', handler)
  }
}

function getToolItem (target) {
  return target.closest('[data-label]')
}

function selectionText (node) {
  const textLen = node.textContent.length
  operateClassName(node, 'remove', CLASS_OR_ID['AG_HIDE'])
  operateClassName(node, 'add', CLASS_OR_ID['AG_GRAY'])
  selection.importSelection({
    start: textLen,
    end: textLen
  }, node)
}

export default ClickEvent
